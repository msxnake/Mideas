/**
 * BACKUP DEL MOTOR PAC-MAN ORIGINAL
 * 
 * Este es el backup del motor original de ScreenPlayModal.tsx (líneas 1164-1277)
 * Guardado antes de implementar la mejora que soluciona el problema de atascamiento.
 * 
 * PARA RESTAURAR SI ALGO SALE MAL:
 * Copia todo el contenido de 'pacMovement' de aquí y pégalo de vuelta en ScreenPlayModal.tsx
 */

export const originalPacMovementEngine = {
    pacMovement: {
        id: 'pacMovement',
        name: 'Pac-Man Movement Engine',
        execute: (entities: AnimatedEntity[], componentDefinitions: ComponentDefinition[], screenMap?: ScreenMap) => {
            // Direcciones
            const DIRS = {
                NONE: { x: 0, y: 0 },
                LEFT: { x: -1, y: 0 },
                RIGHT: { x: 1, y: 0 },
                UP: { x: 0, y: -1 },
                DOWN: { x: 0, y: 1 }
            };

            // Función para verificar si se puede mover en una dirección
            const canMove = (tileX: number, tileY: number, dir: string, screenMap: ScreenMap): boolean => {
                if (!dir || dir === 'NONE') return false;
                const nx = tileX + DIRS[dir].x;
                const ny = tileY + DIRS[dir].y;

                if (!screenMap?.layers?.collision) return true;
                
                // Check bounds using screenMap dimensions
                if (nx < 0 || ny < 0 || nx >= screenMap.width || ny >= screenMap.height) return false;

                // Collision layer is a 2D array: collision[tileY][tileX]
                const tileOnLayer = screenMap.layers.collision[ny]?.[nx];
                
                // Return true if tile is empty or doesn't exist (can move)
                return !(tileOnLayer && tileOnLayer.tileId);
            };

            // Get current pressed keys from the modal's key tracking system
            const currentPressedKeys = (window as any).currentPressedKeys || new Set();

            entities.forEach(entity => {
                const pacMovementComp = entity.template.components.find(c => c.definitionId === 'comp_pacMovement');
                if (pacMovementComp) {
                    const pacProps = { 
                        ...pacMovementComp.defaultValues, 
                        ...(entity.instance.componentOverrides?.['comp_pacMovement'] || {}) 
                    };

                    if (!pacProps.isEnabled) return;

                    // Initialize movement data if needed
                    if (!entity.movementData) {
                        entity.movementData = {
                            currentDir: pacProps.currentDirection || 'NONE',
                            desiredDir: pacProps.desiredDirection || 'NONE'
                        };
                    }

                    const speed = Number(pacProps.speed) || 2;
                    const tileSize = 16; // Standard tile size

                    // Handle keyboard input for desired direction
                    let newDesiredDir = entity.movementData.desiredDir;
                    
                    if (currentPressedKeys.has('ArrowUp') || currentPressedKeys.has('KeyW')) {
                        newDesiredDir = 'UP';
                    } else if (currentPressedKeys.has('ArrowDown') || currentPressedKeys.has('KeyS')) {
                        newDesiredDir = 'DOWN';
                    } else if (currentPressedKeys.has('ArrowLeft') || currentPressedKeys.has('KeyA')) {
                        newDesiredDir = 'LEFT';
                    } else if (currentPressedKeys.has('ArrowRight') || currentPressedKeys.has('KeyD')) {
                        newDesiredDir = 'RIGHT';
                    }
                    
                    // Update desired direction only if a key is pressed
                    if (newDesiredDir !== entity.movementData.desiredDir) {
                        entity.movementData.desiredDir = newDesiredDir;
                    }
                    
                    // If no movement keys are pressed, cancel desired direction if it's not current direction
                    if (!currentPressedKeys.has('ArrowUp') && !currentPressedKeys.has('KeyW') &&
                        !currentPressedKeys.has('ArrowDown') && !currentPressedKeys.has('KeyS') &&
                        !currentPressedKeys.has('ArrowLeft') && !currentPressedKeys.has('KeyA') &&
                        !currentPressedKeys.has('ArrowRight') && !currentPressedKeys.has('KeyD')) {
                        // No keys pressed, cancel intention if different from current direction
                        if (entity.movementData.desiredDir !== entity.movementData.currentDir) {
                            entity.movementData.desiredDir = entity.movementData.currentDir;
                        }
                    }

                    // Calcular en qué tile está el centro del sprite
                    const centerX = Math.floor((entity.x + tileSize / 2) / tileSize);
                    const centerY = Math.floor((entity.y + tileSize / 2) / tileSize);

                    // ¿Se puede mover en desiredDir?
                    if (canMove(centerX, centerY, entity.movementData.desiredDir, screenMap)) {
                        entity.movementData.currentDir = entity.movementData.desiredDir;
                    }

                    const dir = entity.movementData.currentDir;

                    // Reset velocity
                    entity.vx = 0;
                    entity.vy = 0;

                    // Apply movement if possible
                    if (canMove(centerX, centerY, dir, screenMap)) {
                        entity.vx = DIRS[dir].x * speed;
                        entity.vy = DIRS[dir].y * speed;
                    }

                    // Update component properties for persistence
                    if (entity.instance.componentOverrides?.['comp_pacMovement']) {
                        entity.instance.componentOverrides['comp_pacMovement'].currentDirection = entity.movementData.currentDir;
                        entity.instance.componentOverrides['comp_pacMovement'].desiredDirection = entity.movementData.desiredDir;
                    }
                }
            });
        }
    }
};