import React, { useState, useEffect, useRef } from 'react';
import { GameFlowGraph, ProjectAsset, GameFlowNode, GameFlowSubMenuNode, GameFlowWorldLinkNode } from '../../types';
import { Button } from '../common/Button';

interface GameFlowPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  graphData: GameFlowGraph;
  allAssets: ProjectAsset[];
}

const PREVIEW_WIDTH = 256;
const PREVIEW_HEIGHT = 192;

export const GameFlowPreviewModal: React.FC<GameFlowPreviewModalProps> = ({
  isOpen,
  onClose,
  graphData,
  allAssets,
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

    ctx.font = '16px "MSX-Gothic", monospace';
    ctx.textAlign = 'center';

    switch (currentNode.type) {
        case 'Start':
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('Game Start', PREVIEW_WIDTH / 2, PREVIEW_HEIGHT / 2);
            // Automatically move to the next node after a delay
            setTimeout(() => {
                const conn = connections.find(c => c.from.nodeId === currentNode.id);
                if (conn) setCurrentNodeId(conn.to.nodeId);
            }, 1000);
            break;
        case 'SubMenu':
            const subMenuNode = currentNode as GameFlowSubMenuNode;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(subMenuNode.title, PREVIEW_WIDTH / 2, 40);

            subMenuNode.options.forEach((option, index) => {
                ctx.fillStyle = index === selectedOptionIndex ? '#FFFF00' : '#FFFFFF';
                ctx.fillText(option.text, PREVIEW_WIDTH / 2, 80 + index * 20);
            });
            break;
        case 'WorldLink':
            const worldLinkNode = currentNode as GameFlowWorldLinkNode;
            const asset = allAssets.find(a => a.id === worldLinkNode.worldAssetId);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('Loading World:', PREVIEW_WIDTH / 2, PREVIEW_HEIGHT / 2 - 10);
            ctx.fillText(asset ? asset.name : 'Unknown', PREVIEW_WIDTH / 2, PREVIEW_HEIGHT / 2 + 10);
            ctx.font = '12px "MSX-Gothic", monospace';
            ctx.fillStyle = '#AAAAAA';
            ctx.fillText('(Cannot go back from here)', PREVIEW_WIDTH / 2, PREVIEW_HEIGHT - 20);
            break;
        case 'End':
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('Game Over', PREVIEW_WIDTH / 2, PREVIEW_HEIGHT / 2);
            break;
    }

  }, [isOpen, currentNode, selectedOptionIndex, allAssets, connections]);

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
