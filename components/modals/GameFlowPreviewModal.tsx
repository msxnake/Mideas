import React, { useState, useEffect, useRef } from 'react';
import { GameFlowGraph, ProjectAsset, GameFlowNode, GameFlowSubMenuNode, GameFlowWorldLinkNode, MSXFont, MSXFontColorAttributes } from '../../types';
import { Button } from '../common/Button';
import { renderMSX1TextToDataURL, getTextDimensionsMSX1 } from '../utils/msxFontRenderer';

interface GameFlowPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  graphData: GameFlowGraph;
  allAssets: ProjectAsset[];
  msxFont: MSXFont;
  msxFontColorAttributes: MSXFontColorAttributes;
}

const PREVIEW_WIDTH = 256;
const PREVIEW_HEIGHT = 192;

export const GameFlowPreviewModal: React.FC<GameFlowPreviewModalProps> = ({
  isOpen,
  onClose,
  graphData,
  allAssets,
  msxFont,
  msxFontColorAttributes,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

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
    if (!isOpen || !canvasRef.current || !currentNode) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);

    const drawText = (text: string, x: number, y: number, colorAttrs: MSXFontColorAttributes) => {
        const textImg = new Image();
        textImg.onload = () => {
            ctx.drawImage(textImg, x, y);
        };
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
        case 'WorldLink':
            const worldLinkNode = currentNode as GameFlowWorldLinkNode;
            const asset = allAssets.find(a => a.id === worldLinkNode.worldAssetId);
            const worldText1 = 'Loading World:';
            const worldText2 = asset ? asset.name : 'Unknown';
            const worldDims1 = getTextDimensionsMSX1(worldText1, 1);
            const worldDims2 = getTextDimensionsMSX1(worldText2, 1);

            drawText(worldText1, (PREVIEW_WIDTH - worldDims1.width) / 2, PREVIEW_HEIGHT / 2 - 10, msxFontColorAttributes);
            drawText(worldText2, (PREVIEW_WIDTH - worldDims2.width) / 2, PREVIEW_HEIGHT / 2 + 10, msxFontColorAttributes);

            const noBackText = '(Cannot go back from here)';
            const noBackDims = getTextDimensionsMSX1(noBackText, 1);
            drawText(noBackText, (PREVIEW_WIDTH - noBackDims.width) / 2, PREVIEW_HEIGHT - 20, msxFontColorAttributes);
            break;
        case 'End':
            const endText = 'Game Over';
            const endDims = getTextDimensionsMSX1(endText, 1);
            drawText(endText, (PREVIEW_WIDTH - endDims.width) / 2, (PREVIEW_HEIGHT - endDims.height) / 2, msxFontColorAttributes);
            break;
    }

  }, [isOpen, currentNode, selectedOptionIndex, allAssets, connections, msxFont, msxFontColorAttributes]);

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
