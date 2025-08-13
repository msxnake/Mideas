
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Sprite, ScreenMap, Tile, ProjectAsset } from '../../types';
import { Button } from '../common/Button';
import { Panel } from '../common/Panel';
import { createSpriteDataURL } from '../utils/screenUtils';
import { MSX_SCREEN5_PALETTE, EDITOR_BASE_TILE_DIM_S2, MSX1_PALETTE, SCREEN2_PIXELS_PER_COLOR_SEGMENT } from '../../constants';

interface AnimationWatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprite: Sprite;
  allAssets: ProjectAsset[];
  currentScreenMode: string;
}

const PREVIEW_WIDTH = 256;
const PREVIEW_HEIGHT = 192;

const renderScreenToDataURL = (screenMap: ScreenMap, tileset: Tile[], currentScreenMode: string): string => {
    const isScreen2 = currentScreenMode === "SCREEN 2 (Graphics I)";
    const baseSliceDim = EDITOR_BASE_TILE_DIM_S2;

    const canvas = document.createElement('canvas');
    canvas.width = screenMap.width * baseSliceDim;
    canvas.height = screenMap.height * baseSliceDim;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
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

    if (canvas.width === PREVIEW_WIDTH && canvas.height === PREVIEW_HEIGHT) {
        return canvas.toDataURL();
    }

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = PREVIEW_WIDTH;
    finalCanvas.height = PREVIEW_HEIGHT;
    const finalCtx = finalCanvas.getContext('2d');
    if (finalCtx) {
        finalCtx.imageSmoothingEnabled = false;
        finalCtx.drawImage(canvas, 0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
        return finalCanvas.toDataURL();
    }
    
    return canvas.toDataURL();
};


export const AnimationWatcherModal: React.FC<AnimationWatcherModalProps> = ({
  isOpen,
  onClose,
  sprite,
  allAssets,
  currentScreenMode
}) => {
  // Controls state
  const [initialX, setInitialX] = useState(128);
  const [initialY, setInitialY] = useState(96);
  const [patrolH, setPatrolH] = useState(true);
  const [patrolV, setPatrolV] = useState(false);
  const [animFrameDurationMs, setAnimFrameDurationMs] = useState(200);
  const [moveSpeed, setMoveSpeed] = useState(5);
  const [zoom, setZoom] = useState(1);
  
  // State for responsive scaling
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);

  // Animation state
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  
  // Background state
  const [backgroundScreenId, setBackgroundScreenId] = useState<string | null>(null);
  const [backgroundDataUrl, setBackgroundDataUrl] = useState<string | null>(null);
  const [isScreenListVisible, setIsScreenListVisible] = useState(false);

  // Refactored animation refs for robust timing
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const animAccumulatorRef = useRef(0);
  const moveAccumulatorRef = useRef(0);
  const directionRef = useRef({ dx: 1, dy: 1 });

  const screenMaps = useMemo(() => allAssets.filter(a => a.type === 'screenmap').map(a => a.data as ScreenMap), [allAssets]);
  const tileset = useMemo(() => allAssets.filter(a => a.type === 'tile').map(a => a.data as Tile), [allAssets]);
  
  // Reset position when initial position changes
  useEffect(() => {
    setPosition({ x: initialX, y: initialY });
    directionRef.current = { dx: 1, dy: 1 };
  }, [initialX, initialY, patrolH, patrolV]);

  // Generate background when screen selection changes
  useEffect(() => {
    if (backgroundScreenId) {
        const screenMap = screenMaps.find(s => s.id === backgroundScreenId);
        if (screenMap) {
            setBackgroundDataUrl(renderScreenToDataURL(screenMap, tileset, currentScreenMode));
        }
    } else {
        setBackgroundDataUrl(null);
    }
  }, [backgroundScreenId, screenMaps, tileset, currentScreenMode]);
  
  // Recalculate scale when modal opens or window resizes
  useEffect(() => {
    if (isOpen) {
        const calculate = () => {
            if (previewContainerRef.current) {
                const containerRect = previewContainerRef.current.getBoundingClientRect();
                const containerWidth = containerRect.width;
                const containerHeight = containerRect.height;
                
                if (containerWidth <= 0 || containerHeight <= 0) return;

                // Subtract padding (p-2 is 0.5rem = 8px on each side)
                const availableWidth = containerWidth - 16;
                const availableHeight = containerHeight - 16;
                
                const scaleX = availableWidth / PREVIEW_WIDTH;
                const scaleY = availableHeight / PREVIEW_HEIGHT;
                
                setFitScale(Math.max(0.1, Math.min(scaleX, scaleY)));
            }
        };

        const observer = new ResizeObserver(calculate);
        if (previewContainerRef.current) {
            observer.observe(previewContainerRef.current);
        }
        
        calculate(); // Initial call

        return () => {
            if (previewContainerRef.current) {
                // eslint-disable-next-line react-hooks/exhaustive-deps
                observer.unobserve(previewContainerRef.current);
            }
        };
    }
  }, [isOpen]);

  const animate = useCallback((time: number) => {
    if (lastTimeRef.current === 0) {
        lastTimeRef.current = time;
        animFrameRef.current = requestAnimationFrame(animate);
        return;
    }

    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    animAccumulatorRef.current += deltaTime;
    moveAccumulatorRef.current += deltaTime;

    // Update animation frame
    if (sprite.frames.length > 1) {
        while (animAccumulatorRef.current >= animFrameDurationMs) {
            setCurrentFrameIndex(prev => (prev + 1) % sprite.frames.length);
            animAccumulatorRef.current -= animFrameDurationMs;
        }
    }
    
    // Update position
    const moveFrameDuration = 1000 / (moveSpeed * 5); // Map speed 1-10 to a reasonable update rate
    const moveSteps = Math.floor(moveAccumulatorRef.current / moveFrameDuration);

    if (moveSteps > 0) {
        moveAccumulatorRef.current -= moveSteps * moveFrameDuration;

        setPosition(prevPos => {
            let newX = prevPos.x;
            let newY = prevPos.y;
            let currentDir = { ...directionRef.current };

            for (let i = 0; i < moveSteps; i++) {
                if (patrolH) {
                    newX += currentDir.dx;
                    if (newX > PREVIEW_WIDTH - sprite.size.width || newX < 0) {
                        currentDir.dx *= -1;
                        newX += currentDir.dx * 2; // correct overshoot
                    }
                }
                if (patrolV) {
                    newY += currentDir.dy;
                    if (newY > PREVIEW_HEIGHT - sprite.size.height || newY < 0) {
                        currentDir.dy *= -1;
                        newY += currentDir.dy * 2; // correct overshoot
                    }
                }
            }
            directionRef.current = currentDir;
            return { x: newX, y: newY };
        });
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, [animFrameDurationMs, moveSpeed, patrolH, patrolV, sprite.frames.length, sprite.size.width, sprite.size.height]);

  useEffect(() => {
    if (isOpen) {
        lastTimeRef.current = 0; // Reset time on open to prevent large initial deltaTime
        animAccumulatorRef.current = 0;
        moveAccumulatorRef.current = 0;
        setCurrentFrameIndex(0);
        setPosition({x: initialX, y: initialY});
        directionRef.current = { dx: 1, dy: 1 };
        animFrameRef.current = requestAnimationFrame(animate);
    }
    return () => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
        }
    };
  }, [isOpen, animate, initialX, initialY]);

  if (!isOpen) return null;

  const currentFrameDataUrl = sprite.frames[currentFrameIndex] ? createSpriteDataURL(sprite.frames[currentFrameIndex].data, sprite.size.width, sprite.size.height) : '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4">
        <div className="bg-msx-panelbg p-4 rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-slideIn" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg text-msx-highlight pixel-font">Animation Watcher: {sprite.name}</h3>
                <Button onClick={onClose} variant="danger" size="sm">X</Button>
            </div>
            
            <div className="flex flex-grow overflow-hidden gap-4">
                {/* Preview Area */}
                <div ref={previewContainerRef} className="flex-grow flex items-center justify-center bg-msx-bgcolor p-2 border border-msx-border rounded">
                    <div 
                        className="relative overflow-hidden bg-black" 
                        style={{
                            width: PREVIEW_WIDTH,
                            height: PREVIEW_HEIGHT,
                            transform: `scale(${fitScale * zoom})`,
                            transformOrigin: 'center',
                            imageRendering: 'pixelated'
                        }}
                    >
                        {/* Background */}
                        <div 
                            className="absolute top-0 left-0 w-full h-full"
                            style={{ 
                                background: backgroundDataUrl ? `url(${backgroundDataUrl})` : 'black', 
                                imageRendering: 'pixelated', 
                                backgroundSize: '100% 100%'
                            }}
                        />
                        {/* Sprite */}
                        {currentFrameDataUrl && (
                            <img src={currentFrameDataUrl} alt="sprite" className="absolute" style={{
                                left: position.x, top: position.y,
                                width: sprite.size.width, height: sprite.size.height,
                                imageRendering: 'pixelated'
                            }} />
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="w-64 flex-shrink-0 space-y-3 overflow-y-auto pr-1 text-xs">
                     <Panel title="View Controls">
                        <div className="flex items-center justify-center space-x-2">
                            <Button onClick={() => setZoom(z => Math.max(1, z - 1))} size="sm" disabled={zoom <= 1}>-</Button>
                            <span className="text-msx-textsecondary w-12 text-center">{Math.round(zoom * 100)}%</span>
                            <Button onClick={() => setZoom(z => Math.min(4, z + 1))} size="sm" disabled={zoom >= 4}>+</Button>
                        </div>
                    </Panel>
                    <Panel title="Sprite Placement">
                        <div className="grid grid-cols-2 gap-2">
                           <div>
                               <label>Initial X:</label>
                               <input type="number" value={initialX} onChange={e => setInitialX(parseInt(e.target.value))} max={PREVIEW_WIDTH - sprite.size.width} min={0} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                           </div>
                           <div>
                               <label>Initial Y:</label>
                               <input type="number" value={initialY} onChange={e => setInitialY(parseInt(e.target.value))} max={PREVIEW_HEIGHT - sprite.size.height} min={0} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/>
                           </div>
                        </div>
                    </Panel>
                    <Panel title="Movement Type">
                         <label className="flex items-center justify-between"><span className="text-msx-textsecondary">Horizontal Patrol</span><input type="checkbox" checked={patrolH} onChange={e => setPatrolH(e.target.checked)} className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent"/></label>
                         <label className="flex items-center justify-between"><span className="text-msx-textsecondary">Vertical Patrol</span><input type="checkbox" checked={patrolV} onChange={e => setPatrolV(e.target.checked)} className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent"/></label>
                    </Panel>
                    <Panel title="Speed Settings">
                        <div>
                            <label>Animation Speed ({animFrameDurationMs}ms/frame):</label>
                            <input type="range" value={animFrameDurationMs} onChange={e => setAnimFrameDurationMs(parseInt(e.target.value))} min="50" max="1000" step="50" className="w-full accent-msx-accent"/>
                        </div>
                        <div>
                            <label>Movement Speed ({moveSpeed}):</label>
                            <input type="range" value={moveSpeed} onChange={e => setMoveSpeed(parseInt(e.target.value))} min="1" max="10" step="1" className="w-full accent-msx-accent"/>
                        </div>
                    </Panel>
                     <Panel title="Background">
                        <Button onClick={() => setIsScreenListVisible(p => !p)} className="w-full" variant="secondary" size="sm">
                            {backgroundScreenId ? `Screen: ${screenMaps.find(s => s.id === backgroundScreenId)?.name}` : 'Select Background'}
                        </Button>
                        {isScreenListVisible && (
                            <div className="mt-2 max-h-24 overflow-y-auto space-y-1 border border-msx-border bg-msx-bgcolor rounded p-1">
                                <Button onClick={() => { setBackgroundScreenId(null); setIsScreenListVisible(false); }} variant="ghost" size="sm" className="w-full text-left">None (Black)</Button>
                                {screenMaps.map(sm => (
                                    <Button key={sm.id} onClick={() => { setBackgroundScreenId(sm.id); setIsScreenListVisible(false); }} variant="ghost" size="sm" className="w-full text-left truncate">{sm.name}</Button>
                                ))}
                                {screenMaps.length === 0 && <p className="text-msx-textsecondary italic p-1">No screens created.</p>}
                            </div>
                        )}
                    </Panel>
                </div>
            </div>
        </div>
    </div>
  );
};