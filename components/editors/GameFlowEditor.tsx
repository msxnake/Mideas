import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameFlowGraph, GameFlowNode, GameFlowConnection, Point, GameFlowSubMenuNode, GameFlowWorldLinkNode, GameFlowSubMenuOption, ProjectAsset, GameFlowEndNode, ContextMenuItem } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon, TrashIcon, CodeIcon } from '../icons/MsxIcons';
import { AssetPickerModal } from '../modals/AssetPickerModal';
import { GameFlowPreviewModal } from '../modals/GameFlowPreviewModal';
import { SubMenuAppearanceEditor } from './SubMenuAppearanceEditor';
import { Modal } from '../modals/Modal';
import { DEFAULT_MAIN_MENU_CONFIG } from '../../constants';
import { MSXFont, MSXFontColorAttributes, EntityTemplate, ComponentDefinition } from '../../types';

const NODE_WIDTH = 150;
const PORT_SIZE = 20;

const getNodeHeight = (node: GameFlowNode | NodeToPlace): number => {
    if (node.type === 'SubMenu' && node.options) {
        return 60 + (node.options.length * 15) + 30;
    }
    return 100;
};

type NodeToPlace = Omit<GameFlowNode, 'position' | 'id'> & { id?: string };

/**
 * Props for the GameFlowEditor component.
 */
interface GameFlowEditorProps {
  /** The game flow graph data to be edited. */
  gameFlowGraph: GameFlowGraph;
  /** Callback to update the game flow graph data. */
  onUpdate: (data: Partial<GameFlowGraph>) => void;
  /** A list of all project assets. */
  allAssets: ProjectAsset[];
  /** The ID of the currently selected node. */
  selectedNodeId: string | null;
  /** Callback to set the selected node ID. */
  setSelectedNodeId: (id: string | null) => void;
  /** Callback to show a context menu. */
  onShowContextMenu: (position: { x: number; y: number }, items: ContextMenuItem[]) => void;
  /** The MSX font data for rendering text. */
  msxFont: MSXFont;
  /** The font color attributes for SCREEN 2 mode. */
  msxFontColorAttributes: MSXFontColorAttributes;
  /** A list of all entity templates. */
  entityTemplates: EntityTemplate[];
  /** The current MSX screen mode. */
  currentScreenMode: string;
  /** The list of all component definitions. */
  componentDefinitions: ComponentDefinition[];
}

/**
 * Calculates the absolute position of a port on a node.
 * @param node The game flow node.
 * @param portId The ID of the port ('in', 'out', or an option ID for submenus).
 * @returns The x and y coordinates of the port.
 */
const getPortPosition = (node: GameFlowNode, portId: string): Point => {
    const nodeHeight = getNodeHeight(node);
    const basePos = node.position;
    if (portId === 'in') {
        return { x: basePos.x, y: basePos.y + nodeHeight / 2 };
    }
    if (portId === 'out') {
        return { x: basePos.x + NODE_WIDTH, y: basePos.y + nodeHeight / 2 };
    }
    if (node.type === 'SubMenu' && node.options) {
        const optionIndex = node.options.findIndex(opt => opt.id === portId);
        if (optionIndex !== -1) {
            const yOffset = (nodeHeight / (node.options.length + 1)) * (optionIndex + 1);
            return { x: basePos.x + NODE_WIDTH, y: basePos.y + yOffset };
        }
    }
    return { x: basePos.x + NODE_WIDTH, y: basePos.y + nodeHeight / 2 };
};

/**
 * A component that renders a single node in the game flow graph.
 */
const GameFlowNodeComponent: React.FC<{
    /** The node data to render. */
    node: GameFlowNode;
    /** A list of all project assets, used for resolving names. */
    allAssets: ProjectAsset[];
    /** Callback for when a port on the node is clicked. */
    onPortClick: (nodeId: string, portId: string) => void;
    /** Whether the node is currently selected. */
    isSelected: boolean;
    /** Callback for when the node is selected. */
    onSelect: (e: React.MouseEvent, nodeId: string) => void;
    /** Callback for when the mouse is pressed down on the node (for dragging). */
    onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
    /** Callback for when the node is right-clicked. */
    onContextMenu: (e: React.MouseEvent, nodeId: string) => void;
    /** Callback to open the appearance editor for a submenu node. */
    onEditAppearance: (node: GameFlowSubMenuNode) => void;
    /** Whether we are currently in linking mode (creating a connection). */
    isLinkingMode: boolean;
}> = ({ node, allAssets, onPortClick, isSelected, onSelect, onMouseDown, onContextMenu, onEditAppearance, isLinkingMode }) => {
  const [isHovered, setIsHovered] = useState(false);
  const nodeHeight = getNodeHeight(node);
  const nodeColor =
      node.type === 'Start' ? 'hsl(120, 30%, 40%)'
    : node.type === 'SubMenu' ? 'hsl(220, 30%, 40%)'
    : node.type === 'WorldLink' ? 'hsl(340, 30%, 40%)'
    : 'hsl(260, 30%, 40%)';

  const strokeColor = isSelected ? 'hsl(50, 100%, 70%)' :
      isHovered ? 'hsl(50, 100%, 85%)' :
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

  const handleNodeClick = (e: React.MouseEvent) => {
    // Solo procesar click izquierdo (button 0)
    if (e.button !== 0) return;

    e.stopPropagation();

    if (isLinkingMode && hasInput) {
      onPortClick(node.id, 'in');
    } else {
      onSelect(e, node.id);
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent) => {
    // Click derecho (button 2) - stopPropagation para prevenir otros handlers, luego dejar que onContextMenu lo maneje
    if (e.button === 2) {
      e.stopPropagation();
      return;
    }

    if (isLinkingMode) {
      e.stopPropagation();
    } else {
      onMouseDown(e, node.id);
    }
  };

  return (
    <g
      transform={`translate(${node.position.x}, ${node.position.y})`}
      onMouseDown={handleNodeMouseDown}
      onClick={handleNodeClick}
      onContextMenu={(e) => onContextMenu(e, node.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <rect
        width={NODE_WIDTH}
        height={nodeHeight}
        fill={nodeColor}
        stroke={strokeColor}
        strokeWidth={isSelected ? 2.5 : 1.5}
        rx={5}
        ry={5}
        style={{ cursor: isLinkingMode && hasInput ? 'crosshair' : 'grab' }}
      />
      <text x={NODE_WIDTH / 2} y={15} textAnchor="middle" fill="white" fontSize="10px" className="pixel-font select-none pointer-events-none">{node.type}</text>
      <text x={NODE_WIDTH / 2} y={35} textAnchor="middle" fill="white" fontSize="14px" className="pixel-font select-none pointer-events-none">{nodeName}</text>

      {hasInput && <rect x={-PORT_SIZE/2} y={nodeHeight/2 - PORT_SIZE/2} width={PORT_SIZE} height={PORT_SIZE} fill="hsl(200, 80%, 60%)" stroke="hsl(200, 80%, 70%)" onClick={(e) => { e.stopPropagation(); onPortClick(node.id, 'in'); }}/>}

      {node.type === 'Start' && <rect x={NODE_WIDTH - PORT_SIZE/2} y={nodeHeight/2 - PORT_SIZE/2} width={PORT_SIZE} height={PORT_SIZE} fill="hsl(50, 80%, 60%)" onClick={(e) => { e.stopPropagation(); onPortClick(node.id, 'out'); }} />}
      {node.type === 'WorldLink' && <rect x={NODE_WIDTH - PORT_SIZE/2} y={nodeHeight/2 - PORT_SIZE/2} width={PORT_SIZE} height={PORT_SIZE} fill="hsl(50, 80%, 60%)" onClick={(e) => { e.stopPropagation(); onPortClick(node.id, 'out'); }} />}

      {node.type === 'SubMenu' && (
        <>
          {node.options.map((option, index) => {
              const yOffset = 50 + (index * 15);
              return (
                  <g key={option.id}>
                      <text x={10} y={yOffset + 4} fill="white" fontSize="10px">{option.text}</text>
                      <rect x={NODE_WIDTH - PORT_SIZE/2} y={yOffset - PORT_SIZE/2} width={PORT_SIZE} height={PORT_SIZE} fill="hsl(50, 80%, 60%)" onClick={(e) => { e.stopPropagation(); onPortClick(node.id, option.id); }}/>
                  </g>
              )
          })}
          <foreignObject x="10" y={nodeHeight - 30} width="130" height="25">
            <Button onClick={() => onEditAppearance(node as GameFlowSubMenuNode)} size="xs">Edit Appearance</Button>
          </foreignObject>
        </>
      )}
    </g>
  );
};


/**
 * A node-based editor for creating and managing the game's flow and logic.
 * It provides a canvas for placing nodes, connecting them, and editing their properties.
 */
export const GameFlowEditor: React.FC<GameFlowEditorProps> = ({ gameFlowGraph, onUpdate, allAssets, selectedNodeId, setSelectedNodeId, onShowContextMenu, msxFont, msxFontColorAttributes, entityTemplates, currentScreenMode, componentDefinitions }) => {
  const [linkingState, setLinkingState] = useState<{ fromNodeId: string; fromPortId: string; } | null>(null);
  const [isLinkingMode, setIsLinkingMode] = useState(false);
  const [assetPickerState, setAssetPickerState] = useState<{ isOpen: boolean; onSelect: ((assetId: string) => void) | null; }>({ isOpen: false, onSelect: null });
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState(`0 0 1000 700`);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [mousePosition, setMousePosition] = useState<Point | null>(null);
  const [nodeToPlace, setNodeToPlace] = useState<NodeToPlace | null>(null);
  const [draggingState, setDraggingState] = useState<{ nodeId: string, offset: Point } | null>(null);
  const [previewMode, setPreviewMode] = useState<'preview' | 'play' | null>(null);
  const [isSubMenuModalOpen, setIsSubMenuModalOpen] = useState(false);
  const [editingSubMenu, setEditingSubMenu] = useState<GameFlowSubMenuNode | null>(null);

  const { nodes, connections, gridSize, zoomLevel, panOffset } = { ...gameFlowGraph, gridSize: gameFlowGraph.gridSize || 40, zoomLevel: gameFlowGraph.zoomLevel || 1, panOffset: gameFlowGraph.panOffset || { x: 0, y: 0 } };

  const handleDeleteNode = (nodeId: string) => {
    const nodesToDelete = new Set<string>([nodeId]);
    const queue = [nodeId];
    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId) continue;
      const outgoingConnections = connections.filter(c => c.from.nodeId === currentId);
      for (const conn of outgoingConnections) {
        const targetNodeId = conn.to.nodeId;
        if (!nodesToDelete.has(targetNodeId)) {
          nodesToDelete.add(targetNodeId);
          queue.push(targetNodeId);
        }
      }
    }
    const newNodes = nodes.filter(n => !nodesToDelete.has(n.id));
    const newConnections = connections.filter(c => !nodesToDelete.has(c.from.nodeId) && !nodesToDelete.has(c.to.nodeId));
    onUpdate({ nodes: newNodes, connections: newConnections });
  };

  const handleContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const menuItems: ContextMenuItem[] = [
      {
        label: 'Delete Node',
        icon: <TrashIcon className="w-4 h-4" />,
        onClick: () => handleDeleteNode(nodeId),
      },
    ];
    onShowContextMenu({ x: e.clientX, y: e.clientY }, menuItems);
  };

  const handleOpenSubMenuModal = (node: GameFlowSubMenuNode) => {
    setEditingSubMenu(node);
    setIsSubMenuModalOpen(true);
  };

  const handleCloseSubMenuModal = () => {
    setEditingSubMenu(null);
    setIsSubMenuModalOpen(false);
  };

  const handleSaveSubMenu = () => {
    if (editingSubMenu) {
      const newNodes = nodes.map(n => n.id === editingSubMenu.id ? editingSubMenu : n);
      onUpdate({ nodes: newNodes });
    }
    handleCloseSubMenuModal();
  };

  const handleAppearanceChange = (newAppearance: any) => {
    if (editingSubMenu) {
      setEditingSubMenu({ ...editingSubMenu, appearance: newAppearance });
    }
  };

  const handlePortClick = (nodeId: string, portId: string) => {
      // Si es un puerto de entrada (in) y estamos en linking mode, completar la conexión
      if (linkingState && portId === 'in') {
          if (linkingState.fromNodeId === nodeId) {
              // Cancelar si intentamos conectar al mismo nodo
              setLinkingState(null);
              setIsLinkingMode(false);
              return;
          }
          const newConnection: GameFlowConnection = { id: `gfc_${Date.now()}`, from: { nodeId: linkingState.fromNodeId, sourceId: linkingState.fromPortId }, to: { nodeId: nodeId } };
          onUpdate({ connections: [...connections, newConnection] });
          setLinkingState(null);
          setIsLinkingMode(false);
          return;
      }

      // Si es un puerto de salida (out o option) y NO estamos en linking mode, iniciar conexión
      if (!linkingState && portId !== 'in') {
          setLinkingState({ fromNodeId: nodeId, fromPortId: portId });
          setIsLinkingMode(true);
          return;
      }

      // Si es un puerto de salida y YA estamos en linking mode, cancelar y empezar uno nuevo
      if (linkingState && portId !== 'in') {
          setLinkingState({ fromNodeId: nodeId, fromPortId: portId });
          setIsLinkingMode(true);
          return;
      }
  };
  const snapToGrid = (value: number): number => Math.round(value / gridSize) * gridSize;
  const handleAddNode = (type: 'SubMenu' | 'WorldLink' | 'End') => {
    let newNodeData: NodeToPlace;
    if (type === 'SubMenu') {
        newNodeData = { 
            type: 'SubMenu', 
            title: 'Nuevo Menú', 
            options: [{ id: 'opt_1', text: 'Opción 1' }],
            appearance: {
                colors: DEFAULT_MAIN_MENU_CONFIG.menuColors,
            }
        };
        setNodeToPlace(newNodeData);
    } else if (type === 'WorldLink') {
        setAssetPickerState({ isOpen: true, onSelect: (worldAssetId) => {
            newNodeData = { type: 'WorldLink', worldAssetId };
            setNodeToPlace(newNodeData);
        }});
    } else if (type === 'End') {
        newNodeData = { type: 'End', endType: 'Victory', message: 'You Win!' };
        setNodeToPlace(newNodeData);
    }
  };
  const getPointFromEvent = (e: React.MouseEvent): Point | null => {
    if (!svgRef.current) return null;
    const svgPoint = svgRef.current.createSVGPoint();
    svgPoint.x = e.clientX;
    svgPoint.y = e.clientY;
    const CTM = svgRef.current.getScreenCTM()?.inverse();
    return CTM ? svgPoint.matrixTransform(CTM) : null;
  }
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
    if (nodeToPlace) {
        const pos = getPointFromEvent(e);
        if (pos) {
            const newNode: GameFlowNode = {
                ...nodeToPlace,
                id: `gfn_${Date.now()}`,
                position: { x: snapToGrid(pos.x - NODE_WIDTH / 2), y: snapToGrid(pos.y - getNodeHeight(nodeToPlace) / 2) }
            };
            onUpdate({ nodes: [...nodes, newNode] });
            setNodeToPlace(null);
        }
    } else if (e.button === 1 || (e.button === 0 && (e.ctrlKey || e.metaKey))) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      if (e.currentTarget) e.currentTarget.style.cursor = 'grabbing';
    } else if (!isLinkingMode) {
        setSelectedNodeId(null);
    } else {
        setLinkingState(null);
        setIsLinkingMode(false);
    }
  };
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (nodeToPlace) return;
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    const point = getPointFromEvent(e);
    if (node && point) {
        setDraggingState({ nodeId, offset: { x: node.position.x - point.x, y: node.position.y - point.y } });
        if (svgRef.current) svgRef.current.style.cursor = 'grabbing';
    }
  };
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const point = getPointFromEvent(e);
    if (!point) return;
    setMousePosition(point);
    if (isPanning) {
      const dx = (e.clientX - panStart.x);
      const dy = (e.clientY - panStart.y);
      onUpdate({ panOffset: { x: panOffset.x - dx / zoomLevel, y: panOffset.y - dy / zoomLevel }});
      setPanStart({ x: e.clientX, y: e.clientY });
    } else if (draggingState) {
        const newX = point.x + draggingState.offset.x;
        const newY = point.y + draggingState.offset.y;
        const updatedNodes = nodes.map(n => n.id === draggingState.nodeId ? {...n, position: {x: newX, y: newY}} : n);
        onUpdate({ nodes: updatedNodes });
    }
  };
  const handleSvgMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) { setIsPanning(false); if (svgRef.current) svgRef.current.style.cursor = 'grab'; }
    if (draggingState) {
        const node = nodes.find(n => n.id === draggingState.nodeId);
        if (node) {
            const updatedNodes = nodes.map(n => n.id === draggingState.nodeId ? {...n, position: {x: snapToGrid(n.position.x), y: snapToGrid(n.position.y)}} : n);
            onUpdate({nodes: updatedNodes});
        }
        setDraggingState(null);
        if (svgRef.current) svgRef.current.style.cursor = 'grab';
    }
  };
  const handleNodeSelect = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
  }

  return (
    <Panel title="Game Flow Editor" className="flex-grow flex flex-col bg-msx-bgcolor overflow-hidden select-none">
      <div className="p-2 border-b border-msx-border flex space-x-2 items-center">
        <Button onClick={() => handleAddNode('SubMenu')} size="sm" variant="secondary" icon={<PlusCircleIcon className="w-4 h-4"/>}>Add Submenu</Button>
        <Button onClick={() => handleAddNode('WorldLink')} size="sm" variant="secondary" icon={<PlusCircleIcon className="w-4 h-4"/>}>Add World Link</Button>
        <Button onClick={() => handleAddNode('End')} size="sm" variant="secondary" icon={<PlusCircleIcon className="w-4 h-4"/>}>Add End</Button>
        <Button onClick={() => onUpdate({ panOffset: { x: 0, y: 0 }, zoomLevel: 1 })} size="sm" variant="ghost">Reset View</Button>
        <div className="flex-grow" />
        <Button size="sm" variant="primary" onClick={() => setPreviewMode('preview')}>Preview</Button>
        <Button size="sm" variant="secondary" onClick={() => setPreviewMode('play')}>Play Game</Button>
      </div>
      <div className="flex-grow relative overflow-hidden" style={{ background: '#1A101A' }}>
        <svg ref={svgRef} width="100%" height="100%" viewBox={viewBox} onWheel={handleWheel} onMouseDown={handleSvgMouseDown} onMouseMove={handleSvgMouseMove} onMouseUp={handleSvgMouseUp} style={{ cursor: isPanning ? 'grabbing' : (draggingState ? 'grabbing' : 'grab') }}>
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
              return <path key={conn.id} data-testid={`connection-${conn.id}`} d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`} stroke="hsl(150, 50%, 60%)" strokeWidth={1.5} fill="none" markerEnd="url(#arrowhead)" />
          })}
          {nodes.map(node => (
            <GameFlowNodeComponent key={node.id} node={node} allAssets={allAssets} onPortClick={handlePortClick} isSelected={selectedNodeId === node.id} onSelect={handleNodeSelect} onMouseDown={handleNodeMouseDown} onContextMenu={handleContextMenu} onEditAppearance={handleOpenSubMenuModal} isLinkingMode={isLinkingMode} />
          ))}
          {nodeToPlace && mousePosition && <g transform={`translate(${mousePosition.x - NODE_WIDTH/2}, ${mousePosition.y - getNodeHeight(nodeToPlace)/2})`} opacity={0.6}><GameFlowNodeComponent node={{...nodeToPlace, id: 'ghost', position: {x:0, y:0}}} allAssets={allAssets} onPortClick={()=>{}} isSelected={false} onSelect={()=>{}} onMouseDown={()=>{}} onContextMenu={()=>{}} onEditAppearance={() => {}} isLinkingMode={false} /></g>}
          {linkingState && mousePosition && (() => {
              const fromNode = nodes.find(n => n.id === linkingState.fromNodeId);
              if (!fromNode) return null;
              const p1 = getPortPosition(fromNode, linkingState.fromPortId);
              return <line x1={p1.x} y1={p1.y} x2={mousePosition.x} y2={mousePosition.y} stroke="hsl(50, 80%, 60%)" strokeWidth="2" strokeDasharray="4 2" />
          })()}
        </svg>
      </div>
      {assetPickerState.isOpen && (
        <AssetPickerModal isOpen={assetPickerState.isOpen} onClose={() => setAssetPickerState({ isOpen: false, onSelect: null })} onSelectAsset={(assetId) => { assetPickerState.onSelect?.(assetId); setAssetPickerState({ isOpen: false, onSelect: null }); }} assetTypeToPick={'worldmap'} allAssets={allAssets} currentSelectedId={null}/>
      )}
      {isSubMenuModalOpen && editingSubMenu && (
        <Modal isOpen={isSubMenuModalOpen} onClose={handleCloseSubMenuModal} title="Edit Submenu Appearance">
          <SubMenuAppearanceEditor 
            appearance={editingSubMenu.appearance || {
                colors: DEFAULT_MAIN_MENU_CONFIG.menuColors,
            }} 
            onAppearanceChange={handleAppearanceChange} 
            allAssets={allAssets}
          />
          <div className="flex justify-end p-4">
            <Button onClick={handleSaveSubMenu}>Save</Button>
          </div>
        </Modal>
      )}
      {previewMode && (
        <GameFlowPreviewModal
          isOpen={!!previewMode}
          onClose={() => setPreviewMode(null)}
          initialIsDynamic={previewMode === 'play'}
          graphData={gameFlowGraph}
          allAssets={allAssets}
          msxFont={msxFont}
          msxFontColorAttributes={msxFontColorAttributes}
          entityTemplates={entityTemplates}
          currentScreenMode={currentScreenMode}
          componentDefinitions={componentDefinitions}
        />
      )}
    </Panel>
  );
};
