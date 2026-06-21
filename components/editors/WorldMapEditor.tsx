
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { WorldMapGraph, WorldMapScreenNode, WorldMapConnection, ConnectionDirection, WorldMapTransitionBlockedAction, WorldMapTransitionMode, ScreenMap, Tile, DataFormat, ContextMenuItem, Msx2Screen4TileScreen, Msx2Screen4BitmapRoom, ProjectAsset, PaletteAsset } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon, TrashIcon, SaveFloppyIcon, CodeIcon, PencilIcon } from '../icons/MsxIcons';
import { ExportWorldMapASMModal } from '../modals/ExportWorldMapASMModal';
import { RandomMapGeneratorModal } from '../modals/RandomMapGeneratorModal';
import { ConnectionManagerModal } from '../modals/ConnectionManagerModal';
import { createDefaultScreen5PaletteSlots } from '../../utils/msx2PaletteUtils';

const NODE_WIDTH = 120;
const NODE_HEIGHT = 90;
const PORT_SIZE = 10;
const PORT_OFFSET = 5;
const CONNECTION_PROXIMITY_THRESHOLD_DEFAULT_FACTOR = 1.5; // Multiplier for gridSize
const MSX2_SCREEN_WIDTH = 256;
const MSX2_SCREEN_HEIGHT = 192;

interface WorldMapEditorProps {
  worldMapGraph: WorldMapGraph;
  onUpdate: (data: Partial<WorldMapGraph>, newAssetsToCreate?: ProjectAsset[]) => void;
  availableScreenMaps: WorldMapSelectableScreen[];
  tileset: Tile[];
  currentScreenMode: string;
  dataOutputFormat: DataFormat;
  paletteAssets?: Array<{ id: string; name: string; data?: PaletteAsset }>;
  onNavigateToAsset: (assetId: string) => void;
  onShowContextMenu: (position: { x: number; y: number }, items: ContextMenuItem[]) => void;
  setStatusBarMessage: (message: string) => void;
}

type WorldMapSelectableScreen = ScreenMap | Msx2Screen4TileScreen | Msx2Screen4BitmapRoom;

const isMsx2Screen4Mode = (vdpMode: unknown): boolean => vdpMode === 'SCREEN4' || vdpMode === 'SCREEN5';

const isMsx2Screen4TileScreen = (screen: WorldMapSelectableScreen | undefined): screen is Msx2Screen4TileScreen => {
  return !!screen && isMsx2Screen4Mode((screen as Msx2Screen4TileScreen).vdpMode) && Array.isArray((screen as Msx2Screen4TileScreen).tiles);
};

const isMsx2Screen4BitmapRoom = (screen: WorldMapSelectableScreen | undefined): screen is Msx2Screen4BitmapRoom => {
  return !!screen && (screen as Msx2Screen4BitmapRoom).vdpMode === 'SCREEN4_BITMAP_ROOM' && !!(screen as Msx2Screen4BitmapRoom).composition;
};

const isScreenMap = (screen: WorldMapSelectableScreen | undefined): screen is ScreenMap => {
  return !!screen && !!(screen as ScreenMap).layers;
};

const resolveMsx2Screen4Color = (screen: Msx2Screen4TileScreen, colorIndex: number): string => {
  return screen.palette?.[colorIndex]?.hex || (colorIndex === 0 ? '#000000' : '#ffffff');
};

const getMsx2TilePixelWidth = (tile: Msx2Screen4TileScreen['tiles'][number] | undefined): number =>
  Math.max(8, Math.min(32, Number(tile?.width ?? tile?.pixels?.[0]?.length ?? 16) || 16));

const getMsx2TilePixelHeight = (tile: Msx2Screen4TileScreen['tiles'][number] | undefined): number =>
  Math.max(8, Math.min(32, Number(tile?.height ?? tile?.pixels?.length ?? 16) || 16));

const drawMsx2Screen4Preview = (
  ctx: CanvasRenderingContext2D,
  screen: Msx2Screen4TileScreen,
  previewWidth: number,
  previewHeight: number
): void => {
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = MSX2_SCREEN_WIDTH;
  sourceCanvas.height = MSX2_SCREEN_HEIGHT;
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) return;

  sourceCtx.fillStyle = resolveMsx2Screen4Color(screen, 0);
  sourceCtx.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);

  const anchorSize = screen.tileSize || 16;
  const visibleRows = Math.ceil(sourceCanvas.height / anchorSize);
  const visibleCols = Math.ceil(sourceCanvas.width / anchorSize);

  for (let tileY = 0; tileY < visibleRows; tileY++) {
    for (let tileX = 0; tileX < visibleCols; tileX++) {
      const tileIndex = screen.map?.[tileY]?.[tileX] ?? 0;
      const tile = screen.tiles?.[tileIndex];
      if (!tile) continue;
      const tileWidth = getMsx2TilePixelWidth(tile);
      const tileHeight = getMsx2TilePixelHeight(tile);

      for (let py = 0; py < tileHeight; py++) {
        const destY = tileY * anchorSize + py;
        if (destY >= sourceCanvas.height) continue;

        for (let px = 0; px < tileWidth; px++) {
          const destX = tileX * anchorSize + px;
          if (destX >= sourceCanvas.width) continue;
          const colorIndex = tile.pixels?.[py]?.[px] ?? 0;
          sourceCtx.fillStyle = resolveMsx2Screen4Color(screen, colorIndex);
          sourceCtx.fillRect(destX, destY, 1, 1);
        }
      }
    }
  }

  ctx.drawImage(sourceCanvas, 0, 0, previewWidth, previewHeight);
};

const drawMsx2BitmapRoomPreview = (
  ctx: CanvasRenderingContext2D,
  room: Msx2Screen4BitmapRoom,
  previewWidth: number,
  previewHeight: number
): void => {
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = room.width || MSX2_SCREEN_WIDTH;
  sourceCanvas.height = room.height || MSX2_SCREEN_HEIGHT;
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) return;

  const paletteColor = (index: number): string =>
    room.palette?.find(slot => slot.slotIndex === index)?.hex || room.palette?.[index]?.hex || (index === 0 ? '#000000' : '#ffffff');

  const atlasPixels = room.atlas?.pixels || [];
  const atlasEntries = new Map((room.atlas?.entries || []).map(entry => [entry.id, entry]));

  const fillRect = (x: number, y: number, w: number, h: number, color: number) => {
    sourceCtx.fillStyle = paletteColor(color);
    sourceCtx.fillRect(x, y, w, h);
  };

  for (const command of room.composition?.commands || []) {
    if (command.op === 'fill') {
      fillRect(command.x, command.y, command.w, command.h, command.color);
      continue;
    }
    if (command.op === 'lineH') {
      fillRect(command.x, command.y, command.length, 1, command.color);
      continue;
    }
    if (command.op === 'lineV') {
      fillRect(command.x, command.y, 1, command.length, command.color);
      continue;
    }
    if (command.op === 'copy') {
      const entry = atlasEntries.get(command.atlasEntryId);
      if (!entry) continue;
      const width = command.w ?? entry.w;
      const height = command.h ?? entry.h;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const color = atlasPixels[entry.sy + y]?.[entry.sx + x] ?? 0;
          fillRect(command.dx + x, command.dy + y, 1, 1, color);
        }
      }
    }
  }

  ctx.drawImage(sourceCanvas, 0, 0, previewWidth, previewHeight);
};

// Simplified preview for world map nodes
const createScreenMiniPreviewDataURL = (
  screenMap: WorldMapSelectableScreen | undefined,
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

  if (isMsx2Screen4TileScreen(screenMap)) {
    drawMsx2Screen4Preview(ctx, screenMap, previewWidth, previewHeight);
    return canvas.toDataURL();
  }

  if (isMsx2Screen4BitmapRoom(screenMap)) {
    drawMsx2BitmapRoomPreview(ctx, screenMap, previewWidth, previewHeight);
    return canvas.toDataURL();
  }

  if (!isScreenMap(screenMap)) return canvas.toDataURL();

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
const TRANSITION_MODE_OPTIONS: { value: WorldMapTransitionMode; label: string }[] = [
  { value: 'preserve_y_validated', label: 'Preserve Y' },
  { value: 'preserve_x_validated', label: 'Preserve X' },
  { value: 'fixed_entry', label: 'Fixed Entry' },
  { value: 'door_entry', label: 'Door' },
  { value: 'ladder_entry', label: 'Ladder' },
  { value: 'checkpoint_entry', label: 'Checkpoint' },
];

const defaultTransitionModeForDirection = (direction: ConnectionDirection): WorldMapTransitionMode => (
  direction === 'east' || direction === 'west' ? 'preserve_y_validated' : 'preserve_x_validated'
);

const withDefaultTransitionMetadata = (connection: WorldMapConnection): WorldMapConnection => ({
  ...connection,
  transitionMode: connection.transitionMode || defaultTransitionModeForDirection(connection.fromDirection),
  ifBlocked: connection.ifBlocked || 'deny',
});


export const WorldMapEditor: React.FC<WorldMapEditorProps> = ({
  worldMapGraph,
  onUpdate,
  availableScreenMaps,
  tileset,
  currentScreenMode,
  dataOutputFormat,
  paletteAssets = [],
  onNavigateToAsset,
  onShowContextMenu,
  setStatusBarMessage
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
  const selectedConnection = connections.find(connection => connection.id === selectedConnectionId) || null;
  const CONNECTION_PROXIMITY_THRESHOLD = gridSize * CONNECTION_PROXIMITY_THRESHOLD_DEFAULT_FACTOR;

  const [isExportAsmModalOpen, setIsExportAsmModalOpen] = useState<boolean>(false);
  const [isRandomMapModalOpen, setIsRandomMapModalOpen] = useState<boolean>(false);
  const [editingConnectionsForNode, setEditingConnectionsForNode] = useState<WorldMapScreenNode | null>(null);
  const [movingNodeId, setMovingNodeId] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number, y: number } | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragNodeOffset, setDragNodeOffset] = useState<{ x: number, y: number } | null>(null);


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

  const getPortPosition = (node: WorldMapScreenNode, dir: ConnectionDirection): { x: number; y: number } => {
    switch (dir) {
      case 'north': return { x: node.position.x + NODE_WIDTH / 2, y: node.position.y };
      case 'south': return { x: node.position.x + NODE_WIDTH / 2, y: node.position.y + NODE_HEIGHT };
      case 'west': return { x: node.position.x, y: node.position.y + NODE_HEIGHT / 2 };
      case 'east': return { x: node.position.x + NODE_WIDTH, y: node.position.y + NODE_HEIGHT / 2 };
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
        transitionMode: defaultTransitionModeForDirection(linkingState.fromDirection),
        ifBlocked: 'deny',
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
    if (svgPoint && svgRef.current) {
      svgPoint.x = e.clientX;
      svgPoint.y = e.clientY;
      const CTM = svgRef.current.getScreenCTM()?.inverse();
      if (CTM) {
        const { x: pointerX, y: pointerY } = svgPoint.matrixTransform(CTM);
        const newPanX = pointerX - (pointerX - currentPan.x) * (newZoomLevel / currentZoom);
        const newPanY = pointerY - (pointerY - currentPan.y) * (newZoomLevel / currentZoom);
        onUpdate({ zoomLevel: newZoomLevel, panOffset: { x: newPanX, y: newPanY } });
      } else {
        onUpdate({ zoomLevel: newZoomLevel });
      }
    } else {
      onUpdate({ zoomLevel: newZoomLevel });
    }
  };

  const handleStartNodeDrag = useCallback((nodeId: string, svgX: number, svgY: number) => {
    const node = worldMapGraph.nodes.find(n => n.id === nodeId);
    if (!node) return;
    setDraggingNodeId(nodeId);
    setDragNodeOffset({ x: svgX - node.position.x, y: svgY - node.position.y });
    setMovingNodeId(null);
  }, [worldMapGraph.nodes]);

  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // If a node is being moved, a click on the canvas background should place it.
    // The `NodeComponent`'s own mouseDown handler stops propagation, so this won't fire when clicking another node.
    if (movingNodeId) {
      const svgPoint = svgRef.current?.createSVGPoint();
      if (svgPoint && svgRef.current) {
        svgPoint.x = e.clientX;
        svgPoint.y = e.clientY;
        const CTM = svgRef.current.getScreenCTM()?.inverse();
        if (CTM) {
          const { x: pointerX, y: pointerY } = svgPoint.matrixTransform(CTM);
          const newX = snapToGrid(pointerX - NODE_WIDTH / 2);
          const newY = snapToGrid(pointerY - NODE_HEIGHT / 2);

          onUpdate({
            nodes: worldMapGraph.nodes.map(n =>
              n.id === movingNodeId ? { ...n, position: { x: newX, y: newY } } : n
            )
          });
          setMovingNodeId(null);
        }
      }
    } else if (e.button === 1 || (e.button === 0 && (e.ctrlKey || e.metaKey))) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      if (e.currentTarget) e.currentTarget.style.cursor = 'grabbing';
    } else if (e.button === 0 && e.target === svgRef.current) {
      setSelectedNodeId(null);
      setSelectedConnectionId(null);
      setLinkingState(null);
      setMovingNodeId(null);
      if (svgRef.current) svgRef.current.focus(); // Focus for keyboard events
    }
  };
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      const dx = (e.clientX - panStart.x);
      const dy = (e.clientY - panStart.y);
      onUpdate({ panOffset: { x: worldMapGraph.panOffset.x - dx / worldMapGraph.zoomLevel, y: worldMapGraph.panOffset.y - dy / worldMapGraph.zoomLevel } });
      setPanStart({ x: e.clientX, y: e.clientY });
    } else if (draggingNodeId && dragNodeOffset && svgRef.current) {
      const svgPoint = svgRef.current.createSVGPoint();
      svgPoint.x = e.clientX;
      svgPoint.y = e.clientY;
      const CTM = svgRef.current.getScreenCTM()?.inverse();
      if (CTM) {
        const { x, y } = svgPoint.matrixTransform(CTM);
        const newX = snapToGrid(x - dragNodeOffset.x);
        const newY = snapToGrid(y - dragNodeOffset.y);
        onUpdate({
          nodes: worldMapGraph.nodes.map(n =>
            n.id === draggingNodeId ? { ...n, position: { x: newX, y: newY } } : n
          )
        });
      }
    } else if (movingNodeId && svgRef.current) {
      const svgPoint = svgRef.current.createSVGPoint();
      svgPoint.x = e.clientX;
      svgPoint.y = e.clientY;
      const CTM = svgRef.current.getScreenCTM()?.inverse();
      if (CTM) {
        const { x, y } = svgPoint.matrixTransform(CTM);
        setMousePosition({ x, y });
      }
    }
  };
  const handleSvgMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      setIsPanning(false);
      if (e.currentTarget) e.currentTarget.style.cursor = 'grab';
    } else if (draggingNodeId) {
      const movedNode = worldMapGraph.nodes.find(n => n.id === draggingNodeId);
      if (movedNode) checkForAutoConnections(movedNode);
      setDraggingNodeId(null);
      setDragNodeOffset(null);
    }
  };

  const handleConfirmAutoConnection = () => {
    if (pendingAutoConnectionProposal) {
      const { fromNodeId, fromDirection, toNodeId, toDirection } = pendingAutoConnectionProposal;
      const newConnection: WorldMapConnection = {
        id: `wmconn_auto_${Date.now()}`,
        fromNodeId, fromDirection, toNodeId, toDirection,
        transitionMode: defaultTransitionModeForDirection(fromDirection),
        ifBlocked: 'deny',
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
    const hasMsx2Screens = nodes.some(node => {
      const screen = availableScreenMaps.find(candidate => candidate.id === node.screenAssetId);
      return isMsx2Screen4TileScreen(screen) || isMsx2Screen4BitmapRoom(screen);
    });
    if (hasMsx2Screens) {
      setStatusBarMessage('World Map ASM export is MSX1-only for now; MSX2 SCREEN 4 worlds export through the main Z80/ROM pipeline.');
      return;
    }
    setIsExportAsmModalOpen(true);
  };

  const handleSelectedConnectionChange = (patch: Partial<WorldMapConnection>) => {
    if (!selectedConnectionId) return;
    onUpdate({
      connections: connections.map(connection =>
        connection.id === selectedConnectionId
          ? withDefaultTransitionMetadata({ ...connection, ...patch })
          : connection
      ),
    });
  };

  const handleCenterGrid = () => {
    if (nodes.length === 0) {
      onUpdate({ panOffset: { x: 0, y: 0 }, zoomLevel: 1 });
      return;
    }

    const padding = 50;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    nodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + NODE_WIDTH);
      maxY = Math.max(maxY, node.position.y + NODE_HEIGHT);
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    if (contentWidth <= 0 || contentHeight <= 0) return;

    const svgWidth = svgRef.current?.clientWidth || 1000;
    const svgHeight = svgRef.current?.clientHeight || 700;

    const zoomX = svgWidth / (contentWidth + padding * 2);
    const zoomY = svgHeight / (contentHeight + padding * 2);
    const newZoom = Math.min(zoomX, zoomY, 2); // Cap max zoom at 2x

    const newPanX = minX - padding + (contentWidth + padding * 2 - svgWidth / newZoom) / 2;
    const newPanY = minY - padding + (contentHeight + padding * 2 - svgHeight / newZoom) / 2;

    onUpdate({ panOffset: { x: newPanX, y: newPanY }, zoomLevel: newZoom });
    setStatusBarMessage("Centered view on all screens.");
  };

  const handleAlign = () => {
    const updatedNodes = JSON.parse(JSON.stringify(nodes));

    // First, snap all nodes to the grid
    updatedNodes.forEach((node: WorldMapScreenNode) => {
      node.position.x = snapToGrid(node.position.x);
      node.position.y = snapToGrid(node.position.y);
    });

    // Align connected nodes
    connections.forEach(conn => {
      const fromNode = updatedNodes.find((n: WorldMapScreenNode) => n.id === conn.fromNodeId);
      const toNode = updatedNodes.find((n: WorldMapScreenNode) => n.id === conn.toNodeId);

      if (fromNode && toNode) {
        if (conn.fromDirection === 'east' || conn.fromDirection === 'west') {
          // Horizontal connection, align Y
          const avgY = (fromNode.position.y + toNode.position.y) / 2;
          fromNode.position.y = snapToGrid(avgY);
          toNode.position.y = snapToGrid(avgY);
        } else if (conn.fromDirection === 'north' || conn.fromDirection === 'south') {
          // Vertical connection, align X
          const avgX = (fromNode.position.x + toNode.position.x) / 2;
          fromNode.position.x = snapToGrid(avgX);
          toNode.position.x = snapToGrid(avgX);
        }
      }
    });

    onUpdate({ nodes: updatedNodes });
    setStatusBarMessage("Aligned screens to grid.");
  };

  const handleGenerateAndPlace = (data: { options: any; map: string[][] }) => {
    const { map, options } = data;
    const newNodes: WorldMapScreenNode[] = [];
    const newScreensToCreate: ProjectAsset[] = [];
    const typeCounters: { [key: string]: number } = { M: 0, F: 0, E: 0, K: 0, S: 0, I: 0, O: 0 };
    const typeNames: { [key: string]: string } = { M: 'boss', F: 'final', E: 'enemy', K: 'key', S: 'secret', I: 'item', O: 'normal' };

    map.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell !== 'X') {
          typeCounters[cell]++;
          const isMsx2Screen4 = currentScreenMode === 'SCREEN 4 (Graphics II)';
          const screenId = `${isMsx2Screen4 ? 'msx2screen' : 'screenmap'}_random_${y}_${x}_${Date.now()}`;
          const screenName = `Room_${typeNames[cell] || 'unknown'}_${typeCounters[cell]}`;

          if (isMsx2Screen4) {
            const palette = createDefaultScreen5PaletteSlots();
            const blankTile = Array.from({ length: 16 }, () => Array.from({ length: 16 }, () => 0));
            const floorTile = Array.from({ length: 16 }, (_, py) =>
              Array.from({ length: 16 }, (_, px) => py < 3 ? 15 : (px % 8 < 4 ? 5 : 4))
            );
            const newMsx2Screen: Msx2Screen4TileScreen = {
              id: screenId,
              name: screenName,
              target: 'MSX2',
              vdpMode: 'SCREEN4',
              tileSize: 16,
              widthTiles: 16,
              heightTiles: 12,
              palette,
              tiles: [
                { id: `${screenId}_tile_0`, name: 'Blank', width: 16, height: 16, pixels: blankTile },
                { id: `${screenId}_tile_1`, name: 'Platform', width: 16, height: 16, pixels: floorTile },
              ],
              map: Array.from({ length: 12 }, (_, rowIndex) => Array.from({ length: 16 }, () => rowIndex === 11 ? 1 : 0)),
              collisionMap: Array.from({ length: 12 }, (_, rowIndex) => Array.from({ length: 16 }, () => rowIndex === 11 ? 1 : 0)),
              layers: {
                collision: Array.from({ length: 12 }, (_, rowIndex) => Array.from({ length: 16 }, () => rowIndex === 11 ? 1 : 0)),
                effects: Array.from({ length: 12 }, () => Array.from({ length: 16 }, () => 0)),
                behavior: Array.from({ length: 12 }, () => Array.from({ length: 16 }, () => 0)),
                entities: [],
              },
              runtime: {
                screenKind: 'playable',
                screenEngine: 'player',
                movementMode: 'platform',
                movementModel: 'platform',
                activeAreaX: 0,
                activeAreaY: 0,
                activeAreaWidth: 16,
                activeAreaHeight: 12,
              },
            };

            newScreensToCreate.push({
              id: screenId,
              name: screenName,
              type: 'msx2screen',
              data: newMsx2Screen,
            });

            newNodes.push({
              id: `wmnode_random_${y}_${x}`,
              screenAssetId: screenId,
              name: screenName,
              position: { x: x * (NODE_WIDTH + 40), y: y * (NODE_HEIGHT + 40) },
            });
            return;
          }

          const newScreenMap: ScreenMap = {
            id: screenId,
            name: screenName,
            width: 32, // DEFAULT_SCREEN_WIDTH_TILES
            height: 24, // DEFAULT_SCREEN_HEIGHT_TILES
            screenKind: 'playable',
            screenEngine: 'player',
            layers: {
              background: Array(24).fill(null).map(() => Array(32).fill({ tileId: null })),
              collision: Array(24).fill(null).map(() => Array(32).fill({ tileId: null })),
              effects: Array(24).fill(null).map(() => Array(32).fill({ tileId: null })),
              entities: [],
            },
            effectZones: [],
            activeAreaX: 0,
            activeAreaY: 0,
            activeAreaWidth: 32,
            activeAreaHeight: 24,
            hudConfiguration: { elements: [] },
          };

          newScreensToCreate.push({
            id: screenId,
            name: screenName,
            type: 'screenmap',
            data: newScreenMap,
          });

          newNodes.push({
            id: `wmnode_random_${y}_${x}`,
            screenAssetId: screenId,
            name: screenName,
            position: { x: x * (NODE_WIDTH + 40), y: y * (NODE_HEIGHT + 40) },
          });
        }
      });
    });

    const connections: WorldMapConnection[] = [];
    if (newNodes.length > 0) {
      const nodeGrid: { [key: string]: WorldMapScreenNode } = {};
      newNodes.forEach(node => {
        const x = Math.round(node.position.x / (NODE_WIDTH + 40));
        const y = Math.round(node.position.y / (NODE_HEIGHT + 40));
        nodeGrid[`${x},${y}`] = node;
      });

      const getDirection = (from: { x: number, y: number }, to: { x: number, y: number }): { from: ConnectionDirection, to: ConnectionDirection } | null => {
        if (to.y < from.y) return { from: 'north', to: 'south' };
        if (to.y > from.y) return { from: 'south', to: 'north' };
        if (to.x < from.x) return { from: 'west', to: 'east' };
        if (to.x > from.x) return { from: 'east', to: 'west' };
        return null;
      };

      const visited = new Set<string>();
      const stack: WorldMapScreenNode[] = [];
      const startNode = newNodes[0];
      stack.push(startNode);
      visited.add(startNode.id);

      while (stack.length > 0) {
        const currentNode = stack[stack.length - 1];
        const currentX = Math.round(currentNode.position.x / (NODE_WIDTH + 40));
        const currentY = Math.round(currentNode.position.y / (NODE_HEIGHT + 40));

        const neighbors = [
          { x: currentX, y: currentY - 1 }, // North
          { x: currentX, y: currentY + 1 }, // South
          { x: currentX - 1, y: currentY }, // West
          { x: currentX + 1, y: currentY }, // East
        ];

        const unvisitedNeighbors = neighbors.map(n => nodeGrid[`${n.x},${n.y}`]).filter(n => n && !visited.has(n.id));

        if (unvisitedNeighbors.length > 0) {
          const neighbor = unvisitedNeighbors[Math.floor(Math.random() * unvisitedNeighbors.length)];
          const directions = getDirection({ x: currentX, y: currentY }, { x: Math.round(neighbor.position.x / (NODE_WIDTH + 40)), y: Math.round(neighbor.position.y / (NODE_HEIGHT + 40)) });
          if (directions) {
            connections.push({
              id: `wmconn_random_${connections.length}`,
              fromNodeId: currentNode.id,
              fromDirection: directions.from,
              toNodeId: neighbor.id,
              toDirection: directions.to,
              transitionMode: defaultTransitionModeForDirection(directions.from),
              ifBlocked: 'deny',
            });
          }
          visited.add(neighbor.id);
          stack.push(neighbor);
        } else {
          stack.pop();
        }
      }

      if (options.allowMultiplePaths && newNodes.length > 1) {
        const extraConnectionCount = Math.floor(newNodes.length * 0.15); // Add 15% more connections
        for (let i = 0; i < extraConnectionCount; i++) {
          const node1 = newNodes[Math.floor(Math.random() * newNodes.length)];
          const x1 = Math.round(node1.position.x / (NODE_WIDTH + 40));
          const y1 = Math.round(node1.position.y / (NODE_HEIGHT + 40));

          const neighbors = [
            { x: x1, y: y1 - 1 }, { x: x1, y: y1 + 1 },
            { x: x1 - 1, y: y1 }, { x: x1 + 1, y: y1 },
          ].map(n => nodeGrid[`${n.x},${n.y}`]).filter(n => n);

          if (neighbors.length > 0) {
            const node2 = neighbors[Math.floor(Math.random() * neighbors.length)];
            const connectionExists = connections.some(c =>
              (c.fromNodeId === node1.id && c.toNodeId === node2.id) ||
              (c.fromNodeId === node2.id && c.toNodeId === node1.id)
            );
            if (!connectionExists) {
              const directions = getDirection({ x: x1, y: y1 }, { x: Math.round(node2.position.x / (NODE_WIDTH + 40)), y: Math.round(node2.position.y / (NODE_HEIGHT + 40)) });
              if (directions) {
                connections.push({
                  id: `wmconn_extra_${i}`,
                  fromNodeId: node1.id,
                  fromDirection: directions.from,
                  toNodeId: node2.id,
                  toDirection: directions.to,
                  transitionMode: defaultTransitionModeForDirection(directions.from),
                  ifBlocked: 'deny',
                });
              }
            }
          }
        }
      }
    }

    let startNodeId = newNodes[0]?.id || null;
    if (options.beginInCenter && newNodes.length > 0) {
      let minDistance = Infinity;
      let centerX = (map[0].length / 2) * (NODE_WIDTH + 40);
      let centerY = (map.length / 2) * (NODE_HEIGHT + 40);

      newNodes.forEach(node => {
        const dx = node.position.x - centerX;
        const dy = node.position.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance) {
          minDistance = distance;
          startNodeId = node.id;
        }
      });
    }

    onUpdate({ nodes: newNodes, connections, startScreenNodeId: startNodeId }, newScreensToCreate);
    setStatusBarMessage(`Generated and placed ${newNodes.length} screens and ${connections.length} connections on the map.`);
  };

  interface NodeComponentProps {
    node: WorldMapScreenNode;
    setSelectedNodeId: (id: string | null) => void;
    setSelectedConnectionId: (id: string | null) => void;
    setLinkingState: (state: { fromNodeId: string; fromDirection: ConnectionDirection } | null) => void;
    onNavigateToAsset: (assetId: string) => void;
    onShowContextMenu: (position: { x: number; y: number }, items: ContextMenuItem[]) => void;
    onStartDrag: (nodeId: string, svgX: number, svgY: number) => void;
    svgGlobalRef?: React.RefObject<SVGSVGElement>;
    isLinking: boolean;
    isNodeSelected: boolean;
    isStartNode: boolean;
    isMoving: boolean;
    isDragging: boolean;
  }

  const NodeComponent: React.FC<NodeComponentProps> = React.memo(({
    node,
    setSelectedNodeId,
    setSelectedConnectionId,
    setLinkingState,
    onNavigateToAsset,
    onShowContextMenu,
    onStartDrag,
    svgGlobalRef,
    isLinking,
    isNodeSelected,
    isStartNode,
    isMoving,
    isDragging
  }) => {
    const screenMapAsset = availableScreenMaps.find(sm => sm.id === node.screenAssetId);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();

      if (e.ctrlKey || e.metaKey) {
        // Ctrl+Click: drag the node
        const svgPoint = svgGlobalRef?.current?.createSVGPoint();
        if (svgPoint && svgGlobalRef?.current) {
          svgPoint.x = e.clientX;
          svgPoint.y = e.clientY;
          const CTM = svgGlobalRef.current.getScreenCTM()?.inverse();
          if (CTM) {
            const { x: svgX, y: svgY } = svgPoint.matrixTransform(CTM);
            onStartDrag(node.id, svgX, svgY);
          }
        }
        setSelectedNodeId(node.id);
        setSelectedConnectionId(null);
        setLinkingState(null);
        if (svgGlobalRef?.current) svgGlobalRef.current.focus();
        return;
      }

      setSelectedNodeId(node.id);
      setSelectedConnectionId(null);
      setLinkingState(null);

      if (svgGlobalRef?.current) {
        svgGlobalRef.current.focus(); // Focus SVG for keyboard events
      }

    }, [node.id, setSelectedNodeId, setSelectedConnectionId, setLinkingState, onStartDrag, svgGlobalRef]);

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
        onDoubleClick={() => setEditingConnectionsForNode(node)}
        style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
        role="button"
        aria-label={`Screen node ${node.name}`}
        tabIndex={-1}
      >
        <rect
          width={NODE_WIDTH}
          height={NODE_HEIGHT}
          fill={isNodeSelected ? "hsl(220, 70%, 65%)" : "hsl(220, 30%, 40%)"}
          stroke={isDragging ? "hsl(60, 100%, 70%)" : (isMoving ? "hsl(30, 100%, 70%)" : (isStartNode ? "hsl(100, 70%, 60%)" : (isNodeSelected ? "hsl(220, 80%, 80%)" : "hsl(220, 50%, 70%)")))}
          strokeWidth={isDragging || isMoving || isStartNode || isNodeSelected ? 2.5 : 1.5}
          rx={5}
          ry={5}
        />
        <image
          href={createScreenMiniPreviewDataURL(screenMapAsset, tileset, NODE_WIDTH, NODE_HEIGHT * 0.6, currentScreenMode)}
          x={PORT_OFFSET} y={PORT_OFFSET}
          width={NODE_WIDTH - 2 * PORT_OFFSET} height={NODE_HEIGHT * 0.6 - 2 * PORT_OFFSET}
          preserveAspectRatio="xMidYMid slice"
        />
        <text x={PORT_OFFSET + 5} y={PORT_OFFSET + 15} fill="white" fontSize="14px" className="pixel-font select-none pointer-events-none" style={{ textShadow: '1px 1px 2px black' }}>
          {node.name.split('_')[1]}
        </text>
        <text x={NODE_WIDTH / 2} y={NODE_HEIGHT - 15} textAnchor="middle" fill="white" fontSize="12px" className="pixel-font select-none pointer-events-none">
          {node.name}
        </text>
        {isStartNode &&
          <text x={NODE_WIDTH / 2} y={NODE_HEIGHT - 3} textAnchor="middle" fill="hsl(100, 70%, 60%)" fontSize="10px" className="pixel-font select-none pointer-events-none">START</text>
        }
        {ALL_DIRECTIONS.map(dir => {
          const portPos = getPortPosition({ ...node, position: { x: 0, y: 0 } }, dir);
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
    <Panel title={`World Map Editor: ${worldMapGraph.name}`} className="flex-grow flex flex-col bg-msx-bgcolor select-none" bodyClassName="flex flex-col flex-grow overflow-hidden p-0">
      <div className="p-2 border-b border-msx-border flex space-x-2 items-center flex-wrap shrink-0 z-10 relative bg-msx-bgcolor">
        <div className="flex items-center space-x-1">
          <label className="text-xs pixel-font text-msx-textsecondary">Add Screen:</label>
          <select
            onChange={(e) => { if (e.target.value) handleAddNode(e.target.value); e.target.value = ""; }}
            className="p-1 text-xs bg-msx-panelbg border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent"
            value=""
            aria-label="Add screen to world map"
          >
            <option value="">Select Screen...</option>
            {availableScreenMaps.map(sm => (
              <option key={sm.id} value={sm.id}>
                {sm.name} {isMsx2Screen4BitmapRoom(sm) ? '[MSX2 SCREEN 5 Bitmap]' : isMsx2Screen4TileScreen(sm) ? '[MSX2 SCREEN 4]' : '[ScreenMap]'}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={handleSetStartScreen} size="sm" disabled={!selectedNodeId} variant="secondary">Set Start</Button>
        <Button onClick={handleDeleteSelected} size="sm" disabled={!selectedNodeId && !selectedConnectionId} variant="danger" icon={<TrashIcon className="w-3 h-3" />}>Delete Sel.</Button>
        <div className="flex items-center space-x-1 border-l border-msx-border pl-2">
          <label className="text-xs pixel-font text-msx-textsecondary">World Palette:</label>
          <select
            value={worldMapGraph.paletteAssetId || ''}
            onChange={e => onUpdate({ paletteAssetId: e.target.value || undefined })}
            className="max-w-44 p-1 text-xs bg-msx-panelbg border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent"
            title="Paleta MSX2 compartida que se carga una vez al entrar en este mundo"
          >
            <option value="">Fallback: start room</option>
            {paletteAssets
              .filter(asset => asset.data?.mode === 'SCREEN4' || asset.data?.mode === 'SCREEN5')
              .map(asset => (
                <option key={asset.id} value={asset.id}>{asset.name}</option>
              ))}
          </select>
        </div>
        {selectedConnection && (
          <div className="flex items-center gap-1 border-l border-msx-border pl-2">
            <label className="text-xs pixel-font text-msx-textsecondary">Transition:</label>
            <select
              value={selectedConnection.transitionMode || defaultTransitionModeForDirection(selectedConnection.fromDirection)}
              onChange={e => handleSelectedConnectionChange({ transitionMode: e.target.value as WorldMapTransitionMode })}
              className="p-1 text-xs bg-msx-panelbg border border-msx-border rounded text-msx-textprimary"
              title="How this connection resolves the player entry coordinate"
            >
              {TRANSITION_MODE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <label className="text-xs pixel-font text-msx-textsecondary">Blocked:</label>
            <select
              value={selectedConnection.ifBlocked || 'deny'}
              onChange={e => handleSelectedConnectionChange({ ifBlocked: e.target.value as WorldMapTransitionBlockedAction })}
              className="p-1 text-xs bg-msx-panelbg border border-msx-border rounded text-msx-textprimary"
              title="What happens if the destination entry hitbox overlaps solid tiles"
            >
              <option value="deny">Deny</option>
              <option value="safe_entry">Safe entry</option>
            </select>
          </div>
        )}
        <div className="flex items-center space-x-1">
          <label htmlFor="worldMapZoom" className="text-xs pixel-font text-msx-textsecondary">Zoom:</label>
          <input id="worldMapZoom" type="range" min="0.2" max="3" step="0.05" value={zoomLevel} onChange={e => onUpdate({ zoomLevel: parseFloat(e.target.value) })} className="w-20 accent-msx-accent" />
          <span className="text-xs text-msx-textsecondary">({zoomLevel.toFixed(2)}x)</span>
        </div>
        <div className="flex items-center space-x-1">
          <label htmlFor="worldMapGridSize" className="text-xs pixel-font text-msx-textsecondary">Grid:</label>
          <input id="worldMapGridSize" type="number" min="5" max="50" step="5" value={gridSize} onChange={e => onUpdate({ gridSize: parseInt(e.target.value) })} className="w-12 p-0.5 text-xs bg-msx-panelbg border border-msx-border rounded" />
        </div>
        <Button onClick={() => onUpdate({ panOffset: { x: 0, y: 0 }, zoomLevel: 1 })} size="sm" variant="ghost">Reset View</Button>
        <Button onClick={handleCenterGrid} size="sm" variant="ghost">Center Grid</Button>
        <Button onClick={handleAlign} size="sm" variant="ghost">Align</Button>
        <Button onClick={handleSaveWorldJson} size="sm" variant="secondary" icon={<SaveFloppyIcon className="w-3.5 h-3.5" />} title="Save World Map as JSON">Save JSON</Button>
        <Button onClick={handleOpenExportAsmModal} size="sm" variant="secondary" icon={<CodeIcon className="w-3.5 h-3.5" />} title="Export World Map as ASM">Export ASM</Button>
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
          style={{ cursor: isPanning || draggingNodeId ? 'grabbing' : (linkingState ? 'crosshair' : 'grab'), outline: 'none' }}
          aria-label="World map canvas"
          tabIndex={0}
        >
          <defs>
            <pattern id="gridPattern" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
              <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
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
                style={{ cursor: 'pointer' }}
                aria-label={`Connection from ${fromNode.name} ${conn.fromDirection} to ${toNode.name} ${conn.toDirection}`}
              />
            );
          })}

          {nodes.map(node => (
            <NodeComponent
              key={node.id}
              node={node}
              setSelectedNodeId={setSelectedNodeId}
              setSelectedConnectionId={setSelectedConnectionId}
              setLinkingState={setLinkingState}
              onNavigateToAsset={onNavigateToAsset}
              onShowContextMenu={onShowContextMenu}
              onStartDrag={handleStartNodeDrag}
              svgGlobalRef={svgRef}
              isLinking={linkingState?.fromNodeId === node.id}
              isNodeSelected={selectedNodeId === node.id}
              isStartNode={worldMapGraph.startScreenNodeId === node.id}
              isMoving={movingNodeId === node.id}
              isDragging={draggingNodeId === node.id}
            />
          ))}

          {linkingState && svgRef.current && (() => {
            const fromNode = nodes.find(n => n.id === linkingState.fromNodeId);
            if (!fromNode) return null;
            const p1 = getPortPosition(fromNode, linkingState.fromDirection);

            let p2x = p1.x;
            let p2y = p1.y;
            switch (linkingState.fromDirection) {
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
                style={{ pointerEvents: 'none' }}
              />
            );

          })()}

          {movingNodeId && mousePosition && (() => {
            const movingNode = nodes.find(n => n.id === movingNodeId);
            if (!movingNode) return null;
            const p1 = { x: movingNode.position.x + NODE_WIDTH / 2, y: movingNode.position.y + NODE_HEIGHT / 2 };
            return (
              <line
                x1={p1.x} y1={p1.y}
                x2={mousePosition.x}
                y2={mousePosition.y}
                stroke="hsl(30, 100%, 70%)"
                strokeWidth="2"
                strokeDasharray="4 2"
                style={{ pointerEvents: 'none' }}
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
          availableScreenMaps={availableScreenMaps.filter(screen => isScreenMap(screen) || isMsx2Screen4TileScreen(screen) || isMsx2Screen4BitmapRoom(screen))}
          dataOutputFormat={dataOutputFormat}
        />
      )}

      {isRandomMapModalOpen && (
        <RandomMapGeneratorModal
          isOpen={isRandomMapModalOpen}
          onClose={() => setIsRandomMapModalOpen(false)}
          onGenerateAndPlace={handleGenerateAndPlace}
        />
      )}

      <ConnectionManagerModal
        isOpen={!!editingConnectionsForNode}
        onClose={() => setEditingConnectionsForNode(null)}
        node={editingConnectionsForNode}
        allNodes={nodes}
        connections={connections}
        onUpdateConnections={(newConnections) => onUpdate({ connections: newConnections })}
      />
    </Panel>
  );
};
