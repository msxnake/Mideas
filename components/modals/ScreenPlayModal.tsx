import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ScreenMap,
    EntityTemplate,
    EntityInstance,
    StateMachine,
    Sprite,
    ComponentDefinition,
    ProjectAsset,
    Tile
} from '../../types';
import { Button } from '../common/Button';
import { renderScreenToCanvas, createSpriteDataURL } from '../utils/screenUtils';
import { mirrorPixelDataHorizontally } from '../utils/spriteUtils';
import { renderMSX1TextToDataURL, getTextDimensionsMSX1, DEFAULT_MSX_FONT, createTileBasedFont } from '../utils/msxFontRenderer';
import { wallCollisionEngine, entityCollisionEngine, pacMovementEngine, pacmanMovementV2Engine } from '../../src/engines';

// Sprite rotation utilities for auto-generated directional sprites
const rotatePixelData90CW = (pixelData: any[][]): any[][] => {
    const height = pixelData.length;
    const width = pixelData[0].length;
    const rotated = Array(width).fill(null).map(() => Array(height).fill(null));
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            rotated[x][height - 1 - y] = pixelData[y][x];
        }
    }
    return rotated;
};

const rotatePixelData180 = (pixelData: any[][]): any[][] => {
    const height = pixelData.length;
    const width = pixelData[0].length;
    const rotated = Array(height).fill(null).map(() => Array(width).fill(null));
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            rotated[height - 1 - y][width - 1 - x] = pixelData[y][x];
        }
    }
    return rotated;
};

const rotatePixelData270CW = (pixelData: any[][]): any[][] => {
    const height = pixelData.length;
    const width = pixelData[0].length;
    const rotated = Array(width).fill(null).map(() => Array(height).fill(null));
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            rotated[width - 1 - x][y] = pixelData[y][x];
        }
    }
    return rotated;
};

// Auto-generate rotated sprites from base frames
const generateRotatedSprites = (entity: AnimatedEntity): HTMLImageElement[] => {
    if (entity.frameImages.length < 1 || !entity.sprite.frames[0]) {
        return entity.frameImages;
    }

    console.log(`🔄 Auto-generating rotated sprites for ${entity.template.name} (${entity.frameImages.length} base frames)`);
    
    const generatedFrames: HTMLImageElement[] = [];
    const spriteWidth = entity.sprite.size.width;
    const spriteHeight = entity.sprite.size.height;
    const baseFrameCount = entity.sprite.frames.length;
    
    // Generate frames by direction: [all_right_frames, all_up_frames, all_left_frames, all_down_frames]
    for (let direction = 0; direction < 4; direction++) {
        for (let frameIndex = 0; frameIndex < baseFrameCount; frameIndex++) {
            const basePixelData = entity.sprite.frames[frameIndex].data;
            
            switch (direction) {
                case 0: // Right (0°) - original
                    generatedFrames.push(entity.frameImages[frameIndex]);
                    break;
                    
                case 1: // Up (270°) - was Down
                    if (spriteWidth === spriteHeight) {
                        const rotated270 = rotatePixelData270CW(basePixelData);
                        const img270 = new Image();
                        img270.src = createSpriteDataURL(rotated270, spriteWidth, spriteHeight);
                        generatedFrames.push(img270);
                    } else {
                        generatedFrames.push(entity.frameImages[frameIndex]);
                    }
                    break;
                    
                case 2: // Left (mirror horizontal)
                    const mirrored = mirrorPixelDataHorizontally(basePixelData);
                    const imgMirrored = new Image();
                    imgMirrored.src = createSpriteDataURL(mirrored, spriteWidth, spriteHeight);
                    generatedFrames.push(imgMirrored);
                    break;
                    
                case 3: // Down (90°) - was Up
                    if (spriteWidth === spriteHeight) {
                        const rotated90 = rotatePixelData90CW(basePixelData);
                        const img90 = new Image();
                        img90.src = createSpriteDataURL(rotated90, spriteWidth, spriteHeight);
                        generatedFrames.push(img90);
                    } else {
                        generatedFrames.push(entity.frameImages[frameIndex]);
                    }
                    break;
            }
        }
    }
    
    console.log(`✅ Generated ${generatedFrames.length} rotated frames: ${baseFrameCount} frames × 4 directions`);
    console.log(`📋 Frame structure: Right(0-${baseFrameCount-1}), Up(${baseFrameCount}-${baseFrameCount*2-1}), Left(${baseFrameCount*2}-${baseFrameCount*3-1}), Down(${baseFrameCount*3}-${baseFrameCount*4-1})`);
    return generatedFrames;
};


// Game Engine System Types
type GameEngine = {
    id: string;
    name: string;
    execute: (entities: AnimatedEntity[], componentDefinitions: ComponentDefinition[], screenMap?: ScreenMap, entityTemplates?: EntityTemplate[], allAssets?: ProjectAsset[], pendingSpawns?: React.MutableRefObject<EntityInstance[]>) => void;
};

type EngineRegistry = {
    [engineId: string]: GameEngine;
};

const TILE_SIZE = 8;
const PREVIEW_WIDTH = 256;
const PREVIEW_HEIGHT = 192;
const ANIMATION_SPEED_MS = 200;

// Available Game Engines
const AVAILABLE_ENGINES: EngineRegistry = {
    gravity: {
        id: 'gravity',
        name: 'Gravity Engine',
        execute: (entities: AnimatedEntity[], componentDefinitions: ComponentDefinition[]) => {
            entities.forEach(entity => {
                const gravityComp = entity.template.components.find(c => c.definitionId === 'comp_gravity');
                if (gravityComp) {
                    const gravityProps = { 
                        ...gravityComp.defaultValues, 
                        ...(entity.instance.componentOverrides?.['comp_gravity'] || {}) 
                    };
                    const strength = Number(gravityProps.strength || 64) / 60;
                    const terminalVelocity = Number(gravityProps.terminalVelocity || 2);
                    entity.vy += strength;
                    if (entity.vy > terminalVelocity) entity.vy = terminalVelocity;
                }
            });
        }
    },
    
    animation: {
        id: 'animation',
        name: 'Animation Engine',
        execute: (entities: AnimatedEntity[], componentDefinitions: ComponentDefinition[]) => {
            const now = performance.now();
            entities.forEach(entity => {
                const animComp = entity.template.components.find(c => c.definitionId === 'comp_animation');
                if (animComp && entity.frameImages.length > 1 && now - entity.lastFrameUpdateTime > ANIMATION_SPEED_MS) {
                    const oldFrame = entity.currentFrame;
                    
                    // Check if entity has directional rotation system
                    if (entity.rotationData && entity.baseFrameForDirection !== undefined) {
                        if (entity.framesPerDirection && entity.framesPerDirection > 1) {
                            // Auto-generated system: cycle through frames in current direction
                            const baseFrame = entity.baseFrameForDirection;
                            const maxFrameInDirection = baseFrame + entity.framesPerDirection - 1;
                            
                            if (entity.currentFrame >= maxFrameInDirection) {
                                entity.currentFrame = baseFrame; // Back to first frame of direction
                            } else {
                                entity.currentFrame++; // Next frame in same direction
                            }
                        } else {
                            // 8-frame manual system: alternate between open/closed mouth
                            const baseFrame = entity.baseFrameForDirection;
                            if (entity.currentFrame === baseFrame) {
                                entity.currentFrame = baseFrame + 1; // Switch to closed mouth
                            } else {
                                entity.currentFrame = baseFrame; // Switch to open mouth
                            }
                        }
                    } else {
                        // Standard animation: cycle through all frames
                        entity.currentFrame = (entity.currentFrame + 1) % entity.frameImages.length;
                    }
                    
                    entity.lastFrameUpdateTime = now;
                    
                    if (entity.instance.id.startsWith('spawned_') && oldFrame !== entity.currentFrame) {
                        console.log('🎬 Animating spawned entity:', {
                            id: entity.instance.id,
                            frame: `${oldFrame} → ${entity.currentFrame}`,
                            totalFrames: entity.frameImages.length
                        });
                    }
                }
            });
        }
    },
    
    patrol: {
        id: 'patrol',
        name: 'Patrol Engine',
        execute: (entities: AnimatedEntity[], componentDefinitions: ComponentDefinition[]) => {
            entities.forEach(entity => {
                const patrolComp = entity.instance.componentOverrides?.comp_patrol;
                if (patrolComp?.waypoint1_x !== undefined && patrolComp?.waypoint1_y !== undefined) {
                    const startPixelX = patrolComp.waypoint1_x;
                    const startPixelY = patrolComp.waypoint1_y;
                    const endPixelX = patrolComp.waypoint2_x ?? startPixelX;
                    const endPixelY = patrolComp.waypoint2_y ?? startPixelY;
                    
                    if ((entity.vx > 0 && entity.x >= Math.max(startPixelX, endPixelX)) || 
                        (entity.vx < 0 && entity.x <= Math.min(startPixelX, endPixelX))) {
                        entity.vx = -entity.vx;
                    }
                    if ((entity.vy > 0 && entity.y >= Math.max(startPixelY, endPixelY)) || 
                        (entity.vy < 0 && entity.y <= Math.min(startPixelY, endPixelY))) {
                        entity.vy = -entity.vy;
                    }
                }
            });
        }
    },

    spawner: {
        id: 'spawner',
        name: 'Spawner Engine',
        execute: (entities: AnimatedEntity[], componentDefinitions: ComponentDefinition[], screenMap?: ScreenMap, entityTemplates?: EntityTemplate[], allAssets?: ProjectAsset[], pendingSpawns?: React.MutableRefObject<EntityInstance[]>) => {
            entities.forEach(entity => {
                const spawnerComp = entity.template.components.find(c => c.definitionId === 'comp_spawner');
                if (spawnerComp) {
                    const spawnerProps = { 
                        ...spawnerComp.defaultValues, 
                        ...(entity.instance.componentOverrides?.['comp_spawner'] || {}) 
                    };

                    if (!spawnerProps.isActive) return;

                    // Initialize spawner data if not exists
                    if (!entity.spawnerData) {
                        entity.spawnerData = {
                            lastSpawnTime: performance.now() - Number(spawnerProps.spawnRate),
                            spawnedEntities: [],
                            spawnCount: 0
                        };
                        
                        console.log('🔧 Spawner initialized:', {
                            entityName: entity.template.name,
                            spawnerProps,
                            spawnRate: Number(spawnerProps.spawnRate)
                        });
                        
                        // Spawn on start if enabled
                        if (spawnerProps.spawnOnStart) {
                            entity.spawnerData.lastSpawnTime = performance.now() - Number(spawnerProps.spawnRate);
                        }
                    }

                    const now = performance.now();
                    const spawnRate = Number(spawnerProps.spawnRate);
                    const maxEntities = Number(spawnerProps.maxEntities);

                    // Clean up dead entities from tracking
                    if (entity.spawnerData.spawnedEntities) {
                        entity.spawnerData.spawnedEntities = entity.spawnerData.spawnedEntities.filter(spawnedId => 
                            entities.some(e => e.instance.id === spawnedId)
                        );
                    }

                    // Check if we should spawn
                    const timeSinceLastSpawn = now - entity.spawnerData.lastSpawnTime;
                    const shouldSpawn = timeSinceLastSpawn >= spawnRate && entity.spawnerData.spawnedEntities.length < maxEntities;
                    
                    if (entity.spawnerData.spawnCount < 1) {
                        console.log('🕐 Spawner timing check:', {
                            entityName: entity.template.name,
                            timeSinceLastSpawn,
                            spawnRate,
                            currentEntities: entity.spawnerData.spawnedEntities.length,
                            maxEntities,
                            shouldSpawn
                        });
                    }
                    
                    if (shouldSpawn) {
                        
                        // Find template to spawn
                        const templateToSpawn = entityTemplates?.find(t => t.id === spawnerProps.entityTemplateId);
                        if (templateToSpawn && screenMap && allAssets) {
                            
                            // Calculate spawn position
                            const spawnZoneX = Number(spawnerProps.spawnZoneX) || 0;
                            const spawnZoneY = Number(spawnerProps.spawnZoneY) || 0;
                            const spawnZoneWidth = Number(spawnerProps.spawnZoneWidth) || PREVIEW_WIDTH;
                            const spawnZoneHeight = Number(spawnerProps.spawnZoneHeight) || PREVIEW_HEIGHT;

                            const spawnX = spawnZoneWidth > 0 ? 
                                spawnZoneX + Math.random() * spawnZoneWidth : 
                                Math.random() * PREVIEW_WIDTH;
                            const spawnY = spawnZoneHeight > 0 ? 
                                spawnZoneY + Math.random() * spawnZoneHeight : 
                                Math.random() * PREVIEW_HEIGHT;

                            // Create new entity instance
                            const newEntityId = `spawned_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;
                            const newEntityInstance = {
                                id: newEntityId,
                                entityTemplateId: templateToSpawn.id,
                                name: `${templateToSpawn.name} ${entity.spawnerData.spawnCount + 1}`,
                                position: { x: Math.floor(spawnX / TILE_SIZE), y: Math.floor(spawnY / TILE_SIZE) },
                                componentOverrides: {}
                            };

                            // Add to pending spawns list for processing
                            if (pendingSpawns) {
                                pendingSpawns.current.push(newEntityInstance);
                            }

                            entity.spawnerData.spawnedEntities.push(newEntityId);
                            entity.spawnerData.spawnCount++;
                            entity.spawnerData.lastSpawnTime = now;
                            
                            console.log(`🔧 Spawner: Created ${templateToSpawn.name} at (${spawnX.toFixed(0)}, ${spawnY.toFixed(0)})`);
                        }
                    }
                }
            });
        }
    },

    shooting: {
        id: 'shooting',
        name: 'Shooting Engine',
        execute: (entities: AnimatedEntity[], componentDefinitions: ComponentDefinition[], screenMap?: ScreenMap, entityTemplates?: EntityTemplate[], allAssets?: ProjectAsset[], pendingSpawns?: React.MutableRefObject<EntityInstance[]>) => {
            entities.forEach(entity => {
                const aimingComp = entity.template.components.find(c => c.definitionId === 'comp_aiming');
                const damageComp = entity.template.components.find(c => c.definitionId === 'comp_damage');
                
                if (aimingComp && damageComp) {
                    const aimingProps = { 
                        ...aimingComp.defaultValues, 
                        ...(entity.instance.componentOverrides?.['comp_aiming'] || {}) 
                    };
                    const damageProps = { 
                        ...damageComp.defaultValues, 
                        ...(entity.instance.componentOverrides?.['comp_damage'] || {}) 
                    };

                    // Initialize shooting data if not exists
                    if (!entity.shootingData) {
                        entity.shootingData = {
                            lastShotTime: 0,
                            fireRate: 500, // milliseconds between shots
                            target: null,
                            projectiles: []
                        };
                    }

                    const now = performance.now();
                    const canShoot = now - entity.shootingData.lastShotTime >= entity.shootingData.fireRate;

                    // Find target within range
                    const targetTemplateId = aimingProps.targetEntityTemplateId || 'tpl_player';
                    const aimingRange = Number(aimingProps.aimingRange) || 128;
                    
                    const potentialTargets = entities.filter(target => 
                        target.template.id === targetTemplateId && 
                        target.instance.id !== entity.instance.id
                    );

                    let closestTarget = null;
                    let closestDistance = aimingRange;

                    potentialTargets.forEach(target => {
                        const distance = Math.sqrt(
                            Math.pow(target.x - entity.x, 2) + 
                            Math.pow(target.y - entity.y, 2)
                        );
                        
                        if (distance < closestDistance) {
                            closestDistance = distance;
                            closestTarget = target;
                        }
                    });

                    // Shoot at target if found and can shoot
                    if (closestTarget && canShoot && pendingSpawns && entityTemplates) {
                        const dx = closestTarget.x - entity.x;
                        const dy = closestTarget.y - entity.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        // Find bullet template - prioritize player bullet for player ships
                        const isPlayerShip = entity.template.id === 'tpl_player_ship';
                        const bulletTemplateId = isPlayerShip ? 'tpl_player_bullet' : 'tpl_player_bullet'; // Can add enemy bullets later
                        const bulletTemplate = entityTemplates.find(t => t.id === bulletTemplateId);
                        
                        if (bulletTemplate) {
                            // Calculate bullet spawn position (from ship center/front)
                            const bulletStartX = entity.x + (entity.sprite.size.width / 2) - 4; // Center bullet
                            const bulletStartY = entity.y - 2; // Slightly above ship
                            
                            // Create bullet entity instance
                            const bulletId = `bullet_${Date.now()}_${Math.random().toString(36).substring(2,5)}`;
                            const bulletInstance = {
                                id: bulletId,
                                entityTemplateId: bulletTemplate.id,
                                name: `${bulletTemplate.name} ${entity.shootingData.projectiles?.length || 0}`,
                                position: { 
                                    x: Math.floor(bulletStartX / TILE_SIZE), 
                                    y: Math.floor(bulletStartY / TILE_SIZE) 
                                },
                                componentOverrides: {
                                    'comp_physics': {
                                        velocityY: -4 // Always shoot upward for now
                                    },
                                    'comp_damage': {
                                        damageAmount: Number(damageProps.damageAmount) || 1
                                    }
                                }
                            };

                            // Add to pending spawns for processing
                            pendingSpawns.current.push(bulletInstance);

                            entity.shootingData.lastShotTime = now;
                            
                            console.log(`🔫 ${entity.template.name} fired bullet at (${bulletStartX.toFixed(0)}, ${bulletStartY.toFixed(0)})`);
                        }
                    }

                    // Initialize shootingData if needed (for tracking fire rate)
                    if (!entity.shootingData) {
                        entity.shootingData = {
                            lastShotTime: 0,
                            fireRate: 500,
                            target: null,
                            projectiles: [] // Keep for compatibility, but bullets are now real entities
                        };
                    }
                }
            });

            // Remove entities marked for destruction
            // Note: This would need to be handled by the calling code
            // as we can't modify the entities array directly here
        }
    },

    cursors: {
        id: 'cursors',
        name: 'Cursor Control Engine',
        execute: (entities: AnimatedEntity[], componentDefinitions: ComponentDefinition[], screenMap?: ScreenMap, entityTemplates?: EntityTemplate[], allAssets?: ProjectAsset[], pendingSpawns?: React.MutableRefObject<EntityInstance[]>) => {
            // Helper function to check if a position would cause wall collision
            const wouldCollideWithWall = (entity: AnimatedEntity, newX: number, newY: number): boolean => {
                if (!screenMap?.layers?.collision) {
                    return false;
                }
                
                let wallCollisionComp = entity.template.components.find(c => c.definitionId === 'comp_wall_collision');
                
                // If entity has cursors but no wall collision, create default wall collision
                if (!wallCollisionComp) {
                    const cursorsComp = entity.template.components.find(c => c.definitionId === 'comp_cursors');
                    if (cursorsComp) {
                        wallCollisionComp = {
                            definitionId: 'comp_wall_collision',
                            defaultValues: {
                                hitboxWidth: 12,
                                hitboxHeight: 12,
                                offsetX: 2,
                                offsetY: 2,
                                tileSize: 8,
                                stopOnCollision: true
                            }
                        };
                    } else {
                        return false;
                    }
                }

                const props = { ...wallCollisionComp.defaultValues, ...(entity.instance.componentOverrides?.['comp_wall_collision'] || {}) };
                const hitboxWidth = Number(props.hitboxWidth) || 16;
                const hitboxHeight = Number(props.hitboxHeight) || 16;
                const offsetX = Number(props.offsetX) || 0;
                const offsetY = Number(props.offsetY) || 0;
                const tileSize = Number(props.tileSize) || 8;

                // Calculate entity bounds at new position
                const entityLeft = newX + offsetX;
                const entityTop = newY + offsetY;
                const entityRight = entityLeft + hitboxWidth;
                const entityBottom = entityTop + hitboxHeight;

                // Convert to tile coordinates
                const leftTile = Math.floor(entityLeft / tileSize);
                const topTile = Math.floor(entityTop / tileSize);
                const rightTile = Math.floor(entityRight / tileSize);
                const bottomTile = Math.floor(entityBottom / tileSize);


                // Check collision tiles in the entity's new area
                for (let tileY = topTile; tileY <= bottomTile; tileY++) {
                    for (let tileX = leftTile; tileX <= rightTile; tileX++) {
                        // Bounds check
                        if (tileX < 0 || tileY < 0 || 
                            tileX >= (screenMap.width || 0) || 
                            tileY >= (screenMap.height || 0)) {
                            continue;
                        }

                        // Check if there's a solid tile at this position
                        const tileOnLayer = screenMap.layers.collision[tileY]?.[tileX];
                        
                        if (tileOnLayer && tileOnLayer.tileId) {
                            // Need to check if this tile is actually solid by looking at its logical properties
                            // For now, assume any tile with an ID is solid (we can improve this later)
                            return true; // Would collide
                        }
                    }
                }
                return false; // No collision
            };
            // Get current pressed keys from the modal's key tracking system (we need to access it from the modal scope)
            // For now, we'll implement a simple key tracking system
            const currentPressedKeys = (window as any).currentPressedKeys || new Set();
            
            entities.forEach(entity => {
                const cursorsComp = entity.template.components.find(c => c.definitionId === 'comp_cursors');
                if (cursorsComp) {
                    const cursorsProps = { 
                        ...cursorsComp.defaultValues, 
                        ...(entity.instance.componentOverrides?.['comp_cursors'] || {}) 
                    };

                    if (!cursorsProps.isEnabled) return;

                    const speed = Number(cursorsProps.speed) || 2;
                    
                    // Reset velocity
                    entity.vx = 0;
                    entity.vy = 0;
                    
                    // Apply movement based on pressed keys with wall collision prevention
                    if (currentPressedKeys.has('ArrowUp') || currentPressedKeys.has('KeyW')) {
                        const newY = entity.y - speed;
                        if (!wouldCollideWithWall(entity, entity.x, newY)) {
                            entity.vy = -speed;
                        }
                    }
                    if (currentPressedKeys.has('ArrowDown') || currentPressedKeys.has('KeyS')) {
                        const newY = entity.y + speed;
                        if (!wouldCollideWithWall(entity, entity.x, newY)) {
                            entity.vy = speed;
                        }
                    }
                    if (currentPressedKeys.has('ArrowLeft') || currentPressedKeys.has('KeyA')) {
                        const newX = entity.x - speed;
                        if (!wouldCollideWithWall(entity, newX, entity.y)) {
                            entity.vx = -speed;
                        }
                    }
                    if (currentPressedKeys.has('ArrowRight') || currentPressedKeys.has('KeyD')) {
                        const newX = entity.x + speed;
                        if (!wouldCollideWithWall(entity, newX, entity.y)) {
                            entity.vx = speed;
                        }
                    }
                }
            });
        }
    },

    physics: {
        id: 'physics',
        name: 'Physics Engine',
        execute: (entities: AnimatedEntity[], componentDefinitions: ComponentDefinition[]) => {
            entities.forEach(entity => {
                const physicsComp = entity.template.components.find(c => c.definitionId === 'comp_physics');
                if (physicsComp) {
                    const physicsProps = { 
                        ...physicsComp.defaultValues, 
                        ...(entity.instance.componentOverrides?.['comp_physics'] || {}) 
                    };

                    // Apply physics velocities to entity movement
                    const velocityX = Number(physicsProps.velocityX) || 0;
                    const velocityY = Number(physicsProps.velocityY) || 0;
                    
                    // Add physics velocity to current movement velocity
                    entity.vx += velocityX;
                    entity.vy += velocityY;
                    
                    // Apply friction if specified
                    const friction = Number(physicsProps.friction) || 0;
                    if (friction > 0) {
                        const frictionFactor = friction / 255; // Normalize to 0-1
                        entity.vx *= (1 - frictionFactor);
                        entity.vy *= (1 - frictionFactor);
                    }
                }
            });
        }
    },

    collision: entityCollisionEngine,

    wallCollision: wallCollisionEngine,


  

    tileCollection: {
        id: 'tileCollection',
        name: 'Tile Collection Engine',
        execute: (entities: AnimatedEntity[], componentDefinitions: ComponentDefinition[], screenMap?: ScreenMap, entityTemplates?: EntityTemplate[], allAssets?: ProjectAsset[]) => {
            if (!screenMap || !screenMap.layers?.background) return;

            entities.forEach(entity => {
                const tileCollectorComp = entity.template.components.find(c => c.definitionId === 'comp_tile_collector');
                const inventoryComp = entity.template.components.find(c => c.definitionId === 'comp_inventory');
                
                if (tileCollectorComp) {
                    const collectorProps = {
                        ...tileCollectorComp.defaultValues,
                        ...(entity.instance.componentOverrides?.['comp_tile_collector'] || {})
                    };

                    console.log('🎯 Tile Collector - Entity pos:', entity.x, entity.y, 'Props:', collectorProps);
                    
                    let inventoryProps = null;
                    if (inventoryComp) {
                        inventoryProps = { 
                            ...inventoryComp.defaultValues, 
                            ...(entity.instance.componentOverrides?.['comp_inventory'] || {}) 
                        };
                    }

                    if (!collectorProps.isEnabled) return;

                    // Initialize inventory data if needed
                    if (!entity.inventoryData && inventoryProps) {
                        entity.inventoryData = {
                            currentItemCount: Number(inventoryProps.currentItemCount) || 0,
                            totalScore: Number(inventoryProps.totalScore) || 0,
                            collectedItems: [] // Track what was collected for advanced features
                        };
                    }

                    // Calculate entity's current tile position
                    const collectionRadius = Number(collectorProps.collectionRadius) || 4;
                    const tileX = Math.floor((entity.x + 8) / 16); // Assuming 16x16 tiles
                    const tileY = Math.floor((entity.y + 8) / 16);

                    // Get collectible tile IDs
                    const collectibleTileIds = (collectorProps.collectibleTileIds || 'dot,powerup,fruit')
                        .split(',')
                        .map(id => id.trim());
                    
                    const replacementTileId = collectorProps.replacementTileId || 'empty';

                    // Check surrounding tiles for collectibles (Pac-Man style - center collision)
                    const tilesToCheck = [
                        { x: tileX, y: tileY }, // Center tile
                        // Optional: Check adjacent tiles for larger collision radius
                        { x: tileX - 1, y: tileY },
                        { x: tileX + 1, y: tileY },
                        { x: tileX, y: tileY - 1 },
                        { x: tileX, y: tileY + 1 }
                    ];

                    tilesToCheck.forEach(tilePos => {
                        if (tilePos.x < 0 || tilePos.y < 0 || 
                            tilePos.x >= screenMap.width || tilePos.y >= screenMap.height) {
                            return;
                        }

                        // Get tile at position
                        const currentTile = screenMap.layers.background[tilePos.y]?.[tilePos.x];
                        if (!currentTile) return;

                        // Check if this tile is collectible
                        const isCollectible = collectibleTileIds.some(collectibleId =>
                            currentTile.tileId === collectibleId ||
                            currentTile.id === collectibleId
                        );

                        console.log('🔍 Checking tile at', tilePos.x, tilePos.y, ':', currentTile.tileId, 'collectible:', isCollectible);

                        if (isCollectible) {
                            // Calculate distance from entity center to tile center for precise collection
                            const tileCenterX = tilePos.x * 16 + 8;
                            const tileCenterY = tilePos.y * 16 + 8;
                            const entityCenterX = entity.x + 8;
                            const entityCenterY = entity.y + 8;
                            const distance = Math.sqrt(
                                Math.pow(entityCenterX - tileCenterX, 2) + 
                                Math.pow(entityCenterY - tileCenterY, 2)
                            );

                            // Only collect if within collection radius
                            if (distance <= collectionRadius) {
                                // Replace tile with empty/floor tile
                                screenMap.layers.background[tilePos.y][tilePos.x] = {
                                    ...currentTile,
                                    tileId: replacementTileId,
                                    id: replacementTileId
                                };

                                // Update inventory
                                if (entity.inventoryData && inventoryProps) {
                                    entity.inventoryData.currentItemCount++;
                                    entity.inventoryData.totalScore += Number(inventoryProps.scorePerItem) || 10;
                                    entity.inventoryData.collectedItems.push({
                                        tileId: currentTile.tileId,
                                        position: { x: tilePos.x, y: tilePos.y },
                                        timestamp: Date.now()
                                    });

                                    console.log(`🍒 ${entity.template.name} collected ${currentTile.tileId}! Total: ${entity.inventoryData.currentItemCount}, Score: ${entity.inventoryData.totalScore}`);
                                }

                                // Play collection sound if specified
                                if (collectorProps.collectionSoundId) {
                                    // TODO: Implement sound playing
                                    console.log(`🔊 Playing collection sound: ${collectorProps.collectionSoundId}`);
                                }
                            }
                        }
                    });
                }
            });
        }
    },

    rotation: {
        id: 'rotation',
        name: 'Sprite Rotation Engine',
        execute: (entities: AnimatedEntity[], componentDefinitions: ComponentDefinition[]) => {
            entities.forEach(entity => {
                const rotateComp = entity.template.components.find(c => c.definitionId === 'comp_rotate');
                if (rotateComp) {
                    const rotateProps = { 
                        ...rotateComp.defaultValues, 
                        ...(entity.instance.componentOverrides?.['comp_rotate'] || {}) 
                    };

                    // Initialize rotation data if needed
                    if (!entity.rotationData) {
                        entity.rotationData = {
                            rotation: Number(rotateProps.rotation) || 0,
                            facingDirection: Number(rotateProps.facingDirection) || 0,
                            lastDirection: 0
                        };
                    }

                    // Update facing direction based on movement velocity
                    let newDirection = entity.rotationData.facingDirection;
                    let newRotation = entity.rotationData.rotation;

                    if (entity.vx > 0) {
                        // Moving right
                        newDirection = 0;
                        newRotation = 0;
                    } else if (entity.vx < 0) {
                        // Moving left
                        newDirection = 2;
                        newRotation = 180;
                    } else if (entity.vy < 0) {
                        // Moving up
                        newDirection = 1;
                        newRotation = 90;
                    } else if (entity.vy > 0) {
                        // Moving down
                        newDirection = 3;
                        newRotation = 270;
                    }

                    // Only update if direction changed
                    if (newDirection !== entity.rotationData.facingDirection) {
                        entity.rotationData.facingDirection = newDirection;
                        entity.rotationData.rotation = newRotation;
                        entity.rotationData.lastDirection = newDirection;
                        
                        console.log(`🔄 ${entity.template.name} rotation: direction=${newDirection}, rotation=${newRotation}°, frames=${entity.frameImages.length}`);
                        
                        // Update current animation frame based on direction for auto-generated sprites
                        const baseFrameCount = entity.sprite.frames.length; // Original frames before generation
                        const totalFrames = entity.frameImages.length;
                        
                        if (totalFrames === baseFrameCount * 4) {
                            // Auto-generated system: 4 rotations per base frame
                            // Structure: [base0_right, base0_up, base0_left, base0_down, base1_right, base1_up, ...]
                            const framesPerDirection = baseFrameCount;
                            const baseFrame = newDirection * framesPerDirection;
                            entity.currentFrame = baseFrame; // Start with first frame of new direction
                            entity.baseFrameForDirection = baseFrame; // Store for animation engine
                            entity.framesPerDirection = framesPerDirection; // Store for animation system
                            console.log(`🎭 ${entity.template.name} switched to direction ${newDirection}, base frame ${baseFrame} (auto-generated, ${framesPerDirection} frames per direction)`);
                        } else if (entity.frameImages.length >= 8) {
                            // 8-frame manual system: 2 frames per direction (open/closed mouth)
                            const baseFrame = newDirection * 2; 
                            entity.currentFrame = baseFrame;
                            entity.baseFrameForDirection = baseFrame;
                            console.log(`🎭 ${entity.template.name} switched to direction ${newDirection}, base frame ${baseFrame} (8-frame manual system)`);
                        } else if (entity.frameImages.length >= 4) {
                            // 4-frame system: one frame per direction 
                            entity.currentFrame = newDirection;
                            console.log(`🎭 ${entity.template.name} switched to frame ${newDirection} for direction (4-frame system)`);
                        } else if (entity.frameImages.length > 1) {
                            // For sprites with fewer frames, cycle through available frames
                            entity.currentFrame = newDirection % entity.frameImages.length;
                            console.log(`🎭 ${entity.template.name} cycled to frame ${entity.currentFrame} (${entity.frameImages.length} total frames)`);
                        } else {
                            console.log(`🎭 ${entity.template.name} has only 1 frame - no visual rotation`);
                        }
                        // For single-frame sprites, keep currentFrame as 0
                    }
                }
            });
        }
    },

    stateMachine: {
        id: 'stateMachine',
        name: 'State Machine Engine',
        execute: (entities: AnimatedEntity[], componentDefinitions: ComponentDefinition[]) => {
            entities.forEach(entity => {
                if (!entity.stateMachine || !entity.currentState) return;

                const currentStateDef = entity.stateMachine.states.find(s => s.name === entity.currentState);
                if (!currentStateDef) return;

                // Execute onEnter actions if this is the first frame for this state
                if (!entity.stateData) {
                    entity.stateData = {
                        currentStateName: entity.currentState,
                        stateStartTime: performance.now(),
                        hasExecutedOnEnter: false
                    };
                }

                // Execute onEnter actions once when entering a new state
                if (!entity.stateData.hasExecutedOnEnter || entity.stateData.currentStateName !== entity.currentState) {
                    entity.stateData.currentStateName = entity.currentState;
                    entity.stateData.stateStartTime = performance.now();
                    entity.stateData.hasExecutedOnEnter = true;

                    console.log(`🎯 Executing onEnter actions for state: ${entity.currentState} on entity: ${entity.template.name} (${entity.instance.name})`);
                    console.log(`📋 State definition:`, currentStateDef);
                    
                    if (currentStateDef.onEnter && currentStateDef.onEnter.length > 0) {
                        console.log(`🎬 Found ${currentStateDef.onEnter.length} onEnter actions`);
                        currentStateDef.onEnter.forEach((action, index) => {
                            console.log(`🎭 Executing action ${index + 1}/${currentStateDef.onEnter.length}:`, action);
                            switch (action.type) {
                                case 'SET_VELOCITY':
                                    const vx = Number(action.params?.x) || 0;
                                    const vy = Number(action.params?.y) || 0;
                                    const prevVx = entity.vx;
                                    const prevVy = entity.vy;
                                    entity.vx = vx;
                                    entity.vy = vy;
                                    console.log(`⚡ SET_VELOCITY: (${prevVx}, ${prevVy}) → (${vx}, ${vy}) for ${entity.template.name}`);
                                    break;
                                case 'PLAY_SOUND':
                                    console.log(`🔊 PLAY_SOUND: ${action.params?.soundId} for ${entity.template.name}`);
                                    break;
                                case 'SET_ANIMATION':
                                    console.log(`🎬 SET_ANIMATION: ${action.params?.animationId} for ${entity.template.name}`);
                                    break;
                                default:
                                    console.log(`❓ Unknown action type: ${action.type}`);
                            }
                        });
                    } else {
                        console.log(`⚠️ No onEnter actions found for state: ${entity.currentState}`);
                    }
                }

                // Continuously execute state actions (if any) - for states that need continuous behavior
                if (currentStateDef.properties?.continuousMovement) {
                    // Example: continuous movement based on state properties
                    const moveSpeed = Number(currentStateDef.properties.moveSpeed) || 1;
                    const direction = currentStateDef.properties.direction || 'right';
                    
                    switch (direction) {
                        case 'right':
                            entity.vx = moveSpeed;
                            break;
                        case 'left':
                            entity.vx = -moveSpeed;
                            break;
                        case 'up':
                            entity.vy = -moveSpeed;
                            break;
                        case 'down':
                            entity.vy = moveSpeed;
                            break;
                    }
                }
            });
        }
    },

    pacMovement: pacMovementEngine,

    pacmanMovementV2: pacmanMovementV2Engine
};

// Engine Detection System
const detectRequiredEngines = (entities: AnimatedEntity[]): string[] => {
    const requiredEngines = new Set<string>();
    
    entities.forEach(entity => {
        // Check each component to determine required engines
        entity.template.components.forEach(comp => {
            switch (comp.definitionId) {
                case 'comp_gravity':
                    requiredEngines.add('gravity');
                    break;
                case 'comp_physics':
                    requiredEngines.add('physics');
                    break;
                case 'comp_animation':
                    requiredEngines.add('animation');
                    break;
                case 'comp_spawner':
                    requiredEngines.add('spawner');
                    break;
                case 'comp_aiming':
                    // Check if entity also has damage component for shooting
                    const hasDamageComp = entity.template.components.some(c => c.definitionId === 'comp_damage');
                    if (hasDamageComp) {
                        requiredEngines.add('shooting');
                    }
                    break;
                case 'comp_cursors':
                    requiredEngines.add('cursors');
                    break;
                case 'comp_collision':
                    requiredEngines.add('collision');
                    break;
                case 'comp_wall_collision':
                    requiredEngines.add('wallCollision');
                    break;
                case 'comp_tile_collector':
                    requiredEngines.add('tileCollection');
                    break;
                case 'comp_rotate':
                    requiredEngines.add('rotation');
                    break;
                case 'comp_pacMovement':
                    requiredEngines.add('pacMovement');
                    break;
                case 'comp_PacmanMovementV2':
                    requiredEngines.add('pacmanMovementV2');
                    break;
                case 'comp_statemachine':
                    requiredEngines.add('stateMachine');
                    break;
            }
        });
        
        // Check instance overrides for additional engines
        if (entity.instance.componentOverrides?.comp_patrol) {
            requiredEngines.add('patrol');
        }
        
        // Check if entity has a state machine (also check the entity itself)
        if (entity.stateMachine) {
            requiredEngines.add('stateMachine');
        }
    });
    
    return Array.from(requiredEngines);
};

interface AnimatedEntity {
    instance: EntityInstance;
    template: EntityTemplate;
    sprite: Sprite;
    x: number;
    y: number;
    vx: number;
    vy: number;
    frameImages: HTMLImageElement[];
    mirroredFrameImages?: HTMLImageElement[];
    currentFrame: number;
    lastFrameUpdateTime: number;
    stateMachine?: StateMachine;
    currentState?: string;
    spawnerData?: {
        lastSpawnTime: number;
        spawnedEntities: string[];
        spawnCount: number;
    };
    shootingData?: {
        lastShotTime: number;
        fireRate: number;
        target: AnimatedEntity | null;
        projectiles: any[]; // Keep for compatibility but unused
    };
    healthData?: {
        current: number;
        max: number;
    };
    inventoryData?: {
        currentItemCount: number;
        totalScore: number;
        collectedItems: Array<{
            tileId: string;
            position: { x: number; y: number };
            timestamp: number;
        }>;
    };
    rotationData?: {
        rotation: number;
        facingDirection: number;
        lastDirection: number;
    };
    baseFrameForDirection?: number;
    framesPerDirection?: number;
    markedForDestruction?: boolean;
    stateData?: {
        currentStateName: string;
        stateStartTime: number;
        hasExecutedOnEnter: boolean;
    };
    wallCollisionLogged?: boolean;
}

interface ScreenPlayModalProps {
    isOpen: boolean;
    onClose: () => void;
    screenMap: ScreenMap;
    allAssets: ProjectAsset[];
    entityTemplates: EntityTemplate[];
    componentDefinitions: ComponentDefinition[];
    currentScreenMode: string;
    msxFont?: any; // MSX font data for HUD rendering
    msxFontColorAttributes?: any; // MSX font color attributes
    tileBanks?: any[]; // Tile banks configuration
}

export const ScreenPlayModal: React.FC<ScreenPlayModalProps> = ({
    isOpen,
    onClose,
    screenMap,
    allAssets,
    entityTemplates,
    componentDefinitions,
    currentScreenMode,
    msxFont,
    msxFontColorAttributes,
    tileBanks
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const animationFrameId = useRef<number>();
    const entitiesRef = useRef<AnimatedEntity[]>([]);
    const playerRef = useRef<AnimatedEntity | null>(null);
    const pressedKeys = useRef<Set<string>>(new Set());
    const activeEnginesRef = useRef<GameEngine[]>([]);
    const pendingSpawnsRef = useRef<EntityInstance[]>([]);
    const [entityCount, setEntityCount] = useState(0);
    const [debugMode, setDebugMode] = useState(false);

    // Pac-Man style movement tracking
    const desiredDirection = useRef<string | null>(null);
    const currentDirection = useRef<string | null>(null);

    // Helper function to check if entity can move in a specific direction
    const canMoveInDirection = useCallback((entity: AnimatedEntity, direction: string): boolean => {
        // Debug logs removed for cleaner output
        
        if (!screenMap?.layers?.collision) {
            // console.log(`🔍 No collision layer found - returning true`);
            return true;
        }
        
        // Get the actual velocity that would be applied based on direction
        let velocityX = 0, velocityY = 0;
        switch (direction) {
            case 'left': velocityX = -1; break;
            case 'right': velocityX = 1; break;
            case 'up': velocityY = -1; break;
            case 'down': velocityY = 1; break;
            default: return true;
        }
        
        // Calculate next position using the actual velocity that would be set
        const nextX = entity.x + velocityX;
        const nextY = entity.y + velocityY;
        
        // Use same collision detection logic as the movement system
        const wallCollisionComp = entity.template.components.find(c => c.definitionId === 'comp_wall_collision' || c.definitionId === 'comp_collision');
        if (!wallCollisionComp) {
            // console.log(`🔍 No collision component found - returning true`);
            return true;
        }
        // console.log(`🔍 Found collision component: ${wallCollisionComp.definitionId}`);
        
        const componentId = wallCollisionComp.definitionId;
        const props = { ...wallCollisionComp.defaultValues, ...(entity.instance.componentOverrides?.[componentId] || {}) };
        
        // Get hitbox values from sprite first, then fallback to collision component
        let hitboxWidth = 12;
        let hitboxHeight = 12;
        let offsetX = 2;
        let offsetY = 2;

        // Try to get sprite hitbox values
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
        
        // Get sprite asset and use its hitbox values (solo si allAssets está disponible)
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

        // Fallback: use collision component values if no sprite hitbox (with Pac-Man style adjustment)
        if (!spriteAssetId || !allAssets || !allAssets.find(a => a.id === spriteAssetId && a.type === 'sprite')?.data?.hitbox) {
            hitboxWidth = Number(props.hitboxWidth) > 14 ? 12 : Number(props.hitboxWidth) || 12;
            hitboxHeight = Number(props.hitboxHeight) > 14 ? 12 : Number(props.hitboxHeight) || 12;
            offsetX = Number(props.offsetX) || 2;
            offsetY = Number(props.offsetY) || 2;
        }
        
        // Check if new position would collide
        const entityLeft = nextX + offsetX;
        const entityTop = nextY + offsetY;
        const entityRight = entityLeft + hitboxWidth;
        const entityBottom = entityTop + hitboxHeight;
        
        const leftTile = Math.floor(entityLeft / 16);
        const topTile = Math.floor(entityTop / 16);
        const rightTile = Math.floor((entityRight - 1) / 16);
        const bottomTile = Math.floor((entityBottom - 1) / 16);
        
        // Debug info
        // console.log(`🔍 Checking direction ${direction}: nextPos(${nextX}, ${nextY}), hitbox(${hitboxWidth}×${hitboxHeight}), offset(${offsetX}, ${offsetY})`);
        // console.log(`🔍 Tiles to check: (${leftTile}, ${topTile}) to (${rightTile}, ${bottomTile})`);
        
        // Check all tiles the entity would occupy
        for (let tileY = topTile; tileY <= bottomTile; tileY++) {
            for (let tileX = leftTile; tileX <= rightTile; tileX++) {
                // Check bounds
                if (tileX < 0 || tileY < 0 || tileX >= screenMap.width || tileY >= screenMap.height) {
                    // console.log(`🔍 Tile (${tileX}, ${tileY}) is out of bounds`);
                    return false;
                }
                
                // DEBUG: Check collision layer structure - always show when checking tiles
                console.log(`🔍 DEBUG Collision vs Game Flow differences en (${tileX},${tileY}):`, {
                    tilePos: { x: tileX, y: tileY },
                    screenPlayTileSize: actualTileSize,
                    gameFlowTileSize: 8, // Game Flow Preview uses TILE_SIZE = 8
                    entityPixelPos: { x: entity.x, y: entity.y }
                });
                
                // Use the same structure as the working collision system
                const tileOnLayer = screenMap.layers.collision[tileY]?.[tileX];
                
                console.log(`🔍 Tile en (${tileX},${tileY}):`, tileOnLayer);
                
                // If tile exists and has a tileId, check if it's actually solid (using Game Flow Preview logic)
                if (tileOnLayer && tileOnLayer.tileId) {
                    // Get tileset from allAssets (same as Game Flow Preview)
                    const tileset = allAssets ? allAssets.filter(a => a.type === 'tile').map(a => a.data as Tile) : [];
                    const tile = tileset.find(t => t.id === tileOnLayer.tileId);
                    
                    // Use the same logic as Game Flow Preview: check logicalProperties.isSolid
                    const isSolid = tile?.logicalProperties?.isSolid ?? false;
                    
                    console.log(`🧱 Pac-Man Movement - Tile ${tileOnLayer.tileId} en (${tileX},${tileY}): isSolid=${isSolid}`);
                    
                    if (isSolid) {
                        console.log(`🚧 Tile sólido encontrado en (${tileX},${tileY}), tileId: ${tileOnLayer.tileId}`);
                        return false;
                    } else {
                        console.log(`🟢 Tile transitable en (${tileX},${tileY}), tileId: ${tileOnLayer.tileId}`);
                    }
                }
            }
        }
        
        // console.log(`🔍 No collision found - movement allowed`);
        return true;
    }, [screenMap]);
    
    // Enhanced condition evaluator that supports compound conditions
    const evaluateCondition = useCallback((condition: any, entity: AnimatedEntity, pressedKey: string, isKeyDown: boolean): boolean => {
        if (!condition) return false;
        
        switch (condition.type) {
            case 'KEY_PRESSED':
                return isKeyDown && condition.params?.key === pressedKey;
                
            case 'KEY_RELEASED':
                return !isKeyDown && condition.params?.key === pressedKey;
                
            case 'CAN_MOVE_DIRECTION':
                const canMove = canMoveInDirection(entity, condition.params?.direction);
                // console.log(`🔍 CAN_MOVE_DIRECTION(${condition.params?.direction}): ${canMove} at position (${entity.x}, ${entity.y})`);
                return canMove;
                
            case 'AND':
                if (!condition.conditions || !Array.isArray(condition.conditions)) return false;
                return condition.conditions.every((subCondition: any) => 
                    evaluateCondition(subCondition, entity, pressedKey, isKeyDown)
                );
                
            case 'OR':
                if (!condition.conditions || !Array.isArray(condition.conditions)) return false;
                return condition.conditions.some((subCondition: any) => 
                    evaluateCondition(subCondition, entity, pressedKey, isKeyDown)
                );
                
            case 'NOT':
                if (!condition.conditions || !Array.isArray(condition.conditions)) return false;
                return !evaluateCondition(condition.conditions[0], entity, pressedKey, isKeyDown);
                
            default:
                return false;
        }
    }, [canMoveInDirection]);

    const checkKeyTransitions = useCallback((entityId: string, pressedKey: string, isKeyDown: boolean) => {
        const entity = entitiesRef.current.find(e => e.instance.id === entityId);
        if (!entity || !entity.stateMachine || !entity.currentState) return;
        
        const currentStateDef = entity.stateMachine.states.find(s => s.name === entity.currentState);
        if (!currentStateDef) return;
        
        for (const transition of entity.stateMachine.transitions) {
            if (transition.fromStateId !== currentStateDef.id) continue;
            
            const condition = transition.conditions;
            if (!condition) continue;
            
            // Use enhanced condition evaluation
            const conditionMet = evaluateCondition(condition, entity, pressedKey, isKeyDown);
            
            if (conditionMet) {
                const nextState = entity.stateMachine.states.find(s => s.id === transition.toStateId);
                if (nextState) {
                    console.log(`🔄 State transition: ${entity.currentState} → ${nextState.name} (key: ${pressedKey})`);
                    entity.currentState = nextState.name;
                    
                    if (transition.actions) {
                        for (const action of transition.actions) {
                            if (action.type === 'SET_VELOCITY') {
                                const newVx = action.params.x || 0;
                                const newVy = action.params.y || 0;
                                console.log(`⚡ Setting velocity: (${entity.vx}, ${entity.vy}) → (${newVx}, ${newVy})`);
                                entity.vx = newVx;
                                entity.vy = newVy;
                            }
                        }
                    }
                    return;
                }
            }
        }
    }, [evaluateCondition]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        e.preventDefault();
        if (playerRef.current && !pressedKeys.current.has(e.key)) {
            pressedKeys.current.add(e.key);
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                checkKeyTransitions(playerRef.current.instance.id, e.key, true);
            }
        }
        if (e.key === 'Escape') {
            onClose();
        }
    }, [checkKeyTransitions, onClose]);

    const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
        if (playerRef.current && pressedKeys.current.has(e.key)) {
            pressedKeys.current.delete(e.key);
            // Only call checkKeyTransitions for KeyUp for non-movement keys or specific KEY_RELEASED transitions
            // For movement keys, we mainly care about KeyDown events
            if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                checkKeyTransitions(playerRef.current.instance.id, e.key, false);
            }
        }
    }, [checkKeyTransitions]);

    const processSpawnedEntities = useCallback(() => {
        if (pendingSpawnsRef.current.length === 0) return;
        
        const newAnimatedEntities: AnimatedEntity[] = [];
        
        pendingSpawnsRef.current.forEach(instance => {
            console.log('🔄 Processing spawn:', {
                instanceId: instance.id,
                templateId: instance.entityTemplateId,
                position: instance.position
            });
            
            const template = entityTemplates.find(t => t.id === instance.entityTemplateId);
            if (!template) {
                console.error('❌ Template not found:', instance.entityTemplateId);
                return;
            }

            // Get sprite (same logic as existing entity loading)
            let spriteAssetId: string | undefined;
            
            if (instance.componentOverrides) {
                for (const compId in instance.componentOverrides) {
                    const compDef = componentDefinitions.find(c => c.id === compId);
                    const spriteProp = compDef?.properties.find(p => p.type === 'sprite_ref');
                    if (spriteProp && instance.componentOverrides[compId]?.[spriteProp.name]) {
                        spriteAssetId = instance.componentOverrides[compId][spriteProp.name];
                        break;
                    }
                }
            }

            if (!spriteAssetId) {
                for (const comp of template.components) {
                    const compDef = componentDefinitions.find(c => c.id === comp.definitionId);
                    const spriteProp = compDef?.properties.find(p => p.type === 'sprite_ref');
                    if (spriteProp && comp.defaultValues?.[spriteProp.name]) {
                        spriteAssetId = comp.defaultValues[spriteProp.name];
                        break;
                    }
                }
            }

            console.log('🖼️ Sprite search:', {
                spriteAssetId,
                availableSprites: allAssets.filter(a => a.type === 'sprite').map(a => a.id)
            });

            let spriteAsset = allAssets.find(a => a.id === spriteAssetId && a.type === 'sprite');
            let sprite = spriteAsset?.data as Sprite;
            
            // Fallback: Use first available sprite if configured sprite not found
            if (!sprite?.frames?.length) {
                console.warn('⚠️ Sprite not found, using fallback:', spriteAssetId);
                spriteAsset = allAssets.find(a => a.type === 'sprite');
                sprite = spriteAsset?.data as Sprite;
                
                if (!sprite?.frames?.length) {
                    console.error('❌ No sprites available in project');
                    return;
                }
                
                console.log('✅ Using fallback sprite:', spriteAsset?.id);
            }

            let frameImages = sprite.frames.map(frame => {
                const img = new Image();
                img.src = createSpriteDataURL(frame.data, sprite.size.width, sprite.size.height);
                return img;
            });
            
            // Create fake animation frames for single-frame sprites (for spawned entities)
            if (frameImages.length === 1) {
                console.log('🎭 Creating fake animation frames for single-frame sprite');
                const originalFrame = frameImages[0];
                
                // Create 3 additional frames with slight variations (tint effects)
                for (let i = 1; i < 4; i++) {
                    const canvas = document.createElement('canvas');
                    canvas.width = sprite.size.width;
                    canvas.height = sprite.size.height;
                    const ctx = canvas.getContext('2d');
                    
                    if (ctx) {
                        ctx.drawImage(originalFrame, 0, 0);
                        
                        // Apply different tint for each frame
                        ctx.globalCompositeOperation = 'multiply';
                        ctx.fillStyle = i === 1 ? 'rgba(255, 200, 200, 0.1)' : 
                                       i === 2 ? 'rgba(200, 255, 200, 0.1)' : 
                                                'rgba(200, 200, 255, 0.1)';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        
                        const img = new Image();
                        img.src = canvas.toDataURL();
                        frameImages.push(img);
                    }
                }
            }

            let mirroredFrameImages: HTMLImageElement[] | undefined;
            if (['right', 'left'].includes(sprite.facingDirection)) {
                mirroredFrameImages = sprite.frames.map(frame => {
                    const mirroredData = mirrorPixelDataHorizontally(frame.data);
                    const img = new Image();
                    img.src = createSpriteDataURL(mirroredData, sprite.size.width, sprite.size.height);
                    return img;
                });
            }

            const startX = instance.position.x * TILE_SIZE;
            const startY = instance.position.y * TILE_SIZE;

            const newAnimatedEntity: AnimatedEntity = {
                instance,
                template,
                sprite,
                x: startX,
                y: startY,
                vx: 0,
                vy: 0,
                frameImages,
                mirroredFrameImages,
                currentFrame: 0,
                lastFrameUpdateTime: 0
            };

            console.log('✅ Created animated entity:', {
                id: instance.id,
                templateName: template.name,
                pixelPosition: { x: startX, y: startY },
                tilePosition: instance.position,
                spriteSize: sprite.size,
                framesCount: frameImages.length
            });

            newAnimatedEntities.push(newAnimatedEntity);
        });
        
        // Add new entities to the main entities list
        entitiesRef.current = [...entitiesRef.current, ...newAnimatedEntities];
        pendingSpawnsRef.current = []; // Clear pending spawns
        
        if (newAnimatedEntities.length > 0) {
            console.log(`🎯 Spawned ${newAnimatedEntities.length} new entities. Total entities: ${entitiesRef.current.length}`);
            console.log('New entities:', newAnimatedEntities.map(e => ({ name: e.template.name, x: e.x, y: e.y })));
            
            // Update UI state to trigger re-render
            setEntityCount(entitiesRef.current.length);
        }
    }, [entityTemplates, componentDefinitions, allAssets]);

    useEffect(() => {
        if (isOpen) {
            modalRef.current?.focus();
            pressedKeys.current.clear();
        } else {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            entitiesRef.current = [];
            playerRef.current = null;
            return;
        }

        const getAsset = <T extends string>(assetId: string | null | undefined, assetType: T): ProjectAsset | undefined => {
            if (!assetId) return undefined;
            return allAssets.find(a => a.id === assetId && a.type === assetType);
        };

        const entitiesToAnimate: AnimatedEntity[] = [];
        
        screenMap.layers.entities.forEach(instance => {
            const template = entityTemplates.find(t => t.id === instance.entityTemplateId);
            if (!template) return;

            let spriteAssetId: string | undefined;
            
            // Get sprite from component overrides or template defaults
            if (instance.componentOverrides) {
                for (const compId in instance.componentOverrides) {
                    const compDef = componentDefinitions.find(c => c.id === compId);
                    const spriteProp = compDef?.properties.find(p => p.type === 'sprite_ref');
                    if (spriteProp && instance.componentOverrides[compId]?.[spriteProp.name]) {
                        spriteAssetId = instance.componentOverrides[compId][spriteProp.name];
                        break;
                    }
                }
            }

            if (!spriteAssetId) {
                for (const comp of template.components) {
                    const compDef = componentDefinitions.find(c => c.id === comp.definitionId);
                    const spriteProp = compDef?.properties.find(p => p.type === 'sprite_ref');
                    if (spriteProp && comp.defaultValues?.[spriteProp.name]) {
                        spriteAssetId = comp.defaultValues[spriteProp.name];
                        break;
                    }
                }
            }

            const spriteAsset = getAsset(spriteAssetId, 'sprite');
            const sprite = spriteAsset?.data as Sprite;
            if (!sprite?.frames?.length) return;

            const frameImages = sprite.frames.map(frame => {
                const img = new Image();
                img.src = createSpriteDataURL(frame.data, sprite.size.width, sprite.size.height);
                return img;
            });

            let mirroredFrameImages: HTMLImageElement[] | undefined;
            if (['right', 'left'].includes(sprite.facingDirection)) {
                mirroredFrameImages = sprite.frames.map(frame => {
                    const mirroredData = mirrorPixelDataHorizontally(frame.data);
                    const img = new Image();
                    img.src = createSpriteDataURL(mirroredData, sprite.size.width, sprite.size.height);
                    return img;
                });
            }

            let stateMachine: StateMachine | undefined;
            let currentState: string | undefined;

            const smc = template.components.find(c => c.definitionId === 'comp_statemachine');
            const smcOverride = instance.componentOverrides?.['comp_statemachine'];
            const stateMachineAssetId = smcOverride?.stateMachineAssetId || smc?.defaultValues?.stateMachineAssetId;

            if (stateMachineAssetId && stateMachineAssetId !== '0' && stateMachineAssetId !== '') {
                const stateMachineAsset = getAsset(stateMachineAssetId, 'statemachine');
                stateMachine = stateMachineAsset?.data as StateMachine | undefined;
                if (stateMachine) {
                    const instanceCurrentStateId = smcOverride?.currentStateId;
                    const templateCurrentStateId = smc?.defaultValues?.currentStateId;
                    const machineInitialStateId = stateMachine.initialStateId;
                    
                    const startStateId = instanceCurrentStateId || templateCurrentStateId || machineInitialStateId;
                    
                    console.log(`🎯 State Machine Initialization for ${template.name}:`, {
                        instanceName: instance.name,
                        stateMachineAsset: stateMachineAssetId,
                        instanceCurrentStateId,
                        templateCurrentStateId,
                        machineInitialStateId,
                        selectedStartStateId: startStateId,
                        availableStates: stateMachine.states.map(s => ({ id: s.id, name: s.name }))
                    });
                    
                    let initialState = stateMachine.states.find(s => s.id === startStateId);

                    if (!initialState && startStateId) {
                        initialState = stateMachine.states.find(s => s.name === startStateId);
                        console.log(`🔍 State found by name: ${initialState?.name}`);
                    }

                    if (!initialState) {
                        initialState = stateMachine.states.find(s => s.name.toLowerCase() === 'idle') || stateMachine.states[0];
                        console.log(`🔍 Fallback state selected: ${initialState?.name}`);
                    }
                    
                    currentState = initialState?.name;
                    console.log(`✅ Final selected state: ${currentState}`);
                }
            }

            const startX = instance.position.x * TILE_SIZE;
            const startY = instance.position.y * TILE_SIZE;

            // Check if entity has rotation component and auto-generate rotated sprites
            const hasRotateComponent = template.components.some(c => c.definitionId === 'comp_rotate');
            let finalFrameImages = frameImages;
            
            if (hasRotateComponent && sprite.frames.length > 0) {
                // Create temporary entity for sprite generation
                const tempEntity: AnimatedEntity = {
                    instance, template, sprite, x: startX, y: startY, vx: 0, vy: 0,
                    frameImages, currentFrame: 0, lastFrameUpdateTime: 0
                };
                
                finalFrameImages = generateRotatedSprites(tempEntity);
                console.log(`🎯 Auto-generated directional sprites for ${template.name}: ${finalFrameImages.length} total frames`);
            }

            const newAnimatedEntity: AnimatedEntity = {
                instance,
                template,
                sprite,
                x: startX,
                y: startY,
                vx: 0,
                vy: 0,
                frameImages: finalFrameImages,
                mirroredFrameImages,
                currentFrame: 0,
                lastFrameUpdateTime: 0,
                stateMachine,
                currentState
            };

            entitiesToAnimate.push(newAnimatedEntity);

            // Detect player entity
            if (template.components.some(c => c.definitionId === 'comp_player_input') ||
                template.name === 'Player') {
                playerRef.current = newAnimatedEntity;
            }
        });

        entitiesRef.current = entitiesToAnimate;
        setEntityCount(entitiesToAnimate.length); // Initialize UI counter
        
        // Dynamic Engine Detection and Registration
        const requiredEngineIds = detectRequiredEngines(entitiesToAnimate);
        const activeEngines = requiredEngineIds.map(engineId => AVAILABLE_ENGINES[engineId]).filter(Boolean);
        activeEnginesRef.current = activeEngines;
        
        console.log('🎮 Dynamic Engine System:', {
            totalEntities: entitiesToAnimate.length,
            requiredEngines: requiredEngineIds,
            activeEngineCount: activeEngines.length,
            entityTemplates: entitiesToAnimate.map(e => ({
                name: e.template.name,
                components: e.template.components.map(c => c.definitionId)
            }))
        });
        
        // DIAGNOSTIC: Log screen map entities and available assets
        console.log('🔍 DIAGNOSTIC INFO:', {
            screenMapEntities: screenMap.layers.entities.length,
            entityInstances: screenMap.layers.entities.map(e => {
                const template = entityTemplates.find(t => t.id === e.entityTemplateId);
                const hasWallCollision = template?.components.some(c => c.definitionId === 'comp_wall_collision');
                return {
                    id: e.id, 
                    templateId: e.entityTemplateId, 
                    name: e.name,
                    position: e.position,
                    templateName: template?.name,
                    hasWallCollision
                };
            }),
            availableTemplates: entityTemplates.map(t => ({
                id: t.id, 
                name: t.name,
                hasWallCollision: t.components.some(c => c.definitionId === 'comp_wall_collision')
            })),
            availableSprites: allAssets.filter(a => a.type === 'sprite').map(a => ({
                id: a.id, 
                name: a.name
            })),
            collectorPlayerTemplate: entityTemplates.find(t => t.id === 'tpl_collector_player')
        });
        
    }, [isOpen, screenMap, allAssets, entityTemplates, componentDefinitions]);

    // HUD image cache
    const hudImageCache = useRef<Map<string, HTMLImageElement>>(new Map());


    // HUD rendering function
    const renderHUDElements = useCallback((ctx: CanvasRenderingContext2D) => {
        const hudElements = screenMap.hudConfiguration?.elements;
        if (!hudElements || hudElements.length === 0) return;

        console.log('🎨 Rendering HUD elements:', hudElements.length);

        hudElements.forEach(hudEl => {
            if (!hudEl.visible) return;

            // Check if it's a text-based HUD element
            const isTextBased = [
                'Score', 'HighScore', 'Lives', 'SceneName', 'CoinCounter',
                'AttackAlert', 'TextBox', 'NumericField', 'CustomCounter'
            ].includes(hudEl.type);

            if (isTextBased && (hudEl.text || hudEl.name)) {
                const textToRender = hudEl.text || hudEl.name || "TEXT";
                const charSpacing = hudEl.details?.charSpacing || 0;

                // Extract colors from HUD element details
                const hudTextColor = hudEl.details?.textColor || undefined;
                const hudBackgroundColor = hudEl.details?.textBackgroundColor || undefined;

                console.log(`🖼️ Rendering HUD text: "${textToRender}" at (${hudEl.position.x}, ${hudEl.position.y})`);
                console.log(`🎨 HUD Colors - Text: ${hudTextColor}, Background: ${hudBackgroundColor}`);

                // Try to use tile-based font from Bank 0 first with custom colors
                const tileBasedFont = createTileBasedFont(tileBanks, allAssets, msxFont || DEFAULT_MSX_FONT, msxFontColorAttributes, hudTextColor, hudBackgroundColor);
                const fontToUse = msxFont || DEFAULT_MSX_FONT;
                const fontColorAttrs = msxFontColorAttributes || {};

                if (tileBasedFont) {
                    console.log('✅ Using tile-based font');
                    // Render character by character using tiles
                    let xOffset = hudEl.position.x;

                    for (const char of textToRender) {
                        const tileImg = tileBasedFont[char.toUpperCase()] || tileBasedFont[char];

                        if (tileImg && tileImg.complete && tileImg.naturalWidth > 0) {
                            ctx.drawImage(tileImg, xOffset, hudEl.position.y, 8, 8);
                            console.log(`✅ Drew tile for '${char}' at (${xOffset}, ${hudEl.position.y})`);
                        } else {
                            // Fallback with custom colors if provided
                            const fallbackBgColor = hudBackgroundColor && hudBackgroundColor !== 'transparent' ? hudBackgroundColor : '#FF0000';
                            const fallbackTextColor = hudTextColor || '#FFFFFF';

                            if (hudBackgroundColor !== 'transparent') {
                                ctx.fillStyle = fallbackBgColor;
                                ctx.fillRect(xOffset, hudEl.position.y, 8, 8);
                            }
                            ctx.fillStyle = fallbackTextColor;
                            ctx.font = '6px monospace';
                            ctx.fillText(char, xOffset + 1, hudEl.position.y + 6);
                            console.log(`⚠️ Used fallback for '${char}' at (${xOffset}, ${hudEl.position.y}) with colors ${fallbackTextColor}/${fallbackBgColor}`);
                        }

                        xOffset += 8 + charSpacing;
                    }
                } else {
                    console.log('❌ No tile-based font, using MSX font fallback');
                    // Fallback to MSX font rendering
                    try {
                        const textImageSrc = renderMSX1TextToDataURL(
                            textToRender,
                            fontToUse,
                            fontColorAttrs,
                            1,
                            charSpacing,
                            hudTextColor,
                            hudBackgroundColor
                        );

                        const img = new Image();
                        img.onload = () => {
                            ctx.drawImage(img, hudEl.position.x, hudEl.position.y);
                        };
                        img.src = textImageSrc;
                    } catch (error) {
                        console.warn('Failed to render fallback HUD text:', textToRender, error);

                        // Final fallback: simple text with custom colors
                        ctx.fillStyle = hudTextColor || '#FFFFFF';
                        ctx.font = '8px monospace';
                        ctx.fillText(textToRender, hudEl.position.x, hudEl.position.y + 8);
                    }
                }
            }
        });
    }, [screenMap.hudConfiguration?.elements, msxFont, msxFontColorAttributes, tileBanks, allAssets]);

    // Key tracking system
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            pressedKeys.current.add(e.code);
            // Also add to global for engine access
            if (!(window as any).currentPressedKeys) {
                (window as any).currentPressedKeys = new Set();
            }
            (window as any).currentPressedKeys.add(e.code);
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            pressedKeys.current.delete(e.code);
            if ((window as any).currentPressedKeys) {
                (window as any).currentPressedKeys.delete(e.code);
            }
        };

        // Add event listeners
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            pressedKeys.current.clear();
            if ((window as any).currentPressedKeys) {
                (window as any).currentPressedKeys.clear();
            }
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.imageSmoothingEnabled = false;
        
        const tileset = allAssets.filter(a => a.type === 'tile').map(a => a.data as Tile);

        const animate = () => {
            ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
            renderScreenToCanvas(canvas, screenMap, tileset, currentScreenMode, TILE_SIZE);

            // Render HUD elements
            renderHUDElements(ctx);

            // Execute Active Game Engines Dynamically
            activeEnginesRef.current.forEach(engine => {
                engine.execute(entitiesRef.current, componentDefinitions, screenMap, entityTemplates, allAssets, pendingSpawnsRef);
            });

            // Process any pending spawned entities
            processSpawnedEntities();
            
            // Update entities position and rendering
            entitiesRef.current.forEach(entity => {
                // Check if movement would cause collision before applying it
                let newX = entity.x + entity.vx;
                let newY = entity.y + entity.vy;
                
                // Check collision for the new position - TEMPORARILY DISABLED FOR TESTING
                // DISABLED: const wallCollisionComp = entity.template.components.find(c => c.definitionId === 'comp_wall_collision' || c.definitionId === 'comp_collision');
                if (false && wallCollisionComp && screenMap?.layers?.collision?.tiles) {
                    const componentId = wallCollisionComp.definitionId;
                    const props = { ...wallCollisionComp.defaultValues, ...(entity.instance.componentOverrides?.[componentId] || {}) };
                    
                    // Get hitbox values from sprite first, then fallback to collision component
                    let hitboxWidth = 12;
                    let hitboxHeight = 12;
                    let offsetX = 2;
                    let offsetY = 2;

                    // Try to get sprite hitbox values
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
                    
                    // Get sprite asset and use its hitbox values (solo si allAssets está disponible)
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

                    // Fallback: use collision component values if no sprite hitbox (with Pac-Man style adjustment)
                    if (!spriteAssetId || !allAssets || !allAssets.find(a => a.id === spriteAssetId && a.type === 'sprite')?.data?.hitbox) {
                        hitboxWidth = Number(props.hitboxWidth) > 14 ? 12 : Number(props.hitboxWidth) || 12;
                        hitboxHeight = Number(props.hitboxHeight) > 14 ? 12 : Number(props.hitboxHeight) || 12;
                        offsetX = Number(props.offsetX) || 2;
                        offsetY = Number(props.offsetY) || 2;
                    }
                    
                    // Check if new position would collide
                    const entityLeft = newX + offsetX;
                    const entityTop = newY + offsetY;
                    const entityRight = entityLeft + hitboxWidth;
                    const entityBottom = entityTop + hitboxHeight;
                    
                    const leftTile = Math.floor(entityLeft / 16);
                    const topTile = Math.floor(entityTop / 16);
                    const rightTile = Math.floor((entityRight - 1) / 16);
                    const bottomTile = Math.floor((entityBottom - 1) / 16);
                    
                    let hasCollision = false;
                    
                    // Check all tiles the entity would occupy
                    for (let tileY = topTile; tileY <= bottomTile && !hasCollision; tileY++) {
                        for (let tileX = leftTile; tileX <= rightTile && !hasCollision; tileX++) {
                            if (tileX < 0 || tileY < 0 || tileX >= screenMap.width || tileY >= screenMap.height) {
                                hasCollision = true;
                                break;
                            }
                            
                            const tileIndex = tileY * screenMap.width + tileX;
                            const tile = screenMap.layers.collision.tiles[tileIndex];
                            
                            if (tile && tile.id !== 'empty' && tile.id !== '') {
                                hasCollision = true;
                                break;
                            }
                        }
                    }
                    
                    // Only apply movement if no collision
                    if (!hasCollision) {
                        entity.x = newX;
                        entity.y = newY;
                    } else {
                        // Stop velocity on collision (only log if entity was actually moving)
                        if (entity.vx !== 0 || entity.vy !== 0) {
                            console.log(`🚧 Collision detected! Stopping velocity (${entity.vx}, ${entity.vy}) → (0, 0) at position (${entity.x}, ${entity.y})`);
                        }
                        entity.vx = 0;
                        entity.vy = 0;
                    }
                } else {
                    // No collision detection component, apply movement normally
                    entity.x = newX;
                    entity.y = newY;
                }

                // Apply screen boundary constraints
                const spriteWidth = entity.sprite.size.width;
                const spriteHeight = entity.sprite.size.height;

                if (entity.x < 0) {
                    entity.x = 0;
                    entity.vx = 0;
                } else if (entity.x + spriteWidth > PREVIEW_WIDTH) {
                    entity.x = PREVIEW_WIDTH - spriteWidth;
                    entity.vx = 0;
                }

                if (entity.y < 0) {
                    entity.y = 0;
                    entity.vy = 0;
                } else if (entity.y + spriteHeight > PREVIEW_HEIGHT) {
                    entity.y = PREVIEW_HEIGHT - spriteHeight;
                    entity.vy = 0;
                }

                // Choose correct sprite image (animation is now handled by animation engine)
                // Ensure currentFrame is within bounds
                const safeFrameIndex = Math.min(entity.currentFrame, entity.frameImages.length - 1);
                let imageToDraw = entity.frameImages[safeFrameIndex];
                
                if (entity.mirroredFrameImages && safeFrameIndex < entity.mirroredFrameImages.length) {
                    if (entity.sprite.facingDirection === 'right' && entity.vx < 0) {
                        imageToDraw = entity.mirroredFrameImages[safeFrameIndex];
                    } else if (entity.sprite.facingDirection === 'left' && entity.vx > 0) {
                        imageToDraw = entity.mirroredFrameImages[safeFrameIndex];
                    }
                }

                if (imageToDraw) {
                    ctx.drawImage(imageToDraw, entity.x, entity.y);
                }
                
                // Debug: Draw hitboxes when debug mode is enabled
                if (debugMode) {
                    // Get hitbox values from sprite first, then fallback to collision component
                    let hitboxWidth = 16;
                    let hitboxHeight = 16;
                    let offsetX = 0;
                    let offsetY = 0;
                    
                    // Try to get sprite hitbox values
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
                    
                    // Get sprite asset and use its hitbox values (solo si allAssets está disponible)
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
                    
                    // Fallback: get from collision components
                    if (!spriteAssetId || !allAssets || !allAssets.find(a => a.id === spriteAssetId && a.type === 'sprite')?.data?.hitbox) {
                        const collisionComp = entity.template.components.find(c => c.definitionId === 'comp_collision' || c.definitionId === 'comp_wall_collision');
                        if (collisionComp) {
                            const props = { ...collisionComp.defaultValues, ...(entity.instance?.componentOverrides?.[collisionComp.definitionId] || {}) };
                            hitboxWidth = Number(props.hitboxWidth) || 16;
                            hitboxHeight = Number(props.hitboxHeight) || 16;
                            offsetX = Number(props.offsetX) || 0;
                            offsetY = Number(props.offsetY) || 0;
                        }
                    }
                    
                    // Draw hitbox as semi-transparent gray rectangle
                    ctx.save();
                    ctx.fillStyle = 'rgba(128, 128, 128, 0.3)'; // Semi-transparent gray
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; // White border
                    ctx.lineWidth = 1;
                    
                    const hitboxX = entity.x + offsetX;
                    const hitboxY = entity.y + offsetY;
                    
                    ctx.fillRect(hitboxX, hitboxY, hitboxWidth, hitboxHeight);
                    ctx.strokeRect(hitboxX, hitboxY, hitboxWidth, hitboxHeight);
                    ctx.restore();
                }
                
                // Check if bullet entities should be cleaned up (off-screen)
                if (entity.template.id === 'tpl_player_bullet') {
                    if (entity.y < -20 || entity.y > PREVIEW_HEIGHT + 20 || 
                        entity.x < -20 || entity.x > PREVIEW_WIDTH + 20) {
                        entity.markedForDestruction = true;
                    }
                }
            });
            
            // Remove entities marked for destruction
            entitiesRef.current = entitiesRef.current.filter(entity => !entity.markedForDestruction);

            animationFrameId.current = requestAnimationFrame(animate);
        };

        animationFrameId.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [isOpen, screenMap, allAssets, currentScreenMode, debugMode, renderHUDElements]);

    if (!isOpen) return null;

    return (
        <div
            ref={modalRef}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4 outline-none"
            onClick={onClose}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            tabIndex={-1}
        >
            <div
                className="bg-msx-panelbg p-4 sm:p-6 rounded-lg shadow-xl animate-slideIn font-sans flex flex-col items-center"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4 pixel-font">Screen Play Mode</h2>
                <p className="text-xs text-msx-textsecondary mb-1">Use Arrow keys to move. Press Escape to close.</p>
                <p className="text-xs text-msx-textsecondary mb-1">
                    Active Engines: {activeEnginesRef.current.map(e => e.name).join(', ') || 'None'}
                </p>
                <p className="text-xs text-msx-textsecondary mb-2">
                    Total Entities: {entityCount} | Pending Spawns: {pendingSpawnsRef.current.length}
                </p>
                <div className="relative" style={{ width: PREVIEW_WIDTH * 2, height: PREVIEW_HEIGHT * 2 }}>
                    <canvas
                        ref={canvasRef}
                        width={PREVIEW_WIDTH}
                        height={PREVIEW_HEIGHT}
                        className="border-2 border-msx-border"
                        style={{
                            width: PREVIEW_WIDTH * 2,
                            height: PREVIEW_HEIGHT * 2,
                            imageRendering: 'pixelated',
                            backgroundColor: 'black'
                        }}
                    />
                </div>
                <div className="flex items-center justify-between mt-4">
                    <Button 
                        onClick={() => setDebugMode(!debugMode)} 
                        variant={debugMode ? "primary" : "secondary"} 
                        size="md"
                    >
                        {debugMode ? "Debug ON" : "Debug OFF"}
                    </Button>
                    <Button onClick={onClose} variant="primary" size="md">Close</Button>
                </div>
            </div>
        </div>
    );
};