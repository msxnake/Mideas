import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameFlowGraph, ProjectAsset, GameFlowNode, GameFlowSubMenuNode, GameFlowWorldLinkNode, MSXFont, MSXFontColorAttributes, EntityTemplate, ScreenMap, Tile, WorldMapGraph, EntityInstance, WorldMapConnection } from '../../types';
import { Button } from '../common/Button';
import { renderMSX1TextToDataURL, getTextDimensionsMSX1 } from '../utils/msxFontRenderer';
import { renderScreenToCanvas } from '../utils/screenUtils';
import { ArrowUpIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon } from '../icons/MsxIcons';

const TILE_SIZE = 8;
const PREVIEW_WIDTH = 256;
const PREVIEW_HEIGHT = 192;

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
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number>();

  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [navigationStack, setNavigationStack] = useState<string[]>([]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);

  const [currentScreenMap, setCurrentScreenMap] = useState<ScreenMap | null>(null);
  const [currentWorldMapGraph, setCurrentWorldMapGraph] = useState<WorldMapGraph | null>(null);

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
        setCurrentScreenMap(null);
        setCurrentWorldMapGraph(null);
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
    } else {
        const worldLinkNode = nodes.find(n => n.id === currentNode?.id && n.type === 'WorldLink');
        if (worldLinkNode) {
            onClose();
        }
    }
  };

  const handleScreenTransition = useCallback((toNodeId: string) => {
    if (!currentWorldMapGraph) return;

    const nextScreenNode = currentWorldMapGraph.nodes.find(n => n.id === toNodeId);
    if (!nextScreenNode) return;

    const nextScreenAsset = allAssets.find(a => a.id === nextScreenNode.screenAssetId && a.type === 'screenmap');
    if (!nextScreenAsset) return;

    const nextScreenMap = nextScreenAsset.data as ScreenMap;
    setCurrentScreenMap(nextScreenMap);
  }, [currentWorldMapGraph, allAssets]);

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

  useEffect(() => {
    if (!isOpen) {
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        return;
    }

    const canvas = canvasRef.current;
    if (!canvas || !currentNode) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);

    if (currentNode.type === 'WorldLink' && !currentScreenMap) {
        const worldMapAsset = allAssets.find(a => a.id === (currentNode as GameFlowWorldLinkNode).worldAssetId && a.type === 'worldmap');
        if (!worldMapAsset) return;
        const worldMapGraph = worldMapAsset.data as WorldMapGraph;
        if (!worldMapGraph || !worldMapGraph.startScreenNodeId) return;

        setCurrentWorldMapGraph(worldMapGraph);

        const startScreenNode = worldMapGraph.nodes.find(n => n.id === worldMapGraph.startScreenNodeId);
        if (!startScreenNode) return;

        const screenMapAsset = allAssets.find(a => a.id === startScreenNode.screenAssetId && a.type === 'screenmap');
        if (!screenMapAsset) return;

        const screenMap = screenMapAsset.data as ScreenMap;
        setCurrentScreenMap(screenMap);
    }

    const animate = () => {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);

        if (currentScreenMap) {
            const tileset = allAssets.filter(a => a.type === 'tile').map(a => a.data as Tile);
            renderScreenToCanvas(canvas, currentScreenMap, tileset, currentScreenMode, TILE_SIZE);
        } else if (currentNode) {
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
        animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
    };

  }, [isOpen, currentNode, selectedOptionIndex, allAssets, connections, msxFont, msxFontColorAttributes, entityTemplates, currentScreenMode, currentScreenMap, handleKeyDown]);

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
        <div className="relative">
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
        <Button onClick={onClose} variant="primary" size="md" className="mt-4">Close</Button>
      </div>
    </div>
  );
};
