/**
 * Enhanced Pac-Man Movement Engine para ScreenPlayModal
 * 
 * Esta es la implementación completa del motor de movimiento Pac-Man
 * que se debe integrar en el sistema de engines del ScreenPlayModal.tsx
 * 
 * INSTRUCCIONES DE INTEGRACIÓN:
 * 1. Reemplazar el engine 'pacMovement' existente en AVAILABLE_ENGINES
 * 2. Asegurar que las funciones auxiliares estén incluidas
 * 3. Verificar que currentPressedKeys esté definido en el scope del modal
 */

// Función auxiliar para alinear a la grilla (agregar antes de AVAILABLE_ENGINES)
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

// ENGINE COMPLETO PARA REEMPLAZAR EN ScreenPlayModal.tsx
const enhancedPacMovementEngine = {
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
                // Hay un tile sólido aquí - asumimos que cualquier tile es sólido
                // Aquí podrías implementar lógica más sofisticada basada en las propiedades del tile
                return false;
            }

            return true; // No hay colisión
        };

        /**
         * Actualiza el contador de píxeles para el sistema de 8 píxeles
         */
        const updatePixelCounter = (entity, speed, tileSize) => {
            if (!entity.pacMovementData) {
                entity.pacMovementData = { pixelCounter: 0 };
            }
            
            entity.pacMovementData.pixelCounter = (entity.pacMovementData.pixelCounter + speed) % tileSize;
            return entity.pacMovementData.pixelCounter;
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
                    
                    // Actualizar contador de píxeles
                    movementData.pixelCounter = updatePixelCounter(entity, speed, tileSize);
                    
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
            entity.instance.componentOverrides['comp_pacMovement'].pixelCounter = movementData.pixelCounter;
        });
    }
};

// EXPORTAR PARA USO EN EL SISTEMA
export default enhancedPacMovementEngine;

/**
 * INSTRUCCIONES PARA INTEGRAR EN ScreenPlayModal.tsx:
 * 
 * 1. En la sección AVAILABLE_ENGINES, reemplazar el engine 'pacMovement' existente con:
 * 
 *    pacMovement: enhancedPacMovementEngine,
 * 
 * 2. Agregar la función snapToGridAlignment antes de la definición de AVAILABLE_ENGINES:
 * 
 *    const snapToGridAlignment = (entity, direction, tileSize) => {
 *        // ... código de la función
 *    };
 * 
 * 3. Asegurar que currentPressedKeys esté definido en el scope del modal
 * 
 * 4. El sistema debería funcionar automáticamente con entidades que tengan comp_pacMovement
 */