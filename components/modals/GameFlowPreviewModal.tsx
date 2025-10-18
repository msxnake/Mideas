import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
    /** The name of the current GameFlow asset. */
    gameFlowAssetName: string;
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
    gameFlowAssetName,
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
    const [gameGlobalVariables, setGameGlobalVariables] = useState<Record<string, any>>({});
    const [gameFlowStack, setGameFlowStack] = useState<Array<{parentGraphData: GameFlowGraph, returnNodeId: string, parentGameFlowName: string}>>([]);
    const [currentNestedGraphData, setCurrentNestedGraphData] = useState<GameFlowGraph | null>(null);
    const [currentExecutingGameFlowName, setCurrentExecutingGameFlowName] = useState<string>(gameFlowAssetName);

    // Use nested graph if available, otherwise use the main graphData
    const currentGraphData = currentNestedGraphData || graphData;
    const { nodes, connections } = currentGraphData;
    const currentNode = nodes.find(node => node.id === currentNodeId);

    const checkKeyTransitions = useCallback((entityId: string, pressedKey: string, isKeyDown: boolean) => {
        const entity = entitiesRef.current.find(e => e.instance.id === entityId);
        if (!entity) {
            console.log(`Entity ${entityId} not found`);
            return;
        }
        
        if (!entity.stateMachine) {
            // Fallback: directly set velocity for movement with direction restrictions
            const cursorsComp = entity.template.components.find(c => c.definitionId === 'comp_cursors');
            const cursorsProps = cursorsComp ? {
                ...cursorsComp.defaultValues,
                ...(entity.instance.componentOverrides?.['comp_cursors'] || {})
            } : {};

            const speed = Number(cursorsProps.speed) || 2;
            const allowUp = cursorsProps.allowUp !== false;
            const allowDown = cursorsProps.allowDown !== false;
            const allowLeft = cursorsProps.allowLeft !== false;
            const allowRight = cursorsProps.allowRight !== false;

            switch (pressedKey) {
                case 'ArrowUp':
                    if (allowUp) entity.vy = isKeyDown ? -speed : 0;
                    break;
                case 'ArrowDown':
                    if (allowDown) entity.vy = isKeyDown ? speed : 0;
                    break;
                case 'ArrowLeft':
                    if (allowLeft) entity.vx = isKeyDown ? -speed : 0;
                    break;
                case 'ArrowRight':
                    if (allowRight) entity.vx = isKeyDown ? speed : 0;
                    break;
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
            // Prevent body scroll when modal is open
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
        } else {
            // Restore body scroll and cleanup
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);

            // Force layout recalculation after modal closes
            setTimeout(() => {
                // Fix parent containers that might have broken layout
                const mainContainer = document.querySelector('.flex-grow.flex.overflow-hidden');
                if (mainContainer instanceof HTMLElement) {
                    // Force re-render by toggling display
                    mainContainer.style.display = 'none';
                    mainContainer.offsetHeight; // Force reflow
                    mainContainer.style.display = '';
                }

                // Dispatch resize event
                window.dispatchEvent(new Event('resize'));

                // Force immediate reflow
                document.body.offsetHeight;
            }, 100);
        }
    }, [isOpen, graphData, gameFlowAssetName]);

    // Helper function to expand control options
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

        // Expand options to handle control selections
        const expandedOptions = expandMenuOptions(subMenuNode);
        const selectedExpanded = expandedOptions[selectedOptionIndex];
        if (!selectedExpanded) return;

        const selectedOption = subMenuNode.options[selectedExpanded.originalIndex];
        if (!selectedOption) return;

        // If it's a control option, save the selected control value to global variable
        if (selectedExpanded.isControlOption && selectedExpanded.controlValue && selectedOption.globalVariableName) {
            setGameGlobalVariables(prev => ({
                ...prev,
                [selectedOption.globalVariableName!]: selectedExpanded.controlValue
            }));
            console.log(`Global variable ${selectedOption.globalVariableName} set to: ${selectedExpanded.controlValue}`);
        }

        const connection = connections.find(c => c.from.nodeId === currentNode.id && c.from.sourceId === selectedOption.id);
        if (connection) {
            // Skip through waypoints automatically
            let targetNodeId = connection.to.nodeId;
            let targetNode = nodes.find(n => n.id === targetNodeId);

            // Keep following waypoints until we reach a non-waypoint node
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
                    // Restart node automatically goes to Start
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
                        // Skip through waypoints automatically
                        let targetNodeId = conn.to.nodeId;
                        let targetNode = nodes.find(n => n.id === targetNodeId);

                        // Keep following waypoints until we reach a non-waypoint node
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
    }, [currentNode, currentScreenMap, currentWorldMapGraph, handleScreenTransition, handleAction, handleGoBack, checkKeyTransitions, expandMenuOptions]);

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
            const steps = Math.max(10, Math.floor(duration / 50)); // At least 10 steps, 50ms per step

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
                        // Top
                        ctx.fillStyle = '#000000';
                        ctx.fillRect(left, top, right - left + 1, spiralStep);
                        top += spiralStep;
                        // Right
                        if (left <= right && top <= bottom) {
                            ctx.fillRect(right - spiralStep + 1, top, spiralStep, bottom - top + 1);
                            right -= spiralStep;
                        }
                        // Bottom
                        if (left <= right && top <= bottom) {
                            ctx.fillRect(left, bottom - spiralStep + 1, right - left + 1, spiralStep);
                            bottom -= spiralStep;
                        }
                        // Left
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
             // Don't clear screen for Transition nodes - they work on existing content
             if (currentNode.type !== 'Transition') {
                 // Use node-specific background color if available, otherwise black
                 let bgColor = '#000000';
                 if (currentNode.type === 'SubMenu') {
                     bgColor = (currentNode as GameFlowSubMenuNode).appearance?.colors?.background || '#000000';
                 } else if (currentNode.type === 'Text') {
                     bgColor = (currentNode as GameFlowTextNode).appearance?.colors?.background || '#000000';
                 }
                 ctx.fillStyle = bgColor;
                 ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
                 if (screenMapToRender) renderScreenToCanvas(canvas, screenMapToRender, tileset, currentScreenMode, TILE_SIZE);
             }
            switch (currentNode.type) {
                case 'Start':
                    // Only show text if this is the Main GameFlow
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

                    // Expand control options into separate menu items
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
                    const textNodeMessage = textNode.message;
                    const textNodeTitleDims = getTextDimensionsMSX1(textNodeTitle, 1);

                    // Render title
                    await drawTextAsync(textNodeTitle, (PREVIEW_WIDTH - textNodeTitleDims.width) / 2, 30, msxFontColorAttributes, textNodeFont, textNodeFontColorAttrs);

                    // Render message (split into lines if needed)
                    const words = textNodeMessage.split(' ');
                    let lines: string[] = [];
                    let currentLine = '';
                    const maxLineWidth = PREVIEW_WIDTH - 20; // 10px padding on each side

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

                    // Render "Press Fire to continue" prompt
                    const promptText = 'Press Fire to continue';
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
                    // End node simply returns control to parent if exists, otherwise terminates
                    if (gameFlowStack.length > 0) {
                        // Pop back to parent GameFlow
                        const { parentGraphData, returnNodeId, parentGameFlowName } = gameFlowStack[gameFlowStack.length - 1];
                        setGameFlowStack(prev => prev.slice(0, -1));

                        // Restore parent graph or null if returning to main
                        const restoredGraphData = gameFlowStack.length > 1
                            ? gameFlowStack[gameFlowStack.length - 2].parentGraphData
                            : graphData;

                        if (gameFlowStack.length > 1) {
                            setCurrentNestedGraphData(gameFlowStack[gameFlowStack.length - 2].parentGraphData);
                        } else {
                            setCurrentNestedGraphData(null);
                        }

                        // Restore parent GameFlow name
                        setCurrentExecutingGameFlowName(parentGameFlowName);

                        // Skip through waypoints to find the actual destination node
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
                    // If no parent, execution just stops here (no visual output)
                    break;
                case 'Restart':
                    const restartNode = currentNode as any; // GameFlowRestartNode
                    const restartTitle = restartNode.title || 'Restart';
                    const restartMessage = restartNode.message || 'Press Fire to restart';
                    const restartTitleDims = getTextDimensionsMSX1(restartTitle, 1);
                    // Render title
                    await drawTextAsync(restartTitle, (PREVIEW_WIDTH - restartTitleDims.width) / 2, 60, msxFontColorAttributes);
                    // Render message
                    const restartMsgDims = getTextDimensionsMSX1(restartMessage, 1);
                    await drawTextAsync(restartMessage, (PREVIEW_WIDTH - restartMsgDims.width) / 2, 90, msxFontColorAttributes);
                    // Render prompt
                    const restartPrompt = 'Press Fire to restart';
                    const restartPromptDims = getTextDimensionsMSX1(restartPrompt, 1);
                    await drawTextAsync(restartPrompt, (PREVIEW_WIDTH - restartPromptDims.width) / 2, PREVIEW_HEIGHT - 30, msxFontColorAttributes);
                    break;
                case 'Transition':
                    const transitionNode = currentNode as any;
                    const effect = transitionNode.effect || 'cls';
                    const duration = transitionNode.duration || 1000;
                    await applyTransitionEffect(effect, duration);

                    // Auto-advance to next node after transition
                    const transitionConn = connections.find(c => c.from.nodeId === currentNode.id);
                    if (transitionConn) {
                        let targetNodeId = transitionConn.to.nodeId;
                        let targetNode = nodes.find(n => n.id === targetNodeId);

                        // Skip through waypoints
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
                    const groupNode = currentNode as any; // GameFlowGroupNode
                    const groupGameFlowAsset = allAssets.find(a => a.id === groupNode.gameFlowAssetId && a.type === 'gameflow');

                    if (!groupNode.gameFlowAssetId || !groupGameFlowAsset) {
                        // Display error message
                        const groupTitle = groupNode.name || 'Group';
                        const groupTitleDims = getTextDimensionsMSX1(groupTitle, 1);
                        await drawTextAsync(groupTitle, (PREVIEW_WIDTH - groupTitleDims.width) / 2, 60, msxFontColorAttributes);

                        const noFlowText = groupNode.gameFlowAssetId ? 'GameFlow not found' : 'No GameFlow assigned';
                        const noFlowDims = getTextDimensionsMSX1(noFlowText, 1);
                        await drawTextAsync(noFlowText, (PREVIEW_WIDTH - noFlowDims.width) / 2, 90, msxFontColorAttributes);
                    } else {
                        // Execute nested GameFlow
                        const nestedGraphData = groupGameFlowAsset.data as GameFlowGraph;

                        // Find the connection from this Group node to determine return point
                        const exitConnection = connections.find(c => c.from.nodeId === currentNode.id);
                        const returnNodeId = exitConnection ? exitConnection.to.nodeId : currentNode.id;

                        // Push current parent context onto stack
                        setGameFlowStack(prev => [...prev, {
                            parentGraphData: currentGraphData,
                            returnNodeId,
                            parentGameFlowName: currentExecutingGameFlowName
                        }]);

                        // Set the nested graph as current
                        setCurrentNestedGraphData(nestedGraphData);

                        // Update the executing GameFlow name
                        setCurrentExecutingGameFlowName(groupGameFlowAsset.name);

                        // Find and navigate to the Start node of the nested GameFlow
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
                    // Update position
                    entityA.x += entityA.vx;
                    entityA.y += entityA.vy;
                    
                    // Apply screen boundary constraints to prevent entities from disappearing
                    const spriteWidth = entityA.sprite.size.width;
                    const spriteHeight = entityA.sprite.size.height;
                    
                    if (entityA.x < 0) {
                        entityA.x = 0;
                        entityA.vx = 0;
                    } else if (entityA.x + spriteWidth > PREVIEW_WIDTH) {
                        entityA.x = PREVIEW_WIDTH - spriteWidth;
                        entityA.vx = 0;
                    }
                    
                    if (entityA.y < 0) {
                        entityA.y = 0;
                        entityA.vy = 0;
                    } else if (entityA.y + spriteHeight > PREVIEW_HEIGHT) {
                        entityA.y = PREVIEW_HEIGHT - spriteHeight;
                        entityA.vy = 0;
                    }
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
                // Only animate entities that have animation component
                const animComp = entityA.template.components.find(c => c.definitionId === 'comp_animation');
                if (animComp && entityA.frameImages.length > 1 && now - entityA.lastFrameUpdateTime > ANIMATION_SPEED_MS) {
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
        isOpen, isDynamic, currentNode, currentScreenMap, allAssets, connections, currentGraphData,
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
                            backgroundColor: canvasBackgroundColor
                        }}
                    />
                    {cursorAsset && subMenuNode && (() => {
                        const expandedOpts = expandMenuOptions(subMenuNode);
                        const selectedText = expandedOpts[selectedOptionIndex]?.text || '';
                        return (
                            <img
                                src={createSpriteDataURL((cursorAsset.data as Sprite).frames[0].data, (cursorAsset.data as Sprite).size.width, (cursorAsset.data as Sprite).size.height)}
                                alt="cursor"
                                className="absolute pointer-events-none"
                                style={{
                                    left: ((PREVIEW_WIDTH - getTextDimensionsMSX1(selectedText, 1).width) / 2 - 16) * 2,
                                    top: ((80 + selectedOptionIndex * 12) - 4) * 2,
                                    imageRendering: 'pixelated',
                                    width: (cursorAsset.data as Sprite).size.width * 2,
                                    height: (cursorAsset.data as Sprite).size.height * 2,
                                }}
                            />
                        );
                    })()}
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
                    {currentNode?.type === 'WorldLink' && (() => {
                        const conn = connections.find(c => c.from.nodeId === currentNode.id);
                        return conn ? (
                            <Button onClick={() => {
                                // Skip through waypoints automatically
                                let targetNodeId = conn.to.nodeId;
                                let targetNode = nodes.find(n => n.id === targetNodeId);

                                // Keep following waypoints until we reach a non-waypoint node
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
                    <Button onClick={onClose} variant="primary" size="md">Close</Button>
                </div>
            </div>
        </div>
    );

    // Render modal in a portal to avoid layout issues
    return createPortal(modalContent, document.body);
};
