# 🟡 NUEVOS COMPONENTES PACMAN - CREAR MANUALMENTE

## 📝 **COMPONENTE 1: PacmanMovementV2**

**En Component Definition Editor:**

### Basic Info:
- **Component Name:** `PacmanMovementV2`
- **Description:** `Advanced Pac-Man movement system with pixel-perfect collision detection every 8 pixels, direction intention system, and 60fps smooth movement for MSX games.`

### Properties (Add estas 11 properties):

1. **speed** 
   - Type: `byte`
   - Default Value: `1`
   - Description: `Movement speed in pixels per frame at 60fps`

2. **currentDirection**
   - Type: `string` 
   - Default Value: `NONE`
   - Description: `Current movement direction: NONE, LEFT, RIGHT, UP, DOWN`

3. **desiredDirection**
   - Type: `string`
   - Default Value: `NONE`
   - Description: `Player's desired direction for next turn opportunity`

4. **pixelCounter**
   - Type: `byte`
   - Default Value: `0`
   - Description: `Position counter relative to 8x8 character grid (0-7)`

5. **velocityX**
   - Type: `byte`
   - Default Value: `0`
   - Description: `Current horizontal velocity (-speed to +speed)`

6. **velocityY** 
   - Type: `byte`
   - Default Value: `0`
   - Description: `Current vertical velocity (-speed to +speed)`

7. **canTurnOnPixel**
   - Type: `boolean`
   - Default Value: `true`
   - Description: `Whether direction changes are allowed on current pixel`

8. **stopOnWall**
   - Type: `boolean`
   - Default Value: `true` 
   - Description: `Stop movement when hitting wall if no input pressed`

9. **allowReverse**
   - Type: `boolean`
   - Default Value: `true`
   - Description: `Allow immediate reverse direction without collision check`

10. **tileSize**
    - Type: `byte`
    - Default Value: `8`
    - Description: `Size of tiles for collision checking (8x8 for MSX)`

11. **isEnabled**
    - Type: `boolean`
    - Default Value: `true`
    - Description: `Whether Pac-Man movement system is active`

---

## 📝 **COMPONENTE 2: PacmanRotationV2**

**En Component Definition Editor:**

### Basic Info:
- **Component Name:** `PacmanRotationV2`
- **Description:** `Automatic sprite rotation based on Pac-Man movement direction with MSX-compatible angles.`

### Properties (Add estas 3 properties):

1. **rotation**
   - Type: `byte`
   - Default Value: `0`
   - Description: `Current rotation angle: 0=right, 90=up, 180=left, 270=down`

2. **facingDirection**
   - Type: `byte`
   - Default Value: `0`
   - Description: `Current facing direction: 0=right, 1=up, 2=left, 3=down`

3. **autoRotate**
   - Type: `boolean`
   - Default Value: `true`
   - Description: `Automatically rotate sprite based on movement direction`

---

## 🎮 **ENTIDAD: PacmanPlayerV2**

**En Entity Template Editor:**

### Basic Info:
- **Template Name:** `PacmanPlayerV2`
- **Icon:** `🟡`
- **Description:** `Advanced Pac-Man player with pixel-perfect movement, 8-pixel collision checks, direction intention system, and 60fps smooth movement. Optimized for MSX Screen 2 mode with 16x16 sprites.`

### Components (Add estos 7 components):

1. **Position** (`comp_pos`)
   - x: `32`
   - y: `32`

2. **Renderable** (`comp_render`) 
   - spriteAssetId: `pacman_sprite_16x16` *(crear después)*
   - isVisible: `true`
   - layer: `1`

3. **Health** (`comp_health`)
   - current: `3`
   - max: `3`

4. **Wall Collision** (`comp_wall_collision`)
   - hitboxWidth: `16`
   - hitboxHeight: `16`
   - offsetX: `0`
   - offsetY: `0`
   - tileSize: `8`
   - stopOnCollision: `true`

5. **PlayerInput** (`comp_player_input`)
   - controllerId: `0`
   - inputEnabled: `true`

6. **PacmanMovementV2** (`comp_PacmanMovementV2`) *(el que acabamos de crear)*
   - speed: `1`
   - currentDirection: `NONE`
   - desiredDirection: `NONE`
   - pixelCounter: `0`
   - velocityX: `0`
   - velocityY: `0`
   - canTurnOnPixel: `true`
   - stopOnWall: `true`
   - allowReverse: `true`
   - tileSize: `8`
   - isEnabled: `true`

7. **PacmanRotationV2** (`comp_PacmanRotationV2`) *(el que acabamos de crear)*
   - rotation: `0`
   - facingDirection: `0`
   - autoRotate: `true`

---

## ⚙️ **MOTOR DE JUEGO ACTUALIZADO**

Una vez creados los componentes, necesitarás actualizar el motor en `ScreenPlayModal.tsx`. 

**Buscar en AVAILABLE_ENGINES y agregar:**

```javascript
pacmanMovementV2: {
    id: 'pacmanMovementV2',
    name: 'Pac-Man Movement Engine V2.0',
    execute: (entities, componentDefinitions, screenMap, entityTemplates, allAssets) => {
        // [CÓDIGO DEL MOTOR AQUÍ - lo proporciono después]
    }
},
```

---

## 🎯 **PASOS PARA IMPLEMENTAR:**

### Paso 1: Crear Componentes
1. Ve a **Component Definition Editor**
2. Click "Add New Component" 
3. Crear `PacmanMovementV2` con las 11 properties
4. Click "Save Component"
5. Crear `PacmanRotationV2` con las 3 properties  
6. Click "Save Component"

### Paso 2: Crear Entidad
1. Ve a **Entity Template Editor**
2. Click "Add New"
3. Crear `PacmanPlayerV2` con los 7 components
4. Click "Save Template"

### Paso 3: Integrar Motor
1. Abrir `ScreenPlayModal.tsx`
2. Agregar el nuevo motor `pacmanMovementV2`
3. Actualizar sistema de detección

¿Quieres que empiece con el **Paso 1** y te ayude a crear el primer componente `PacmanMovementV2`?