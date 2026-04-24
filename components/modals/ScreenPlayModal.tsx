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
import { getBackgroundColorHex } from '../../utils/screenModeConfig';

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
    console.log(`📋 Frame structure: Right(0-${baseFrameCount - 1}), Up(${baseFrameCount}-${baseFrameCount * 2 - 1}), Left(${baseFrameCount * 2}-${baseFrameCount * 3 - 1}), Down(${baseFrameCount * 3}-${baseFrameCount * 4 - 1})`);
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
                    const strength = Number(gravityProps.strength || 0) / 60;
                    const terminalVelocity = Number(gravityProps.terminalVelocity || 2);

                    // Only apply gravity if entity is NOT on ground (not touching the ground)
                    // Note: wallCollisionEngine sets isGrounded, other systems may set isOnGround
                    if (!entity.isOnGround && !entity.isGrounded) {
                        entity.vy += strength;
                        if (entity.vy > terminalVelocity) entity.vy = terminalVelocity;
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
                    // Check if animation should only play when moving
                    const animateOnlyWhenMoving = animComp.defaultValues?.animateOnlyWhenMoving === true;
                    const isMoving = entity.vx !== 0 || entity.vy !== 0;

                    // Priority states that should always animate (death, hurt, attack, etc.)
                    const priorityStates = ['Dead', 'Death', 'Hurt', 'Hit', 'Damage', 'Attack', 'Attacking', 'Stunned', 'GameOver', 'Invulnerable'];
                    const isInPriorityState = entity.currentState && priorityStates.some(state =>
                        entity.currentState?.toLowerCase().includes(state.toLowerCase())
                    );

                    // Only animate if: not restricted to movement, OR is moving, OR in priority state
                    if (!animateOnlyWhenMoving || isMoving || isInPriorityState) {
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
                    } else if (animateOnlyWhenMoving && !isMoving && !isInPriorityState) {
                        // Reset to first frame when stopped (and not in priority state)
                        entity.currentFrame = 0;
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

                    // Horizontal patrol bounce with position correction
                    if (entity.vx > 0 && entity.x >= Math.max(startPixelX, endPixelX)) {
                        entity.vx = -entity.vx;
                        entity.x = Math.max(startPixelX, endPixelX);
                    }
                    if (entity.vx < 0 && entity.x <= Math.min(startPixelX, endPixelX)) {
                        entity.vx = -entity.vx;
                        entity.x = Math.min(startPixelX, endPixelX);
                    }

                    // Vertical patrol bounce with position correction
                    if (entity.vy > 0 && entity.y >= Math.max(startPixelY, endPixelY)) {
                        entity.vy = -entity.vy;
                        entity.y = Math.max(startPixelY, endPixelY);
                    }
                    if (entity.vy < 0 && entity.y <= Math.min(startPixelY, endPixelY)) {
                        entity.vy = -entity.vy;
                        entity.y = Math.min(startPixelY, endPixelY);
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
                            const newEntityId = `spawned_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
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
                            const bulletId = `bullet_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
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
            // Helper function to detect if entity is exiting the screen
            const detectScreenExit = (entity: AnimatedEntity, newX: number, newY: number): string | null => {
                if (!screenMap) return null;

                const wallCollisionComp = entity.template.components.find(c => c.definitionId === 'comp_wall_collision');
                if (!wallCollisionComp) return null;

                const props = { ...wallCollisionComp.defaultValues, ...(entity.instance.componentOverrides?.['comp_wall_collision'] || {}) };

                // Prioridad: comp_wall_collision > sprite.hitbox > sprite.size
                const spriteHitbox = entity.sprite.hitbox;
                const hitboxWidth = Number(props.hitboxWidth) || spriteHitbox?.width || entity.sprite.size.width;
                const hitboxHeight = Number(props.hitboxHeight) || spriteHitbox?.height || entity.sprite.size.height;
                const offsetX = (props.offsetX !== undefined && Number(props.offsetX) !== 0) ? Number(props.offsetX) : (spriteHitbox?.offsetX ?? 0);
                const offsetY = (props.offsetY !== undefined && Number(props.offsetY) !== 0) ? Number(props.offsetY) : (spriteHitbox?.offsetY ?? 0);
                const tileSize = Number(props.tileSize) || 8;

                const entityLeft = newX + offsetX;
                const entityTop = newY + offsetY;
                const entityRight = entityLeft + hitboxWidth;
                const entityBottom = entityTop + hitboxHeight;

                const leftTile = Math.floor(entityLeft / tileSize);
                const topTile = Math.floor(entityTop / tileSize);
                const rightTile = Math.floor((entityRight - 1) / tileSize);
                const bottomTile = Math.floor((entityBottom - 1) / tileSize);

                const mapWidth = screenMap.width || 0;
                const mapHeight = screenMap.height || 0;

                // Detectar si está saliendo completamente del mapa
                if (rightTile < 0) {
                    return 'left';
                } else if (leftTile >= mapWidth) {
                    return 'right';
                } else if (bottomTile < 0) {
                    return 'top';
                } else if (topTile >= mapHeight) {
                    return 'bottom';
                }

                return null;
            };

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

                // Prioridad: comp_wall_collision > sprite.hitbox > sprite.size
                const spriteHitbox = entity.sprite.hitbox;
                const hitboxWidth = Number(props.hitboxWidth) || spriteHitbox?.width || entity.sprite.size.width;
                const hitboxHeight = Number(props.hitboxHeight) || spriteHitbox?.height || entity.sprite.size.height;
                const offsetX = (props.offsetX !== undefined && Number(props.offsetX) !== 0) ? Number(props.offsetX) : (spriteHitbox?.offsetX ?? 0);
                const offsetY = (props.offsetY !== undefined && Number(props.offsetY) !== 0) ? Number(props.offsetY) : (spriteHitbox?.offsetY ?? 0);
                const tileSize = Number(props.tileSize) || 8;

                // Determine movement direction
                const movingHorizontally = newX !== entity.x;
                const movingVertically = newY !== entity.y;
                const movingRight = newX > entity.x;
                const movingLeft = newX < entity.x;
                const movingDown = newY > entity.y;
                const movingUp = newY < entity.y;

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

                // Only check tiles that are relevant to the movement direction
                if (movingHorizontally && !movingVertically) {
                    // ALLOW EDGE EXIT: Let entities move off screen at horizontal edges
                    const SCREEN_WIDTH_PX = (screenMap.width || 0) * tileSize;
                    const EDGE_THRESHOLD = hitboxWidth;
                    const isNearLeftEdge = entityLeft < EDGE_THRESHOLD;
                    const isNearRightEdge = entityRight > SCREEN_WIDTH_PX - EDGE_THRESHOLD;
                    const allowEdgeExit = (movingLeft && isNearLeftEdge) || (movingRight && isNearRightEdge);

                    if (allowEdgeExit) {
                        return false; // Allow movement off screen
                    }

                    // Horizontal movement: only check the leading edge
                    // IMPORTANT: Don't check bottomTile - that's the ground we're standing on
                    const checkTileX = movingRight ? rightTile : leftTile;
                    for (let tileY = topTile; tileY < bottomTile; tileY++) {
                        if (checkTileX < 0 || tileY < 0 ||
                            checkTileX >= (screenMap.width || 0) ||
                            tileY >= (screenMap.height || 0)) {
                            continue;
                        }
                        const tileOnLayer = screenMap.layers.collision[tileY]?.[checkTileX];
                        if (tileOnLayer && tileOnLayer.tileId) {
                            return true;
                        }
                    }
                } else if (movingVertically && !movingHorizontally) {
                    // Vertical movement: only check the leading edge
                    const checkTileY = movingDown ? bottomTile : topTile;
                    for (let tileX = leftTile; tileX <= rightTile; tileX++) {
                        if (tileX < 0 || checkTileY < 0 ||
                            tileX >= (screenMap.width || 0) ||
                            checkTileY >= (screenMap.height || 0)) {
                            continue;
                        }
                        const tileOnLayer = screenMap.layers.collision[checkTileY]?.[tileX];
                        if (tileOnLayer && tileOnLayer.tileId) {
                            return true;
                        }
                    }
                } else {
                    // Diagonal or no movement: check entire area
                    for (let tileY = topTile; tileY <= bottomTile; tileY++) {
                        for (let tileX = leftTile; tileX <= rightTile; tileX++) {
                            if (tileX < 0 || tileY < 0 ||
                                tileX >= (screenMap.width || 0) ||
                                tileY >= (screenMap.height || 0)) {
                                continue;
                            }
                            const tileOnLayer = screenMap.layers.collision[tileY]?.[tileX];
                            if (tileOnLayer && tileOnLayer.tileId) {
                                return true;
                            }
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

                    // Only skip if explicitly disabled (not if undefined)
                    if (cursorsProps.isEnabled === false) {
                        return;
                    }

                    const speed = Number(cursorsProps.speed) || 2;

                    // Get allowed directions (default to true if not specified)
                    const allowUp = cursorsProps.allowUp !== false;
                    const allowDown = cursorsProps.allowDown !== false;
                    const allowLeft = cursorsProps.allowLeft !== false;
                    const allowRight = cursorsProps.allowRight !== false;

                    // Check if entity has gravity component
                    const hasGravity = entity.template.components.some(c => c.definitionId === 'comp_gravity');
                    const airControlComp = entity.template.components.find(c => c.definitionId === 'comp_air_control');
                    const airControlProps = airControlComp
                        ? {
                            ...airControlComp.defaultValues,
                            ...(entity.instance.componentOverrides?.['comp_air_control'] || {})
                        }
                        : null;
                    const airControlEnabled = !!airControlProps && airControlProps.isEnabled !== false && airControlProps.isEnabled !== 'false';
                    const airControlMode = airControlEnabled
                        ? String(airControlProps?.airControlMode || 'locked').trim().toLowerCase()
                        : 'full';
                    const airControlLocked = hasGravity
                        && airControlMode === 'locked'
                        && !entity.isOnLadder
                        && !(entity.isOnGround || entity.isGrounded);

                    if (!airControlLocked) {
                        // Reset horizontal velocity only when air control allows new input this frame.
                        entity.vx = 0;
                    }

                    // Only reset vertical velocity if entity doesn't have gravity
                    if (!hasGravity) {
                        entity.vy = 0;
                    }

                    // Apply movement based on pressed keys with wall collision prevention and allowed directions
                    // If entity has gravity, only allow horizontal movement (vertical is controlled by gravity)
                    if (!hasGravity) {
                        if (allowUp && (currentPressedKeys.has('ArrowUp') || currentPressedKeys.has('KeyW'))) {
                            const newY = entity.y - speed;
                            const exitDirection = detectScreenExit(entity, entity.x, newY);

                            if (exitDirection) {
                                // Permitir movimiento y marcar cambio de pantalla
                                entity.vy = -speed;
                                screenExitDetectedRef.current = exitDirection;
                            } else if (!wouldCollideWithWall(entity, entity.x, newY)) {
                                entity.vy = -speed;
                            }
                        }
                        if (allowDown && (currentPressedKeys.has('ArrowDown') || currentPressedKeys.has('KeyS'))) {
                            const newY = entity.y + speed;
                            const exitDirection = detectScreenExit(entity, entity.x, newY);

                            if (exitDirection) {
                                // Permitir movimiento y marcar cambio de pantalla
                                entity.vy = speed;
                                screenExitDetectedRef.current = exitDirection;
                            } else if (!wouldCollideWithWall(entity, entity.x, newY)) {
                                entity.vy = speed;
                            }
                        }
                    }

                    if (!airControlLocked) {
                        // Horizontal movement
                        if (allowLeft && (currentPressedKeys.has('ArrowLeft') || currentPressedKeys.has('KeyA'))) {
                            const newX = entity.x - speed;
                            const exitDirection = detectScreenExit(entity, newX, entity.y);

                            if (exitDirection) {
                                // Permitir movimiento y marcar cambio de pantalla
                                entity.vx = -speed;
                                screenExitDetectedRef.current = exitDirection;
                            } else if (!wouldCollideWithWall(entity, newX, entity.y)) {
                                entity.vx = -speed;
                            }
                        }

                        if (allowRight && (currentPressedKeys.has('ArrowRight') || currentPressedKeys.has('KeyD'))) {
                            const newX = entity.x + speed;
                            const exitDirection = detectScreenExit(entity, newX, entity.y);

                            if (exitDirection) {
                                // Permitir movimiento y marcar cambio de pantalla
                                entity.vx = speed;
                                screenExitDetectedRef.current = exitDirection;
                            } else if (!wouldCollideWithWall(entity, newX, entity.y)) {
                                entity.vx = speed;
                            }
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

                    // Apply physics velocities to entity movement.
                    // NOTE: These are OVERRIDES (=), not accumulations (+=).
                    // Using += would add the velocity on every frame, causing infinite acceleration.
                    const velocityX = Number(physicsProps.velocityX) || 0;
                    const velocityY = Number(physicsProps.velocityY) || 0;

                    // Only override velocity if a non-zero physics velocity is defined
                    if (velocityX !== 0) entity.vx = velocityX;
                    if (velocityY !== 0) entity.vy = velocityY;

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
                    const now = Date.now();
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
                    if (!entity.jumpData) {
                        entity.jumpData = { bonusCharges: 0 };
                    }
                    if (!entity.tileCollectorData) {
                        entity.tileCollectorData = { bonusRespawns: [] };
                    }

                    const dueBonusRespawns = entity.tileCollectorData.bonusRespawns.filter(respawn => now >= respawn.respawnAt);
                    entity.tileCollectorData.bonusRespawns = entity.tileCollectorData.bonusRespawns.filter(respawn => now < respawn.respawnAt);

                    // Calculate entity's current tile position
                    const collectionRadius = Number(collectorProps.collectionRadius) || 4;
                    const tileX = Math.floor((entity.x + 8) / 16); // Assuming 16x16 tiles
                    const tileY = Math.floor((entity.y + 8) / 16);

                    // Get collectible tile IDs
                    const collectibleTileIds = (collectorProps.collectibleTileIds || 'dot,powerup,fruit')
                        .split(',')
                        .map(id => id.trim());

                    const replacementTileId = collectorProps.replacementTileId || 'empty';
                    const bonusTileId = typeof collectorProps.bonusTileId === 'string' ? collectorProps.bonusTileId : '';
                    const bonusReplacementTileId = collectorProps.bonusReplacementTileId || 'empty';
                    const bonusRespawnSeconds = Math.max(0, Math.min(255, Number(collectorProps.bonusRespawnSeconds) || 0));
                    const bonusEntityEffect = typeof collectorProps.bonusEntityEffect === 'string'
                        ? collectorProps.bonusEntityEffect.trim().toLowerCase()
                        : 'none';
                    const bonusEffectAmount = Math.max(0, Number(collectorProps.bonusEffectAmount) || 0);
                    const bonusSlashStrength = Math.max(1, Math.min(32, Number(collectorProps.bonusSlashStrength) || 8));
                    const currentPressedKeys = (window as any).currentPressedKeys || new Set<string>();

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

                        const isBonusTile = !!bonusTileId && (
                            currentTile.tileId === bonusTileId ||
                            currentTile.id === bonusTileId
                        );
                        const isCollectible = !isBonusTile && collectibleTileIds.some(collectibleId =>
                            currentTile.tileId === collectibleId ||
                            currentTile.id === collectibleId
                        );

                        console.log('🔍 Checking tile at', tilePos.x, tilePos.y, ':', currentTile.tileId, 'collectible:', isCollectible);

                        if (isCollectible || isBonusTile) {
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
                                if (isBonusTile) {
                                    screenMap.layers.background[tilePos.y][tilePos.x] = {
                                        ...currentTile,
                                        tileId: bonusReplacementTileId,
                                        id: bonusReplacementTileId
                                    };

                                    if (bonusEntityEffect === 'grant_extra_jump' && bonusEffectAmount > 0) {
                                        const cursorsComp = entity.template.components.find(c => c.definitionId === 'comp_cursors');
                                        const cursorsProps = cursorsComp
                                            ? {
                                                ...cursorsComp.defaultValues,
                                                ...(entity.instance.componentOverrides?.['comp_cursors'] || {})
                                            }
                                            : {};
                                        const allowUp = cursorsProps.allowUp !== false;
                                        const allowDown = cursorsProps.allowDown !== false;
                                        const allowLeft = cursorsProps.allowLeft !== false;
                                        const allowRight = cursorsProps.allowRight !== false;
                                        const upPressed = allowUp && (currentPressedKeys.has('ArrowUp') || currentPressedKeys.has('KeyW'));
                                        const downPressed = allowDown && (currentPressedKeys.has('ArrowDown') || currentPressedKeys.has('KeyS'));
                                        const leftPressed = allowLeft && (currentPressedKeys.has('ArrowLeft') || currentPressedKeys.has('KeyA'));
                                        const rightPressed = allowRight && (currentPressedKeys.has('ArrowRight') || currentPressedKeys.has('KeyD'));
                                        const slashUpStrength = Math.max(1, bonusSlashStrength - 1);
                                        const slashDownStrength = Math.max(1, bonusSlashStrength - 2);

                                        entity.isOnGround = false;
                                        entity.isGrounded = false;

                                        if (!upPressed && !downPressed && !leftPressed && !rightPressed) {
                                            if (allowUp) {
                                                entity.vx = 0;
                                                entity.vy = -4;
                                            }
                                        } else if (upPressed && rightPressed) {
                                            entity.vx = slashUpStrength;
                                            entity.vy = -3;
                                        } else if (upPressed && leftPressed) {
                                            entity.vx = -slashUpStrength;
                                            entity.vy = -3;
                                        } else if (downPressed && rightPressed) {
                                            entity.vx = slashDownStrength;
                                            entity.vy = 1;
                                        } else if (downPressed && leftPressed) {
                                            entity.vx = -slashDownStrength;
                                            entity.vy = 1;
                                        } else if (rightPressed) {
                                            entity.vx = bonusSlashStrength;
                                            entity.vy = -1;
                                        } else if (leftPressed) {
                                            entity.vx = -bonusSlashStrength;
                                            entity.vy = -1;
                                        } else if (downPressed) {
                                            entity.vx = 0;
                                            entity.vy = 2;
                                        } else if (upPressed) {
                                            entity.vx = 0;
                                            entity.vy = -4;
                                        }
                                    }

                                    if (bonusRespawnSeconds > 0) {
                                        entity.tileCollectorData.bonusRespawns = entity.tileCollectorData.bonusRespawns.filter(respawn =>
                                            respawn.position.x !== tilePos.x || respawn.position.y !== tilePos.y
                                        );
                                        entity.tileCollectorData.bonusRespawns.push({
                                            position: { x: tilePos.x, y: tilePos.y },
                                            tileId: bonusTileId,
                                            respawnAt: now + (bonusRespawnSeconds * 1000)
                                        });
                                    }

                                    if (collectorProps.bonusSoundId) {
                                        console.log(`🔊 Playing bonus collection sound: ${collectorProps.bonusSoundId}`);
                                    }
                                    return;
                                }

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

                    dueBonusRespawns.forEach(respawn => {
                        const targetRow = screenMap.layers.background[respawn.position.y];
                        const targetTile = targetRow?.[respawn.position.x];
                        if (targetTile) {
                            targetRow[respawn.position.x] = {
                                ...targetTile,
                                tileId: respawn.tileId,
                                id: respawn.tileId
                            };
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
                    // Also activate wallCollision engine for tile-based collision detection
                    requiredEngines.add('wallCollision');
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
    spawnTime: number; // Timestamp when entity was created (for spawn grace period)
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
    jumpData?: {
        bonusCharges: number;
    };
    wallJumpData?: {
        lockFramesRemaining: number;
        lockedVx: number;
    };
    isWallGrabbing?: boolean;
    tileCollectorData?: {
        bonusRespawns: Array<{
            position: { x: number; y: number };
            tileId: string;
            respawnAt: number;
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
    isFacingMirrored?: boolean; // Track if entity is currently facing mirrored direction (for idle pose)
    isOnGround: boolean; // Track if entity is touching the ground (for jump and gravity)
    isGrounded?: boolean; // Set by wallCollisionEngine when entity is resting on a solid tile
    isTouchingCeiling?: boolean; // Set by wallCollisionEngine
    isTouchingWallLeft?: boolean; // Set by wallCollisionEngine
    isTouchingWallRight?: boolean; // Set by wallCollisionEngine
    velocityX?: number; // Alternative velocity property used by some engines
    velocityY?: number; // Alternative velocity property used by some engines
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
    const jumpKeyProcessed = useRef<boolean>(false);
    const activeEnginesRef = useRef<GameEngine[]>([]);
    const pendingSpawnsRef = useRef<EntityInstance[]>([]);
    const [entityCount, setEntityCount] = useState(0);
    const screenExitDetectedRef = useRef<string | null>(null); // 'left', 'right', 'top', 'bottom'
    const [debugMode, setDebugMode] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [entitiesEnabled, setEntitiesEnabled] = useState(true);
    const [hudEnabled, setHudEnabled] = useState(true);
    const [physicsEnabled, setPhysicsEnabled] = useState(true);
    const [animationEnabled, setAnimationEnabled] = useState(true);
    const fullScreenTimerRef = useRef<NodeJS.Timeout>();
    const [currentScreen, setCurrentScreen] = useState<ScreenMap>(screenMap);

    // Pac-Man style movement tracking
    const desiredDirection = useRef<string | null>(null);
    const currentDirection = useRef<string | null>(null);

    useEffect(() => {
        setCurrentScreen(screenMap);
    }, [screenMap]);

    // Full Screen functionality
    const handleFullScreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                // ⚠️ NO establecer setIsFullScreen(true) aquí
                // El evento fullscreenchange se encargará de todos los cambios de estado
            }
        } catch (error) {
            console.error('Error entering fullscreen:', error);
            // Si falla, asegurar que el estado sea correcto
            setIsFullScreen(false);
        }
    };

    const handleExitFullScreen = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        setIsFullScreen(false);
        if (fullScreenTimerRef.current) {
            clearTimeout(fullScreenTimerRef.current);
        }
    };

    // Handle fullscreen changes (both entering and exiting)
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = !!document.fullscreenElement;
            setIsFullScreen(isCurrentlyFullscreen);

            if (isCurrentlyFullscreen) {
                // Entró a fullscreen - iniciar timer de auto-close
                fullScreenTimerRef.current = setTimeout(() => {
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    }
                }, 15000);
            } else {
                // Salió de fullscreen - limpiar timer
                if (fullScreenTimerRef.current) {
                    clearTimeout(fullScreenTimerRef.current);
                    fullScreenTimerRef.current = undefined;
                }
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Clean up timer on unmount
    useEffect(() => {
        return () => {
            if (fullScreenTimerRef.current) {
                clearTimeout(fullScreenTimerRef.current);
            }
        };
    }, []);

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
        // Don't prevent default for arrow keys - let them propagate to window event listeners
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
        if (playerRef.current && !pressedKeys.current.has(e.key)) {
            pressedKeys.current.add(e.key);
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                checkKeyTransitions(playerRef.current.instance.id, e.key, true);
            }
        }
        if (e.key === 'Escape') {
            e.preventDefault();
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
        // Reset jump key processed flag when space is released
        if (e.key === ' ') {
            jumpKeyProcessed.current = false;
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
                lastFrameUpdateTime: 0,
                spawnTime: performance.now(),
                isOnGround: false
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
            jumpKeyProcessed.current = false;
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
                    frameImages, currentFrame: 0, lastFrameUpdateTime: 0, spawnTime: performance.now(), isOnGround: false
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
                spawnTime: performance.now(),
                stateMachine,
                currentState,
                isOnGround: false
            };

            // Initialize patrol velocity if entity has patrol component
            const patrolComp = instance.componentOverrides?.comp_patrol;
            if (patrolComp && patrolComp.waypoint1_x !== undefined && patrolComp.waypoint1_y !== undefined) {
                const patrolStartX = patrolComp.waypoint1_x;
                const patrolStartY = patrolComp.waypoint1_y;
                const patrolEndX = patrolComp.waypoint2_x ?? patrolStartX;
                const patrolEndY = patrolComp.waypoint2_y ?? patrolStartY;

                const dx = patrolEndX - patrolStartX;
                const dy = patrolEndY - patrolStartY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 0) {
                    const speed = Number(patrolComp.speed) || 1;
                    newAnimatedEntity.vx = (dx / dist) * speed;
                    newAnimatedEntity.vy = (dy / dist) * speed;
                }
            }

            entitiesToAnimate.push(newAnimatedEntity);

            // Detect player entity
            if (template.components.some(c => c.definitionId === 'comp_cursors') ||
                template.components.some(c => c.definitionId === 'comp_player_input') ||
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

                // Extract TileBank and colors from HUD element details
                const tileBankAssetId = hudEl.details?.tileBankAssetId;
                const hudTextColor = hudEl.details?.textColor || undefined; // Legacy support
                const hudBackgroundColor = hudEl.details?.textBackgroundColor || undefined;

                console.log(`🖼️ Rendering HUD text: "${textToRender}" at (${hudEl.position.x}, ${hudEl.position.y})`);
                console.log(`🎨 HUD Colors - Text: ${hudTextColor}, Background: ${hudBackgroundColor}, TileBank: ${tileBankAssetId}`);

                // Use font from selected TileBank asset or fallback to MSX font
                let fontToUse = msxFont || DEFAULT_MSX_FONT;
                let fontColorAttrs = msxFontColorAttributes || {};

                // Check for TileBank asset selection
                if (tileBankAssetId && allAssets) {
                    const selectedTileBankAsset = allAssets.find(asset =>
                        asset.id === tileBankAssetId && asset.type === 'tilebank'
                    );

                    if (selectedTileBankAsset?.data) {
                        console.log('✅ Found TileBank asset, using tile-based rendering');
                        // TileBank selected - use tile-based rendering
                        const tileBasedFont = createTileBasedFont(
                            tileBanks,
                            allAssets,
                            fontToUse,
                            fontColorAttrs,
                            hudTextColor,
                            hudBackgroundColor
                        );

                        if (tileBasedFont) {
                            // Render using tile-based font from TileBank
                            let xOffset = hudEl.position.x;

                            for (const char of textToRender) {
                                const tileImg = tileBasedFont[char.toUpperCase()] || tileBasedFont[char];

                                if (tileImg && tileImg.complete && tileImg.naturalWidth > 0) {
                                    ctx.drawImage(tileImg, xOffset, hudEl.position.y, 8, 8);
                                    console.log(`✅ Drew TileBank tile for '${char}' at (${xOffset}, ${hudEl.position.y})`);
                                } else {
                                    // Fallback for missing characters
                                    ctx.fillStyle = hudTextColor || '#FFFFFF';
                                    ctx.font = '6px monospace';
                                    ctx.fillText(char, xOffset + 1, hudEl.position.y + 6);
                                    console.log(`⚠️ Used fallback text for '${char}' at (${xOffset}, ${hudEl.position.y})`);
                                }

                                xOffset += 8 + charSpacing;
                            }
                            return; // Exit early if tile-based rendering succeeded
                        }
                    }
                }

                // Fallback: Try legacy tile-based font or MSX font
                const tileBasedFont = createTileBasedFont(tileBanks, allAssets, fontToUse, fontColorAttrs, hudTextColor, hudBackgroundColor);

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

        // Add event listeners with capture phase to execute BEFORE React handlers
        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keyup', handleKeyUp, true);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('keyup', handleKeyUp, true);
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

        // --- Entity Collision Helper Functions (same as GameFlowPreviewModal) ---
        const entityCollisionProps = (entity: AnimatedEntity) => {
            const collisionCompDef = componentDefinitions.find(c => c.id === 'comp_collision');
            if (!collisionCompDef) return null;
            const props = {
                ...collisionCompDef.properties.reduce((acc, prop) => { acc[prop.name] = prop.defaultValue; return acc; }, {} as Record<string, any>),
                ...(entity.template.components.find(c => c.definitionId === 'comp_collision')?.defaultValues || {}),
                ...(entity.instance.componentOverrides?.['comp_collision'] || {})
            };

            // Prioridad de hitbox: comp_collision > sprite.hitbox > sprite.size
            const spriteHitbox = entity.sprite.hitbox;
            const fallbackWidth = spriteHitbox?.width ?? entity.sprite.size.width;
            const fallbackHeight = spriteHitbox?.height ?? entity.sprite.size.height;
            const fallbackOffsetX = spriteHitbox?.offsetX ?? 0;
            const fallbackOffsetY = spriteHitbox?.offsetY ?? 0;

            const result = {
                hitboxWidth: Number(props.hitboxWidth) || fallbackWidth,
                hitboxHeight: Number(props.hitboxHeight) || fallbackHeight,
                offsetX: (props.offsetX !== undefined && props.offsetX !== '' && Number(props.offsetX) !== 0) ? Number(props.offsetX) : fallbackOffsetX,
                offsetY: (props.offsetY !== undefined && props.offsetY !== '' && Number(props.offsetY) !== 0) ? Number(props.offsetY) : fallbackOffsetY,
                collisionLayer: Number(props.collisionLayer) || 1,
                collidesWith: Number(props.collidesWith) || 255,
                isStatic: props.isStatic === true || props.isStatic === 'true',
                isTrigger: props.isTrigger === true || props.isTrigger === 'true' || (typeof props.isTrigger === 'string' && props.isTrigger.toLowerCase() === 'true')
            };

            return result;
        };

        const getHitboxFor = (entity: AnimatedEntity, props: any) => ({
            x: entity.x + (props.offsetX || 0),
            y: entity.y + (props.offsetY || 0),
            width: props.hitboxWidth || entity.sprite.size.width,
            height: props.hitboxHeight || entity.sprite.size.height,
        });

        const resolveEntityCollision = (entityA: AnimatedEntity, entityB: AnimatedEntity, propsA: any, propsB: any) => {
            const hitboxA = getHitboxFor(entityA, propsA);
            const hitboxB = getHitboxFor(entityB, propsB);

            // Calculate overlap in both axes
            const overlapX = Math.min(
                hitboxA.x + hitboxA.width - hitboxB.x,
                hitboxB.x + hitboxB.width - hitboxA.x
            );
            const overlapY = Math.min(
                hitboxA.y + hitboxA.height - hitboxB.y,
                hitboxB.y + hitboxB.height - hitboxA.y
            );

            // Determine if entities are static (immovable) or dynamic
            const isAStatic = propsA.isStatic === true || propsA.isStatic === 'true';
            const isBStatic = propsB.isStatic === true || propsB.isStatic === 'true';

            // If both are static, no resolution needed
            if (isAStatic && isBStatic) return;

            // Find minimum translation vector (MTV) - separate on axis with less overlap
            if (overlapX < overlapY) {
                // Separate on X axis
                const direction = (hitboxA.x + hitboxA.width / 2) < (hitboxB.x + hitboxB.width / 2) ? -1 : 1;
                const separation = overlapX * direction;

                if (isAStatic) {
                    entityB.x -= separation;
                    entityB.vx = 0;
                } else if (isBStatic) {
                    entityA.x += separation;
                    entityA.vx = 0;
                } else {
                    const halfSep = separation / 2;
                    entityA.x += halfSep;
                    entityB.x -= halfSep;
                    const tempVx = entityA.vx;
                    entityA.vx = entityB.vx;
                    entityB.vx = tempVx;
                }
            } else {
                // Separate on Y axis
                const direction = (hitboxA.y + hitboxA.height / 2) < (hitboxB.y + hitboxB.height / 2) ? -1 : 1;
                const separation = overlapY * direction;

                if (isAStatic) {
                    entityB.y -= separation;
                    entityB.vy = 0;
                } else if (isBStatic) {
                    entityA.y += separation;
                    entityA.vy = 0;
                } else {
                    const halfSep = separation / 2;
                    entityA.y += halfSep;
                    entityB.y -= halfSep;
                    const tempVy = entityA.vy;
                    entityA.vy = entityB.vy;
                    entityB.vy = tempVy;
                }
            }
        };

        // Pre-render tiles to offscreen buffer (optimization)
        const tileBuffer = document.createElement('canvas');
        tileBuffer.width = PREVIEW_WIDTH;
        tileBuffer.height = PREVIEW_HEIGHT;
        const tileCtx = tileBuffer.getContext('2d');

        if (tileCtx) {
            tileCtx.imageSmoothingEnabled = false;

            // Draw background color
            const bgColor = getBackgroundColorHex(screenMap.backgroundColor, currentScreenMode);
            tileCtx.fillStyle = bgColor;
            tileCtx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);

            // Render all tiles to buffer once
            renderScreenToCanvas(tileBuffer, screenMap, tileset, currentScreenMode, TILE_SIZE);
        }

        const animate = () => {
            // 1. Clear canvas
            ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);

            // 2. Draw pre-rendered tile buffer (much faster than redrawing tiles)
            if (tileBuffer) {
                ctx.drawImage(tileBuffer, 0, 0);
            }

            // 3. Render HUD elements (only if hudEnabled is true)
            if (hudEnabled) {
                renderHUDElements(ctx);
            }

            // Execute Animation Engine independently (controlled by animationEnabled)
            if (animationEnabled) {
                const animationEngine = activeEnginesRef.current.find(e => e.id === 'animation');
                if (animationEngine) {
                    animationEngine.execute(entitiesRef.current, componentDefinitions, screenMap, entityTemplates, allAssets, pendingSpawnsRef);
                }
            }

            // Compute isOnGround for all entities before executing engines.
            // IMPORTANT: Must run for any entity with comp_gravity, not just comp_collision.
            if (physicsEnabled) {
                entitiesRef.current.forEach(entity => {
                    const hasGravityComp = entity.template.components.some(c => c.definitionId === 'comp_gravity');
                    const hasCollisionComp = entity.template.components.some(c => c.definitionId === 'comp_collision');

                    // Only run ground check for entities that have gravity or collision
                    if (!hasGravityComp && !hasCollisionComp) return;

                    if (screenMap?.layers?.collision) {
                        // Determine hitbox from comp_collision (if present) or sprite hitbox
                        let hitboxWidth = entity.sprite.size.width;
                        let hitboxHeight = entity.sprite.size.height;
                        let offsetX = 0;
                        let offsetY = 0;

                        if (hasCollisionComp) {
                            const collisionCompDef = componentDefinitions.find(c => c.id === 'comp_collision');
                            if (collisionCompDef) {
                                const props = {
                                    ...collisionCompDef.properties.reduce((acc, prop) => { acc[prop.name] = prop.defaultValue; return acc; }, {} as Record<string, any>),
                                    ...(entity.template.components.find(c => c.definitionId === 'comp_collision')?.defaultValues || {}),
                                    ...(entity.instance.componentOverrides?.['comp_collision'] || {})
                                };
                                const spriteHitbox = entity.sprite?.hitbox;
                                hitboxWidth = Number(props.hitboxWidth) || spriteHitbox?.width || entity.sprite.size.width;
                                hitboxHeight = Number(props.hitboxHeight) || spriteHitbox?.height || entity.sprite.size.height;
                                offsetX = (props.offsetX !== undefined && props.offsetX !== '' && Number(props.offsetX) !== 0) ? Number(props.offsetX) : (spriteHitbox?.offsetX ?? 0);
                                offsetY = (props.offsetY !== undefined && props.offsetY !== '' && Number(props.offsetY) !== 0) ? Number(props.offsetY) : (spriteHitbox?.offsetY ?? 0);
                            }
                        } else if (entity.sprite?.hitbox) {
                            hitboxWidth = entity.sprite.hitbox.width;
                            hitboxHeight = entity.sprite.hitbox.height;
                            offsetX = entity.sprite.hitbox.offsetX;
                            offsetY = entity.sprite.hitbox.offsetY;
                        }

                        const hitboxX = entity.x + offsetX;
                        const hitboxY = entity.y + offsetY;
                        const centerX1 = hitboxX + Math.floor(hitboxWidth / 3);
                        const centerX2 = hitboxX + Math.floor((2 * hitboxWidth) / 3);
                        const bottomY = hitboxY + hitboxHeight;

                        const checkCollisionAt = (x: number, y: number): boolean => {
                            const tileX = Math.floor(x / TILE_SIZE);
                            const tileY = Math.floor(y / TILE_SIZE);
                            if (tileX < 0 || tileY < 0 || tileX >= 32 || tileY >= 24) return false;
                            const tileOnLayer = screenMap.layers.collision[tileY]?.[tileX];
                            if (!tileOnLayer || !tileOnLayer.tileId) return false;
                            const tile = tileset.find(t => t.id === tileOnLayer.tileId);
                            return tile?.logicalProperties?.isSolid ?? false;
                        };

                        const onGround = checkCollisionAt(centerX1, bottomY + 1) || checkCollisionAt(centerX2, bottomY + 1);
                        entity.isOnGround = onGround;
                        entity.isGrounded = onGround; // Keep both in sync for wallCollisionEngine compatibility
                    } else {
                        entity.isOnGround = false;
                        entity.isGrounded = false;
                    }
                });
            }

            // Execute Other Game Engines (only if physicsEnabled is true)
            if (physicsEnabled) {
                activeEnginesRef.current.forEach(engine => {
                    // Skip animation engine (already executed above)
                    if (engine.id === 'animation') {
                        return;
                    }
                    engine.execute(entitiesRef.current, componentDefinitions, screenMap, entityTemplates, allAssets, pendingSpawnsRef);
                });

                // Jump logic (must be here to access jumpKeyProcessed ref)
                const currentPressedKeys = (window as any).currentPressedKeys || new Set();
                entitiesRef.current.forEach(entity => {
                    const jumpComp = entity.template.components.find(c => c.definitionId === 'comp_jump');
                    if (jumpComp) {
                        const jumpProps = { ...jumpComp.defaultValues, ...(entity.instance.componentOverrides?.['comp_jump'] || {}) };
                        const requireKeyRelease = jumpProps.requireKeyRelease !== 'false' && jumpProps.requireKeyRelease !== false;
                        const spacePressed = currentPressedKeys.has('Space');
                        const hasGravity = entity.template.components.some(c => c.definitionId === 'comp_gravity');
                        if (!entity.jumpData) {
                            entity.jumpData = { bonusCharges: 0 };
                        }

                        if (hasGravity && spacePressed) {
                            const canJump = !requireKeyRelease || !jumpKeyProcessed.current;
                            if (canJump && entity.isOnGround) {
                                const jumpPower = Number(jumpProps.jumpPower || 256);
                                entity.vy = -jumpPower / 40;
                                jumpKeyProcessed.current = true;
                            } else if (canJump && (entity.jumpData.bonusCharges || 0) > 0) {
                                const jumpPower = Number(jumpProps.jumpPower || 256);
                                entity.vy = -jumpPower / 40;
                                entity.jumpData.bonusCharges--;
                                jumpKeyProcessed.current = true;
                            }
                        }

                        // Match Z80 edge-triggered jump: releasing the key rearms it immediately.
                        if (!spacePressed) {
                            jumpKeyProcessed.current = false;
                        }
                    }

                    const wallGrabComp = entity.template.components.find(c => c.definitionId === 'comp_wall_grab');
                    if (wallGrabComp) {
                        const wallGrabProps = { ...wallGrabComp.defaultValues, ...(entity.instance.componentOverrides?.['comp_wall_grab'] || {}) };
                        const wallGrabEnabled = wallGrabProps.isEnabled !== false && wallGrabProps.isEnabled !== 'false';
                        const hasGravity = entity.template.components.some(c => c.definitionId === 'comp_gravity');
                        const grabPressed = currentPressedKeys.has('KeyN');
                        const onGroundNow = !!entity.isOnGround || !!entity.isGrounded;
                        const touchingWall = !!entity.isTouchingWallLeft || !!entity.isTouchingWallRight;
                        entity.isWallGrabbing = false;

                        if (wallGrabEnabled && hasGravity && grabPressed && !onGroundNow && !entity.isOnLadder && touchingWall) {
                            const grabFallSpeed = Math.max(0, Number(wallGrabProps.grabFallSpeed ?? 0) || 0);
                            entity.vx = 0;
                            entity.vy = grabFallSpeed;
                            entity.gravityVel = (grabFallSpeed << 8) & 0xFFFF;
                            entity.isWallGrabbing = true;
                        }
                    } else {
                        entity.isWallGrabbing = false;
                    }

                    const wallJumpComp = entity.template.components.find(c => c.definitionId === 'comp_wall_jump');
                    if (wallJumpComp) {
                        const wallJumpProps = { ...wallJumpComp.defaultValues, ...(entity.instance.componentOverrides?.['comp_wall_jump'] || {}) };
                        const wallJumpEnabled = wallJumpProps.isEnabled !== false && wallJumpProps.isEnabled !== 'false';
                        if (!entity.wallJumpData) {
                            entity.wallJumpData = { lockFramesRemaining: 0, lockedVx: 0 };
                        }

                        if (wallJumpEnabled) {
                            const hasGravity = entity.template.components.some(c => c.definitionId === 'comp_gravity');
                            const spacePressed = currentPressedKeys.has('Space');
                            const onGroundNow = !!entity.isOnGround || !!entity.isGrounded;
                            const touchingLeft = !!entity.isTouchingWallLeft;
                            const touchingRight = !!entity.isTouchingWallRight;
                            const touchingWall = touchingLeft || touchingRight;

                            if (onGroundNow) {
                                entity.wallJumpData.lockFramesRemaining = 0;
                            } else if (entity.wallJumpData.lockFramesRemaining > 0) {
                                entity.wallJumpData.lockFramesRemaining--;
                                entity.vx = entity.wallJumpData.lockedVx;
                            }

                            const slideFallSpeed = Math.max(0, Number(wallJumpProps.slideFallSpeed ?? 2) || 0);
                            if (hasGravity && !onGroundNow && !entity.isOnLadder && touchingWall && slideFallSpeed > 0 && entity.vy > slideFallSpeed) {
                                entity.vy = slideFallSpeed;
                                entity.gravityVel = (slideFallSpeed << 8) & 0xFFFF;
                            }

                            const canWallJump = hasGravity && !onGroundNow && !entity.isOnLadder && touchingWall && spacePressed && !jumpKeyProcessed.current;
                            if (canWallJump) {
                                const leftPressed = currentPressedKeys.has('ArrowLeft') || currentPressedKeys.has('KeyA');
                                const rightPressed = currentPressedKeys.has('ArrowRight') || currentPressedKeys.has('KeyD');
                                const requireAway = wallJumpProps.requirePressAwayFromWall === true || wallJumpProps.requirePressAwayFromWall === 'true';
                                let jumpFromLeftWall = false;
                                let jumpFromRightWall = false;

                                if (requireAway) {
                                    jumpFromLeftWall = touchingLeft && rightPressed;
                                    jumpFromRightWall = touchingRight && leftPressed;
                                } else {
                                    jumpFromLeftWall = touchingLeft && (!touchingRight || rightPressed || !leftPressed);
                                    jumpFromRightWall = !jumpFromLeftWall && touchingRight;
                                }

                                if (jumpFromLeftWall || jumpFromRightWall) {
                                    const horizontalPush = Math.max(1, Number(wallJumpProps.horizontalPush ?? 3) || 3);
                                    const verticalMagnitude = Math.max(1, Number(wallJumpProps.verticalImpulse ?? 1024) || 1024);
                                    const jumpImpulse = ((0x10000 - verticalMagnitude) & 0xFFFF) >>> 0;
                                    const jumpVx = jumpFromLeftWall ? horizontalPush : -horizontalPush;
                                    const lockFrames = Math.max(0, Number(wallJumpProps.lockFrames ?? 8) || 0);
                                    const hi = (jumpImpulse >> 8) & 0xFF;

                                    entity.vx = jumpVx;
                                    entity.wallJumpData.lockedVx = jumpVx;
                                    entity.wallJumpData.lockFramesRemaining = lockFrames;
                                    entity.gravityVel = jumpImpulse;
                                    entity.vy = hi >= 0x80 ? hi - 0x100 : hi;
                                    entity.isOnGround = false;
                                    entity.isGrounded = false;
                                    jumpKeyProcessed.current = true;
                                }
                            }
                        }
                    }
                });

                // --- Entity vs Entity Collision Detection ---
                const now = performance.now();
                entitiesRef.current.forEach((entityA, indexA) => {
                    const hasCollisionComp = entityA.template.components.some(c => c.definitionId === 'comp_collision');
                    if (!hasCollisionComp) return;

                    for (let indexB = indexA + 1; indexB < entitiesRef.current.length; indexB++) {
                        const entityB = entitiesRef.current[indexB];
                        const entityBHasCollision = entityB.template.components.some(c => c.definitionId === 'comp_collision');
                        if (!entityBHasCollision) continue;

                        const propsA = entityCollisionProps(entityA);
                        const propsB = entityCollisionProps(entityB);
                        if (!propsA || !propsB) continue;

                        const hitboxA = getHitboxFor(entityA, propsA);
                        const hitboxB = getHitboxFor(entityB, propsB);

                        // Check AABB collision
                        const isColliding = hitboxA.x < hitboxB.x + hitboxB.width &&
                            hitboxA.x + hitboxA.width > hitboxB.x &&
                            hitboxA.y < hitboxB.y + hitboxB.height &&
                            hitboxA.y + hitboxA.height > hitboxB.y;

                        if (isColliding) {
                            const layerA = Number(propsA.collisionLayer) || 0;
                            const collidesWithA = Number(propsA.collidesWith) || 0;
                            const layerB = Number(propsB.collisionLayer) || 0;
                            const collidesWithB = Number(propsB.collidesWith) || 0;

                            // PROTECTION: Ignore collisions in the first 200ms after spawn
                            const SPAWN_GRACE_PERIOD_MS = 200;
                            const entityAAge = now - (entityA.spawnTime || 0);
                            const entityBAge = now - (entityB.spawnTime || 0);

                            if (entityAAge < SPAWN_GRACE_PERIOD_MS || entityBAge < SPAWN_GRACE_PERIOD_MS) {
                                continue;
                            }

                            // Check if layers allow collision (bit mask check)
                            const aCanCollideWithB = (collidesWithA & layerB) !== 0;
                            const bCanCollideWithA = (collidesWithB & layerA) !== 0;

                            if (aCanCollideWithB && bCanCollideWithA) {
                                const isATrigger = propsA.isTrigger;
                                const isBTrigger = propsB.isTrigger;

                                // Only apply physical separation if neither is a trigger
                                if (!isATrigger && !isBTrigger) {
                                    resolveEntityCollision(entityA, entityB, propsA, propsB);
                                }
                            }
                        }
                    }
                });
            }

            // Process any pending spawned entities
            processSpawnedEntities();

            // Update entities position and rendering
            entitiesRef.current.forEach(entity => {
                // Only apply movement and physics if physicsEnabled is true
                if (physicsEnabled) {
                    // Check if movement would cause collision before applying it
                    let newX = entity.x + entity.vx;
                    let newY = entity.y + entity.vy;

                    // Check collision for the new position
                    const wallCollisionComp = entity.template.components.find(c => c.definitionId === 'comp_wall_collision' || c.definitionId === 'comp_collision');
                    if (wallCollisionComp && screenMap?.layers?.collision) {
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
                        let collisionType: 'tile' | 'boundary' | null = null;

                        // Check all tiles the entity would occupy
                        for (let tileY = topTile; tileY <= bottomTile && !hasCollision; tileY++) {
                            for (let tileX = leftTile; tileX <= rightTile && !hasCollision; tileX++) {
                                if (tileX < 0 || tileY < 0 || tileX >= screenMap.width || tileY >= screenMap.height) {
                                    hasCollision = true;
                                    collisionType = 'boundary';
                                    break;
                                }

                                // Access collision layer as 2D array: collision[row][column]
                                const collisionRow = screenMap.layers.collision[tileY];
                                if (!collisionRow) continue;

                                const tile = collisionRow[tileX];

                                // Check if tile has a collision (tileId is not null and not empty)
                                if (tile && tile.tileId && tile.tileId !== 'empty' && tile.tileId !== '') {
                                    hasCollision = true;
                                    collisionType = 'tile';
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
                                if (collisionType === 'boundary') {
                                    console.log(`🚧 Detección de salida de pantalla! Stopping velocity (${entity.vx}, ${entity.vy}) → (0, 0) at position (${entity.x}, ${entity.y})`);
                                } else {
                                    console.log(`🚧 Collision detected! Stopping velocity (${entity.vx}, ${entity.vy}) → (0, 0) at position (${entity.x}, ${entity.y})`);
                                }
                            }
                            entity.vx = 0;
                            entity.vy = 0;
                        }
                    } else {
                        // No collision detection component, apply movement normally
                        entity.x = newX;
                        entity.y = newY;
                        // Clamp to screen boundaries so gravity entities don't fly off
                        if (entity.y > PREVIEW_HEIGHT) {
                            entity.y = PREVIEW_HEIGHT;
                            entity.vy = 0;
                            entity.isOnGround = true;
                            entity.isGrounded = true;
                        }
                        if (entity.y < 0) { entity.y = 0; entity.vy = 0; }
                        if (entity.x < -entity.sprite.size.width) { entity.x = -entity.sprite.size.width; }
                        if (entity.x > PREVIEW_WIDTH) { entity.x = PREVIEW_WIDTH; }
                    }

                    // Screen boundary constraints removed to allow entities to move off-screen
                    // (useful for side-scrolling games, screen transitions, etc.)
                } // End of physicsEnabled block

                // Choose correct sprite image (animation is now handled by animation engine)
                // Ensure currentFrame is within bounds
                const safeFrameIndex = Math.min(entity.currentFrame, entity.frameImages.length - 1);

                // Determine which image to draw based on movement direction
                let shouldUseMirrored = false;

                if (entity.mirroredFrameImages && safeFrameIndex < entity.mirroredFrameImages.length) {
                    // Check if currently moving
                    if (entity.vx !== 0) {
                        // Moving: determine direction and update facing state
                        if (entity.sprite.facingDirection === 'right' && entity.vx < 0) {
                            shouldUseMirrored = true;
                            entity.isFacingMirrored = true; // Remember: facing left
                        } else if (entity.sprite.facingDirection === 'left' && entity.vx > 0) {
                            shouldUseMirrored = true;
                            entity.isFacingMirrored = true; // Remember: facing right
                        } else {
                            entity.isFacingMirrored = false; // Remember: facing default direction
                        }
                    } else {
                        // Not moving: use last known direction
                        shouldUseMirrored = entity.isFacingMirrored === true;
                    }
                }

                let imageToDraw = shouldUseMirrored ? entity.mirroredFrameImages![safeFrameIndex] : entity.frameImages[safeFrameIndex];

                // Only render entities if entitiesEnabled is true
                if (entitiesEnabled && imageToDraw) {
                    ctx.drawImage(imageToDraw, entity.x, entity.y);
                }

                // Debug: Draw hitboxes when debug mode is enabled
                if (debugMode) {
                    // Get hitbox values from sprite first, then fallback to collision component, then sprite size
                    let hitboxWidth = entity.sprite.size.width;
                    let hitboxHeight = entity.sprite.size.height;
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
                            hitboxWidth = Number(props.hitboxWidth) || entity.sprite.size.width;
                            hitboxHeight = Number(props.hitboxHeight) || entity.sprite.size.height;
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

            // Check if screen exit was detected
            if (screenExitDetectedRef.current) {
                const exitDirection = screenExitDetectedRef.current;
                console.log(`🚪 Screen exit detected! Direction: ${exitDirection}`);
                console.log(`   Player would transition to next screen via ${exitDirection} edge`);

                // TODO: Implementar cambio de pantalla aquí
                // Por ahora solo mostramos un mensaje en consola
                // En el futuro, esto debería:
                // 1. Cargar la pantalla conectada en esa dirección (screenMap.connections[exitDirection])
                // 2. Posicionar al jugador en el borde opuesto de la nueva pantalla
                // 3. Reinicializar las entidades de la nueva pantalla

                // Reset detection flag
                screenExitDetectedRef.current = null;
            }

            animationFrameId.current = requestAnimationFrame(animate);
        };

        animationFrameId.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [isOpen, screenMap, allAssets, currentScreenMode, debugMode, isFullScreen, renderHUDElements, entitiesEnabled, hudEnabled, animationEnabled, physicsEnabled]);

    if (!isOpen) return null;

    return (
        <div
            ref={modalRef}
            className={`fixed inset-0 flex items-center justify-center z-50 outline-none ${isFullScreen
                ? 'bg-black'
                : 'bg-black bg-opacity-75 animate-fadeIn p-4'
                }`}
            onClick={isFullScreen ? handleExitFullScreen : onClose}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            tabIndex={-1}
        >
            {/* Content wrapper - only shows in normal mode */}
            {!isFullScreen && (
                <div
                    className="bg-msx-panelbg p-4 sm:p-6 rounded-lg shadow-xl animate-slideIn font-sans flex flex-col items-center"
                    onClick={e => e.stopPropagation()}
                >
                    <h2 className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4 pixel-font">Screen Play Mode</h2>

                    {/* Info text above game */}
                    <div className="text-center mb-4">
                        <p className="text-xs text-msx-textsecondary mb-1">Use Arrow keys to move. Press Escape to close.</p>
                        <p className="text-xs text-msx-textsecondary mb-1">
                            Active Engines: {activeEnginesRef.current.map(e => e.name).join(', ') || 'None'}
                        </p>
                        <p className="text-xs text-msx-textsecondary mb-2">
                            Total Entities: {entityCount} | Pending Spawns: {pendingSpawnsRef.current.length}
                        </p>
                    </div>

                    {/* Canvas - game screen */}
                    <canvas
                        ref={canvasRef}
                        width={PREVIEW_WIDTH}
                        height={PREVIEW_HEIGHT}
                        className="border-2 border-msx-border mb-4"
                        style={{
                            width: PREVIEW_WIDTH * 2,
                            height: PREVIEW_HEIGHT * 2,
                            imageRendering: 'pixelated',
                            backgroundColor: 'black'
                        }}
                    />

                    {/* Controls below game */}
                    <div className="flex gap-3">
                        <Button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEntitiesEnabled(!entitiesEnabled);
                            }}
                            variant={entitiesEnabled ? "primary" : "danger"}
                            size="md"
                        >
                            Entities
                        </Button>
                        <Button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setHudEnabled(!hudEnabled);
                            }}
                            variant={hudEnabled ? "primary" : "danger"}
                            size="md"
                        >
                            HUD
                        </Button>
                        <Button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setAnimationEnabled(!animationEnabled);
                            }}
                            variant={animationEnabled ? "primary" : "danger"}
                            size="md"
                        >
                            Animation
                        </Button>
                        <Button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setPhysicsEnabled(!physicsEnabled);
                            }}
                            variant={physicsEnabled ? "primary" : "danger"}
                            size="md"
                        >
                            Physics
                        </Button>
                        <Button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDebugMode(!debugMode);
                            }}
                            variant={debugMode ? "primary" : "danger"}
                            size="md"
                        >
                            {debugMode ? "Debug ON" : "Debug OFF"}
                        </Button>
                        <Button onClick={onClose} variant="primary" size="md">Close</Button>
                    </div>
                </div>
            )}

            {/* Fullscreen canvas */}
            {isFullScreen && (
                <>
                    <canvas
                        ref={canvasRef}
                        width={PREVIEW_WIDTH}
                        height={PREVIEW_HEIGHT}
                        style={{
                            width: '90vw',
                            height: '90vh',
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            objectFit: 'contain',
                            imageRendering: 'pixelated',
                            backgroundColor: 'black',
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)'
                        }}
                    />

                    {/* Full Screen indicator */}
                    <div className="absolute top-4 right-4 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                        Click to exit | Auto-close in 15s
                    </div>
                </>
            )}
        </div>
    );
};
