# Sistema Multi-Screen Patrol - Guía Completa

## 📋 Índice
1. [Introducción](#introducción)
2. [Configuración Básica](#configuración-básica)
3. [Propiedades del Componente](#propiedades-del-componente)
4. [Cómo Funciona](#cómo-funciona)
5. [Ejemplos de Uso](#ejemplos-de-uso)
6. [Sistema Parent-Child](#sistema-parent-child)
7. [Visualización en Editor](#visualización-en-editor)
8. [Limitaciones y Notas](#limitaciones-y-notas)

---

## Introducción

El **Sistema Multi-Screen Patrol** permite que plataformas móviles se desplacen a través de múltiples screens conectadas en un WorldMap. Esto significa que una plataforma puede:

- ✅ Moverse entre pantallas (screens) sin interrupciones
- ✅ Aparecer y desaparecer automáticamente según la pantalla visible
- ✅ Transportar al player entre pantallas cuando está montado sobre ella
- ✅ Usar coordenadas globales para movimiento fluido

---

## Configuración Básica

### 1. Requisitos Previos

Para usar multi-screen patrol necesitas:

1. **Un WorldMap** con múltiples screens conectadas
2. **Una entidad** con componente `comp_patrol`
3. **GameFlow** que use el WorldMap

### 2. Estructura Mínima

```json
{
  "worldmap": {
    "nodes": [
      {"id": "node1", "screenMapId": "screen1"},
      {"id": "node2", "screenMapId": "screen2"},
      {"id": "node3", "screenMapId": "screen3"}
    ],
    "connections": [
      {"fromNodeId": "node1", "toNodeId": "node2", "fromDirection": "right"},
      {"fromNodeId": "node2", "toNodeId": "node3", "fromDirection": "right"}
    ]
  }
}
```

---

## Propiedades del Componente

### `comp_patrol` - Propiedades Estándar

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `waypoint1_x` | word | 0 | Coordenada X inicial (en píxeles) |
| `waypoint1_y` | word | 0 | Coordenada Y inicial (en píxeles) |
| `waypoint2_x` | word | 64 | Coordenada X final (en píxeles) |
| `waypoint2_y` | word | 0 | Coordenada Y final (en píxeles) |
| `patrolSpeed` | word | 50 | Velocidad de patrulla |
| `speed` | number | 1 | Multiplicador de velocidad |

### `comp_patrol` - Propiedades Multi-Screen **NUEVAS**

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| **`multiScreen`** | boolean | `false` | **Activa modo multi-screen** |
| **`originScreenId`** | string | `''` | Screen donde se creó (auto-asignado) |

---

## Cómo Funciona

### Coordenadas Globales

El sistema convierte coordenadas locales (relativas a cada screen) a **coordenadas globales** (espacio del mundo completo).

#### Ejemplo:

```
Screen 1: X global = 0-255     (256px de ancho)
Screen 2: X global = 256-511   (screen 1 + 256)
Screen 3: X global = 512-767   (screen 2 + 256)
```

Si defines waypoints:
- `waypoint1_x = 50` (en screen 1)
- `waypoint2_x = 600` (en screen 3)

La plataforma viajará **550 píxeles** atravesando **3 screens** automáticamente.

### Flujo de Actualización

```
1. Entidad se inicializa con globalX/globalY
2. Cada frame:
   - globalX/Y se actualiza con velocidad
   - Se verifica si alcanzó waypoint (bounce)
   - Se convierte a coordenadas locales de screen actual
3. Si entidad está en otra screen:
   - Se oculta (posición -1000, -1000)
4. Si player está encima:
   - Hereda movimiento en espacio global
   - Si cruza a otra screen → transición automática
```

---

## Ejemplos de Uso

### Ejemplo 1: Plataforma Horizontal Simple

Patrulla entre screen 1 y screen 2 (horizontalmente):

```json
{
  "entityTemplateId": "tpl_moving_platform",
  "componentOverrides": {
    "comp_patrol": {
      "multiScreen": true,
      "waypoint1_x": 50,
      "waypoint1_y": 150,
      "waypoint2_x": 350,
      "waypoint2_y": 150,
      "speed": 0.8
    }
  }
}
```

**Resultado:**
- Inicia en X=50 del screen origen
- Se mueve hasta X=350 (atraviesa 1 screen completo + 94px del siguiente)
- Rebota y vuelve

### Ejemplo 2: Plataforma Vertical Multi-Screen

Patrulla verticalmente entre 2 screens conectadas verticalmente:

```json
{
  "componentOverrides": {
    "comp_patrol": {
      "multiScreen": true,
      "waypoint1_x": 128,
      "waypoint1_y": 50,
      "waypoint2_x": 128,
      "waypoint2_y": 300,
      "speed": 0.5
    }
  }
}
```

**Resultado:**
- Se mueve verticalmente
- Atraviesa screen 1 (Y=0-191) y entra en screen de abajo (Y=192-383)

### Ejemplo 3: Plataforma Diagonal

Combina movimiento horizontal y vertical:

```json
{
  "componentOverrides": {
    "comp_patrol": {
      "multiScreen": true,
      "waypoint1_x": 50,
      "waypoint1_y": 50,
      "waypoint2_x": 600,
      "waypoint2_y": 300,
      "speed": 1.2
    }
  }
}
```

---

## Sistema Parent-Child

### ¿Qué es?

Cuando el **player** sube sobre una **plataforma multi-screen**, se establece un vínculo temporal (**parent-child**):

- Player hereda la velocidad de la plataforma en espacio global
- Al cambiar de screen, player sigue a la plataforma automáticamente
- Al saltar o caerse, el vínculo se rompe

### Configuración de Plataforma

La plataforma debe tener:

```json
{
  "comp_collision": {
    "isPlatform": true,
    "collisionLayer": 8,
    "collidesWith": 255
  },
  "comp_patrol": {
    "multiScreen": true,
    "waypoint1_x": 50,
    "waypoint1_y": 150,
    "waypoint2_x": 600,
    "waypoint2_y": 150
  }
}
```

### Configuración de Player

```json
{
  "comp_collision": {
    "collisionLayer": 1,
    "collidesWith": 10
  },
  "comp_gravity": {
    "gravityStrength": 0.3
  },
  "comp_cursors": {}
}
```

### Logs de Debug

Puedes ver en la consola cuando el player se monta/desmonta:

```
[PLATFORM] Player is on ground via platform Multi-Screen Platform
[Multi-Screen PLATFORM] Player moved to screen screen2 while riding platform
[PLATFORM] Player dismounted from platform
```

---

## Visualización en Editor

### En Screen Editor

Cuando seleccionas una entidad con `multiScreen=true`:

#### Línea de Patrulla
- **Verde** (3px): Patrulla multi-screen activa
- **Magenta** (2px): Patrulla tradicional single-screen

#### Indicadores Visuales
- **Marcadores cuadrados** en waypoints
- **Flecha** indicando dirección
- **Texto** mostrando:
  - Distancia total en píxeles
  - Número de screens atravesados (ej: "3 screens")

#### Badge Multi-Screen
- **🌐 Multi-Screen Patrol: 3x** aparece sobre la entidad
- Indica que la patrulla cruza múltiples pantallas

---

## Limitaciones y Notas

### ⚠️ Limitaciones Actuales

1. **Generador ASM**: Actualmente, el código ASM multi-screen **no se genera automáticamente**. El snippet `behavior_multiscreen_patrol.asm` está disponible pero requiere integración manual.

2. **Solo en GameFlow Play**: Multi-screen patrol funciona en `GameFlowPreviewModal` (Play Mode completo), **NO** en `ScreenPlayModal` (preview individual de screen).

3. **WorldMap requerido**: Las entidades multi-screen necesitan un WorldMap válido para calcular coordenadas globales.

4. **Screens adyacentes**: Solo screens directamente conectadas en el WorldMap son soportadas.

### 🎯 Mejores Prácticas

1. **Velocidad moderada**: Usa `speed` entre 0.5-1.5 para movimiento fluido
2. **Waypoints visibles**: Al menos uno de los waypoints debe estar en el screen de origen para inicialización correcta
3. **Testing incremental**: Prueba primero con 2 screens antes de expandir a más
4. **Collision layers**: Asegura que player y plataforma tengan layers compatibles

### 🐛 Troubleshooting

#### Plataforma no aparece
- ✅ Verifica que `multiScreen=true`
- ✅ Chequea que estás en GameFlow Play (no Screen Play)
- ✅ Asegura que WorldMap está configurado correctamente

#### Plataforma se mueve erráticamente
- ✅ Revisa waypoints (deben ser números, no strings)
- ✅ Verifica que `originScreenId` se asignó correctamente
- ✅ Chequea que screens están conectadas en WorldMap

#### Player no sigue a plataforma
- ✅ Verifica que plataforma tiene `isPlatform: true`
- ✅ Asegura que collision layers son compatibles
- ✅ Chequea que player tiene componente `comp_gravity`

---

## Proyecto de Ejemplo

Carga el proyecto de ejemplo en:

```
Examples/multiscreen_platform_demo.json
```

Este proyecto incluye:
- 3 screens conectadas horizontalmente
- 1 plataforma que patrulla entre screen 1 y screen 3
- 1 player con controles de cursor y gravedad
- WorldMap y GameFlow pre-configurados

### Cómo Probarlo

1. Abre Mideas
2. Carga `multiscreen_platform_demo.json`
3. Abre "Game Flow Editor"
4. Click en "Play" (botón verde)
5. Usa flechas para mover al player
6. Salta sobre la plataforma verde
7. La plataforma te llevará entre pantallas automáticamente

---

## Arquitectura Técnica

### Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `data/defaults.ts` | Definición de comp_patrol extendido |
| `utils/screenCoordinates.ts` | Sistema de conversión de coordenadas |
| `components/modals/GameFlowPreviewModal.tsx` | Lógica de patrulla + parent-child |
| `src/asm/snippets/behavior_multiscreen_patrol.asm` | Snippet ASM Z80 |
| `components/screen_editor/PatrolPathLayer.tsx` | Visualización en editor |

### Flujo de Datos

```
[Entity Init]
  ↓
[Detect multiScreen=true]
  ↓
[Build ScreenWorldMap from WorldMapGraph]
  ↓
[Calculate globalX/Y from originScreen + localX/Y]
  ↓
[Each Frame in Game Loop]
  ↓
[Update globalX/Y with velocity]
  ↓
[Check waypoint bounds → bounce if reached]
  ↓
[Convert globalX/Y → localX/Y for current screen]
  ↓
[If entity in other screen → hide (-1000, -1000)]
  ↓
[If player on platform → inherit movement]
  ↓
[If player crosses screen → trigger transition]
```

---

## Changelog

### v1.0.0 (2025-10-30)
- ✅ Sistema de coordenadas globales implementado
- ✅ Lógica multi-screen patrol en GameFlow Play
- ✅ Sistema parent-child para player sobre plataformas
- ✅ Visualización en PatrolPathLayer con indicadores
- ✅ Snippet ASM Z80 para paridad MSX
- ⏳ Generación automática ASM pendiente

---

## Soporte y Contribuciones

Para reportar bugs o sugerir mejoras relacionadas con multi-screen patrol:

1. Abre un issue en el repositorio de Mideas
2. Incluye el proyecto JSON problemático
3. Describe el comportamiento esperado vs actual
4. Adjunta capturas de pantalla si es posible

---

## Referencias

- [Entity Component System (ECS)](./ECS_GUIDE.md)
- [World Map Editor](./WORLDMAP_GUIDE.md)
- [Collision System](./COLLISION_GUIDE.md)
- [MSX Assembly Snippets](../src/asm/snippets/README.md)
