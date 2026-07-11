import React, { useState, useRef, useEffect, useMemo } from 'react';
import { WorldMapGraph, ScreenMap, Tile, ConnectionDirection, Msx2Screen4TileScreen, Msx2Screen5BitmapRoom, PaletteAsset, Screen5PaletteSlot } from '../../types';
import { Panel } from '../common/Panel';
import { WorldViewIcon, RefreshCwIcon } from '../icons/MsxIcons';
import { MSX1_PALETTE, MSX_SCREEN5_PALETTE, SCREEN2_PIXELS_PER_COLOR_SEGMENT } from '../../constants';
import { Button } from '../common/Button';
import { GridToggleButton } from './GridToggleButton';
import { getScreenModeMetrics } from '../../utils/screenModeConfig';
import { buildScreen5MatrixWorldViewLayout } from '../../utils/screen5WorldViewLayout';
import { ensureScreen5PaletteSlots } from '../../utils/msx2PaletteUtils';

const MSX2_SCREEN_WIDTH = 256;
const MSX2_SCREEN_HEIGHT = 192;

interface WorldViewEditorProps {
  allWorldMapGraphs: WorldMapGraph[];
  allScreenMaps: WorldViewScreen[];
  allTiles: Tile[];
  currentScreenMode: string;
  paletteAssets?: Array<{ id: string; name: string; data?: PaletteAsset }>;
}

type WorldViewScreen = ScreenMap | Msx2Screen4TileScreen | Msx2Screen5BitmapRoom;

const isMsx2Screen4Mode = (vdpMode: unknown): boolean => vdpMode === 'SCREEN4' || vdpMode === 'SCREEN5';

const unwrapWorldViewScreen = (screen: WorldViewScreen | any | undefined): WorldViewScreen | undefined => {
    const data = screen?.data;
    if (data && (isMsx2Screen4Mode(data.vdpMode) || data.vdpMode === 'SCREEN5_BITMAP_ROOM' || data.layers || data.map)) {
        return data as WorldViewScreen;
    }
    return screen as WorldViewScreen | undefined;
};

const isMsx2Screen4TileScreen = (screen: WorldViewScreen | undefined): screen is Msx2Screen4TileScreen => {
    const unwrapped = unwrapWorldViewScreen(screen);
    return !!unwrapped && isMsx2Screen4Mode((unwrapped as Msx2Screen4TileScreen).vdpMode) && Array.isArray((unwrapped as Msx2Screen4TileScreen).tiles);
};

const isMsx2Screen5BitmapRoom = (screen: WorldViewScreen | undefined): screen is Msx2Screen5BitmapRoom => {
    const unwrapped = unwrapWorldViewScreen(screen);
    const vdpMode = (unwrapped as Msx2Screen5BitmapRoom | undefined)?.vdpMode;
    return !!unwrapped
        && (vdpMode === 'SCREEN5_BITMAP_ROOM' || vdpMode === 'SCREEN4_BITMAP_ROOM')
        && !!(unwrapped as Msx2Screen5BitmapRoom).composition;
};

const isScreenMap = (screen: WorldViewScreen | undefined): screen is ScreenMap => {
    const unwrapped = unwrapWorldViewScreen(screen);
    return !!unwrapped && Array.isArray((unwrapped as ScreenMap).layers?.background);
};

const getWorldViewScreenPixelSize = (
    screen: WorldViewScreen,
    baseSliceDim: number
): { width: number; height: number } => {
    const unwrapped = unwrapWorldViewScreen(screen) || screen;
    if (isMsx2Screen4TileScreen(unwrapped)) {
        return { width: MSX2_SCREEN_WIDTH, height: MSX2_SCREEN_HEIGHT };
    }
    if (isMsx2Screen5BitmapRoom(unwrapped)) {
        return { width: unwrapped.width || MSX2_SCREEN_WIDTH, height: unwrapped.height || MSX2_SCREEN_HEIGHT };
    }

    return {
        width: (unwrapped as ScreenMap).width * baseSliceDim,
        height: (unwrapped as ScreenMap).height * baseSliceDim,
    };
};

const resolveMsx2Screen4Color = (screen: Msx2Screen4TileScreen, colorIndex: number): string => {
    return screen.palette?.[colorIndex]?.hex || (colorIndex === 0 ? '#000000' : '#ffffff');
};

const getMsx2TilePixelWidth = (tile: Msx2Screen4TileScreen['tiles'][number] | undefined): number =>
    Math.max(8, Math.min(32, Number(tile?.width ?? tile?.pixels?.[0]?.length ?? 16) || 16));

const getMsx2TilePixelHeight = (tile: Msx2Screen4TileScreen['tiles'][number] | undefined): number =>
    Math.max(8, Math.min(32, Number(tile?.height ?? tile?.pixels?.length ?? 16) || 16));

const renderMsx2Screen4ToCanvas = (
    canvas: HTMLCanvasElement,
    screen: Msx2Screen4TileScreen
) => {
    canvas.width = MSX2_SCREEN_WIDTH;
    canvas.height = MSX2_SCREEN_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = resolveMsx2Screen4Color(screen, 0);
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const anchorSize = Math.max(1, Number(screen.tileSize) || 16);
    const visibleRows = Math.ceil(canvas.height / anchorSize);
    const visibleCols = Math.ceil(canvas.width / anchorSize);

    for (let tileY = 0; tileY < visibleRows; tileY++) {
        for (let tileX = 0; tileX < visibleCols; tileX++) {
            const tileIndex = screen.map?.[tileY]?.[tileX] ?? 0;
            const tile = screen.tiles?.[tileIndex];
            if (!tile) continue;
            const tileWidth = getMsx2TilePixelWidth(tile);
            const tileHeight = getMsx2TilePixelHeight(tile);

            for (let py = 0; py < tileHeight; py++) {
                const destY = tileY * anchorSize + py;
                if (destY >= canvas.height) continue;

                for (let px = 0; px < tileWidth; px++) {
                    const destX = tileX * anchorSize + px;
                    if (destX >= canvas.width) continue;

                    const colorIndex = tile.pixels?.[py]?.[px] ?? 0;
                    ctx.fillStyle = resolveMsx2Screen4Color(screen, colorIndex);
                    ctx.fillRect(destX, destY, 1, 1);
                }
            }
        }
    }
};

const renderMsx2BitmapRoomToCanvas = (
    canvas: HTMLCanvasElement,
    room: Msx2Screen5BitmapRoom,
    worldPaletteSlots?: Screen5PaletteSlot[]
) => {
    canvas.width = room.width || MSX2_SCREEN_WIDTH;
    canvas.height = room.height || MSX2_SCREEN_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const slots = ensureScreen5PaletteSlots(worldPaletteSlots || room.palette).slots;
    const paletteColor = (index: number): string =>
        slots[index]?.hex || slots.find(slot => slot.slotIndex === index)?.hex || (index === 0 ? '#000000' : '#ffffff');
    const atlasPixels = room.atlas?.pixels || [];
    const atlasEntries = new Map((room.atlas?.entries || []).map(entry => [entry.id, entry]));

    const fillRect = (x: number, y: number, w: number, h: number, color: number) => {
        ctx.fillStyle = paletteColor(color);
        ctx.fillRect(x, y, w, h);
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
};

const isTransparentScreen5Color = (color: string): boolean =>
    color === 'rgba(0,0,0,0)' || color === 'transparent' || (color.startsWith('rgba(') && color.endsWith(',0)'));

const createMsx2Screen4SvgDataURL = (screen: Msx2Screen4TileScreen): string => {
    const anchorSize = Math.max(1, Number(screen.tileSize) || 16);
    const visibleRows = Math.ceil(MSX2_SCREEN_HEIGHT / anchorSize);
    const visibleCols = Math.ceil(MSX2_SCREEN_WIDTH / anchorSize);
    const rects: string[] = [];
    const bg = resolveMsx2Screen4Color(screen, 0);

    if (!isTransparentScreen5Color(bg)) {
        rects.push(`<rect x="0" y="0" width="${MSX2_SCREEN_WIDTH}" height="${MSX2_SCREEN_HEIGHT}" fill="${bg}"/>`);
    }

    for (let tileY = 0; tileY < visibleRows; tileY++) {
        for (let tileX = 0; tileX < visibleCols; tileX++) {
            const tileIndex = screen.map?.[tileY]?.[tileX] ?? 0;
            const tile = screen.tiles?.[tileIndex];
            if (!tile) continue;
            const tileWidth = getMsx2TilePixelWidth(tile);
            const tileHeight = getMsx2TilePixelHeight(tile);
            const destBaseX = tileX * anchorSize;
            const destBaseY = tileY * anchorSize;

            for (let py = 0; py < tileHeight; py++) {
                const destY = destBaseY + py;
                if (destY >= MSX2_SCREEN_HEIGHT) continue;
                let runColor = '';
                let runStart = -1;

                const flushRun = (endPx: number) => {
                    if (runStart < 0 || isTransparentScreen5Color(runColor)) return;
                    const x = destBaseX + runStart;
                    const width = Math.min(destBaseX + endPx, MSX2_SCREEN_WIDTH) - x;
                    if (width > 0) {
                        rects.push(`<rect x="${x}" y="${destY}" width="${width}" height="1" fill="${runColor}"/>`);
                    }
                };

                for (let px = 0; px < tileWidth; px++) {
                    const destX = destBaseX + px;
                    if (destX >= MSX2_SCREEN_WIDTH) {
                        flushRun(px);
                        break;
                    }
                    const colorIndex = tile.pixels?.[py]?.[px] ?? 0;
                    const color = resolveMsx2Screen4Color(screen, colorIndex);
                    if (color !== runColor) {
                        flushRun(px);
                        runColor = color;
                        runStart = px;
                    }
                }
                flushRun(tileWidth);
            }
        }
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${MSX2_SCREEN_WIDTH}" height="${MSX2_SCREEN_HEIGHT}" viewBox="0 0 ${MSX2_SCREEN_WIDTH} ${MSX2_SCREEN_HEIGHT}" shape-rendering="crispEdges">${rects.join('')}</svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const renderScreenMapToCanvas = (
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

const renderWorldViewScreenToCanvas = (
    canvas: HTMLCanvasElement,
    screen: WorldViewScreen,
    tileset: Tile[],
    currentScreenMode: string,
    baseSliceDim: number,
    worldPaletteSlots?: Screen5PaletteSlot[]
) => {
    const unwrapped = unwrapWorldViewScreen(screen) || screen;
    if (isMsx2Screen4TileScreen(unwrapped)) {
        renderMsx2Screen4ToCanvas(canvas, unwrapped);
        return;
    }
    if (isMsx2Screen5BitmapRoom(unwrapped)) {
        renderMsx2BitmapRoomToCanvas(canvas, unwrapped, worldPaletteSlots);
        return;
    }

    if (isScreenMap(unwrapped)) {
        renderScreenMapToCanvas(canvas, unwrapped, tileset, currentScreenMode, baseSliceDim);
    }
};

const createWorldViewScreenDataURL = (
    screen: WorldViewScreen,
    tileset: Tile[],
    currentScreenMode: string,
    baseSliceDim: number,
    worldPaletteSlots?: Screen5PaletteSlot[]
): string => {
    const unwrapped = unwrapWorldViewScreen(screen) || screen;
    if (isMsx2Screen4TileScreen(unwrapped)) {
        return createMsx2Screen4SvgDataURL(unwrapped);
    }

    const { width, height } = getWorldViewScreenPixelSize(screen, baseSliceDim);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    renderWorldViewScreenToCanvas(canvas, screen, tileset, currentScreenMode, baseSliceDim, worldPaletteSlots);
    return canvas.toDataURL();
};

const getWorldViewScreenDebugInfo = (screen: WorldViewScreen): { vdpMode: string; tileCount: number; mapRows: number; firstMapValue: string; firstTileColor: string; paletteColor: string } => {
    const msx2 = screen as Msx2Screen4TileScreen;
    const firstMapValue = msx2.map?.[0]?.[0] ?? '';
    const firstTile = Array.isArray(msx2.tiles) ? msx2.tiles[Number(firstMapValue) || 0] : undefined;
    const firstTileColor = firstTile?.pixels?.[0]?.[0] ?? '';
    return {
        vdpMode: String(msx2.vdpMode || 'screenmap'),
        tileCount: Array.isArray(msx2.tiles) ? msx2.tiles.length : 0,
        mapRows: Array.isArray(msx2.map) ? msx2.map.length : 0,
        firstMapValue: String(firstMapValue),
        firstTileColor: String(firstTileColor),
        paletteColor: String(msx2.palette?.[Number(firstTileColor) || 0]?.hex ?? ''),
    };
};

const ScreenCanvas: React.FC<{
    screen: WorldViewScreen;
    tileset: Tile[];
    currentScreenMode: string;
    baseSliceDim: number;
    worldPaletteSlots?: Screen5PaletteSlot[];
}> = React.memo(({ screen, tileset, currentScreenMode, baseSliceDim, worldPaletteSlots }) => {
    const unwrapped = unwrapWorldViewScreen(screen) || screen;
    const { width, height } = getWorldViewScreenPixelSize(unwrapped, baseSliceDim);
    const debugInfo = getWorldViewScreenDebugInfo(unwrapped);
    const dataUrl = useMemo(
        () => createWorldViewScreenDataURL(unwrapped, tileset, currentScreenMode, baseSliceDim, worldPaletteSlots),
        [unwrapped, tileset, currentScreenMode, baseSliceDim, worldPaletteSlots]
    );

    return (
        <img
            src={dataUrl}
            width={width}
            height={height}
            alt={unwrapped.name}
            data-vdp-mode={debugInfo.vdpMode}
            data-tile-count={debugInfo.tileCount}
            data-map-rows={debugInfo.mapRows}
            data-first-map-value={debugInfo.firstMapValue}
            data-first-tile-color={debugInfo.firstTileColor}
            data-palette-color={debugInfo.paletteColor}
            draggable={false}
            style={{ width: `${width}px`, height: `${height}px`, maxWidth: 'none', imageRendering: 'pixelated', display: 'block' }}
        />
    );
});
ScreenCanvas.displayName = 'ScreenCanvas';

export const WorldViewEditor: React.FC<WorldViewEditorProps> = ({
  allWorldMapGraphs,
  allScreenMaps,
  allTiles,
  currentScreenMode,
  paletteAssets = []
}) => {
    const [selectedWorldMapId, setSelectedWorldMapId] = useState<string | null>(null);
    const [layoutMode, setLayoutMode] = useState<'legacyConnections' | 'screen5Matrix'>('legacyConnections');
    const [isGridVisible, setIsGridVisible] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [refreshKey, setRefreshKey] = useState(0);

    const handleToggleGrid = () => setIsGridVisible(prevState => !prevState);

    const screenModeMetrics = useMemo(() => getScreenModeMetrics(currentScreenMode), [currentScreenMode]);
    const EDITOR_BASE_TILE_DIM = screenModeMetrics.baseTileSize;

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

    const worldPaletteSlots = useMemo(() => {
        if (!worldMapGraph) return undefined;
        const paletteAsset = worldMapGraph.paletteAssetId
            ? paletteAssets.find(asset => asset.id === worldMapGraph.paletteAssetId)
            : undefined;
        const paletteData = paletteAsset?.data as PaletteAsset | undefined;
        if (paletteData?.slots?.length) {
            return ensureScreen5PaletteSlots(paletteData.slots).slots;
        }
        const startNode = worldMapGraph.nodes.find(node => node.id === worldMapGraph.startScreenNodeId) || worldMapGraph.nodes[0];
        const startRoom = startNode
            ? allScreenMaps.find(screen => unwrapWorldViewScreen(screen)?.id === startNode.screenAssetId)
            : undefined;
        const unwrappedStartRoom = unwrapWorldViewScreen(startRoom);
        if (isMsx2Screen5BitmapRoom(unwrappedStartRoom)) {
            return ensureScreen5PaletteSlots(unwrappedStartRoom.palette).slots;
        }
        return undefined;
    }, [allScreenMaps, paletteAssets, worldMapGraph]);

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

        if (layoutMode === 'screen5Matrix') {
            return buildScreen5MatrixWorldViewLayout({
                graph: worldMapGraph,
                screens: allScreenMaps,
                getScreenId: screen => unwrapWorldViewScreen(screen)?.id,
                getScreenName: screen => unwrapWorldViewScreen(screen)?.name,
                getScreenSize: screen => getWorldViewScreenPixelSize(unwrapWorldViewScreen(screen) || screen, EDITOR_BASE_TILE_DIM),
            });
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
            const currentScreenMap = allScreenMaps.find(s => unwrapWorldViewScreen(s)?.id === currentNode?.screenAssetId);
            const currentPosition = screenPositions.get(currentNodeId);
    
            if (!currentNode || !currentScreenMap || !currentPosition) continue;
    
            const { width: currentScreenPixelWidth, height: currentScreenPixelHeight } = getWorldViewScreenPixelSize(currentScreenMap, EDITOR_BASE_TILE_DIM);
    
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
                    const neighborScreenMap = allScreenMaps.find(s => unwrapWorldViewScreen(s)?.id === neighborNode?.screenAssetId);
    
                    if (neighborNode && neighborScreenMap) {
                        const { width: neighborPixelWidth, height: neighborPixelHeight } = getWorldViewScreenPixelSize(neighborScreenMap, EDITOR_BASE_TILE_DIM);
    
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
            const screenMap = allScreenMaps.find(s => unwrapWorldViewScreen(s)?.id === worldMapGraph.nodes.find(n => n.id === nodeId)?.screenAssetId);
            if (!screenMap) return null;
            const unwrappedScreenMap = unwrapWorldViewScreen(screenMap) || screenMap;
    
            const { width: screenPixelWidth, height: screenPixelHeight } = getWorldViewScreenPixelSize(unwrappedScreenMap, EDITOR_BASE_TILE_DIM);
    
            minX = Math.min(minX, position.x);
            minY = Math.min(minY, position.y);
            maxX = Math.max(maxX, position.x + screenPixelWidth);
            maxY = Math.max(maxY, position.y + screenPixelHeight);
            
            return {
                key: nodeId,
                screenMap: unwrappedScreenMap,
                left: position.x,
                top: position.y,
                width: screenPixelWidth,
                height: screenPixelHeight,
                title: `Screen: ${unwrappedScreenMap.name} at (${position.x}, ${position.y})`
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
    }, [worldMapGraph, allScreenMaps, EDITOR_BASE_TILE_DIM, layoutMode, refreshKey]);
    
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
        <Panel title="World View" icon={<WorldViewIcon />} className="flex-grow flex flex-col !p-0 select-none">
            <div className="p-2 border-b border-msx-border flex items-center space-x-4 text-xs">
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
                <label htmlFor="world-view-layout" className="font-bold text-msx-textsecondary">Layout:</label>
                <select
                    id="world-view-layout"
                    value={layoutMode}
                    onChange={(e) => setLayoutMode(e.target.value as typeof layoutMode)}
                    className="p-1 bg-msx-panelbg border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent"
                    title="Legacy walks connection rails. SCREEN 5 Matrix uses authored minimap node coordinates."
                >
                    <option value="legacyConnections">Legacy rails</option>
                    <option value="screen5Matrix">SCREEN 5 matrix</option>
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
            </div>
            <div
                ref={containerRef}
                className="w-full h-full bg-msx-black overflow-hidden relative"
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
                                    width: s.width,
                                    height: s.height,
                                    boxSizing: 'border-box',
                                    ...(isGridVisible && {
                                        border: '1px dashed #fff',
                                        boxShadow: '0 0 0 1px #000',
                                    })
                                }}
                                title={s.title}
                            >
                                <ScreenCanvas
                                    screen={s.screenMap}
                                    tileset={allTiles}
                                    currentScreenMode={currentScreenMode}
                                    baseSliceDim={EDITOR_BASE_TILE_DIM}
                                    worldPaletteSlots={worldPaletteSlots}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <p className="text-msx-textsecondary">
                            This World Map has no screens to display. Add nodes in the World Map Editor.
                        </p>
                    </div>
                )}
            </div>
        </Panel>
    );
};
