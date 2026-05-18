import React, { useRef } from 'react';
import { BossPhase, Tile } from '../../types';
import { createTileDataURL } from '../utils/screenUtils';

type BossEditMode = 'tiles' | 'collision' | 'weakpoints' | 'neck' | 'fireorigin';

export interface BossTileSelection {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface BossFireOriginMarker {
    x: number;
    y: number;
    label: string;
    title: string;
    selected?: boolean;
}

/**
 * Props for the BossMovementController component.
 */
interface BossMovementControllerProps {
    /** The current boss phase being edited. */
    phase: BossPhase;
    /** The tileset available for building the boss. */
    tileset: Tile[];
    /** The current editing mode. */
    editMode: BossEditMode;
    /** Callback for when a grid cell is clicked. */
    onGridClick: (x: number, y: number) => void;
    /** Callback for when a grid cell is right-clicked. */
    onGridContextMenu: (event: React.MouseEvent, x: number, y: number) => void;
    /** The current zoom level of the editor. */
    zoom: number;
    /** Whether to show a warning about unassigned tiles. */
    showUnassignedTilesWarning: boolean;
    /** Enables rectangle selection for tile editing. */
    selectionEnabled?: boolean;
    /** Current selected tile rectangle. */
    tileSelection?: BossTileSelection | null;
    /** Callback for changing the selected tile rectangle. */
    onTileSelectionChange?: (selection: BossTileSelection | null) => void;
    /** Attack fire origins to display on top of the boss grid. */
    fireOriginMarkers?: BossFireOriginMarker[];
}

/**
 * A component that provides the main grid-based editor for constructing a boss phase.
 * It handles the display of tiles, collision data, and weak points based on the current edit mode.
 */
export const BossMovementController: React.FC<BossMovementControllerProps> = ({
    phase,
    tileset,
    editMode,
    onGridClick,
    onGridContextMenu,
    zoom = 1,
    showUnassignedTilesWarning,
    selectionEnabled = false,
    tileSelection = null,
    onTileSelectionChange,
    fireOriginMarkers = [],
}) => {
    const dragAnchorRef = useRef<{ x: number; y: number } | null>(null);
    const hasDraggedRef = useRef(false);

    if (!phase || !phase.dimensions) {
        return <div className="p-4 text-msx-textsecondary">No phase selected or phase has no dimensions.</div>;
    }

    const { width, height } = phase.dimensions;
    const normalizeSelection = (startX: number, startY: number, endX: number, endY: number): BossTileSelection => ({
        x: Math.min(startX, endX),
        y: Math.min(startY, endY),
        width: Math.abs(endX - startX) + 1,
        height: Math.abs(endY - startY) + 1,
    });
    const isCellSelected = (x: number, y: number) => (
        !!tileSelection &&
        x >= tileSelection.x &&
        y >= tileSelection.y &&
        x < tileSelection.x + tileSelection.width &&
        y < tileSelection.y + tileSelection.height
    );

    const handleCellMouseDown = (event: React.MouseEvent, x: number, y: number) => {
        if (event.button !== 0) return;
        if (!selectionEnabled) {
            onGridClick(x, y);
            return;
        }

        dragAnchorRef.current = { x, y };
        hasDraggedRef.current = false;
        onTileSelectionChange?.(normalizeSelection(x, y, x, y));
        event.preventDefault();
    };

    const handleCellMouseEnter = (x: number, y: number) => {
        const anchor = dragAnchorRef.current;
        if (!selectionEnabled || !anchor) return;

        if (anchor.x !== x || anchor.y !== y) {
            hasDraggedRef.current = true;
        }
        onTileSelectionChange?.(normalizeSelection(anchor.x, anchor.y, x, y));
    };

    const handleCellMouseUp = (event: React.MouseEvent, x: number, y: number) => {
        if (event.button !== 0) return;
        if (!selectionEnabled) return;

        const anchor = dragAnchorRef.current;
        if (!anchor) return;

        const wasDrag = hasDraggedRef.current;
        dragAnchorRef.current = null;
        hasDraggedRef.current = false;

        if (!wasDrag) {
            onGridClick(x, y);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-2" style={{ userSelect: 'none' }}>
            {showUnassignedTilesWarning && (
                <p className="text-lg text-msx-danger animate-pulse">
                    Warning: TileBanks not assigned
                </p>
            )}
            <div
                className="bg-msx-bgcolor border border-msx-border rounded-md p-1"
                style={{
                    width: 'max-content',
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left'
                }}
            >
                <div
                    className="grid"
                    style={{ gridTemplateColumns: `repeat(${width}, 32px)` }}
                    onMouseLeave={() => {
                        dragAnchorRef.current = null;
                        hasDraggedRef.current = false;
                    }}
                >
                    {Array.from({ length: height * width }).map((_, i) => {
                        const x = i % width;
                        const y = Math.floor(i / width);
                        const tileId = phase.tileMatrix?.[y]?.[x];
                        const tile = tileId ? tileset.find(t => t.id === tileId) : null;
                        const isCollision = phase.collisionMatrix?.[y]?.[x];
                        const isWeakPoint = phase.weakPoints?.find(wp => wp.x === x && wp.y === y);
                        const neckSegmentIndex = phase.neckChain?.segments.findIndex(segment => segment.x === x && segment.y === y) ?? -1;
                        const isNeckSegment = neckSegmentIndex >= 0;
                        const cellFireOrigins = fireOriginMarkers.filter(marker => marker.x === x && marker.y === y);
                        const selectedFireOrigin = cellFireOrigins.find(marker => marker.selected);
                        const fireOriginTitle = cellFireOrigins.length > 0
                            ? ` - fire ${cellFireOrigins.map(marker => marker.title).join(', ')}`
                            : '';

                        return (
                            <div
                                key={i}
                                onMouseDown={(e) => handleCellMouseDown(e, x, y)}
                                onMouseEnter={() => handleCellMouseEnter(x, y)}
                                onMouseUp={(e) => handleCellMouseUp(e, x, y)}
                                onContextMenu={(e) => onGridContextMenu(e, x, y)}
                                className="w-8 h-8 border border-msx-border/20 relative cursor-pointer"
                                title={`x:${x} y:${y}${tile ? ` - ${tile.name}` : ''}${isWeakPoint ? ` - weak dmg ${Math.max(1, isWeakPoint.health || 1)}` : ''}${isNeckSegment ? ` - neck ${neckSegmentIndex + 1}` : ''}${fireOriginTitle}`}
                            >
                                {tile ? (
                                    <img src={createTileDataURL(tile, 0, 0, 32, 32, tile.width, 'SCREEN 2 (Graphics I)')} alt={tile.name} className="w-full h-full" style={{ imageRendering: 'pixelated' }} />
                                ) : (
                                     editMode === 'tiles' && <div className="w-full h-full opacity-50 hover:bg-msx-highlight/30 bg-stripes"></div>
                                )}
                                
                                {editMode === 'collision' && <div className={`absolute inset-0 transition-colors ${isCollision ? 'bg-msx-danger/50' : 'hover:bg-msx-danger/30'}`}></div>}
                                
                                {editMode === 'weakpoints' && (
                                    <div className={`absolute inset-0 flex items-center justify-center font-bold transition-colors 
                                        ${isWeakPoint ? 'border-2 border-yellow-400 text-yellow-400 bg-yellow-400/20' : 'hover:bg-yellow-400/30'}`}
                                    >
                                        {isWeakPoint && Math.max(1, isWeakPoint.health || 1)}
                                    </div>
                                )}

                                {editMode === 'neck' && (
                                    <div className={`absolute inset-0 flex items-center justify-center font-bold transition-colors ${
                                        isNeckSegment ? 'border-2 border-msx-cyan text-msx-cyan bg-msx-cyan/20' : 'hover:bg-msx-cyan/30'
                                    }`}
                                    >
                                        {isNeckSegment && neckSegmentIndex + 1}
                                    </div>
                                )}

                                {editMode === 'fireorigin' && (
                                    <div className={`absolute inset-0 flex items-center justify-center font-bold transition-colors ${
                                        selectedFireOrigin
                                            ? 'border-2 border-orange-400 text-orange-300 bg-orange-400/25'
                                            : cellFireOrigins.length > 0
                                                ? 'border-2 border-orange-400/70 text-orange-300 bg-orange-400/15 hover:bg-orange-400/30'
                                                : 'hover:bg-orange-400/30'
                                    }`}
                                    >
                                        {selectedFireOrigin?.label || cellFireOrigins[0]?.label || ''}
                                    </div>
                                )}

                                {editMode !== 'neck' && isNeckSegment && (
                                    <div className="absolute right-0 top-0 min-w-3 h-3 px-0.5 bg-msx-cyan text-msx-bgcolor text-[0.55rem] leading-3 text-center font-bold">
                                        {neckSegmentIndex + 1}
                                    </div>
                                )}

                                {editMode !== 'fireorigin' && cellFireOrigins.length > 0 && (
                                    <div className={`absolute left-0 top-0 min-w-3 h-3 px-0.5 text-[0.55rem] leading-3 text-center font-bold ${
                                        selectedFireOrigin ? 'bg-orange-400 text-msx-bgcolor' : 'bg-orange-400/80 text-msx-bgcolor'
                                    }`}>
                                        {selectedFireOrigin?.label || cellFireOrigins[0].label}
                                    </div>
                                )}

                                {selectionEnabled && isCellSelected(x, y) && (
                                    <div className="absolute inset-0 pointer-events-none border-2 border-msx-highlight bg-msx-highlight/15" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
             <p className="text-xs text-msx-textsecondary">
                {editMode === 'tiles' ? "Drag to select a block. Click to place the selected tile. Right-click to create/edit a tile." : 
                 editMode === 'collision' ? "Click to toggle collision blocks." : 
                 editMode === 'weakpoints' ? "Click an empty tile to add a weak point. Click a selected weak point again to remove it." :
                 editMode === 'fireorigin' ? "Select an attack in the Attacks panel, then click the boss tile where it fires from." :
                 "Click tiles in order to build the neck movement vector."}
            </p>
        </div>
    );
};
