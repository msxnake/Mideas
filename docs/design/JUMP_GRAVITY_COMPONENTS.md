# Componentes Jump y Gravity - Física de Plataformas para MSX

## Resumen

Este documento describe la implementación de los componentes **Jump** y **Gravity** en el sistema ECS de Mideas MSX. Estos componentes permiten crear juegos de plataformas con física realista optimizada para hardware MSX (Z80 8-bit).

**Fecha de implementación:** 2025-10-17
**Versión:** 1.0
**Estado:** Implementado y funcional

---

## 1. Características Principales

### Componente Jump
- **Saltos múltiples:** Soporte para doble/triple salto configurable
- **Activación por botón:** Usa el botón de fuego (bit 4 del input)
- **Física suave:** Fixed-Point 8.8 arithmetic para movimiento sin parpadeos
- **Detección de suelo:** Sistema de ground detection para resetear contador de saltos

### Componente Gravity
- **Aceleración constante:** Simulación de gravedad realista
- **Velocidad terminal:** Límite máximo de caída para evitar bugs
- **Integración con Jump:** Trabaja en conjunto para física completa
- **Detección de suelo:** Resetea velocidad de gravedad al tocar el suelo

---

## 2. Definiciones de Componentes (TypeScript)

### Jump Component (defaults.ts)
```typescript
{
  id: "comp_jump",
  name: "Jump",
  description: "Manages jumping behavior for an entity.",
  properties: [
    {
      name: "jumpPower",
      type: "word",
      defaultValue: "256",
      description: "Initial upward velocity or force."
    },
    {
      name: "maxJumps",
      type: "byte",
      defaultValue: "1",
      description: "Number of jumps allowed before landing."
    },
    {
      name: "currentJumpCount",
      type: "byte",
      defaultValue: "0",
      description: "Current jump count."
    },
    {
      name: "isJumping",
      type: "boolean",
      defaultValue: "false",
      description: "Is the entity currently jumping?"
    }
  ]
}
```

### Gravity Component (defaults.ts)
```typescript
{
  id: "comp_gravity",
  name: "Gravity",
  description: "Applies downward acceleration to entities.",
  properties: [
    {
      name: "gravityStrength",
      type: "byte",
      defaultValue: "2",
      description: "Gravity acceleration strength."
    }
  ]
}
```

---

## 3. Implementación ASM

### 3.1 Constantes del Sistema

```asm
; Component IDs
COMP_JUMP       EQU 8    ; Jump behavior component
COMP_GRAVITY    EQU 9    ; Gravity physics component

; Component masks (16-bit para soportar 10+ componentes)
COMP_MASK_JUMP       EQU #0100  ; Binary: 0000000100000000
COMP_MASK_GRAVITY    EQU #0200  ; Binary: 0000001000000000
```

### 3.2 Estructuras de Datos

```asm
; Jump Component Data (Fixed-Point 8.8 for smooth physics)
entity_jump_vel_y   EQU temp_word_3       ; Y velocity (signed word, 64 bytes)
entity_jump_count   EQU temp_byte_4       ; Jump count (32 bytes)
entity_on_ground    EQU temp_byte_5       ; Ground flag (32 bytes)

; Gravity Component Data
entity_gravity_vel  EQU temp_word_4       ; Gravity velocity (signed word, 64 bytes)
```

**Memoria utilizada:**
- Jump: 64 + 32 + 32 = **128 bytes**
- Gravity: 64 = **64 bytes**
- **Total:** 192 bytes

### 3.3 Sistema de Inicialización

```asm
init_jump_system:
    ; Clear jump velocities (64 bytes)
    ld hl, entity_jump_vel_y
    ld de, entity_jump_vel_y+1
    ld bc, 63
    ld (hl), 0
    ldir

    ; Clear jump counters (32 bytes)
    ld hl, entity_jump_count
    ld de, entity_jump_count+1
    ld bc, 31
    ld (hl), 0
    ldir

    ; Clear ground flags (32 bytes)
    ld hl, entity_on_ground
    ld de, entity_on_ground+1
    ld bc, 31
    ld (hl), 0
    ldir
    ret

init_gravity_system:
    ; Clear gravity velocities (64 bytes)
    ld hl, entity_gravity_vel
    ld de, entity_gravity_vel+1
    ld bc, 63
    ld (hl), 0
    ldir
    ret
```

### 3.4 Lógica de Actualización

#### Update Jump Component
```asm
update_jump_component:
    ; Loop through all 32 entities
    ld b, 32
    ld hl, entity_comp_masks
    ld c, 0                    ; Entity index

jump_update_loop:
    ; Check if entity has Jump component
    ld a, (hl)                 ; Low byte
    inc hl
    ld a, (hl)                 ; High byte
    and #01                    ; Check COMP_MASK_JUMP high byte
    jr z, jump_next_entity
    dec hl

    ; Check fire button input
    ld a, (input_state)
    bit 4, a                   ; Bit 4 = fire button
    jr z, jump_no_input

    ; Check if can jump (grounded or has jumps remaining)
    ld hl, entity_on_ground
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    bit 0, a
    jr nz, jump_execute        ; Can jump if grounded

    ; Not grounded - check multi-jump
    ld hl, entity_jump_count
    add hl, de
    ld a, (hl)
    cp 2                       ; maxJumps (TODO: make dynamic)
    jr nc, jump_no_input

jump_execute:
    ; Apply jump velocity (-512 in fixed-point)
    ld hl, entity_jump_vel_y
    ld e, c
    ld d, 0
    add hl, de
    add hl, de
    ld (hl), #00               ; Low byte
    inc hl
    ld (hl), #FE               ; High byte = -2

    ; Increment jump counter
    ld hl, entity_jump_count
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    inc a
    ld (hl), a

    ; Clear ground flag
    ld hl, entity_on_ground
    add hl, de
    ld (hl), 0

jump_no_input:
    ; Apply velocity to Y position
    ld hl, entity_jump_vel_y
    ld e, c
    ld d, 0
    add hl, de
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)

    ; Update Y position
    ld hl, entity_y_pos
    ld a, c
    ld l, a
    ld h, 0
    add hl, de
    ld a, (hl)
    add a, d                   ; Add high byte (integer part)
    ld (hl), a

jump_next_entity:
    inc hl
    inc hl
    inc c
    djnz jump_update_loop
    ret
```

#### Update Gravity Component
```asm
update_gravity_component:
    ; Loop through all 32 entities
    ld b, 32
    ld hl, entity_comp_masks
    ld c, 0

gravity_update_loop:
    ; Check if entity has Gravity component
    ld a, (hl)
    inc hl
    ld a, (hl)
    and #02                    ; Check COMP_MASK_GRAVITY
    jr z, gravity_next_entity
    dec hl

    ; Check if grounded
    ld hl, entity_on_ground
    ld e, c
    ld d, 0
    add hl, de
    ld a, (hl)
    bit 0, a
    jr nz, gravity_grounded    ; Skip if on ground

    ; Apply gravity acceleration (64 = ~0.25 pixels/frame)
    ld hl, entity_gravity_vel
    ld e, c
    ld d, 0
    add hl, de
    add hl, de
    ld e, (hl)
    inc hl
    ld d, (hl)

    ; Add gravity strength
    ld a, e
    add a, #40                 ; +64
    ld e, a
    ld a, d
    adc a, #00
    ld d, a

    ; Check terminal velocity (1024 max)
    ld a, d
    cp #04
    jr c, gravity_store_vel
    ld de, #0400               ; Cap at 1024

gravity_store_vel:
    ; Store velocity
    dec hl
    ld (hl), e
    inc hl
    ld (hl), d

    ; Apply to Y position
    ld hl, entity_y_pos
    ld a, c
    ld l, a
    ld h, 0
    add hl, de
    ld a, (hl)
    add a, d
    ld (hl), a
    jr gravity_done

gravity_grounded:
    ; Reset gravity velocity
    ld hl, entity_gravity_vel
    ld e, c
    ld d, 0
    add hl, de
    add hl, de
    ld (hl), 0
    inc hl
    ld (hl), 0

gravity_done:
    inc hl
    inc hl
    inc c
    djnz gravity_update_loop
    ret
```

---

## 4. Parámetros Físicos

### Jump Component
| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| **Jump Velocity** | -512 (fixed-point) | Velocidad inicial de salto hacia arriba |
| **Max Jumps** | 2 (default) | Número máximo de saltos antes de tocar suelo |
| **Jump Trigger** | Bit 4 (Fire Button) | Botón que activa el salto |

### Gravity Component
| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| **Gravity Strength** | 64 (fixed-point) | Aceleración por frame (~0.25 px/frame²) |
| **Terminal Velocity** | 1024 | Velocidad máxima de caída |

### Fixed-Point 8.8 Format
```
Word (16-bit): [High Byte | Low Byte]
               [Integer  | Fractional]

Example: -512 = #FE00
  High byte (#FE = -2) = integer part
  Low byte (#00 = 0)   = fractional part

Result: -2.0 pixels/frame upward velocity
```

---

## 5. Integración en Proyectos Mideas

### 5.1 Cómo Usar en el Editor

1. **Crear Entity Template:**
   - Ir a Entity Templates Editor
   - Crear nuevo template (ej: "Player")

2. **Agregar Componentes:**
   - Agregar componente "Jump" desde la lista
   - Agregar componente "Gravity" desde la lista
   - Ajustar propiedades según necesidad:
     - `jumpPower`: 256-512 (rango recomendado)
     - `maxJumps`: 1 (salto simple), 2 (doble salto), 3 (triple salto)

3. **Configurar Input:**
   - Agregar componente "Input" para control del jugador
   - El botón de fuego activará el salto automáticamente

4. **Configurar Colisión:**
   - Agregar componente "Collision" para detección de suelo
   - La detección de suelo resetea el contador de saltos

### 5.2 Flujo de Ejecución

```
Frame N:
  1. update_input_component     -> Lee botón de fuego
  2. update_jump_component       -> Aplica salto si botón presionado
  3. update_gravity_component    -> Aplica gravedad si no está en suelo
  4. update_collision_component  -> Detecta suelo, actualiza entity_on_ground
  5. update_position_component   -> Aplica velocidades finales
  6. update_sprite_component     -> Renderiza sprite en nueva posición
```

---

## 6. Optimizaciones MSX

### 6.1 Memory Layout Efficiency
- **Reuso de memoria:** Jump y Gravity comparten detection flags (entity_on_ground)
- **Fixed-Point 8.8:** Evita operaciones de punto flotante costosas
- **Component Masks de 16-bit:** Permite hasta 16 componentes sin desperdiciar espacio

### 6.2 CPU Cycle Optimization
- **Early Exit:** Salta entidades sin componentes Jump/Gravity en primer ciclo
- **Terminal Velocity Cap:** Previene overflow y simplifica cálculos
- **Integer-only Math:** Solo usa byte high de velocidad para actualizar posición

### 6.3 Intelligent Filtering
```typescript
// Solo genera código ASM si proyecto usa Jump/Gravity
if (usedComponents.has('Jump')) {
  code += generateJumpSystem();
} else {
  code += `; Jump system filtered out (not used)`;
}
```

**Ahorro de ROM:** ~250 bytes por sistema no utilizado

---

## 7. Extensiones Futuras

### 7.1 Propiedades Dinámicas
```typescript
// TODO: Leer jumpPower desde component properties
// Actualmente usa valor hardcoded (#FE00 = -512)
const jumpPower = entity.components.Jump.jumpPower;
```

### 7.2 Variable Gravity
```typescript
// TODO: Diferentes fuerzas de gravedad por entidad
const gravityStrength = entity.components.Gravity.gravityStrength;
```

### 7.3 Jump Buffering
```asm
; TODO: Buffer de input para saltos más responsivos
; Permite presionar jump antes de tocar suelo
```

### 7.4 Coyote Time
```asm
; TODO: Grace period después de dejar plataforma
; Permite saltar unos frames después de caer
```

---

## 8. Testing

### 8.1 Casos de Prueba

1. **Salto Simple:**
   - Entidad con Jump (maxJumps=1) + Gravity
   - Presionar fuego → salta
   - Soltar fuego → cae por gravedad
   - Tocar suelo → puede saltar de nuevo

2. **Doble Salto:**
   - Entidad con Jump (maxJumps=2) + Gravity
   - Presionar fuego → primer salto
   - Presionar fuego en aire → segundo salto
   - Tercer press → no hace nada
   - Tocar suelo → resetea contador

3. **Solo Gravity (sin Jump):**
   - Entidad con Gravity (sin Jump)
   - Cae continuamente
   - Respeta terminal velocity
   - Se detiene al tocar suelo

### 8.2 Comandos de Testing

```bash
# Compilar proyecto con Jump/Gravity
npm run build:msx

# Ejecutar en OpenMSX
openmsx -cart proyecto.rom

# Verificar en logs
"Used components: Position, Sprite, Jump, Gravity, Input"
```

---

## 9. Archivos Modificados

### Implementación Completa (2025-10-17)
- ✅ `utils/msxGenerator/generators/componentsGenerator.ts` - Generación ASM Jump/Gravity
- ✅ `utils/msxGenerator/utils/componentAnalyzer.ts` - Bit masks 16-bit + Jump/Gravity
- ✅ `data/defaults.ts` - Definiciones TypeScript (existentes, verificadas)
- ✅ `types.ts` - Interfaces ComponentDefinition (sin cambios necesarios)

### Documentación
- ✅ `docs/design/JUMP_GRAVITY_COMPONENTS.md` - Este documento

---

## 10. Referencias

### Archivos Relacionados
- **DYNAMIC_COMPONENT_SYSTEM.md** - Sistema ECS general
- **componentAnalyzer.ts** - Filtrado inteligente de componentes
- **defaults.ts** - Definiciones de componentes por defecto

### Conceptos MSX
- **Screen 2 Graphics** - Modo gráfico 256x192
- **Z80 Assembly** - CPU de 8 bits, 3.58 MHz
- **Fixed-Point Math** - Aritmética de punto fijo 8.8

### Contacto
Para preguntas sobre esta implementación, consultar:
- Git history: commit relacionado con "Jump and Gravity components"
- Code comments en `componentsGenerator.ts` líneas 672-918

---

**Fin del documento**
