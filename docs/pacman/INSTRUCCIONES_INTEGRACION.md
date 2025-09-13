# 🎮 CÓMO INTEGRAR EL MOTOR PAC-MAN MEJORADO

## ✅ Solución al Problema

Tu problema actual: **Las entidades se atascan al intentar girar hacia paredes**

**ANTES:** Entidad intenta girar → colisiona → se queda atascada  
**AHORA:** Sistema verifica alineación + camino libre → solo gira si ambos OK

## 📋 Pasos de Integración

### **PASO 1: Abrir ScreenPlayModal.tsx**
```bash
# Ubicación del archivo
C:\Users\salam\Documents\Programacion\Mideas\components\modals\ScreenPlayModal.tsx
```

### **PASO 2: Localizar el Motor Actual**
- Ve a la **línea 1164**
- Encontrarás: `pacMovement: {`
- Esta es la definición completa del motor actual (líneas 1164-1277)

### **PASO 3: Hacer Backup (Opcional)**
```typescript
// Copia las líneas 1164-1277 a un archivo de respaldo
// Por si quieres volver al sistema anterior
```

### **PASO 4: Reemplazar el Motor**
Reemplaza TODO el contenido desde la línea 1164 hasta la 1277 con:

```typescript
    pacMovement: {
        id: 'pacMovement',
        name: 'Enhanced Pac-Man Movement Engine',
        execute: (entities: any[], componentDefinitions: any[], screenMap?: any) => {
            // Direcciones con nombres consistentes
            const DIRS = {
                NONE: { x: 0, y: 0 },
                LEFT: { x: -1, y: 0 },
                RIGHT: { x: 1, y: 0 },
                UP: { x: 0, y: -1 },
                DOWN: { x: 0, y: 1 }
            };

            // Tolerancia para alineación a la grilla (en píxeles)
            const ALIGNMENT_TOLERANCE = 2;

            /**
             * Verifica si una entidad está alineada a la grilla para poder girar
             */
            const isAlignedToGridForTurning = (entity: any, direction: string, tileSize: number): boolean => {
                const remainderX = entity.x % tileSize;
                const remainderY = entity.y % tileSize;

                if (direction === 'UP' || direction === 'DOWN') {
                    // Para movimiento vertical, debe estar alineado en X
                    return Math.abs(remainderX) < ALIGNMENT_TOLERANCE || 
                           Math.abs(remainderX - tileSize) < ALIGNMENT_TOLERANCE;
                }
                
                if (direction === 'LEFT' || direction === 'RIGHT') {
                    // Para movimiento horizontal, debe estar alineado en Y
                    return Math.abs(remainderY) < ALIGNMENT_TOLERANCE || 
                           Math.abs(remainderY - tileSize) < ALIGNMENT_TOLERANCE;
                }
                
                return false;
            };

            /**
             * Verifica si se puede mover desde una posición alineada a la grilla
             */
            const canMoveFromAlignedPosition = (entity: any, direction: string, tileSize: number, screenMap: any): boolean => {
                if (!direction || direction === 'NONE' || !screenMap?.layers?.collision) return false;

                // Obtener propiedades de hitbox
                const wallCollisionComp = entity.template.components.find(c => c.definitionId === 'comp_wall_collision');
                let hitboxWidth = 16;
                let hitboxHeight = 16;
                let offsetX = 0;
                let offsetY = 0;

                if (wallCollisionComp) {
                    const wallProps = { 
                        ...wallCollisionComp.defaultValues, 
                        ...(entity.instance.componentOverrides?.['comp_wall_collision'] || {}) 
                    };
                    hitboxWidth = Number(wallProps.hitboxWidth) || 16;
                    hitboxHeight = Number(wallProps.hitboxHeight) || 16;
                    offsetX = Number(wallProps.offsetX) || 0;
                    offsetY = Number(wallProps.offsetY) || 0;
                }

                // Calcular posición de prueba alineada
                let testX = entity.x;
                let testY = entity.y;

                switch (direction) {
                    case 'UP':
                        testY = Math.floor(entity.y / tileSize) * tileSize;
                        testX = Math.round(entity.x / tileSize) * tileSize + (tileSize / 2) - (hitboxWidth / 2);
                        testY -= 1;
                        break;
                    case 'DOWN':
                        testY = Math.floor(entity.y / tileSize) * tileSize;
                        testX = Math.round(entity.x / tileSize) * tileSize + (tileSize / 2) - (hitboxWidth / 2);
                        testY += 1;
                        break;
                    case 'LEFT':
                        testX = Math.floor(entity.x / tileSize) * tileSize;
                        testY = Math.round(entity.y / tileSize) * tileSize + (tileSize / 2) - (hitboxHeight / 2);
                        testX -= 1;
                        break;
                    case 'RIGHT':
                        testX = Math.floor(entity.x / tileSize) * tileSize;
                        testY = Math.round(entity.y / tileSize) * tileSize + (tileSize / 2) - (hitboxHeight / 2);
                        testX += 1;
                        break;
                    default:
                        return false;
                }

                // Calcular bounds de hitbox en la posición de prueba
                const left = testX + offsetX;
                const top = testY + offsetY;
                const right = left + hitboxWidth;
                const bottom = top + hitboxHeight;

                // Convertir a coordenadas de tile
                const startTileX = Math.floor(left / tileSize);
                const endTileX = Math.floor((right - 1e-6) / tileSize);
                const startTileY = Math.floor(top / tileSize);
                const endTileY = Math.floor((bottom - 1e-6) / tileSize);

                // Verificar colisión en el área
                for (let ty = startTileY; ty <= endTileY; ty++) {
                    for (let tx = startTileX; tx <= endTileX; tx++) {
                        if (tx < 0 || ty < 0 || tx >= screenMap.width || ty >= screenMap.height) {
                            continue;
                        }
                        
                        const tile = screenMap.layers.collision[ty]?.[tx];
                        if (tile && tile.tileId) {
                            return false; // Pared encontrada
                        }
                    }
                }

                return true; // Camino libre
            };

            /**
             * Alinea una entidad a la grilla para giros limpios
             */
            const snapToGridAlignment = (entity: any, direction: string, tileSize: number) => {
                const wallCollisionComp = entity.template.components.find(c => c.definitionId === 'comp_wall_collision');
                let hitboxWidth = 16;
                let hitboxHeight = 16;

                if (wallCollisionComp) {
                    const wallProps = { 
                        ...wallCollisionComp.defaultValues, 
                        ...(entity.instance.componentOverrides?.['comp_wall_collision'] || {}) 
                    };
                    hitboxWidth = Number(wallProps.hitboxWidth) || 16;
                    hitboxHeight = Number(wallProps.hitboxHeight) || 16;
                }

                if (direction === 'UP' || direction === 'DOWN') {
                    entity.x = Math.round(entity.x / tileSize) * tileSize + (tileSize / 2) - (hitboxWidth / 2);
                } else {
                    entity.y = Math.round(entity.y / tileSize) * tileSize + (tileSize / 2) - (hitboxHeight / 2);
                }
            };

            // Obtener teclas presionadas actuales
            const currentPressedKeys = (window as any).currentPressedKeys || new Set();

            entities.forEach(entity => {
                const pacMovementComp = entity.template.components.find(c => c.definitionId === 'comp_pacMovement');
                if (!pacMovementComp) return;

                const pacProps = { 
                    ...pacMovementComp.defaultValues, 
                    ...(entity.instance.componentOverrides?.['comp_pacMovement'] || {}) 
                };

                if (!pacProps.isEnabled) return;

                // Inicializar datos de movimiento mejorados
                if (!entity.enhancedMovementData) {
                    entity.enhancedMovementData = {
                        currentDir: pacProps.currentDirection || 'NONE',
                        desiredDir: pacProps.desiredDirection || 'NONE',
                        previousInputState: { up: false, down: false, left: false, right: false }
                    };
                }

                const movementData = entity.enhancedMovementData;
                const speed = Number(pacProps.speed) || 2;
                const tileSize = 16;

                // Detectar nueva entrada de dirección (edge-triggered)
                const currentInput = {
                    up: currentPressedKeys.has('ArrowUp') || currentPressedKeys.has('KeyW'),
                    down: currentPressedKeys.has('ArrowDown') || currentPressedKeys.has('KeyS'),
                    left: currentPressedKeys.has('ArrowLeft') || currentPressedKeys.has('KeyA'),
                    right: currentPressedKeys.has('ArrowRight') || currentPressedKeys.has('KeyD')
                };

                let newDesiredDirection = movementData.desiredDir;

                // Detectar nueva pulsación de tecla (edge detection)
                if (currentInput.up && !movementData.previousInputState.up) {
                    newDesiredDirection = 'UP';
                } else if (currentInput.down && !movementData.previousInputState.down) {
                    newDesiredDirection = 'DOWN';
                } else if (currentInput.left && !movementData.previousInputState.left) {
                    newDesiredDirection = 'LEFT';
                } else if (currentInput.right && !movementData.previousInputState.right) {
                    newDesiredDirection = 'RIGHT';
                }

                // Actualizar estado de input anterior
                movementData.previousInputState = { ...currentInput };

                // Intentar cambiar dirección si tenemos una dirección deseada nueva
                if (newDesiredDirection !== 'NONE' && newDesiredDirection !== movementData.currentDir) {
                    const isAligned = isAlignedToGridForTurning(entity, newDesiredDirection, tileSize);
                    const canMove = canMoveFromAlignedPosition(entity, newDesiredDirection, tileSize, screenMap);

                    if (isAligned && canMove) {
                        // Cambiar dirección inmediatamente
                        movementData.currentDir = newDesiredDirection;
                        movementData.desiredDir = 'NONE';
                        
                        // Alinear a la grilla para giros limpios
                        snapToGridAlignment(entity, newDesiredDirection, tileSize);
                        
                        console.log(`🔄 ${entity.template.name} cambió dirección a ${newDesiredDirection} (alineado)`);
                    } else {
                        // Encolar la dirección para más tarde
                        movementData.desiredDir = newDesiredDirection;
                        
                        if (!isAligned) {
                            console.log(`⏳ ${entity.template.name} encoló dirección ${newDesiredDirection} (no alineado)`);
                        } else {
                            console.log(`🚧 ${entity.template.name} encoló dirección ${newDesiredDirection} (camino bloqueado)`);
                        }
                    }
                }

                // Resetear velocidad
                entity.vx = 0;
                entity.vy = 0;

                // Moverse en la dirección actual si es posible
                if (movementData.currentDir !== 'NONE') {
                    const canContinue = canMoveFromAlignedPosition(entity, movementData.currentDir, tileSize, screenMap);

                    if (canContinue) {
                        // Aplicar movimiento
                        entity.vx = DIRS[movementData.currentDir].x * speed;
                        entity.vy = DIRS[movementData.currentDir].y * speed;
                    } else {
                        // No puede continuar, detener
                        console.log(`🛑 ${entity.template.name} se detuvo (pared adelante)`);
                        movementData.currentDir = 'NONE';
                    }
                }

                // Actualizar propiedades del componente para persistencia
                if (!entity.instance.componentOverrides) {
                    entity.instance.componentOverrides = {};
                }
                if (!entity.instance.componentOverrides['comp_pacMovement']) {
                    entity.instance.componentOverrides['comp_pacMovement'] = {};
                }
                
                entity.instance.componentOverrides['comp_pacMovement'].currentDirection = movementData.currentDir;
                entity.instance.componentOverrides['comp_pacMovement'].desiredDirection = movementData.desiredDir;

                // Mantener compatibilidad con el sistema anterior
                if (entity.movementData) {
                    entity.movementData.currentDir = movementData.currentDir;
                    entity.movementData.desiredDir = movementData.desiredDir;
                }
            });
        }
    },
```

### **PASO 5: Guardar y Probar**
1. Guarda el archivo `ScreenPlayModal.tsx`
2. Ve a **Screen Editor**
3. Crea/edita un mapa con tu entidad `tpl_pacman_player`
4. Haz clic en **Play** 
5. ¡Prueba el movimiento mejorado!

## 🎯 Qué Esperar

### **Comportamiento Mejorado:**
- ✅ **No más atascamientos** al intentar girar hacia paredes
- ✅ **Movimiento suave** estilo Pac-Man auténtico  
- ✅ **Encolado de direcciones** - puedes presionar la tecla antes de llegar a la intersección
- ✅ **Alineación automática** - giros limpios en intersecciones
- ✅ **Logs informativos** en consola para debug

### **Logs en Consola:**
```
🔄 PacMan Player cambió dirección a UP (alineado)
⏳ PacMan Player encoló dirección UP (no alineado)  
🚧 PacMan Player encoló dirección UP (camino bloqueado)
🛑 PacMan Player se detuvo (pared adelante)
```

## 🔧 Configuración Opcional

En `defaults.ts` puedes ajustar:
```typescript
comp_pacMovement: {
  speed: 2,        // Velocidad en píxeles/frame
  isEnabled: true  // Activar/desactivar sistema
}

comp_wall_collision: {
  tileSize: 16,    // IMPORTANTE: Debe coincidir con tu tile size
  hitboxWidth: 12, // Tamaño de hitbox
  hitboxHeight: 12
}
```

## ❗ Importante

- **Backup**: Guarda una copia del motor original por si acaso
- **Tile Size**: Asegúrate de que `tileSize: 16` coincida con el tamaño real de tus tiles
- **Hitbox**: Ajusta `hitboxWidth` y `hitboxHeight` según el tamaño de tu sprite
- **Debug**: Abre la consola del navegador para ver los logs de movimiento

## 🆘 Si Algo Sale Mal

1. **Revisa la consola** para mensajes de error
2. **Verifica el tile size** - debe coincidir en wall_collision y el motor
3. **Comprueba la estructura** del mapa de colisión
4. **Restaura el backup** si es necesario

---

**¡Ya no más jugadores atascados en las paredes! 🎉**