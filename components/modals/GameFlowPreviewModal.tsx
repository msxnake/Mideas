import React, { useState, useEffect, useRef } from 'react';
import { GameFlowGraph, ProjectAsset, GameFlowNode, GameFlowSubMenuNode, GameFlowWorldLinkNode, MSXFont, MSXFontColorAttributes, EntityTemplate, ScreenMap, Sprite, PixelData, Tile, AssetType } from '../../types';
import { Button } from '../common/Button';
import { renderMSX1TextToDataURL, getTextDimensionsMSX1 } from '../utils/msxFontRenderer';
import { renderScreenToCanvas, createSpriteDataURL } from '../utils/screenUtils';
import { mirrorPixelDataHorizontally, mirrorPixelDataVertically } from '../utils/spriteUtils';

const TILE_SIZE = 8;

interface GameFlowPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  graphData: GameFlowGraph;
  allAssets: ProjectAsset[];
  msxFont: MSXFont;
  msxFontColorAttributes: MSXFontColorAttributes;
  entityTemplates: EntityTemplate[];
  currentScreenMode: string;
}

// State for animating entities
interface AnimatedEntity {
  instance: any; // Using 'any' for instance as it's a mix from graph data, not a direct EntityInstance
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
const ANIMATION_SPEED_MS = 200; // ms per frame

const PREVIEW_WIDTH = 256;
const PREVIEW_HEIGHT = 192;

export const GameFlowPreviewModal: React.FC<GameFlowPreviewModalProps> = ({
  isOpen,
  onClose,
  graphData,
  allAssets,
  msxFont,
  msxFontColorAttributes,
  entityTemplates,
  currentScreenMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number>();
  const entitiesRef = useRef<AnimatedEntity[]>([]);

  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [navigationStack, setNavigationStack] = useState<string[]>([]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);

  const { nodes, connections } = graphData;
  const currentNode = nodes.find(node => node.id === currentNodeId);

  useEffect(() => {
    if (isOpen) {
        modalRef.current?.focus();
        const startNode = nodes.find(n => n.type === 'Start');
        if (startNode) {
            setCurrentNodeId(startNode.id);
        }
        setNavigationStack([]);
        setSelectedOptionIndex(0);
    }
  }, [isOpen, nodes]);

  const handleAction = () => {
    if (!currentNode || currentNode.type !== 'SubMenu') return;
    const subMenuNode = currentNode as GameFlowSubMenuNode;
    const selectedOption = subMenuNode.options[selectedOptionIndex];
    if (!selectedOption) return;

    const connection = connections.find(c => c.from.nodeId === currentNode.id && c.from.sourceId === selectedOption.id);
    if (connection) {
      setNavigationStack([...navigationStack, currentNode.id]);
      setCurrentNodeId(connection.to.nodeId);
      setSelectedOptionIndex(0);
    }
  };

  const handleGoBack = () => {
    if (navigationStack.length > 0) {
      const lastNodeId = navigationStack[navigationStack.length - 1];
      setNavigationStack(navigationStack.slice(0, -1));
      setCurrentNodeId(lastNodeId);
      setSelectedOptionIndex(0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
        if (e.key === 'Escape') {
            // As per instructions, do not allow going back from a world screen
        }
    }
  };

  useEffect(() => {
    if (!isOpen) {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
        return;
    };

    const canvas = canvasRef.current;
    if (!canvas || !currentNode) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Stop any previous animation before starting a new one
    if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
    }

    if (currentNode.type === 'WorldLink') {
        const screenMapAsset = allAssets.find(a => a.id === (currentNode as GameFlowWorldLinkNode).worldAssetId && a.type === 'screenmap');
        if (!screenMapAsset) return;
        const screenMap = screenMapAsset.data as ScreenMap;
        const tileset = allAssets.filter(a => a.type === 'tile').map(a => a.data as Tile);

        // Initialize entities for animation
        const entitiesToAnimate: AnimatedEntity[] = (screenMap.layers.entities || []).map(instance => {
            const template = entityTemplates.find(t => t.id === instance.entityTemplateId);
            if (!template) return null;

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

            const spriteAsset = allAssets.find(a => a.id === spriteAssetId && a.type === 'sprite');
            if (!spriteAsset || !spriteAsset.data) return null;
            const sprite = spriteAsset.data as Sprite;
            if (!sprite.frames || sprite.frames.length === 0) return null;

            const frameImages = sprite.frames.map(frame => {
                const img = new Image();
                img.src = createSpriteDataURL(frame.data, sprite.size.width, sprite.size.height);
                return img;
            });

            let mirroredFrameImages: HTMLImageElement[] | undefined = undefined;
            if (sprite.facingDirection === 'right' || sprite.facingDirection === 'left') {
                mirroredFrameImages = sprite.frames.map(frame => {
                    const mirroredData = mirrorPixelDataHorizontally(frame.data as PixelData);
                    const img = new Image();
                    img.src = createSpriteDataURL(mirroredData, sprite.size.width, sprite.size.height);
                    return img;
                });
            }

            const patrolComp = instance.componentOverrides?.comp_patrol;
            let vx = 0, vy = 0;
            let startX = instance.position.x * TILE_SIZE;
            let startY = instance.position.y * TILE_SIZE;
            let endX = startX;
            let endY = startY;

            if (patrolComp && patrolComp.waypoint1_x !== undefined && patrolComp.waypoint1_y !== undefined) {
                startX = patrolComp.waypoint1_x;
                startY = patrolComp.waypoint1_y;
                endX = patrolComp.waypoint2_x ?? startX;
                endY = patrolComp.waypoint2_y ?? startY;

                const dx = endX - startX;
                const dy = endY - startY;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist > 0) {
                    vx = (dx / dist);
                    vy = (dy / dist);
                }
            }

            return {
                instance, template, sprite,
                x: startX,
                y: startY,
                vx, vy,
                frameImages,
                mirroredFrameImages,
                currentFrame: 0,
                lastFrameUpdateTime: 0,
            };
        }).filter((e): e is AnimatedEntity => e !== null);

        entitiesRef.current = entitiesToAnimate;

        // Start animation loop
        let lastTimestamp = 0;
        const animate = (timestamp: number) => {
            if (lastTimestamp === 0) lastTimestamp = timestamp;

            ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
            renderScreenToCanvas(canvas, screenMap, tileset, currentScreenMode, TILE_SIZE);

            const updatedEntities = entitiesRef.current.map(entity => {
                let { x, y, vx, vy, currentFrame, lastFrameUpdateTime } = entity;

                x += vx;
                y += vy;

                const patrolComp = entity.instance.componentOverrides?.comp_patrol;
                let startPixelX = entity.instance.position.x * TILE_SIZE;
                let startPixelY = entity.instance.position.y * TILE_SIZE;
                let endPixelX = startPixelX;
                let endPixelY = startPixelY;

                if (patrolComp && patrolComp.waypoint1_x !== undefined && patrolComp.waypoint1_y !== undefined) {
                    startPixelX = patrolComp.waypoint1_x;
                    startPixelY = patrolComp.waypoint1_y;
                    endPixelX = patrolComp.waypoint2_x ?? startPixelX;
                    endPixelY = patrolComp.waypoint2_y ?? startPixelY;
                }

                if (vx > 0 && x >= Math.max(startPixelX, endPixelX)) { vx = -vx; x = Math.max(startPixelX, endPixelX); }
                if (vx < 0 && x <= Math.min(startPixelX, endPixelX)) { vx = -vx; x = Math.min(startPixelX, endPixelX); }
                if (vy > 0 && y >= Math.max(startPixelY, endPixelY)) { vy = -vy; y = Math.max(startPixelY, endPixelY); }
                if (vy < 0 && y <= Math.min(startPixelY, endPixelY)) { vy = -vy; y = Math.min(startPixelY, endPixelY); }

                const now = performance.now();
                if (now - lastFrameUpdateTime > ANIMATION_SPEED_MS) {
                    entity.currentFrame = (entity.currentFrame + 1) % entity.frameImages.length;
                    entity.lastFrameUpdateTime = now;
                }

                let imageToDraw = entity.frameImages[entity.currentFrame];
                if (entity.sprite.facingDirection === 'right' && vx < 0 && entity.mirroredFrameImages) {
                    imageToDraw = entity.mirroredFrameImages[entity.currentFrame];
                } else if (entity.sprite.facingDirection === 'left' && vx > 0 && entity.mirroredFrameImages) {
                    imageToDraw = entity.mirroredFrameImages[entity.currentFrame];
                }

                if (imageToDraw) {
                    ctx.drawImage(imageToDraw, x, y);
                }

                return { ...entity, x, y, vx, vy, currentFrame, lastFrameUpdateTime };
            });

            entitiesRef.current = updatedEntities;
            animationFrameId.current = requestAnimationFrame(animate);
        };
        animationFrameId.current = requestAnimationFrame(animate);

    } else {
        // Handle non-worldlink nodes (text-based rendering)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);

        const drawText = (text: string, x: number, y: number, colorAttrs: MSXFontColorAttributes) => {
            const textImg = new Image();
            textImg.onload = () => ctx.drawImage(textImg, x, y);
            textImg.src = renderMSX1TextToDataURL(text, msxFont, colorAttrs, 1, 1);
        };

        switch (currentNode.type) {
            case 'Start':
                const startText = 'Game Start';
                const startDims = getTextDimensionsMSX1(startText, 1);
                drawText(startText, (PREVIEW_WIDTH - startDims.width) / 2, (PREVIEW_HEIGHT - startDims.height) / 2, msxFontColorAttributes);
                setTimeout(() => {
                    const conn = connections.find(c => c.from.nodeId === currentNode.id);
                    if (conn) setCurrentNodeId(conn.to.nodeId);
                }, 1000);
                break;
            case 'SubMenu':
                const subMenuNode = currentNode as GameFlowSubMenuNode;
                const titleDims = getTextDimensionsMSX1(subMenuNode.title, 1);
                drawText(subMenuNode.title, (PREVIEW_WIDTH - titleDims.width) / 2, 40, msxFontColorAttributes);

                subMenuNode.options.forEach((option, index) => {
                    const optionText = option.text;
                    const optionDims = getTextDimensionsMSX1(optionText, 1);
                    const tempColorAttrs: MSXFontColorAttributes = JSON.parse(JSON.stringify(msxFontColorAttributes));
                    if (index === selectedOptionIndex) {
                        for(let i=0; i<optionText.length; i++){
                            tempColorAttrs[optionText.charCodeAt(i)] = Array(8).fill({ fg: '#FFFF00', bg: '#000000' });
                        }
                    }
                    drawText(optionText, (PREVIEW_WIDTH - optionDims.width) / 2, 80 + index * 12, tempColorAttrs);
                });
                break;
            case 'End':
                const endText = 'Game Over';
                const endDims = getTextDimensionsMSX1(endText, 1);
                drawText(endText, (PREVIEW_WIDTH - endDims.width) / 2, (PREVIEW_HEIGHT - endDims.height) / 2, msxFontColorAttributes);
                break;
        }
    }

    return () => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
    };

  }, [isOpen, currentNode, selectedOptionIndex, allAssets, connections, msxFont, msxFontColorAttributes, entityTemplates, currentScreenMode]);

  if (!isOpen) return null;

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
        <canvas
            ref={canvasRef}
            width={PREVIEW_WIDTH}
            height={PREVIEW_HEIGHT}
            className="border-2 border-msx-border"
            style={{
                width: PREVIEW_WIDTH * 2,
                height: PREVIEW_HEIGHT * 2,
                imageRendering: 'pixelated'
            }}
        />
        <Button onClick={onClose} variant="primary" size="md" className="mt-4">Close</Button>
      </div>
    </div>
  );
};
