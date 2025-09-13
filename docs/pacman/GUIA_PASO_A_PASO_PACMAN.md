# 🟡 GUÍA PASO A PASO - CREAR PAC-MAN DESDE CERO

## ✅ **PASO 1: CREAR PRIMER COMPONENTE**

### 1.1 Abrir Component Definition Editor
- Ve al menú y selecciona **Component Definition Editor**

### 1.2 Crear PacmanMovementV2
1. Click **"Add New Component"**
2. **Component Name:** `PacmanMovementV2`
3. **Description:** `Advanced Pac-Man movement system with pixel-perfect collision detection every 8 pixels, direction intention system, and 60fps smooth movement for MSX games.`
4. Click **"Save Component"** (para guardar básico primero)

### 1.3 Agregar Properties (11 properties)
Para cada property, click **"Add Property"** y agregar:

**Property 1:**
- Name: `speed`
- Type: `byte`  
- Default Value: `1`
- Description: `Movement speed in pixels per frame at 60fps`

**Property 2:**
- Name: `currentDirection`
- Type: `string`
- Default Value: `NONE`
- Description: `Current movement direction: NONE, LEFT, RIGHT, UP, DOWN`

**Property 3:**
- Name: `desiredDirection`
- Type: `string`
- Default Value: `NONE`
- Description: `Player's desired direction for next turn opportunity`

**Property 4:**
- Name: `pixelCounter`
- Type: `byte`
- Default Value: `0`
- Description: `Position counter relative to 8x8 character grid (0-7)`

**Property 5:**
- Name: `velocityX`
- Type: `byte`
- Default Value: `0`
- Description: `Current horizontal velocity (-speed to +speed)`

**Property 6:**
- Name: `velocityY`
- Type: `byte`
- Default Value: `0`
- Description: `Current vertical velocity (-speed to +speed)`

**Property 7:**
- Name: `canTurnOnPixel`
- Type: `boolean`
- Default Value: `true`
- Description: `Whether direction changes are allowed on current pixel`

**Property 8:**
- Name: `stopOnWall`
- Type: `boolean`
- Default Value: `true`
- Description: `Stop movement when hitting wall if no input pressed`

**Property 9:**
- Name: `allowReverse`
- Type: `boolean`
- Default Value: `true`
- Description: `Allow immediate reverse direction without collision check`

**Property 10:**
- Name: `tileSize`
- Type: `byte`
- Default Value: `8`
- Description: `Size of tiles for collision checking (8x8 for MSX)`

**Property 11:**
- Name: `isEnabled`
- Type: `boolean`
- Default Value: `true`
- Description: `Whether Pac-Man movement system is active`

### 1.4 Guardar Componente
- Click **"Save Component"** final

---

## ✅ **PASO 2: CREAR SEGUNDO COMPONENTE**

### 2.1 Crear PacmanRotationV2
1. Click **"Add New Component"**
2. **Component Name:** `PacmanRotationV2`
3. **Description:** `Automatic sprite rotation based on Pac-Man movement direction with MSX-compatible angles.`

### 2.2 Agregar Properties (3 properties)

**Property 1:**
- Name: `rotation`
- Type: `byte`
- Default Value: `0`
- Description: `Current rotation angle: 0=right, 90=up, 180=left, 270=down`

**Property 2:**
- Name: `facingDirection`
- Type: `byte`
- Default Value: `0`
- Description: `Current facing direction: 0=right, 1=up, 2=left, 3=down`

**Property 3:**
- Name: `autoRotate`
- Type: `boolean`
- Default Value: `true`
- Description: `Automatically rotate sprite based on movement direction`

### 2.3 Guardar Componente
- Click **"Save Component"**

---

## ✅ **PASO 3: CREAR ENTIDAD PAC-MAN**

### 3.1 Abrir Entity Template Editor
- Ve al menú y selecciona **Entity Template Editor**

### 3.2 Crear Nueva Entidad
1. Click **"Add New"**
2. **Template Name:** `PacmanPlayerV2`
3. **Icon:** `🟡` (copia y pega este emoji)
4. **Description:** `Advanced Pac-Man player with pixel-perfect movement, 8-pixel collision checks, direction intention system, and 60fps smooth movement. Optimized for MSX Screen 2 mode with 16x16 sprites.`

### 3.3 Agregar Componentes (7 componentes)
Para cada componente, click **"Add Component"**:

**Componente 1: Position**
- Seleccionar: `Position (comp_pos)`
- Properties:
  - x: `32`
  - y: `32`

**Componente 2: Renderable**
- Seleccionar: `Renderable (comp_render)`
- Properties:
  - spriteAssetId: `pacman_sprite_16x16`
  - isVisible: `true`
  - layer: `1`

**Componente 3: Health**
- Seleccionar: `Health (comp_health)`
- Properties:
  - current: `3`
  - max: `3`

**Componente 4: Wall Collision**
- Seleccionar: `Wall Collision (comp_wall_collision)`
- Properties:
  - hitboxWidth: `16`
  - hitboxHeight: `16`
  - offsetX: `0`
  - offsetY: `0`
  - tileSize: `8`
  - stopOnCollision: `true`

**Componente 5: PlayerInput**
- Seleccionar: `PlayerInput (comp_player_input)`
- Properties:
  - controllerId: `0`
  - inputEnabled: `true`

**Componente 6: PacmanMovementV2**
- Seleccionar: `PacmanMovementV2` (el que creamos)
- Properties:
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

**Componente 7: PacmanRotationV2**
- Seleccionar: `PacmanRotationV2` (el que creamos)
- Properties:
  - rotation: `0`
  - facingDirection: `0`
  - autoRotate: `true`

### 3.4 Guardar Entidad
- Click **"Save Template"**

---

## ✅ **PASO 4: INTEGRAR MOTOR EN SCREENPLAYMODAL**

### 4.1 Abrir el archivo
- Abrir: `components/modals/ScreenPlayModal.tsx`

### 4.2 Agregar función auxiliar
Buscar la línea que dice `const AVAILABLE_ENGINES: EngineRegistry = {`

**ANTES** de esa línea, agregar:

```javascript
// Función auxiliar para alineación Pac-Man V2
const snapToGridAlignmentV2 = (entity, direction, tileSize) => {
    const SNAP_THRESHOLD = 4;
    
    if (direction === 'LEFT' || direction === 'RIGHT') {
        const remainder = entity.y % tileSize;
        if (remainder < SNAP_THRESHOLD) {
            entity.y -= remainder;
        } else if (remainder > tileSize - SNAP_THRESHOLD) {
            entity.y += (tileSize - remainder);
        }
    } else if (direction === 'UP' || direction === 'DOWN') {
        const remainder = entity.x % tileSize;
        if (remainder < SNAP_THRESHOLD) {
            entity.x -= remainder;
        } else if (remainder > tileSize - SNAP_THRESHOLD) {
            entity.x += (tileSize - remainder);
        }
    }
};
```

### 4.3 Agregar motor a AVAILABLE_ENGINES
Dentro del objeto `AVAILABLE_ENGINES`, agregar (después del último engine):

```javascript
pacmanMovementV2: {
    id: 'pacmanMovementV2',
    name: 'Pac-Man Movement Engine V2.0',
    execute: (entities, componentDefinitions, screenMap, entityTemplates, allAssets) => {
        // [COPIAR TODO EL CÓDIGO DEL ARCHIVO MOTOR_PACMAN_V2.js AQUÍ]
        // Es el contenido de la función execute del archivo que creé
    }
},
```

### 4.4 Actualizar detección de engines
Buscar la función `detectRequiredEngines` y agregar:

```javascript
case 'comp_PacmanMovementV2':
    requiredEngines.add('pacmanMovementV2');
    break;
```

---

## ✅ **PASO 5: PROBAR EL SISTEMA**

### 5.1 Crear un mapa de prueba
1. Ve al **Screen Editor**
2. Crea un nuevo mapa o usa uno existente
3. Agrega algunos tiles de colisión (walls)
4. Coloca la entidad `PacmanPlayerV2` en el mapa

### 5.2 Probar movimiento
1. Click en **"Play"** (▶️) en el Screen Editor
2. Usa las teclas:
   - **Flechas** o **WASD** para mover
   - Observa el comportamiento en la consola (F12)

### 5.3 Crear sprite Pac-Man
1. Ve al **Sprite Editor**
2. Crea un sprite de **16x16 pixels**
3. Nómbralo `pacman_sprite_16x16`
4. Haz un diseño simple de Pac-Man
5. Ve al Entity Template y actualiza el spriteAssetId

---

## 🔧 **CARACTERÍSTICAS ESPERADAS:**

✅ **Movimiento suave:** 1 pixel por frame a 60fps  
✅ **Cambio opuesto:** Inmediato (sin esperar alineación)  
✅ **Cambio perpendicular:** Solo en intersecciones (8x8 tiles)  
✅ **Colisión:** Verificada cada 8 píxeles  
✅ **Parada:** Automática al chocar con paredes  
✅ **Rotación:** Sprite gira según dirección  

---

## 🐛 **DEBUG:**

Abre la **Consola del Navegador (F12)** para ver logs:
- `🎮 Ejecutando Pac-Man Movement Engine V2.0`
- `🟡 Procesando entidad Pac-Man`
- `⬆️⬇️⬅️➡️ Quiere ir [DIRECTION]`
- `🔄 Cambio opuesto a [DIRECTION]`
- `✅ Giró a [DIRECTION]`
- `🛑 Detenido por pared`

---

## 📋 **CHECKLIST DE IMPLEMENTACIÓN:**

- [ ] Crear `PacmanMovementV2` (11 properties)
- [ ] Crear `PacmanRotationV2` (3 properties) 
- [ ] Crear `PacmanPlayerV2` (7 componentes)
- [ ] Agregar función `snapToGridAlignmentV2` 
- [ ] Agregar motor `pacmanMovementV2`
- [ ] Actualizar `detectRequiredEngines`
- [ ] Probar en Screen Editor → Play
- [ ] Crear sprite 16x16
- [ ] ¡Disfrutar del Pac-Man perfecto!

¡Con estos pasos tendrás un sistema Pac-Man completamente funcional desde cero! 🟡👻