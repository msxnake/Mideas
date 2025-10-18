# Cursors Component - Direction Restrictions

## Overview

El componente **Cursors** ahora soporta restricciones de dirección para controlar qué movimientos están permitidos para cada entidad. Esto es especialmente útil para diferentes tipos de juegos:

- **Plataformas**: Solo movimiento horizontal (izquierda/derecha)
- **Ascensores/Verticales**: Solo movimiento vertical (arriba/abajo)
- **Movimiento libre**: Todas las direcciones (por defecto)

## Propiedades del Componente

El componente Cursors (`comp_cursors`) tiene las siguientes propiedades de restricción:

```typescript
{
  allowUp: boolean,      // Permite movimiento hacia ARRIBA (default: true)
  allowDown: boolean,    // Permite movimiento hacia ABAJO (default: true)
  allowLeft: boolean,    // Permite movimiento hacia IZQUIERDA (default: true)
  allowRight: boolean    // Permite movimiento hacia DERECHA (default: true)
}
```

### Ejemplos de Configuración

#### Juego de Plataformas (solo horizontal)
```json
{
  "allowUp": false,
  "allowDown": false,
  "allowLeft": true,
  "allowRight": true
}
```

#### Juego de Ascensor (solo vertical)
```json
{
  "allowUp": true,
  "allowDown": true,
  "allowLeft": false,
  "allowRight": false
}
```

#### Movimiento Libre (por defecto)
```json
{
  "allowUp": true,
  "allowDown": true,
  "allowLeft": true,
  "allowRight": true
}
```

## Implementación en el Editor (TypeScript/React)

### ScreenPlayModal.tsx

El preview del juego en el editor implementa las restricciones de dirección en las líneas **558-596**:

```typescript
const speed = Number(cursorsProps.speed) || 2;

// Get allowed directions (default to true if not specified)
const allowUp = cursorsProps.allowUp !== false;
const allowDown = cursorsProps.allowDown !== false;
const allowLeft = cursorsProps.allowLeft !== false;
const allowRight = cursorsProps.allowRight !== false;

// Reset velocity
entity.vx = 0;
entity.vy = 0;

// Apply movement based on pressed keys with direction restrictions
if (allowUp && (currentPressedKeys.has('ArrowUp') || currentPressedKeys.has('KeyW'))) {
  const newY = entity.y - speed;
  if (!wouldCollideWithWall(entity, entity.x, newY)) {
    entity.vy = -speed;
  }
}
// ... similar para Down, Left, Right
```

### GameFlowPreviewModal.tsx

El preview de GameFlow (WorldLink nodes) también implementa las restricciones en las líneas **161-190**.

## Implementación en MSX Assembly

### Estructura de Datos

Cada entidad tiene 1 byte en `entity_dir_mask` que almacena las direcciones permitidas usando bits:

```asm
; Direction flags for Cursors component
DIR_ALLOW_UP     EQU #01  ; Bit 0: Allow UP movement
DIR_ALLOW_DOWN   EQU #02  ; Bit 1: Allow DOWN movement
DIR_ALLOW_LEFT   EQU #04  ; Bit 2: Allow LEFT movement
DIR_ALLOW_RIGHT  EQU #08  ; Bit 3: Allow RIGHT movement

; Input/Cursors Component Data (Direction restrictions)
entity_dir_mask  EQU temp_byte_6  ; Direction allowed mask per entity (32 bytes)
                                  ; Bit 0=UP, Bit 1=DOWN, Bit 2=LEFT, Bit 3=RIGHT
```

### Valores de Máscara

| Configuración | Valor Hexadecimal | Binario | Descripción |
|---------------|-------------------|---------|-------------|
| Todas las direcciones | `#0F` | `00001111` | Movimiento libre (default) |
| Solo horizontal | `#0C` | `00001100` | LEFT + RIGHT (plataformas) |
| Solo vertical | `#03` | `00000011` | UP + DOWN (ascensores) |
| Solo arriba-derecha | `#09` | `00001001` | UP + RIGHT |
| Sin movimiento | `#00` | `00000000` | Entidad estática |

### Inicialización por Entidad

En `entitiesGenerator.ts`, cada entidad lee las propiedades `allowUp/Down/Left/Right` del componente Cursors y construye su máscara de dirección:

```typescript
// Check if entity has Input/Cursors component and extract direction restrictions
let directionMask = 0x0F; // Default: all directions enabled (binary 00001111)
if (componentMask & 0x10) { // Has Input component
  // Find Cursors component in template
  const cursorsComp = template?.components.find((c: any) =>
    c.definitionId === 'comp_cursors'
  );

  if (cursorsComp) {
    // Get default values from template + entity overrides
    const defaultValues = cursorsComp.defaultValues || {};
    const overrides = entity.componentOverrides?.['comp_cursors'] || {};
    const finalValues = { ...defaultValues, ...overrides };

    // Build direction mask based on allow* properties
    directionMask = 0;
    if (finalValues.allowUp !== false) directionMask |= 0x01;    // Bit 0
    if (finalValues.allowDown !== false) directionMask |= 0x02;  // Bit 1
    if (finalValues.allowLeft !== false) directionMask |= 0x04;  // Bit 2
    if (finalValues.allowRight !== false) directionMask |= 0x08; // Bit 3
  }
}
```

Luego genera el código ASM de inicialización:

```asm
init_player:
    ; ... (posición, sprite, etc.)

    ; Set direction mask for Cursors component
    ld hl, entity_dir_mask
    add hl, de
    ld (hl), #0C            ; Direction restrictions: LEFT+RIGHT (horizontal only)

    ret
```

### Sistema de Input

El sistema de input (`componentsGenerator.ts`, líneas **417-648**) verifica las restricciones antes de aplicar velocidad:

```asm
update_input_component:
    ; ... (leer joystick)

    ; Get direction mask for this entity
    ld hl, entity_dir_mask
    ld e, c                 ; Entity index
    ld d, 0
    add hl, de
    ld d, (hl)              ; D = direction mask

    ; Convert joystick input to velocity
    ld a, (input_state)

    ; Check directional input with direction restrictions
    cp STICK_UP
    jr z, input_move_up
    ; ...

input_move_up:
    ; Check if UP is allowed (bit 0)
    ld a, d
    and DIR_ALLOW_UP
    jr z, input_apply_velocity  ; Not allowed, skip
    ld c, -2                    ; Negative Y velocity (up)
    jr input_apply_velocity
```

### Movimiento Diagonal

El sistema maneja inteligentemente los movimientos diagonales cuando una dirección está restringida:

```asm
input_move_upright:
    ; Check if both UP and RIGHT are allowed
    ld a, d
    and DIR_ALLOW_UP
    jr z, input_check_right_only ; UP not allowed, try RIGHT only
    ld a, d
    and DIR_ALLOW_RIGHT
    jr z, input_check_up_only    ; RIGHT not allowed, try UP only

    ; Both allowed - use diagonal movement
    ld b, 1                      ; X velocity
    ld c, -1                     ; Y velocity
    jr input_apply_velocity

input_check_right_only:
    ; Only RIGHT allowed - apply horizontal movement
    ld a, d
    and DIR_ALLOW_RIGHT
    jr z, input_apply_velocity   ; Neither allowed
    ld b, 2                      ; Full speed horizontal
    jr input_apply_velocity

input_check_up_only:
    ; Only UP allowed - apply vertical movement
    ld c, -2                     ; Full speed vertical
    jr input_apply_velocity
```

## Paridad Editor-MSX

La implementación garantiza que el comportamiento sea **idéntico** entre:

1. **Modo Play en Mideas** (TypeScript/Canvas)
2. **ROM MSX generado** (Z80 Assembly)

Ambos usan la misma lógica:
- Valores por defecto (`!== false` significa `true`)
- Soporte para movimiento diagonal degradado
- Misma velocidad y respuesta

## Casos de Uso

### 1. Plataformas 2D (Super Mario style)

```json
{
  "definitionId": "comp_cursors",
  "defaultValues": {
    "speed": 2,
    "allowUp": false,
    "allowDown": false,
    "allowLeft": true,
    "allowRight": true
  }
}
```

**Resultado**: El jugador solo puede moverse horizontalmente. Los saltos se manejan con el componente `Jump`.

### 2. Juego de Naves Vertical (Shoot 'em up)

```json
{
  "definitionId": "comp_cursors",
  "defaultValues": {
    "speed": 3,
    "allowUp": true,
    "allowDown": true,
    "allowLeft": false,
    "allowRight": false
  }
}
```

**Resultado**: La nave solo puede moverse arriba/abajo (scrolling vertical automático en X).

### 3. Juego de Laberinto (Pacman style)

```json
{
  "definitionId": "comp_cursors",
  "defaultValues": {
    "speed": 1,
    "allowUp": true,
    "allowDown": true,
    "allowLeft": true,
    "allowRight": true
  }
}
```

**Resultado**: Movimiento completo en las 4 direcciones (no diagonal).

## Archivos Modificados

### Frontend (TypeScript)
- `data/defaults.ts`: Añadidas propiedades `allow*` al componente Cursors
- `components/modals/ScreenPlayModal.tsx`: Implementación de restricciones en preview
- `components/modals/GameFlowPreviewModal.tsx`: Implementación en GameFlow preview

### Backend (Generadores ASM)
- `utils/msxGenerator/generators/componentsGenerator.ts`: Sistema de input con bit masking
- `utils/msxGenerator/generators/entitiesGenerator.ts`: Inicialización de `entity_dir_mask` por entidad
- `utils/msxGenerator/generators/variablesGenerator.ts`: Definición de variables temporales

## Compatibilidad con Versiones Anteriores

Proyectos antiguos sin las propiedades `allow*` funcionan correctamente:

- **Valor por defecto**: `true` para todas las direcciones
- **Chequeo**: `allowUp !== false` (no `=== true`)
- **Resultado**: Comportamiento idéntico a versiones anteriores

## Testing

Para probar las restricciones de dirección:

1. **Editor Mideas**:
   - Abrir Component Definition Editor
   - Seleccionar componente "Cursors"
   - Modificar propiedades `allow*`
   - Probar en modo "Play"

2. **MSX ROM**:
   - Exportar proyecto a ASM
   - Compilar con `glass.jar`
   - Ejecutar en OpenMSX
   - Verificar que el movimiento coincide con el editor

## Notas Técnicas

- **Uso de memoria**: 1 byte por entidad (32 bytes totales para 32 entidades)
- **Rendimiento**: Operación AND por chequeo de dirección (muy eficiente en Z80)
- **Escalabilidad**: Sistema extensible para más restricciones (bits 4-7 disponibles)

## Futuras Mejoras

Posibles extensiones del sistema:

1. **Velocidad por dirección**: Diferentes velocidades para cada dirección
2. **Restricciones temporales**: Habilitar/deshabilitar direcciones dinámicamente
3. **Restricciones condicionales**: Basadas en estado del juego (ej: en agua, en hielo)
4. **Curvas de aceleración**: Movimiento más suave con aceleración/desaceleración
