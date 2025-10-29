
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CRTShaderOverlay, CRTShaderConfig, defaultCRTConfig } from '../../src/components/CRTShaderOverlay';
import { CRTConfigModal } from '../../src/components/CRTConfigModal';
import {
    GameFlowGraph,
    ProjectAsset,
    GameFlowNode,
    GameFlowSubMenuNode,
    GameFlowWorldLinkNode,
    GameFlowTextNode,
    MSXFont,
    MSXFontColorAttributes,
    EntityTemplate,
    ScreenMap,
    ScreenTile,
    Tile,
    WorldMapGraph,
    EntityInstance,
    WorldMapConnection,
    Sprite,
    ComponentDefinition,
    PixelData,
    AssetType
} from '../../types';
import { Button } from '../common/Button';
import { renderMSX1TextToDataURL, getTextDimensionsMSX1 } from '../utils/msxFontRenderer';
import { renderScreenToCanvas, createSpriteDataURL } from '../utils/screenUtils';
import { mirrorPixelDataHorizontally, mirrorPixelDataVertically } from '../utils/spriteUtils';
import { ArrowUpIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArrowsPointingOutIcon } from '../icons/MsxIcons';
import { StateMachine } from '../../statemachine.types';


const TILE_SIZE = 8;
const PREVIEW_WIDTH = 256;
const PREVIEW_HEIGHT = 192;
const ANIMATION_SPEED_MS = 200;

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
    isOnGround: boolean;
    spawnTime: number; // Timestamp when entity was created
    animationHasCompleted?: boolean; // True when a non-looping animation reaches its last frame
    lastAnimationState?: string; // Track which state's animation was playing
    isFacingMirrored?: boolean; // Track if entity is currently facing mirrored direction (for idle pose)
    lastDamageTime?: number; // Timestamp of last damage taken (for invincibility frames)
    hasDangerousTileCollision?: boolean; // True when touching a deadly tile
    platformUnderneath?: AnimatedEntity | null; // Reference to platform entity this entity is standing on
}

interface GameFlowPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    graphData: GameFlowGraph;
    allAssets: ProjectAsset[];
    msxFont: MSXFont;
    msxFontColorAttributes: MSXFontColorAttributes;
    entityTemplates: EntityTemplate[];
    currentScreenMode: string;
    componentDefinitions: ComponentDefinition[];
    initialIsDynamic?: boolean;
    isPlayMode?: boolean;
    gameFlowAssetName: string;
}

interface EnrichedConnection extends WorldMapConnection {
    targetNodeId: string;
}

export const GameFlowPreviewModal: React.FC<GameFlowPreviewModalProps> = ({
    isOpen,
    onClose,
    graphData,
    allAssets,
    msxFont,
    msxFontColorAttributes,
    entityTemplates,
    currentScreenMode,
    componentDefinitions,
    initialIsDynamic = false,
    isPlayMode = false,
    gameFlowAssetName,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const animationFrameId = useRef<number>();
    const entitiesRef = useRef<AnimatedEntity[]>([]);
    const heroRef = useRef<AnimatedEntity | null>(null);
    const pressedKeys = useRef<Set<string>>(new Set());
    const jumpKeyProcessed = useRef<boolean>(false);
    const pendingEvents = useRef<Map<string, Set<string>>>(new Map()); // entityId -> Set of event names
    const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
    const [navigationStack, setNavigationStack] = useState<string[]>([]);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
    const [currentScreenMap, setCurrentScreenMap] = useState<ScreenMap | null>(null);
    const [currentWorldMapGraph, setCurrentWorldMapGraph] = useState<WorldMapGraph | null>(null);
    const [isDynamic, setIsDynamic] = useState(initialIsDynamic);
    const [showHitboxDebug, setShowHitboxDebug] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [crtConfig, setCrtConfig] = useState<CRTShaderConfig>(() => {
        const saved = localStorage.getItem('crtShaderConfig');
        return saved ? JSON.parse(saved) : defaultCRTConfig;
    });
    const [isCrtConfigOpen, setIsCrtConfigOpen] = useState(false);
    const [gameGlobalVariables, setGameGlobalVariables] = useState<Record<string, any>>({});
    const [gameFlowStack, setGameFlowStack] = useState<Array<{parentGraphData: GameFlowGraph, returnNodeId: string, parentGameFlowName: string}>>([]);
    const [currentNestedGraphData, setCurrentNestedGraphData] = useState<GameFlowGraph | null>(null);
    const [currentExecutingGameFlowName, setCurrentExecutingGameFlowName] = useState<string>(gameFlowAssetName);
    const [playerEntryPoint, setPlayerEntryPoint] = useState<{x: number, y: number} | null>(null);
    const [isPositioningMode, setIsPositioningMode] = useState(false);
    const [runtimeCollisionLayer, setRuntimeCollisionLayer] = useState<ScreenTile[][]>([]);
    const tileBufferNeedsUpdate = useRef<boolean>(false);
    const tileBufferRef = useRef<HTMLCanvasElement | null>(null);

    const currentGraphData = currentNestedGraphData || graphData;
    const { nodes, connections } = currentGraphData;
    const currentNode = nodes.find(node => node.id === currentNodeId);


    // Refs to share state between callbacks and effects
    const currentScreenMapRef = useRef<ScreenMap | null>(null);
    const currentWorldMapGraphRef = useRef<WorldMapGraph | null>(null);
    const setPlayerEntryPointRef = useRef<(entry: { x: number; y: number } | null) => void>(() => {});
    const handleScreenTransitionRef = useRef<(toNodeId: string) => void>(() => {});
    const runtimeCollisionLayerRef = useRef<ScreenTile[][]>([]);

    // Handler para posicionar al player con click
    const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isPositioningMode || !isDynamic || currentNode?.type !== 'WorldLink') return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Calcular coordenadas relativas al canvas (considerando el scale)
        const rect = canvas.getBoundingClientRect();
        const scale = isFullscreen ? 4 : 2;
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        // Encontrar la entidad player (la que tiene comp_player_input o comp_cursors)
        const playerEntity = entitiesRef.current.find(entity =>
            entity.template.components.some(c =>
                c.definitionId === 'comp_player_input' ||
                c.definitionId === 'comp_cursors' ||
                c.definitionId === 'comp_input'
            )
        );

        if (playerEntity) {
            // Mover player a la posición del click (centrado en el sprite)
            playerEntity.x = x - playerEntity.sprite.size.width / 2;
            playerEntity.y = y - playerEntity.sprite.size.height / 2;
        }
    }, [isPositioningMode, isDynamic, currentNode, isFullscreen]);

    // Modificar un tile en la capa de colisión runtime
    const modifyTileInLayer = useCallback((tileX: number, tileY: number, newTileId: string | null) => {
        // Validar coordenadas
        if (tileY < 0 || tileY >= 24 || tileX < 0 || tileX >= 32) {
            console.warn(`[TILE MOD] Invalid coordinates: (${tileX}, ${tileY})`);
            return;
        }

        // Modificar collision layer (para lógica de colisión y render visual)
        setRuntimeCollisionLayer(prev => {
            const newLayer = JSON.parse(JSON.stringify(prev));
            if (!newLayer[tileY]) newLayer[tileY] = [];
            newLayer[tileY][tileX] = { tileId: newTileId };
            // Update ref immediately for synchronous access in checkCollisionAt
            runtimeCollisionLayerRef.current = newLayer;
            return newLayer;
        });

        // ✅ Marcar que el buffer necesita actualización en el próximo frame
        tileBufferNeedsUpdate.current = true;

        console.log(`[TILE MOD] Modified tile at (${tileX}, ${tileY}) → ${newTileId || 'empty'}`);
    }, []);

    // Disparar un evento para una entidad
    const triggerEvent = useCallback((entityId: string, eventName: string) => {
        if (!pendingEvents.current.has(entityId)) {
            pendingEvents.current.set(entityId, new Set());
        }
        pendingEvents.current.get(entityId)!.add(eventName);
        console.log(`[EVENT] Triggered "${eventName}" for entity ${entityId}`);
    }, []);

    // Evaluar si una condición se cumple basada en el estado de la entidad
    const evaluateCondition = useCallback((condition: any, entity: AnimatedEntity): boolean => {
        if (!condition) return false;

        const entityEvents = pendingEvents.current.get(entity.instance.id) || new Set<string>();

        switch (condition.type) {
            case 'KEY_PRESSED':
                // Verificar si la tecla especificada está presionada
                const key = condition.params?.key;
                if (!key) return false;
                const isPressed = pressedKeys.current.has(key);
                console.log(`[KEY_PRESSED] Checking key "${key}": ${isPressed ? '✓ PRESSED' : '✗ not pressed'} (current keys: ${Array.from(pressedKeys.current).join(', ')})`);
                return isPressed;

            case 'HAS_COLLISION':
                // Verificar tipo específico de colisión (enemy, item, wall, any)
                const collisionType = condition.params?.collisionType || 'any';

                switch (collisionType) {
                    case 'enemy':
                        return entityEvents.has('collision_enemy');
                    case 'item':
                        return entityEvents.has('collision_item');
                    case 'wall':
                        return entityEvents.has('collision_wall');
                    case 'any':
                    default:
                        // Cualquier tipo de colisión
                        return entityEvents.has('collision_enemy') ||
                               entityEvents.has('collision_item') ||
                               entityEvents.has('collision_wall');
                }

            case 'HAS_DEADLY_TILE_COLLISION':
                // Verificar si la entidad está tocando un tile mortal
                return entity.hasDangerousTileCollision === true;

            case 'ANIMATION_COMPLETE':
                // Check directly on entity property (not events)
                return entity.animationHasCompleted === true;

            case 'AND':
                return condition.conditions?.every((c: any) => evaluateCondition(c, entity)) ?? false;

            case 'OR':
                return condition.conditions?.some((c: any) => evaluateCondition(c, entity)) ?? false;

            case 'NOT':
                return !condition.conditions?.every((c: any) => evaluateCondition(c, entity)) ?? true;

            default:
                return false;
        }
    }, []);

    // Procesar condiciones y verificar transiciones
    const processEventTransitions = useCallback((entity: AnimatedEntity) => {
        if (!entity.stateMachine || !entity.currentState) return;

        const currentStateDef = entity.stateMachine.states.find(s => s.name === entity.currentState);
        if (!currentStateDef) return;

        // Buscar transiciones cuyas condiciones se cumplan
        for (const transition of entity.stateMachine.transitions) {
            if (transition.fromStateId !== currentStateDef.id) continue;

            // Evaluar la condición de la transición (pasa la entidad completa)
            if (transition.conditions && evaluateCondition(transition.conditions, entity)) {
                const nextState = entity.stateMachine.states.find(s => s.id === transition.toStateId);
                if (nextState) {
                    console.log(`[STATE MACHINE] ${entity.instance.name}: Condition met, transitioning from ${entity.currentState} to ${nextState.name}`);
                    entity.currentState = nextState.name;

                    // Aplicar propiedades del nuevo estado
                    if (nextState.properties) {
                        if (nextState.properties.velocityX !== undefined) entity.vx = nextState.properties.velocityX;
                        if (nextState.properties.velocityY !== undefined) entity.vy = nextState.properties.velocityY;
                    }

                    // Ejecutar acciones de la transición
                    if (transition.actions) {
                        for (const action of transition.actions) {
                            switch (action.type) {
                                case 'SET_VELOCITY':
                                    entity.vx = action.params.x || 0;
                                    entity.vy = action.params.y || 0;
                                    console.log(`[ACTION] SET_VELOCITY: vx=${entity.vx}, vy=${entity.vy}`);
                                    break;

                                case 'CHANGE_SPRITE':
                                    const spriteName = action.params.sprite || action.params.spriteName || action.params.sprite_name;
                                    if (spriteName) {
                                        // Find sprite in allAssets
                                        const spriteAssetData = allAssets.find(a =>
                                            a.type === 'sprite' &&
                                            (a.data.name === spriteName || a.data.id === spriteName || a.name === spriteName)
                                        );

                                        if (spriteAssetData) {
                                            const spriteData = spriteAssetData.data as Sprite;
                                            entity.sprite = spriteData;
                                            entity.currentFrame = 0; // Reset to first frame

                                            // Regenerate frame images for the new sprite
                                            // Use Promise.all to wait for all images to load
                                            const imageLoadPromises = spriteData.frames.map((frame, idx) => {
                                                return new Promise<HTMLImageElement>((resolve, reject) => {
                                                    const img = new Image();
                                                    img.onload = () => resolve(img);
                                                    img.onerror = (error) => {
                                                        console.error(`[ACTION] CHANGE_SPRITE: Failed to load frame ${idx} for "${spriteName}"`, error);
                                                        reject(error);
                                                    };
                                                    try {
                                                        img.src = createSpriteDataURL(frame.data, spriteData.size.width, spriteData.size.height);
                                                    } catch (err) {
                                                        console.error(`[ACTION] CHANGE_SPRITE: Error creating data URL for frame ${idx}:`, err);
                                                        reject(err);
                                                    }
                                                });
                                            });

                                            // Load images asynchronously
                                            Promise.all(imageLoadPromises).then((loadedImages) => {
                                                entity.frameImages = loadedImages;
                                                console.log(`[ACTION] CHANGE_SPRITE: Successfully loaded sprite "${spriteName}" with ${loadedImages.length} frames`);
                                            }).catch(() => {
                                                console.error(`[ACTION] CHANGE_SPRITE: Failed to load some frames for "${spriteName}"`);
                                            });

                                            // Regenerate mirrored frame images if sprite has facing direction
                                            if (['right', 'left'].includes(spriteData.facingDirection)) {
                                                const mirroredImageLoadPromises = spriteData.frames.map((frame, idx) => {
                                                    return new Promise<HTMLImageElement>((resolve, reject) => {
                                                        const img = new Image();
                                                        img.onload = () => resolve(img);
                                                        img.onerror = (error) => {
                                                            console.error(`[ACTION] CHANGE_SPRITE: Failed to load mirrored frame ${idx} for "${spriteName}"`, error);
                                                            reject(error);
                                                        };
                                                        try {
                                                            const mirroredData = mirrorPixelDataHorizontally(frame.data as PixelData);
                                                            img.src = createSpriteDataURL(mirroredData, spriteData.size.width, spriteData.size.height);
                                                        } catch (err) {
                                                            console.error(`[ACTION] CHANGE_SPRITE: Error creating mirrored data URL for frame ${idx}:`, err);
                                                            reject(err);
                                                        }
                                                    });
                                                });

                                                // Load mirrored images asynchronously
                                                Promise.all(mirroredImageLoadPromises).then((loadedMirroredImages) => {
                                                    entity.mirroredFrameImages = loadedMirroredImages;
                                                    console.log(`[ACTION] CHANGE_SPRITE: Successfully loaded mirrored frames for sprite "${spriteName}"`);
                                                }).catch(() => {
                                                    console.error(`[ACTION] CHANGE_SPRITE: Failed to load some mirrored frames for "${spriteName}"`);
                                                });
                                            } else {
                                                // Clear mirrored frames if new sprite doesn't support mirroring
                                                entity.mirroredFrameImages = undefined;
                                            }

                                            console.log(`[ACTION] CHANGE_SPRITE: Changing to sprite "${spriteName}"...`);
                                        } else {
                                            const availableSprites = allAssets.filter(a => a.type === 'sprite').map(a => a.data.name);
                                            console.warn(`[ACTION] CHANGE_SPRITE: Sprite "${spriteName}" not found. Available sprites:`, availableSprites);
                                        }
                                    } else {
                                        console.warn(`[ACTION] CHANGE_SPRITE: No sprite name provided. Params:`, action.params);
                                    }
                                    break;

                                case 'PLAY_ANIMATION':
                                    const animName = action.params.animationName;
                                    console.log(`[ACTION] PLAY_ANIMATION: ${animName} (not fully implemented)`);
                                    // TODO: Implement animation system if needed
                                    break;

                                case 'DESTROY_ENTITY':
                                    entity.markedForDestruction = true;
                                    console.log(`[ACTION] DESTROY_ENTITY: Marked ${entity.instance.name} for destruction`);
                                    break;

                                case 'SET_POSITION':
                                    if (action.params.x !== undefined) entity.x = Number(action.params.x);
                                    if (action.params.y !== undefined) entity.y = Number(action.params.y);
                                    console.log(`[ACTION] SET_POSITION: x=${entity.x}, y=${entity.y}`);
                                    break;

                                case 'MOVE_BY':
                                    entity.x += Number(action.params.x || 0);
                                    entity.y += Number(action.params.y || 0);
                                    console.log(`[ACTION] MOVE_BY: dx=${action.params.x}, dy=${action.params.y}`);
                                    break;

                                case 'SET_VARIABLE':
                                    // TODO: Implement global variables system
                                    console.log(`[ACTION] SET_VARIABLE: ${action.params.variableName} = ${action.params.value}`);
                                    break;

                                case 'INCREMENT_VARIABLE':
                                    // TODO: Implement global variables system
                                    console.log(`[ACTION] INCREMENT_VARIABLE: ${action.params.variableName} += ${action.params.amount}`);
                                    break;

                                case 'DECREMENT_VARIABLE':
                                    // TODO: Implement global variables system
                                    console.log(`[ACTION] DECREMENT_VARIABLE: ${action.params.variableName} -= ${action.params.amount}`);
                                    break;

                                case 'CHANGE_GAME_FLOW_NODE':
                                    let targetNodeId = action.params.nodeId || action.params.targetNodeId;

                                    // Special case: "START" navigates to the Start node
                                    if (targetNodeId === 'START') {
                                        const startNode = nodes.find(n => n.type === 'Start');
                                        if (startNode) {
                                            targetNodeId = startNode.id;
                                            console.log(`[ACTION] CHANGE_GAME_FLOW_NODE: "START" resolved to node "${targetNodeId}"`);
                                        } else {
                                            console.warn(`[ACTION] CHANGE_GAME_FLOW_NODE: No Start node found in graph`);
                                            break;
                                        }
                                    }

                                    if (targetNodeId) {
                                        console.log(`[ACTION] CHANGE_GAME_FLOW_NODE: Navigating to node "${targetNodeId}"`);
                                        // Store the target node for deferred navigation (after frame completes)
                                        (entity as any).pendingNodeTransition = targetNodeId;
                                    } else {
                                        console.warn(`[ACTION] CHANGE_GAME_FLOW_NODE: No target node specified`);
                                    }
                                    break;

                                case 'DECREASE_LIVES':
                                    const decreaseAmount = Number(action.params.amount || 1);
                                    // Find comp_health
                                    const healthCompForDecrease = entity.template.components.find(c => c.definitionId === 'comp_health');
                                    if (healthCompForDecrease) {
                                        const healthOverride = entity.instance.componentOverrides?.['comp_health'] || {};
                                        const currentLives = Number(healthOverride.current || healthCompForDecrease.defaultValues?.current || 3);
                                        const newLives = Math.max(0, currentLives - decreaseAmount);

                                        if (!entity.instance.componentOverrides) entity.instance.componentOverrides = {};
                                        if (!entity.instance.componentOverrides['comp_health']) {
                                            entity.instance.componentOverrides['comp_health'] = {};
                                        }
                                        entity.instance.componentOverrides['comp_health'].current = newLives;

                                        console.log(`[ACTION] DECREASE_LIVES: ${currentLives} → ${newLives} (decreased by ${decreaseAmount})`);
                                    } else {
                                        console.warn(`[ACTION] DECREASE_LIVES: Entity has no comp_health component`);
                                    }
                                    break;

                                case 'INCREASE_LIVES':
                                    const increaseAmount = Number(action.params.amount || 1);
                                    const healthCompForIncrease = entity.template.components.find(c => c.definitionId === 'comp_health');
                                    if (healthCompForIncrease) {
                                        const healthOverride = entity.instance.componentOverrides?.['comp_health'] || {};
                                        const currentLives = Number(healthOverride.current || healthCompForIncrease.defaultValues?.current || 3);
                                        const maxLives = Number(healthOverride.max || healthCompForIncrease.defaultValues?.max || 3);
                                        const newLives = Math.min(maxLives, currentLives + increaseAmount);

                                        if (!entity.instance.componentOverrides) entity.instance.componentOverrides = {};
                                        if (!entity.instance.componentOverrides['comp_health']) {
                                            entity.instance.componentOverrides['comp_health'] = {};
                                        }
                                        entity.instance.componentOverrides['comp_health'].current = newLives;

                                        console.log(`[ACTION] INCREASE_LIVES: ${currentLives} → ${newLives} (increased by ${increaseAmount})`);
                                    } else {
                                        console.warn(`[ACTION] INCREASE_LIVES: Entity has no comp_health component`);
                                    }
                                    break;

                                case 'RESPAWN_PLAYER': {
                                let spawnX: number;
                                let spawnY: number;
                                let targetScreenId: string | undefined;

                                if (gameGlobalVariables.playerCheckpointX !== undefined && gameGlobalVariables.playerCheckpointY !== undefined && gameGlobalVariables.playerCheckpointScreen) {
                                    spawnX = Number(gameGlobalVariables.playerCheckpointX);
                                    spawnY = Number(gameGlobalVariables.playerCheckpointY);
                                    targetScreenId = gameGlobalVariables.playerCheckpointScreen;
                                    console.log(`[ACTION] RESPAWN_PLAYER: Using checkpoint at (${spawnX}, ${spawnY}) on screen ${targetScreenId}`);
                                } else if (action.params.x !== undefined || action.params.y !== undefined) {
                                    spawnX = Number(action.params.x !== undefined ? action.params.x : entity.x);
                                    spawnY = Number(action.params.y !== undefined ? action.params.y : entity.y);
                                    console.log(`[ACTION] RESPAWN_PLAYER: Using action params at (${spawnX}, ${spawnY})`);
                                } else {
                                    spawnX = entity.instance.position.x * 8;
                                    spawnY = entity.instance.position.y * 8;
                                    console.log(`[ACTION] RESPAWN_PLAYER: Using initial position at (${spawnX}, ${spawnY})`);
                                }

                                const currentScreenMap = currentScreenMapRef.current;
                                const currentWorldMapGraph = currentWorldMapGraphRef.current;

                                // ✅ Si el checkpoint pertenece a otra pantalla, cambiar a ella
                                if (targetScreenId && currentScreenMap?.id !== targetScreenId) {
                                    console.log(`[ACTION] RESPAWN_PLAYER: Switching to screen ${targetScreenId} before respawning`);
                                    const setPlayerEntryPoint = setPlayerEntryPointRef.current;
                                    const handleScreenTransition = handleScreenTransitionRef.current;

                                    setPlayerEntryPoint({ x: spawnX, y: spawnY });

                                    if (currentWorldMapGraph) {
                                        const targetScreenNode = currentWorldMapGraph.nodes.find(n => n.screenAssetId === targetScreenId);
                                        if (targetScreenNode) {
                                            handleScreenTransition(targetScreenNode.id);
                                            // No modificar entity.x/y aquí: se hará en el useEffect tras la transición
                                            return;
                                        } else {
                                            console.warn(`[ACTION] RESPAWN_PLAYER: Target screen node not found for ID ${targetScreenId}`);
                                        }
                                    }
                                }

                                // ✅ Si ya estamos en la pantalla correcta, respawnear localmente
                                entity.x = spawnX;
                                entity.y = spawnY;
                                entity.vx = 0;
                                entity.vy = 0;
                                console.log(`[ACTION] RESPAWN_PLAYER: Player respawned at (${spawnX}, ${spawnY})`);
                                break;
                            }

                                case 'BREAK_TILE':
                                case 'REPLACE_TILE': {
                                    const params = action.params;
                                    const dir = params.direction || 'up';

                                    // Calcular posición del tile según dirección relativa al player
                                    const offsets: Record<string, { x: number; y: number }> = {
                                        up: { x: 0, y: -1 },
                                        down: { x: 0, y: 1 },
                                        left: { x: -1, y: 0 },
                                        right: { x: 1, y: 0 },
                                        // Diagonales
                                        'up-right': { x: 1, y: -1 },
                                        'up-left': { x: -1, y: -1 },
                                        'down-right': { x: 1, y: 1 },
                                        'down-left': { x: -1, y: 1 }
                                    };

                                    // Posición del player en tiles (8x8)
                                    const playerTileX = Math.floor((entity.x + entity.sprite.size.width / 2) / 8);
                                    const playerTileY = Math.floor((entity.y + entity.sprite.size.height / 2) / 8);

                                    // Posición del tile target
                                    const targetTileX = playerTileX + offsets[dir].x;
                                    const targetTileY = playerTileY + offsets[dir].y;

                                    // Verificar que el tile target existe (usar ref para acceso síncrono)
                                    const targetTile = runtimeCollisionLayerRef.current[targetTileY]?.[targetTileX];

                                    if (targetTile?.tileId) {
                                        const tileAsset = allAssets.find(a => a.id === targetTile.tileId && a.type === 'tile');
                                        const tileData = tileAsset?.data as Tile | undefined;

                                        if (action.type === 'BREAK_TILE') {
                                            // Solo romper si el tile es breakable
                                            if (tileData?.logicalProperties?.isBreakable) {
                                                modifyTileInLayer(targetTileX, targetTileY, null);
                                                console.log(`[ACTION] BREAK_TILE: Broke tile at (${targetTileX}, ${targetTileY})`);
                                            } else {
                                                console.log(`[ACTION] BREAK_TILE: Tile not breakable at (${targetTileX}, ${targetTileY})`);
                                            }
                                        } else if (action.type === 'REPLACE_TILE') {
                                            // Reemplazar con nuevo tile
                                            const newTileId = params.replacementTileId || null;
                                            modifyTileInLayer(targetTileX, targetTileY, newTileId);
                                            console.log(`[ACTION] REPLACE_TILE: Replaced tile at (${targetTileX}, ${targetTileY}) with ${newTileId || 'empty'}`);
                                        }
                                    } else if (!targetTile?.tileId && action.type === 'REPLACE_TILE') {
                                        // Permitir colocar tile en espacio vacío
                                        const newTileId = params.replacementTileId || null;
                                        if (newTileId) {
                                            modifyTileInLayer(targetTileX, targetTileY, newTileId);
                                            console.log(`[ACTION] REPLACE_TILE: Placed tile at empty position (${targetTileX}, ${targetTileY})`);
                                        }
                                    } else {
                                        console.log(`[ACTION] ${action.type}: No tile at target position (${targetTileX}, ${targetTileY})`);
                                    }
                                    break;
                                }

                                default:
                                    console.warn(`[ACTION] Unknown action type: ${action.type}`);
                                    break;
                            }
                        }
                    }

                    // Limpiar TODOS los eventos después de procesar la transición
                    const entityEvents = pendingEvents.current.get(entity.instance.id);
                    if (entityEvents) {
                        entityEvents.clear();
                    }
                    break; // Solo una transición por frame
                }
            }
        }
    }, [evaluateCondition, gameGlobalVariables, allAssets, createSpriteDataURL, mirrorPixelDataHorizontally]);

    const checkKeyTransitions = useCallback((entityId: string, pressedKey: string, isKeyDown: boolean) => {
        const entity = entitiesRef.current.find(e => e.instance.id === entityId);
        if (!entity) {
            console.log(`Entity ${entityId} not found`);
            return;
        }
        if (!entity.stateMachine) {
            // Input for non-statemachine entities is now handled in the animate loop.
            return;
        }
        if (!entity.currentState) {
            console.log(`Entity ${entityId} has no current state`);
            return;
        }
        const currentStateDef = entity.stateMachine.states.find(s => s.name === entity.currentState);
        if (!currentStateDef) {
            console.log(`Current state ${entity.currentState} not found in state machine`);
            return;
        }
        console.log(`Entity ${entityId}: Current state = ${entity.currentState}, Key = ${pressedKey}, KeyDown = ${isKeyDown}`);
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
                    console.log(`Transitioning from ${entity.currentState} to ${nextState.name}`);
                    entity.currentState = nextState.name;
                    if (transition.actions) {
                        for (const action of transition.actions) {
                            if (action.type === 'SET_VELOCITY') {
                                entity.vx = action.params.x || 0;
                                entity.vy = action.params.y || 0;
                                console.log(`Setting velocity: x=${entity.vx}, y=${entity.vy}`);
                            }
                        }
                    }
                    return;
                }
            }
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            modalRef.current?.focus();
            const startNode = graphData.nodes.find(n => n.type === 'Start');
            if (startNode) setCurrentNodeId(startNode.id);
            setNavigationStack([]);
            setSelectedOptionIndex(0);
            setCurrentScreenMap(null);
            setCurrentWorldMapGraph(null);
            setGameFlowStack([]);
            setCurrentNestedGraphData(null);
            setCurrentExecutingGameFlowName(gameFlowAssetName);
            heroRef.current = null;
            pressedKeys.current.clear();
            jumpKeyProcessed.current = false;
        } else {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            setTimeout(() => {
                const mainContainer = document.querySelector('.flex-grow.flex.overflow-hidden');
                if (mainContainer instanceof HTMLElement) {
                    mainContainer.style.display = 'none';
                    mainContainer.offsetHeight;
                    mainContainer.style.display = '';
                }
                window.dispatchEvent(new Event('resize'));
                document.body.offsetHeight;
            }, 100);
        }
    }, [isOpen, graphData, gameFlowAssetName]);

    const expandMenuOptions = useCallback((subMenuNode: GameFlowSubMenuNode) => {
        const expandedOptions: Array<{text: string, originalIndex: number, isControlOption?: boolean, controlValue?: string}> = [];
        subMenuNode.options.forEach((option, idx) => {
            if (option.type === 'controls' && option.controlOptions && option.controlOptions.length > 0) {
                option.controlOptions.forEach(ctrl => {
                    expandedOptions.push({text: ctrl, originalIndex: idx, isControlOption: true, controlValue: ctrl});
                });
            } else {
                expandedOptions.push({text: option.text, originalIndex: idx});
            }
        });
        return expandedOptions;
    }, []);

    const handleAction = useCallback(() => {
        if (!currentNode || currentNode.type !== 'SubMenu') return;
        const subMenuNode = currentNode as GameFlowSubMenuNode;
        const expandedOptions = expandMenuOptions(subMenuNode);
        const selectedExpanded = expandedOptions[selectedOptionIndex];
        if (!selectedExpanded) return;
        const selectedOption = subMenuNode.options[selectedExpanded.originalIndex];
        if (!selectedOption) return;
        if (selectedExpanded.isControlOption && selectedExpanded.controlValue && selectedOption.globalVariableName) {
            setGameGlobalVariables(prev => ({
                ...prev,
                [selectedOption.globalVariableName!]: selectedExpanded.controlValue
            }));
            console.log(`Global variable ${selectedOption.globalVariableName} set to: ${selectedExpanded.controlValue}`);
        }
        const connection = connections.find(c => c.from.nodeId === currentNode.id && c.from.sourceId === selectedOption.id);
        if (connection) {
            let targetNodeId = connection.to.nodeId;
            let targetNode = nodes.find(n => n.id === targetNodeId);
            while (targetNode && targetNode.type === 'Waypoint') {
                const nextConn = connections.find(c => c.from.nodeId === targetNodeId);
                if (nextConn) {
                    targetNodeId = nextConn.to.nodeId;
                    targetNode = nodes.find(n => n.id === targetNodeId);
                } else {
                    break;
                }
            }
            setNavigationStack(prev => [...prev, currentNode.id]);
            setCurrentNodeId(targetNodeId);
            setSelectedOptionIndex(0);
        }
    }, [currentNode, connections, selectedOptionIndex, nodes, expandMenuOptions]);

    const handleGoBack = useCallback(() => {
        if (navigationStack.length > 0) {
            const lastNodeId = navigationStack[navigationStack.length - 1];
            setNavigationStack(prev => prev.slice(0, -1));
            setCurrentNodeId(lastNodeId);
            setSelectedOptionIndex(0);
        } else if (currentNode?.type === 'WorldLink') {
            onClose();
        }
    }, [navigationStack, currentNode, onClose]);

    const handleScreenTransition = useCallback((toNodeId: string) => {
        if (!currentWorldMapGraph) return;
        const nextScreenNode = currentWorldMapGraph.nodes.find(n => n.id === toNodeId);
        if (!nextScreenNode) return;
        const nextScreenAsset = allAssets.find(a => a.id === nextScreenNode.screenAssetId && a.type === 'screenmap');
        if (!nextScreenAsset) return;

        // NO guardamos checkpoint aquí porque:
        // - Si viene del cruce de bordes, playerEntryPoint ya está set y se guardará en el effect con la posición correcta
        // - Si viene de botón manual, también se guardará en el effect con la posición inicial

        setCurrentScreenMap(nextScreenAsset.data as ScreenMap);
    }, [currentWorldMapGraph, allAssets]);

    const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
        // Remove both e.key and e.code for compatibility
        if (heroRef.current) {
            if (pressedKeys.current.has(e.key)) {
                pressedKeys.current.delete(e.key);
            }
            if (e.code && pressedKeys.current.has(e.code)) {
                pressedKeys.current.delete(e.code);
            }
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                checkKeyTransitions(heroRef.current.instance.id, e.key, false);
            }
        }
        // Reset jump key processed flag when space is released
        if (e.key === ' ') {
            jumpKeyProcessed.current = false;
        }
    }, [checkKeyTransitions]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        e.preventDefault();
        if (!currentNode) return;
        if (currentNode.type === 'SubMenu') {
            const subMenuNode = currentNode as GameFlowSubMenuNode;
            const expandedOptions = expandMenuOptions(subMenuNode);
            const maxIndex = expandedOptions.length - 1;
            switch (e.key) {
                case 'ArrowUp': setSelectedOptionIndex(prev => Math.max(0, prev - 1)); break;
                case 'ArrowDown': setSelectedOptionIndex(prev => Math.min(maxIndex, prev + 1)); break;
                case ' ': case 'Enter': handleAction(); break;
                case 'Escape': handleGoBack(); break;
            }
        } else if (currentNode.type === 'Text' || currentNode.type === 'Restart') {
            switch (e.key) {
                case ' ': case 'Enter':
                    if (currentNode.type === 'Restart') {
                        const startNode = nodes.find(n => n.type === 'Start');
                        if (startNode) {
                            setCurrentNodeId(startNode.id);
                            setNavigationStack([]);
                        }
                        break;
                    }
                    const conn = connections.find(c => c.from.nodeId === currentNode.id);
                    if (conn) {
                        let targetNodeId = conn.to.nodeId;
                        let targetNode = nodes.find(n => n.id === targetNodeId);
                        while (targetNode && targetNode.type === 'Waypoint') {
                            const nextConn = connections.find(c => c.from.nodeId === targetNodeId);
                            if (nextConn) {
                                targetNodeId = nextConn.to.nodeId;
                                targetNode = nodes.find(n => n.id === targetNodeId);
                            } else {
                                break;
                            }
                        }
                        setCurrentNodeId(targetNodeId);
                    }
                    break;
                case 'Escape': handleGoBack(); break;
            }
        } else if (currentNode.type === 'WorldLink') {
            if (heroRef.current) {
                if (e.code === 'Space') {
                    // Jump logic is now handled in the animate loop
                }
                // Add both e.key and e.code for compatibility (e.g., "n" and "KeyN")
                // e.key for legacy comp_cursors/comp_jump, e.code for State Machine conditions
                if (!pressedKeys.current.has(e.key)) {
                    pressedKeys.current.add(e.key);
                }
                if (e.code && !pressedKeys.current.has(e.code)) {
                    pressedKeys.current.add(e.code);
                }
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                    checkKeyTransitions(heroRef.current.instance.id, e.key, true);
                }
                if (e.key === 'Escape') handleGoBack();
                return;
            }
            const currentScreenNode = currentWorldMapGraph?.nodes.find(n => n.screenAssetId === currentScreenMap?.id);
            if (!currentScreenNode || !currentWorldMapGraph) return;
            const findAndTransition = (direction: 'north' | 'south' | 'east' | 'west') => {
                const outgoing = currentWorldMapGraph.connections.find(c => c.fromNodeId === currentScreenNode.id && c.fromDirection === direction);
                if (outgoing) { handleScreenTransition(outgoing.toNodeId); return; }
                const incoming = currentWorldMapGraph.connections.find(c => c.toNodeId === currentScreenNode.id && c.toDirection === direction);
                if (incoming) handleScreenTransition(incoming.fromNodeId);
            };
            switch (e.key) {
                case 'ArrowUp': findAndTransition('north'); break;
                case 'ArrowDown': findAndTransition('south'); break;
                case 'ArrowLeft': findAndTransition('west'); break;
                case 'ArrowRight': findAndTransition('east'); break;
                case 'Escape': handleGoBack(); break;
            }
        }
    }, [currentNode, currentScreenMap, currentWorldMapGraph, handleScreenTransition, handleAction, handleGoBack, checkKeyTransitions, expandMenuOptions, nodes, connections]);

    useEffect(() => {
        if (!isOpen || currentNode?.type !== 'WorldLink' || currentScreenMap) return;
        const worldMapAsset = allAssets.find(a => a.id === (currentNode as GameFlowWorldLinkNode).worldAssetId && a.type === 'worldmap');
        if (!worldMapAsset) return;
        const worldMapGraph = worldMapAsset.data as WorldMapGraph;
        if (!worldMapGraph?.startScreenNodeId) return;
        setCurrentWorldMapGraph(worldMapGraph);
        const startScreenNode = worldMapGraph.nodes.find(n => n.id === worldMapGraph.startScreenNodeId);
        if (!startScreenNode) return;
        const screenMapAsset = allAssets.find(a => a.id === startScreenNode.screenAssetId && a.type === 'screenmap');
        if (!screenMapAsset) return;
        setCurrentScreenMap(screenMapAsset.data as ScreenMap);
    }, [isOpen, currentNode, allAssets, currentScreenMap]);

    // Update currentScreenMap when the underlying asset changes in allAssets
    useEffect(() => {
        if (!isOpen || !currentScreenMap) return;
        const updatedScreenMapAsset = allAssets.find(a => a.id === currentScreenMap.id && a.type === 'screenmap');
        if (!updatedScreenMapAsset) return;
        const updatedScreenMap = updatedScreenMapAsset.data as ScreenMap;
        // Only update if the reference has actually changed (indicating an update occurred)
        if (updatedScreenMap !== currentScreenMap) {
            setCurrentScreenMap(updatedScreenMap);
        }
    }, [isOpen, allAssets, currentScreenMap]);

    useEffect(() => {
        if (!isOpen) {
            heroRef.current = null;
            return;
        }
        if (!currentScreenMap) {
            entitiesRef.current = [];
            return;
        };
        // Guardar refs para uso en acciones asincrónicas
        currentScreenMapRef.current = currentScreenMap;
        currentWorldMapGraphRef.current = currentWorldMapGraph;
        setPlayerEntryPointRef.current = setPlayerEntryPoint;
        handleScreenTransitionRef.current = handleScreenTransition;

        console.log(`[Effect] Loading screen: ${currentScreenMap.name}`);
        console.log('[Effect] Entry point on load:', playerEntryPoint);

        // Initialize runtime collision layer (cloned from screenMap for in-game modifications)
        if (currentScreenMap.layers?.collision) {
            const clonedLayer = JSON.parse(JSON.stringify(currentScreenMap.layers.collision));
            console.log('[TILE SYSTEM] Collision layer initialized for runtime modifications');
            console.log('[TILE SYSTEM] Original collision layer sample [16][17]:', currentScreenMap.layers.collision[16]?.[17]);
            console.log('[TILE SYSTEM] Cloned collision layer sample [16][17]:', clonedLayer[16]?.[17]);
            console.log('[TILE SYSTEM] Collision layer dimensions:', currentScreenMap.layers.collision.length, 'x', currentScreenMap.layers.collision[0]?.length);
            runtimeCollisionLayerRef.current = clonedLayer; // Update ref immediately for synchronous access
            setRuntimeCollisionLayer(clonedLayer);
        } else {
            // Create empty collision layer if not exists
            const emptyLayer: ScreenTile[][] = Array(24).fill(null).map(() =>
                Array(32).fill(null).map(() => ({ tileId: null }))
            );
            runtimeCollisionLayerRef.current = emptyLayer; // Update ref immediately for synchronous access
            setRuntimeCollisionLayer(emptyLayer);
            console.log('[TILE SYSTEM] Created empty collision layer');
        }

        const getAsset = <T extends AssetType>(assetId: string | null | undefined, assetType: T): ProjectAsset | undefined => {
            if (!assetId) return undefined;
            return allAssets.find(a => a.id === assetId && a.type === assetType);
        };

        const nativeEntities = currentScreenMap.layers.entities.map(instance => {
            const template = entityTemplates.find(t => t.id === instance.entityTemplateId);
            if (!template) return null;
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
            const spriteAsset = getAsset(spriteAssetId, 'sprite');
            const sprite = spriteAsset?.data as Sprite;
            if (!sprite?.frames?.length) return null;
            const frameImages = sprite.frames.map(frame => {
                const img = new Image();
                img.src = createSpriteDataURL(frame.data, sprite.size.width, sprite.size.height);
                return img;
            });
            let mirroredFrameImages: HTMLImageElement[] | undefined;
            if (['right', 'left'].includes(sprite.facingDirection)) {
                mirroredFrameImages = sprite.frames.map(frame => {
                    const mirroredData = mirrorPixelDataHorizontally(frame.data as PixelData);
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
                    if (!initialState && startStateId) initialState = stateMachine.states.find(s => s.name === startStateId);
                    if (!initialState) initialState = stateMachine.states.find(s => s.name.toLowerCase() === 'idle') || stateMachine.states[0];
                    currentState = initialState?.name;
                    console.log(`[ENTITY INIT] ${instance.name}: State Machine initialized to "${currentState}" (stateId: ${initialState?.id})`);
                }
            }
            const patrolComp = instance.componentOverrides?.comp_patrol;
            let startX = instance.position.x * TILE_SIZE;
            let startY = instance.position.y * TILE_SIZE;

            console.log(`[ENTITY INIT] ${instance.name}: instance.position=(${instance.position.x}, ${instance.position.y}), pixels=(${startX}, ${startY})`);

            let vx = 0, vy = 0;
            if (patrolComp?.waypoint1_x !== undefined && patrolComp?.waypoint1_y !== undefined) {
                // IMPORTANTE: Si waypoint1 está definido, usar esas coordenadas como inicio PRIMERO
                startX = Number(patrolComp.waypoint1_x);
                startY = Number(patrolComp.waypoint1_y);

                // Calcular dirección hacia waypoint2
                const endX = Number(patrolComp.waypoint2_x ?? startX);
                const endY = Number(patrolComp.waypoint2_y ?? startY);
                console.log(`[ENTITY INIT] ${instance.name} has patrol: waypoint1=(${startX}, ${startY}), waypoint2=(${endX}, ${endY})`);

                const dx = endX - startX;
                const dy = endY - startY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Aplicar velocidad usando la propiedad speed
                const speed = Number(patrolComp.speed) || 1;
                if (dist > 0) {
                    vx = (dx / dist) * speed;
                    vy = (dy / dist) * speed;
                }

                console.log(`[ENTITY INIT] ${instance.name} patrol velocity: vx=${vx}, vy=${vy} (speed=${speed}, distance=${dist.toFixed(2)})`);
            }
            return {
                instance, template, sprite, x: startX, y: startY, vx, vy,
                frameImages, mirroredFrameImages, currentFrame: 0, lastFrameUpdateTime: 0,
                stateMachine, currentState, isOnGround: false, spawnTime: performance.now()
            };
        }).filter(Boolean) as AnimatedEntity[];

        let entitiesToAnimate = nativeEntities;
        let heroForThisScreen: AnimatedEntity | undefined;

        // Si hay playerEntryPoint (cruce de borde), SIEMPRE usar el hero actual (carry over)
        if (playerEntryPoint && heroRef.current) {
            console.log('[Effect] Border crossing detected. Carrying over hero:', heroRef.current.instance.name);

            // IMPORTANTE: Remover el player nativo si existe, para evitar duplicados
            entitiesToAnimate = entitiesToAnimate.filter(e =>
                !e.template.components.some(c => c.definitionId === 'comp_cursors' || c.definitionId === 'comp_player_input') &&
                e.template.name !== 'Player'
            );
            console.log('[Effect] Native hero removed from array to avoid duplicates');

            entitiesToAnimate.push(heroRef.current);
            heroForThisScreen = heroRef.current;
        } else {
            // Si NO hay playerEntryPoint, buscar hero nativo o usar carry over
            heroForThisScreen = entitiesToAnimate.find(e => e.template.components.some(c => c.definitionId === 'comp_cursors' || c.definitionId === 'comp_player_input') || e.template.name === 'Player');
            console.log('[Effect] Native hero found:', heroForThisScreen?.instance.name);
            if (heroRef.current && !heroForThisScreen) {
                console.log('[Effect] No native hero. Carrying over:', heroRef.current.instance.name);
                entitiesToAnimate.push(heroRef.current);
                heroForThisScreen = heroRef.current;
            }
        }

        // Guardar checkpoint del héroe
        if (heroForThisScreen) {
            let checkpointX: number;
            let checkpointY: number;

            if (playerEntryPoint) {
                // Entrada por borde → usar playerEntryPoint
                heroForThisScreen.x = playerEntryPoint.x;
                heroForThisScreen.y = playerEntryPoint.y;
                heroForThisScreen.vx = 0;
                heroForThisScreen.vy = 0;
                checkpointX = Math.round(playerEntryPoint.x);
                checkpointY = Math.round(playerEntryPoint.y);
                console.log(`[CHECKPOINT] Saved border entry: (${checkpointX}, ${checkpointY})`);
            } else {
                // Carga inicial → usar posición del héroe
                checkpointX = Math.round(heroForThisScreen.x);
                checkpointY = Math.round(heroForThisScreen.y);
                console.log(`[CHECKPOINT] Saved initial position: (${checkpointX}, ${checkpointY})`);
            }

    // ✅ SIEMPRE guardar, incluso si ya había checkpoint en esta pantalla
        // ✅ Punto de entrada: solo para colocar al player
        if (playerEntryPoint) {
        heroForThisScreen.x = playerEntryPoint.x
        heroForThisScreen.y = playerEntryPoint.y
        heroForThisScreen.vx = 0
        heroForThisScreen.vy = 0
        setPlayerEntryPoint(null)   // ← ya se usó
        }

        // ✅ Checkpoint: zona SEGURA dentro de la pantalla
        const safeX = Math.max(8, Math.min(PREVIEW_WIDTH  - heroForThisScreen.sprite.size.width  - 8, Math.round(heroForThisScreen.x)))
        const safeY = Math.max(8, Math.min(PREVIEW_HEIGHT - heroForThisScreen.sprite.size.height - 8, Math.round(heroForThisScreen.y)))

        setGameGlobalVariables(prev => ({
        ...prev,
        playerCheckpointX: safeX,
        playerCheckpointY: safeY,
        playerCheckpointScreen: currentScreenMap.id
        }))
        }   
        setPlayerEntryPoint(null);
        entitiesRef.current = entitiesToAnimate;
        heroRef.current = heroForThisScreen || null;
        console.log('[Effect] Final hero ref:', heroRef.current?.instance.name);

        if (heroForThisScreen && playerEntryPoint) {
            console.log('[Effect] Re-applying velocity after transition.');
            pressedKeys.current.forEach(key => {
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
                    console.log(`[Effect] Re-applying key: ${key} to hero ${heroForThisScreen!.instance.id}`);
                    checkKeyTransitions(heroForThisScreen!.instance.id, key, true);
                }
            });
            setPlayerEntryPoint(null);
        }
    }, [isOpen, currentScreenMap, allAssets, entityTemplates, componentDefinitions, checkKeyTransitions]);

    useEffect(() => {
        if (!isOpen || !currentNode) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        ctx.imageSmoothingEnabled = false;

        // --- Nuevo: Pre-renderizado de Tiles ---
        let tileCanvas: HTMLCanvasElement | null = null;
        let tileCtx: CanvasRenderingContext2D | null = null;

        const subMenuNode = currentNode.type === 'SubMenu' ? currentNode as GameFlowSubMenuNode : null;
        const bgAsset = subMenuNode?.appearance?.backgroundScreenAssetId ? allAssets.find(a => a.id === subMenuNode.appearance.backgroundScreenAssetId) : null;
        const screenMapToRender = currentScreenMap || (bgAsset?.data as ScreenMap);
        const tileset = allAssets.filter(a => a.type === 'tile').map(a => a.data as Tile);

        const checkCollisionAt = (x: number, y: number, screenMap: ScreenMap) => {
            const tileX = Math.floor(x / TILE_SIZE);
            const tileY = Math.floor(y / TILE_SIZE);
            if (tileX < 0 || tileX >= screenMap.width || tileY < 0 || tileY >= screenMap.height) return false;

            // Usar runtimeCollisionLayerRef si estamos en currentScreenMap Y el layer está inicializado (permite modificación de tiles)
            const useRuntimeLayer = screenMap === currentScreenMap && runtimeCollisionLayerRef.current.length > 0;
            const collisionLayer = useRuntimeLayer ? runtimeCollisionLayerRef.current : screenMap.layers.collision;
            const tileOnLayer = collisionLayer[tileY]?.[tileX];

            if (!tileOnLayer || !tileOnLayer.tileId) return false;
            const tile = tileset.find(t => t.id === tileOnLayer.tileId);
            return tile?.logicalProperties?.isSolid ?? false;
        };

        const checkDangerousTileAt = (x: number, y: number, screenMap: ScreenMap) => {
            const tileX = Math.floor(x / TILE_SIZE);
            const tileY = Math.floor(y / TILE_SIZE);
            if (tileX < 0 || tileX >= screenMap.width || tileY < 0 || tileY >= screenMap.height) return false;

            const useRuntimeLayer = screenMap === currentScreenMap && runtimeCollisionLayerRef.current.length > 0;
            const collisionLayer = useRuntimeLayer ? runtimeCollisionLayerRef.current : screenMap.layers.collision;
            const tileOnLayer = collisionLayer[tileY]?.[tileX];

            if (!tileOnLayer || !tileOnLayer.tileId) return false;
            const tile = tileset.find(t => t.id === tileOnLayer.tileId);
            return tile?.logicalProperties?.causesDamage ?? false;
        };

        const renderTileMapToBuffer = (map: ScreenMap, tset: Tile[], mode: string, runtimeLayer?: ScreenTile[][]) => {
            if (!map) return null; // No hay mapa para renderizar
            tileCanvas = document.createElement('canvas');
            tileCanvas.width = PREVIEW_WIDTH;
            tileCanvas.height = PREVIEW_HEIGHT;
            tileCtx = tileCanvas.getContext('2d');
            if (!tileCtx) return null;
            tileCtx.imageSmoothingEnabled = false;

            // Si hay runtime layer, crear copia temporal del screenMap con ese layer solo para collision
            // El background se mantiene original para el renderizado visual
            const mapToRender = runtimeLayer ? {
                ...map,
                layers: {
                    ...map.layers,
                    background: map.layers.background,  // Mantener background original para renderizado
                    collision: runtimeLayer              // Solo usar runtime para detección de colisiones
                }
            } : map;

            renderScreenToCanvas(tileCanvas, mapToRender, tset, mode, TILE_SIZE);
            return tileCanvas;
        };

        // Pre-renderizar el mapa actual si existe, usando runtimeCollisionLayer si está disponible
        if (screenMapToRender) {
            const layerToUse = runtimeCollisionLayerRef.current.length > 0 ? runtimeCollisionLayerRef.current : undefined;
            tileBufferRef.current = renderTileMapToBuffer(screenMapToRender, tileset, currentScreenMode, layerToUse);
            tileBufferNeedsUpdate.current = false; // Reset flag
        }
        // --- Fin Nuevo ---

        const drawTextAsync = (text: string, x: number, y: number, colorAttrs: MSXFontColorAttributes, customFont?: MSXFont, customColorAttrs?: MSXFontColorAttributes) => {
            return new Promise<void>((resolve) => {
                const textImg = new Image();
                textImg.onload = () => { ctx.drawImage(textImg, x, y); resolve(); };
                const fontToUse = customFont || msxFont;
                const colorAttrsToUse = customColorAttrs || colorAttrs;
                textImg.src = renderMSX1TextToDataURL(text, fontToUse, colorAttrsToUse, 1, 1);
            });
        };

        const applyTransitionEffect = async (effect: string, duration: number) => {
            const steps = Math.max(10, Math.floor(duration / 50));
            switch (effect) {
                case 'cls':
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
                    await new Promise(resolve => setTimeout(resolve, 100));
                    break;
                case 'dissolve_pixels':
                    for (let i = 0; i < steps; i++) {
                        const pixelsPerStep = Math.floor((PREVIEW_WIDTH * PREVIEW_HEIGHT) / steps);
                        for (let j = 0; j < pixelsPerStep; j++) {
                            const x = Math.floor(Math.random() * PREVIEW_WIDTH);
                            const y = Math.floor(Math.random() * PREVIEW_HEIGHT);
                            ctx.fillStyle = '#000000';
                            ctx.fillRect(x, y, 1, 1);
                        }
                        await new Promise(resolve => setTimeout(resolve, duration / steps));
                    }
                    break;
                case 'dissolve_chars':
                    const charWidth = 8;
                    const charHeight = 8;
                    const charsX = Math.floor(PREVIEW_WIDTH / charWidth);
                    const charsY = Math.floor(PREVIEW_HEIGHT / charHeight);
                    const totalChars = charsX * charsY;
                    const charsPerStep = Math.max(1, Math.floor(totalChars / steps));
                    const positions = Array.from({ length: totalChars }, (_, i) => i);
                    for (let i = positions.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [positions[i], positions[j]] = [positions[j], positions[i]];
                    }
                    for (let i = 0; i < steps && positions.length > 0; i++) {
                        for (let j = 0; j < charsPerStep && positions.length > 0; j++) {
                            const pos = positions.pop()!;
                            const cx = (pos % charsX) * charWidth;
                            const cy = Math.floor(pos / charsX) * charHeight;
                            ctx.fillStyle = '#000000';
                            ctx.fillRect(cx, cy, charWidth, charHeight);
                        }
                        await new Promise(resolve => setTimeout(resolve, duration / steps));
                    }
                    break;
                case 'vertical_lines':
                    for (let x = 0; x < PREVIEW_WIDTH; x += Math.max(1, Math.floor(PREVIEW_WIDTH / steps))) {
                        ctx.fillStyle = '#000000';
                        ctx.fillRect(x, 0, Math.max(1, Math.floor(PREVIEW_WIDTH / steps)), PREVIEW_HEIGHT);
                        await new Promise(resolve => setTimeout(resolve, duration / steps));
                    }
                    break;
                case 'horizontal_lines':
                    for (let y = 0; y < PREVIEW_HEIGHT; y += Math.max(1, Math.floor(PREVIEW_HEIGHT / steps))) {
                        ctx.fillStyle = '#000000';
                        ctx.fillRect(0, y, PREVIEW_WIDTH, Math.max(1, Math.floor(PREVIEW_HEIGHT / steps)));
                        await new Promise(resolve => setTimeout(resolve, duration / steps));
                    }
                    break;
                case 'spiral':
                    let left = 0, right = PREVIEW_WIDTH - 1, top = 0, bottom = PREVIEW_HEIGHT - 1;
                    const spiralStep = Math.max(1, Math.floor(Math.min(PREVIEW_WIDTH, PREVIEW_HEIGHT) / (steps * 2)));
                    while (left <= right && top <= bottom) {
                        ctx.fillStyle = '#000000';
                        ctx.fillRect(left, top, right - left + 1, spiralStep);
                        top += spiralStep;
                        if (left <= right && top <= bottom) {
                            ctx.fillRect(right - spiralStep + 1, top, spiralStep, bottom - top + 1);
                            right -= spiralStep;
                        }
                        if (left <= right && top <= bottom) {
                            ctx.fillRect(left, bottom - spiralStep + 1, right - left + 1, spiralStep);
                            bottom -= spiralStep;
                        }
                        if (left <= right && top <= bottom) {
                            ctx.fillRect(left, top, spiralStep, bottom - top + 1);
                            left += spiralStep;
                        }
                        await new Promise(resolve => setTimeout(resolve, duration / Math.ceil(steps / 4)));
                    }
                    break;
                case 'fill_white_squares':
                    const squareSize = 16;
                    const squaresX = Math.ceil(PREVIEW_WIDTH / squareSize);
                    const squaresY = Math.ceil(PREVIEW_HEIGHT / squareSize);
                    const totalSquares = squaresX * squaresY;
                    const squarePositions = Array.from({ length: totalSquares }, (_, i) => i);
                    for (let i = squarePositions.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [squarePositions[i], squarePositions[j]] = [squarePositions[j], squarePositions[i]];
                    }
                    const squaresPerStep = Math.max(1, Math.floor(totalSquares / steps));
                    for (let i = 0; i < steps && squarePositions.length > 0; i++) {
                        for (let j = 0; j < squaresPerStep && squarePositions.length > 0; j++) {
                            const pos = squarePositions.pop()!;
                            const sx = (pos % squaresX) * squareSize;
                            const sy = Math.floor(pos / squaresX) * squareSize;
                            ctx.fillStyle = '#FFFFFF';
                            ctx.fillRect(sx, sy, squareSize, squareSize);
                        }
                        await new Promise(resolve => setTimeout(resolve, duration / steps));
                    }
                    await new Promise(resolve => setTimeout(resolve, 200));
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
                    break;
            }
        };

        const renderTextNodes = async () => {
             if (currentNode.type !== 'Transition') {
                 let bgColor = '#000000';
                 if (currentNode.type === 'SubMenu') {
                     bgColor = (currentNode as GameFlowSubMenuNode).appearance?.colors?.background || '#000000';
                 } else if (currentNode.type === 'Text') {
                     bgColor = (currentNode as GameFlowTextNode).appearance?.colors?.background || '#000000';
                 }
                 ctx.fillStyle = bgColor;
                 ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
                 if (tileBufferRef.current) {
                     ctx.drawImage(tileBufferRef.current, 0, 0); // Dibujar buffer pre-renderizado
                 }
             }
            switch (currentNode.type) {
                case 'Start':
                    if (currentExecutingGameFlowName === 'Main') {
                        const startText = 'Build with Mideas';
                        const startDims = getTextDimensionsMSX1(startText, 1);
                        await drawTextAsync(startText, (PREVIEW_WIDTH - startDims.width) / 2, (PREVIEW_HEIGHT - startDims.height) / 2, msxFontColorAttributes);
                    }
                    setTimeout(() => {
                        const conn = connections.find(c => c.from.nodeId === currentNode.id);
                        if (conn) setCurrentNodeId(conn.to.nodeId);
                    }, 1000);
                    break;
                case 'SubMenu':
                    const subMenu = currentNode as GameFlowSubMenuNode;
                    const subMenuFontAsset = (subMenu.appearance as any)?.fontAssetId
                        ? allAssets.find(a => a.id === (subMenu.appearance as any).fontAssetId)
                        : null;
                    const subMenuFont = subMenuFontAsset ? (subMenuFontAsset.data as any)?.fontData as MSXFont | undefined : undefined;
                    const subMenuFontColorAttrs = subMenuFontAsset ? (subMenuFontAsset.data as any)?.fontColorAttributes as MSXFontColorAttributes | undefined : undefined;
                    const titleDims = getTextDimensionsMSX1(subMenu.title, 1);
                    await drawTextAsync(subMenu.title, (PREVIEW_WIDTH - titleDims.width) / 2, 40, msxFontColorAttributes, subMenuFont, subMenuFontColorAttrs);
                    const expandedOptions: Array<{text: string, originalIndex: number, isControlOption?: boolean}> = [];
                    subMenu.options.forEach((option, idx) => {
                        if (option.type === 'controls' && option.controlOptions && option.controlOptions.length > 0) {
                            option.controlOptions.forEach(ctrl => {
                                expandedOptions.push({text: ctrl, originalIndex: idx, isControlOption: true});
                            });
                        } else {
                            expandedOptions.push({text: option.text, originalIndex: idx});
                        }
                    });
                    for (const [displayIndex, expandedOption] of expandedOptions.entries()) {
                         const optionText = expandedOption.text;
                         const optionDims = getTextDimensionsMSX1(optionText, 1);
                         const isSelected = displayIndex === selectedOptionIndex;
                         let colorAttrs = subMenuFontColorAttrs || msxFontColorAttributes;
                         if (isSelected) {
                             const highlightedColorAttrs = JSON.parse(JSON.stringify(colorAttrs));
                             for(let i=0; i<optionText.length; i++){
                                 highlightedColorAttrs[optionText.charCodeAt(i)] = Array(8).fill({ fg: '#FFFF00', bg: '#000000' });
                             }
                             colorAttrs = highlightedColorAttrs;
                         }
                        await drawTextAsync(optionText, (PREVIEW_WIDTH - optionDims.width) / 2, 80 + displayIndex * 12, colorAttrs, subMenuFont, colorAttrs);
                    }
                    break;
                case 'Text':
                    const textNode = currentNode as GameFlowTextNode;
                    const textNodeFontAsset = textNode.appearance?.fontAssetId
                        ? allAssets.find(a => a.id === textNode.appearance.fontAssetId)
                        : null;
                    const textNodeFont = textNodeFontAsset ? (textNodeFontAsset.data as any)?.fontData as MSXFont | undefined : undefined;
                    const textNodeFontColorAttrs = textNodeFontAsset ? (textNodeFontAsset.data as any)?.fontColorAttributes as MSXFontColorAttributes | undefined : undefined;
                    const textNodeTitle = textNode.title;
                    const textNodeMessage = textNode.message || '';
                    const textNodeTitleDims = getTextDimensionsMSX1(textNodeTitle, 1);
                    await drawTextAsync(textNodeTitle, (PREVIEW_WIDTH - textNodeTitleDims.width) / 2, 30, msxFontColorAttributes, textNodeFont, textNodeFontColorAttrs);
                    const words = textNodeMessage.split(' ');
                    let lines: string[] = [];
                    let currentLine = '';
                    const maxLineWidth = PREVIEW_WIDTH - 20;
                    for (const word of words) {
                        const testLine = currentLine ? currentLine + ' ' + word : word;
                        const testDims = getTextDimensionsMSX1(testLine, 1);
                        if (testDims.width > maxLineWidth && currentLine) {
                            lines.push(currentLine);
                            currentLine = word;
                        } else {
                            currentLine = testLine;
                        }
                    }
                    if (currentLine) lines.push(currentLine);
                    const lineHeight = 10;
                    const startY = 60;
                    for (let i = 0; i < lines.length; i++) {
                        const lineDims = getTextDimensionsMSX1(lines[i], 1);
                        await drawTextAsync(lines[i], (PREVIEW_WIDTH - lineDims.width) / 2, startY + i * lineHeight, msxFontColorAttributes, textNodeFont, textNodeFontColorAttrs);
                    }
                    const promptText = 'PRESS FIRE TO CONTINUE';
                    const promptDims = getTextDimensionsMSX1(promptText, 1);
                    const baseColorAttrs = textNodeFontColorAttrs || msxFontColorAttributes;
                    const promptColorAttrs = JSON.parse(JSON.stringify(baseColorAttrs));
                    for(let i=0; i<promptText.length; i++){
                        promptColorAttrs[promptText.charCodeAt(i)] = Array(8).fill({
                            fg: textNode.appearance?.colors?.promptText || '#F3F3F3',
                            bg: textNode.appearance?.colors?.background || '#000000'
                        });
                    }
                    await drawTextAsync(promptText, (PREVIEW_WIDTH - promptDims.width) / 2, PREVIEW_HEIGHT - 30, promptColorAttrs, textNodeFont, promptColorAttrs);
                    break;
                case 'End':
                    if (gameFlowStack.length > 0) {
                        const { parentGraphData, returnNodeId, parentGameFlowName } = gameFlowStack[gameFlowStack.length - 1];
                        setGameFlowStack(prev => prev.slice(0, -1));
                        const restoredGraphData = gameFlowStack.length > 1
                            ? gameFlowStack[gameFlowStack.length - 2].parentGraphData
                            : graphData;
                        if (gameFlowStack.length > 1) {
                            setCurrentNestedGraphData(gameFlowStack[gameFlowStack.length - 2].parentGraphData);
                        } else {
                            setCurrentNestedGraphData(null);
                        }
                        setCurrentExecutingGameFlowName(parentGameFlowName);
                        let finalNodeId = returnNodeId;
                        let finalNode = restoredGraphData.nodes.find(n => n.id === finalNodeId);
                        while (finalNode && finalNode.type === 'Waypoint') {
                            const nextConn = restoredGraphData.connections.find(c => c.from.nodeId === finalNodeId);
                            if (nextConn) {
                                finalNodeId = nextConn.to.nodeId;
                                finalNode = restoredGraphData.nodes.find(n => n.id === finalNodeId);
                            } else {
                                break;
                            }
                        }
                        setCurrentNodeId(finalNodeId);
                        setNavigationStack([]);
                        setSelectedOptionIndex(0);
                    }
                    break;
                case 'Restart':
                    const restartNode = currentNode as any;
                    const restartTitle = restartNode.title || 'Restart';
                    const restartMessage = restartNode.message || 'Press Fire to restart';
                    const restartTitleDims = getTextDimensionsMSX1(restartTitle, 1);
                    await drawTextAsync(restartTitle, (PREVIEW_WIDTH - restartTitleDims.width) / 2, 60, msxFontColorAttributes);
                    const restartMsgDims = getTextDimensionsMSX1(restartMessage, 1);
                    await drawTextAsync(restartMessage, (PREVIEW_WIDTH - restartMsgDims.width) / 2, 90, msxFontColorAttributes);
                    const restartPrompt = 'Press Fire to restart';
                    const restartPromptDims = getTextDimensionsMSX1(restartPrompt, 1);
                    await drawTextAsync(restartPrompt, (PREVIEW_WIDTH - restartPromptDims.width) / 2, PREVIEW_HEIGHT - 30, msxFontColorAttributes);
                    break;
                case 'Transition':
                    const transitionNode = currentNode as any;
                    const effect = transitionNode.effect || 'cls';
                    const duration = transitionNode.duration || 1000;
                    await applyTransitionEffect(effect, duration);
                    const transitionConn = connections.find(c => c.from.nodeId === currentNode.id);
                    if (transitionConn) {
                        let targetNodeId = transitionConn.to.nodeId;
                        let targetNode = nodes.find(n => n.id === targetNodeId);
                        while (targetNode && targetNode.type === 'Waypoint') {
                            const nextConn = connections.find(c => c.from.nodeId === targetNodeId);
                            if (nextConn) {
                                targetNodeId = nextConn.to.nodeId;
                                targetNode = nodes.find(n => n.id === targetNodeId);
                            } else {
                                break;
                            }
                        }
                        setCurrentNodeId(targetNodeId);
                    }
                    break;
                case 'Group':
                    const groupNode = currentNode as any;
                    const groupGameFlowAsset = allAssets.find(a => a.id === groupNode.gameFlowAssetId && a.type === 'gameflow');
                    if (!groupNode.gameFlowAssetId || !groupGameFlowAsset) {
                        const groupTitle = groupNode.name || 'Group';
                        const groupTitleDims = getTextDimensionsMSX1(groupTitle, 1);
                        await drawTextAsync(groupTitle, (PREVIEW_WIDTH - groupTitleDims.width) / 2, 60, msxFontColorAttributes);
                        const noFlowText = groupNode.gameFlowAssetId ? 'GameFlow not found' : 'No GameFlow assigned';
                        const noFlowDims = getTextDimensionsMSX1(noFlowText, 1);
                        await drawTextAsync(noFlowText, (PREVIEW_WIDTH - noFlowDims.width) / 2, 90, msxFontColorAttributes);
                    } else {
                        const nestedGraphData = groupGameFlowAsset.data as GameFlowGraph;
                        const exitConnection = connections.find(c => c.from.nodeId === currentNode.id);
                        const returnNodeId = exitConnection ? exitConnection.to.nodeId : currentNode.id;
                        setGameFlowStack(prev => [...prev, {
                            parentGraphData: currentGraphData,
                            returnNodeId,
                            parentGameFlowName: currentExecutingGameFlowName
                        }]);
                        setCurrentNestedGraphData(nestedGraphData);
                        setCurrentExecutingGameFlowName(groupGameFlowAsset.name);
                        const nestedStartNode = nestedGraphData.nodes.find(n => n.type === 'Start');
                        if (nestedStartNode) {
                            setCurrentNodeId(nestedStartNode.id);
                            setNavigationStack([]);
                            setSelectedOptionIndex(0);
                        }
                    }
                    break;
            }
        };

       

        const handleTilemapCollision = (entity: AnimatedEntity, screenMap: ScreenMap, tileset: Tile[], collisionCompDef: ComponentDefinition) => {
        if (!screenMap || !tileset || !collisionCompDef) return;
        const entityCollisionProps = {
            ...collisionCompDef.properties.reduce((acc, prop) => { acc[prop.name] = prop.defaultValue; return acc; }, {}),
            ...(entity.template.components.find(c => c.definitionId === 'comp_collision')?.defaultValues || {}),
            ...(entity.instance.componentOverrides?.['comp_collision'] || {})
        };
        const getHitboxFor = (x: number, y: number) => ({
            x: x + (entityCollisionProps.offsetX || 0),
            y: y + (entityCollisionProps.offsetY || 0),
            width: entityCollisionProps.hitboxWidth || entity.sprite.size.width,
            height: entityCollisionProps.hitboxHeight || entity.sprite.size.height,
        });
        let tentativeX = entity.x + entity.vx;
        let tentativeY = entity.y + entity.vy;
        let tentativeHitbox = getHitboxFor(tentativeX, tentativeY);

        // --- Colisión en X: usar puntos verticales centrados (evita esquinas inferiores/superiores) ---
        if (entity.vx !== 0) {
            let collisionX = false;
            const centerY1 = tentativeHitbox.y + Math.floor(tentativeHitbox.height / 3);
            const centerY2 = tentativeHitbox.y + Math.floor((2 * tentativeHitbox.height) / 3);

            if (entity.vx > 0) { // Derecha
            if (checkCollisionAt(tentativeHitbox.x + tentativeHitbox.width, centerY1, screenMap) ||
                checkCollisionAt(tentativeHitbox.x + tentativeHitbox.width, centerY2, screenMap)) {
                collisionX = true;
                const tileLeftEdge = Math.floor((tentativeHitbox.x + tentativeHitbox.width) / TILE_SIZE) * TILE_SIZE;
                tentativeX = tileLeftEdge - (entityCollisionProps.offsetX || 0) - tentativeHitbox.width;
                entity.vx = 0;
            }
            } else if (entity.vx < 0) { // Izquierda
            if (checkCollisionAt(tentativeHitbox.x, centerY1, screenMap) ||
                checkCollisionAt(tentativeHitbox.x, centerY2, screenMap)) {
                collisionX = true;
                const tileRightEdge = Math.ceil(tentativeHitbox.x / TILE_SIZE) * TILE_SIZE;
                tentativeX = tileRightEdge - (entityCollisionProps.offsetX || 0);
                entity.vx = 0;
            }
            }
            if (collisionX) {
            tentativeHitbox = getHitboxFor(tentativeX, tentativeY);
            }
        }

        // --- Colisión en Y: usar puntos horizontales centrados ---
        if (entity.vy !== 0) {
            let collisionY = false;
            const centerX1 = tentativeHitbox.x + Math.floor(tentativeHitbox.width / 3);
            const centerX2 = tentativeHitbox.x + Math.floor((2 * tentativeHitbox.width) / 3);

            if (entity.vy > 0) { // Cayendo
            if (checkCollisionAt(centerX1, tentativeHitbox.y + tentativeHitbox.height, screenMap) ||
                checkCollisionAt(centerX2, tentativeHitbox.y + tentativeHitbox.height, screenMap)) {
                collisionY = true;
                const tileTopEdge = Math.floor((tentativeHitbox.y + tentativeHitbox.height) / TILE_SIZE) * TILE_SIZE;
                tentativeY = tileTopEdge - (entityCollisionProps.offsetY || 0) - tentativeHitbox.height;
                entity.vy = 0;
            }
            } else if (entity.vy < 0) { // Saltando (hacia arriba)
            if (checkCollisionAt(centerX1, tentativeHitbox.y, screenMap) ||
                checkCollisionAt(centerX2, tentativeHitbox.y, screenMap)) {
                collisionY = true;
                console.log('Collision Y detected (upwards)');
                const tileRow = Math.floor(tentativeHitbox.y / TILE_SIZE);
                const tileBottomEdge = (tileRow + 1) * TILE_SIZE;
                tentativeY = tileBottomEdge - (entityCollisionProps.offsetY || 0);
                entity.vy = 0; // Detener velocidad Y (golpeÃ³ techo)

          
            }
            }
            if (collisionY) {
            // No es estrictamente necesario, pero mantiene consistencia
            // tentativeHitbox = getHitboxFor(tentativeX, tentativeY);
            }
        }

        // Aplicar posición final
        entity.x = tentativeX;
        entity.y = tentativeY;

        // Verificar si el player está tocando un tile peligroso (causesDamage)
        const finalHitbox = getHitboxFor(entity.x, entity.y);
        const centerX = finalHitbox.x + Math.floor(finalHitbox.width / 2);
        const centerY = finalHitbox.y + Math.floor(finalHitbox.height / 2);
        const bottomY = finalHitbox.y + finalHitbox.height;

        // Verificar varios puntos del hitbox para mejor detección
        const isDangerous =
            checkDangerousTileAt(centerX, centerY, screenMap) ||  // Centro
            checkDangerousTileAt(finalHitbox.x, centerY, screenMap) ||  // Izquierda
            checkDangerousTileAt(finalHitbox.x + finalHitbox.width, centerY, screenMap) ||  // Derecha
            checkDangerousTileAt(centerX, bottomY, screenMap);  // Abajo (pies)

        // Actualizar flag para state machine
        entity.hasDangerousTileCollision = isDangerous;

        // NOTA: El daño/muerte no se aplica automáticamente aquí
        // El state machine puede detectar HAS_DEADLY_TILE_COLLISION y decidir qué hacer
        // (Ej: transición a estado "Taking Damage" o "Dead" con animación)
        };

        const entityCollisionProps = (entity: AnimatedEntity) => {
             const collisionCompDef = componentDefinitions.find(c => c.id === 'comp_collision');
             if (!collisionCompDef) {
                 console.error('[COLLISION PROPS ERROR] comp_collision definition not found');
                 return null;
             }

             const templateCollisionComp = entity.template.components.find(c => c.definitionId === 'comp_collision');
             const templateValues = templateCollisionComp?.defaultValues || {};
             const instanceValues = entity.instance.componentOverrides?.['comp_collision'] || {};

             // Prioridad: instanceValues > templateValues > sprite.hitbox > defaults > sprite.size
             const spriteHitbox = entity.sprite.hitbox;
             const defaults = collisionCompDef.properties.reduce((acc, prop) => { acc[prop.name] = prop.defaultValue; return acc; }, {} as Record<string, any>);

             // Función helper para obtener valor con prioridad correcta
             const getPriorityValue = (propName: string, spriteFallback?: number) => {
                 // 1. Instance override (más alta prioridad)
                 if (instanceValues[propName] !== undefined && instanceValues[propName] !== '') {
                     return Number(instanceValues[propName]);
                 }
                 // 2. Template value
                 if (templateValues[propName] !== undefined && templateValues[propName] !== '') {
                     return Number(templateValues[propName]);
                 }
                 // 3. Sprite hitbox (si está disponible)
                 if (spriteFallback !== undefined) {
                     return spriteFallback;
                 }
                 // 4. Component default
                 if (defaults[propName] !== undefined && defaults[propName] !== '') {
                     return Number(defaults[propName]);
                 }
                 // 5. Fallback final
                 return 0;
             };

             const hitboxWidth = getPriorityValue('hitboxWidth', spriteHitbox?.width ?? entity.sprite.size.width);
             const hitboxHeight = getPriorityValue('hitboxHeight', spriteHitbox?.height ?? entity.sprite.size.height);
             const offsetX = getPriorityValue('offsetX', spriteHitbox?.offsetX ?? 0);
             const offsetY = getPriorityValue('offsetY', spriteHitbox?.offsetY ?? 0);

             // Para otras propiedades sin sprite fallback: instance > template > defaults
             const getValueNoSpriteFallback = (propName: string, defaultFallback: any) => {
                 if (instanceValues[propName] !== undefined && instanceValues[propName] !== '') return instanceValues[propName];
                 if (templateValues[propName] !== undefined && templateValues[propName] !== '') return templateValues[propName];
                 if (defaults[propName] !== undefined && defaults[propName] !== '') return defaults[propName];
                 return defaultFallback;
             };

             const collisionLayer = Number(getValueNoSpriteFallback('collisionLayer', 1)) || 1;
             const collidesWith = Number(getValueNoSpriteFallback('collidesWith', 255)) || 255;
             const isStatic = getValueNoSpriteFallback('isStatic', false) === true || getValueNoSpriteFallback('isStatic', false) === 'true';
             const isTrigger = getValueNoSpriteFallback('isTrigger', false) === true || getValueNoSpriteFallback('isTrigger', false) === 'true';

            const result = {
                hitboxWidth,
                hitboxHeight,
                offsetX,
                offsetY,
                collisionLayer,
                collidesWith,
                isStatic,
                isTrigger
            };

            console.log(`[FINAL HITBOX] ${entity.instance.name}:`, result);
            return result;
        };

        const getHitboxFor = (entity: AnimatedEntity, props: any) => ({
            x: entity.x + (props.offsetX || 0), y: entity.y + (props.offsetY || 0),
            width: props.hitboxWidth || entity.sprite.size.width, height: props.hitboxHeight || entity.sprite.size.height,
        });

        const getHitboxForPosition = (entity: AnimatedEntity, x: number, y: number, props: any) => ({
            x: x + (props.offsetX || 0), y: y + (props.offsetY || 0),
            width: props.hitboxWidth || entity.sprite.size.width, height: props.hitboxHeight || entity.sprite.size.height,
        });

        // --- Entity Collision Resolution (Physical Response) ---
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

            // DEBUG: Log collision details for platform detection
            const isPlatformInvolved = (propsA.collisionLayer & 8) !== 0 || (propsB.collisionLayer & 8) !== 0;
            if (isPlatformInvolved) {
                console.log(`[COLLISION RESOLVE] ${entityA.instance.name} vs ${entityB.instance.name}: overlapX=${overlapX.toFixed(2)}, overlapY=${overlapY.toFixed(2)}, axis=${overlapX < overlapY ? 'X' : 'Y'}`);
            }

            // Detect platform riding BEFORE axis separation (works regardless of separation axis)
            // Check if A is standing on top of B (platform detection based on relative positions)
            const isAAboveB = (hitboxA.y + hitboxA.height / 2) < (hitboxB.y + hitboxB.height / 2);
            const isBAboveA = (hitboxB.y + hitboxB.height / 2) < (hitboxA.y + hitboxA.height / 2);

            // DEBUG: Log platform detection conditions
            if (isPlatformInvolved) {
                console.log(`[PLATFORM CHECK] isAAboveB=${isAAboveB}, isBAboveA=${isBAboveA}, A.vy=${entityA.vy}, B.vy=${entityB.vy}`);
                console.log(`[PLATFORM CHECK] A.layer=${propsA.collisionLayer}, B.layer=${propsB.collisionLayer}, B.isLayer8=${(propsB.collisionLayer & 8) !== 0}`);
                console.log(`[PLATFORM CHECK] About to check if condition: isAAboveB(${isAAboveB}) && A.vy(${entityA.vy}) >= 0 = ${isAAboveB && entityA.vy >= 0}`);
            }

            if (isAAboveB && entityA.vy >= 0) {
                console.log(`[PLATFORM CHECK] INSIDE IF: Checking isPlatformLayer...`);

                // A is above B and falling/stationary - check if B is a platform
                const isPlatformLayer = (propsB.collisionLayer & 8) !== 0;
                if (isPlatformLayer) {
                    entityA.platformUnderneath = entityB;
                    console.log(`[PLATFORM] ${entityA.instance.name} is on platform ${entityB.instance.name} (layer8: true, vx: ${entityB.vx}, vy: ${entityB.vy})`);
                } else {
                    console.log(`[PLATFORM] A is above B but B is not layer 8 (layer=${propsB.collisionLayer})`);
                }
            } else if (isAAboveB) {
                console.log(`[PLATFORM] A is above B but A.vy < 0 (A.vy=${entityA.vy})`);
            }

            if (isBAboveA && entityB.vy >= 0) {
                // B is above A and falling/stationary - check if A is a platform
                const isPlatformLayer = (propsA.collisionLayer & 8) !== 0;
                if (isPlatformLayer) {
                    entityB.platformUnderneath = entityA;
                    console.log(`[PLATFORM] ${entityB.instance.name} is on platform ${entityA.instance.name} (layer8: true, vx: ${entityA.vx}, vy: ${entityA.vy})`);
                }
            }

            // Find minimum translation vector (MTV) - separate on axis with less overlap
            if (overlapX < overlapY) {
                // Separate on X axis
                const direction = (hitboxA.x + hitboxA.width / 2) < (hitboxB.x + hitboxB.width / 2) ? -1 : 1;
                const separation = overlapX * direction;

                if (isAStatic) {
                    // Only B moves
                    entityB.x -= separation;
                    entityB.vx = 0;
                } else if (isBStatic) {
                    // Only A moves
                    entityA.x += separation;
                    entityA.vx = 0;
                } else {
                    // Both move (split separation)
                    const halfSep = separation / 2;
                    entityA.x += halfSep;
                    entityB.x -= halfSep;

                    // Exchange velocities (simple elastic collision)
                    const tempVx = entityA.vx;
                    entityA.vx = entityB.vx;
                    entityB.vx = tempVx;
                }
            } else {
                // Separate on Y axis
                const direction = (hitboxA.y + hitboxA.height / 2) < (hitboxB.y + hitboxB.height / 2) ? -1 : 1;
                const separation = overlapY * direction;

                if (isAStatic) {
                    // Only B moves
                    entityB.y -= separation;
                    entityB.vy = 0;
                } else if (isBStatic) {
                    // Only A moves
                    entityA.y += separation;
                    entityA.vy = 0;
                } else {
                    // Both move (split separation)
                    const halfSep = separation / 2;
                    entityA.y += halfSep;
                    entityB.y -= halfSep;

                    // Exchange velocities (simple elastic collision)
                    const tempVy = entityA.vy;
                    entityA.vy = entityB.vy;
                    entityB.vy = tempVy;
                }
            }
        };

        // --- Nueva Función de Animación ---
        let lastTime = 0;
        const animate = (currentTime: number) => {
            // --- Calcular deltaTime (opcional) ---
            // const deltaTime = currentTime - lastTime;
            // lastTime = currentTime;
            // --- Fin deltaTime ---

            // Regenerar buffer si es necesario (tiles modificados por BREAK_TILE/REPLACE_TILE)
            if (tileBufferNeedsUpdate.current && screenMapToRender) {
                const layerToUse = runtimeCollisionLayerRef.current.length > 0 ? runtimeCollisionLayerRef.current : undefined;
                tileBufferRef.current = renderTileMapToBuffer(screenMapToRender, tileset, currentScreenMode, layerToUse);
                tileBufferNeedsUpdate.current = false;
                console.log('[TILE BUFFER] Regenerated due to tile modification');
            }

            // Limpiar solo el área principal
            ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);

            // Dibujar el fondo pre-renderizado (tiles)
            if (tileBufferRef.current) {
                ctx.drawImage(tileBufferRef.current, 0, 0);
            } else {
                // Si no hay buffer (por ejemplo, en nodos de texto), limpiar y dibujar fondo
                ctx.fillStyle = '#000000'; // Color por defecto
                if (subMenuNode?.appearance?.colors?.background) {
                     ctx.fillStyle = subMenuNode.appearance.colors.background;
                } else if (currentNode.type === 'Text') {
                     const textNode = currentNode as GameFlowTextNode;
                     ctx.fillStyle = textNode.appearance?.colors?.background || '#000000';
                }
                ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
            }

            const now = performance.now();

            // Debug: Log entities with collision component (only once per second to avoid spam)
            if (now % 1000 < 16) { // Aproximadamente cada segundo
                console.log(`[COLLISION DEBUG] Total entities in scene: ${entitiesRef.current.length}`);
                entitiesRef.current.forEach((e, idx) => {
                    const hasComp = e.template.components.some(c => c.definitionId === 'comp_collision');
                    const props = entityCollisionProps(e);
                    console.log(`  [${idx}] ${e.instance.name}:`);
                    console.log(`      Template: ${e.template.name} (id: ${e.template.id})`);
                    console.log(`      Has comp_collision: ${hasComp}`);
                    console.log(`      Components: ${e.template.components.map(c => c.definitionId).join(', ')}`);
                    if (hasComp && props) {
                        console.log(`      Props: layer=${props.collisionLayer}, collidesWith=${props.collidesWith}, hitbox=${props.hitboxWidth}x${props.hitboxHeight}`);
                    } else if (hasComp && !props) {
                        console.log(`      ⚠️ WARNING: Has component but props are NULL!`);
                    }
                });
            }

            entitiesRef.current.forEach((entityA, indexA) => {
                // --- 0. Compute isOnGround based on current position ---
                const hasCollisionComp = entityA.template.components.some(c => c.definitionId === 'comp_collision');
                const collisionCompDef = componentDefinitions.find(c => c.id === 'comp_collision');
                if (hasCollisionComp && collisionCompDef && screenMapToRender) {
                    const props = entityCollisionProps(entityA);
                    if (props) {
                        const hitbox = getHitboxForPosition(entityA, entityA.x, entityA.y + 1, props); // Check 1px below
                        const centerX1 = hitbox.x + Math.floor(hitbox.width / 3);
                        const centerX2 = hitbox.x + Math.floor((2 * hitbox.width) / 3);
                        const bottomY = hitbox.y + hitbox.height;

                        // Check tiles OR platform from PREVIOUS frame (before it gets cleared)
                        const onTiles = checkCollisionAt(centerX1, bottomY, screenMapToRender) ||
                                       checkCollisionAt(centerX2, bottomY, screenMapToRender);
                        const onPlatformPreviousFrame = entityA.platformUnderneath !== null &&
                                                       entityA.platformUnderneath !== undefined &&
                                                       entitiesRef.current.includes(entityA.platformUnderneath);

                        entityA.isOnGround = onTiles || onPlatformPreviousFrame;
                    } else {
                        entityA.isOnGround = false;
                    }
                } else {
                    entityA.isOnGround = false;
                }

                // --- 0.5. Procesar eventos de colisión (State Machine transitions) ---
                processEventTransitions(entityA);

                // --- 1. Actualizar Velocidad ---
                if (entityA === heroRef.current) {
                    // Apply state machine velocity properties if present
                    if (entityA.stateMachine && entityA.currentState) {
                        const stateDef = entityA.stateMachine.states.find(s => s.name === entityA.currentState);
                        if (stateDef?.properties) {
                            if (stateDef.properties.velocityX !== undefined) entityA.vx = stateDef.properties.velocityX;
                            if (stateDef.properties.velocityY !== undefined) entityA.vy = stateDef.properties.velocityY;
                        }
                    }

                    // Check if current state allows input
                    const statesWithoutInput = ['Dead', 'GameOver', 'Stunned', 'Frozen']; // States that disable controls
                    const canProcessInput = !entityA.currentState || !statesWithoutInput.includes(entityA.currentState);

                    // Process input (cursors and jump) - Only if state allows it
                    if (canProcessInput) {
                        const hasGravity = entityA.template.components.some(c => c.definitionId === 'comp_gravity');
                        const cursorsComp = entityA.template.components.find(c => c.definitionId === 'comp_cursors');
                        
                        // Horizontal Movement
                        if (cursorsComp) {
                            const cursorsProps = {
                                ...cursorsComp.defaultValues,
                                ...(entityA.instance.componentOverrides?.['comp_cursors'] || {})
                            };
                            const speed = Number(cursorsProps.speed) || 2;
                            const allowLeft = cursorsProps.allowLeft !== false;
                            const allowRight = cursorsProps.allowRight !== false;
                            const leftPressed = pressedKeys.current.has('ArrowLeft');
                            const rightPressed = pressedKeys.current.has('ArrowRight');

                            if (leftPressed && allowLeft) {
                                entityA.vx = -speed;
                            } else if (rightPressed && allowRight) {
                                entityA.vx = speed;
                            } else {
                                entityA.vx = 0;
                            }
                        }

                        // Vertical Movement (only for non-gravity entities)
                        if (!hasGravity && cursorsComp) {
                            const cursorsProps = {
                                ...cursorsComp.defaultValues,
                                ...(entityA.instance.componentOverrides?.['comp_cursors'] || {})
                            };
                            const speed = Number(cursorsProps.speed) || 2;
                            const allowUp = cursorsProps.allowUp !== false;
                            const allowDown = cursorsProps.allowDown !== false;
                            const upPressed = pressedKeys.current.has('ArrowUp');
                            const downPressed = pressedKeys.current.has('ArrowDown');

                            if (upPressed && allowUp) {
                                entityA.vy = -speed;
                            } else if (downPressed && allowDown) {
                                entityA.vy = speed;
                            } else {
                                entityA.vy = 0;
                            }
                        }

                        // Jump (only for gravity entities)
                        const jumpComp = entityA.template.components.find(c => c.definitionId === 'comp_jump');
                        if (jumpComp) {
                            const jumpProps = { ...jumpComp.defaultValues, ...(entityA.instance.componentOverrides?.['comp_jump'] || {}) };
                            const requireKeyRelease = jumpProps.requireKeyRelease !== 'false' && jumpProps.requireKeyRelease !== false;
                            const spacePressed = pressedKeys.current.has(' ');

                            if (hasGravity && entityA.isOnGround && spacePressed) {
                                // Check if we can jump based on requireKeyRelease setting
                                const canJump = !requireKeyRelease || !jumpKeyProcessed.current;

                                if (canJump) {
                                    const jumpPower = Number(jumpProps.jumpPower || 256);
                                    entityA.vy = -jumpPower / 40;
                                    jumpKeyProcessed.current = true;
                                }
                            }

                            // Reset jump key processed when not pressing space and on ground
                            if (!spacePressed && entityA.isOnGround) {
                                jumpKeyProcessed.current = false;
                            }
                        }
                    } // End of canProcessInput check
                }

                // Check if physics should be disabled (same states as input)
                const statesWithoutPhysics = ['Dead', 'GameOver', 'Stunned', 'Frozen'];
                const canProcessPhysics = !entityA.currentState || !statesWithoutPhysics.includes(entityA.currentState);

                if (canProcessPhysics) {
                    // --- Gravity ---
                    const gravityComp = entityA.template.components.find(c => c.definitionId === 'comp_gravity');
                    if (gravityComp) {
                      const gravityProps = { ...gravityComp.defaultValues, ...(entityA.instance.componentOverrides?.['comp_gravity'] || {}) };
                      const strength = Number(gravityProps.strength || 0) / 60;
                      const terminalVelocity = Number(gravityProps.terminalVelocity || 2);
                      entityA.vy += strength;
                      if (entityA.vy > terminalVelocity) entityA.vy = terminalVelocity;
                    }

                    // --- 2. Resolver Colisión y Aplicar Nueva Posición ---
                    if (hasCollisionComp && collisionCompDef && screenMapToRender) {
                      handleTilemapCollision(entityA, screenMapToRender, tileset, collisionCompDef);
                    } else {
                      entityA.x += entityA.vx;
                      entityA.y += entityA.vy;
                    }
                } else {
                    // Physics disabled - freeze entity in place
                    entityA.vx = 0;
                    entityA.vy = 0;
                }

                // --- 3. Lógica de Transición de Pantalla (Solo para el Héroe) ---
                if (entityA === heroRef.current && currentWorldMapGraph && currentScreenMap && canProcessPhysics) {
                    // Estados que desactivan la detección de salida por bordes (evitan transiciones no deseadas tras respawn/muerte)
                    const statesThatDisableScreenExit = ['Dead', 'Death', 'Respawn', 'Spawning', 'Hurt', 'Hit', 'GameOver', 'Invulnerable'];
                    const isExitingDisabled = entityA.currentState && statesThatDisableScreenExit.some(state =>
                        entityA.currentState?.toLowerCase().includes(state.toLowerCase())
                    );

                    if (!isExitingDisabled) {
                        const spriteWidth = entityA.sprite.size.width;
                        const spriteHeight = entityA.sprite.size.height;
                        let exitDirection: 'north' | 'south' | 'east' | 'west' | null = null;

                        if (entityA.x + spriteWidth / 2 < 0 && entityA.vx < 0) exitDirection = 'west';
                        else if (entityA.x + spriteWidth / 2 > PREVIEW_WIDTH && entityA.vx > 0) exitDirection = 'east';
                        else if (entityA.y + spriteHeight / 2 < 0 && entityA.vy < 0) exitDirection = 'north';
                        else if (entityA.y + spriteHeight / 2 > PREVIEW_HEIGHT && entityA.vy > 0) exitDirection = 'south';

                        if (exitDirection) {
                            console.log(`[Exit Detected] Direction: ${exitDirection}`);
                            const currentScreenNode = currentWorldMapGraph.nodes.find(n => n.screenAssetId === currentScreenMap.id);
                            if (currentScreenNode) {
                                let connection = currentWorldMapGraph.connections.find(c => c.fromNodeId === currentScreenNode.id && c.fromDirection === exitDirection);
                                let targetNodeId = connection?.toNodeId;
                                if (!connection) {
                                    connection = currentWorldMapGraph.connections.find(c => c.toNodeId === currentScreenNode.id && c.toDirection === exitDirection);
                                    targetNodeId = connection?.fromNodeId;
                                }
                                if (targetNodeId) {
                                    let newPlayerPos = { x: entityA.x, y: entityA.y };
                                    console.log(`[Border Crossing] Current player position: (${entityA.x}, ${entityA.y}), exit direction: ${exitDirection}`);
                                    switch (exitDirection) {
                                        case 'east': newPlayerPos.x = 0; break;
                                        case 'west': newPlayerPos.x = PREVIEW_WIDTH - spriteWidth; break;
                                        case 'south': newPlayerPos.y = 0; break;
                                        case 'north': newPlayerPos.y = PREVIEW_HEIGHT - spriteHeight; break;
                                    }
                                    console.log(`[Border Crossing] New entry point calculated: (${newPlayerPos.x}, ${newPlayerPos.y})`);
                                    setPlayerEntryPoint(newPlayerPos);
                                    handleScreenTransition(targetNodeId);
                                    return; // Detener el procesamiento de este frame para permitir la transición
                                }
                            }
                        }
                    }
                }

                // --- 4. Límites para Entidades No Héroe ---
                if (entityA !== heroRef.current) {
                  const spriteWidth = entityA.sprite.size.width;
                  const spriteHeight = entityA.sprite.size.height;
                  if (entityA.x < 0) {
                    entityA.x = 0;
                    if (entityA.vx < 0) entityA.vx = 0;
                  } else if (entityA.x + spriteWidth > PREVIEW_WIDTH) {
                    entityA.x = PREVIEW_WIDTH - spriteWidth;
                    if (entityA.vx > 0) entityA.vx = 0;
                  }
                  if (entityA.y < 0) {
                    entityA.y = 0;
                    if (entityA.vy < 0) entityA.vy = 0;
                  } else if (entityA.y + spriteHeight > PREVIEW_HEIGHT) {
                    entityA.y = PREVIEW_HEIGHT - spriteHeight;
                    if (entityA.vy > 0) entityA.vy = 0;
                  }
                }

                // --- 5. Lógica de Colisión entre Entidades ---
                // Store previous platform to detect when we fall off (declare outside if block)
                let previousPlatform: AnimatedEntity | null = null;

                if (hasCollisionComp) {
                    // Clear platform reference at start of frame - will be re-established if still colliding
                    if (entityA.platformUnderneath && !entitiesRef.current.includes(entityA.platformUnderneath)) {
                        console.log(`[PLATFORM] Platform no longer exists for ${entityA.instance.name}`);
                        entityA.platformUnderneath = null;
                    }
                    // Store previous platform to detect when we fall off
                    previousPlatform = entityA.platformUnderneath;
                    entityA.platformUnderneath = null; // Clear and will be reset during collision if still on platform

                    // Debug log para ver si entra al loop
                    if (indexA === 0 && now % 1000 < 16) {
                        console.log(`[COLLISION DEBUG] Checking collisions for ${entityA.instance.name}, total entities: ${entitiesRef.current.length}`);
                    }

                    for (let indexB = indexA + 1; indexB < entitiesRef.current.length; indexB++) {
                        const entityB = entitiesRef.current[indexB];
                        const entityBHasCollision = entityB.template.components.some(c => c.definitionId === 'comp_collision');

                        if (indexA === 0 && now % 1000 < 16) {
                            console.log(`  Checking entity B: ${entityB.instance.name}, hasCollision: ${entityBHasCollision}`);
                        }

                        if (!entityBHasCollision) continue;
                        const propsA = entityCollisionProps(entityA);
                        const propsB = entityCollisionProps(entityB);
                        if (!propsA || !propsB) continue;
                        const hitboxA = getHitboxFor(entityA, propsA);
                        const hitboxB = getHitboxFor(entityB, propsB);

                        // Check AABB collision
                        if (hitboxA.x < hitboxB.x + hitboxB.width &&
                            hitboxA.x + hitboxA.width > hitboxB.x &&
                            hitboxA.y < hitboxB.y + hitboxB.height &&
                            hitboxA.y + hitboxA.height > hitboxB.y) {

                            const layerA = Number(propsA.collisionLayer) || 0;
                            const collidesWithA = Number(propsA.collidesWith) || 0;
                            const layerB = Number(propsB.collisionLayer) || 0;
                            const collidesWithB = Number(propsB.collidesWith) || 0;

                            // PROTECTION: Ignore collisions in the first 200ms after spawn
                            const SPAWN_GRACE_PERIOD_MS = 200;
                            const entityAAge = now - entityA.spawnTime;
                            const entityBAge = now - entityB.spawnTime;

                            if (entityAAge < SPAWN_GRACE_PERIOD_MS || entityBAge < SPAWN_GRACE_PERIOD_MS) {
                                console.log(`[COLLISION] Ignoring spawn collision between ${entityA.instance.name} (age: ${entityAAge}ms) and ${entityB.instance.name} (age: ${entityBAge}ms)`);
                                continue; // Skip this collision pair
                            }

                            console.log('[COLLISION DEBUG] AABB overlap detected!');
                            console.log(`  Entity A: ${entityA.instance.name} (layer=${layerA}, collidesWith=${collidesWithA})`);
                            console.log(`  Entity B: ${entityB.instance.name} (layer=${layerB}, collidesWith=${collidesWithB})`);
                            console.log(`  HitboxA:`, hitboxA);
                            console.log(`  HitboxB:`, hitboxB);

                            // Check if layers allow collision
                            const aCanCollideWithB = (collidesWithA & layerB) !== 0;
                            const bCanCollideWithA = (collidesWithB & layerA) !== 0;

                            console.log(`  Layer check: A can hit B = ${aCanCollideWithB}, B can hit A = ${bCanCollideWithA}`);

                            if (aCanCollideWithB && bCanCollideWithA) {
                                // Check if either entity is a trigger
                                const isATrigger = propsA.isTrigger;
                                const isBTrigger = propsB.isTrigger;

                                if (isATrigger || isBTrigger) {
                                    // TRIGGER COLLISION: No physical separation, only event detection
                                    console.log(`  🎯 TRIGGER COLLISION: ${isATrigger ? entityA.instance.name : ''}${isATrigger && isBTrigger ? ' & ' : ''}${isBTrigger ? entityB.instance.name : ''} (no pushback)`);

                                    // Helper function: Determine collision event type based on entity layer and components
                                    const getCollisionEventType = (entity: typeof entityA | typeof entityB, entityLayer: number): string => {
                                        // Check if entity has comp_collectible
                                        const hasCollectible = entity.template.components.some(c => c.definitionId === 'comp_collectible');
                                        if (hasCollectible) return 'collision_item';

                                        // Check layer 8 (bit 3) for platforms/walls - MUST check before enemy detection
                                        if ((entityLayer & 8) !== 0) return 'collision_wall';

                                        // Check if entity has comp_damage or comp_ai_behavior (enemy)
                                        const hasAI = entity.template.components.some(c => c.definitionId === 'comp_ai_behavior');
                                        const hasDamage = entity.template.components.some(c => c.definitionId === 'comp_damage');
                                        if (hasAI || hasDamage) return 'collision_enemy';

                                        // Fallback to template name detection for wall/obstacle/platform
                                        const templateName = entity.template.name.toLowerCase();
                                        if (templateName.includes('wall') || templateName.includes('obstacle') || templateName.includes('platform')) {
                                            return 'collision_wall';
                                        }

                                        return 'collision_wall'; // Default changed from 'collision_enemy' to 'collision_wall' (safer)
                                    };

                                    // Check if entities are in invulnerable states (Dead, Hurt, etc.)
                                    const invulnerableStates = ['Dead', 'Death', 'Hurt', 'Hit', 'Damage', 'Respawn', 'Spawning', 'Invulnerable'];
                                    const isAInvulnerable = entityA.currentState && invulnerableStates.some(state =>
                                        entityA.currentState?.toLowerCase().includes(state.toLowerCase())
                                    );
                                    const isBInvulnerable = entityB.currentState && invulnerableStates.some(state =>
                                        entityB.currentState?.toLowerCase().includes(state.toLowerCase())
                                    );

                                    // Only trigger collision events if not invulnerable
                                    if (!isAInvulnerable) {
                                        const eventNameA = getCollisionEventType(entityB, layerB); // What A collided with
                                        triggerEvent(entityA.instance.id, eventNameA);
                                    }
                                    if (!isBInvulnerable) {
                                        const eventNameB = getCollisionEventType(entityA, layerA); // What B collided with
                                        triggerEvent(entityB.instance.id, eventNameB);
                                    }
                                } else {
                                    // SOLID COLLISION: Apply physical separation
                                    console.log(`  💥 SOLID COLLISION: Applying physical pushback...`);
                                    resolveEntityCollision(entityA, entityB, propsA, propsB);

                                    // Helper function: Determine collision event type based on entity layer and components
                                    const getCollisionEventType = (entity: typeof entityA | typeof entityB, entityLayer: number): string => {
                                        // Check if entity has comp_collectible
                                        const hasCollectible = entity.template.components.some(c => c.definitionId === 'comp_collectible');
                                        if (hasCollectible) return 'collision_item';

                                        // Check layer 8 (bit 3) for platforms/walls - MUST check before enemy detection
                                        if ((entityLayer & 8) !== 0) return 'collision_wall';

                                        // Check if entity has comp_damage or comp_ai_behavior (enemy)
                                        const hasAI = entity.template.components.some(c => c.definitionId === 'comp_ai_behavior');
                                        const hasDamage = entity.template.components.some(c => c.definitionId === 'comp_damage');
                                        if (hasAI || hasDamage) return 'collision_enemy';

                                        // Fallback to template name detection for wall/obstacle/platform
                                        const templateName = entity.template.name.toLowerCase();
                                        if (templateName.includes('wall') || templateName.includes('obstacle') || templateName.includes('platform')) {
                                            return 'collision_wall';
                                        }

                                        return 'collision_wall'; // Default changed from 'collision_enemy' to 'collision_wall' (safer)
                                    };

                                    // Check if entities are in invulnerable states (Dead, Hurt, etc.)
                                    const invulnerableStates = ['Dead', 'Death', 'Hurt', 'Hit', 'Damage', 'Respawn', 'Spawning', 'Invulnerable'];
                                    const isAInvulnerable = entityA.currentState && invulnerableStates.some(state =>
                                        entityA.currentState?.toLowerCase().includes(state.toLowerCase())
                                    );
                                    const isBInvulnerable = entityB.currentState && invulnerableStates.some(state =>
                                        entityB.currentState?.toLowerCase().includes(state.toLowerCase())
                                    );

                                    // Only trigger collision events if not invulnerable
                                    if (!isAInvulnerable) {
                                        const eventNameA = getCollisionEventType(entityB, layerB); // What A collided with
                                        triggerEvent(entityA.instance.id, eventNameA);
                                    }
                                    if (!isBInvulnerable) {
                                        const eventNameB = getCollisionEventType(entityA, layerA); // What B collided with
                                        triggerEvent(entityB.instance.id, eventNameB);
                                    }
                                }
                            } else {
                                console.log(`  ❌ Layer check failed - no collision response`);
                            }
                        }
                    }
                }

                // --- 6. Lógica de Patrulla ---
                // Only process patrol AI if physics is enabled
                if (canProcessPhysics) {
                    const patrolComp = entityA.instance.componentOverrides?.comp_patrol;
                    if (patrolComp?.waypoint1_x !== undefined && patrolComp?.waypoint1_y !== undefined) {
                        const startPixelX = patrolComp.waypoint1_x; const startPixelY = patrolComp.waypoint1_y;
                        const endPixelX = patrolComp.waypoint2_x ?? startPixelX; const endPixelY = patrolComp.waypoint2_y ?? startPixelY;
                        if ((entityA.vx > 0 && entityA.x >= Math.max(startPixelX, endPixelX)) || (entityA.vx < 0 && entityA.x <= Math.min(startPixelX, endPixelX))) {
                             entityA.vx = -entityA.vx;
                        }
                        if ((entityA.vy > 0 && entityA.y >= Math.max(startPixelY, endPixelY)) || (entityA.vy < 0 && entityA.y <= Math.min(startPixelY, endPixelY))) {
                            entityA.vy = -entityA.vy;
                        }
                    }
                }

                // --- 6.5. Update isOnGround after entity collisions to include platform riding ---
                if (hasCollisionComp) {
                    // If we're on a platform (platformUnderneath was set during collisions), we're on ground
                    if (entityA.platformUnderneath) {
                        entityA.isOnGround = true;
                        console.log(`[PLATFORM] ${entityA.instance.name} is on ground via platform ${entityA.platformUnderneath.instance.name}`);

                        // Transfer platform velocity if standing on a moving platform
                        if (entityA === heroRef.current) {
                            // Add platform's horizontal velocity to entity's position
                            // This makes the entity "stick" to the platform as it moves
                            entityA.x += entityA.platformUnderneath.vx;
                            // Also transfer vertical velocity if platform is moving vertically
                            if (entityA.platformUnderneath.vy !== 0) {
                                entityA.y += entityA.platformUnderneath.vy;
                            }
                            console.log(`[PLATFORM] Transferring velocity from ${entityA.platformUnderneath.instance.name}: vx=${entityA.platformUnderneath.vx}, vy=${entityA.platformUnderneath.vy}`);
                        }
                    }
                    // Detect falling off platform
                    if (previousPlatform && !entityA.platformUnderneath) {
                        console.log(`[PLATFORM] ${entityA.instance.name} fell off platform ${previousPlatform.instance.name}`);
                    }
                }

                // --- 7. Animación de Sprites ---
                const animComp = entityA.template.components.find(c => c.definitionId === 'comp_animation');
                if (animComp && entityA.frameImages.length > 1 && now - entityA.lastFrameUpdateTime > ANIMATION_SPEED_MS) {
                    // Check if animation should only play when moving
                    const animateOnlyWhenMoving = animComp.defaultValues?.animateOnlyWhenMoving === true;
                    const isMoving = entityA.vx !== 0 || entityA.vy !== 0;

                    // Priority states that should always animate (death, hurt, attack, etc.)
                    const priorityStates = ['Dead', 'Death', 'Hurt', 'Hit', 'Damage', 'Attack', 'Attacking', 'Stunned', 'GameOver', 'Invulnerable'];
                    const isInPriorityState = entityA.currentState ? priorityStates.some(state =>
                        entityA.currentState.toLowerCase().includes(state.toLowerCase())
                    ) : false;

                    // Check if animation loops (from sprite metadata, fallback to component)
                    const loops = entityA.sprite.loops !== undefined
                        ? entityA.sprite.loops
                        : (animComp.defaultValues?.loops !== false); // Default true

                    // Reset completion flag if state changed
                    if (entityA.lastAnimationState !== entityA.currentState) {
                        entityA.animationHasCompleted = false;
                        entityA.lastAnimationState = entityA.currentState;
                    }

                    // Animate if: not restricted to movement, OR is moving, OR in priority state
                    // AND (animation hasn't completed OR animation loops)
                    if ((!animateOnlyWhenMoving || isMoving || isInPriorityState) && (!entityA.animationHasCompleted || loops)) {
                        const previousFrame = entityA.currentFrame;

                        if (loops) {
                            // Looping animation: cycle through frames
                            entityA.currentFrame = (entityA.currentFrame + 1) % entityA.frameImages.length;
                        } else {
                            // Non-looping animation: stop at last frame
                            if (entityA.currentFrame < entityA.frameImages.length - 1) {
                                entityA.currentFrame++;
                            } else {
                                // Animation completed!
                                if (!entityA.animationHasCompleted) {
                                    entityA.animationHasCompleted = true;
                                }
                            }
                        }

                        entityA.lastFrameUpdateTime = now;
                    } else if (!isInPriorityState) {
                        // Reset to first frame when stopped (and not in priority state)
                        entityA.currentFrame = 0;
                    }
                }

                // --- 8. Dibujar Entidad ---
                // Safety check: ensure frameImages array has elements and currentFrame is valid
                if (entityA.frameImages.length > 0) {
                    // Ensure currentFrame is within bounds
                    if (entityA.currentFrame >= entityA.frameImages.length) {
                        entityA.currentFrame = 0;
                    }

                    // Determine which image to draw based on movement direction
                    let shouldUseMirrored = false;

                    if (entityA.mirroredFrameImages && entityA.mirroredFrameImages.length > entityA.currentFrame) {
                        // Check if currently moving
                        if (entityA.vx !== 0) {
                            // Moving: determine direction and update facing state
                            if (entityA.sprite.facingDirection === 'right' && entityA.vx < 0) {
                                shouldUseMirrored = true;
                                entityA.isFacingMirrored = true; // Remember: facing left
                            } else if (entityA.sprite.facingDirection === 'left' && entityA.vx > 0) {
                                shouldUseMirrored = true;
                                entityA.isFacingMirrored = true; // Remember: facing right
                            } else {
                                entityA.isFacingMirrored = false; // Remember: facing default direction
                            }
                        } else {
                            // Not moving: use last known direction
                            shouldUseMirrored = entityA.isFacingMirrored === true;
                        }
                    }

                    let imageToDraw = shouldUseMirrored ? entityA.mirroredFrameImages![entityA.currentFrame] : entityA.frameImages[entityA.currentFrame];
                    // Asegurarse de que la imagen esté cargada antes de dibujar es crucial para el rendimiento
                    if (imageToDraw && imageToDraw.complete && imageToDraw.naturalWidth > 0) {
                         ctx.drawImage(imageToDraw, entityA.x, entityA.y);
                    } else if (imageToDraw) {
                         // Opcional: manejar imagen no cargada (e.g., dibujar placeholder)
                         // console.warn("Imagen no cargada aún:", entityA.instance.name);
                    }
                }
                // If frameImages is empty, simply skip drawing but continue processing

                // --- 9. DEBUG: Dibujar Hitboxes (si tiene comp_collision) ---
                if (showHitboxDebug && hasCollisionComp) {
                    const props = entityCollisionProps(entityA);
                    if (props) {
                        const hitbox = getHitboxFor(entityA, props);

                        // Log detallado para debug
                        if (now % 1000 < 16) {
                            console.log(`[HITBOX DRAW] ${entityA.instance.name}: hasComp=${hasCollisionComp}, props=${!!props}, isTrigger=${props.isTrigger}, hitbox=`, hitbox);
                        }

                        // Color según tipo de colisión
                        if (props.isTrigger) {
                            ctx.strokeStyle = '#FFAA00'; // Naranja para triggers (sin empuje)
                            ctx.setLineDash([4, 2]); // Línea punteada para triggers
                        } else {
                            ctx.strokeStyle = '#00FF00'; // Verde para solid (con empuje)
                            ctx.setLineDash([]); // Línea sólida
                        }
                        ctx.lineWidth = 2;
                        ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
                        ctx.setLineDash([]); // Reset dash

                        // Dibujar punto central
                        ctx.fillStyle = props.isTrigger ? '#FFAA00' : '#00FF00';
                        ctx.fillRect(hitbox.x + hitbox.width/2 - 2, hitbox.y + hitbox.height/2 - 2, 4, 4);

                        // Dibujar nombre de la entidad
                        ctx.fillStyle = '#FFFF00';
                        ctx.font = '8px monospace';
                        const label = `${entityA.instance.name} L${props.collisionLayer}${props.isTrigger ? ' [T]' : ''}`;
                        ctx.fillText(label, hitbox.x, hitbox.y - 2);
                    } else {
                        if (now % 1000 < 16) {
                            console.log(`[HITBOX DRAW] ${entityA.instance.name}: hasComp=${hasCollisionComp}, but props is NULL!`);
                        }
                    }
                } else if (showHitboxDebug) {
                    if (now % 1000 < 16) {
                        console.log(`[HITBOX DRAW] ${entityA.instance.name}: hasComp=${hasCollisionComp} (no hitbox to draw)`);
                    }
                }
            });

            // --- Check for pending node transitions (from CHANGE_GAME_FLOW_NODE action) ---
            const entityWithPendingTransition = entitiesRef.current.find(e => (e as any).pendingNodeTransition);
            if (entityWithPendingTransition) {
                const targetNodeId = (entityWithPendingTransition as any).pendingNodeTransition;
                delete (entityWithPendingTransition as any).pendingNodeTransition;

                console.log(`[GAME FLOW] Executing pending node transition to "${targetNodeId}"`);

                // Handle different transition types
                if (currentNode.type === 'WorldLink') {
                    // World map transition
                    handleScreenTransition(targetNodeId);
                } else {
                    // Game flow transition
                    setNavigationStack(prev => [...prev, currentNode.id]);
                    setCurrentNodeId(targetNodeId);
                    setSelectedOptionIndex(0);
                    setCurrentScreenMap(null);
                    setCurrentWorldMapGraph(null);
                }
                return; // Stop animation frame to allow transition
            }

            animationFrameId.current = requestAnimationFrame(animate);
        };
        // --- Fin Nueva Función ---

        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        if (currentNode.type === 'WorldLink') {
            if (isDynamic) {
                lastTime = 0; // Reiniciar deltaTime
                animationFrameId.current = requestAnimationFrame(animate);
            } else {
                ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
                if (tileBufferRef.current) { // Dibujar buffer estático
                    ctx.drawImage(tileBufferRef.current, 0, 0);
                } else {
                    // Si no hay buffer, dibujar fondo por defecto
                     ctx.fillStyle = '#000000';
                     ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
                }
                entitiesRef.current.forEach(entity => {
                    if (entity.frameImages.length > 0 && entity.frameImages[0].complete) {
                        ctx.drawImage(entity.frameImages[0], entity.x, entity.y);
                    }
                });
            }
        } else {
            renderTextNodes();
        }

        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            // tileCanvas = null; tileCtx = null; // Opcional: limpiar referencias
        };
    }, [
        isOpen, isDynamic, currentNode, currentScreenMap, allAssets, connections, currentGraphData,
        msxFont, msxFontColorAttributes, entityTemplates, currentScreenMode, selectedOptionIndex, checkKeyTransitions,
        // Asegurarse de que dependencias de las funciones internas estén aquí si cambian
        componentDefinitions, TILE_SIZE, PREVIEW_WIDTH, PREVIEW_HEIGHT, showHitboxDebug
    ]);

    if (!isOpen) return null;

    const currentScreenNode = currentWorldMapGraph?.nodes.find(n => n.screenAssetId === currentScreenMap?.id);
    const getExitsForDirection = (direction: 'north' | 'south' | 'east' | 'west'): EnrichedConnection[] => {
        if (!currentScreenNode || !currentWorldMapGraph) return [];
        const outgoing = currentWorldMapGraph.connections
            .filter(c => c.fromNodeId === currentScreenNode.id && c.fromDirection === direction)
            .map(c => ({ ...c, targetNodeId: c.toNodeId }));
        const incoming = currentWorldMapGraph.connections
            .filter(c => c.toNodeId === currentScreenNode.id && c.toDirection === direction)
            .map(c => ({ ...c, targetNodeId: c.fromNodeId }));
        return [...outgoing, ...incoming];
    };

    const northExits = getExitsForDirection('north');
    const southExits = getExitsForDirection('south');
    const eastExits = getExitsForDirection('east');
    const westExits = getExitsForDirection('west');

    const getButtonStyle = (direction: 'north' | 'south' | 'east' | 'west', index: number, total: number): React.CSSProperties => {
        const offset = (index - (total - 1) / 2) * (isFullscreen ? 64 : 32);
        switch (direction) {
            case 'north': return { top: 0, left: `calc(50% + ${offset}px)`, transform: 'translateX(-50%)' };
            case 'south': return { bottom: 0, left: `calc(50% + ${offset}px)`, transform: 'translateX(-50%)' };
            case 'west': return { left: 0, top: `calc(50% + ${offset}px)`, transform: 'translateY(-50%)' };
            case 'east': return { right: 0, top: `calc(50% + ${offset}px)`, transform: 'translateY(-50%)' };
        }
    };

    const handleSaveCrtConfig = (config: CRTShaderConfig) => {
        setCrtConfig(config);
        localStorage.setItem('crtShaderConfig', JSON.stringify(config));
    };

    const subMenuNode = currentNode?.type === 'SubMenu' ? currentNode as GameFlowSubMenuNode : null;
    const cursorAsset = subMenuNode?.appearance?.cursorSpriteAssetId ? allAssets.find(a => a.id === subMenuNode.appearance.cursorSpriteAssetId) : null;
    const canvasBackgroundColor = subMenuNode?.appearance?.colors?.background || '#000000';

    const modalContent = (
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
                <h2 className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4 pixel-font">Game Flow Preview</h2>
                <p className="text-xs text-msx-textsecondary mb-2">Use Arrows, Enter/Space, and Escape to navigate.</p>
                <div className="relative" style={{ width: PREVIEW_WIDTH * (isFullscreen ? 4 : 2), height: PREVIEW_HEIGHT * (isFullscreen ? 4 : 2) }}>
                    <CRTShaderOverlay enabled={isFullscreen} config={crtConfig}>
                    <canvas
                        ref={canvasRef}
                        width={PREVIEW_WIDTH}
                        height={PREVIEW_HEIGHT}
                        className={`border-2 border-msx-border ${isPositioningMode ? 'cursor-crosshair' : ''}`}
                        style={{
                            width: PREVIEW_WIDTH * (isFullscreen ? 4 : 2),
                            height: PREVIEW_HEIGHT * (isFullscreen ? 4 : 2),
                            imageRendering: 'pixelated',
                            backgroundColor: canvasBackgroundColor
                        }}
                        onClick={handleCanvasClick}
                    />
                    </CRTShaderOverlay>
                    {cursorAsset && subMenuNode && (() => {
                        const expandedOpts = expandMenuOptions(subMenuNode);
                        const selectedText = expandedOpts[selectedOptionIndex]?.text || '';
                        const scale = isFullscreen ? 4 : 2;
                        return (
                            <img
                                src={createSpriteDataURL((cursorAsset.data as Sprite).frames[0].data, (cursorAsset.data as Sprite).size.width, (cursorAsset.data as Sprite).size.height)}
                                alt="cursor"
                                className="absolute pointer-events-none"
                                style={{
                                    left: ((PREVIEW_WIDTH - getTextDimensionsMSX1(selectedText, 1).width) / 2 - 16) * scale,
                                    top: ((80 + selectedOptionIndex * 12) - 4) * scale,
                                    imageRendering: 'pixelated',
                                    width: (cursorAsset.data as Sprite).size.width * scale,
                                    height: (cursorAsset.data as Sprite).size.height * scale,
                                }}
                            />
                        );
                    })()}
                    {currentScreenMap && !isPlayMode && (
                        <>
                            {northExits.map((conn, index) => (
                                <button key={`${conn.id}-${index}`} onClick={() => handleScreenTransition(conn.targetNodeId)} style={getButtonStyle('north', index, northExits.length)} className={`absolute bg-black bg-opacity-50 text-white p-1 rounded-full ${isFullscreen ? 'p-2' : ''}`}>
                                    <ArrowUpIcon className={isFullscreen ? 'w-12 h-12' : 'w-6 h-6'} />
                                </button>
                            ))}
                            {southExits.map((conn, index) => (
                                <button key={`${conn.id}-${index}`} onClick={() => handleScreenTransition(conn.targetNodeId)} style={getButtonStyle('south', index, southExits.length)} className={`absolute bg-black bg-opacity-50 text-white p-1 rounded-full ${isFullscreen ? 'p-2' : ''}`}>
                                    <ArrowDownIcon className={isFullscreen ? 'w-12 h-12' : 'w-6 h-6'} />
                                </button>
                            ))}
                            {westExits.map((conn, index) => (
                                <button key={`${conn.id}-${index}`} onClick={() => handleScreenTransition(conn.targetNodeId)} style={getButtonStyle('west', index, westExits.length)} className={`absolute bg-black bg-opacity-50 text-white p-1 rounded-full ${isFullscreen ? 'p-2' : ''}`}>
                                    <ArrowLeftIcon className={isFullscreen ? 'w-12 h-12' : 'w-6 h-6'} />
                                </button>
                            ))}
                            {eastExits.map((conn, index) => (
                                <button key={`${conn.id}-${index}`} onClick={() => handleScreenTransition(conn.targetNodeId)} style={getButtonStyle('east', index, eastExits.length)} className={`absolute bg-black bg-opacity-50 text-white p-1 rounded-full ${isFullscreen ? 'p-2' : ''}`}>
                                    <ArrowRightIcon className={isFullscreen ? 'w-12 h-12' : 'w-6 h-6'} />
                                </button>
                            ))}
                        </>
                    )}
                </div>
                <div className="flex items-center mt-4">
                    {!isPlayMode && (
                        <>
                            <Button onClick={() => setIsDynamic(!isDynamic)} variant={isDynamic ? 'secondary' : 'ghost'} size="md" className="mr-4">Dynamic: {isDynamic ? 'On' : 'Off'}</Button>
                            {isDynamic && currentNode?.type === 'WorldLink' && (
                                <>
                                    <Button onClick={() => setShowHitboxDebug(!showHitboxDebug)} variant={showHitboxDebug ? 'secondary' : 'ghost'} size="md" className="mr-4">
                                        Hitbox Debug: {showHitboxDebug ? 'On' : 'Off'}
                                    </Button>
                                    <Button onClick={() => setIsPositioningMode(!isPositioningMode)} variant={isPositioningMode ? 'secondary' : 'ghost'} size="md" className="mr-4">
                                        Position Player: {isPositioningMode ? 'On' : 'Off'}
                                    </Button>
                                </>
                            )}
                            {currentNode?.type === 'WorldLink' && (() => {
                                const conn = connections.find(c => c.from.nodeId === currentNode.id);
                                return conn ? (
                                    <Button onClick={() => {
                                        let targetNodeId = conn.to.nodeId;
                                        let targetNode = nodes.find(n => n.id === targetNodeId);
                                        while (targetNode && targetNode.type === 'Waypoint') {
                                            const nextConn = connections.find(c => c.from.nodeId === targetNodeId);
                                            if (nextConn) {
                                                targetNodeId = nextConn.to.nodeId;
                                                targetNode = nodes.find(n => n.id === targetNodeId);
                                            } else {
                                                break;
                                            }
                                        }
                                        setNavigationStack(prev => [...prev, currentNode.id]);
                                        setCurrentNodeId(targetNodeId);
                                        setSelectedOptionIndex(0);
                                        setCurrentScreenMap(null);
                                        setCurrentWorldMapGraph(null);
                                    }} variant="secondary" size="md" className="mr-4">Exit World</Button>
                                ) : null;
                            })()}
                        </>
                    )}
                    {isPlayMode && (
                        <>
                            <Button
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                variant="secondary"
                                size="md"
                                icon={<ArrowsPointingOutIcon />}
                                className="mr-4"
                            >
                                {isFullscreen ? 'Normal Size' : 'Full Size'}
                            </Button>
                            <Button
                                onClick={() => setIsCrtConfigOpen(true)}
                                variant="ghost"
                                size="md"
                                className="mr-4"
                            >
                                CRT Config
                            </Button>
                        </>
                    )}
                    <Button onClick={onClose} variant="primary" size="md">Close</Button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {createPortal(modalContent, document.body)}
            <CRTConfigModal
                isOpen={isCrtConfigOpen}
                onClose={() => setIsCrtConfigOpen(false)}
                currentConfig={crtConfig}
                onSave={handleSaveCrtConfig}
            />
        </>
    );
};
