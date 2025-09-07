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
        
    }, [isOpen, screenMap, allAssets, entityTemplates, componentDefinitions]);

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
            });

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