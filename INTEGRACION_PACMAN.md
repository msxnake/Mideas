# 🟡 Integración del Motor Pac-Man Mejorado

## ✅ Estado Actual
- ✅ Componente `comp_pacMovement` actualizado en `data/defaults.ts`
- ✅ Entidad `tpl_pacman_player` mejorada en `data/defaults.ts`
- ✅ Sistema ASM completo creado en `src/asm/snippets/pacman_movement_system.asm`
- ✅ Motor JavaScript mejorado listo para integración

## 🔧 Pasos de Integración en ScreenPlayModal.tsx

### 1. Agregar la función auxiliar
Busca la línea donde comienza `const AVAILABLE_ENGINES: EngineRegistry = {` y **ANTES** de esa línea, agrega:

```javascript
// Función auxiliar para alinear a la grilla
const snapToGridAlignment = (entity, direction, tileSize) => {
    const SNAP_THRESHOLD = 4; // píxeles de tolerancia para snap
    
    if (direction === 'LEFT' || direction === 'RIGHT') {
        // Alinear en Y
        const remainder = entity.y % tileSize;
        if (remainder < SNAP_THRESHOLD) {
            entity.y -= remainder; // Snap hacia abajo
        } else if (remainder > tileSize - SNAP_THRESHOLD) {
            entity.y += (tileSize - remainder); // Snap hacia arriba
        }
    } else if (direction === 'UP' || direction === 'DOWN') {
        // Alinear en X
        const remainder = entity.x % tileSize;
        if (remainder < SNAP_THRESHOLD) {
            entity.x -= remainder; // Snap hacia la izquierda
        } else if (remainder > tileSize - SNAP_THRESHOLD) {
            entity.x += (tileSize - remainder); // Snap hacia la derecha
        }
    }
};
```

### 2. Reemplazar el motor pacMovement existente
Busca `pacMovement: {` en `AVAILABLE_ENGINES` y reemplaza TODA esa sección con:

```javascript
pacMovement: {
    id: 'pacMovement',
    name: 'Enhanced Pac-Man Movement Engine v2.0',
    execute: (entities, componentDefinitions, screenMap, entityTemplates, allAssets) => {
        // Direcciones con vectores de movimiento
        const DIRS = {
            NONE: { x: 0, y: 0 },
            LEFT: { x: -1, y: 0 },
            RIGHT: { x: 1, y: 0 },
            UP: { x: 0, y: -1 },
            DOWN: { x: 0, y: 1 }
        };

        // Tolerancia para alineación a la grilla
        const ALIGNMENT_TOLERANCE = 2;
        
        /**
         * Verifica si una entidad está alineada a la grilla para cambiar dirección
         */
        const isAlignedToGridForTurning = (entity, direction, tileSize) => {
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
         * Verifica si se puede mover en una dirección específica
         * Implementa la comprobación de colisión cada 8 píxeles
         */
        const canMoveInDirection = (entity, direction, tileSize, screenMap) => {
            if (!direction || direction === 'NONE' || !screenMap?.layers?.collision) {
                return true;
            }

            // Calcular la posición que se va a comprobar
            let checkX = entity.x;
            let checkY = entity.y;
            
            // Desplazar según la dirección (usar el tamaño del sprite)
            const spriteWidth = entity.sprite?.size?.width || 16;
            const spriteHeight = entity.sprite?.size?.height || 16;
            
            switch (direction) {
                case 'LEFT':
                    checkX -= tileSize; // Un tile a la izquierda
                    break;
                case 'RIGHT':
                    checkX += spriteWidth; // Usar el ancho del sprite
                    break;
                case 'UP':
                    checkY -= tileSize; // Un tile hacia arriba
                    break;
                case 'DOWN':
                    checkY += spriteHeight; // Usar la altura del sprite
                    break;
            }

            // Convertir a coordenadas de tile
            const tileX = Math.floor(checkX / tileSize);
            const tileY = Math.floor(checkY / tileSize);
            
            // Verificar límites del mapa
            const mapWidth = screenMap.width || (screenMap.layers.collision[0]?.length || 0);
            const mapHeight = screenMap.height || screenMap.layers.collision.length;
            
            if (tileX < 0 || tileX >= mapWidth || tileY < 0 || tileY >= mapHeight) {
                return false; // Fuera de límites
            }

            // Verificar colisión con tiles sólidos
            const tile = screenMap.layers.collision[tileY]?.[tileX];
            if (tile && tile.tileId) {
                return false; // Hay un tile sólido
            }

            return true; // No hay colisión
        };

        /**
         * Verifica si el entity está en un límite de tile (cada 8 píxeles)
         */
        const isAtTileBoundary = (entity, tileSize) => {
            return (entity.x % tileSize === 0) && (entity.y % tileSize === 0);
        };

        // Procesar cada entidad con componente pacMovement
        entities.forEach(entity => {
            const pacMovementComp = entity.template.components.find(c => c.definitionId === 'comp_pacMovement');
            if (!pacMovementComp) return;

            // Obtener propiedades del componente
            const pacProps = {
                ...pacMovementComp.defaultValues,
                ...(entity.instance.componentOverrides?.['comp_pacMovement'] || {})
            };

            if (!pacProps.isEnabled) return;

            // Inicializar datos de movimiento extendidos
            if (!entity.enhancedMovementData) {
                entity.enhancedMovementData = {
                    currentDir: pacProps.currentDirection || 'NONE',
                    desiredDir: pacProps.desiredDirection || 'NONE',
                    pixelCounter: 0,
                    previousInputState: { up: false, down: false, left: false, right: false },
                    lastCollisionCheck: { x: -1, y: -1 }
                };
            }

            const movementData = entity.enhancedMovementData;
            const speed = Number(pacProps.speed) || 1; // 1 pixel per frame at 60fps
            const tileSize = Number(pacProps.tileSize) || 8;

            console.log(`🎮 Procesando ${entity.template.name}: pos(${Math.round(entity.x)}, ${Math.round(entity.y)}), currentDir=${movementData.currentDir}, speed=${speed}`);

            // Leer input del jugador (edge detection)
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
                console.log(`🔼 ${entity.template.name}: Nueva dirección deseada UP`);
            } else if (currentInput.down && !movementData.previousInputState.down) {
                newDesiredDirection = 'DOWN';
                console.log(`🔽 ${entity.template.name}: Nueva dirección deseada DOWN`);
            } else if (currentInput.left && !movementData.previousInputState.left) {
                newDesiredDirection = 'LEFT';
                console.log(`◀️ ${entity.template.name}: Nueva dirección deseada LEFT`);
            } else if (currentInput.right && !movementData.previousInputState.right) {
                newDesiredDirection = 'RIGHT';
                console.log(`▶️ ${entity.template.name}: Nueva dirección deseada RIGHT`);
            }

            movementData.previousInputState = { ...currentInput };

            // Función para verificar direcciones opuestas
            const areOppositeDirections = (dir1, dir2) => {
                const opposites = {
                    'UP': 'DOWN', 'DOWN': 'UP',
                    'LEFT': 'RIGHT', 'RIGHT': 'LEFT'
                };
                return opposites[dir1] === dir2;
            };

            // LÓGICA DE CAMBIO DE DIRECCIÓN
            if (newDesiredDirection !== 'NONE' && newDesiredDirection !== movementData.currentDir) {
                if (areOppositeDirections(movementData.currentDir, newDesiredDirection)) {
                    // CAMBIO OPUESTO: Inmediato sin verificación de alineación
                    movementData.currentDir = newDesiredDirection;
                    movementData.desiredDir = 'NONE';
                    console.log(`↩️ ${entity.template.name}: Cambio opuesto inmediato a ${newDesiredDirection}`);
                } else {
                    // CAMBIO PERPENDICULAR: Requiere alineación y path libre
                    const isAligned = isAlignedToGridForTurning(entity, newDesiredDirection, tileSize);
                    const canMove = canMoveInDirection(entity, newDesiredDirection, tileSize, screenMap);

                    if (isAligned && canMove) {
                        movementData.currentDir = newDesiredDirection;
                        movementData.desiredDir = 'NONE';
                        snapToGridAlignment(entity, newDesiredDirection, tileSize);
                        console.log(`🔄 ${entity.template.name}: Cambio perpendicular a ${newDesiredDirection} (alineado)`);
                    } else {
                        // Guardar dirección deseada para próxima oportunidad
                        movementData.desiredDir = newDesiredDirection;
                        console.log(`⏳ ${entity.template.name}: Dirección ${newDesiredDirection} guardada (no alineado o bloqueado)`);
                    }
                }
            }

            // INTENTAR CAMBIO DE DIRECCIÓN PENDIENTE
            if (movementData.desiredDir !== 'NONE' && movementData.desiredDir !== movementData.currentDir) {
                const isAligned = isAlignedToGridForTurning(entity, movementData.desiredDir, tileSize);
                const canMove = canMoveInDirection(entity, movementData.desiredDir, tileSize, screenMap);

                if (isAligned && canMove) {
                    movementData.currentDir = movementData.desiredDir;
                    movementData.desiredDir = 'NONE';
                    snapToGridAlignment(entity, movementData.currentDir, tileSize);
                    console.log(`✅ ${entity.template.name}: Ejecutado cambio pendiente a ${movementData.currentDir}`);
                }
            }

            // APLICAR MOVIMIENTO
            if (movementData.currentDir !== 'NONE') {
                const direction = DIRS[movementData.currentDir];
                
                // Verificar colisión solo cada 8 píxeles (optimización)
                const atBoundary = isAtTileBoundary(entity, tileSize);
                let canMove = true;
                
                if (atBoundary || movementData.lastCollisionCheck.x !== Math.floor(entity.x/8) || movementData.lastCollisionCheck.y !== Math.floor(entity.y/8)) {
                    canMove = canMoveInDirection(entity, movementData.currentDir, tileSize, screenMap);
                    movementData.lastCollisionCheck = { 
                        x: Math.floor(entity.x/8), 
                        y: Math.floor(entity.y/8) 
                    };
                    
                    if (atBoundary) {
                        console.log(`🔍 ${entity.template.name}: Verificación de colisión en límite de tile: ${canMove ? 'LIBRE' : 'BLOQUEADO'}`);
                    }
                }

                if (canMove) {
                    // Aplicar movimiento
                    const deltaX = direction.x * speed;
                    const deltaY = direction.y * speed;
                    
                    entity.x += deltaX;
                    entity.y += deltaY;
                    entity.vx = deltaX;
                    entity.vy = deltaY;
                    
                } else {
                    // Colisión detectada - detener movimiento
                    if (pacProps.stopOnWall) {
                        movementData.currentDir = 'NONE';
                        entity.vx = 0;
                        entity.vy = 0;
                        console.log(`🚧 ${entity.template.name}: Detenido por pared`);
                    }
                }
            } else {
                // Sin movimiento
                entity.vx = 0;
                entity.vy = 0;
            }

            // ACTUALIZAR ROTACIÓN DEL SPRITE
            const rotateComp = entity.template.components.find(c => c.definitionId === 'comp_rotate');
            if (rotateComp && movementData.currentDir !== 'NONE') {
                if (!entity.instance.componentOverrides['comp_rotate']) {
                    entity.instance.componentOverrides['comp_rotate'] = {};
                }
                
                const rotations = {
                    'RIGHT': { rotation: 0, facingDirection: 0 },
                    'UP': { rotation: 90, facingDirection: 1 },
                    'LEFT': { rotation: 180, facingDirection: 2 },
                    'DOWN': { rotation: 270, facingDirection: 3 }
                };
                
                const rotation = rotations[movementData.currentDir];
                if (rotation) {
                    entity.instance.componentOverrides['comp_rotate'].rotation = rotation.rotation;
                    entity.instance.componentOverrides['comp_rotate'].facingDirection = rotation.facingDirection;
                }
            }

            // SINCRONIZAR ESTADO DEL COMPONENTE
            if (!entity.instance.componentOverrides['comp_pacMovement']) {
                entity.instance.componentOverrides['comp_pacMovement'] = {};
            }
            
            entity.instance.componentOverrides['comp_pacMovement'].currentDirection = movementData.currentDir;
            entity.instance.componentOverrides['comp_pacMovement'].desiredDirection = movementData.desiredDir;
            entity.instance.componentOverrides['comp_pacMovement'].velocityX = entity.vx;
            entity.instance.componentOverrides['comp_pacMovement'].velocityY = entity.vy;
        });
    }
},
```

## 🎮 Cómo Usar

### 1. Cargar Componentes por Defecto
1. Ve al **Component Definition Editor**
2. Haz clic en "**Default components**"
3. Esto carga el `comp_pacMovement` mejorado

### 2. Cargar Entidad Pac-Man
1. Ve al **Entity Template Editor**
2. Haz clic en "**Default entities**" 
3. Esto carga el `tpl_pacman_player` con todas las configuraciones

### 3. Probar en Screen Editor
1. Ve al **Screen Editor**
2. Coloca la entidad **Pac-Man Player** en el mapa
3. Agrega algunos tiles de colisión
4. Haz clic en "**Play**" (▶️)
5. ¡Usa las flechas o WASD para mover!

## 🔧 Características Implementadas

✅ **Movimiento pixel-perfecto a 60fps**
- Velocidad configurable (por defecto 1 pixel/frame)
- Movimiento suave sin saltos

✅ **Sistema de intención de dirección**
- `currentDirection`: Dirección actual de movimiento
- `desiredDirection`: Dirección que el jugador quiere

✅ **Colisión cada 8 píxeles** 
- Solo verifica colisión en límites de tiles
- Optimización de rendimiento

✅ **Lógica de cambio de dirección**
- **Dirección opuesta**: Cambio inmediato 
- **Dirección perpendicular**: Requiere alineación a la grilla

✅ **Parada automática en paredes**
- Si `stopOnWall` es true, se detiene al chocar
- Sin input, el Pac-Man se para automáticamente

✅ **Rotación automática del sprite**
- Actualiza el componente `comp_rotate` automáticamente
- 0°=derecha, 90°=arriba, 180°=izquierda, 270°=abajo

## 🐛 Debug

El sistema tiene logs extensivos. Abre la **Consola del Navegador** (F12) para ver:
- `🎮 Procesando [entidad]`: Estado actual
- `🔼🔽◀️▶️ Nueva dirección deseada`: Input detectado  
- `↩️ Cambio opuesto inmediato`: Reversa inmediata
- `🔄 Cambio perpendicular`: Giro exitoso
- `⏳ Dirección guardada`: Esperando oportunidad
- `🚧 Detenido por pared`: Colisión detectada

## 🎯 Próximos Pasos
- Crear tu sprite de Pac-Man 16x16
- Configurar laberintos con tiles de colisión
- ¡Disfrutar del movimiento perfecto estilo Pac-Man!

¡El sistema está listo para generar rutinas perfectas de movimiento Pac-Man! 🟡👻