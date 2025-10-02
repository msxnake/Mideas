import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameFlowGraph, GameFlowNode, GameFlowConnection, Point, GameFlowSubMenuNode, GameFlowWorldLinkNode, GameFlowSubMenuOption, ProjectAsset, GameFlowEndNode, GameFlowTextNode, GameFlowRestartNode, GameFlowWaypointNode, ContextMenuItem } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon, TrashIcon, CodeIcon, ArrowsPointingOutIcon } from '../icons/MsxIcons';
import { AssetPickerModal } from '../modals/AssetPickerModal';
import { GameFlowPreviewModal } from '../modals/GameFlowPreviewModal';
import { SubMenuAppearanceEditor } from './SubMenuAppearanceEditor';
import { TextNodeEditor } from './TextNodeEditor';
import { Modal } from '../modals/Modal';
import { DEFAULT_MAIN_MENU_CONFIG } from '../../constants';
import { MSXFont, MSXFontColorAttributes, EntityTemplate, ComponentDefinition } from '../../types';

const NODE_WIDTH = 150;
const PORT_SIZE = 20;
const WAYPOINT_SIZE = 30; // Circular waypoint radius

const getNodeHeight = (node: GameFlowNode | NodeToPlace): number => {
    if (node.type === 'SubMenu' && node.options) {
        return 60 + (node.options.length * 15) + 30;
    }
    if (node.type === 'Waypoint') {
        return WAYPOINT_SIZE; // Circular waypoint
    }
    if (node.type === 'Transition') {
        return 80; // Compact transition node
    }
    return 100;
};

const getNodeWidth = (node: GameFlowNode | NodeToPlace): number => {
    if (node.type === 'Waypoint') {
        return WAYPOINT_SIZE;
    }
    return NODE_WIDTH;
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
    const nodeWidth = getNodeWidth(node);
    const basePos = node.position;

    // Waypoint - center point (circular node)
    if (node.type === 'Waypoint') {
        return { x: basePos.x + WAYPOINT_SIZE / 2, y: basePos.y + WAYPOINT_SIZE / 2 };
    }

    if (portId === 'in') {
        return { x: basePos.x, y: basePos.y + nodeHeight / 2 };
    }
    if (portId === 'out') {
        return { x: basePos.x + nodeWidth, y: basePos.y + nodeHeight / 2 };
    }
    if (node.type === 'SubMenu' && node.options) {
        const optionIndex = node.options.findIndex(opt => opt.id === portId);
        if (optionIndex !== -1) {
            const yOffset = (nodeHeight / (node.options.length + 1)) * (optionIndex + 1);
            return { x: basePos.x + nodeWidth, y: basePos.y + yOffset };
        }
    }
    return { x: basePos.x + nodeWidth, y: basePos.y + nodeHeight / 2 };
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
    /** Callback to open the editor for a text node. */
    onEditTextNode: (node: GameFlowTextNode) => void;
    /** Callback to open the editor for a restart node. */
    onEditRestartNode: (node: GameFlowRestartNode) => void;
    /** Callback to open the editor for a transition node. */
    onEditTransitionNode: (node: any) => void;
    /** Whether we are currently in linking mode (creating a connection). */
    isLinkingMode: boolean;
}> = ({ node, allAssets, onPortClick, isSelected, onSelect, onMouseDown, onContextMenu, onEditAppearance, onEditTextNode, onEditRestartNode, onEditTransitionNode, isLinkingMode }) => {
  const [isHovered, setIsHovered] = useState(false);
  const nodeHeight = getNodeHeight(node);
  const nodeColor =
      node.type === 'Start' ? 'hsl(120, 30%, 40%)'
    : node.type === 'SubMenu' ? 'hsl(220, 30%, 40%)'
    : node.type === 'WorldLink' ? 'hsl(340, 30%, 40%)'
    : node.type === 'Text' ? 'hsl(180, 30%, 40%)'
    : node.type === 'Restart' ? 'hsl(280, 30%, 40%)'
    : node.type === 'Transition' ? 'hsl(40, 60%, 40%)'
    : node.type === 'Waypoint' ? 'hsl(0, 0%, 30%)'
    : 'hsl(260, 30%, 40%)';

  const strokeColor = isSelected ? 'hsl(50, 100%, 70%)' :
      isHovered ? 'hsl(50, 100%, 85%)' :
      node.type === 'Start' ? 'hsl(120, 50%, 70%)'
    : node.type === 'SubMenu' ? 'hsl(220, 50%, 70%)'
    : node.type === 'WorldLink' ? 'hsl(340, 50%, 70%)'
    : node.type === 'Text' ? 'hsl(180, 50%, 70%)'
    : node.type === 'Restart' ? 'hsl(280, 50%, 70%)'
    : node.type === 'Transition' ? 'hsl(40, 70%, 60%)'
    : node.type === 'Waypoint' ? 'hsl(0, 0%, 50%)'
    : 'hsl(260, 50%, 70%)';

  const worldNode = node.type === 'WorldLink' ? allAssets.find(a => a.id === (node as GameFlowWorldLinkNode).worldAssetId) : null;

  const getTransitionEffectLabel = (effect: string): string => {
    const labels: Record<string, string> = {
      'cls': 'CLS',
      'dissolve_pixels': 'Disolver Píxeles',
      'dissolve_chars': 'Disolver Chars',
      'vertical_lines': 'Líneas Verticales',
      'horizontal_lines': 'Líneas Horizontales',
      'spiral': 'Espiral',
      'fill_white_squares': 'Cuadrados Blancos'
    };
    return labels[effect] || effect;
  };

  const nodeName =
      node.type === 'Start' ? 'Iniciar Partida'
    : node.type === 'SubMenu' ? (node as GameFlowSubMenuNode).title
    : node.type === 'WorldLink' ? `Mundo: ${worldNode?.name || '???'}`
    : node.type === 'End' ? (node as GameFlowEndNode).endType
    : node.type === 'Text' ? (node as GameFlowTextNode).title
    : node.type === 'Restart' ? 'Reiniciar'
    : node.type === 'Transition' ? getTransitionEffectLabel((node as any).effect)
    : node.type === 'Waypoint' ? '•'
    : node.id;
  const hasInput = node.type !== 'Start';
  const hasOutput = node.type !== 'End' && node.type !== 'Restart';

  const handleNodeClick = (e: React.MouseEvent) => {
    // Solo procesar click izquierdo (button 0)
    if (e.button !== 0) return;

    e.stopPropagation();

    // Waypoints: pueden iniciar y terminar conexiones
    if (node.type === 'Waypoint') {
      if (isLinkingMode) {
        // Terminar conexión en waypoint
        onPortClick(node.id, 'in');
      } else {
        // Iniciar conexión desde waypoint
        onPortClick(node.id, 'out');
      }
      return;
    }

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

  const nodeWidth = getNodeWidth(node);

  return (
    <g
      transform={`translate(${node.position.x}, ${node.position.y})`}
      onMouseDown={handleNodeMouseDown}
      onClick={handleNodeClick}
      onContextMenu={(e) => onContextMenu(e, node.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {node.type === 'Waypoint' ? (
        <>
          {/* Circular waypoint node */}
          <circle
            cx={WAYPOINT_SIZE / 2}
            cy={WAYPOINT_SIZE / 2}
            r={WAYPOINT_SIZE / 2}
            fill={nodeColor}
            stroke={strokeColor}
            strokeWidth={isSelected ? 2.5 : 1.5}
            style={{ cursor: isLinkingMode && hasInput ? 'crosshair' : 'grab' }}
          />
          <circle
            cx={WAYPOINT_SIZE / 2}
            cy={WAYPOINT_SIZE / 2}
            r={4}
            fill="white"
            className="pointer-events-none"
          />
        </>
      ) : (
        <>
          <rect
            width={nodeWidth}
            height={nodeHeight}
            fill={nodeColor}
            stroke={strokeColor}
            strokeWidth={isSelected ? 2.5 : 1.5}
            rx={5}
            ry={5}
            style={{ cursor: isLinkingMode && hasInput ? 'crosshair' : 'grab' }}
          />
          <text x={nodeWidth / 2} y={15} textAnchor="middle" fill="white" fontSize="10px" className="pixel-font select-none pointer-events-none">{node.type}</text>
          <text x={nodeWidth / 2} y={35} textAnchor="middle" fill="white" fontSize="14px" className="pixel-font select-none pointer-events-none">{nodeName}</text>
        </>
      )}

      {hasInput && node.type !== 'Waypoint' && (
        <g>
          {/* Puerto de entrada - solo visual cuando estamos en linking mode, todo el nodo es clickeable */}
          <rect x={-PORT_SIZE/2} y={nodeHeight/2 - PORT_SIZE/2} width={PORT_SIZE} height={PORT_SIZE} fill="hsl(200, 80%, 60%)" stroke="hsl(200, 80%, 70%)" style={{ pointerEvents: isLinkingMode ? 'none' : 'auto', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onPortClick(node.id, 'in'); }}/>
        </g>
      )}

      {hasOutput && node.type !== 'Waypoint' && (
        <rect x={nodeWidth - PORT_SIZE/2} y={nodeHeight/2 - PORT_SIZE/2} width={PORT_SIZE} height={PORT_SIZE} fill="hsl(50, 80%, 60%)" onClick={(e) => { e.stopPropagation(); onPortClick(node.id, 'out'); }} />
      )}

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

      {node.type === 'Text' && (
        <foreignObject x="10" y={nodeHeight - 30} width="130" height="25">
          <Button onClick={() => onEditTextNode(node as GameFlowTextNode)} size="xs">Edit</Button>
        </foreignObject>
      )}

      {node.type === 'Restart' && (
        <foreignObject x="10" y={nodeHeight - 30} width="130" height="25">
          <Button onClick={() => onEditRestartNode(node as GameFlowRestartNode)} size="xs">Edit</Button>
        </foreignObject>
      )}

      {node.type === 'Transition' && (
        <>
          <text x={nodeWidth / 2} y={nodeHeight - 15} textAnchor="middle" fill="hsl(40, 100%, 80%)" fontSize="9px" className="pixel-font select-none pointer-events-none">
            Transición
          </text>
          <foreignObject x="10" y={nodeHeight - 30} width="130" height="25">
            <Button onClick={() => onEditTransitionNode(node)} size="xs">Edit Effect</Button>
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
  const [isTextNodeModalOpen, setIsTextNodeModalOpen] = useState(false);
  const [editingTextNode, setEditingTextNode] = useState<GameFlowTextNode | null>(null);
  const [isRestartNodeModalOpen, setIsRestartNodeModalOpen] = useState(false);
  const [editingRestartNode, setEditingRestartNode] = useState<GameFlowRestartNode | null>(null);
  const [isTransitionNodeModalOpen, setIsTransitionNodeModalOpen] = useState(false);
  const [editingTransitionNode, setEditingTransitionNode] = useState<any>(null);

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

  const handleOpenTextNodeModal = (node: GameFlowTextNode) => {
    setEditingTextNode(node);
    setIsTextNodeModalOpen(true);
  };

  const handleCloseTextNodeModal = () => {
    setEditingTextNode(null);
    setIsTextNodeModalOpen(false);
  };

  const handleSaveTextNode = () => {
    if (editingTextNode) {
      const newNodes = nodes.map(n => n.id === editingTextNode.id ? editingTextNode : n);
      onUpdate({ nodes: newNodes });
    }
    handleCloseTextNodeModal();
  };

  const handleTextNodeChange = (newNode: GameFlowTextNode) => {
    setEditingTextNode(newNode);
  };

  const handleOpenRestartNodeModal = (node: GameFlowRestartNode) => {
    setEditingRestartNode(node);
    setIsRestartNodeModalOpen(true);
  };

  const handleCloseRestartNodeModal = () => {
    setEditingRestartNode(null);
    setIsRestartNodeModalOpen(false);
  };

  const handleSaveRestartNode = () => {
    if (editingRestartNode) {
      const newNodes = nodes.map(n => n.id === editingRestartNode.id ? editingRestartNode : n);
      onUpdate({ nodes: newNodes });
    }
    handleCloseRestartNodeModal();
  };

  const handleRestartNodeChange = (newNode: GameFlowRestartNode) => {
    setEditingRestartNode(newNode);
  };

  const handleOpenTransitionNodeModal = (node: any) => {
    setEditingTransitionNode(node);
    setIsTransitionNodeModalOpen(true);
  };

  const handleCloseTransitionNodeModal = () => {
    setEditingTransitionNode(null);
    setIsTransitionNodeModalOpen(false);
  };

  const handleSaveTransitionNode = () => {
    if (editingTransitionNode) {
      const newNodes = nodes.map(n => n.id === editingTransitionNode.id ? editingTransitionNode : n);
      onUpdate({ nodes: newNodes });
    }
    handleCloseTransitionNodeModal();
  };

  const handleTransitionNodeChange = (effect: string, duration: number) => {
    if (editingTransitionNode) {
      setEditingTransitionNode({ ...editingTransitionNode, effect, duration });
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
  const handleAddNode = (type: 'SubMenu' | 'WorldLink' | 'Text' | 'Restart' | 'Waypoint') => {
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
    } else if (type === 'Text') {
        newNodeData = {
            type: 'Text',
            title: 'Texto',
            message: 'Escribe tu mensaje aquí...',
            appearance: {
                colors: {
                    text: '#F3F3F3',
                    background: '#000000',
                    promptText: '#F3F3F3'
                }
            }
        };
        setNodeToPlace(newNodeData);
    } else if (type === 'Restart') {
        newNodeData = {
            type: 'Restart',
            title: 'Game Over',
            message: 'Press Fire to restart',
            appearance: {
                colors: {
                    text: '#F3F3F3',
                    background: '#000000',
                    promptText: '#F3F3F3'
                }
            }
        };
        setNodeToPlace(newNodeData);
    } else if (type === 'Transition') {
        newNodeData = {
            type: 'Transition',
            effect: 'cls',
            duration: 1000
        };
        setNodeToPlace(newNodeData);
    } else if (type === 'Waypoint') {
        newNodeData = {
            type: 'Waypoint'
        };
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
            const nodeWidth = getNodeWidth(nodeToPlace);
            const nodeHeight = getNodeHeight(nodeToPlace);
            const newNode: GameFlowNode = {
                ...nodeToPlace,
                id: `gfn_${Date.now()}`,
                position: { x: snapToGrid(pos.x - nodeWidth / 2), y: snapToGrid(pos.y - nodeHeight / 2) }
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

  const handleAutoLayout = () => {
    if (nodes.length === 0) return;

    // Constants for layout
    const HORIZONTAL_SPACING = 300;
    const VERTICAL_SPACING = 150;
    const START_X = 100;
    const START_Y = 100;

    // Build adjacency list from connections
    const adjacencyList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    nodes.forEach(node => {
      adjacencyList.set(node.id, []);
      inDegree.set(node.id, 0);
    });

    connections.forEach(conn => {
      const fromId = conn.from.nodeId;
      const toId = conn.to.nodeId;
      adjacencyList.get(fromId)?.push(toId);
      inDegree.set(toId, (inDegree.get(toId) || 0) + 1);
    });

    // Find start node (should be the one with type 'Start')
    const startNode = nodes.find(n => n.type === 'Start');
    if (!startNode) {
      alert('No Start node found. Auto-layout requires a Start node.');
      return;
    }

    // BFS to assign layers (horizontal levels)
    const layers = new Map<string, number>();
    const queue: string[] = [startNode.id];
    layers.set(startNode.id, 0);
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const currentLayer = layers.get(currentId) || 0;
      const neighbors = adjacencyList.get(currentId) || [];

      neighbors.forEach(neighborId => {
        const existingLayer = layers.get(neighborId);
        const newLayer = currentLayer + 1;

        if (existingLayer === undefined || newLayer > existingLayer) {
          layers.set(neighborId, newLayer);
        }

        if (!visited.has(neighborId)) {
          queue.push(neighborId);
        }
      });
    }

    // Group nodes by layer
    const nodesByLayer = new Map<number, string[]>();
    layers.forEach((layer, nodeId) => {
      if (!nodesByLayer.has(layer)) {
        nodesByLayer.set(layer, []);
      }
      nodesByLayer.get(layer)!.push(nodeId);
    });

    // Sort layers by key
    const sortedLayers = Array.from(nodesByLayer.keys()).sort((a, b) => a - b);

    // Position nodes
    const newPositions = new Map<string, Point>();

    sortedLayers.forEach((layerIndex) => {
      const nodesInLayer = nodesByLayer.get(layerIndex) || [];
      const x = START_X + (layerIndex * HORIZONTAL_SPACING);

      // Center nodes vertically in their layer
      const totalHeight = (nodesInLayer.length - 1) * VERTICAL_SPACING;
      const startY = START_Y - (totalHeight / 2);

      nodesInLayer.forEach((nodeId, index) => {
        const y = startY + (index * VERTICAL_SPACING);
        newPositions.set(nodeId, { x, y });
      });
    });

    // Apply new positions
    const updatedNodes = nodes.map(node => {
      const newPos = newPositions.get(node.id);
      if (newPos) {
        return { ...node, position: { x: snapToGrid(newPos.x), y: snapToGrid(newPos.y) } };
      }
      return node;
    });

    onUpdate({ nodes: updatedNodes });
  };

  return (
    <Panel title="Game Flow Editor" className="flex-grow flex flex-col bg-msx-bgcolor overflow-hidden select-none">
      <div className="p-2 border-b border-msx-border flex space-x-2 items-center">
        <Button onClick={() => handleAddNode('SubMenu')} size="sm" variant="secondary" icon={<PlusCircleIcon className="w-4 h-4"/>}>Add Submenu</Button>
        <Button onClick={() => handleAddNode('WorldLink')} size="sm" variant="secondary" icon={<PlusCircleIcon className="w-4 h-4"/>}>Add World Link</Button>
        <Button onClick={() => handleAddNode('Text')} size="sm" variant="secondary" icon={<PlusCircleIcon className="w-4 h-4"/>}>Add Text</Button>
        <Button onClick={() => handleAddNode('Restart')} size="sm" variant="secondary" icon={<PlusCircleIcon className="w-4 h-4"/>}>Add Restart</Button>
        <Button onClick={() => handleAddNode('Transition')} size="sm" variant="secondary" icon={<PlusCircleIcon className="w-4 h-4"/>}>Add Transition</Button>
        <Button onClick={() => handleAddNode('Waypoint')} size="sm" variant="ghost" icon={<PlusCircleIcon className="w-4 h-4"/>} title="Add waypoint for visual organization">Waypoint</Button>
        <Button onClick={handleAutoLayout} size="sm" variant="primary" icon={<ArrowsPointingOutIcon className="w-4 h-4"/>} title="Auto-arrange nodes in hierarchical layout">Auto Layout</Button>
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
            <GameFlowNodeComponent key={node.id} node={node} allAssets={allAssets} onPortClick={handlePortClick} isSelected={selectedNodeId === node.id} onSelect={handleNodeSelect} onMouseDown={handleNodeMouseDown} onContextMenu={handleContextMenu} onEditAppearance={handleOpenSubMenuModal} onEditTextNode={handleOpenTextNodeModal} onEditRestartNode={handleOpenRestartNodeModal} onEditTransitionNode={handleOpenTransitionNodeModal} isLinkingMode={isLinkingMode} />
          ))}
          {nodeToPlace && mousePosition && <g transform={`translate(${mousePosition.x - getNodeWidth(nodeToPlace)/2}, ${mousePosition.y - getNodeHeight(nodeToPlace)/2})`} opacity={0.6}><GameFlowNodeComponent node={{...nodeToPlace, id: 'ghost', position: {x:0, y:0}}} allAssets={allAssets} onPortClick={()=>{}} isSelected={false} onSelect={()=>{}} onMouseDown={()=>{}} onContextMenu={()=>{}} onEditAppearance={() => {}} onEditTextNode={() => {}} onEditRestartNode={() => {}} onEditTransitionNode={() => {}} isLinkingMode={false} /></g>}
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
      {isTextNodeModalOpen && editingTextNode && (
        <Modal isOpen={isTextNodeModalOpen} onClose={handleCloseTextNodeModal} title="Edit Text Node">
          <TextNodeEditor
            node={editingTextNode}
            onNodeChange={handleTextNodeChange}
            allAssets={allAssets}
          />
          <div className="flex justify-end p-4">
            <Button onClick={handleSaveTextNode}>Save</Button>
          </div>
        </Modal>
      )}
      {isRestartNodeModalOpen && editingRestartNode && (
        <Modal isOpen={isRestartNodeModalOpen} onClose={handleCloseRestartNodeModal} title="Edit Restart Node">
          <TextNodeEditor
            node={editingRestartNode as any}
            onNodeChange={handleRestartNodeChange as any}
            allAssets={allAssets}
          />
          <div className="flex justify-end p-4">
            <Button onClick={handleSaveRestartNode}>Save</Button>
          </div>
        </Modal>
      )}
      {isTransitionNodeModalOpen && editingTransitionNode && (
        <Modal isOpen={isTransitionNodeModalOpen} onClose={handleCloseTransitionNodeModal} title="Edit Transition Effect">
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Effect Type:</label>
              <select
                value={editingTransitionNode.effect}
                onChange={(e) => handleTransitionNodeChange(e.target.value, editingTransitionNode.duration || 1000)}
                className="w-full p-2 border border-msx-border bg-msx-bgcolor text-white rounded"
              >
                <option value="cls">CLS (Clear Screen)</option>
                <option value="dissolve_pixels">Disolver Píxeles</option>
                <option value="dissolve_chars">Disolver Chars</option>
                <option value="vertical_lines">Líneas Verticales</option>
                <option value="horizontal_lines">Líneas Horizontales</option>
                <option value="spiral">Espiral</option>
                <option value="fill_white_squares">Cuadrados Blancos</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Duration (ms):</label>
              <input
                type="number"
                value={editingTransitionNode.duration || 1000}
                onChange={(e) => handleTransitionNodeChange(editingTransitionNode.effect, parseInt(e.target.value) || 1000)}
                className="w-full p-2 border border-msx-border bg-msx-bgcolor text-white rounded"
                min="100"
                max="5000"
                step="100"
              />
            </div>
          </div>
          <div className="flex justify-end p-4">
            <Button onClick={handleSaveTransitionNode}>Save</Button>
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
