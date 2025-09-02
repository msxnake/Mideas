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

const TILE_SIZE = 8;
const PREVIEW_WIDTH = 256;
const PREVIEW_HEIGHT = 192;
const ANIMATION_SPEED_MS = 200; // ms per frame

// Interface for entities that will be animated on the canvas
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
}

// Interface for component props
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
}

// Interface to enrich connection data with the target node ID
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
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const animationFrameId = useRef<number>();
    const entitiesRef = useRef<AnimatedEntity[]>([]);

    const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
    const [navigationStack, setNavigationStack] = useState<string[]>([]);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
    const [currentScreenMap, setCurrentScreenMap] = useState<ScreenMap | null>(null);
    const [currentWorldMapGraph, setCurrentWorldMapGraph] = useState<WorldMapGraph | null>(null);
    const [isDynamic, setIsDynamic] = useState(false);

    const { nodes, connections } = graphData;
    const currentNode = nodes.find(node => node.id === currentNodeId);

    // Effect to initialize or reset state when the modal is opened/closed
    useEffect(() => {
        if (isOpen) {
            modalRef.current?.focus();
            const startNode = nodes.find(n => n.type === 'Start');
            if (startNode) {
                setCurrentNodeId(startNode.id);
            }
            setNavigationStack([]);
            setSelectedOptionIndex(0);
            setCurrentScreenMap(null);
            setCurrentWorldMapGraph(null);
        } else {
             if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        }
    }, [isOpen, nodes]);

    // Handles selecting an option in a submenu
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

    // Handles going back in the navigation stack or closing the modal
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

    // Handles transitioning between screens in a world map
    const handleScreenTransition = useCallback((toNodeId: string) => {
        if (!currentWorldMapGraph) return;

        const nextScreenNode = currentWorldMapGraph.nodes.find(n => n.id === toNodeId);
        if (!nextScreenNode) return;

        const nextScreenAsset = allAssets.find(a => a.id === nextScreenNode.screenAssetId && a.type === 'screenmap');
        if (!nextScreenAsset) return;

        const nextScreenMap = nextScreenAsset.data as ScreenMap;
        setCurrentScreenMap(nextScreenMap);
    }, [currentWorldMapGraph, allAssets]);

    // Handles keyboard inputs for navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        e.preventDefault();
        if (!currentNode) return;

        if (currentNode.type === 'SubMenu') {
            const subMenuNode = currentNode as GameFlowSubMenuNode;
            switch (e.key) {
                case 'ArrowUp':
                    setSelectedOptionIndex(prev => Math.max(0, prev - 1));
                    break;
                case 'ArrowDown':
                    setSelectedOptionIndex(prev => Math.min(subMenuNode.options.length - 1, prev + 1));
                    break;
                case ' ':
                case 'Enter':
                    handleAction();
                    break;
                case 'Escape':
                    handleGoBack();
                    break;
            }
        } else if (currentNode.type === 'WorldLink') {
            const currentScreenNode = currentWorldMapGraph?.nodes.find(n => n.screenAssetId === currentScreenMap?.id);
            if (!currentScreenNode || !currentWorldMapGraph) return;

            const findAndTransition = (direction: 'north' | 'south' | 'east' | 'west') => {
                const outgoing = currentWorldMapGraph.connections.find(c => c.fromNodeId === currentScreenNode.id && c.fromDirection === direction);
                if (outgoing) {
                    handleScreenTransition(outgoing.toNodeId);
                    return;
                }
                const incoming = currentWorldMapGraph.connections.find(c => c.toNodeId === currentScreenNode.id && c.toDirection === direction);
                if (incoming) {
                    handleScreenTransition(incoming.fromNodeId);
                }
            };

            switch (e.key) {
                case 'ArrowUp': findAndTransition('north'); break;
                case 'ArrowDown': findAndTransition('south'); break;
                case 'ArrowLeft': findAndTransition('west'); break;
                case 'ArrowRight': findAndTransition('east'); break;
                case 'Escape': handleGoBack(); break;
            }
        }
    }, [currentNode, currentScreenMap, currentWorldMapGraph, handleScreenTransition, handleAction, handleGoBack]);

     // Effect to load the initial screen for a WorldLink node
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


    // Effect to prepare entities for animation when the screen map changes
    useEffect(() => {
        if (!isOpen || !currentScreenMap) {
            entitiesRef.current = [];
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

            // Determine sprite asset ID from overrides or template defaults
            let spriteAssetId: string | undefined;
            if (instance.componentOverrides) {
                for (const compId in instance.componentOverrides) {
                    if (instance.componentOverrides[compId]?.spriteAssetId) {
                        spriteAssetId = instance.componentOverrides[compId].spriteAssetId;
                        break;
                    }
                }
            }
            if (!spriteAssetId) {
                for (const comp of template.components) {
                    if (comp.defaultValues?.spriteAssetId) {
                        spriteAssetId = comp.defaultValues.spriteAssetId;
                        break;
                    }
                }
            }

            const spriteAsset = getAsset(spriteAssetId, 'sprite');
            const sprite = spriteAsset?.data as Sprite;
            if (!sprite?.frames?.length) return;

            // Pre-render frame images
            const frameImages = sprite.frames.map(frame => {
                const img = new Image();
                img.src = createSpriteDataURL(frame.data, sprite.size.width, sprite.size.height);
                return img;
            });

            // Pre-render mirrored frame images if applicable
            let mirroredFrameImages: HTMLImageElement[] | undefined;
            if (['right', 'left'].includes(sprite.facingDirection)) {
                mirroredFrameImages = sprite.frames.map(frame => {
                    const mirroredData = mirrorPixelDataHorizontally(frame.data as PixelData);
                    const img = new Image();
                    img.src = createSpriteDataURL(mirroredData, sprite.size.width, sprite.size.height);
                    return img;
                });
            } else if (['up', 'down'].includes(sprite.facingDirection)) {
                mirroredFrameImages = sprite.frames.map(frame => {
                    const mirroredData = mirrorPixelDataVertically(frame.data as PixelData);
                    const img = new Image();
                    img.src = createSpriteDataURL(mirroredData, sprite.size.width, sprite.size.height);
                    return img;
                });
            }

            // Setup patrol behavior
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
                if (dist > 0) {
                    vx = (dx / dist);
                    vy = (dy / dist);
                }
            }

            entitiesToAnimate.push({
                instance, template, sprite, x: startX, y: startY, vx, vy,
                frameImages, mirroredFrameImages, currentFrame: 0, lastFrameUpdateTime: 0,
            });
        });
        entitiesRef.current = entitiesToAnimate;
    }, [isOpen, currentScreenMap, allAssets, entityTemplates]);


    // Main drawing and animation effect
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
        
        // --- TEXT RENDERING LOGIC ---
        const drawTextAsync = (text: string, x: number, y: number, colorAttrs: MSXFontColorAttributes) => {
            return new Promise<void>((resolve) => {
                const textImg = new Image();
                textImg.onload = () => {
                    ctx.drawImage(textImg, x, y);
                    resolve();
                };
                textImg.src = renderMSX1TextToDataURL(text, msxFont, colorAttrs, 1, 1);
            });
        };
        
        const renderTextNodes = async () => {
             ctx.fillStyle = '#000000';
             ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
             if (screenMapToRender) {
                 renderScreenToCanvas(canvas, screenMapToRender, tileset, currentScreenMode, TILE_SIZE);
             }

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

        // --- ANIMATION LOGIC ---
        const animate = () => {
            ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
            if (screenMapToRender) {
                renderScreenToCanvas(canvas, screenMapToRender, tileset, currentScreenMode, TILE_SIZE);
            }

            const now = performance.now();
            entitiesRef.current.forEach(entity => {
                // Update position
                entity.x += entity.vx;
                entity.y += entity.vy;

                // Handle patrol boundaries
                const patrolComp = entity.instance.componentOverrides?.comp_patrol;
                if (patrolComp?.waypoint1_x !== undefined && patrolComp?.waypoint1_y !== undefined) {
                    const startPixelX = patrolComp.waypoint1_x;
                    const startPixelY = patrolComp.waypoint1_y;
                    const endPixelX = patrolComp.waypoint2_x ?? startPixelX;
                    const endPixelY = patrolComp.waypoint2_y ?? startPixelY;

                    if ((entity.vx > 0 && entity.x >= Math.max(startPixelX, endPixelX)) || (entity.vx < 0 && entity.x <= Math.min(startPixelX, endPixelX))) {
                         entity.vx = -entity.vx;
                    }
                    if ((entity.vy > 0 && entity.y >= Math.max(startPixelY, endPixelY)) || (entity.vy < 0 && entity.y <= Math.min(startPixelY, endPixelY))) {
                        entity.vy = -entity.vy;
                    }
                }

                // Update animation frame
                if (now - entity.lastFrameUpdateTime > ANIMATION_SPEED_MS) {
                    entity.currentFrame = (entity.currentFrame + 1) % entity.frameImages.length;
                    entity.lastFrameUpdateTime = now;
                }

                // Select correct image (normal or mirrored)
                let imageToDraw = entity.frameImages[entity.currentFrame];
                 if (entity.mirroredFrameImages) {
                    if (entity.sprite.facingDirection === 'right' && entity.vx < 0) imageToDraw = entity.mirroredFrameImages[entity.currentFrame];
                    else if (entity.sprite.facingDirection === 'left' && entity.vx > 0) imageToDraw = entity.mirroredFrameImages[entity.currentFrame];
                    else if (entity.sprite.facingDirection === 'up' && entity.vy > 0) imageToDraw = entity.mirroredFrameImages[entity.currentFrame];
                    else if (entity.sprite.facingDirection === 'down' && entity.vy < 0) imageToDraw = entity.mirroredFrameImages[entity.currentFrame];
                }

                if (imageToDraw) {
                    ctx.drawImage(imageToDraw, entity.x, entity.y);
                }
            });

            animationFrameId.current = requestAnimationFrame(animate);
        };
        
        // --- RENDER CONTROLLER ---
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }

        if (currentNode.type === 'WorldLink') {
            if (isDynamic) {
                animationFrameId.current = requestAnimationFrame(animate);
            } else { // Static render for WorldLink
                ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
                if (screenMapToRender) {
                    renderScreenToCanvas(canvas, screenMapToRender, tileset, currentScreenMode, TILE_SIZE);
                    entitiesRef.current.forEach(entity => {
                        if (entity.frameImages.length > 0) {
                            ctx.drawImage(entity.frameImages[0], entity.x, entity.y);
                        }
                    });
                }
            }
        } else { // Render text-based nodes
            renderTextNodes();
        }

        // Cleanup
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };

    }, [
        isOpen, isDynamic, currentNode, currentScreenMap, allAssets, connections,
        msxFont, msxFontColorAttributes, entityTemplates, currentScreenMode, selectedOptionIndex
    ]);


    if (!isOpen) return null;

    // Helper functions to determine available exits for the current screen
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
