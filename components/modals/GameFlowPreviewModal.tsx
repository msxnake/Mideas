import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    GameFlowGraph,
    ProjectAsset,
    GameFlowNode,
    GameFlowSubMenuNode,
    GameFlowWorldLinkNode,
    MSXFont,
    MSXFontColorAttributes,
    EntityTemplate,
    ScreenMap,
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
import { ArrowUpIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon } from '../icons/MsxIcons';
import { StateMachine } from '../../statemachine.types';

/** The size of a tile in pixels. @constant */
const TILE_SIZE = 8;
/** The width of the preview canvas in pixels. @constant */
const PREVIEW_WIDTH = 256;
/** The height of the preview canvas in pixels. @constant */
const PREVIEW_HEIGHT = 192;
/** The speed of the animation in milliseconds per frame. @constant */
const ANIMATION_SPEED_MS = 200;

/**
 * Represents an entity being animated in the preview.
 * @internal
 */
interface AnimatedEntity {
    /** The entity instance from the screen map. */
    instance: EntityInstance;
    /** The entity template. */
    template: EntityTemplate;
    /** The sprite associated with the entity. */
    sprite: Sprite;
    /** The current x position in pixels. */
    x: number;
    /** The current y position in pixels. */
    y: number;
    /** The current velocity on the x-axis. */
    vx: number;
    /** The current velocity on the y-axis. */
    vy: number;
    /** The pre-rendered frame images for the animation. */
    frameImages: HTMLImageElement[];
    /** The pre-rendered mirrored frame images for the animation. */
    mirroredFrameImages?: HTMLImageElement[];
    /** The index of the current animation frame. */
    currentFrame: number;
    /** The timestamp of the last frame update. */
    lastFrameUpdateTime: number;
    /** The state machine associated with the entity, if any. */
    stateMachine?: StateMachine;
    /** The name of the current state in the state machine. */
    currentState?: string;
}

/**
 * Props for the {@link GameFlowPreviewModal} component.
 * @category Modal
 */
interface GameFlowPreviewModalProps {
    /** Whether the modal is currently open. */
    isOpen: boolean;
    /** Callback function to close the modal. */
    onClose: () => void;
    /** The game flow graph data to preview. */
    graphData: GameFlowGraph;
    /** A list of all project assets. */
    allAssets: ProjectAsset[];
    /** The MSX font data. */
    msxFont: MSXFont;
    /** The color attributes for the MSX font. */
    msxFontColorAttributes: MSXFontColorAttributes;
    /** A list of all entity templates in the project. */
    entityTemplates: EntityTemplate[];
    /** The current screen mode (e.g., 'screen2'). */
    currentScreenMode: string;
    /** A list of all component definitions in the project. */
    componentDefinitions: ComponentDefinition[];
    /** The initial state of the 'dynamic' toggle. */
    initialIsDynamic?: boolean;
}

/**
 * Extends a world map connection with the target node ID for easier access.
 * @internal
 */
interface EnrichedConnection extends WorldMapConnection {
    targetNodeId: string;
}

/**
 * A modal dialog for previewing the game flow.
 * This component provides an interactive simulation of the game's flow,
 * allowing the user to navigate through menus and world maps.
 *
 * @param props The component props.
 * @returns A React component.
 * @category Modal
 */
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
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const animationFrameId = useRef<number>();
    const entitiesRef = useRef<AnimatedEntity[]>([]);
    const heroRef = useRef<AnimatedEntity | null>(null);
    const pressedKeys = useRef<Set<string>>(new Set());

    const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
    const [navigationStack, setNavigationStack] = useState<string[]>([]);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
    const [currentScreenMap, setCurrentScreenMap] = useState<ScreenMap | null>(null);
    const [currentWorldMapGraph, setCurrentWorldMapGraph] = useState<WorldMapGraph | null>(null);
    const [isDynamic, setIsDynamic] = useState(initialIsDynamic);

    const { nodes, connections } = graphData;
    const currentNode = nodes.find(node => node.id === currentNodeId);

    const checkKeyTransitions = useCallback((entityId: string, pressedKey: string, isKeyDown: boolean) => {
        const entity = entitiesRef.current.find(e => e.instance.id === entityId);
        if (!entity) {
            console.log(`Entity ${entityId} not found`);
            return;
        }
        
        if (!entity.stateMachine) {
            // Fallback: directly set velocity for movement
            const speed = 2;
            switch (pressedKey) {
                case 'ArrowUp': entity.vy = isKeyDown ? -speed : 0; break;
                case 'ArrowDown': entity.vy = isKeyDown ? speed : 0; break;
                case 'ArrowLeft': entity.vx = isKeyDown ? -speed : 0; break;
                case 'ArrowRight': entity.vx = isKeyDown ? speed : 0; break;
            }
            return;
        }
        
        if (!entity.currentState) {
            console.log(`Entity ${entityId} has no current state`);
            return;
        }
        
        // Find current state
        const currentStateDef = entity.stateMachine.states.find(s => s.name === entity.currentState);
        if (!currentStateDef) {
            console.log(`Current state ${entity.currentState} not found in state machine`);
            return;
        }
        
        console.log(`Entity ${entityId}: Current state = ${entity.currentState}, Key = ${pressedKey}, KeyDown = ${isKeyDown}`);
        
        // Look for matching transitions from current state
        for (const transition of entity.stateMachine.transitions) {
            if (transition.fromStateId !== currentStateDef.id) continue;
            
            const condition = transition.conditions;
            if (!condition) continue;
            
            let conditionMet = false;
            
            // Check if condition matches the key event
            if (isKeyDown && condition.type === 'KEY_PRESSED' && condition.params?.key === pressedKey) {
                conditionMet = true;
            } else if (!isKeyDown && condition.type === 'KEY_RELEASED' && condition.params?.key === pressedKey) {
                conditionMet = true;
            }
            
            if (conditionMet) {
                // Execute transition
                const nextState = entity.stateMachine.states.find(s => s.id === transition.toStateId);
                if (nextState) {
                    console.log(`Transitioning from ${entity.currentState} to ${nextState.name}`);
                    entity.currentState = nextState.name;
                    
                    // Execute actions
                    if (transition.actions) {
                        for (const action of transition.actions) {
                            if (action.type === 'SET_VELOCITY') {
                                entity.vx = action.params.x || 0;
                                entity.vy = action.params.y || 0;
                                console.log(`Setting velocity: x=${entity.vx}, y=${entity.vy}`);
                            }
                        }
                    }
                    return; // Exit after first matching transition
                }
            }
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            modalRef.current?.focus();
            const startNode = nodes.find(n => n.type === 'Start');
            if (startNode) setCurrentNodeId(startNode.id);
            setNavigationStack([]);
            setSelectedOptionIndex(0);
            setCurrentScreenMap(null);
            setCurrentWorldMapGraph(null);
            heroRef.current = null;
            pressedKeys.current.clear();
        } else {
             if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        }
    }, [isOpen, nodes]);

    const handleAction = useCallback(() => {
        if (!currentNode || currentNode.type !== 'SubMenu') return;
        const subMenuNode = currentNode as GameFlowSubMenuNode;
        const selectedOption = subMenuNode.options[selectedOptionIndex];
        if (!selectedOption) return;
        const connection = connections.find(c => c.from.nodeId === currentNode.id && c.from.sourceId === selectedOption.id);
        if (connection) {
            setNavigationStack(prev => [...prev, currentNode.id]);
            setCurrentNodeId(connection.to.nodeId);
            setSelectedOptionIndex(0);
        }
    }, [currentNode, connections, selectedOptionIndex]);

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
        setCurrentScreenMap(nextScreenAsset.data as ScreenMap);
    }, [currentWorldMapGraph, allAssets]);

    const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
        if (heroRef.current && pressedKeys.current.has(e.key)) {
            pressedKeys.current.delete(e.key);
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                checkKeyTransitions(heroRef.current.instance.id, e.key, false);
            }
        }
    }, [checkKeyTransitions]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        e.preventDefault();
        if (!currentNode) return;
        if (currentNode.type === 'SubMenu') {
            const subMenuNode = currentNode as GameFlowSubMenuNode;
            switch (e.key) {
                case 'ArrowUp': setSelectedOptionIndex(prev => Math.max(0, prev - 1)); break;
                case 'ArrowDown': setSelectedOptionIndex(prev => Math.min(subMenuNode.options.length - 1, prev + 1)); break;
                case ' ': case 'Enter': handleAction(); break;
                case 'Escape': handleGoBack(); break;
            }
        } else if (currentNode.type === 'WorldLink') {
            if (heroRef.current) {
                if (!pressedKeys.current.has(e.key)) {
                    pressedKeys.current.add(e.key);
                    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                        checkKeyTransitions(heroRef.current.instance.id, e.key, true);
                    }
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
    }, [currentNode, currentScreenMap, currentWorldMapGraph, handleScreenTransition, handleAction, handleGoBack, checkKeyTransitions]);

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

    useEffect(() => {
        if (!isOpen || !currentScreenMap) {
            entitiesRef.current = [];
            heroRef.current = null;
            return;
        };
        const getAsset = <T extends AssetType>(assetId: string | null | undefined, assetType: T): ProjectAsset | undefined => {
            if (!assetId) return undefined;
            return allAssets.find(a => a.id === assetId && a.type === assetType);
        };
        const entitiesToAnimate: AnimatedEntity[] = [];
        currentScreenMap.layers.entities.forEach(instance => {
            const template = entityTemplates.find(t => t.id === instance.entityTemplateId);
            if (!template) return;
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
            if (!sprite?.frames?.length) return;
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
            
            // Check for standard state machine component
            let smc = template.components.find(c => c.definitionId === 'comp_statemachine');
            let stateMachineAssetId: string | undefined;
            
            if (smc) {
                stateMachineAssetId = smc.defaultValues?.stateMachineAssetId;
            } else {
                // Check for custom state machine component (like comp_def_1757139342862)
                smc = template.components.find(c => 
                    componentDefinitions.find(def => def.id === c.definitionId)?.properties.some(p => 
                        p.type === 'statemachine_ref' || p.name === 'state_machine'
                    )
                );
                if (smc) {
                    // Try different field names for the asset ID
                    stateMachineAssetId = smc.defaultValues?.stateMachineAssetId || 
                                         smc.defaultValues?.state_machine ||
                                         instance.componentOverrides?.[smc.definitionId]?.stateMachineAssetId ||
                                         instance.componentOverrides?.[smc.definitionId]?.state_machine;
                }
            }
            
            if (stateMachineAssetId && stateMachineAssetId !== '0' && stateMachineAssetId !== '') {
                const stateMachineAsset = getAsset(stateMachineAssetId, 'statemachine');
                stateMachine = stateMachineAsset?.data as StateMachine | undefined;
                if (stateMachine) {
                    let initialState = stateMachine.states.find(s => s.id === stateMachine.initialStateId);
                    if (!initialState) {
                        initialState = stateMachine.states.find(s => s.name.toLowerCase() === 'idle') || stateMachine.states[0];
                    }
                    currentState = initialState?.name;
                }
            }
            const patrolComp = instance.componentOverrides?.comp_patrol;
            let vx = 0, vy = 0;
            let startX = instance.position.x * TILE_SIZE;
            let startY = instance.position.y * TILE_SIZE;
            if (patrolComp?.waypoint1_x !== undefined && patrolComp?.waypoint1_y !== undefined) {
                startX = patrolComp.waypoint1_x;
                startY = patrolComp.waypoint1_y;
                const endX = patrolComp.waypoint2_x ?? startX;
                const endY = patrolComp.waypoint2_y ?? startY;
                const dx = endX - startX;
                const dy = endY - startY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) { vx = (dx / dist); vy = (dy / dist); }
            }
            const newAnimatedEntity: AnimatedEntity = {
                instance, template, sprite, x: startX, y: startY, vx, vy,
                frameImages, mirroredFrameImages, currentFrame: 0, lastFrameUpdateTime: 0,
                stateMachine, currentState
            };
            entitiesToAnimate.push(newAnimatedEntity);
            
            // Detect hero entity using multiple methods
            if (template.components.some(c => c.definitionId === 'comp_cursors') ||
                template.components.some(c => c.definitionId === 'comp_player_input') ||
                template.name === 'Player') {
                heroRef.current = newAnimatedEntity;
            }
        });
        entitiesRef.current = entitiesToAnimate;
    }, [isOpen, currentScreenMap, allAssets, entityTemplates, componentDefinitions]);

    useEffect(() => {
        if (!isOpen || !currentNode) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        ctx.imageSmoothingEnabled = false;
        const subMenuNode = currentNode.type === 'SubMenu' ? currentNode as GameFlowSubMenuNode : null;
        const bgAsset = subMenuNode?.appearance?.backgroundScreenAssetId ? allAssets.find(a => a.id === subMenuNode.appearance.backgroundScreenAssetId) : null;
        const screenMapToRender = currentScreenMap || (bgAsset?.data as ScreenMap);
        const tileset = allAssets.filter(a => a.type === 'tile').map(a => a.data as Tile);
        
        const drawTextAsync = (text: string, x: number, y: number, colorAttrs: MSXFontColorAttributes) => {
            return new Promise<void>((resolve) => {
                const textImg = new Image();
                textImg.onload = () => { ctx.drawImage(textImg, x, y); resolve(); };
                textImg.src = renderMSX1TextToDataURL(text, msxFont, colorAttrs, 1, 1);
            });
        };
        
        const renderTextNodes = async () => {
             ctx.fillStyle = '#000000';
             ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
             if (screenMapToRender) renderScreenToCanvas(canvas, screenMapToRender, tileset, currentScreenMode, TILE_SIZE);
            switch (currentNode.type) {
                case 'Start':
                    const startText = 'Game Start';
                    const startDims = getTextDimensionsMSX1(startText, 1);
                    await drawTextAsync(startText, (PREVIEW_WIDTH - startDims.width) / 2, (PREVIEW_HEIGHT - startDims.height) / 2, msxFontColorAttributes);
                    setTimeout(() => {
                        const conn = connections.find(c => c.from.nodeId === currentNode.id);
                        if (conn) setCurrentNodeId(conn.to.nodeId);
                    }, 1000);
                    break;
                case 'SubMenu':
                    const subMenu = currentNode as GameFlowSubMenuNode;
                    const titleDims = getTextDimensionsMSX1(subMenu.title, 1);
                    await drawTextAsync(subMenu.title, (PREVIEW_WIDTH - titleDims.width) / 2, 40, msxFontColorAttributes);
                    for (const [index, option] of subMenu.options.entries()) {
                         const optionText = option.text;
                         const optionDims = getTextDimensionsMSX1(optionText, 1);
                         const isSelected = index === selectedOptionIndex;
                         let colorAttrs = msxFontColorAttributes;
                         if (isSelected) {
                             const highlightedColorAttrs = JSON.parse(JSON.stringify(msxFontColorAttributes));
                             for(let i=0; i<optionText.length; i++){
                                 highlightedColorAttrs[optionText.charCodeAt(i)] = Array(8).fill({ fg: '#FFFF00', bg: '#000000' });
                             }
                             colorAttrs = highlightedColorAttrs;
                         }
                        await drawTextAsync(optionText, (PREVIEW_WIDTH - optionDims.width) / 2, 80 + index * 12, colorAttrs);
                    }
                    break;
                case 'End':
                    const endText = 'Game Over';
                    const endDims = getTextDimensionsMSX1(endText, 1);
                    await drawTextAsync(endText, (PREVIEW_WIDTH - endDims.width) / 2, (PREVIEW_HEIGHT - endDims.height) / 2, msxFontColorAttributes);
                    break;
            }
        };

        const handleTilemapCollision = (entity: AnimatedEntity, screenMap: ScreenMap, tileset: Tile[], collisionCompDef: ComponentDefinition) => {
            const entityCollisionProps = {
                ...collisionCompDef.properties.reduce((acc, prop) => { acc[prop.name] = prop.defaultValue; return acc; }, {}),
                ...(entity.template.components.find(c => c.definitionId === 'comp_collision')?.defaultValues || {}),
                ...(entity.instance.componentOverrides?.['comp_collision'] || {})
            };
            const getHitboxFor = (x: number, y: number) => ({
                x: x + (entityCollisionProps.offsetX || 0), y: y + (entityCollisionProps.offsetY || 0),
                width: entityCollisionProps.hitboxWidth || entity.sprite.size.width, height: entityCollisionProps.hitboxHeight || entity.sprite.size.height,
            });
            const checkCollisionAt = (x: number, y: number) => {
                const tileX = Math.floor(x / TILE_SIZE); const tileY = Math.floor(y / TILE_SIZE);
                if (tileX < 0 || tileX >= screenMap.width || tileY < 0 || tileY >= screenMap.height) return true;
                const tileOnLayer = screenMap.layers.collision[tileY]?.[tileX];
                if (!tileOnLayer || !tileOnLayer.tileId) return false;
                const tile = tileset.find(t => t.id === tileOnLayer.tileId);
                return tile?.logicalProperties?.isSolid ?? false;
            };
            entity.x += entity.vx;
            let hitbox = getHitboxFor(entity.x, entity.y);
            if (entity.vx > 0) {
                if (checkCollisionAt(hitbox.x + hitbox.width, hitbox.y) || checkCollisionAt(hitbox.x + hitbox.width, hitbox.y + hitbox.height - 1)) {
                    entity.x = Math.floor((hitbox.x + hitbox.width) / TILE_SIZE) * TILE_SIZE - hitbox.width - (entityCollisionProps.offsetX || 0);
                    entity.vx = 0; // triggerEvent(entity.instance.id, 'collision_wall');
                }
            } else if (entity.vx < 0) {
                if (checkCollisionAt(hitbox.x, hitbox.y) || checkCollisionAt(hitbox.x, hitbox.y + hitbox.height - 1)) {
                    entity.x = Math.ceil(hitbox.x / TILE_SIZE) * TILE_SIZE - (entityCollisionProps.offsetX || 0);
                    entity.vx = 0; // triggerEvent(entity.instance.id, 'collision_wall');
                }
            }
            entity.y += entity.vy;
            hitbox = getHitboxFor(entity.x, entity.y);
            if (entity.vy > 0) {
                 if (checkCollisionAt(hitbox.x, hitbox.y + hitbox.height) || checkCollisionAt(hitbox.x + hitbox.width - 1, hitbox.y + hitbox.height)) {
                    entity.y = Math.floor((hitbox.y + hitbox.height) / TILE_SIZE) * TILE_SIZE - hitbox.height - (entityCollisionProps.offsetY || 0);
                    entity.vy = 0; // triggerEvent(entity.instance.id, 'collision_wall');
                }
            } else if (entity.vy < 0) {
                if (checkCollisionAt(hitbox.x, hitbox.y) || checkCollisionAt(hitbox.x + hitbox.width - 1, hitbox.y)) {
                    entity.y = Math.ceil(hitbox.y / TILE_SIZE) * TILE_SIZE - (entityCollisionProps.offsetY || 0);
                    entity.vy = 0; // triggerEvent(entity.instance.id, 'collision_wall');
                }
            }
        };

        const entityCollisionProps = (entity: AnimatedEntity) => {
             const collisionCompDef = componentDefinitions.find(c => c.id === 'comp_collision');
             if (!collisionCompDef) return null;
             return {
                ...collisionCompDef.properties.reduce((acc, prop) => { acc[prop.name] = prop.defaultValue; return acc; }, {}),
                ...(entity.template.components.find(c => c.definitionId === 'comp_collision')?.defaultValues || {}),
                ...(entity.instance.componentOverrides?.['comp_collision'] || {})
            };
        };

        const getHitboxFor = (entity: AnimatedEntity, props: any) => ({
            x: entity.x + (props.offsetX || 0), y: entity.y + (props.offsetY || 0),
            width: props.hitboxWidth || entity.sprite.size.width, height: props.hitboxHeight || entity.sprite.size.height,
        });

        const animate = () => {
            ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
            if (screenMapToRender) renderScreenToCanvas(canvas, screenMapToRender, tileset, currentScreenMode, TILE_SIZE);
            const now = performance.now();
            entitiesRef.current.forEach((entityA, indexA) => {
                if (entityA === heroRef.current && !entityA.stateMachine) { 
                    // For hero without state machine, only reset velocity if no movement keys are pressed
                    const isMoving = pressedKeys.current.has('ArrowUp') || pressedKeys.current.has('ArrowDown') || 
                                   pressedKeys.current.has('ArrowLeft') || pressedKeys.current.has('ArrowRight');
                    if (!isMoving) {
                        entityA.vx = 0; 
                        entityA.vy = 0; 
                    }
                }
                if (entityA.stateMachine && entityA.currentState) {
                    const stateDef = entityA.stateMachine.states.find(s => s.name === entityA.currentState);
                    if (stateDef?.properties) {
                        if (stateDef.properties.velocityX !== undefined) entityA.vx = stateDef.properties.velocityX;
                        if (stateDef.properties.velocityY !== undefined) entityA.vy = stateDef.properties.velocityY;
                    }
                }

                const gravityComp = entityA.template.components.find(c => c.definitionId === 'comp_gravity');
                if (gravityComp) {
                    const gravityProps = { ...gravityComp.defaultValues, ...(entityA.instance.componentOverrides?.['comp_gravity'] || {}) };
                    const strength = Number(gravityProps.strength || 0) / 60;
                    const terminalVelocity = Number(gravityProps.terminalVelocity || 2);
                    entityA.vy += strength;
                    if (entityA.vy > terminalVelocity) entityA.vy = terminalVelocity;
                }

                const collisionCompDef = componentDefinitions.find(c => c.id === 'comp_collision');
                const hasCollisionComp = entityA.template.components.some(c => c.definitionId === 'comp_collision');
                if (hasCollisionComp && collisionCompDef && screenMapToRender) {
                    handleTilemapCollision(entityA, screenMapToRender, tileset, collisionCompDef);
                } else {
                    entityA.x += entityA.vx;
                    entityA.y += entityA.vy;
                }

                if (hasCollisionComp) {
                    for (let indexB = indexA + 1; indexB < entitiesRef.current.length; indexB++) {
                        const entityB = entitiesRef.current[indexB];
                        if (!entityB.template.components.some(c => c.definitionId === 'comp_collision')) continue;
                        const propsA = entityCollisionProps(entityA);
                        const propsB = entityCollisionProps(entityB);
                        if (!propsA || !propsB) continue;
                        const hitboxA = getHitboxFor(entityA, propsA);
                        const hitboxB = getHitboxFor(entityB, propsB);
                        if (hitboxA.x < hitboxB.x + hitboxB.width && hitboxA.x + hitboxA.width > hitboxB.x && hitboxA.y < hitboxB.y + hitboxB.height && hitboxA.y + hitboxA.height > hitboxB.y) {
                            const layerA = propsA.collisionLayer || 0; const collidesWithA = propsA.collidesWith || 0;
                            const layerB = propsB.collisionLayer || 0; const collidesWithB = propsB.collidesWith || 0;
                            if ((collidesWithA & layerB) && (collidesWithB & layerA)) {
                                const eventForA = `collision_with_${entityB.template.name.replace(/[^a-zA-Z0-9_]/g, '_')}`;
                                const eventForB = `collision_with_${entityA.template.name.replace(/[^a-zA-Z0-9_]/g, '_')}`;
                                // triggerEvent(entityA.instance.id, eventForA);
                                // triggerEvent(entityB.instance.id, eventForB);
                            }
                        }
                    }
                }
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
                if (now - entityA.lastFrameUpdateTime > ANIMATION_SPEED_MS) {
                    entityA.currentFrame = (entityA.currentFrame + 1) % entityA.frameImages.length;
                    entityA.lastFrameUpdateTime = now;
                }
                let imageToDraw = entityA.frameImages[entityA.currentFrame];
                 if (entityA.mirroredFrameImages) {
                    if (entityA.sprite.facingDirection === 'right' && entityA.vx < 0) imageToDraw = entityA.mirroredFrameImages[entityA.currentFrame];
                    else if (entityA.sprite.facingDirection === 'left' && entityA.vx > 0) imageToDraw = entityA.mirroredFrameImages[entityA.currentFrame];
                }
                if (imageToDraw) ctx.drawImage(imageToDraw, entityA.x, entityA.y);
            });
            animationFrameId.current = requestAnimationFrame(animate);
        };
        
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        if (currentNode.type === 'WorldLink') {
            if (isDynamic) {
                animationFrameId.current = requestAnimationFrame(animate);
            } else {
                ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
                if (screenMapToRender) {
                    renderScreenToCanvas(canvas, screenMapToRender, tileset, currentScreenMode, TILE_SIZE);
                    entitiesRef.current.forEach(entity => {
                        if (entity.frameImages.length > 0) ctx.drawImage(entity.frameImages[0], entity.x, entity.y);
                    });
                }
            }
        } else {
            renderTextNodes();
        }
        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [
        isOpen, isDynamic, currentNode, currentScreenMap, allAssets, connections,
        msxFont, msxFontColorAttributes, entityTemplates, currentScreenMode, selectedOptionIndex, checkKeyTransitions
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
        const offset = (index - (total - 1) / 2) * 32;
        switch (direction) {
            case 'north': return { top: 0, left: `calc(50% + ${offset}px)`, transform: 'translateX(-50%)' };
            case 'south': return { bottom: 0, left: `calc(50% + ${offset}px)`, transform: 'translateX(-50%)' };
            case 'west': return { left: 0, top: `calc(50% + ${offset}px)`, transform: 'translateY(-50%)' };
            case 'east': return { right: 0, top: `calc(50% + ${offset}px)`, transform: 'translateY(-50%)' };
        }
    };

    const subMenuNode = currentNode?.type === 'SubMenu' ? currentNode as GameFlowSubMenuNode : null;
    const cursorAsset = subMenuNode?.appearance?.cursorSpriteAssetId ? allAssets.find(a => a.id === subMenuNode.appearance.cursorSpriteAssetId) : null;

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
                <h2 className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4 pixel-font">Game Flow Preview</h2>
                <p className="text-xs text-msx-textsecondary mb-2">Use Arrows, Enter/Space, and Escape to navigate.</p>
                <div className="relative" style={{ width: PREVIEW_WIDTH * 2, height: PREVIEW_HEIGHT * 2 }}>
                    <canvas
                        ref={canvasRef}
                        width={PREVIEW_WIDTH}
                        height={PREVIEW_HEIGHT}
                        className={`border-2 border-msx-border`}
                        style={{
                            width: PREVIEW_WIDTH * 2,
                            height: PREVIEW_HEIGHT * 2,
                            imageRendering: 'pixelated',
                            backgroundColor: 'black'
                        }}
                    />
                    {cursorAsset && subMenuNode && (
                        <img
                            src={createSpriteDataURL((cursorAsset.data as Sprite).frames[0].data, (cursorAsset.data as Sprite).size.width, (cursorAsset.data as Sprite).size.height)}
                            alt="cursor"
                            className="absolute pointer-events-none"
                            style={{
                                left: ((PREVIEW_WIDTH - getTextDimensionsMSX1(subMenuNode.options[selectedOptionIndex].text, 1).width) / 2 - 16) * 2,
                                top: (80 + selectedOptionIndex * 12) * 2,
                                imageRendering: 'pixelated',
                                width: (cursorAsset.data as Sprite).size.width * 2,
                                height: (cursorAsset.data as Sprite).size.height * 2,
                            }}
                        />
                    )}
                    {currentScreenMap && (
                        <>
                            {northExits.map((conn, index) => (
                                <button key={`${conn.id}-${index}`} onClick={() => handleScreenTransition(conn.targetNodeId)} style={getButtonStyle('north', index, northExits.length)} className="absolute bg-black bg-opacity-50 text-white p-1 rounded-full">
                                    <ArrowUpIcon className="w-6 h-6" />
                                </button>
                            ))}
                            {southExits.map((conn, index) => (
                                <button key={`${conn.id}-${index}`} onClick={() => handleScreenTransition(conn.targetNodeId)} style={getButtonStyle('south', index, southExits.length)} className="absolute bg-black bg-opacity-50 text-white p-1 rounded-full">
                                    <ArrowDownIcon className="w-6 h-6" />
                                </button>
                            ))}
                            {westExits.map((conn, index) => (
                                <button key={`${conn.id}-${index}`} onClick={() => handleScreenTransition(conn.targetNodeId)} style={getButtonStyle('west', index, westExits.length)} className="absolute bg-black bg-opacity-50 text-white p-1 rounded-full">
                                    <ArrowLeftIcon className="w-6 h-6" />
                                </button>
                            ))}
                            {eastExits.map((conn, index) => (
                                <button key={`${conn.id}-${index}`} onClick={() => handleScreenTransition(conn.targetNodeId)} style={getButtonStyle('east', index, eastExits.length)} className="absolute bg-black bg-opacity-50 text-white p-1 rounded-full">
                                    <ArrowRightIcon className="w-6 h-6" />
                                </button>
                            ))}
                        </>
                    )}
                </div>
                <div className="flex items-center mt-4">
                    <Button onClick={() => setIsDynamic(!isDynamic)} variant={isDynamic ? 'secondary' : 'ghost'} size="md" className="mr-4">Dynamic: {isDynamic ? 'On' : 'Off'}</Button>
                    <Button onClick={onClose} variant="primary" size="md">Close</Button>
                </div>
            </div>
        </div>
    );
};
