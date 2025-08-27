import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Boss, Tile, MSXColor, ProjectAsset, ScreenMap } from '../../types';
import { Button } from '../common/Button';
import { createTileDataURL, renderScreenToCanvas } from '../utils/screenUtils';
import { MSX_SCREEN5_PALETTE, EDITOR_BASE_TILE_DIM_S2 } from '../../constants';

interface BossPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    boss: Boss;
    tileset: Tile[];
    allAssets: ProjectAsset[]; // Now receiving all assets
}

const Modal: React.FC<{isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode}> = ({isOpen, onClose, title, children}) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4" onClick={onClose}>
            <div className="bg-msx-panelbg p-4 sm:p-6 rounded-lg shadow-xl animate-slideIn flex flex-col items-center" onClick={e => e.stopPropagation()}>
                <h2 className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4 pixel-font">{title}</h2>
                {children}
                <Button onClick={onClose} variant="primary" size="md" className="mt-4">Close</Button>
            </div>
        </div>
    );
}

export const BossPreviewModal: React.FC<BossPreviewModalProps> = ({ isOpen, onClose, boss, tileset, allAssets }) => {
    const [frameDelay, setFrameDelay] = useState(200);
    const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
    const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);

    const linkedScreenAsset = useMemo(() => {
        if (!boss.linkedScreenId) return null;
        return allAssets.find(a => a.id === boss.linkedScreenId && a.type === 'screenmap');
    }, [boss.linkedScreenId, allAssets]);

    const fullTileset = useMemo(() => allAssets.filter(a => a.type === 'tile').map(a => a.data as Tile), [allAssets]);

    const enabledPhases = useMemo(() => {
        const phasesEnabled = boss.phasesEnabled ?? Array(boss.phases.length).fill(true);
        const enabled = boss.phases.filter((_, index) => phasesEnabled[index]);
        return enabled.length > 0 ? enabled : boss.phases;
    }, [boss.phases, boss.phasesEnabled]);

    useEffect(() => {
        if (!isOpen) return;

        // Render background screen if linked
        const canvas = backgroundCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && linkedScreenAsset) {
            const screenMap = linkedScreenAsset.data as ScreenMap;
            // Assuming SCREEN 2 for now, as renderScreenToCanvas needs a specific mode
            renderScreenToCanvas(canvas, screenMap, fullTileset, "SCREEN 2 (Graphics I)", EDITOR_BASE_TILE_DIM_S2);
        } else if (ctx) {
            // Clear canvas if no screen is linked
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }

        // Handle boss animation
        if (enabledPhases.length === 0) {
            setCurrentPhaseIndex(0);
            return;
        }
        const timer = setTimeout(() => {
            setCurrentPhaseIndex((prevIndex) => (prevIndex + 1) % enabledPhases.length);
        }, frameDelay);

        return () => clearTimeout(timer);
    }, [isOpen, currentPhaseIndex, frameDelay, enabledPhases, linkedScreenAsset, fullTileset]);

    if (!isOpen) return null;

    const currentPhase = enabledPhases[currentPhaseIndex];
    if (!currentPhase) return null;

    const phaseGridWidth = currentPhase.dimensions?.width || 8;
    const phaseGridHeight = currentPhase.dimensions?.height || 8;
    const tileSize = 16;

    const tilesById = useMemo(() => new Map(tileset.map(t => [t.id, t])), [tileset]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Boss Animation Preview">
            <div className="bg-msx-bgcolor p-4 rounded-lg flex flex-col space-y-4 items-center">
                <div className="relative bg-msx-checkerboard border-2 border-msx-border" style={{ width: 256, height: 192 }}>
                    <canvas
                        ref={backgroundCanvasRef}
                        width="256"
                        height="192"
                        className="absolute top-0 left-0 w-full h-full"
                        style={{ imageRendering: 'pixelated' }}
                    />
                    <div
                        className="absolute grid"
                        style={{
                            gridTemplateColumns: `repeat(${phaseGridWidth}, ${tileSize}px)`,
                            gridTemplateRows: `repeat(${phaseGridHeight}, ${tileSize}px)`,
                            width: `${phaseGridWidth * tileSize}px`,
                            height: `${phaseGridHeight * tileSize}px`,
                            imageRendering: 'pixelated',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        {currentPhase.tileMatrix?.flat().map((tileId, index) => {
                            const tile = tileId ? tilesById.get(tileId) : null;
                            const dataUrl = tile ? createTileDataURL(tile, 0, 0, tile.width, tile.height, tile.width, "SCREEN 5 (Graphics IV)") : null;
                            return (
                                <div
                                    key={index}
                                    className="w-full h-full"
                                    style={{
                                        backgroundImage: dataUrl ? `url(${dataUrl})` : 'none',
                                        backgroundSize: 'cover',
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center space-x-2 text-xs w-full max-w-xs">
                    <label htmlFor="frame-delay" className="text-msx-textsecondary whitespace-nowrap">Delay:</label>
                    <input
                        id="frame-delay"
                        type="range"
                        min="50"
                        max="2000"
                        step="50"
                        value={frameDelay}
                        onChange={(e) => setFrameDelay(Number(e.target.value))}
                        className="w-full h-2 bg-msx-border rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="font-mono w-12 text-right">{frameDelay}ms</span>
                </div>
                <div className="text-center text-xs text-msx-textsecondary h-4">
                    {currentPhase.name} ({currentPhaseIndex + 1} / {enabledPhases.length})
                </div>
            </div>
        </Modal>
    );
};
