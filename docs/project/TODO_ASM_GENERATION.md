# TODO: ASM Generation for StateMachine & HUD

## 📋 Overview

Este documento detalla las tareas pendientes de implementación ASM para completar la paridad entre **modo Play (JavaScript)** y **ROM exportado (MSX Z80 ASM)**.

**Última actualización:** 2025-10-10

---

## ⏳ **Tareas Pendientes**

### 1. 🔴 **StateMachine Actions ASM Generation** (Alta Prioridad)

**Estado:** NO implementado

**Descripción:**
Generar código Z80 Assembly para las **Actions** configuradas en transiciones de StateMachine.

**Acciones a implementar:**
- `SET_VARIABLE` - Asignar valor a GlobalVariable
- `INCREMENT_VARIABLE` - Incrementar valor numérico
- `DECREMENT_VARIABLE` - Decrementar valor numérico

**Archivos a modificar:**
- Crear: `utils/msxGenerator/generators/stateMachineActionsGenerator.ts`
- Modificar: `utils/msxGenerator/generators/mainGenerator.ts` (integrar actions)

**Código ASM esperado:**

```asm
; ============================================
; STATEMACHINE TRANSITION ACTIONS
; ============================================

; Transition: Playing -> GameOver
transition_playing_to_gameover:
    ; Action: SET_VARIABLE Goal = Completed
    ld a, GOAL_COMPLETED
    ld (global_var_goal), a

    ; Action: INCREMENT_VARIABLE Score += 100
    ld a, (global_var_score)
    add a, 100
    ld (global_var_score), a

    ; Action: DECREMENT_VARIABLE Lives -= 1
    ld a, (global_var_lives)
    dec a
    ld (global_var_lives), a

    ; Change to target state
    ld a, STATE_GAMEOVER
    ld (current_state), a
    ret
```

**Lógica de implementación:**

```typescript
// stateMachineActionsGenerator.ts

export function generateActionASM(action: Action, analysis: ProjectAnalysis): string {
  let code = '';

  switch (action.type) {
    case ActionTypes.SET_VARIABLE:
      const varName = action.params.variable;
      const value = action.params.value;

      // Find variable in globalVariables
      const globalVar = analysis.globalVariables.find(v => v.name === varName);

      if (globalVar) {
        // Get constant name for value
        const valueConstant = getConstantForValue(globalVar, value);

        code += `    ; Action: SET_VARIABLE ${varName} = ${value}\n`;
        code += `    ld a, ${valueConstant}\n`;
        code += `    ld (${globalVar.asmName}), a\n`;
      }
      break;

    case ActionTypes.INCREMENT_VARIABLE:
      const incVar = analysis.globalVariables.find(v => v.name === action.params.variable);
      const amount = action.params.amount || 1;

      if (incVar) {
        if (incVar.type === '16bit') {
          // 16-bit increment
          code += `    ; Action: INCREMENT_VARIABLE ${incVar.name} += ${amount}\n`;
          code += `    ld hl, (${incVar.asmName})\n`;
          code += `    ld de, ${amount}\n`;
          code += `    add hl, de\n`;
          code += `    ld (${incVar.asmName}), hl\n`;
        } else {
          // 8-bit increment
          code += `    ; Action: INCREMENT_VARIABLE ${incVar.name} += ${amount}\n`;
          code += `    ld a, (${incVar.asmName})\n`;
          code += `    add a, ${amount}\n`;
          code += `    ld (${incVar.asmName}), a\n`;
        }
      }
      break;

    case ActionTypes.DECREMENT_VARIABLE:
      const decVar = analysis.globalVariables.find(v => v.name === action.params.variable);
      const decAmount = action.params.amount || 1;

      if (decVar) {
        if (decVar.type === '16bit') {
          // 16-bit decrement
          code += `    ; Action: DECREMENT_VARIABLE ${decVar.name} -= ${decAmount}\n`;
          code += `    ld hl, (${decVar.asmName})\n`;
          code += `    ld de, ${decAmount}\n`;
          code += `    or a  ; Clear carry\n`;
          code += `    sbc hl, de\n`;
          code += `    ld (${decVar.asmName}), hl\n`;
        } else {
          // 8-bit decrement
          code += `    ; Action: DECREMENT_VARIABLE ${decVar.name} -= ${decAmount}\n`;
          code += `    ld a, (${decVar.asmName})\n`;
          code += `    sub ${decAmount}\n`;
          code += `    ld (${decVar.asmName}), a\n`;
        }
      }
      break;
  }

  return code;
}
```

**Testing:**
- Crear proyecto con StateMachine usando Actions
- Exportar a ROM
- Verificar que variables cambien correctamente en OpenMSX

---

### 2. 🔴 **StateMachine Guards ASM Generation** (Alta Prioridad)

**Estado:** NO implementado

**Descripción:**
Generar código Z80 Assembly para las **Guards** (condiciones) configuradas en transiciones de StateMachine.

**Guards a implementar:**
- Operadores: `==`, `!=`, `>`, `<`, `>=`, `<=`
- Variables: GlobalVariables configuradas
- Valores: Constantes o valores numéricos

**Archivos a modificar:**
- Crear: `utils/msxGenerator/generators/stateMachineGuardsGenerator.ts`
- Modificar: `utils/msxGenerator/generators/mainGenerator.ts` (integrar guards)

**Código ASM esperado:**

```asm
; ============================================
; STATEMACHINE TRANSITION WITH GUARD
; ============================================

; Transition: Playing -> PowerUp
; Guard: IF Lives > 0
transition_playing_to_powerup_check:
    ; Check guard condition
    ld a, (global_var_lives)
    cp 0
    jp z, transition_playing_to_powerup_skip  ; Skip if Lives == 0
    jp c, transition_playing_to_powerup_skip  ; Skip if Lives < 0

    ; Guard passed - execute transition
    call transition_playing_to_powerup_actions
    ld a, STATE_POWERUP
    ld (current_state), a
    ret

transition_playing_to_powerup_skip:
    ; Guard failed - no transition
    ret
```

**Lógica de implementación:**

```typescript
// stateMachineGuardsGenerator.ts

export function generateGuardASM(guard: TransitionGuard, analysis: ProjectAnalysis): string {
  const globalVar = analysis.globalVariables.find(v => v.name === guard.variableName);

  if (!globalVar) {
    console.warn(`Variable ${guard.variableName} not found in globalVariables`);
    return '; Guard variable not found\n    ret\n';
  }

  let code = `    ; Guard: IF ${guard.variableName} ${guard.operator} ${guard.compareValue}\n`;

  // Load variable
  code += `    ld a, (${globalVar.asmName})\n`;

  // Get compare value (constant or numeric)
  const compareValue = getCompareValue(globalVar, guard.compareValue);
  code += `    cp ${compareValue}\n`;

  // Generate conditional jump based on operator
  switch (guard.operator) {
    case '==':
      code += `    jp nz, guard_failed  ; Jump if not equal\n`;
      break;
    case '!=':
      code += `    jp z, guard_failed   ; Jump if equal\n`;
      break;
    case '>':
      code += `    jp z, guard_failed   ; Jump if equal\n`;
      code += `    jp c, guard_failed   ; Jump if less than\n`;
      break;
    case '<':
      code += `    jp nc, guard_failed  ; Jump if greater or equal\n`;
      break;
    case '>=':
      code += `    jp c, guard_failed   ; Jump if less than\n`;
      break;
    case '<=':
      code += `    jp z, guard_passed   ; Jump if equal\n`;
      code += `    jp c, guard_passed   ; Jump if less than\n`;
      code += `    jp guard_failed\n`;
      break;
  }

  code += `guard_passed:\n`;

  return code;
}
```

**Testing:**
- Crear proyecto con StateMachine usando Guards
- Exportar a ROM
- Verificar que transiciones respeten las condiciones

---

### 3. 🟡 **HUD Integration with GlobalVariables** (Media Prioridad)

**Estado:** NO implementado

**Descripción:**
Integrar GlobalVariables con el sistema de HUD para mostrar valores en pantalla durante gameplay.

**Funcionalidad esperada:**

#### **UI (HUD Configuration Editor):**
1. Seleccionar GlobalVariable en HUD element
2. Elegir formato de display (decimal, hexadecimal, con padding)
3. Preview en tiempo real

#### **ASM Generation:**
```asm
; ============================================
; HUD DISPLAY - GLOBALVARIABLES
; ============================================

update_hud_display:
    ; Display Lives (position 2,1)
    ld a, (global_var_lives)
    ld b, 2  ; X position
    ld c, 1  ; Y position
    call display_number_8bit

    ; Display Score (position 10,1) - 16-bit
    ld hl, (global_var_score)
    ld b, 10
    ld c, 1
    call display_number_16bit

    ret

; Helper: Display 8-bit number
display_number_8bit:
    ; Input: A = number, B = X, C = Y
    ; Convert to decimal digits and display
    ; ... (implementation)
    ret

; Helper: Display 16-bit number
display_number_16bit:
    ; Input: HL = number, B = X, C = Y
    ; Convert to decimal digits and display
    ; ... (implementation)
    ret
```

**Archivos a modificar:**
- `components/editors/HUDEditorModal.tsx` - Añadir selector de GlobalVariables
- Crear: `utils/msxGenerator/generators/hudDisplayGenerator.ts`
- Modificar: `utils/msxGenerator/generators/mainGenerator.ts` (integrar HUD updates)

**Características adicionales:**
- Padding con ceros (e.g., "003" para Lives = 3)
- Formato hexadecimal (e.g., "$FF" para Score = 255)
- Labels customizados (e.g., "LIVES:" antes del número)
- Actualización automática cada frame

**Testing:**
- Crear HUD con variables Lives y Score
- Modificar valores en gameplay
- Verificar actualización visual en OpenMSX

---

## 📊 **Prioridad y Estimación**

| Tarea | Prioridad | Complejidad | Tiempo Estimado |
|-------|-----------|-------------|-----------------|
| StateMachine Actions ASM | 🔴 Alta | Media | 2-3 horas |
| StateMachine Guards ASM | 🔴 Alta | Media | 2-3 horas |
| HUD Integration | 🟡 Media | Alta | 4-5 horas |

**Total estimado:** 8-11 horas de desarrollo

---

## 🎯 **Criterios de Aceptación**

### **StateMachine Actions:**
- ✅ SET_VARIABLE genera código ASM correcto
- ✅ INCREMENT_VARIABLE funciona para 8-bit y 16-bit
- ✅ DECREMENT_VARIABLE funciona para 8-bit y 16-bit
- ✅ Compila sin errores con glass.jar
- ✅ Ejecuta correctamente en OpenMSX
- ✅ Paridad con modo Play (JavaScript)

### **StateMachine Guards:**
- ✅ Todos los operadores (==, !=, >, <, >=, <=) generan código correcto
- ✅ Transiciones se ejecutan solo si guard es TRUE
- ✅ Compila sin errores con glass.jar
- ✅ Ejecuta correctamente en OpenMSX
- ✅ Paridad con modo Play (JavaScript)

### **HUD Integration:**
- ✅ Selector de GlobalVariables en HUD Editor
- ✅ Valores se muestran correctamente en pantalla
- ✅ Actualización en tiempo real
- ✅ Formatos (decimal, hex, padding) funcionan
- ✅ Compila sin errores con glass.jar
- ✅ Ejecuta correctamente en OpenMSX
- ✅ Paridad con modo Play (JavaScript)

---

## 🔗 **Referencias**

- [GlobalVariables ASM Integration](./GLOBALVARIABLES_ASM_INTEGRATION.md)
- [GameFlow Generator](../../utils/msxGenerator/generators/gameFlowGenerator.ts)
- [Variables Generator](../../utils/msxGenerator/generators/variablesGenerator.ts)
- [Constants Generator](../../utils/msxGenerator/generators/constantsGenerator.ts)

---

## 📝 **Notas de Implementación**

### **Consideraciones importantes:**

1. **Variables 16-bit:**
   - Usar `LD HL, (address)` para cargar
   - Usar `ADD HL, DE` / `SBC HL, DE` para aritmética
   - Almacenar con `LD (address), HL`

2. **Overflow/Underflow:**
   - Considerar flags de carry para detectar overflow
   - Implementar saturación si es necesario (clamp a 0-255 o 0-65535)

3. **Performance:**
   - Generar código inline para Actions simples
   - Usar CALL para rutinas complejas (display numbers)

4. **Testing:**
   - Crear proyecto de test con todas las combinaciones
   - Usar agente `openmsx-automation` para automatizar tests
   - Capturar screenshots para verificación visual

---

## ✅ **Checklist de Implementación**

### **StateMachine Actions:**
- [ ] Crear `stateMachineActionsGenerator.ts`
- [ ] Implementar `generateActionASM()` para SET_VARIABLE
- [ ] Implementar `generateActionASM()` para INCREMENT_VARIABLE (8-bit)
- [ ] Implementar `generateActionASM()` para INCREMENT_VARIABLE (16-bit)
- [ ] Implementar `generateActionASM()` para DECREMENT_VARIABLE (8-bit)
- [ ] Implementar `generateActionASM()` para DECREMENT_VARIABLE (16-bit)
- [ ] Integrar en `mainGenerator.ts`
- [ ] Testing con proyecto de ejemplo
- [ ] Compilar con glass.jar
- [ ] Probar en OpenMSX
- [ ] Documentar uso

### **StateMachine Guards:**
- [ ] Crear `stateMachineGuardsGenerator.ts`
- [ ] Implementar `generateGuardASM()` para operador ==
- [ ] Implementar `generateGuardASM()` para operador !=
- [ ] Implementar `generateGuardASM()` para operador >
- [ ] Implementar `generateGuardASM()` para operador <
- [ ] Implementar `generateGuardASM()` para operador >=
- [ ] Implementar `generateGuardASM()` para operador <=
- [ ] Integrar en `mainGenerator.ts`
- [ ] Testing con proyecto de ejemplo
- [ ] Compilar con glass.jar
- [ ] Probar en OpenMSX
- [ ] Documentar uso

### **HUD Integration:**
- [ ] Añadir selector de GlobalVariables en HUDEditorModal
- [ ] Crear `hudDisplayGenerator.ts`
- [ ] Implementar `display_number_8bit` rutina ASM
- [ ] Implementar `display_number_16bit` rutina ASM
- [ ] Implementar formato decimal
- [ ] Implementar formato hexadecimal
- [ ] Implementar padding con ceros
- [ ] Integrar en `mainGenerator.ts`
- [ ] Testing con proyecto de ejemplo
- [ ] Compilar con glass.jar
- [ ] Probar en OpenMSX
- [ ] Documentar uso

---

**Última revisión:** 2025-10-10
**Próxima revisión:** Cuando se implemente cualquiera de las tareas
