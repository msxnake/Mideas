
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { WorldMapGraph, WorldMapScreenNode, WorldMapConnection, ConnectionDirection, ScreenMap, Tile, DataFormat, ContextMenuItem } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon, TrashIcon, SaveFloppyIcon, CodeIcon, PencilIcon } from '../icons/MsxIcons';
import { ExportWorldMapASMModal } from '../modals/ExportWorldMapASMModal';
import { RandomMapGeneratorModal } from '../modals/RandomMapGeneratorModal';

const NODE_WIDTH = 120;
const NODE_HEIGHT = 90;
const PORT_SIZE = 10; 
const PORT_OFFSET = 5; 
const CONNECTION_PROXIMITY_THRESHOLD_DEFAULT_FACTOR = 1.5; // Multiplier for gridSize

interface WorldMapEditorProps {
  worldMapGraph: WorldMapGraph;
  onUpdate: (data: Partial<WorldMapGraph>) => void;
  availableScreenMaps: ScreenMap[];
  tileset: Tile[]; 
  currentScreenMode: string;
  dataOutputFormat: DataFormat;
  onNavigateToAsset: (assetId: string) => void;
  onShowContextMenu: (position: { x: number; y: number }, items: ContextMenuItem[]) => void;
}

// Simplified preview for world map nodes
const createScreenMiniPreviewDataURL = (
    screenMap: ScreenMap | undefined,
    tileset: Tile[],
    worldNodeWidth: number,
    worldNodeHeight: number,
    currentScreenMode: string
  ): string => {
  if (!screenMap) return "";
  
  const canvas = document.createElement('canvas');
  const previewWidth = 64; 
  const previewHeight = Math.floor(previewWidth * (worldNodeHeight / worldNodeWidth));
  canvas.width = previewWidth;
  canvas.height = previewHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return "";

  ctx.fillStyle = currentScreenMode === "SCREEN 2 (Graphics I)" ? '#000080' : '#2F2FC1'; 
  ctx.fillRect(0, 0, previewWidth, previewHeight);

  const layer = screenMap.layers.background;
  if (!layer || layer.length === 0 || layer[0].length === 0) return canvas.toDataURL();

  const mapTileRows = layer.length;
  const mapTileCols = layer[0].length;
  
  const cellWidth = previewWidth / mapTileCols;
  const cellHeight = previewHeight / mapTileRows;

  for (let r = 0; r < mapTileRows; r++) {
    for (let c = 0; c < mapTileCols; c++) {
      const screenTile = layer[r][c];
      if (screenTile && screenTile.tileId) {
        const tileAsset = tileset.find(t => t.id === screenTile.tileId);
        if (tileAsset) {
          ctx.fillStyle = tileAsset.data?.[0]?.[0] || (currentScreenMode === "SCREEN 2 (Graphics I)" ? '#66CDAA' : '#74D07D');
          ctx.fillRect(c * cellWidth, r * cellHeight, cellWidth, cellHeight);
        }
      }
    }
  }
  return canvas.toDataURL();
};

interface AutoConnectionProposal {
  fromNodeId: string;
  fromNodeName: string;
  fromDirection: ConnectionDirection;
  toNodeId: string;
  toNodeName: string;
  toDirection: ConnectionDirection;
}

const oppositeDirectionMap: Record<ConnectionDirection, ConnectionDirection> = {
  north: 'south',
  south: 'north',
  east: 'west',
  west: 'east',
};
const ALL_DIRECTIONS: ConnectionDirection[] = ['north', 'south', 'east', 'west'];


export const WorldMapEditor: React.FC<WorldMapEditorProps> = ({
  worldMapGraph,
  onUpdate,
  availableScreenMaps,
  tileset,
  currentScreenMode,
  dataOutputFormat,
  onNavigateToAsset,
  onShowContextMenu,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [linkingState, setLinkingState] = useState<{ fromNodeId: string; fromDirection: ConnectionDirection } | null>(null);
  const [pendingAutoConnectionProposal, setPendingAutoConnectionProposal] = useState<AutoConnectionProposal | null>(null);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState(`0 0 1000 700`); 
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const { nodes, connections, gridSize, zoomLevel, panOffset } = worldMapGraph;
  const CONNECTION_PROXIMITY_THRESHOLD = gridSize * CONNECTION_PROXIMITY_THRESHOLD_DEFAULT_FACTOR;

  const [isExportAsmModalOpen, setIsExportAsmModalOpen] = useState<boolean>(false);
  const [isRandomMapModalOpen, setIsRandomMapModalOpen] = useState<boolean>(false);


  useEffect(() => {
    const vbWidth = (svgRef.current?.clientWidth || 1000) / zoomLevel;
    const vbHeight = (svgRef.current?.clientHeight || 700) / zoomLevel;
    setViewBox(`${panOffset.x} ${panOffset.y} ${vbWidth} ${vbHeight}`);
  }, [zoomLevel, panOffset, svgRef.current?.clientWidth, svgRef.current?.clientHeight]);

  const handleAddNode = (screenAssetId: string) => {
    const screenMap = availableScreenMaps.find(sm => sm.id === screenAssetId);
    if (!screenMap) return;

    const newX = panOffset.x + ((svgRef.current?.clientWidth || 1000) / zoomLevel) / 10; 
    const newY = panOffset.y + ((svgRef.current?.clientHeight || 700) / zoomLevel) / 10;

    const newNode: WorldMapScreenNode = {
      id: `wmnode_${Date.now()}`,
      screenAssetId,
      name: screenMap.name,
      position: { x: snapToGrid(newX), y: snapToGrid(newY) }, 
    };
    onUpdate({ nodes: [...nodes, newNode] });
  };
  
  const snapToGrid = (value: number): number => Math.round(value / gridSize) * gridSize;

  const handleNodeDrag = useCallback((nodeId: string, dx: number, dy: number) => {
    onUpdate({
      nodes: worldMapGraph.nodes.map(n => // Use worldMapGraph.nodes to ensure latest data
        n.id === nodeId ? { ...n, position: { x: n.position.x + dx / zoomLevel, y: n.position.y + dy / zoomLevel } } : n
      )
    });
  }, [worldMapGraph.nodes, zoomLevel, onUpdate]);


  const getPortPosition = (node: WorldMapScreenNode, dir: ConnectionDirection): { x: number; y: number } => {
    switch (dir) {
      case 'north': return { x: node.position.x + NODE_WIDTH / 2, y: node.position.y };
      case 'south': return { x: node.position.x + NODE_WIDTH / 2, y: node.position.y + NODE_HEIGHT };
      case 'west':  return { x: node.position.x, y: node.position.y + NODE_HEIGHT / 2 };
      case 'east':  return { x: node.position.x + NODE_WIDTH, y: node.position.y + NODE_HEIGHT / 2 };
    }
  };

  const checkForAutoConnections = useCallback((movedNode: WorldMapScreenNode) => {
    const currentNodes = worldMapGraph.nodes;
    const currentConnections = worldMapGraph.connections;
    const currentGridSize = worldMapGraph.gridSize;
    const proximityThreshold = currentGridSize * CONNECTION_PROXIMITY_THRESHOLD_DEFAULT_FACTOR;

    const potentialProposals: (AutoConnectionProposal & { distanceSq: number })[] = [];
    const otherNodes = currentNodes.filter(n => n.id !== movedNode.id);

    for (const fromDirection of ALL_DIRECTIONS) {
      const movedNodePortPos = getPortPosition(movedNode, fromDirection);
      const targetDirection = oppositeDirectionMap[fromDirection];

      for (const targetNode of otherNodes) {
        const targetNodePortPos = getPortPosition(targetNode, targetDirection);

        const deltaX = movedNodePortPos.x - targetNodePortPos.x;
        const deltaY = movedNodePortPos.y - targetNodePortPos.y;
        const distanceSq = deltaX * deltaX + deltaY * deltaY;

        if (distanceSq < proximityThreshold * proximityThreshold) {
          const connectionExists = currentConnections.some(c =>
            (c.fromNodeId === movedNode.id && c.fromDirection === fromDirection && c.toNodeId === targetNode.id && c.toDirection === targetDirection) ||
            (c.fromNodeId === targetNode.id && c.fromDirection === targetDirection && c.toNodeId === movedNode.id && c.toDirection === fromDirection)
          );

          if (!connectionExists) {
            potentialProposals.push({
              fromNodeId: movedNode.id,
              fromNodeName: movedNode.name,
              fromDirection,
              toNodeId: targetNode.id,
              toNodeName: targetNode.name,
              toDirection: targetDirection,
              distanceSq,
            });
          }
        }
      }
    }

    if (potentialProposals.length > 0) {
      potentialProposals.sort((a, b) => a.distanceSq - b.distanceSq);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { distanceSq, ...bestProposal } = potentialProposals[0];
      setPendingAutoConnectionProposal(bestProposal);
    }
  }, [worldMapGraph.nodes, worldMapGraph.connections, worldMapGraph.gridSize, setPendingAutoConnectionProposal]);
  
  const handleNodeMouseUp = useCallback((nodeId: string) => {
    let snappedNode: WorldMapScreenNode | undefined;
    const newNodes = worldMapGraph.nodes.map(n => { // Use worldMapGraph.nodes
      if (n.id === nodeId) {
        snappedNode = { ...n, position: { x: snapToGrid(n.position.x), y: snapToGrid(n.position.y) } };
        return snappedNode;
      }
      return n;
    });
    onUpdate({ nodes: newNodes });

    if (snappedNode) {
      checkForAutoConnections(snappedNode);
    }
  }, [worldMapGraph.nodes, worldMapGraph.gridSize, onUpdate, checkForAutoConnections, snapToGrid]);


  const handlePortClick = (nodeId: string, direction: ConnectionDirection) => {
    if (!linkingState) {
      setLinkingState({ fromNodeId: nodeId, fromDirection: direction });
      setSelectedNodeId(null); 
      setSelectedConnectionId(null);
    } else {
      if (linkingState.fromNodeId === nodeId && linkingState.fromDirection === direction) { 
        setLinkingState(null); return;
      }
      if (linkingState.fromNodeId === nodeId) { 
         alert("Cannot connect a node to itself via manual port linking.");
         setLinkingState(null); return;
      }
      
      const existing = worldMapGraph.connections.find(c => 
        (c.fromNodeId === linkingState.fromNodeId && c.fromDirection === linkingState.fromDirection && c.toNodeId === nodeId && c.toDirection === direction) ||
        (c.fromNodeId === nodeId && c.fromDirection === direction && c.toNodeId === linkingState.fromNodeId && c.toDirection === linkingState.fromDirection)
      );
      if (existing) {
        setLinkingState(null);
        alert("Connection already exists.");
        return;
      }

      const newConnection: WorldMapConnection = {
        id: `wmconn_${Date.now()}`,
        fromNodeId: linkingState.fromNodeId,
        fromDirection: linkingState.fromDirection,
        toNodeId: nodeId,
        toDirection: direction,
      };
      onUpdate({ connections: [...worldMapGraph.connections, newConnection] });
      setLinkingState(null);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedNodeId) {
      onUpdate({
        nodes: worldMapGraph.nodes.filter(n => n.id !== selectedNodeId),
        connections: worldMapGraph.connections.filter(c => c.fromNodeId !== selectedNodeId && c.toNodeId !== selectedNodeId),
        startScreenNodeId: worldMapGraph.startScreenNodeId === selectedNodeId ? null : worldMapGraph.startScreenNodeId,
      });
      setSelectedNodeId(null);
    } else if (selectedConnectionId) {
      onUpdate({ connections: worldMapGraph.connections.filter(c => c.id !== selectedConnectionId) });
      setSelectedConnectionId(null);
    }
  };
  
  const handleSetStartScreen = () => {
    if (selectedNodeId) {
      onUpdate({ startScreenNodeId: selectedNodeId });
    }
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const currentZoom = worldMapGraph.zoomLevel;
    const currentPan = worldMapGraph.panOffset;
    const newZoomLevel = Math.max(0.1, Math.min(5, currentZoom - e.deltaY * 0.001 * currentZoom)); 
    
    const svgPoint = svgRef.current?.createSVGPoint();
    if(svgPoint && svgRef.current){
        svgPoint.x = e.clientX;
        svgPoint.y = e.clientY;
        const CTM = svgRef.current.getScreenCTM()?.inverse();
        if(CTM){
            const { x:pointerX, y:pointerY } = svgPoint.matrixTransform(CTM);
            const newPanX = pointerX - (pointerX - currentPan.x) * (newZoomLevel / currentZoom);
            const newPanY = pointerY - (pointerY - currentPan.y) * (newZoomLevel / currentZoom);
            onUpdate({ zoomLevel: newZoomLevel, panOffset: {x: newPanX, y: newPanY}});
        } else {
             onUpdate({ zoomLevel: newZoomLevel });
        }
    } else {
         onUpdate({ zoomLevel: newZoomLevel });
    }
  };

  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 1 || (e.button === 0 && (e.ctrlKey || e.metaKey))) { 
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      if (e.currentTarget) e.currentTarget.style.cursor = 'grabbing';
    } else if (e.button === 0 && e.target === svgRef.current) { 
        setSelectedNodeId(null);
        setSelectedConnectionId(null);
        setLinkingState(null);
        if (svgRef.current) svgRef.current.focus(); // Focus for keyboard events
    }
  };
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      const dx = (e.clientX - panStart.x); 
      const dy = (e.clientY - panStart.y);
      onUpdate({ panOffset: { x: worldMapGraph.panOffset.x - dx / worldMapGraph.zoomLevel, y: worldMapGraph.panOffset.y - dy / worldMapGraph.zoomLevel }});
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };
  const handleSvgMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      setIsPanning(false);
      if (e.currentTarget) e.currentTarget.style.cursor = 'grab';
    }
  };

  const handleConfirmAutoConnection = () => {
    if (pendingAutoConnectionProposal) {
      const { fromNodeId, fromDirection, toNodeId, toDirection } = pendingAutoConnectionProposal;
      const newConnection: WorldMapConnection = {
        id: `wmconn_auto_${Date.now()}`,
        fromNodeId, fromDirection, toNodeId, toDirection,
      };
      onUpdate({ connections: [...worldMapGraph.connections, newConnection] });
    }
    setPendingAutoConnectionProposal(null);
  };

  // Keyboard movement for selected node
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedNodeId || !worldMapGraph) return;

      const targetElement = event.target as HTMLElement;
      if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA' || targetElement.tagName === 'SELECT' || targetElement.isContentEditable) {
        return;
      }

      let dx = 0;
      let dy = 0;
      const currentGridSize = worldMapGraph.gridSize;

      switch (event.key.toLowerCase()) {
        case 'w': dy = -currentGridSize; break;
        case 's': dy = currentGridSize; break;
        case 'a': dx = -currentGridSize; break;
        case 'd': dx = currentGridSize; break;
        default: return;
      }

      event.preventDefault();

      const nodeToMove = worldMapGraph.nodes.find(n => n.id === selectedNodeId);
      if (!nodeToMove) return;

      const newPosition = {
        x: nodeToMove.position.x + dx,
        y: nodeToMove.position.y + dy,
      };
      const updatedNode = { ...nodeToMove, position: newPosition };
      
      const newNodes = worldMapGraph.nodes.map(n => (n.id === selectedNodeId ? updatedNode : n));
      onUpdate({ nodes: newNodes });
      
      checkForAutoConnections(updatedNode);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodeId, worldMapGraph, onUpdate, checkForAutoConnections]); 


  const handleSaveWorldJson = () => {
    const worldDataString = JSON.stringify(worldMapGraph, null, 2);
    const blob = new Blob([worldDataString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'world.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('World map data saved to world.json');
  };

  const handleOpenExportAsmModal = () => {
    setIsExportAsmModalOpen(true);
  };

interface NodeComponentProps {
  node: WorldMapScreenNode;
  onNodeDrag: (nodeId: string, dx: number, dy: number) => void;
  onNodeMouseUp: (nodeId: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedConnectionId: (id: string | null) => void;
  setLinkingState: (state: { fromNodeId: string; fromDirection: ConnectionDirection } | null) => void;
  onNavigateToAsset: (assetId: string) => void;
  onShowContextMenu: (position: { x: number; y: number }, items: ContextMenuItem[]) => void;
  svgGlobalRef?: React.RefObject<SVGSVGElement>; 
  isLinking: boolean;
  isNodeSelected: boolean;
  isStartNode: boolean;
}

const NodeComponent: React.FC<NodeComponentProps> = React.memo(({
    node, 
    onNodeDrag, 
    onNodeMouseUp,
    setSelectedNodeId,
    setSelectedConnectionId,
    setLinkingState,
    onNavigateToAsset,
    onShowContextMenu,
    svgGlobalRef,
    isLinking, 
    isNodeSelected,
    isStartNode
  }) => {
    const screenMapAsset = availableScreenMaps.find(sm => sm.id === node.screenAssetId);
    const [isDraggingVisual, setIsDraggingVisual] = useState(false);
    
    const onNodeDragRef = useRef(onNodeDrag);
    const onNodeMouseUpRef = useRef(onNodeMouseUp);
    const nodeIdRef = useRef(node.id);
    const dragStartCoordsRef = useRef({ x: 0, y: 0 });
    const isActuallyDraggingRef = useRef(false);

    useEffect(() => { onNodeDragRef.current = onNodeDrag; }, [onNodeDrag]);
    useEffect(() => { onNodeMouseUpRef.current = onNodeMouseUp; }, [onNodeMouseUp]);
    useEffect(() => { nodeIdRef.current = node.id; }, [node.id]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setSelectedNodeId(nodeIdRef.current);
        setSelectedConnectionId(null);
        setLinkingState(null);
        
        dragStartCoordsRef.current = { x: e.clientX, y: e.clientY };
        isActuallyDraggingRef.current = true;
        setIsDraggingVisual(true);
        e.stopPropagation();

        if (svgGlobalRef?.current) {
            svgGlobalRef.current.focus(); // Focus SVG for keyboard events
        }

    }, [setSelectedNodeId, setSelectedConnectionId, setLinkingState, svgGlobalRef]); 

    useEffect(() => {
        const handleDocumentMouseMove = (e: MouseEvent) => {
            if (!isActuallyDraggingRef.current) return;
            const dx = e.clientX - dragStartCoordsRef.current.x;
            const dy = e.clientY - dragStartCoordsRef.current.y;
            onNodeDragRef.current(nodeIdRef.current, dx, dy);
            dragStartCoordsRef.current = { x: e.clientX, y: e.clientY };
        };

        const handleDocumentMouseUp = () => {
            if (!isActuallyDraggingRef.current) return;
            onNodeMouseUpRef.current(nodeIdRef.current);
            isActuallyDraggingRef.current = false;
            setIsDraggingVisual(false);
        };

        if (isDraggingVisual) {
            document.addEventListener('mousemove', handleDocumentMouseMove);
            document.addEventListener('mouseup', handleDocumentMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleDocumentMouseMove);
                document.removeEventListener('mouseup', handleDocumentMouseUp);
            };
        }
    }, [isDraggingVisual]);

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const menuItems: ContextMenuItem[] = [
        {
          label: `Edit Screen: ${node.name}`,
          icon: <PencilIcon className="w-4 h-4" />,
          onClick: () => onNavigateToAsset(node.screenAssetId),
        },
      ];
      onShowContextMenu({ x: e.clientX, y: e.clientY }, menuItems);
    };

    return (
      <g transform={`translate(${node.position.x}, ${node.position.y})`} 
         onMouseDown={handleMouseDown}
         onContextMenu={handleContextMenu}
         onDoubleClick={() => onNavigateToAsset(node.screenAssetId)}
         style={{ cursor: isDraggingVisual ? 'grabbing' : 'grab' }}
         role="button"
         aria-label={`Screen node ${node.name}`}
         tabIndex={-1}
      >
        <rect
          width={NODE_WIDTH}
          height={NODE_HEIGHT}
          fill={isNodeSelected ? "hsl(220, 70%, 65%)" : "hsl(220, 30%, 40%)"}
          stroke={isStartNode ? "hsl(100, 70%, 60%)" : (isNodeSelected ? "hsl(220, 80%, 80%)" : "hsl(220, 50%, 70%)")}
          strokeWidth={isStartNode || isNodeSelected ? 2.5 : 1.5}
          rx={5}
          ry={5}
        />
        <image 
            href={createScreenMiniPreviewDataURL(screenMapAsset, tileset, NODE_WIDTH, NODE_HEIGHT * 0.6, currentScreenMode)}
            x={PORT_OFFSET} y={PORT_OFFSET} 
            width={NODE_WIDTH - 2 * PORT_OFFSET} height={NODE_HEIGHT * 0.6 - 2 * PORT_OFFSET} 
            preserveAspectRatio="xMidYMid slice"
        />
        <text x={NODE_WIDTH / 2} y={NODE_HEIGHT - 15} textAnchor="middle" fill="white" fontSize="12px" className="pixel-font select-none pointer-events-none">
          {node.name}
        </text>
        {isStartNode && 
          <text x={NODE_WIDTH / 2} y={NODE_HEIGHT - 3} textAnchor="middle" fill="hsl(100, 70%, 60%)" fontSize="10px" className="pixel-font select-none pointer-events-none">START</text>
        }
        {ALL_DIRECTIONS.map(dir => {
          const portPos = getPortPosition({ ...node, position: {x:0, y:0} }, dir); 
          return (
            <rect
              key={dir}
              x={portPos.x - PORT_SIZE / 2}
              y={portPos.y - PORT_SIZE / 2}
              width={PORT_SIZE}
              height={PORT_SIZE}
              fill={linkingState?.fromNodeId === node.id && linkingState?.fromDirection === dir ? "hsl(50, 80%, 60%)" : "hsl(200, 60%, 50%)"}
              stroke="hsl(200, 80%, 70%)"
              strokeWidth="1"
              onClick={(e) => { e.stopPropagation(); handlePortClick(node.id, dir); }}
              style={{ cursor: 'crosshair' }}
              role="button"
              aria-label={`Connect ${dir} port`}
            />
          );
        })}
      </g>
    );
  });
NodeComponent.displayName = 'NodeComponent';


  return (
    <Panel title={`World Map Editor: ${worldMapGraph.name}`} className="flex-grow flex flex-col bg-msx-bgcolor overflow-hidden">
      <div className="p-2 border-b border-msx-border flex space-x-2 items-center flex-wrap">
        <div className="flex items-center space-x-1">
            <label className="text-xs pixel-font text-msx-textsecondary">Add Screen:</label>
            <select 
                onChange={(e) => { if(e.target.value) handleAddNode(e.target.value); e.target.value = "";}} 
                className="p-1 text-xs bg-msx-panelbg border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent"
                value=""
                aria-label="Add screen to world map"
            >
                <option value="">Select ScreenMap...</option>
                {availableScreenMaps.map(sm => <option key={sm.id} value={sm.id}>{sm.name}</option>)}
            </select>
        </div>
        <Button onClick={handleSetStartScreen} size="sm" disabled={!selectedNodeId} variant="secondary">Set Start</Button>
        <Button onClick={handleDeleteSelected} size="sm" disabled={!selectedNodeId && !selectedConnectionId} variant="danger" icon={<TrashIcon className="w-3 h-3"/>}>Delete Sel.</Button>
        <div className="flex items-center space-x-1">
          <label htmlFor="worldMapZoom" className="text-xs pixel-font text-msx-textsecondary">Zoom:</label>
          <input id="worldMapZoom" type="range" min="0.2" max="3" step="0.05" value={zoomLevel} onChange={e => onUpdate({zoomLevel: parseFloat(e.target.value)})} className="w-20 accent-msx-accent" />
          <span className="text-xs text-msx-textsecondary">({zoomLevel.toFixed(2)}x)</span>
        </div>
         <div className="flex items-center space-x-1">
          <label htmlFor="worldMapGridSize" className="text-xs pixel-font text-msx-textsecondary">Grid:</label>
          <input id="worldMapGridSize" type="number" min="5" max="50" step="5" value={gridSize} onChange={e => onUpdate({gridSize: parseInt(e.target.value)})} className="w-12 p-0.5 text-xs bg-msx-panelbg border border-msx-border rounded" />
        </div>
         <Button onClick={() => onUpdate({panOffset: {x:0, y:0}, zoomLevel: 1})} size="sm" variant="ghost">Reset View</Button>
         <Button onClick={handleSaveWorldJson} size="sm" variant="secondary" icon={<SaveFloppyIcon className="w-3.5 h-3.5"/>} title="Save World Map as JSON">Save JSON</Button>
         <Button onClick={handleOpenExportAsmModal} size="sm" variant="secondary" icon={<CodeIcon className="w-3.5 h-3.5"/>} title="Export World Map as ASM">Export ASM</Button>
         <Button onClick={() => setIsRandomMapModalOpen(true)} size="sm" variant="secondary" title="Generar Mapa Aleatorio">Generar Mapa Aleatorio</Button>
      </div>

      <div className="flex-grow relative overflow-hidden" style={{ background: '#10101A' }} role="application" aria-roledescription="World map canvas">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={viewBox}
          onWheel={handleWheel}
          onMouseDown={handleSvgMouseDown}
          onMouseMove={handleSvgMouseMove}
          onMouseUp={handleSvgMouseUp}
          onContextMenu={(e) => {
            if (e.target === svgRef.current) {
                e.preventDefault();
            }
          }}
          style={{ cursor: isPanning ? 'grabbing' : (linkingState ? 'crosshair' : 'grab'), outline: 'none' }}
          aria-label="World map canvas"
          tabIndex={0}
        >
          <defs>
            <pattern id="gridPattern" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
              <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
            </pattern>
            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="hsl(150, 50%, 60%)" />
            </marker>
             <marker id="arrowheadLinking" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="hsl(50, 80%, 60%)" />
            </marker>
          </defs>
          <rect width="100%" height="100%" fill="url(#gridPattern)" />
          
          {connections.map(conn => {
            const fromNode = nodes.find(n => n.id === conn.fromNodeId);
            const toNode = nodes.find(n => n.id === conn.toNodeId);
            if (!fromNode || !toNode) return null;

            const p1 = getPortPosition(fromNode, conn.fromDirection);
            const p2 = getPortPosition(toNode, conn.toDirection);
            
            return (
              <path
                key={conn.id}
                d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`}
                stroke={selectedConnectionId === conn.id ? "hsl(50, 100%, 70%)" : "hsl(150, 50%, 60%)"}
                strokeWidth={selectedConnectionId === conn.id ? 3 : 1.5}
                fill="none"
                markerEnd="url(#arrowhead)"
                onClick={(e) => { e.stopPropagation(); setSelectedConnectionId(conn.id); setSelectedNodeId(null); setLinkingState(null); if (svgRef.current) svgRef.current.focus(); }}
                style={{cursor: 'pointer'}}
                aria-label={`Connection from ${fromNode.name} ${conn.fromDirection} to ${toNode.name} ${conn.toDirection}`}
              />
            );
          })}

          {nodes.map(node => (
            <NodeComponent 
                key={node.id} 
                node={node} 
                onNodeDrag={handleNodeDrag}
                onNodeMouseUp={handleNodeMouseUp}
                setSelectedNodeId={setSelectedNodeId}
                setSelectedConnectionId={setSelectedConnectionId}
                setLinkingState={setLinkingState}
                onNavigateToAsset={onNavigateToAsset}
                onShowContextMenu={onShowContextMenu}
                svgGlobalRef={svgRef}
                isLinking={linkingState?.fromNodeId === node.id}
                isNodeSelected={selectedNodeId === node.id}
                isStartNode={worldMapGraph.startScreenNodeId === node.id}
            />
          ))}
          
          {linkingState && svgRef.current && (() => {
            const fromNode = nodes.find(n => n.id === linkingState.fromNodeId);
            if (!fromNode) return null;
            const p1 = getPortPosition(fromNode, linkingState.fromDirection);
            
            let p2x = p1.x;
            let p2y = p1.y;
            switch(linkingState.fromDirection){
                case 'north': p2y -= 20; break;
                case 'south': p2y += 20; break;
                case 'west': p2x -= 20; break;
                case 'east': p2x += 20; break;
            }

            return (
                 <line 
                    x1={p1.x} y1={p1.y} 
                    x2={p2x} 
                    y2={p2y}
                    stroke="hsl(50, 80%, 60%)" 
                    strokeWidth="2" 
                    strokeDasharray="4 2"
                    markerEnd="url(#arrowheadLinking)" 
                    style={{pointerEvents: 'none'}}
                />
            );

          })()}

        </svg>
      </div>

      {pendingAutoConnectionProposal && (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn"
            role="dialog"
            aria-modal="true"
            aria-labelledby="autoConnectModalTitle"
        >
          <div className="bg-msx-panelbg p-6 rounded-lg shadow-xl max-w-md w-full animate-slideIn pixel-font" onClick={e => e.stopPropagation()}>
            <h2 id="autoConnectModalTitle" className="text-lg text-msx-highlight mb-4">Auto-Connect Screens?</h2>
            <p className="text-sm text-msx-textprimary mb-1">
              Connect <strong className="text-msx-cyan">{pendingAutoConnectionProposal.fromNodeName}</strong> ({pendingAutoConnectionProposal.fromDirection})
            </p>
            <p className="text-sm text-msx-textprimary mb-4">
              to <strong className="text-msx-cyan">{pendingAutoConnectionProposal.toNodeName}</strong> ({pendingAutoConnectionProposal.toDirection})?
            </p>
            <div className="flex justify-end space-x-2">
              <Button onClick={() => setPendingAutoConnectionProposal(null)} variant="ghost" size="md">Cancel</Button>
              <Button onClick={handleConfirmAutoConnection} variant="primary" size="md">Connect</Button>
            </div>
          </div>
        </div>
      )}

      <div className="p-1 border-t border-msx-border text-xs text-msx-textsecondary pixel-font">
        Nodes: {nodes.length} | Connections: {connections.length} | Start: {nodes.find(n => n.id === worldMapGraph.startScreenNodeId)?.name || 'None'} | Zoom: {zoomLevel.toFixed(2)}x | Grid: {gridSize}px | Keys: W/A/S/D to move selected node.
      </div>

      {isExportAsmModalOpen && (
        <ExportWorldMapASMModal
          isOpen={isExportAsmModalOpen}
          onClose={() => setIsExportAsmModalOpen(false)}
          worldMapGraph={worldMapGraph}
          availableScreenMaps={availableScreenMaps}
          dataOutputFormat={dataOutputFormat}
        />
      )}

      {isRandomMapModalOpen && (
        <RandomMapGeneratorModal
          isOpen={isRandomMapModalOpen}
          onClose={() => setIsRandomMapModalOpen(false)}
        />
      )}
    </Panel>
  );
};
