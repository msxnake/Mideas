import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameFlowGraph, GameFlowNode, GameFlowConnection, Point, GameFlowSubMenuNode, GameFlowWorldLinkNode, GameFlowSubMenuOption, ProjectAsset, GameFlowEndNode } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon } from '../icons/MsxIcons';
import { AssetPickerModal } from '../modals/AssetPickerModal';

const NODE_WIDTH = 150;
const NODE_HEIGHT = 100;
const PORT_SIZE = 10;

interface GameFlowEditorProps {
  gameFlowGraph: GameFlowGraph;
  onUpdate: (data: Partial<GameFlowGraph>) => void;
  allAssets: ProjectAsset[];
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
}

const getPortPosition = (node: GameFlowNode, portId: string): Point => {
    const basePos = node.position;
    if (portId === 'in') {
        return { x: basePos.x + NODE_WIDTH / 2, y: basePos.y };
    }
    if (portId === 'out') {
        return { x: basePos.x + NODE_WIDTH / 2, y: basePos.y + NODE_HEIGHT };
    }
    if (node.type === 'SubMenu' && node.options) {
        const optionIndex = node.options.findIndex(opt => opt.id === portId);
        if (optionIndex !== -1) {
            const yOffset = (NODE_HEIGHT / (node.options.length + 1)) * (optionIndex + 1);
            return { x: basePos.x + NODE_WIDTH, y: basePos.y + yOffset };
        }
    }
    return { x: basePos.x + NODE_WIDTH / 2, y: basePos.y + NODE_HEIGHT };
};

const GameFlowNodeComponent: React.FC<{
    node: GameFlowNode;
    allAssets: ProjectAsset[];
    onPortClick: (nodeId: string, portId: string) => void;
    isSelected: boolean;
    onSelect: (nodeId: string) => void;
}> = ({ node, allAssets, onPortClick, isSelected, onSelect }) => {
  // ... (rendering logic remains the same)
  const nodeColor =
      node.type === 'Start' ? 'hsl(120, 30%, 40%)'
    : node.type === 'SubMenu' ? 'hsl(220, 30%, 40%)'
    : node.type === 'WorldLink' ? 'hsl(340, 30%, 40%)'
    : 'hsl(260, 30%, 40%)';

  const strokeColor = isSelected ? 'hsl(50, 100%, 70%)' :
      node.type === 'Start' ? 'hsl(120, 50%, 70%)'
    : node.type === 'SubMenu' ? 'hsl(220, 50%, 70%)'
    : node.type === 'WorldLink' ? 'hsl(340, 50%, 70%)'
    : 'hsl(260, 50%, 70%)';

  const worldNode = node.type === 'WorldLink' ? allAssets.find(a => a.id === (node as GameFlowWorldLinkNode).worldAssetId) : null;
  const nodeName =
      node.type === 'Start' ? 'Iniciar Partida'
    : node.type === 'SubMenu' ? (node as GameFlowSubMenuNode).title
    : node.type === 'WorldLink' ? `Mundo: ${worldNode?.name || '???'}`
    : node.type === 'End' ? (node as GameFlowEndNode).endType
    : node.id;
  const hasInput = node.type !== 'Start';

  return (
    <g transform={`translate(${node.position.x}, ${node.position.y})`}>
      <rect width={NODE_WIDTH} height={NODE_HEIGHT} fill={nodeColor} stroke={strokeColor} strokeWidth={isSelected ? 2.5 : 1.5} rx={5} ry={5} onClick={() => onSelect(node.id)} style={{ cursor: 'pointer' }} />
      <text x={NODE_WIDTH / 2} y={15} textAnchor="middle" fill="white" fontSize="10px" className="pixel-font select-none pointer-events-none">{node.type}</text>
      <text x={NODE_WIDTH / 2} y={35} textAnchor="middle" fill="white" fontSize="14px" className="pixel-font select-none pointer-events-none">{nodeName}</text>
      {hasInput && <rect x={NODE_WIDTH / 2 - PORT_SIZE / 2} y={-PORT_SIZE/2} width={PORT_SIZE} height={PORT_SIZE} fill="hsl(200, 60%, 50%)" stroke="hsl(200, 80%, 70%)" onClick={(e) => { e.stopPropagation(); onPortClick(node.id, 'in'); }}/>}
      {node.type === 'Start' && <rect x={NODE_WIDTH / 2 - PORT_SIZE/2} y={NODE_HEIGHT - PORT_SIZE/2} width={PORT_SIZE} height={PORT_SIZE} fill="hsl(50, 80%, 60%)" onClick={(e) => { e.stopPropagation(); onPortClick(node.id, 'out'); }} />}
      {node.type === 'WorldLink' && <rect x={NODE_WIDTH / 2 - PORT_SIZE/2} y={NODE_HEIGHT - PORT_SIZE/2} width={PORT_SIZE} height={PORT_SIZE} fill="hsl(50, 80%, 60%)" onClick={(e) => { e.stopPropagation(); onPortClick(node.id, 'out'); }} />}
      {node.type === 'SubMenu' && node.options.map((option, index) => {
          const yOffset = (NODE_HEIGHT / (node.options.length + 1)) * (index + 1);
          return (
              <g key={option.id}>
                  <text x={10} y={yOffset + 4} fill="white" fontSize="10px">{option.text}</text>
                  <rect x={NODE_WIDTH - PORT_SIZE/2} y={yOffset - PORT_SIZE/2} width={PORT_SIZE} height={PORT_SIZE} fill="hsl(50, 80%, 60%)" onClick={(e) => { e.stopPropagation(); onPortClick(node.id, option.id); }}/>
              </g>
          )
      })}
    </g>
  );
};

export const GameFlowEditor: React.FC<GameFlowEditorProps> = ({ gameFlowGraph, onUpdate, allAssets, selectedNodeId, setSelectedNodeId }) => {
  const [linkingState, setLinkingState] = useState<{ fromNodeId: string; fromPortId: string; } | null>(null);
  const [assetPickerState, setAssetPickerState] = useState<{ isOpen: boolean; onSelect: ((assetId: string) => void) | null; }>({ isOpen: false, onSelect: null });
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState(`0 0 1000 700`);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [mousePosition, setMousePosition] = useState<Point | null>(null);

  const { nodes, connections, gridSize, zoomLevel, panOffset } = { ...gameFlowGraph, gridSize: gameFlowGraph.gridSize || 40, zoomLevel: gameFlowGraph.zoomLevel || 1, panOffset: gameFlowGraph.panOffset || { x: 0, y: 0 } };

  // ... (all other handler functions remain the same)
  const handlePortClick = (nodeId: string, portId: string) => {
      if (!linkingState) {
          setLinkingState({ fromNodeId: nodeId, fromPortId: portId });
      } else {
          if (linkingState.fromNodeId === nodeId) { setLinkingState(null); return; }
          const newConnection: GameFlowConnection = { id: `gfc_${Date.now()}`, from: { nodeId: linkingState.fromNodeId, sourceId: linkingState.fromPortId }, to: { nodeId: nodeId } };
          onUpdate({ connections: [...connections, newConnection] });
          setLinkingState(null);
      }
  };
  const snapToGrid = (value: number): number => Math.round(value / gridSize) * gridSize;
  const handleAddNode = (type: 'SubMenu' | 'WorldLink' | 'End') => {
    const newX = snapToGrid(panOffset.x + ((svgRef.current?.clientWidth || 1000) / zoomLevel) / 10);
    const newY = snapToGrid(panOffset.y + ((svgRef.current?.clientHeight || 700) / zoomLevel) / 10);
    if (type === 'SubMenu') {
      const newNode: GameFlowSubMenuNode = { id: `gfsmenu_${Date.now()}`, type: 'SubMenu', title: 'Nuevo Menú', options: [{ id: 'opt_1', text: 'Opción 1' }], position: { x: newX, y: newY } };
      onUpdate({ nodes: [...nodes, newNode] });
    } else if (type === 'WorldLink') {
      setAssetPickerState({ isOpen: true, onSelect: (worldAssetId) => {
          const newNode: GameFlowWorldLinkNode = { id: `gfwlink_${Date.now()}`, type: 'WorldLink', worldAssetId, position: { x: newX, y: newY } };
          onUpdate({ nodes: [...nodes, newNode] });
      }});
    } else if (type === 'End') {
      const newNode: GameFlowNode = {
        id: `gfend_${Date.now()}`,
        type: 'End',
        endType: 'Victory',
        message: 'You Win!',
        position: { x: newX, y: newY },
      };
      onUpdate({ nodes: [...nodes, newNode] });
    }
  };
  useEffect(() => {
    const vbWidth = (svgRef.current?.clientWidth || 1000) / zoomLevel;
    const vbHeight = (svgRef.current?.clientHeight || 700) / zoomLevel;
    setViewBox(`${panOffset.x} ${panOffset.y} ${vbWidth} ${vbHeight}`);
  }, [zoomLevel, panOffset, svgRef.current?.clientWidth, svgRef.current?.clientHeight]);
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const newZoomLevel = Math.max(0.1, Math.min(5, zoomLevel - e.deltaY * 0.001 * zoomLevel));
    onUpdate({ zoomLevel: newZoomLevel });
  };
  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 1 || (e.button === 0 && (e.ctrlKey || e.metaKey))) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      if (e.currentTarget) e.currentTarget.style.cursor = 'grabbing';
    } else {
        setSelectedNodeId(null);
        setLinkingState(null);
    }
  };
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      const dx = (e.clientX - panStart.x);
      const dy = (e.clientY - panStart.y);
      onUpdate({ panOffset: { x: panOffset.x - dx / zoomLevel, y: panOffset.y - dy / zoomLevel }});
      setPanStart({ x: e.clientX, y: e.clientY });
    } else if (linkingState && svgRef.current) {
        const svgPoint = svgRef.current.createSVGPoint();
        svgPoint.x = e.clientX;
        svgPoint.y = e.clientY;
        const CTM = svgRef.current.getScreenCTM()?.inverse();
        if(CTM) { setMousePosition(svgPoint.matrixTransform(CTM)); }
    }
  };
  const handleSvgMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) { setIsPanning(false); if (e.currentTarget) e.currentTarget.style.cursor = 'grab'; }
  };

  return (
    <Panel title="Game Flow Editor" className="flex-grow flex flex-col bg-msx-bgcolor overflow-hidden select-none">
      <div className="p-2 border-b border-msx-border flex space-x-2 items-center">
        <Button onClick={() => handleAddNode('SubMenu')} size="sm" variant="secondary" icon={<PlusCircleIcon className="w-4 h-4"/>}>Add Submenu</Button>
        <Button onClick={() => handleAddNode('WorldLink')} size="sm" variant="secondary" icon={<PlusCircleIcon className="w-4 h-4"/>}>Add World Link</Button>
        <Button onClick={() => handleAddNode('End')} size="sm" variant="secondary" icon={<PlusCircleIcon className="w-4 h-4"/>}>Add End</Button>
        <Button onClick={() => onUpdate({ panOffset: { x: 0, y: 0 }, zoomLevel: 1 })} size="sm" variant="ghost">Reset View</Button>
      </div>
      <div className="flex-grow relative overflow-hidden" style={{ background: '#1A101A' }}>
        <svg ref={svgRef} width="100%" height="100%" viewBox={viewBox} onWheel={handleWheel} onMouseDown={handleSvgMouseDown} onMouseMove={handleSvgMouseMove} onMouseUp={handleSvgMouseUp} style={{ cursor: isPanning ? 'grabbing' : 'grab' }}>
          <defs>
            <pattern id="gridPattern" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse"><path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/></pattern>
            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto"><polygon points="0 0, 6 2, 0 4" fill="hsl(150, 50%, 60%)" /></marker>
          </defs>
          <rect width="100%" height="100%" fill="url(#gridPattern)" />
          {connections.map(conn => {
              const fromNode = nodes.find(n => n.id === conn.from.nodeId);
              const toNode = nodes.find(n => n.id === conn.to.nodeId);
              if(!fromNode || !toNode) return null;
              const p1 = getPortPosition(fromNode, conn.from.sourceId || 'out');
              const p2 = getPortPosition(toNode, 'in');
              return <path key={conn.id} d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`} stroke="hsl(150, 50%, 60%)" strokeWidth={1.5} fill="none" markerEnd="url(#arrowhead)" />
          })}
          {nodes.map(node => (
            <GameFlowNodeComponent key={node.id} node={node} allAssets={allAssets} onPortClick={handlePortClick} isSelected={selectedNodeId === node.id} onSelect={setSelectedNodeId} />
          ))}
          {linkingState && mousePosition && (() => {
              const fromNode = nodes.find(n => n.id === linkingState.fromNodeId);
              if (!fromNode) return null;
              const p1 = getPortPosition(fromNode, linkingState.fromPortId);
              return <line x1={p1.x} y1={p1.y} x2={mousePosition.x} y2={mousePosition.y} stroke="hsl(50, 80%, 60%)" strokeWidth="2" strokeDasharray="4 2" />
          })()}
        </svg>
      </div>
      {assetPickerState.isOpen && (
        <AssetPickerModal isOpen={assetPickerState.isOpen} onClose={() => setAssetPickerState({ isOpen: false, onSelect: null })} onSelectAsset={(assetId) => { assetPickerState.onSelect?.(assetId); setAssetPickerState({ isOpen: false, onSelect: null }); }} assetTypeToPick={'screenmap'} allAssets={allAssets} currentSelectedId={null}/>
      )}
    </Panel>
  );
};
