/**
 * ENHANCED PAC-MAN MOVEMENT ENGINE
 * 
 * Este archivo contiene el motor de movimiento Pac-Man mejorado que reemplaza
 * el motor actual en ScreenPlayModal.tsx para solucionar el problema de
 * entidades que se atascan al intentar girar hacia paredes.
 * 
 * PROBLEMA SOLUCIONADO:
 * - Las entidades ya no se atascan al intentar girar hacia paredes
 * - Movimiento auténtico estilo Pac-Man con alineación a grilla
 * - Encolado de direcciones para controles responsivos
 * 
 * PARA USAR:
 * 1. Copia este código
 * 2. Reemplaza el engine 'pacMovement' en AVAILABLE_ENGINES (línea 1164)
 * 3. ¡Listo! El problema estará solucionado
 */

// Interfaz para datos de movimiento extendidos
interface EnhancedMovementData {
    currentDir: string;
    desiredDir: string;
    previousInputState: {
        up: boolean;
        down: boolean;
        left: boolean;
        right: boolean;
    };
}

// Motor de movimiento Pac-Man mejorado
export const enhancedPacMovementEngine = {
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
         * @param entity - La entidad a verificar
         * @param direction - La dirección a la que quiere girar
         * @param tileSize - Tamaño del tile
         * @returns true si está alineada, false si no
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
         * @param entity - La entidad
         * @param direction - Dirección a verificar
         * @param tileSize - Tamaño del tile
         * @param screenMap - Mapa de la pantalla
         * @returns true si puede moverse, false si no
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
                    // Alinear Y hacia arriba y centrar X
                    testY = Math.floor(entity.y / tileSize) * tileSize;
                    testX = Math.round(entity.x / tileSize) * tileSize + (tileSize / 2) - (hitboxWidth / 2);
                    testY -= 1; // Probar 1 píxel arriba
                    break;
                    
                case 'DOWN':
                    // Alinear Y hacia abajo y centrar X
                    testY = Math.floor(entity.y / tileSize) * tileSize;
                    testX = Math.round(entity.x / tileSize) * tileSize + (tileSize / 2) - (hitboxWidth / 2);
                    testY += 1; // Probar 1 píxel abajo
                    break;
                    
                case 'LEFT':
                    // Alinear X hacia la izquierda y centrar Y
                    testX = Math.floor(entity.x / tileSize) * tileSize;
                    testY = Math.round(entity.y / tileSize) * tileSize + (tileSize / 2) - (hitboxHeight / 2);
                    testX -= 1; // Probar 1 píxel a la izquierda
                    break;
                    
                case 'RIGHT':
                    // Alinear X hacia la derecha y centrar Y
                    testX = Math.floor(entity.x / tileSize) * tileSize;
                    testY = Math.round(entity.y / tileSize) * tileSize + (tileSize / 2) - (hitboxHeight / 2);
                    testX += 1; // Probar 1 píxel a la derecha
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
                    // Verificar límites
                    if (tx < 0 || ty < 0 || tx >= screenMap.width || ty >= screenMap.height) {
                        continue;
                    }
                    
                    // Verificar si hay un tile sólido
                    const tile = screenMap.layers.collision[ty]?.[tx];
                    if (tile && tile.tileId) {
                        return false; // Pared encontrada, no puede moverse
                    }
                }
            }

            return true; // Camino libre
        };

        /**
         * Alinea una entidad a la grilla para giros limpios
         * @param entity - La entidad a alinear
         * @param direction - Dirección del giro
         * @param tileSize - Tamaño del tile
         */
        const snapToGridAlignment = (entity: any, direction: string, tileSize: number) => {
            // Obtener hitbox para centrado
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
                // Para movimiento vertical, alinear X
                entity.x = Math.round(entity.x / tileSize) * tileSize + (tileSize / 2) - (hitboxWidth / 2);
            } else {
                // Para movimiento horizontal, alinear Y
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
                } as EnhancedMovementData;
            }

            const movementData = entity.enhancedMovementData as EnhancedMovementData;
            const speed = Number(pacProps.speed) || 2;
            const tileSize = 16; // Tamaño estándar de tile

            // Detectar nueva entrada de dirección (edge-triggered)
            const currentInput = {
                up: currentPressedKeys.has('ArrowUp') || currentPressedKeys.has('KeyW'),
                down: currentPressedKeys.has('ArrowDown') || currentPressedKeys.has('KeyS'),
                left: currentPressedKeys.has('ArrowLeft') || currentPressedKeys.has('KeyA'),
                right: currentPressedKeys.has('ArrowRight') || currentPressedKeys.has('KeyD')
            };

            let newDesiredDirection = movementData.desiredDir;

            // Detectar nueva pulsación de tecla
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

            // También mantener compatibilidad con el sistema anterior
            if (entity.movementData) {
                entity.movementData.currentDir = movementData.currentDir;
                entity.movementData.desiredDir = movementData.desiredDir;
            }
        });
    }
};

// Exportar también las funciones de utilidad por si las necesitas
export {
    enhancedPacMovementEngine as default
};