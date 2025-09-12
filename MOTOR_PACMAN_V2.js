/**
 * MOTOR PAC-MAN V2.0 - Para componentes nuevos
 * 
 * Este es el motor que debes agregar a ScreenPlayModal.tsx
 * en la sección AVAILABLE_ENGINES después de crear los componentes.
 */

// FUNCIÓN AUXILIAR (agregar antes de AVAILABLE_ENGINES)
const snapToGridAlignmentV2 = (entity, direction, tileSize) => {
    const SNAP_THRESHOLD = 4;
    
    if (direction === 'LEFT' || direction === 'RIGHT') {
        // Alinear en Y para movimiento horizontal
        const remainder = entity.y % tileSize;
        if (remainder < SNAP_THRESHOLD) {
            entity.y -= remainder;
        } else if (remainder > tileSize - SNAP_THRESHOLD) {
            entity.y += (tileSize - remainder);
        }
    } else if (direction === 'UP' || direction === 'DOWN') {
        // Alinear en X para movimiento vertical
        const remainder = entity.x % tileSize;
        if (remainder < SNAP_THRESHOLD) {
            entity.x -= remainder;
        } else if (remainder > tileSize - SNAP_THRESHOLD) {
            entity.x += (tileSize - remainder);
        }
    }
};

// MOTOR PRINCIPAL (agregar en AVAILABLE_ENGINES)
const pacmanMovementV2Engine = {
    id: 'pacmanMovementV2',
    name: 'Pac-Man Movement Engine V2.0 - New Components',
    execute: (entities, componentDefinitions, screenMap, entityTemplates, allAssets) => {
        console.log('🎮 Ejecutando Pac-Man Movement Engine V2.0');
        
        // Direcciones con vectores de movimiento
        const DIRS = {
            NONE: { x: 0, y: 0 },
            LEFT: { x: -1, y: 0 },
            RIGHT: { x: 1, y: 0 },
            UP: { x: 0, y: -1 },
            DOWN: { x: 0, y: 1 }
        };

        const ALIGNMENT_TOLERANCE = 3;
        
        // Función para verificar alineación a la grilla
        const isAlignedForTurning = (entity, direction, tileSize) => {
            const remainderX = entity.x % tileSize;
            const remainderY = entity.y % tileSize;

            if (direction === 'UP' || direction === 'DOWN') {
                return Math.abs(remainderX) < ALIGNMENT_TOLERANCE || 
                       Math.abs(remainderX - tileSize) < ALIGNMENT_TOLERANCE;
            }
            
            if (direction === 'LEFT' || direction === 'RIGHT') {
                return Math.abs(remainderY) < ALIGNMENT_TOLERANCE || 
                       Math.abs(remainderY - tileSize) < ALIGNMENT_TOLERANCE;
            }
            
            return false;
        };

        // Función para verificar si puede moverse en una dirección
        const canMoveInDirectionV2 = (entity, direction, tileSize, screenMap) => {
            if (!direction || direction === 'NONE' || !screenMap?.layers?.collision) {
                return true;
            }

            let checkX = entity.x;
            let checkY = entity.y;
            
            const spriteWidth = entity.sprite?.size?.width || 16;
            const spriteHeight = entity.sprite?.size?.height || 16;
            
            switch (direction) {
                case 'LEFT':
                    checkX -= tileSize;
                    break;
                case 'RIGHT':
                    checkX += spriteWidth;
                    break;
                case 'UP':
                    checkY -= tileSize;
                    break;
                case 'DOWN':
                    checkY += spriteHeight;
                    break;
            }

            const tileX = Math.floor(checkX / tileSize);
            const tileY = Math.floor(checkY / tileSize);
            
            const mapWidth = screenMap.width || (screenMap.layers.collision[0]?.length || 0);
            const mapHeight = screenMap.height || screenMap.layers.collision.length;
            
            if (tileX < 0 || tileX >= mapWidth || tileY < 0 || tileY >= mapHeight) {
                return false;
            }

            const tile = screenMap.layers.collision[tileY]?.[tileX];
            return !(tile && tile.tileId);
        };

        // Función para verificar si está en límite de tile
        const isAtTileBoundary = (entity, tileSize) => {
            return (entity.x % tileSize === 0) && (entity.y % tileSize === 0);
        };

        // Procesar entidades
        entities.forEach(entity => {
            // Buscar componente PacmanMovementV2
            const pacMovementComp = entity.template.components.find(c => c.definitionId === 'comp_PacmanMovementV2');
            if (!pacMovementComp) {
                // También buscar por nombre del componente
                const compDef = componentDefinitions.find(cd => cd.name === 'PacmanMovementV2');
                if (compDef) {
                    const hasComp = entity.template.components.find(c => c.definitionId === compDef.id);
                    if (!hasComp) return;
                } else {
                    return; // No tiene el componente
                }
            }

            console.log(`🟡 Procesando entidad Pac-Man: ${entity.template.name}`);

            // Obtener propiedades del componente (buscar por ID o por nombre)
            let pacProps = {};
            if (pacMovementComp) {
                pacProps = {
                    ...pacMovementComp.defaultValues,
                    ...(entity.instance.componentOverrides?.[pacMovementComp.definitionId] || {})
                };
            } else {
                // Buscar por nombre de componente
                const compDef = componentDefinitions.find(cd => cd.name === 'PacmanMovementV2');
                if (compDef) {
                    const templateComp = entity.template.components.find(c => c.definitionId === compDef.id);
                    if (templateComp) {
                        pacProps = {
                            ...templateComp.defaultValues,
                            ...(entity.instance.componentOverrides?.[compDef.id] || {})
                        };
                    }
                }
            }

            if (!pacProps.isEnabled) {
                console.log(`⏸️ Pac-Man movement deshabilitado para ${entity.template.name}`);
                return;
            }

            // Inicializar datos de movimiento
            if (!entity.pacmanDataV2) {
                entity.pacmanDataV2 = {
                    currentDir: pacProps.currentDirection || 'NONE',
                    desiredDir: pacProps.desiredDirection || 'NONE',
                    pixelCounter: Number(pacProps.pixelCounter) || 0,
                    previousInput: { up: false, down: false, left: false, right: false },
                    lastCollisionPos: { x: -1, y: -1 }
                };
            }

            const movementData = entity.pacmanDataV2;
            const speed = Number(pacProps.speed) || 1;
            const tileSize = Number(pacProps.tileSize) || 8;

            console.log(`📍 ${entity.template.name} en (${Math.round(entity.x)}, ${Math.round(entity.y)}) dir=${movementData.currentDir} vel=${speed}`);

            // Leer input del teclado
            const currentInput = {
                up: currentPressedKeys.has('ArrowUp') || currentPressedKeys.has('KeyW'),
                down: currentPressedKeys.has('ArrowDown') || currentPressedKeys.has('KeyS'),
                left: currentPressedKeys.has('ArrowLeft') || currentPressedKeys.has('KeyA'),
                right: currentPressedKeys.has('ArrowRight') || currentPressedKeys.has('KeyD')
            };

            let newDesiredDirection = movementData.desiredDir;

            // Detectar nuevas pulsaciones (edge detection)
            if (currentInput.up && !movementData.previousInput.up) {
                newDesiredDirection = 'UP';
                console.log(`⬆️ ${entity.template.name}: Quiere ir UP`);
            } else if (currentInput.down && !movementData.previousInput.down) {
                newDesiredDirection = 'DOWN';
                console.log(`⬇️ ${entity.template.name}: Quiere ir DOWN`);
            } else if (currentInput.left && !movementData.previousInput.left) {
                newDesiredDirection = 'LEFT';
                console.log(`⬅️ ${entity.template.name}: Quiere ir LEFT`);
            } else if (currentInput.right && !movementData.previousInput.right) {
                newDesiredDirection = 'RIGHT';
                console.log(`➡️ ${entity.template.name}: Quiere ir RIGHT`);
            }

            movementData.previousInput = { ...currentInput };

            // Verificar direcciones opuestas
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
                    // Cambio opuesto inmediato
                    movementData.currentDir = newDesiredDirection;
                    movementData.desiredDir = 'NONE';
                    console.log(`🔄 ${entity.template.name}: Cambio opuesto a ${newDesiredDirection}`);
                } else {
                    // Cambio perpendicular - requiere alineación
                    const isAligned = isAlignedForTurning(entity, newDesiredDirection, tileSize);
                    const canMove = canMoveInDirectionV2(entity, newDesiredDirection, tileSize, screenMap);

                    if (isAligned && canMove) {
                        movementData.currentDir = newDesiredDirection;
                        movementData.desiredDir = 'NONE';
                        snapToGridAlignmentV2(entity, newDesiredDirection, tileSize);
                        console.log(`✅ ${entity.template.name}: Giró a ${newDesiredDirection}`);
                    } else {
                        movementData.desiredDir = newDesiredDirection;
                        console.log(`⏳ ${entity.template.name}: Esperando para girar a ${newDesiredDirection} (aligned=${isAligned}, canMove=${canMove})`);
                    }
                }
            }

            // Intentar dirección pendiente
            if (movementData.desiredDir !== 'NONE' && movementData.desiredDir !== movementData.currentDir) {
                const isAligned = isAlignedForTurning(entity, movementData.desiredDir, tileSize);
                const canMove = canMoveInDirectionV2(entity, movementData.desiredDir, tileSize, screenMap);

                if (isAligned && canMove) {
                    movementData.currentDir = movementData.desiredDir;
                    movementData.desiredDir = 'NONE';
                    snapToGridAlignmentV2(entity, movementData.currentDir, tileSize);
                    console.log(`🎯 ${entity.template.name}: Ejecutó giro pendiente a ${movementData.currentDir}`);
                }
            }

            // APLICAR MOVIMIENTO
            if (movementData.currentDir !== 'NONE') {
                const direction = DIRS[movementData.currentDir];
                
                // Verificar colisión (optimizado: solo en límites de tile)
                const atBoundary = isAtTileBoundary(entity, tileSize);
                let canMove = true;
                
                const currentTileX = Math.floor(entity.x / tileSize);
                const currentTileY = Math.floor(entity.y / tileSize);
                
                if (atBoundary || 
                    movementData.lastCollisionPos.x !== currentTileX || 
                    movementData.lastCollisionPos.y !== currentTileY) {
                    
                    canMove = canMoveInDirectionV2(entity, movementData.currentDir, tileSize, screenMap);
                    movementData.lastCollisionPos = { x: currentTileX, y: currentTileY };
                    
                    if (atBoundary) {
                        console.log(`🔍 ${entity.template.name}: Check colisión = ${canMove ? 'LIBRE' : 'BLOQUEADO'}`);
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
                    movementData.pixelCounter = (movementData.pixelCounter + speed) % tileSize;
                    
                } else {
                    // Colisión - detener si configurado
                    if (pacProps.stopOnWall) {
                        movementData.currentDir = 'NONE';
                        entity.vx = 0;
                        entity.vy = 0;
                        console.log(`🛑 ${entity.template.name}: Detenido por pared`);
                    }
                }
            } else {
                // Sin movimiento
                entity.vx = 0;
                entity.vy = 0;
            }

            // ACTUALIZAR ROTACIÓN (buscar componente PacmanRotationV2)
            const rotationComp = entity.template.components.find(c => {
                const compDef = componentDefinitions.find(cd => cd.id === c.definitionId);
                return compDef && compDef.name === 'PacmanRotationV2';
            });
            
            if (rotationComp && movementData.currentDir !== 'NONE') {
                const compDef = componentDefinitions.find(cd => cd.id === rotationComp.definitionId);
                if (compDef) {
                    if (!entity.instance.componentOverrides[compDef.id]) {
                        entity.instance.componentOverrides[compDef.id] = {};
                    }
                    
                    const rotations = {
                        'RIGHT': { rotation: 0, facingDirection: 0 },
                        'UP': { rotation: 90, facingDirection: 1 },
                        'LEFT': { rotation: 180, facingDirection: 2 },
                        'DOWN': { rotation: 270, facingDirection: 3 }
                    };
                    
                    const rotation = rotations[movementData.currentDir];
                    if (rotation) {
                        entity.instance.componentOverrides[compDef.id].rotation = rotation.rotation;
                        entity.instance.componentOverrides[compDef.id].facingDirection = rotation.facingDirection;
                        console.log(`🔄 ${entity.template.name}: Rotado a ${rotation.rotation}°`);
                    }
                }
            }

            // SINCRONIZAR COMPONENTE
            const movementCompDef = componentDefinitions.find(cd => cd.name === 'PacmanMovementV2');
            if (movementCompDef) {
                if (!entity.instance.componentOverrides[movementCompDef.id]) {
                    entity.instance.componentOverrides[movementCompDef.id] = {};
                }
                
                const overrides = entity.instance.componentOverrides[movementCompDef.id];
                overrides.currentDirection = movementData.currentDir;
                overrides.desiredDirection = movementData.desiredDir;
                overrides.velocityX = entity.vx;
                overrides.velocityY = entity.vy;
                overrides.pixelCounter = movementData.pixelCounter;
            }
        });
    }
};

export default pacmanMovementV2Engine;

/**
 * INSTRUCCIONES DE INTEGRACIÓN:
 * 
 * 1. En ScreenPlayModal.tsx, agregar la función auxiliar antes de AVAILABLE_ENGINES:
 *    (copiar snapToGridAlignmentV2 de arriba)
 * 
 * 2. En AVAILABLE_ENGINES, agregar:
 *    pacmanMovementV2: pacmanMovementV2Engine,
 * 
 * 3. En detectRequiredEngines(), agregar:
 *    case 'comp_PacmanMovementV2':
 *        requiredEngines.add('pacmanMovementV2');
 *        break;
 */