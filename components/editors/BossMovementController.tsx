import React from 'react';
import { BossPhase, Tile } from '../../types';
import { createTileDataURL } from '../utils/screenUtils';

type BossEditMode = 'tiles' | 'collision' | 'weakpoints';

interface BossMovementControllerProps {
    phase: BossPhase;
    tileset: Tile[];
    editMode: BossEditMode;
    onGridClick: (x: number, y: number) => void;
    onGridContextMenu: (event: React.MouseEvent, x: number, y: number) => void;
}

export const BossMovementController: React.FC<BossMovementControllerProps> = ({
    phase,
    tileset,
    editMode,
    onGridClick,
    onGridContextMenu
}) => {
    if (!phase || !phase.dimensions) {
        return <div className="p-4 text-msx-textsecondary">No phase selected or phase has no dimensions.</div>;
    }

    const { width, height } = phase.dimensions;

    return (
        <div className="flex flex-col items-center space-y-2" style={{ userSelect: 'none' }}>
            <div className="aspect-square bg-msx-bgcolor border border-msx-border rounded-md overflow-auto p-1" style={{ width: 'min-content' }}>
                <div className="grid" style={{ gridTemplateColumns: `repeat(${width}, 32px)` }}>
                    {Array.from({ length: height * width }).map((_, i) => {
                        const x = i % width;
                        const y = Math.floor(i / width);
                        const tileId = phase.tileMatrix?.[y]?.[x];
                        const tile = tileId ? tileset.find(t => t.id === tileId) : null;
                        const isCollision = phase.collisionMatrix?.[y]?.[x];
                        const isWeakPoint = phase.weakPoints?.find(wp => wp.x === x && wp.y === y);

                        return (
                            <div
                                key={i}
                                onClick={() => onGridClick(x, y)}
                                onContextMenu={(e) => onGridContextMenu(e, x, y)}
                                className="w-8 h-8 border border-msx-border/20 relative cursor-pointer"
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
                                        {isWeakPoint && 'W'}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
             <p className="text-xs text-msx-textsecondary">
                {editMode === 'tiles' ? "Right-click a cell to create/edit a tile." : 
                 editMode === 'collision' ? "Click to toggle collision blocks." : 
                 "Click to toggle weak points."}
            </p>
        </div>
    );
};