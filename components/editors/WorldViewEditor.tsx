import React, { useState, useRef, useEffect, useMemo } from 'react';
import { WorldMapGraph, ScreenMap, Tile, ConnectionDirection } from '../../types';
import { Panel } from '../common/Panel';
import { WorldViewIcon, RefreshCwIcon } from '../icons/MsxIcons';
import { useWindowManager } from '@/hooks/useWindowManager';
import { WORLD_VIEW_SYSTEM_ASSET_ID } from '../tools/FileExplorerPanel';
import { EDITOR_BASE_TILE_DIM_S2, MSX1_PALETTE, MSX_SCREEN5_PALETTE, SCREEN2_PIXELS_PER_COLOR_SEGMENT } from '../../constants';
import { Button } from '../common/Button';
import { GridToggleButton } from './GridToggleButton';

const SCREEN_EDITOR_BASE_TILE_DIM_OTHER = 16;

interface WorldViewEditorProps {
  allWorldMapGraphs: WorldMapGraph[];
  allScreenMaps: ScreenMap[];
  allTiles: Tile[];
  currentScreenMode: string;
}

const renderScreenToCanvas = (
    canvas: HTMLCanvasElement,
    screenMap: ScreenMap,
    tileset: Tile[],
    currentScreenMode: string,
    baseSliceDim: number
) => {
    const isScreen2 = currentScreenMode === "SCREEN 2 (Graphics I)";

    canvas.width = screenMap.width * baseSliceDim;
    canvas.height = screenMap.height * baseSliceDim;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const defaultBg = isScreen2 ? MSX1_PALETTE[1].hex : MSX_SCREEN5_PALETTE[4].hex;
    ctx.fillStyle = defaultBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const layer = screenMap.layers.background;

    for (let y = 0; y < screenMap.height; y++) {
        for (let x = 0; x < screenMap.width; x++) {
            const screenTile = layer[y]?.[x];
            if (!screenTile?.tileId) continue;

            const tileAsset = tileset.find(t => t.id === screenTile.tileId);
            if (!tileAsset) continue;
            
            const { data: fullPixelData, width: fullAssetWidth, height: fullAssetHeight, lineAttributes } = tileAsset;
            if (!fullPixelData) continue;

            const subTileXCoord = screenTile.subTileX ?? 0;
            const subTileYCoord = screenTile.subTileY ?? 0;
            
            const sX = subTileXCoord * baseSliceDim;
            const sY = subTileYCoord * baseSliceDim;
            
            for (let py = 0; py < baseSliceDim; py++) {
                for (let px = 0; px < baseSliceDim; px++) {
                    const fullDataX = sX + px;
                    const fullDataY = sY + py;

                    if (fullDataY < fullAssetHeight && fullDataX < fullAssetWidth) {
                        let color = fullPixelData[fullDataY][fullDataX];

                        if (isScreen2 && lineAttributes && lineAttributes[fullDataY]) {
                            const segmentIndex = Math.floor(fullDataX / SCREEN2_PIXELS_PER_COLOR_SEGMENT);
                            const attr = lineAttributes[fullDataY][segmentIndex];
                            if (attr && color !== attr.fg && color !== attr.bg) {
                                color = attr.fg;
                            }
                        }
                        
                        ctx.fillStyle = color;
                        ctx.fillRect(x * baseSliceDim + px, y * baseSliceDim + py, 1, 1);
                    }
                }
            }
        }
    }
};

const ScreenCanvas: React.FC<{
    screenMap: ScreenMap;
    tileset: Tile[];
    currentScreenMode: string;
    baseSliceDim: number;
}> = React.memo(({ screenMap, tileset, currentScreenMode, baseSliceDim }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            renderScreenToCanvas(canvasRef.current, screenMap, tileset, currentScreenMode, baseSliceDim);
        }
    }, [screenMap, tileset, currentScreenMode, baseSliceDim]);

    const width = screenMap.width * baseSliceDim;
    const height = screenMap.height * baseSliceDim;

    return <canvas ref={canvasRef} width={width} height={height} style={{ width, height, imageRendering: 'pixelated' }} />;
});
ScreenCanvas.displayName = 'ScreenCanvas';

export const WorldViewEditor: React.FC<WorldViewEditorProps> = ({
  allWorldMapGraphs,
  allScreenMaps,
  allTiles,
  currentScreenMode
}) => {
    const { closeWindow } = useWindowManager();
    const [selectedWorldMapId, setSelectedWorldMapId] = useState<string | null>(null);
    const [isGridVisible, setIsGridVisible] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [refreshKey, setRefreshKey] = useState(0);

    const handleToggleGrid = () => setIsGridVisible(prevState => !prevState);

    const EDITOR_BASE_TILE_DIM = currentScreenMode === "SCREEN 2 (Graphics I)" 
        ? EDITOR_BASE_TILE_DIM_S2 
        : SCREEN_EDITOR_BASE_TILE_DIM_OTHER;

    useEffect(() => {
        if (allWorldMapGraphs.length > 0) {
            if (selectedWorldMapId && allWorldMapGraphs.some(g => g.id === selectedWorldMapId)) {
                return;
            }
            const busiestMap = [...allWorldMapGraphs].sort((a, b) => (b.nodes?.length || 0) - (a.nodes?.length || 0))[0];
            setSelectedWorldMapId(busiestMap.id);
        } else {
            setSelectedWorldMapId(null);
        }
    }, [allWorldMapGraphs, selectedWorldMapId]);
    
    const worldMapGraph = useMemo(() => {
        return allWorldMapGraphs.find(g => g.id === selectedWorldMapId);
    }, [allWorldMapGraphs, selectedWorldMapId]);

    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;
        const observer = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setContainerSize({ width, height });
            }
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);


    const screensToRender = useMemo(() => {
        if (!worldMapGraph || worldMapGraph.nodes.length === 0) {
            return { nodes: [], worldBounds: { minX: 0, minY: 0, width: 0, height: 0 } };
        }
    
        const screenPositions = new Map<string, { x: number, y: number }>();
        const queue: string[] = [];
        const visited = new Set<string>();
    
        const startNodeId = worldMapGraph.startScreenNodeId || worldMapGraph.nodes[0]?.id;
    
        if (startNodeId) {
            queue.push(startNodeId);
            visited.add(startNodeId);
            screenPositions.set(startNodeId, { x: 0, y: 0 });
        }
    
        while (queue.length > 0) {
            const currentNodeId = queue.shift()!;
            const currentNode = worldMapGraph.nodes.find(n => n.id === currentNodeId);
            const currentScreenMap = allScreenMaps.find(s => s.id === currentNode?.screenAssetId);
            const currentPosition = screenPositions.get(currentNodeId);
    
            if (!currentNode || !currentScreenMap || !currentPosition) continue;
    
            const currentScreenPixelWidth = currentScreenMap.width * EDITOR_BASE_TILE_DIM;
            const currentScreenPixelHeight = currentScreenMap.height * EDITOR_BASE_TILE_DIM;
    
            worldMapGraph.connections.forEach(conn => {
                let neighborNodeId: string | null = null;
                let directionToPlaceNeighbor: ConnectionDirection | null = null;
                const oppositeDirections: Record<ConnectionDirection, ConnectionDirection> = { north: 'south', south: 'north', east: 'west', west: 'east' };

                if (conn.fromNodeId === currentNodeId && !visited.has(conn.toNodeId)) {
                    neighborNodeId = conn.toNodeId;
                    directionToPlaceNeighbor = conn.fromDirection;
                } else if (conn.toNodeId === currentNodeId && !visited.has(conn.fromNodeId)) {
                    neighborNodeId = conn.fromNodeId;
                    // To place the 'from' node relative to the 'to' node (our current node),
                    // we determine where the 'from' node must be for its exit port (`fromDirection`)
                    // to connect to our current node. This is the opposite of the exit direction.
                    // E.g., if A connects from its 'south' port to B's 'north', A must be to the NORTH of B.
                    directionToPlaceNeighbor = oppositeDirections[conn.fromDirection];
                }
    
                if (neighborNodeId && directionToPlaceNeighbor) {
                    const neighborNode = worldMapGraph.nodes.find(n => n.id === neighborNodeId);
                    const neighborScreenMap = allScreenMaps.find(s => s.id === neighborNode?.screenAssetId);
    
                    if (neighborNode && neighborScreenMap) {
                        const neighborPixelWidth = neighborScreenMap.width * EDITOR_BASE_TILE_DIM;
                        const neighborPixelHeight = neighborScreenMap.height * EDITOR_BASE_TILE_DIM;
    
                        let newX = currentPosition.x;
                        let newY = currentPosition.y;
                        
                        switch (directionToPlaceNeighbor) {
                            case 'east':
                                newX = currentPosition.x + currentScreenPixelWidth;
                                newY = currentPosition.y + (currentScreenPixelHeight / 2) - (neighborPixelHeight / 2);
                                break;
                            case 'west':
                                newX = currentPosition.x - neighborPixelWidth;
                                newY = currentPosition.y + (currentScreenPixelHeight / 2) - (neighborPixelHeight / 2);
                                break;
                            case 'south':
                                newX = currentPosition.x + (currentScreenPixelWidth / 2) - (neighborPixelWidth / 2);
                                newY = currentPosition.y + currentScreenPixelHeight;
                                break;
                            case 'north':
                                newX = currentPosition.x + (currentScreenPixelWidth / 2) - (neighborPixelWidth / 2);
                                newY = currentPosition.y - neighborPixelHeight;
                                break;
                        }
    
                        screenPositions.set(neighborNodeId, { x: Math.round(newX), y: Math.round(newY) });
                        visited.add(neighborNodeId);
                        queue.push(neighborNodeId);
                    }
                }
            });
        }
    
        if (screenPositions.size === 0) {
            return { nodes: [], worldBounds: { minX: 0, minY: 0, width: 0, height: 0 } };
        }
    
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        const nodesToRender = Array.from(screenPositions.entries()).map(([nodeId, position]) => {
            const screenMap = allScreenMaps.find(s => s.id === worldMapGraph.nodes.find(n => n.id === nodeId)?.screenAssetId);
            if (!screenMap) return null;
    
            const screenPixelWidth = screenMap.width * EDITOR_BASE_TILE_DIM;
            const screenPixelHeight = screenMap.height * EDITOR_BASE_TILE_DIM;
    
            minX = Math.min(minX, position.x);
            minY = Math.min(minY, position.y);
            maxX = Math.max(maxX, position.x + screenPixelWidth);
            maxY = Math.max(maxY, position.y + screenPixelHeight);
            
            return {
                key: nodeId,
                screenMap,
                left: position.x,
                top: position.y,
                title: `Screen: ${screenMap.name} at (${position.x}, ${position.y})`
            };
        }).filter((item): item is NonNullable<typeof item> => !!item);
    
        const padding = 50;
        const worldBounds = {
            minX: minX - padding,
            minY: minY - padding,
            width: (maxX - minX) + 2 * padding,
            height: (maxY - minY) + 2 * padding,
        };
        
        return { nodes: nodesToRender, worldBounds };
    }, [worldMapGraph, allScreenMaps, EDITOR_BASE_TILE_DIM, refreshKey]);
    
    useEffect(() => {
        if (containerSize.width > 0 && screensToRender.nodes.length > 0) {
            const { worldBounds } = screensToRender;
            const { width: containerWidth, height: containerHeight } = containerSize;

            if (worldBounds.width <= 0 || worldBounds.height <= 0) return;

            const scaleX = containerWidth / worldBounds.width;
            const scaleY = containerHeight / worldBounds.height;
            const newZoom = Math.min(1.5, scaleX, scaleY) * 0.95;

            const newPanX = (containerWidth - worldBounds.width * newZoom) / 2 - worldBounds.minX * newZoom;
            const newPanY = (containerHeight - worldBounds.height * newZoom) / 2 - worldBounds.minY * newZoom;
            
            setZoom(newZoom);
            setPan({ x: newPanX, y: newPanY });
        }
    }, [screensToRender, containerSize]);

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        const scaleAmount = -e.deltaY * 0.001;
        const newZoom = Math.max(0.1, Math.min(8, zoom + scaleAmount * zoom));
        
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const worldX = (mouseX - pan.x) / zoom;
            const worldY = (mouseY - pan.y) / zoom;
            
            const newPanX = mouseX - worldX * newZoom;
            const newPanY = mouseY - worldY * newZoom;

            setZoom(newZoom);
            setPan({ x: newPanX, y: newPanY });
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button === 1 || (e.button === 0 && (e.ctrlKey || e.metaKey))) {
            setIsPanning(true);
            setPanStart({ x: e.clientX, y: e.clientY });
            if (e.currentTarget) (e.currentTarget as HTMLDivElement).style.cursor = 'grabbing';
        }
    };
    
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isPanning) {
            const dx = e.clientX - panStart.x;
            const dy = e.clientY - panStart.y;
            setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setPanStart({ x: e.clientX, y: e.clientY });
        }
    };
    
    const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isPanning) {
            setIsPanning(false);
            if(e.currentTarget) (e.currentTarget as HTMLDivElement).style.cursor = 'grab';
        }
    };
    
    if (allWorldMapGraphs.length === 0) {
        return (
            <Panel title="World View" icon={<WorldViewIcon />}>
                <p className="p-4 text-center text-msx-textsecondary">No World Map asset found in the project. Create a World Map to begin.</p>
            </Panel>
        );
    }
    
    return (
        <Panel title="World View" icon={<WorldViewIcon />} className="flex-grow flex flex-col !p-0">
            <div className="h-full flex flex-col">
                <div className="p-2 border-b border-msx-border flex items-center space-x-4 text-xs flex-shrink-0">
                    <label htmlFor="world-view-selector" className="font-bold text-msx-textsecondary">Viewing Map:</label>
                <select
                    id="world-view-selector"
                    value={selectedWorldMapId || ''}
                    onChange={(e) => setSelectedWorldMapId(e.target.value)}
                    className="p-1 bg-msx-panelbg border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent"
                >
                    {allWorldMapGraphs.map(graph => (
                        <option key={graph.id} value={graph.id}>
                            {graph.name} ({graph.nodes.length} screens)
                        </option>
                    ))}
                </select>
                <div className="flex-grow"></div>
                <GridToggleButton isGridVisible={isGridVisible} onToggle={handleToggleGrid} />
                <Button 
                    onClick={() => setRefreshKey(k => k + 1)} 
                    size="sm" 
                    variant="secondary" 
                    title="Refresh view if screen assets have changed"
                    icon={<RefreshCwIcon className="w-4 h-4" />}
                >
                    Refresh
                </Button>
                <Button
                    onClick={() => closeWindow(WORLD_VIEW_SYSTEM_ASSET_ID)}
                    size="sm"
                    variant="danger"
                    title="Close World View"
                    className="ml-auto"
                >
                    Close (X)
                </Button>
            </div>
            <div
                ref={containerRef}
                className="w-full flex-grow bg-msx-black overflow-hidden relative"
                style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {screensToRender.nodes.length > 0 ? (
                    <div 
                        className="absolute top-0 left-0"
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            transformOrigin: '0 0'
                        }}
                    >
                        {screensToRender.nodes.map(s => (
                            <div
                                key={s.key}
                                className="absolute"
                                style={{
                                    left: s.left,
                                    top: s.top,
                                    boxSizing: 'border-box',
                                    ...(isGridVisible && {
                                        border: '1px dashed #fff',
                                        boxShadow: '0 0 0 1px #000',
                                    })
                                }}
                                title={s.title}
                            >
                                <ScreenCanvas
                                    screenMap={s.screenMap}
                                    tileset={allTiles}
                                    currentScreenMode={currentScreenMode}
                                    baseSliceDim={EDITOR_BASE_TILE_DIM}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center relative">
                        <p className="text-msx-textsecondary">
                            This World Map has no screens to display. Add nodes in the World Map Editor.
                        </p>
                        {/* Dummy node to enforce a minimum canvas size, as per user suggestion */}
                        <div style={{ position: 'absolute', left: '1920px', top: '1080px' }}>Map</div>
                    </div>
                )}
            </div>
        </div>
        </Panel>
    );
};