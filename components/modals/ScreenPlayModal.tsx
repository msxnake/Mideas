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
                    
                    // Only apply friction when entity is NOT being controlled by state machine
                    const hasPlayerInput = entity.template.components.some(c => c.definitionId === 'comp_player_input');
                    const friction = Number(physicsProps.friction || 0) / 1000; // Reduced friction impact
                    
                    // Apply friction only when not actively moving (no input)
                    if (friction > 0 && !hasPlayerInput) {
                        entity.vx *= (1 - friction);
                        entity.vy *= (1 - friction);
                        
                        // Stop very small velocities to prevent jitter
                        if (Math.abs(entity.vx) < 0.05) entity.vx = 0;
                        if (Math.abs(entity.vy) < 0.05) entity.vy = 0;
                    }
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
                    entity.currentFrame = (entity.currentFrame + 1) % entity.frameImages.length;
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
                    
                    // Apply movement based on pressed keys
                    if (currentPressedKeys.has('ArrowUp') || currentPressedKeys.has('KeyW')) {
                        entity.vy = -speed;
                    }
                    if (currentPressedKeys.has('ArrowDown') || currentPressedKeys.has('KeyS')) {
                        entity.vy = speed;
                    }
                    if (currentPressedKeys.has('ArrowLeft') || currentPressedKeys.has('KeyA')) {
                        entity.vx = -speed;
                    }
                    if (currentPressedKeys.has('ArrowRight') || currentPressedKeys.has('KeyD')) {
                        entity.vx = speed;
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

    collision: {
        id: 'collision',
        name: 'Collision Detection Engine',
        execute: (entities: AnimatedEntity[], componentDefinitions: ComponentDefinition[]) => {
            // Simple collision detection between entities
            for (let i = 0; i < entities.length; i++) {
                for (let j = i + 1; j < entities.length; j++) {
                    const entityA = entities[i];
                    const entityB = entities[j];
                    
                    const collisionA = entityA.template.components.find(c => c.definitionId === 'comp_collision');
                    const collisionB = entityB.template.components.find(c => c.definitionId === 'comp_collision');
                    
                    if (!collisionA || !collisionB) continue;
                    
                    const propsA = { ...collisionA.defaultValues, ...(entityA.instance.componentOverrides?.['comp_collision'] || {}) };
                    const propsB = { ...collisionB.defaultValues, ...(entityB.instance.componentOverrides?.['comp_collision'] || {}) };
                    
                    const layerA = Number(propsA.collisionLayer) || 1;
                    const layerB = Number(propsB.collisionLayer) || 1;
                    const collidesWithA = Number(propsA.collidesWith) || 255;
                    const collidesWithB = Number(propsB.collidesWith) || 255;
                    
                    // Check if layers should collide
                    if (!((collidesWithA & layerB) || (collidesWithB & layerA))) continue;
                    
                    // Simple AABB collision detection
                    const widthA = Number(propsA.hitboxWidth) || 16;
                    const heightA = Number(propsA.hitboxHeight) || 16;
                    const offsetXA = Number(propsA.offsetX) || 0;
                    const offsetYA = Number(propsA.offsetY) || 0;
                    
                    const widthB = Number(propsB.hitboxWidth) || 16;
                    const heightB = Number(propsB.hitboxHeight) || 16;
                    const offsetXB = Number(propsB.offsetX) || 0;
                    const offsetYB = Number(propsB.offsetY) || 0;
                    
                    const x1 = entityA.x + offsetXA;
                    const y1 = entityA.y + offsetYA;
                    const x2 = entityB.x + offsetXB;
                    const y2 = entityB.y + offsetYB;
                    
                    if (x1 < x2 + widthB && x1 + widthA > x2 && 
                        y1 < y2 + heightB && y1 + heightA > y2) {
                        
                        // Collision detected! Handle damage
                        const damageA = entityA.template.components.find(c => c.definitionId === 'comp_damage');
                        const damageB = entityB.template.components.find(c => c.definitionId === 'comp_damage');
                        const healthA = entityA.template.components.find(c => c.definitionId === 'comp_health');
                        const healthB = entityB.template.components.find(c => c.definitionId === 'comp_health');
                        
                        // Apply damage from A to B
                        if (damageA && healthB) {
                            const damageProps = { ...damageA.defaultValues, ...(entityA.instance.componentOverrides?.['comp_damage'] || {}) };
                            const damageAmount = Number(damageProps.damageAmount) || 1;
                            
                            if (!entityB.healthData) {
                                const healthProps = { ...healthB.defaultValues, ...(entityB.instance.componentOverrides?.['comp_health'] || {}) };
                                entityB.healthData = {
                                    current: Number(healthProps.current),
                                    max: Number(healthProps.max)
                                };
                            }
                            
                            entityB.healthData.current -= damageAmount;
                            console.log(`💥 ${entityB.template.name} hit by ${entityA.template.name} for ${damageAmount} damage! Health: ${entityB.healthData.current}/${entityB.healthData.max}`);
                            
                            if (entityB.healthData.current <= 0) {
                                console.log(`💀 ${entityB.template.name} destroyed!`);
                                entityB.markedForDestruction = true;
                            }
                            
                            // Destroy bullet on impact
                            if (entityA.template.id === 'tpl_player_bullet') {
                                entityA.markedForDestruction = true;
                            }
                        }
                        
                        // Apply damage from B to A (if both have damage components)
                        if (damageB && healthA && !entityA.markedForDestruction) {
                            const damageProps = { ...damageB.defaultValues, ...(entityB.instance.componentOverrides?.['comp_damage'] || {}) };
                            const damageAmount = Number(damageProps.damageAmount) || 1;
                            
                            if (!entityA.healthData) {
                                const healthProps = { ...healthA.defaultValues, ...(entityA.instance.componentOverrides?.['comp_health'] || {}) };
                                entityA.healthData = {
                                    current: Number(healthProps.current),
                                    max: Number(healthProps.max)
                                };
                            }
                            
                            entityA.healthData.current -= damageAmount;
                            console.log(`💥 ${entityA.template.name} hit by ${entityB.template.name} for ${damageAmount} damage! Health: ${entityA.healthData.current}/${entityA.healthData.max}`);
                            
                            if (entityA.healthData.current <= 0) {
                                console.log(`💀 ${entityA.template.name} destroyed!`);
                                entityA.markedForDestruction = true;
                            }
                        }
                    }
                }
            }
        }
    },

    tileCollection: {
        id: 'tileCollection',
        name: 'Tile Collection Engine',
        execute: (entities: AnimatedEntity[], componentDefinitions: ComponentDefinition[], screenMap?: ScreenMap, entityTemplates?: EntityTemplate[], allAssets?: ProjectAsset[]) => {
            if (!screenMap) return;

            entities.forEach(entity => {
                const tileCollectorComp = entity.template.components.find(c => c.definitionId === 'comp_tile_collector');
                const inventoryComp = entity.template.components.find(c => c.definitionId === 'comp_inventory');
                
                if (tileCollectorComp) {
                    const collectorProps = { 
                        ...tileCollectorComp.defaultValues, 
                        ...(entity.instance.componentOverrides?.['comp_tile_collector'] || {}) 
                    };
                    
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
                        const currentTile = screenMap.layers.background.tiles[tilePos.y]?.[tilePos.x];
                        if (!currentTile) return;

                        // Check if this tile is collectible
                        const isCollectible = collectibleTileIds.some(collectibleId => 
                            currentTile.tileId === collectibleId ||
                            currentTile.id === collectibleId
                        );

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
                                screenMap.layers.background.tiles[tilePos.y][tilePos.x] = {
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
    }
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
                case 'comp_tile_collector':
                    requiredEngines.add('tileCollection');
                    break;
            }
        });
        
        // Check instance overrides for additional engines
        if (entity.instance.componentOverrides?.comp_patrol) {
            requiredEngines.add('patrol');
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
    markedForDestruction?: boolean;
}

interface ScreenPlayModalProps {
    isOpen: boolean;
    onClose: () => void;
    screenMap: ScreenMap;
    allAssets: ProjectAsset[];
    entityTemplates: EntityTemplate[];
    componentDefinitions: ComponentDefinition[];
    currentScreenMode: string;
}

export const ScreenPlayModal: React.FC<ScreenPlayModalProps> = ({
    isOpen,
    onClose,
    screenMap,
    allAssets,
    entityTemplates,
    componentDefinitions,
    currentScreenMode
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

    const checkKeyTransitions = useCallback((entityId: string, pressedKey: string, isKeyDown: boolean) => {
        const entity = entitiesRef.current.find(e => e.instance.id === entityId);
        if (!entity || !entity.stateMachine || !entity.currentState) return;
        
        const currentStateDef = entity.stateMachine.states.find(s => s.name === entity.currentState);
        if (!currentStateDef) return;
        
        for (const transition of entity.stateMachine.transitions) {
            if (transition.fromStateId !== currentStateDef.id) continue;
            
            const condition = transition.conditions;
            if (!condition) continue;
            
            let conditionMet = false;
            
            if (isKeyDown && condition.type === 'KEY_PRESSED' && condition.params?.key === pressedKey) {
                conditionMet = true;
            } else if (!isKeyDown && condition.type === 'KEY_RELEASED' && condition.params?.key === pressedKey) {
                conditionMet = true;
            }
            
            if (conditionMet) {
                const nextState = entity.stateMachine.states.find(s => s.id === transition.toStateId);
                if (nextState) {
                    entity.currentState = nextState.name;
                    
                    if (transition.actions) {
                        for (const action of transition.actions) {
                            if (action.type === 'SET_VELOCITY') {
                                entity.vx = action.params.x || 0;
                                entity.vy = action.params.y || 0;
                            }
                        }
                    }
                    return;
                }
            }
        }
    }, []);

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
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
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
                    const startStateId = smcOverride?.currentStateId || smc?.defaultValues?.currentStateId || stateMachine.initialStateId;
                    let initialState = stateMachine.states.find(s => s.id === startStateId);

                    if (!initialState && startStateId) {
                        initialState = stateMachine.states.find(s => s.name === startStateId);
                    }

                    if (!initialState) {
                        initialState = stateMachine.states.find(s => s.name.toLowerCase() === 'idle') || stateMachine.states[0];
                    }
                    currentState = initialState?.name;
                }
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
            entityInstances: screenMap.layers.entities.map(e => ({
                id: e.id, 
                templateId: e.entityTemplateId, 
                name: e.name,
                position: e.position
            })),
            availableTemplates: entityTemplates.map(t => t.id),
            availableSprites: allAssets.filter(a => a.type === 'sprite').map(a => ({
                id: a.id, 
                name: a.name
            })),
            playerShipTemplateExists: entityTemplates.some(t => t.id === 'tpl_player_ship'),
            playerShipSpriteExists: allAssets.some(a => a.id === 'sprite_player_ship')
        });
        
    }, [isOpen, screenMap, allAssets, entityTemplates, componentDefinitions]);

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
            
            // Execute Active Game Engines Dynamically
            activeEnginesRef.current.forEach(engine => {
                engine.execute(entitiesRef.current, componentDefinitions, screenMap, entityTemplates, allAssets, pendingSpawnsRef);
            });
            
            // Process any pending spawned entities
            processSpawnedEntities();
            
            // Update entities position and rendering
            if (entitiesRef.current.length > 1) {
                console.log('🎨 Rendering entities:', entitiesRef.current.length, 'entities at frame');
            }
            entitiesRef.current.forEach(entity => {
                // Update position
                entity.x += entity.vx;
                entity.y += entity.vy;

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
                let imageToDraw = entity.frameImages[entity.currentFrame];
                if (entity.mirroredFrameImages) {
                    if (entity.sprite.facingDirection === 'right' && entity.vx < 0) {
                        imageToDraw = entity.mirroredFrameImages[entity.currentFrame];
                    } else if (entity.sprite.facingDirection === 'left' && entity.vx > 0) {
                        imageToDraw = entity.mirroredFrameImages[entity.currentFrame];
                    }
                }

                if (imageToDraw) {
                    ctx.drawImage(imageToDraw, entity.x, entity.y);
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
    }, [isOpen, screenMap, allAssets, currentScreenMode]);

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
                <div className="flex items-center mt-4">
                    <Button onClick={onClose} variant="primary" size="md">Close</Button>
                </div>
            </div>
        </div>
    );
};