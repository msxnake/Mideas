import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameFlowGraph, GameFlowNode, GameFlowConnection, Point, GameFlowSubMenuNode, GameFlowWorldLinkNode, GameFlowSubMenuOption, ProjectAsset, GameFlowEndNode, GameFlowTextNode, GameFlowRestartNode, GameFlowWaypointNode, GameFlowIfThenElseNode, ContextMenuItem, GameFlowGlobalsNode } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon, TrashIcon, CodeIcon, ArrowsPointingOutIcon, ScissorsIcon } from '../icons/MsxIcons';
import { AssetPickerModal } from '../modals/AssetPickerModal';
import { GameFlowPreviewModal } from '../modals/GameFlowPreviewModal';
import { GameFlowLogModal } from '../modals/GameFlowLogModalSimple';
import { SubMenuAppearanceEditor } from './SubMenuAppearanceEditor';
import { TextNodeEditor } from './TextNodeEditor';
import { GlobalsNodeEditor } from './GlobalsNodeEditor';
import { IfThenElseNodeEditor } from './IfThenElseNodeEditor';
import { Modal } from '../modals/Modal';
import { DEFAULT_MAIN_MENU_CONFIG } from '../../constants';
import { MSXFont, MSXFontColorAttributes, EntityTemplate, ComponentDefinition } from '../../types';
import { validateGameFlowBrowser } from '../../utils/gameFlowValidatorBrowser';

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
    if (node.type === 'IfThenElse') {
        return 90; // Height for if-then-else node with THEN and ELSE ports
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
  /** The name of the current GameFlow asset. */
  gameFlowAssetName: string;
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
    /** Callback to open the editor for a music node. */
    onEditMusicNode: (node: any) => void;
    /** Callback to open the editor for an if-then-else node. */
    onEditIfThenElseNode: (node: GameFlowIfThenElseNode) => void;
    /** Callback to open the editor for a globals node. */
    onEditGlobalsNode: (node: GameFlowGlobalsNode) => void;
    /** Whether we are currently in linking mode (creating a connection). */
    isLinkingMode: boolean;
    /** The name of the current GameFlow asset. */
    gameFlowAssetName?: string;
}> = ({ node, allAssets, onPortClick, isSelected, onSelect, onMouseDown, onContextMenu, onEditAppearance, onEditTextNode, onEditRestartNode, onEditTransitionNode, onEditMusicNode, onEditIfThenElseNode, onEditGlobalsNode, isLinkingMode, gameFlowAssetName }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isInPortHovered, setIsInPortHovered] = useState(false);
  const [blinkOn, setBlinkOn] = useState(false);
  const nodeHeight = getNodeHeight(node);
  const isMainGameFlow = gameFlowAssetName === 'Main';
  const nodeColor =
      node.type === 'Start' ? (isMainGameFlow ? 'hsl(0, 100%, 50%)' : 'hsl(120, 30%, 40%)')
    : node.type === 'SubMenu' ? 'hsl(220, 30%, 40%)'
    : node.type === 'WorldLink' ? 'hsl(340, 30%, 40%)'
    : node.type === 'Text' ? 'hsl(180, 30%, 40%)'
    : node.type === 'Restart' ? 'hsl(280, 30%, 40%)'
    : node.type === 'Transition' ? 'hsl(40, 60%, 40%)'
    : node.type === 'Group' ? 'hsl(270, 50%, 45%)'
    : node.type === 'IfThenElse' ? 'hsl(30, 70%, 45%)'
    : node.type === 'Globals' ? 'hsl(200, 60%, 40%)'
    : node.type === 'Waypoint' ? 'hsl(0, 0%, 30%)'
    : 'hsl(260, 30%, 40%)';

  const strokeColor = isSelected ? 'hsl(50, 100%, 70%)' :
      isHovered ? 'hsl(50, 100%, 85%)' :
      node.type === 'Start' ? (isMainGameFlow ? 'hsl(0, 100%, 60%)' : 'hsl(120, 50%, 70%)')
    : node.type === 'SubMenu' ? 'hsl(220, 50%, 70%)'
    : node.type === 'WorldLink' ? 'hsl(340, 50%, 70%)'
    : node.type === 'Text' ? 'hsl(180, 50%, 70%)'
    : node.type === 'Restart' ? 'hsl(280, 50%, 70%)'
    : node.type === 'Transition' ? 'hsl(40, 70%, 60%)'
    : node.type === 'Group' ? 'hsl(270, 60%, 65%)'
    : node.type === 'IfThenElse' ? 'hsl(30, 80%, 65%)'
    : node.type === 'Globals' ? 'hsl(200, 70%, 60%)'
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

  const groupGameFlow = node.type === 'Group' ? allAssets.find(a => a.id === (node as any).gameFlowAssetId && a.type === 'gameflow') : null;
  const musicTrack = node.type === 'Music' ? allAssets.find(a => a.id === (node as any).trackAssetId && a.type === 'track') : null;

  const nodeName =
      node.type === 'Start' ? (isMainGameFlow ? 'Main' : 'Start')
    : node.type === 'SubMenu' ? (node as GameFlowSubMenuNode).title
    : node.type === 'WorldLink' ? `Mundo: ${worldNode?.name || '???'}`
    : node.type === 'End' ? (node as GameFlowEndNode).endType
    : node.type === 'Text' ? (node as GameFlowTextNode).title
    : node.type === 'Music' ? ((node as any).stop ? 'Stop Music' : (musicTrack?.name || 'Music'))
    : node.type === 'Restart' ? 'Reiniciar'
    : node.type === 'Transition' ? getTransitionEffectLabel((node as any).effect)
    : node.type === 'Group' ? (node as any).name || 'Group'
    : node.type === 'IfThenElse' ? `${(node as any).variableName || 'Goal'} ${(node as any).operator || '=='} ${(node as any).compareValue || 'Completed'}`
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
  const shouldBlinkInPort = isLinkingMode && hasInput && isInPortHovered;
  useEffect(() => {
    if (!shouldBlinkInPort) {
      setBlinkOn(false);
      return;
    }
    const id = window.setInterval(() => setBlinkOn(prev => !prev), 450);
    return () => window.clearInterval(id);
  }, [shouldBlinkInPort]);

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
          <text
            x={nodeWidth / 2}
            y={35}
            textAnchor="middle"
            fill={node.type === 'Start' && isMainGameFlow ? '#000000' : 'white'}
            fontSize="14px"
            fontWeight={node.type === 'Start' && isMainGameFlow ? 'bold' : 'normal'}
            className="pixel-font select-none pointer-events-none"
          >
            {nodeName}
          </text>
        </>
      )}

      {hasInput && node.type !== 'Waypoint' && (
        <g>
          {/* Puerto de entrada - clickeable también en linking mode para terminar conexiones */}
          <rect
            x={-PORT_SIZE / 2}
            y={nodeHeight / 2 - PORT_SIZE / 2}
            width={PORT_SIZE}
            height={PORT_SIZE}
            fill={blinkOn ? 'hsl(120, 80%, 55%)' : 'hsl(200, 80%, 60%)'}
            stroke={blinkOn ? 'hsl(120, 80%, 70%)' : 'hsl(200, 80%, 70%)'}
            style={{ cursor: isLinkingMode ? 'crosshair' : 'pointer' }}
            onClick={(e) => { e.stopPropagation(); onPortClick(node.id, 'in'); }}
            onMouseEnter={() => setIsInPortHovered(true)}
            onMouseLeave={() => setIsInPortHovered(false)}
          />
        </g>
      )}

      {hasOutput && node.type !== 'Waypoint' && node.type !== 'IfThenElse' && (
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

      {node.type === 'IfThenElse' && (
        <>
          {/* THEN port (top right) */}
          <g>
            <text x={nodeWidth - 15} y={25} textAnchor="end" fill="hsl(120, 100%, 70%)" fontSize="9px" fontWeight="bold" className="pixel-font select-none pointer-events-none">THEN</text>
            <rect x={nodeWidth - PORT_SIZE/2} y={20 - PORT_SIZE/2} width={PORT_SIZE} height={PORT_SIZE} fill="hsl(120, 80%, 60%)" onClick={(e) => { e.stopPropagation(); onPortClick(node.id, 'then'); }}/>
          </g>
          {/* ELSE port (bottom right) */}
          <g>
            <text x={nodeWidth - 15} y={nodeHeight - 15} textAnchor="end" fill="hsl(0, 100%, 70%)" fontSize="9px" fontWeight="bold" className="pixel-font select-none pointer-events-none">ELSE</text>
            <rect x={nodeWidth - PORT_SIZE/2} y={nodeHeight - 20 - PORT_SIZE/2} width={PORT_SIZE} height={PORT_SIZE} fill="hsl(0, 80%, 60%)" onClick={(e) => { e.stopPropagation(); onPortClick(node.id, 'else'); }}/>
          </g>
          <foreignObject x="10" y={nodeHeight - 30} width="130" height="25">
            <Button onClick={() => onEditIfThenElseNode(node as GameFlowIfThenElseNode)} size="xs">Edit Condition</Button>
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

      {node.type === 'Music' && (
        <foreignObject x="10" y={nodeHeight - 30} width="130" height="25">
          <Button onClick={() => onEditMusicNode(node)} size="xs">Edit</Button>
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

      {node.type === 'Globals' && (
        <foreignObject x="10" y={nodeHeight - 30} width="130" height="25">
          <Button onClick={() => onEditGlobalsNode(node as GameFlowGlobalsNode)} size="xs">Edit</Button>
        </foreignObject>
      )}

      {node.type === 'Group' && (
        <>
          <text x={nodeWidth / 2} y={nodeHeight - 35} textAnchor="middle" fill="hsl(270, 100%, 85%)" fontSize="9px" className="pixel-font select-none pointer-events-none">
            {groupGameFlow ? `→ ${groupGameFlow.name}` : 'Sin asignar'}
          </text>
          <text x={nodeWidth / 2} y={nodeHeight - 23} textAnchor="middle" fill="hsl(270, 80%, 70%)" fontSize="8px" className="pixel-font select-none pointer-events-none">
            GameFlow
          </text>
        </>
      )}
    </g>
  );
};


/**
 * A node-based editor for creating and managing the game's flow and logic.
 * It provides a canvas for placing nodes, connecting them, and editing their properties.
 */
export const GameFlowEditor: React.FC<GameFlowEditorProps> = ({ gameFlowGraph, onUpdate, allAssets, selectedNodeId, setSelectedNodeId, onShowContextMenu, msxFont, msxFontColorAttributes, entityTemplates, currentScreenMode, componentDefinitions, gameFlowAssetName }) => {
  const [linkingState, setLinkingState] = useState<{ fromNodeId: string; fromPortId: string; } | null>(null);
  const [isLinkingMode, setIsLinkingMode] = useState(false);
  const [isCutMode, setIsCutMode] = useState(false);
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
  const [isMusicNodeModalOpen, setIsMusicNodeModalOpen] = useState(false);
  const [editingMusicNode, setEditingMusicNode] = useState<any>(null);
  const [isIfThenElseModalOpen, setIsIfThenElseModalOpen] = useState(false);
  const [editingIfThenElseNode, setEditingIfThenElseNode] = useState<GameFlowIfThenElseNode | null>(null);
  const [isGlobalsNodeModalOpen, setIsGlobalsNodeModalOpen] = useState(false);
  const [editingGlobalsNode, setEditingGlobalsNode] = useState<GameFlowGlobalsNode | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [hasInitializedView, setHasInitializedView] = useState(false);

  // View state: Don't save to JSON, keep as local component state
  const [localZoomLevel, setLocalZoomLevel] = useState(1);
  const [localPanOffset, setLocalPanOffset] = useState<Point>({ x: 0, y: 0 });

  const { nodes, connections, gridSize } = { ...gameFlowGraph, gridSize: gameFlowGraph.gridSize || 40 };

  // Use local state for view, not JSON values
  const zoomLevel = localZoomLevel;
  const panOffset = localPanOffset;

  const handleResetView = useCallback(() => {
    if (nodes.length === 0) {
      setLocalZoomLevel(1);
      setLocalPanOffset({ x: 0, y: 0 });
      return;
    }

    // Get SVG dimensions - validate they are reasonable
    const svgWidth = svgRef.current?.clientWidth || 0;
    const svgHeight = svgRef.current?.clientHeight || 0;

    // Skip if SVG dimensions are invalid (likely still rendering)
    if (svgWidth < 200 || svgHeight < 200) {
      return;
    }

    // Calculate bounding box of all nodes
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach(node => {
      const nodeWidth = getNodeWidth(node);
      const nodeHeight = getNodeHeight(node);

      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
    });

    // Add padding
    const PADDING = 50;
    minX -= PADDING;
    minY -= PADDING;
    maxX += PADDING;
    maxY += PADDING;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Calculate zoom to fit all nodes
    const zoomX = svgWidth / contentWidth;
    const zoomY = svgHeight / contentHeight;
    const newZoomLevel = Math.min(zoomX, zoomY, 1); // Don't zoom in more than 100%

    // Center the content
    const newPanOffset = {
      x: minX,
      y: minY
    };

    // Update local view state (don't save to JSON)
    setLocalZoomLevel(newZoomLevel);
    setLocalPanOffset(newPanOffset);
  }, [nodes]);

  // Auto-fit view when GameFlow asset changes (only on initial load)
  useEffect(() => {
    if (nodes.length > 0 && !hasInitializedView) {
      // Delay to ensure SVG is rendered
      setTimeout(() => {
        handleResetView();
        setHasInitializedView(true);
      }, 200);
    }
  }, [gameFlowAssetName, hasInitializedView, handleResetView, nodes.length]);

  // Reset initialization flag when changing GameFlow assets
  useEffect(() => {
    setHasInitializedView(false);
  }, [gameFlowAssetName])

  // Listen for window resize events (triggered after modal closes)
  useEffect(() => {
    const handleWindowResize = () => {
      // Force view re-initialization after resize (e.g., when modal closes)
      setHasInitializedView(false);
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

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

  const handleDeleteConnection = (connectionId: string) => {
    const newConnections = connections.filter(c => c.id !== connectionId);
    onUpdate({ connections: newConnections });
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

  const handleOpenGlobalsNodeModal = (node: GameFlowGlobalsNode) => {
    setEditingGlobalsNode(node);
    setIsGlobalsNodeModalOpen(true);
  };

  const handleCloseGlobalsNodeModal = () => {
    setEditingGlobalsNode(null);
    setIsGlobalsNodeModalOpen(false);
  };

  const handleSaveGlobalsNode = () => {
    if (editingGlobalsNode) {
      const newNodes = nodes.map(n => n.id === editingGlobalsNode.id ? editingGlobalsNode : n);
      onUpdate({ nodes: newNodes });
    }
    handleCloseGlobalsNodeModal();
  };

  const handleTextNodeChange = (newNode: GameFlowTextNode) => {
    setEditingTextNode(newNode);
  };

  const handleOpenMusicNodeModal = (node: any) => {
    setEditingMusicNode(node);
    setIsMusicNodeModalOpen(true);
  };

  const handleCloseMusicNodeModal = () => {
    setEditingMusicNode(null);
    setIsMusicNodeModalOpen(false);
  };

  const handleSaveMusicNode = () => {
    if (editingMusicNode) {
      const newNodes = nodes.map(n => n.id === editingMusicNode.id ? editingMusicNode : n);
      onUpdate({ nodes: newNodes });
    }
    handleCloseMusicNodeModal();
  };

  const handleMusicNodeChange = (field: string, value: any) => {
    if (editingMusicNode) {
      setEditingMusicNode({ ...editingMusicNode, [field]: value });
    }
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

  const handleOpenIfThenElseModal = (node: GameFlowIfThenElseNode) => {
    setEditingIfThenElseNode(node);
    setIsIfThenElseModalOpen(true);
  };

  const handleCloseIfThenElseModal = () => {
    setEditingIfThenElseNode(null);
    setIsIfThenElseModalOpen(false);
  };

  const handleSaveIfThenElseNode = () => {
    if (editingIfThenElseNode) {
      const newNodes = nodes.map(n => n.id === editingIfThenElseNode.id ? editingIfThenElseNode : n);
      onUpdate({ nodes: newNodes });
    }
    handleCloseIfThenElseModal();
  };

  const handleIfThenElseNodeChange = (newNode: GameFlowIfThenElseNode) => {
    setEditingIfThenElseNode(newNode);
  };

  /**
   * Handle Preview button click
   * Validates GameFlow (browser version - no file saving)
   */
  const handlePreviewClick = () => {
    try {
      // Validate GameFlow in browser
      const validation = validateGameFlowBrowser(
        gameFlowGraph,
        allAssets
      );

      // Show validation results if there are issues
      if (validation.issues.length > 0) {
        const issueMessages = validation.issues.map(i => `${i.type}: ${i.message}`).join('\n');

        if (validation.status === 'FAILED') {
          alert(`GameFlow validation failed:\n\n${issueMessages}\n\nPlease fix errors before proceeding.`);
          return;
        } else if (validation.status === 'WARNING') {
          const proceed = confirm(`GameFlow validation warnings:\n\n${issueMessages}\n\nDo you want to proceed with Preview anyway?`);
          if (!proceed) return;
        }
      }

      // Open Preview mode
      setPreviewMode('preview');
    } catch (error) {
      alert(`Error validating GameFlow: ${error}\n\nCannot open Preview.`);
    }
  };

  /**
   * Handle Play button click
   * Validates GameFlow before playing
   */
  const handlePlayClick = () => {
    try {
      // Validate GameFlow before Play
      const validation = validateGameFlowBrowser(
        gameFlowGraph,
        allAssets
      );

      // Check validation status
      if (validation.status === 'FAILED') {
        const issueMessages = validation.issues.filter(i => i.type === 'ERROR').map(i => i.message).join('\n');
        alert(`GameFlow has errors that must be fixed:\n\n${issueMessages}\n\nPlease fix errors before playing.`);
        return;
      }

      // Open Play mode
      setPreviewMode('play');
    } catch (error) {
      alert(`Error validating GameFlow: ${error}\n\nCannot open Play mode.`);
    }
  };

  /**
   * Handle closing Preview/Play modal
   */
  const handleClosePreview = () => {
    setPreviewMode(null);
    // Force view to re-initialize after modal closes
    setHasInitializedView(false);
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
  const handleAddNode = (type: 'SubMenu' | 'WorldLink' | 'Text' | 'End' | 'Restart' | 'Transition' | 'Group' | 'Waypoint' | 'IfThenElse' | 'Music' | 'Globals') => {
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
    } else if (type === 'End') {
        newNodeData = {
            type: 'End'
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
    } else if (type === 'Group') {
        newNodeData = {
            type: 'Group',
            name: 'New Group',
            gameFlowAssetId: undefined
        };
        setNodeToPlace(newNodeData);
    } else if (type === 'IfThenElse') {
        newNodeData = {
            type: 'IfThenElse',
            variableName: 'Goal',
            compareValue: 'Completed',
            operator: '=='
        };
        setNodeToPlace(newNodeData);
    } else if (type === 'Music') {
        newNodeData = {
            type: 'Music',
            stop: false,
            trackAssetId: undefined,
            loop: true,
            autoPlay: true
        };
        setNodeToPlace(newNodeData);
    } else if (type === 'Waypoint') {
        newNodeData = {
            type: 'Waypoint'
        };
        setNodeToPlace(newNodeData);
  } else if (type === 'Globals') {
        const defaultGlobalVarsAssetId = allAssets.find(a => a.type === 'globalvariables')?.id;
        const defaultVariableName = 'Ammo';
        newNodeData = {
            type: 'Globals',
            title: 'Set Globals',
            globalVariablesAssetId: defaultGlobalVarsAssetId,
            variables: [
                { id: 'var1', name: defaultVariableName, value: '0' }
            ]
        } as unknown as NodeToPlace;
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
    const clientWidth = svgRef.current?.clientWidth || 0;
    const clientHeight = svgRef.current?.clientHeight || 0;

    // Skip update if SVG dimensions are invalid (0 or very small)
    if (clientWidth < 100 || clientHeight < 100) {
      return;
    }

    const vbWidth = clientWidth / zoomLevel;
    const vbHeight = clientHeight / zoomLevel;
    setViewBox(`${panOffset.x} ${panOffset.y} ${vbWidth} ${vbHeight}`);
  }, [zoomLevel, panOffset, svgRef.current?.clientWidth, svgRef.current?.clientHeight]);
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const newZoomLevel = Math.max(0.1, Math.min(5, zoomLevel - e.deltaY * 0.001 * zoomLevel));
    setLocalZoomLevel(newZoomLevel);
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
      setLocalPanOffset({ x: panOffset.x - dx / zoomLevel, y: panOffset.y - dy / zoomLevel });
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
    <Panel title="Game Flow Editor" className="flex-grow flex flex-col bg-msx-bgcolor select-none">
      <div className="p-2 border-b border-msx-border flex flex-col gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
        <Button onClick={() => handleAddNode('SubMenu')} size="sm" variant="secondary" icon={<PlusCircleIcon className="w-4 h-4"/>}>Add Submenu</Button>
        <Button onClick={() => handleAddNode('WorldLink')} size="sm" variant="secondary" icon={<PlusCircleIcon className="w-4 h-4"/>}>Add World Link</Button>
        <Button onClick={() => handleAddNode('Text')} size="sm" variant="secondary" icon={<PlusCircleIcon className="w-4 h-4"/>}>Add Text</Button>
        <Button onClick={() => handleAddNode('Music')} size="sm" variant="secondary" icon={<PlusCircleIcon className="w-4 h-4"/>} title="Add background music node">Add Music</Button>
        <Button onClick={() => handleAddNode('IfThenElse')} size="sm" variant="secondary" icon={<PlusCircleIcon className="w-4 h-4"/>} title="Add conditional node (if-then-else)">If/Then/Else</Button>
        <Button onClick={() => handleAddNode('End')} size="sm" variant="secondary" icon={<PlusCircleIcon className="w-4 h-4"/>}>Add End</Button>
        <Button onClick={() => handleAddNode('Restart')} size="sm" variant="secondary" icon={<PlusCircleIcon className="w-4 h-4"/>}>Add Restart</Button>
        <Button onClick={() => handleAddNode('Transition')} size="sm" variant="secondary" icon={<PlusCircleIcon className="w-4 h-4"/>}>Add Transition</Button>
        <Button onClick={() => handleAddNode('Group')} size="sm" variant="secondary" icon={<PlusCircleIcon className="w-4 h-4"/>}>Add Group</Button>
        <Button onClick={() => handleAddNode('Globals')} size="sm" variant="secondary" icon={<PlusCircleIcon className="w-4 h-4"/>} title="Add node to set global variables">Add Globals</Button>
        </div>
        <div className="flex items-center gap-2">
        <Button onClick={() => handleAddNode('Waypoint')} size="sm" variant="ghost" icon={<PlusCircleIcon className="w-4 h-4"/>} title="Add waypoint for visual organization">Waypoint</Button>
        <Button
          onClick={() => setIsCutMode(!isCutMode)}
          size="sm"
          variant={isCutMode ? "primary" : "ghost"}
          icon={<ScissorsIcon className="w-4 h-4"/>}
          title="Cut connections mode - click on connections to delete them"
        >
          {isCutMode ? "Cut Mode ON" : "Cut Connections"}
        </Button>
        <Button onClick={handleAutoLayout} size="sm" variant="primary" icon={<ArrowsPointingOutIcon className="w-4 h-4"/>} title="Auto-arrange nodes in hierarchical layout">Auto Layout</Button>
        <Button onClick={handleResetView} size="sm" variant="ghost" title="Fit all nodes in view">Reset View</Button>
        <div className="flex-grow" />
        <Button size="sm" variant="ghost" onClick={() => setIsLogModalOpen(true)} title="View GameFlow validation log">View Log 📄</Button>
        <Button size="sm" variant="primary" onClick={handlePreviewClick}>Preview</Button>
        <Button size="sm" variant="secondary" onClick={handlePlayClick}>Play Game</Button>
        </div>
      </div>
      <div className="flex-grow relative" style={{ background: '#1A101A', overflow: 'auto' }}>
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

              // Calculate control points for cubic Bezier curve (spline)
              const dx = p2.x - p1.x;
              const controlPointOffset = Math.abs(dx) * 0.5; // 50% of horizontal distance
              const cp1 = { x: p1.x + controlPointOffset, y: p1.y };
              const cp2 = { x: p2.x - controlPointOffset, y: p2.y };

              return (
                <g key={conn.id}>
                  {/* Visible connection line */}
                  <path
                    data-testid={`connection-${conn.id}`}
                    d={`M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`}
                    stroke={isCutMode ? "hsl(0, 80%, 60%)" : "hsl(150, 50%, 60%)"}
                    strokeWidth={1.5}
                    fill="none"
                    markerEnd="url(#arrowhead)"
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Invisible wider hitbox for clicking */}
                  <path
                    d={`M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`}
                    stroke="transparent"
                    strokeWidth={12}
                    fill="none"
                    style={{ cursor: isCutMode ? 'pointer' : 'default', pointerEvents: isCutMode ? 'stroke' : 'none' }}
                    onClick={(e) => {
                      if (isCutMode) {
                        e.stopPropagation();
                        handleDeleteConnection(conn.id);
                      }
                    }}
                  />
                </g>
              );
          })}
          {nodes.map(node => (
            <GameFlowNodeComponent key={node.id} node={node} allAssets={allAssets} onPortClick={handlePortClick} isSelected={selectedNodeId === node.id} onSelect={handleNodeSelect} onMouseDown={handleNodeMouseDown} onContextMenu={handleContextMenu} onEditAppearance={handleOpenSubMenuModal} onEditTextNode={handleOpenTextNodeModal} onEditRestartNode={handleOpenRestartNodeModal} onEditTransitionNode={handleOpenTransitionNodeModal} onEditMusicNode={handleOpenMusicNodeModal} onEditIfThenElseNode={handleOpenIfThenElseModal} onEditGlobalsNode={handleOpenGlobalsNodeModal} isLinkingMode={isLinkingMode} gameFlowAssetName={gameFlowAssetName} />
          ))}
          {nodeToPlace && mousePosition && <g transform={`translate(${mousePosition.x - getNodeWidth(nodeToPlace)/2}, ${mousePosition.y - getNodeHeight(nodeToPlace)/2})`} opacity={0.6}><GameFlowNodeComponent node={{...nodeToPlace, id: 'ghost', position: {x:0, y:0}}} allAssets={allAssets} onPortClick={()=>{}} isSelected={false} onSelect={()=>{}} onMouseDown={()=>{}} onContextMenu={()=>{}} onEditAppearance={() => {}} onEditTextNode={() => {}} onEditRestartNode={() => {}} onEditTransitionNode={() => {}} onEditMusicNode={() => {}} onEditIfThenElseNode={() => {}} isLinkingMode={false} gameFlowAssetName={gameFlowAssetName} /></g>}
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
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="music-stop"
                checked={!!editingMusicNode.stop}
                onChange={(e) => handleMusicNodeChange('stop', e.target.checked)}
                className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"
              />
              <label htmlFor="music-stop" className="text-sm">Stop current music when reached</label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Effect Type:</label>
              <select
                value={editingTransitionNode.effect}
                onChange={(e) => handleTransitionNodeChange(e.target.value, editingTransitionNode.duration || 1000)}
                disabled={!!editingMusicNode.stop} className="w-full p-2 border border-msx-border bg-msx-bgcolor text-white rounded"
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
      {isMusicNodeModalOpen && editingMusicNode && (
        <Modal isOpen={isMusicNodeModalOpen} onClose={handleCloseMusicNodeModal} title="Edit Music Node">
          <div className="p-4 space-y-4">
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="music-stop"
                checked={!!editingMusicNode.stop}
                onChange={(e) => handleMusicNodeChange('stop', e.target.checked)}
                className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"
              />
              <label htmlFor="music-stop" className="text-sm">Stop current music when reached</label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Music Track:</label>
              <select
                value={editingMusicNode.trackAssetId || ''}
                onChange={(e) => handleMusicNodeChange('trackAssetId', e.target.value)}
                disabled={!!editingMusicNode.stop}
                className="w-full p-2 border border-msx-border bg-msx-bgcolor text-white rounded"
              >
                <option value="">-- Select Track --</option>
                {allAssets.filter(a => a.type === 'track').map(trackAsset => (
                  <option key={trackAsset.id} value={trackAsset.id}>
                    {trackAsset.name}
                  </option>
                ))}
              </select>
              {allAssets.filter(a => a.type === 'track').length === 0 && (
                <p className="text-xs text-yellow-400 mt-2">
                  ⚠️ No music tracks available. Create a tracker song first (New Asset → Track).
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="music-loop"
                checked={editingMusicNode.loop ?? true}
                onChange={(e) => handleMusicNodeChange('loop', e.target.checked)}
                disabled={!!editingMusicNode.stop}
                className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"
              />
              <label htmlFor="music-loop" className="text-sm">Loop music continuously</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="music-autoplay"
                checked={editingMusicNode.autoPlay ?? true}
                onChange={(e) => handleMusicNodeChange('autoPlay', e.target.checked)}
                disabled={!!editingMusicNode.stop}
                className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"
              />
              <label htmlFor="music-autoplay" className="text-sm">Auto-play when node is reached</label>
            </div>
            <div className="text-xs text-blue-400 italic p-2 bg-black bg-opacity-30 rounded border border-blue-600">
              🎵 This node will play background music from the Tracker Composer when reached in the game flow.
            </div>
          </div>
          <div className="flex justify-end p-4">
            <Button onClick={handleSaveMusicNode}>Save</Button>
          </div>
        </Modal>
      )}
      {isIfThenElseModalOpen && editingIfThenElseNode && (
        <Modal isOpen={isIfThenElseModalOpen} onClose={handleCloseIfThenElseModal} title="Edit If-Then-Else Condition">
          <IfThenElseNodeEditor
            node={editingIfThenElseNode}
            onNodeChange={handleIfThenElseNodeChange}
            allAssets={allAssets}
          />
          <div className="flex justify-end p-4">
            <Button onClick={handleSaveIfThenElseNode}>Save</Button>
          </div>
        </Modal>
      )}
      {isGlobalsNodeModalOpen && editingGlobalsNode && (
        <Modal isOpen={isGlobalsNodeModalOpen} onClose={handleCloseGlobalsNodeModal} title="Edit Global Variables">
          <GlobalsNodeEditor
            node={editingGlobalsNode}
            onNodeChange={(n) => setEditingGlobalsNode(n)}
            allAssets={allAssets}
          />
          <div className="flex justify-end p-4">
            <Button onClick={handleSaveGlobalsNode}>Save</Button>
          </div>
        </Modal>
      )}
      {previewMode && (
        <GameFlowPreviewModal
          isOpen={!!previewMode}
          onClose={handleClosePreview}
          initialIsDynamic={previewMode === 'play'}
          isPlayMode={previewMode === 'play'}
          graphData={gameFlowGraph}
          allAssets={allAssets}
          msxFont={msxFont}
          msxFontColorAttributes={msxFontColorAttributes}
          entityTemplates={entityTemplates}
          currentScreenMode={currentScreenMode}
          componentDefinitions={componentDefinitions}
          gameFlowAssetName={gameFlowAssetName}
        />
      )}

      {/* GameFlow Log Modal */}
      <GameFlowLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        gameFlowGraph={gameFlowGraph}
        allAssets={allAssets}
      />
    </Panel>
  );
};
