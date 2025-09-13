import { 
    AnimatedEntity, 
    ComponentDefinition, 
    ScreenMap, 
    EntityTemplate, 
    ProjectAsset
} from '../../../types';

type GameEngine = {
    id: string;
    name: string;
    execute: (entities: AnimatedEntity[], componentDefinitions: ComponentDefinition[], screenMap?: ScreenMap, entityTemplates?: EntityTemplate[], allAssets?: ProjectAsset[], pendingSpawns?: React.MutableRefObject<any[]>) => void;
};

export const pacmanMovementV2Engine: GameEngine = {
    id: 'pacmanMovementV2',
    name: 'Pac-Man Movement Engine V2.0 - New Components',
    execute: (entities: AnimatedEntity[], componentDefinitions: ComponentDefinition[], screenMap?: ScreenMap, entityTemplates?: EntityTemplate[], allAssets?: ProjectAsset[]) => {
        
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
        const isAlignedForTurning = (entity: any, direction: string, tileSize: number): boolean => {
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
        const canMoveInDirectionV2 = (entity: any, direction: string, tileSize: number, screenMap: ScreenMap): boolean => {
            if (!direction || direction === 'NONE' || !screenMap?.layers?.collision) {
                return true;
            }

            // Obtener el speed actual del componente
            const pacMovementComp = entity.template.components.find((c: any) => c.definitionId === 'comp_PacmanMovementV2');
            const pacProps = {
                ...pacMovementComp?.defaultValues,
                ...(entity.instance.componentOverrides?.['comp_PacmanMovementV2'] || {})
            };
            const speed = Number(pacProps.speed) || 1;

            let checkX = entity.x;
            let checkY = entity.y;
            
            const spriteWidth = entity.sprite?.size?.width || 16;
            const spriteHeight = entity.sprite?.size?.height || 16;
            
            // Verificar la posición donde estaría DESPUÉS del próximo movimiento
            switch (direction) {
                case 'LEFT':
                    checkX = entity.x - speed;  // Solo 1 píxel hacia la izquierda
                    break;
                case 'RIGHT':
                    checkX = entity.x + speed;  // Solo 1 píxel hacia la derecha
                    break;
                case 'UP':
                    checkY = entity.y - speed;  // Solo 1 píxel hacia arriba
                    break;
                case 'DOWN':
                    checkY = entity.y + speed;  // Solo 1 píxel hacia abajo
                    break;
            }

            // Verificar todas las esquinas del hitbox del sprite
            const hitboxCorners = [
                { x: checkX, y: checkY },                           // Top-left
                { x: checkX + spriteWidth - 1, y: checkY },         // Top-right
                { x: checkX, y: checkY + spriteHeight - 1 },        // Bottom-left
                { x: checkX + spriteWidth - 1, y: checkY + spriteHeight - 1 }  // Bottom-right
            ];

            // Verificar cada esquina
            for (const corner of hitboxCorners) {
                const tileX = Math.floor(corner.x / tileSize);
                const tileY = Math.floor(corner.y / tileSize);
                
                const mapWidth = screenMap.width || (screenMap.layers.collision[0]?.length || 0);
                const mapHeight = screenMap.height || screenMap.layers.collision.length;
                
                // Verificar límites del mapa
                if (tileX < 0 || tileX >= mapWidth || tileY < 0 || tileY >= mapHeight) {
                    return false;
                }

                // Verificar si hay colisión en este tile
                const screenTile = screenMap.layers.collision[tileY]?.[tileX];
                if (!screenTile || !screenTile.tileId) continue; // No hay tile
                
                // Buscar el asset de tile para verificar sus propiedades lógicas
                if (allAssets && allAssets.length > 0) {
                    const tileAsset = allAssets.find(asset => asset.id === screenTile.tileId && asset.type === 'tile');
                    if (tileAsset?.data?.logicalProperties?.isSolid) {
                        // Solo bloquear si el tile es sólido
                        return false; // Pared sólida encontrada
                    }
                    // Si no es sólido (como los dots), no bloquear el movimiento
                } else {
                    // Fallback: Si no hay acceso a assets, usar la lógica antigua (considerar todo como sólido)
                    return false;
                }
            }

            return true;  // No hay colisión
        };

        // Función auxiliar para alineación a la grilla
        const snapToGridAlignmentV2 = (entity: any, direction: string, tileSize: number) => {
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

        // Función para verificar si está en límite de tile
        const isAtTileBoundary = (entity: any, tileSize: number): boolean => {
            return (entity.x % tileSize === 0) && (entity.y % tileSize === 0);
        };

        // Procesar entidades
        entities.forEach(entity => {
            // Buscar componente PacmanMovementV2
            const pacMovementComp = entity.template.components.find((c: any) => c.definitionId === 'comp_PacmanMovementV2');
            if (!pacMovementComp) return;

            // Obtener propiedades del componente
            const pacProps = {
                ...pacMovementComp.defaultValues,
                ...(entity.instance.componentOverrides?.['comp_PacmanMovementV2'] || {})
            };

            if (!pacProps.isEnabled) {
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

            // Leer input del teclado
            const currentPressedKeys = (window as any).currentPressedKeys || new Set();
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
            } else if (currentInput.down && !movementData.previousInput.down) {
                newDesiredDirection = 'DOWN';
            } else if (currentInput.left && !movementData.previousInput.left) {
                newDesiredDirection = 'LEFT';
            } else if (currentInput.right && !movementData.previousInput.right) {
                newDesiredDirection = 'RIGHT';
            }

            movementData.previousInput = { ...currentInput };

            // Verificar direcciones opuestas
            const areOppositeDirections = (dir1: string, dir2: string): boolean => {
                const opposites: Record<string, string> = {
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
                } else {
                    // Cambio perpendicular - requiere alineación
                    const isAligned = isAlignedForTurning(entity, newDesiredDirection, tileSize);
                    const canMove = canMoveInDirectionV2(entity, newDesiredDirection, tileSize, screenMap);

                    if (isAligned && canMove) {
                        movementData.currentDir = newDesiredDirection;
                        movementData.desiredDir = 'NONE';
                        snapToGridAlignmentV2(entity, newDesiredDirection, tileSize);
                    } else {
                        movementData.desiredDir = newDesiredDirection;
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
                    }
                }
            } else {
                // Sin movimiento
                entity.vx = 0;
                entity.vy = 0;
            }

            // ACTUALIZAR ROTACIÓN (buscar componente PacmanRotationV2)
            const rotationComp = entity.template.components.find((c: any) => c.definitionId === 'comp_PacmanRotationV2');
            
            if (rotationComp && movementData.currentDir !== 'NONE') {
                if (!entity.instance.componentOverrides['comp_PacmanRotationV2']) {
                    entity.instance.componentOverrides['comp_PacmanRotationV2'] = {};
                }
                
                const rotations: Record<string, { rotation: number, facingDirection: number }> = {
                    'RIGHT': { rotation: 0, facingDirection: 0 },
                    'UP': { rotation: 90, facingDirection: 1 },
                    'LEFT': { rotation: 180, facingDirection: 2 },
                    'DOWN': { rotation: 270, facingDirection: 3 }
                };
                
                const rotation = rotations[movementData.currentDir];
                if (rotation) {
                    entity.instance.componentOverrides['comp_PacmanRotationV2'].rotation = rotation.rotation;
                    entity.instance.componentOverrides['comp_PacmanRotationV2'].facingDirection = rotation.facingDirection;
                }
            }

            // SINCRONIZAR COMPONENTE
            if (!entity.instance.componentOverrides['comp_PacmanMovementV2']) {
                entity.instance.componentOverrides['comp_PacmanMovementV2'] = {};
            }
            
            const overrides = entity.instance.componentOverrides['comp_PacmanMovementV2'];
            overrides.currentDirection = movementData.currentDir;
            overrides.desiredDirection = movementData.desiredDir;
            overrides.velocityX = entity.vx;
            overrides.velocityY = entity.vy;
            overrides.pixelCounter = movementData.pixelCounter;
        });
    }
};