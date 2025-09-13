import React from 'react';
import { 
    AnimatedEntity, 
    ComponentDefinition, 
    ScreenMap, 
    EntityTemplate, 
    ProjectAsset,
    Sprite
} from '../../../types';

type GameEngine = {
    id: string;
    name: string;
    execute: (entities: AnimatedEntity[], componentDefinitions: ComponentDefinition[], screenMap?: ScreenMap, entityTemplates?: EntityTemplate[], allAssets?: ProjectAsset[], pendingSpawns?: React.MutableRefObject<any[]>) => void;
};

export const pacMovementEngine: GameEngine = {
    id: 'pacMovement',
    name: 'Enhanced Pac-Man Movement Engine',
    execute: (entities: AnimatedEntity[], componentDefinitions: ComponentDefinition[], screenMap?: ScreenMap, entityTemplates?: EntityTemplate[], allAssets?: ProjectAsset[]) => {
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
        const canMoveFromAlignedPosition = (entity: any, direction: string, tileSize: number, screenMap: ScreenMap): boolean => {
            if (!direction || direction === 'NONE' || !screenMap?.layers?.collision) {
                console.log(`🚨 canMoveFromAlignedPosition: No screenMap o collision layer`);
                return true; // Si no hay mapa de colisión, permite el movimiento
            }

            // Usar la misma estructura que el sistema de colisión de paredes
            const tileLayer = screenMap.layers.collision;
            const mapW = screenMap.width || (tileLayer[0] ? tileLayer[0].length : 0);
            const mapH = screenMap.height || tileLayer.length;

            console.log(`🔍 Verificando movimiento hacia ${direction}, mapa: ${mapW}x${mapH}`);

            // Obtener propiedades de hitbox desde el sprite primero, luego fallback al wall collision
            let hitboxWidth = 16;
            let hitboxHeight = 16;
            let offsetX = 0;
            let offsetY = 0;
            let actualTileSize = tileSize;

            // Primero intentar obtener el sprite del entity
            let spriteAssetId: string | undefined;
            
            // Buscar sprite en component overrides
            if (entity.instance.componentOverrides) {
                for (const compId in entity.instance.componentOverrides) {
                    const compDef = componentDefinitions.find(c => c.id === compId);
                    const spriteProp = compDef?.properties.find(p => p.type === 'sprite_ref');
                    if (spriteProp && entity.instance.componentOverrides[compId]?.[spriteProp.name]) {
                        spriteAssetId = entity.instance.componentOverrides[compId][spriteProp.name];
                        break;
                    }
                }
            }
            
            // Si no se encontró en overrides, buscar en template defaults
            if (!spriteAssetId) {
                for (const comp of entity.template.components) {
                    const compDef = componentDefinitions.find(c => c.id === comp.definitionId);
                    const spriteProp = compDef?.properties.find(p => p.type === 'sprite_ref');
                    if (spriteProp && comp.defaultValues?.[spriteProp.name]) {
                        spriteAssetId = comp.defaultValues[spriteProp.name];
                        break;
                    }
                }
            }
            
            // Obtener sprite asset y usar sus valores de hitbox (solo si allAssets está disponible)
            if (spriteAssetId && allAssets && allAssets.length > 0) {
                const spriteAsset = allAssets.find(a => a.id === spriteAssetId && a.type === 'sprite');
                const sprite = spriteAsset?.data as Sprite;
                if (sprite?.hitbox) {
                    hitboxWidth = sprite.hitbox.width;
                    hitboxHeight = sprite.hitbox.height;
                    offsetX = sprite.hitbox.offsetX;
                    offsetY = sprite.hitbox.offsetY;
                }
            }
            
            // Fallback: usar valores del wall collision component si existe, sino valores por defecto
            const wallCollisionComp = entity.template.components.find(c => c.definitionId === 'comp_wall_collision');
            if (wallCollisionComp) {
                const wallProps = { 
                    ...wallCollisionComp.defaultValues, 
                    ...(entity.instance.componentOverrides?.['comp_wall_collision'] || {}) 
                };
                
                // Solo usar estos valores si no tenemos valores del sprite o allAssets no está disponible
                if (!spriteAssetId || !allAssets || !allAssets.find(a => a.id === spriteAssetId && a.type === 'sprite')?.data?.hitbox) {
                    hitboxWidth = Number(wallProps.hitboxWidth) || hitboxWidth;
                    hitboxHeight = Number(wallProps.hitboxHeight) || hitboxHeight;
                    offsetX = Number(wallProps.offsetX) || offsetX;
                    offsetY = Number(wallProps.offsetY) || offsetY;
                }
                actualTileSize = Number(wallProps.tileSize) || 8;
            } else {
                // No wall collision component - use sprite hitbox or reasonable defaults
                console.log(`⚠️ ${entity.template.name} no tiene comp_wall_collision, usando valores por defecto`);
                actualTileSize = 8; // MSX standard tile size
                if (!spriteAssetId || !allAssets || !allAssets.find(a => a.id === spriteAssetId && a.type === 'sprite')?.data?.hitbox) {
                    hitboxWidth = 12; // Pac-Man default size
                    hitboxHeight = 12;
                    offsetX = 2;
                    offsetY = 2;
                }
            }

            // Calcular posición de prueba alineada
            let testX = entity.x;
            let testY = entity.y;

            switch (direction) {
                case 'UP':
                    testY = Math.floor(entity.y / actualTileSize) * actualTileSize;
                    testX = Math.round(entity.x / actualTileSize) * actualTileSize + (actualTileSize / 2) - (hitboxWidth / 2);
                    testY -= 1;
                    break;
                case 'DOWN':
                    testY = Math.floor(entity.y / actualTileSize) * actualTileSize;
                    testX = Math.round(entity.x / actualTileSize) * actualTileSize + (actualTileSize / 2) - (hitboxWidth / 2);
                    testY += 1;
                    break;
                case 'LEFT':
                    testX = Math.floor(entity.x / actualTileSize) * actualTileSize;
                    testY = Math.round(entity.y / actualTileSize) * actualTileSize + (actualTileSize / 2) - (hitboxHeight / 2);
                    testX -= 1;
                    break;
                case 'RIGHT':
                    testX = Math.floor(entity.x / actualTileSize) * actualTileSize;
                    testY = Math.round(entity.y / actualTileSize) * actualTileSize + (actualTileSize / 2) - (hitboxHeight / 2);
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

            // Convertir a coordenadas de tile (usar la misma lógica que wall collision)
            const startTileX = Math.floor(left / actualTileSize);
            const endTileX = Math.floor((right - 1e-6) / actualTileSize);
            const startTileY = Math.floor(top / actualTileSize);
            const endTileY = Math.floor((bottom - 1e-6) / actualTileSize);

            console.log(`🔍 Verificando tiles desde (${startTileX},${startTileY}) hasta (${endTileX},${endTileY})`);

            // Verificar colisión en el área (usar la misma lógica que wall collision)
            for (let ty = startTileY; ty <= endTileY; ty++) {
                for (let tx = startTileX; tx <= endTileX; tx++) {
                    if (tx < 0 || ty < 0 || tx >= mapW || ty >= mapH) {
                        continue;
                    }
                    
                    // Obtener el valor del byte de propiedades directamente de la layer collision
                    const tileValue = tileLayer[ty]?.[tx];
                    if (typeof tileValue !== 'number') continue; // No hay valor de tile
                    
                    // Verificar el bit solid usando máscara 0x10 (binario: 00010000)
                    const SOLID_BIT_MASK = 0x10;
                    const isSolid = (tileValue & SOLID_BIT_MASK) !== 0;
                    
                    if (isSolid) {
                        return false; // Pared sólida encontrada
                    }
                    // Si no es sólido (como los dots), continuar verificando otros tiles
                }
            }

            console.log(`✅ Camino libre hacia ${direction}`);
            return true; // Camino libre
        };

        /**
         * Alinea una entidad a la grilla para giros limpios
         */
        const snapToGridAlignment = (entity: any, direction: string, tileSize: number) => {
            let hitboxWidth = 12;  // Default Pac-Man size
            let hitboxHeight = 12;
            
            // Try to get hitbox from sprite first
            let spriteAssetId: string | undefined;
            
            // Search in component overrides
            if (entity.instance?.componentOverrides) {
                for (const compId in entity.instance.componentOverrides) {
                    const compDef = componentDefinitions.find(c => c.id === compId);
                    const spriteProp = compDef?.properties.find(p => p.type === 'sprite_ref');
                    if (spriteProp && entity.instance.componentOverrides[compId]?.[spriteProp.name]) {
                        spriteAssetId = entity.instance.componentOverrides[compId][spriteProp.name];
                        break;
                    }
                }
            }
            
            // If not found in overrides, search in template defaults
            if (!spriteAssetId) {
                for (const comp of entity.template.components) {
                    const compDef = componentDefinitions.find(c => c.id === comp.definitionId);
                    const spriteProp = compDef?.properties.find(p => p.type === 'sprite_ref');
                    if (spriteProp && comp.defaultValues?.[spriteProp.name]) {
                        spriteAssetId = comp.defaultValues[spriteProp.name];
                        break;
                    }
                }
            }
            
            // Get sprite asset and use its hitbox values
            if (spriteAssetId && allAssets && allAssets.length > 0) {
                const spriteAsset = allAssets.find(a => a.id === spriteAssetId && a.type === 'sprite');
                const sprite = spriteAsset?.data as Sprite;
                if (sprite?.hitbox) {
                    hitboxWidth = sprite.hitbox.width;
                    hitboxHeight = sprite.hitbox.height;
                }
            }
            
            // Fallback to wall collision component if exists
            const wallCollisionComp = entity.template.components.find(c => c.definitionId === 'comp_wall_collision');
            if (wallCollisionComp && (!spriteAssetId || !allAssets || !allAssets.find(a => a.id === spriteAssetId && a.type === 'sprite')?.data?.hitbox)) {
                const wallProps = { 
                    ...wallCollisionComp.defaultValues, 
                    ...(entity.instance.componentOverrides?.['comp_wall_collision'] || {}) 
                };
                hitboxWidth = Number(wallProps.hitboxWidth) || hitboxWidth;
                hitboxHeight = Number(wallProps.hitboxHeight) || hitboxHeight;
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
            
            // Obtener el tileSize correcto (independiente del componente wall_collision)
            const wallCollisionComp = entity.template.components.find(c => c.definitionId === 'comp_wall_collision');
            let tileSize = 8; // MSX standard tile size default
            
            if (wallCollisionComp) {
                const wallProps = { 
                    ...wallCollisionComp.defaultValues, 
                    ...(entity.instance.componentOverrides?.['comp_wall_collision'] || {}) 
                };
                tileSize = Number(wallProps.tileSize) || 8; // Usar el tileSize del wall collision
            } else {
                console.log(`⚠️ ${entity.template.name} funciona sin comp_wall_collision, usando tileSize=${tileSize}`);
            }
            
            // DEBUG: Mostrar todos los valores del hitbox (solo si existe wallCollisionComp)
            if (wallCollisionComp) {
                const wallProps = { ...wallCollisionComp.defaultValues, ...(entity.instance.componentOverrides?.['comp_wall_collision'] || {}) };
                console.log(`🔧 Hitbox Debug:`, {
                    entityName: entity.template.name,
                    templateDefaults: wallCollisionComp.defaultValues,
                    instanceOverrides: entity.instance.componentOverrides?.['comp_wall_collision'] || {},
                    finalValues: wallProps,
                    tileSize: tileSize,
                    speed: speed
                });
            }
            
            console.log(`🎮 Entidad ${entity.template.name}: tileSize=${tileSize}, speed=${speed}, hasWallCollision=${!!wallCollisionComp}`);

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

            // Función para verificar si dos direcciones son opuestas
            const areOppositeDirections = (dir1: string, dir2: string): boolean => {
                const opposites = {
                    'UP': 'DOWN', 'DOWN': 'UP',
                    'LEFT': 'RIGHT', 'RIGHT': 'LEFT'
                };
                return opposites[dir1] === dir2;
            };

            // Intentar cambiar dirección si tenemos una dirección deseada nueva
            if (newDesiredDirection !== 'NONE' && newDesiredDirection !== movementData.currentDir) {
                // CASO ESPECIAL: Cambios de dirección opuesta son inmediatos
                if (areOppositeDirections(movementData.currentDir, newDesiredDirection)) {
                    // Cambiar dirección opuesta inmediatamente sin verificar alineación
                    movementData.currentDir = newDesiredDirection;
                    movementData.desiredDir = 'NONE';
                    console.log(`↩️ ${entity.template.name} cambió a dirección opuesta ${newDesiredDirection} (inmediato)`);
                } else {
                    // CASO NORMAL: Cambios perpendiculares requieren alineación
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
};