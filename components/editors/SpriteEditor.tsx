

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Sprite, MSXColorValue, PixelData, Point, SpriteFrame, DataFormat, ExplosionParams, ExplosionType, EXPLOSION_SPRITE_SIZES, ProjectAsset } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { PlusCircleIcon, SaveIcon, DocumentDuplicateIcon, TrashIcon, CodeIcon, RotateCcwIcon, ArrowUpIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, PencilIcon, EraserIcon, CogIcon, CompressVerticalIcon, CompressHorizontalIcon, FireIcon, PlayIcon, StopIcon, RefreshCwIcon, FolderOpenIcon, SphereIcon, ViewfinderCircleIcon, TilesetIcon, SpriteIcon, ContourIcon } from '../icons/MsxIcons';
import { ExportSpriteASMModal } from '../modals/ExportSpriteASMModal';
import { ExplosionGeneratorModal } from '../modals/ExplosionGeneratorModal'; 
import { MSX_SCREEN5_PALETTE } from '../../constants'; 
import { SpriteImportConfigModal, SpriteImportConfig } from '../modals/SpriteImportConfigModal';
import { AnimationWatcherModal } from '../modals/AnimationWatcherModal';


interface SpriteEditorProps {
  sprite: Sprite;
  onUpdate: (data: Partial<Sprite>) => void;
  onSpriteImported: (newSpriteData: Omit<Sprite, 'id' | 'name'>) => void;
  onCreateSpriteFromFrame: (spriteAssetId: string, frameIndex: number) => void;
  globalSelectedColor: MSXColorValue; 
  dataOutputFormat: DataFormat; 
  allAssets: ProjectAsset[];
  currentScreenMode: string;
  onOpenSpriteSheetModal: () => void;
}

type SpriteToolMode = 'draw' | 'erase' | 'sphere';

const createEmptySpriteFrameData = (width: number, height: number, fillColor: MSXColorValue): PixelData => {
  return Array(height).fill(null).map(() => Array(width).fill(fillColor));
};

interface SpritePixelGridProps {
  pixelData: PixelData;
  onPixelClick?: (point: Point, isRightClick: boolean) => void; 
  pixelSize?: number;
  spriteWidth: number;
  spriteHeight: number;
  className?: string;
  onionSkinEnabled?: boolean;
  onionSkinOpacity?: number;
  prevFrameData?: PixelData | null;
  nextFrameData?: PixelData | null;
  backgroundColor: MSXColorValue;
  toolMode?: SpriteToolMode; // Added for tool-specific behavior
}


const OnionSkinLayer: React.FC<{ pixelData: PixelData; pixelSize: number; spriteWidth: number; spriteHeight: number; opacity: number; backgroundColor: MSXColorValue }> = ({ pixelData, pixelSize, spriteWidth, spriteHeight, opacity, backgroundColor }) => {
  if (!pixelData) return null;
  return (
    <div
      className="grid absolute top-0 left-0 pointer-events-none"
      style={{
        gridTemplateColumns: `repeat(${spriteWidth}, ${pixelSize}px)`,
        gridTemplateRows: `repeat(${spriteHeight}, ${pixelSize}px)`,
        width: spriteWidth * pixelSize,
        height: spriteHeight * pixelSize,
        imageRendering: 'pixelated',
        opacity: opacity,
        zIndex: 1
      }}
      aria-hidden="true"
    >
      {pixelData.map((row, y) =>
        row.map((color, x) => (
          <div
            key={`onion-${x}-${y}`}
            style={{
              backgroundColor: color === backgroundColor ? 'transparent' : color,
              width: `${pixelSize}px`,
              height: `${pixelSize}px`,
            }}
          />
        ))
      )}
    </div>
  );
};


const SpritePixelGrid: React.FC<SpritePixelGridProps> = ({ 
    pixelData, onPixelClick, pixelSize = 10, spriteWidth, spriteHeight, className = "",
    onionSkinEnabled, onionSkinOpacity = 0.3, prevFrameData, nextFrameData, backgroundColor,
    toolMode
}) => {
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isRightMBDown, setIsRightMBDown] = useState(false);

  const handleMouseDown = (e: React.MouseEvent, x: number, y: number) => {
    if (!onPixelClick) return;
    e.preventDefault();
    const isRight = e.button === 2;
    setIsMouseDown(true);
    setIsRightMBDown(isRight);
    onPixelClick({ x, y }, isRight);
  };

  const handleMouseEnter = (x: number, y: number) => {
    if (isMouseDown && onPixelClick) {
      if (toolMode === 'sphere') return; // Do not drag-draw spheres
      onPixelClick({ x, y }, isRightMBDown);
    }
  };

  const handleMouseUp = useCallback(() => { 
    if (onPixelClick) {
      setIsMouseDown(false);
      setIsRightMBDown(false);
    }
  }, [onPixelClick]);

  React.useEffect(() => {
    if (onPixelClick) {
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }
  }, [onPixelClick, handleMouseUp]); 

  if (!pixelData || pixelData.length === 0 || pixelData[0]?.length === 0) { 
     return <div className={`text-xs text-red-400 ${className}`}>No pixel data.</div>;
  }

  return (
    <div
      className={`grid border border-msx-border bg-gray-700 shadow-inner relative ${className}`}
      style={{
        gridTemplateColumns: `repeat(${spriteWidth}, ${pixelSize}px)`,
        gridTemplateRows: `repeat(${spriteHeight}, ${pixelSize}px)`,
        width: spriteWidth * pixelSize,
        height: spriteHeight * pixelSize,
        imageRendering: 'pixelated',
        cursor: onPixelClick ? 'crosshair' : 'default'
      }}
      onMouseLeave={onPixelClick ? handleMouseUp : undefined}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Onion Skin Layers - Rendered first to be in the background */}
      {onionSkinEnabled && prevFrameData && (
        <OnionSkinLayer 
          pixelData={prevFrameData} 
          pixelSize={pixelSize} 
          spriteWidth={spriteWidth} 
          spriteHeight={spriteHeight} 
          opacity={onionSkinOpacity}
          backgroundColor={backgroundColor}
        />
      )}
       {onionSkinEnabled && nextFrameData && (
        <OnionSkinLayer 
          pixelData={nextFrameData} 
          pixelSize={pixelSize} 
          spriteWidth={spriteWidth} 
          spriteHeight={spriteHeight} 
          opacity={onionSkinOpacity}
          backgroundColor={backgroundColor}
        />
      )}

      {/* Main Interactive Grid */}
      {pixelData.map((row, y) =>
        row.map((color, x) => (
          <div
            key={`${x}-${y}`}
            className={onPixelClick ? "hover:outline hover:outline-1 hover:outline-msx-highlight z-10" : "z-10"}
            style={{ 
                backgroundColor: color, 
                width: `${pixelSize}px`, 
                height: `${pixelSize}px`,
                gridColumn: x + 1,
                gridRow: y + 1,
            }}
            onMouseDown={onPixelClick ? (e) => handleMouseDown(e, x, y) : undefined}
            onMouseEnter={onPixelClick ? () => handleMouseEnter(x,y) : undefined}
            onDragStart={(e) => e.preventDefault()}
          />
        ))
      )}
    </div>
  );
};

interface ActiveFragment {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: MSXColorValue;
}


export const SpriteEditor: React.FC<SpriteEditorProps> = ({ sprite, onUpdate, onSpriteImported, onCreateSpriteFromFrame, globalSelectedColor, dataOutputFormat, allAssets, currentScreenMode, onOpenSpriteSheetModal }) => {
  const [localSpriteName, setLocalSpriteName] = useState(sprite.name);
  const [pixelSize, setPixelSize] = useState(sprite.size.width > 16 ? 10 : 16);
  const [showAttributesEditor, setShowAttributesEditor] = useState(false);

  const [isExportAsmModalOpen, setIsExportAsmModalOpen] = useState<boolean>(false);
  const [asmExportConfig, setAsmExportConfig] = useState<{ spriteToExport: Sprite; dataOutputFormat: DataFormat; } | null>(null);

  const [toolMode, setToolMode] = useState<SpriteToolMode>('draw');
  const [sphereRadius, setSphereRadius] = useState<number>(5);
  const [activeBrushColorIndex, setActiveBrushColorIndex] = useState<number>(0); 
  const [activePaletteSetupSlotIndex, setActivePaletteSetupSlotIndex] = useState<number | 'bg' | null>(null);

  const [isExplosionModalOpen, setIsExplosionModalOpen] = useState<boolean>(false);

  const [isMovementEnabled, setIsMovementEnabled] = useState<boolean>(false);
  const [movementDirection, setMovementDirection] = useState<'left-to-right' | 'right-to-left'>('right-to-left');
  const [movementSpeed, setMovementSpeed] = useState<number>(100); 
  const [spriteXPosition, setSpriteXPosition] = useState<number>(0);
  const animationPreviewAreaRef = useRef<HTMLDivElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  const [isAnimationPlaying, setIsAnimationPlaying] = useState(false);
  const [animationSpeedMs, setAnimationSpeedMs] = useState<number>(200);
  const animationIntervalRef = useRef<number | null>(null);

  const [isImportConfigModalOpen, setIsImportConfigModalOpen] = useState(false);
  const [importedImageData, setImportedImageData] = useState<ImageData | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const [isWatcherModalOpen, setIsWatcherModalOpen] = useState(false);

  // New states for Onion Skinning
  const [onionSkinEnabled, setOnionSkinEnabled] = useState(true);
  const [onionSkinOpacity, setOnionSkinOpacity] = useState(0.3);


  useEffect(() => {
    setLocalSpriteName(sprite.name);
    setPixelSize(sprite.size.width > 16 || sprite.size.height > 16 ? 10 : (sprite.size.width > 8 || sprite.size.height > 8 ? 16 : 20));
  }, [sprite.name, sprite.size]);

  const currentFrameData = sprite.frames[sprite.currentFrameIndex]?.data;
  const prevFrameData = sprite.frames[sprite.currentFrameIndex - 1]?.data;
  const nextFrameData = sprite.frames[sprite.currentFrameIndex + 1]?.data;

  const isFrameEmpty = useMemo(() => {
    if (!currentFrameData) return true;
    return currentFrameData.every(row => row.every(pixel => pixel === sprite.backgroundColor));
  }, [currentFrameData, sprite.backgroundColor]);

  const handlePaletteColorChange = useCallback((paletteIndex: number, newColor: MSXColorValue) => {
    const oldColor = sprite.spritePalette[paletteIndex];
    if (oldColor === newColor) return;

    const newSpritePalette = [...sprite.spritePalette] as [MSXColorValue, MSXColorValue, MSXColorValue, MSXColorValue];
    newSpritePalette[paletteIndex] = newColor;

    const updatedFrames = sprite.frames.map(frame => ({
      ...frame,
      data: frame.data.map(row => row.map(pixel => (pixel === oldColor ? newColor : pixel)))
    }));

    onUpdate({ spritePalette: newSpritePalette, frames: updatedFrames });
  }, [sprite.spritePalette, sprite.frames, onUpdate]);

  const handleBackgroundColorChange = useCallback((newBgColor: MSXColorValue) => {
    const oldBgColor = sprite.backgroundColor;
    if (oldBgColor === newBgColor) return;

    const updatedFrames = sprite.frames.map(frame => ({
      ...frame,
      data: frame.data.map(row => row.map(pixel => (pixel === oldBgColor ? newBgColor : pixel)))
    }));
    onUpdate({ backgroundColor: newBgColor, frames: updatedFrames });
  }, [sprite.backgroundColor, sprite.frames, onUpdate]);


  useEffect(() => {
    if (activePaletteSetupSlotIndex !== null && globalSelectedColor) {
      let colorWasAppliedOrIntended = false;
      if (activePaletteSetupSlotIndex === 'bg') {
        if (sprite.backgroundColor !== globalSelectedColor) {
          handleBackgroundColorChange(globalSelectedColor);
        }
        colorWasAppliedOrIntended = true;
      } else if (typeof activePaletteSetupSlotIndex === 'number') {
        if (sprite.spritePalette[activePaletteSetupSlotIndex] !== globalSelectedColor) {
          handlePaletteColorChange(activePaletteSetupSlotIndex, globalSelectedColor);
        }
        colorWasAppliedOrIntended = true;
      }
      
      if (colorWasAppliedOrIntended) {
        setActivePaletteSetupSlotIndex(null); 
      }
    }
  }, [
    globalSelectedColor, 
    activePaletteSetupSlotIndex, 
    sprite.spritePalette, 
    sprite.backgroundColor, 
    handlePaletteColorChange, 
    handleBackgroundColorChange,
    setActivePaletteSetupSlotIndex 
  ]);

  const drawSphere = useCallback((center: Point) => {
    if (!currentFrameData) return;

    const newData = currentFrameData.map(row => [...row]);
    const colorToApply = sprite.spritePalette[activeBrushColorIndex];
    const radiusSq = sphereRadius * sphereRadius;

    for (let y = 0; y < sprite.size.height; y++) {
        for (let x = 0; x < sprite.size.width; x++) {
            const dx = x - center.x;
            const dy = y - center.y;
            if (dx * dx + dy * dy <= radiusSq) {
                newData[y][x] = colorToApply;
            }
        }
    }
    
    const updatedFrames = sprite.frames.map((frame, index) =>
        index === sprite.currentFrameIndex ? { ...frame, data: newData } : frame
    );
    onUpdate({ frames: updatedFrames });
  }, [currentFrameData, sprite.size, sprite.spritePalette, activeBrushColorIndex, sphereRadius, sprite.currentFrameIndex, sprite.frames, onUpdate]);

  const handlePixelClick = useCallback((point: Point, isRightClick: boolean) => {
    if (!currentFrameData) return;

    if (isRightClick) {
      const newPixelData = currentFrameData.map(row => [...row]);
      if (newPixelData[point.y]?.[point.x] !== sprite.backgroundColor) {
        newPixelData[point.y][point.x] = sprite.backgroundColor;
        const updatedFrames = sprite.frames.map((frame, index) =>
          index === sprite.currentFrameIndex ? { ...frame, data: newPixelData } : frame
        );
        onUpdate({ frames: updatedFrames });
      }
      return;
    }

    if (toolMode === 'sphere') {
      drawSphere(point);
      return;
    }

    const newPixelData = currentFrameData.map(row => [...row]);
    const colorToApply = toolMode === 'draw'
      ? sprite.spritePalette[activeBrushColorIndex]
      : sprite.backgroundColor;

    if (newPixelData[point.y]?.[point.x] !== colorToApply) {
      newPixelData[point.y][point.x] = colorToApply;
      const updatedFrames = sprite.frames.map((frame, index) =>
        index === sprite.currentFrameIndex ? { ...frame, data: newPixelData } : frame
      );
      onUpdate({ frames: updatedFrames });
    }
  }, [currentFrameData, sprite.spritePalette, sprite.backgroundColor, activeBrushColorIndex, toolMode, sprite.currentFrameIndex, onUpdate, sprite.frames, drawSphere]);

  const handleAddContour = () => {
    if (!currentFrameData) return;

    const W = sprite.size.width;
    const H = sprite.size.height;
    const bgColor = sprite.backgroundColor;
    const contourColor = sprite.spritePalette[activeBrushColorIndex];

    const isSpritePixel = Array(H).fill(null).map(() => Array(W).fill(false));
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (currentFrameData[y][x] !== bgColor) {
                isSpritePixel[y][x] = true;
            }
        }
    }
    
    const newData = currentFrameData.map(row => [...row]);
    let contourDrawn = false;

    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (currentFrameData[y][x] === bgColor) { // This is a potential contour pixel
                let isAdjacentToSprite = false;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        
                        const nx = x + dx;
                        const ny = y + dy;

                        if (nx >= 0 && nx < W && ny >= 0 && ny < H && isSpritePixel[ny][nx]) {
                            isAdjacentToSprite = true;
                            break;
                        }
                    }
                    if (isAdjacentToSprite) break;
                }
                
                if (isAdjacentToSprite) {
                    newData[y][x] = contourColor;
                    contourDrawn = true;
                }
            }
        }
    }
    
    if (!contourDrawn) {
        alert("No available space to draw a contour. The sprite might be filling the canvas.");
        return;
    }

    const updatedFrames = sprite.frames.map((frame, index) =>
        index === sprite.currentFrameIndex ? { ...frame, data: newData } : frame
    );
    onUpdate({ frames: updatedFrames });
  };


  const handleFrameManagement = (action: 'add' | 'delete' | 'duplicate' | 'prev' | 'next') => {
    let newFrames = [...sprite.frames];
    let newCurrentFrameIndex = sprite.currentFrameIndex;

    switch (action) {
      case 'add':
        const newFrame: SpriteFrame = {
          id: `frame_${Date.now()}`,
          data: createEmptySpriteFrameData(sprite.size.width, sprite.size.height, sprite.backgroundColor)
        };
        newFrames.push(newFrame);
        newCurrentFrameIndex = newFrames.length - 1;
        break;
      case 'delete':
        if (newFrames.length > 1) {
          newFrames.splice(sprite.currentFrameIndex, 1);
          newCurrentFrameIndex = Math.max(0, sprite.currentFrameIndex - 1);
        } else {
          alert("Cannot delete the last frame.");
        }
        break;
      case 'duplicate':
        if (currentFrameData) {
          const duplicatedFrame: SpriteFrame = {
            id: `frame_dup_${Date.now()}`,
            data: currentFrameData.map(row => [...row])
          };
          newFrames.splice(sprite.currentFrameIndex + 1, 0, duplicatedFrame);
          newCurrentFrameIndex = sprite.currentFrameIndex + 1;
        }
        break;
      case 'prev':
        newCurrentFrameIndex = (sprite.currentFrameIndex - 1 + newFrames.length) % newFrames.length;
        break;
      case 'next':
        newCurrentFrameIndex = (sprite.currentFrameIndex + 1) % newFrames.length;
        break;
    }
    onUpdate({ frames: newFrames, currentFrameIndex: newCurrentFrameIndex });
  };

  const handleClearFrame = () => {
    if (currentFrameData) {
      const clearedData = createEmptySpriteFrameData(sprite.size.width, sprite.size.height, sprite.backgroundColor);
      const updatedFrames = sprite.frames.map((frame, index) =>
        index === sprite.currentFrameIndex ? { ...frame, data: clearedData } : frame
      );
      onUpdate({ frames: updatedFrames });
    }
  };

  const handleTransform = (action: 'rotate' | 'shiftUp' | 'shiftDown' | 'shiftLeft' | 'shiftRight') => {
    if (!currentFrameData) return;
    let newData = currentFrameData.map(row => [...row]);
    const W = sprite.size.width;
    const H = sprite.size.height;

    switch(action) {
        case 'rotate': 
            if (W !== H) { alert("Rotate only works for square sprites currently."); return; }
            const rotated = Array(H).fill(null).map(() => Array(W).fill(sprite.backgroundColor));
            for(let y=0; y<H; y++) {
                for(let x=0; x<W; x++) {
                    rotated[x][W-1-y] = newData[y][x];
                }
            }
            newData = rotated;
            break;
        case 'shiftUp':
            const firstRow = newData.shift();
            if (firstRow) newData.push(Array(W).fill(sprite.backgroundColor));
            break;
        case 'shiftDown':
            const lastRow = newData.pop();
            if (lastRow) newData.unshift(Array(W).fill(sprite.backgroundColor));
            break;
        case 'shiftLeft':
            newData.forEach(row => {
                row.shift();
                row.push(sprite.backgroundColor);
            });
            break;
        case 'shiftRight':
            newData.forEach(row => {
                row.pop();
                row.unshift(sprite.backgroundColor);
            });
            break;
    }
    const updatedFrames = sprite.frames.map((frame, index) =>
        index === sprite.currentFrameIndex ? { ...frame, data: newData } : frame
    );
    onUpdate({ frames: updatedFrames });
  };

  const handleContractRow = () => {
    if (!currentFrameData || sprite.size.height <= 1) {
      alert("Sprite height too small to contract row.");
      return;
    }
    const H = sprite.size.height;
    const W = sprite.size.width;
    const middleRowIndex = Math.floor((H - 1) / 2);
    
    const newPixelDataForFrame = currentFrameData.filter((_, index) => index !== middleRowIndex);
    newPixelDataForFrame.push(Array(W).fill(sprite.backgroundColor)); 

    const updatedFrames = sprite.frames.map((frame, index) =>
      index === sprite.currentFrameIndex ? { ...frame, data: newPixelDataForFrame } : frame
    );
    onUpdate({ frames: updatedFrames });
  };

  const handleContractColumn = () => {
    if (!currentFrameData || sprite.size.width <= 1) {
      alert("Sprite width too small to contract column.");
      return;
    }
    const W = sprite.size.width;
    const middleColIndex = Math.floor((W - 1) / 2);

    const newPixelDataForFrame = currentFrameData.map(row => {
      const newRow = row.filter((_, index) => index !== middleColIndex);
      newRow.push(sprite.backgroundColor); 
      return newRow;
    });
    
    const updatedFrames = sprite.frames.map((frame, index) =>
      index === sprite.currentFrameIndex ? { ...frame, data: newPixelDataForFrame } : frame
    );
    onUpdate({ frames: updatedFrames });
  };


  const handleResizeSprite = (newWidth: number, newHeight: number) => {
    if (newWidth === sprite.size.width && newHeight === sprite.size.height) return;

    const updatedFrames = sprite.frames.map(frame => {
      const newPixelData: PixelData = [];
      for (let y = 0; y < newHeight; y++) {
        const newRow: MSXColorValue[] = [];
        for (let x = 0; x < newWidth; x++) {
          if (y < frame.data.length && x < frame.data[0].length) {
            newRow.push(frame.data[y][x]);
          } else {
            newRow.push(sprite.backgroundColor);
          }
        }
        newPixelData.push(newRow);
      }
      return { ...frame, data: newPixelData };
    });
    onUpdate({ size: { width: newWidth, height: newHeight }, frames: updatedFrames });
  };

  const handleGenerateExplosion = (params: ExplosionParams) => {
    const { type, size: newSpriteSize, numFrames, intensity, jitter, numSimultaneousColors } = params;
  
    const newFramesArray: SpriteFrame[] = [];
    const epicenter = { x: newSpriteSize / 2, y: newSpriteSize / 2 };
  
    const availableParticleColors = sprite.spritePalette.filter(c => 
        c !== sprite.backgroundColor && 
        c !== 'rgba(0,0,0,0)'
    );
    const uniqueAvailableParticleColors = [...new Set(availableParticleColors)];
    if (uniqueAvailableParticleColors.length === 0) {
      uniqueAvailableParticleColors.push(MSX_SCREEN5_PALETTE[8].hex); 
    }
  
    let activeParticles: ActiveFragment[] = [];

    for (let f = 0; f < numFrames; f++) {
      const framePixelData = createEmptySpriteFrameData(newSpriteSize, newSpriteSize, sprite.backgroundColor);
      let particleCounterForFrame = 0;
  
      if (type === "Radial") {
        const maxRadius = (newSpriteSize / 2);
        const frameProgress = (f + 1) / numFrames;
        const currentRadius = maxRadius * Math.pow(frameProgress, 0.7) * (intensity / 100);
        const jitterFactor = jitter / 100;
        const maxJitterPixels = jitterFactor * (newSpriteSize / 4);
        const angleStep = Math.PI / 12; 

        for (let angleTheta = 0; angleTheta < 2 * Math.PI; angleTheta += angleStep) {
          const randomJitterX = (Math.random() - 0.5) * 2 * maxJitterPixels;
          const randomJitterY = (Math.random() - 0.5) * 2 * maxJitterPixels;
          const x = Math.round(epicenter.x + currentRadius * Math.cos(angleTheta) + randomJitterX);
          const y = Math.round(epicenter.y + currentRadius * Math.sin(angleTheta) + randomJitterY);
  
          if (x >= 0 && x < newSpriteSize && y >= 0 && y < newSpriteSize) {
            let particleColorForFrame: MSXColorValue;
            const colorsToUseCount = Math.min(numSimultaneousColors, uniqueAvailableParticleColors.length);
            if (colorsToUseCount === 0) { particleColorForFrame = MSX_SCREEN5_PALETTE[8].hex; }
            else if (numSimultaneousColors === 1) {
                const colorIndex = Math.floor(frameProgress * uniqueAvailableParticleColors.length) % uniqueAvailableParticleColors.length;
                particleColorForFrame = uniqueAvailableParticleColors[colorIndex];
            } else {
                const colorIndexForParticle = (particleCounterForFrame + f) % colorsToUseCount;
                particleColorForFrame = uniqueAvailableParticleColors[colorIndexForParticle];
            }
            framePixelData[y][x] = particleColorForFrame;
            particleCounterForFrame++;
          }
        }
      } else if (type === "Fragmentada") {
        const numFrags = params.numFragments || 5;
        const speedVar = (params.fragmentSpeedVariation || 30) / 100;
        
        if (f === 0) { 
            activeParticles = []; 
            const baseSpeed = (intensity / 100) * (newSpriteSize / (numFrames * 0.75)); 

            for (let i = 0; i < numFrags; i++) {
                const angle = Math.random() * 2 * Math.PI;
                const speedMagnitude = baseSpeed * (1 + (Math.random() - 0.5) * 2 * speedVar);
                
                let particleColor: MSXColorValue;
                const colorsToUseCount = Math.min(numSimultaneousColors, uniqueAvailableParticleColors.length);
                if (colorsToUseCount === 0) { particleColor = MSX_SCREEN5_PALETTE[8].hex; }
                else if (numSimultaneousColors === 1) {
                    const colorIndex = Math.floor((i / numFrags) * uniqueAvailableParticleColors.length) % uniqueAvailableParticleColors.length;
                    particleColor = uniqueAvailableParticleColors[colorIndex];
                } else {
                    const colorIndexForFragment = i % colorsToUseCount;
                    particleColor = uniqueAvailableParticleColors[colorIndexForFragment];
                }

                activeParticles.push({
                    id: `frag-${i}`,
                    x: epicenter.x,
                    y: epicenter.y,
                    vx: Math.cos(angle) * speedMagnitude,
                    vy: Math.sin(angle) * speedMagnitude,
                    color: particleColor,
                });
            }
        }
        
        activeParticles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            const jitterFactor = jitter / 100;
            const maxJitterDisplacement = jitterFactor * (newSpriteSize / 20); 
            p.x += (Math.random() - 0.5) * 2 * maxJitterDisplacement;
            p.y += (Math.random() - 0.5) * 2 * maxJitterDisplacement;

            const px = Math.round(p.x);
            const py = Math.round(p.y);

            if (px >= 0 && px < newSpriteSize && py >= 0 && py < newSpriteSize) {
                framePixelData[py][px] = p.color;
            }
        });
      } else if (type === "Implosión") {
        // Future implementation
      }
  
      newFramesArray.push({
        id: `expframe_${Date.now()}_${f}`,
        data: framePixelData,
      });
    }
  
    onUpdate({
      size: { width: newSpriteSize, height: newSpriteSize },
      frames: newFramesArray,
      currentFrameIndex: 0,
    });
  
    setIsExplosionModalOpen(false);
  };

  const handleExportAsm = () => {
    setAsmExportConfig({ spriteToExport: sprite, dataOutputFormat: dataOutputFormat }); 
    setIsExportAsmModalOpen(true);
  };

  const handleExportToPng = () => {
    if (!sprite || sprite.frames.length === 0) {
        alert("No sprite data to export.");
        return;
    }
    const canvas = document.createElement('canvas');
    const frameWidth = sprite.size.width;
    const frameHeight = sprite.size.height;
    const numFrames = sprite.frames.length;

    canvas.width = frameWidth * numFrames;
    canvas.height = frameHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        alert("Failed to create canvas context for export.");
        return;
    }
    ctx.imageSmoothingEnabled = false;

    sprite.frames.forEach((frame, frameIndex) => {
        const offsetX = frameIndex * frameWidth;
        for (let y = 0; y < frameHeight; y++) {
            for (let x = 0; x < frameWidth; x++) {
                const pixelColor = frame.data[y]?.[x];
                if (pixelColor === sprite.backgroundColor) {
                    ctx.fillStyle = 'rgba(0,0,0,0)'; // Transparent
                } else {
                    ctx.fillStyle = pixelColor || 'rgba(0,0,0,0)'; // Default to transparent if undefined
                }
                ctx.fillRect(offsetX + x, y, 1, 1);
            }
        }
    });

    const dataURL = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `${sprite.name || 'sprite'}_sheet.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(dataURL); // Not needed for data URLs but good practice for blob URLs
  };

  const handleImportFromPngClick = () => {
    importFileRef.current?.click();
  };

  const handlePngFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    alert("Failed to get image context for import.");
                    return;
                }
                ctx.drawImage(img, 0, 0);
                setImportedImageData(ctx.getImageData(0, 0, img.width, img.height));
                setIsImportConfigModalOpen(true);
            };
            img.onerror = () => alert("Failed to load image.");
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
        if (importFileRef.current) importFileRef.current.value = ""; // Reset file input
    }
  };


  useEffect(() => {
    const animate = (timestamp: number) => {
        if (!isMovementEnabled || !animationPreviewAreaRef.current || !currentFrameData) {
            if(animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
            return;
        }

        const elapsed = timestamp - lastUpdateTimeRef.current;
        const actualMovementSpeed = 201 - movementSpeed; 

        if (elapsed > actualMovementSpeed) {
            lastUpdateTimeRef.current = timestamp;
            setSpriteXPosition(prevX => {
                const previewAreaWidth = animationPreviewAreaRef.current?.offsetWidth || 300;
                const spriteVisualWidth = sprite.size.width * 2; 
                let newX = prevX;
                const step = 2; 

                if (movementDirection === 'left-to-right') {
                    newX = prevX + step;
                    if (newX > previewAreaWidth) {
                        newX = -spriteVisualWidth;
                    }
                } else { 
                    newX = prevX - step;
                    if (newX < -spriteVisualWidth) {
                        newX = previewAreaWidth;
                    }
                }
                return newX;
            });
        }
        animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    if (isMovementEnabled) {
        lastUpdateTimeRef.current = performance.now();
        animationFrameIdRef.current = requestAnimationFrame(animate);
    } else {
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }
    }
    return () => {
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
        }
    };
  }, [isMovementEnabled, movementDirection, movementSpeed, sprite.size.width, currentFrameData]); 

  useEffect(() => {
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    if (sprite.frames.length > 1 && isAnimationPlaying) {
      animationIntervalRef.current = window.setInterval(() => {
        onUpdate({ currentFrameIndex: (sprite.currentFrameIndex + 1) % sprite.frames.length });
      }, animationSpeedMs);
    }
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, [sprite.frames.length, sprite.currentFrameIndex, animationSpeedMs, isAnimationPlaying, onUpdate]);


  if (!currentFrameData && sprite.frames.length > 0 && sprite.currentFrameIndex < sprite.frames.length) {
    if (sprite.frames.length > 0) {
      onUpdate({ currentFrameIndex: 0 });
    }
    return <Panel title="Sprite Editor"><p className="p-4 text-red-500">Error: Current frame data is missing. Attempting to recover...</p></Panel>;
  }
  if (!currentFrameData && (sprite.frames.length === 0 || sprite.currentFrameIndex >= sprite.frames.length)) {
       return <Panel title="Sprite Editor"><p className="p-4 text-red-500">Sprite has no frames or current frame is invalid.</p></Panel>;
  }


  return (
    <Panel title={`Sprite Editor: ${localSpriteName}`} className="flex-grow flex flex-col bg-msx-bgcolor">
      <div className="p-2 border-b border-msx-border flex items-center space-x-2 flex-wrap gap-y-1">
        <label htmlFor="spriteName" className="text-xs pixel-font text-msx-textsecondary">Name:</label>
        <input type="text" id="spriteName" value={localSpriteName} onChange={e => setLocalSpriteName(e.target.value)} onBlur={() => onUpdate({name: localSpriteName})} className="p-1 text-xs bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent flex-grow min-w-[100px]" />

        <label htmlFor="spriteWidth" className="text-xs pixel-font text-msx-textsecondary ml-2">Size:</label>
        <select value={sprite.size.width} onChange={e => handleResizeSprite(parseInt(e.target.value), sprite.size.height)} className="p-1 text-xs bg-msx-panelbg border-msx-border rounded">
            {EXPLOSION_SPRITE_SIZES.map(s => <option key={`w-${s}`} value={s}>{s}</option>)}
             {[48, 64].filter(s => !EXPLOSION_SPRITE_SIZES.includes(s as any)).map(s => <option key={`w-${s}`} value={s}>{s}</option>)}
        </select>
        <span className="text-xs">x</span>
        <select value={sprite.size.height} onChange={e => handleResizeSprite(sprite.size.width, parseInt(e.target.value))} className="p-1 text-xs bg-msx-panelbg border-msx-border rounded">
           {EXPLOSION_SPRITE_SIZES.map(s => <option key={`h-${s}`} value={s}>{s}</option>)}
           {[48, 64].filter(s => !EXPLOSION_SPRITE_SIZES.includes(s as any)).map(s => <option key={`h-${s}`} value={s}>{s}</option>)}
        </select>
        
        <Button onClick={handleExportToPng} size="sm" variant="secondary" icon={<SaveIcon />}>Export PNG</Button>
        <Button onClick={handleImportFromPngClick} size="sm" variant="secondary" icon={<FolderOpenIcon />}>Import PNG</Button>
        <input type="file" accept="image/png" ref={importFileRef} onChange={handlePngFileSelected} className="hidden" />
        <Button onClick={onOpenSpriteSheetModal} size="sm" variant="secondary" icon={<TilesetIcon className="w-4 h-4" />} title="Reorder sprite sheet">Sheet</Button>

        <Button onClick={() => setShowAttributesEditor(s => !s)} size="sm" variant="ghost" className="ml-auto" icon={<CogIcon />}>Attribs</Button>
        <Button onClick={handleExportAsm} size="sm" variant="secondary" icon={<CodeIcon />}>Export ASM</Button>
      </div>

      <div className="flex-grow flex overflow-hidden" style={{ userSelect: 'none' }}>
        {/* Left Panel: Tools & Palette */}
        <div className="w-48 p-2 border-r border-msx-border flex-shrink-0 flex flex-col space-y-3 overflow-y-auto">
            <div>
                <h4 className="text-sm pixel-font text-msx-highlight mb-1.5">Tools</h4>
                <div className="space-y-1">
                    <Button onClick={() => setToolMode('draw')} variant={toolMode === 'draw' ? 'primary' : 'ghost'} size="sm" icon={<PencilIcon />} className="w-full" justify="start">Draw</Button>
                    <Button onClick={() => setToolMode('sphere')} variant={toolMode === 'sphere' ? 'primary' : 'ghost'} size="sm" icon={<SphereIcon />} className="w-full" justify="start">Sphere</Button>
                    <Button onClick={() => setToolMode('erase')} variant={toolMode === 'erase' ? 'primary' : 'ghost'} size="sm" icon={<EraserIcon />} className="w-full" justify="start">Erase (BG)</Button>
                </div>
                {toolMode === 'sphere' && (
                  <div className="mt-2 space-y-1 text-xs pt-2 border-t border-msx-border/50">
                    <label htmlFor="sphereRadius" className="block text-msx-textsecondary">Radius ({sphereRadius}px):</label>
                    <input
                        type="range"
                        id="sphereRadius"
                        min="1"
                        max={Math.floor(Math.min(sprite.size.width, sprite.size.height) / 2)}
                        value={sphereRadius}
                        onChange={(e) => setSphereRadius(parseInt(e.target.value))}
                        className="w-full accent-msx-accent"
                    />
                  </div>
                )}
            </div>
            
            <div>
                <h4 className="text-sm pixel-font text-msx-highlight mb-1.5">Active Brush</h4>
                <div className="grid grid-cols-2 gap-1.5">
                    {sprite.spritePalette.map((color, index) => (
                        <div key={`active-brush-${index}`} className="relative">
                            <button
                                className={`w-full h-8 border-2 ${activeBrushColorIndex === index && (toolMode === 'draw' || toolMode === 'sphere') ? 'border-msx-white ring-2 ring-offset-1 ring-msx-panelbg ring-msx-white' : 'border-msx-border hover:border-msx-highlight'}`}
                                style={{backgroundColor: color}}
                                onClick={() => {
                                  setActiveBrushColorIndex(index);
                                  if (toolMode !== 'draw' && toolMode !== 'sphere') {
                                    setToolMode('draw');
                                  }
                                }}
                                title={`Draw with Brush ${index+1}: ${color}`}
                                aria-pressed={activeBrushColorIndex === index && (toolMode === 'draw' || toolMode === 'sphere')}
                                aria-label={`Select brush ${index + 1} for drawing`}
                            >
                               <span className="absolute top-0 left-0 px-0.5 text-[0.5rem] bg-black/30 text-white/70 rounded-br-sm pointer-events-none">B{index+1}</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-auto pt-3 border-t border-msx-border">
                <h4 className="text-sm pixel-font text-msx-highlight mb-1.5">Define Sprite Colors</h4>
                <p className="text-[0.65rem] text-msx-textsecondary mb-1.5">Click a slot, then pick from main MSX Palette Panel.</p>
                 <div className="space-y-2">
                    {sprite.spritePalette.map((color, index) => (
                        <div key={`setup-slot-${index}`} className="flex items-center space-x-2">
                            <span className="text-xs text-msx-textsecondary w-12 pixel-font">Slot {index + 1}:</span>
                            <button
                                onClick={() => setActivePaletteSetupSlotIndex(index)}
                                className={`flex-grow h-6 border-2 rounded ${activePaletteSetupSlotIndex === index ? 'border-msx-white ring-2 ring-offset-1 ring-msx-panelbg ring-msx-white' : 'border-msx-border hover:border-msx-highlight'}`}
                                style={{backgroundColor: color}}
                                title={`Assign color to Palette Slot ${index + 1}. Current: ${color}`}
                                aria-pressed={activePaletteSetupSlotIndex === index}
                                aria-label={`Set color for palette slot ${index + 1}`}
                            />
                        </div>
                    ))}
                    <div className="flex items-center space-x-2 pt-1 border-t border-msx-border/50">
                        <span className="text-xs text-msx-textsecondary w-12 pixel-font">BG:</span>
                        <button
                             onClick={() => setActivePaletteSetupSlotIndex('bg')}
                             className={`flex-grow h-6 border-2 rounded ${activePaletteSetupSlotIndex === 'bg' ? 'border-msx-white ring-2 ring-offset-1 ring-msx-panelbg ring-msx-white' : 'border-msx-border hover:border-msx-highlight'}`}
                             style={{backgroundColor: sprite.backgroundColor,  outline: activePaletteSetupSlotIndex === 'bg' ? '1px dashed #FF8E81' : undefined }}
                             title={`Assign Background Color. Current: ${sprite.backgroundColor}`}
                             aria-pressed={activePaletteSetupSlotIndex === 'bg'}
                             aria-label="Set background color"
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Center Panel: Pixel Grid & Horizontal Animation Preview */}
        <div className="flex-grow p-2 flex flex-col items-center justify-start overflow-hidden">
          {currentFrameData && sprite.size.width > 0 && sprite.size.height > 0 ? (
            <SpritePixelGrid
              pixelData={currentFrameData}
              onPixelClick={handlePixelClick}
              pixelSize={pixelSize}
              spriteWidth={sprite.size.width}
              spriteHeight={sprite.size.height}
              onionSkinEnabled={onionSkinEnabled}
              onionSkinOpacity={onionSkinOpacity}
              prevFrameData={prevFrameData}
              nextFrameData={nextFrameData}
              backgroundColor={sprite.backgroundColor}
              toolMode={toolMode}
            />
          ) : (
            <div className="text-msx-textsecondary pixel-font">
              {sprite.frames.length === 0 ? "No frames in sprite. Add one!" : "Select a frame or check sprite size."}
            </div>
          )}
          <div className="mt-2 text-xs pixel-font text-msx-textsecondary">
            Frame: {sprite.currentFrameIndex + 1} / {sprite.frames.length} |
            Grid Zoom:
            <input type="range" min={sprite.size.width > 32 ? 4 : 8} max="32" value={pixelSize} onChange={(e) => setPixelSize(parseInt(e.target.value))} className="w-20 ml-1 accent-msx-accent" />
          </div>
          
          <div className="mt-3 w-full flex flex-col items-center">
            <div 
                ref={animationPreviewAreaRef} 
                className="w-full h-16 border border-msx-border rounded overflow-hidden relative shadow-inner"
                style={{ backgroundColor: sprite.backgroundColor }}
            >
              {currentFrameData && sprite.size.width > 0 && sprite.size.height > 0 && (
                <div style={{ position: 'absolute', left: `${spriteXPosition}px`, top: `50%`, transform: 'translateY(-50%)' }}>
                    <SpritePixelGrid
                        pixelData={currentFrameData} 
                        spriteWidth={sprite.size.width}
                        spriteHeight={sprite.size.height}
                        pixelSize={2}
                        backgroundColor={sprite.backgroundColor}
                    />
                </div>
              )}
            </div>
            <div className="mt-1.5 flex items-center space-x-2">
              <Button 
                onClick={() => {
                    const nextIsEnabled = !isMovementEnabled;
                    setIsMovementEnabled(nextIsEnabled);
                    if (nextIsEnabled && sprite.frames.length > 1 && !isAnimationPlaying) {
                        setIsAnimationPlaying(true); // Also start frame animation
                    }
                }} 
                variant="ghost" 
                size="sm" 
                icon={isMovementEnabled ? <StopIcon /> : <PlayIcon />} 
                title={isMovementEnabled ? "Pause Horizontal Movement" : "Enable Horizontal Movement & Frame Animation"}
              >
                {isMovementEnabled ? 'Pause Horiz.' : 'Play Horiz.'}
              </Button>
              <Button onClick={() => setMovementDirection(p => p === 'left-to-right' ? 'right-to-left' : 'left-to-right')} variant="ghost" size="sm" icon={<RefreshCwIcon />} title="Switch Direction">{null}</Button>
              <label htmlFor="movementSpeed" className="text-xs text-msx-textsecondary">Speed:</label>
              <input type="range" id="movementSpeed" min="10" max="200" value={movementSpeed} onChange={e => setMovementSpeed(parseInt(e.target.value))} className="w-24 accent-msx-accent" title={`Horizontal Movement Speed (Interval: ${movementSpeed}ms)`}/>
            </div>
          </div>
        </div>

        {/* Right Panel: Frame Management & Animation Preview */}
        <div className="w-48 p-2 border-l border-msx-border flex-shrink-0 flex flex-col space-y-3 overflow-y-auto">
          <Panel title="Animation Tools">
            <div className="text-center">
              {currentFrameData && sprite.size.width > 0 && sprite.size.height > 0 ? (
                  <div className="border border-msx-border mx-auto inline-block" style={{width: sprite.size.width * 2, height: sprite.size.height * 2, imageRendering: 'pixelated', backgroundColor: sprite.backgroundColor}}>
                      <SpritePixelGrid pixelData={currentFrameData} pixelSize={2} spriteWidth={sprite.size.width} spriteHeight={sprite.size.height} backgroundColor={sprite.backgroundColor}/>
                  </div>
              ) : <div className="text-xs text-msx-textsecondary text-center h-16 flex items-center justify-center">No preview</div>}
            </div>
            <div className="mt-1.5 flex items-center space-x-1">
                <Button onClick={() => setIsAnimationPlaying(p => !p)} variant="ghost" size="sm" icon={isAnimationPlaying ? <StopIcon/> : <PlayIcon/>} className="flex-1">{isAnimationPlaying ? "Pause" : "Play"}</Button>
                <Button onClick={() => setIsWatcherModalOpen(true)} variant="secondary" size="sm" icon={<ViewfinderCircleIcon />} title="Open Animation Watcher">Watch</Button>
                <label className="text-[0.6rem] text-msx-textsecondary">Speed:</label>
                <input type="range" min="50" max="1000" step="50" value={animationSpeedMs} onChange={e => setAnimationSpeedMs(parseInt(e.target.value))} className="w-12 accent-msx-accent" title={`Frame Animation Speed: ${animationSpeedMs}ms/frame`}/>
            </div>
            <h4 className="text-sm pixel-font text-msx-highlight mb-1.5 mt-3">Onion Skinning</h4>
            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                  <span>Enable</span>
                  <input type="checkbox" checked={onionSkinEnabled} onChange={e => setOnionSkinEnabled(e.target.checked)} className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"/>
              </label>
              <label className="flex items-center justify-between">
                  <span>Opacity ({Math.round(onionSkinOpacity * 100)}%)</span>
                  <input type="range" min="0.1" max="0.7" step="0.05" value={onionSkinOpacity} onChange={e => setOnionSkinOpacity(parseFloat(e.target.value))} className="w-20 accent-msx-accent" disabled={!onionSkinEnabled}/>
              </label>
            </div>
          </Panel>
          <Panel title="Frame Control">
            <div className="space-y-1">
              <div className="flex space-x-1">
                <Button onClick={() => handleFrameManagement('prev')} variant="ghost" size="sm" className="flex-1" disabled={sprite.frames.length <= 1}>Prev</Button>
                <Button onClick={() => handleFrameManagement('next')} variant="ghost" size="sm" className="flex-1" disabled={sprite.frames.length <= 1}>Next</Button>
              </div>
              <Button onClick={() => handleFrameManagement('add')} variant="secondary" size="sm" icon={<PlusCircleIcon />} className="w-full" justify="start">Add Frame</Button>
              <Button onClick={() => handleFrameManagement('duplicate')} variant="ghost" size="sm" icon={<DocumentDuplicateIcon />} className="w-full" justify="start" disabled={sprite.frames.length === 0}>Duplicate Frame</Button>
              <Button onClick={() => onCreateSpriteFromFrame(sprite.id, sprite.currentFrameIndex)} variant="ghost" size="sm" icon={<SpriteIcon className="w-3.5 h-3.5" />} className="w-full" justify="start" disabled={sprite.frames.length === 0} title="Create a new sprite asset using the current frame">
                New Sprite from Frame
              </Button>
              <Button onClick={() => handleFrameManagement('delete')} variant="danger" size="sm" icon={<TrashIcon />} className="w-full" justify="start" disabled={sprite.frames.length <= 1}>Delete Frame</Button>
            </div>
          </Panel>
           <Panel title="Transform Frame">
                <div className="grid grid-cols-3 gap-1 text-xs mb-2">
                    <Button onClick={() => handleTransform('shiftLeft')} variant="ghost" size="sm" icon={<ArrowLeftIcon className="w-3 h-3"/>} title="Shift Left">{null}</Button>
                    <Button onClick={() => handleTransform('shiftUp')} variant="ghost" size="sm" icon={<ArrowUpIcon className="w-3 h-3"/>} title="Shift Up">{null}</Button>
                    <Button onClick={() => handleTransform('shiftRight')} variant="ghost" size="sm" icon={<ArrowRightIcon className="w-3 h-3"/>} title="Shift Right">{null}</Button>

                    <Button onClick={() => handleTransform('rotate')} variant="ghost" size="sm" icon={<RotateCcwIcon className="w-3 h-3"/>} title="Rotate 90° CW (Square only)">{null}</Button>
                    <Button onClick={() => handleTransform('shiftDown')} variant="ghost" size="sm" icon={<ArrowDownIcon className="w-3 h-3"/>} title="Shift Down">{null}</Button>
                    <Button onClick={handleClearFrame} variant="danger" size="sm" className="col-span-1" title="Clear Frame">Clr</Button>
                    
                    <Button onClick={handleContractRow} variant="ghost" size="sm" icon={<CompressVerticalIcon className="w-3 h-3"/>} title="Contract Row (Del Mid Row)" disabled={sprite.size.height <= 1}>{null}</Button>
                    <Button onClick={handleContractColumn} variant="ghost" size="sm" icon={<CompressHorizontalIcon className="w-3 h-3"/>} title="Contract Col (Del Mid Col)" disabled={sprite.size.width <= 1}>{null}</Button>
                </div>
                <Button 
                    onClick={() => setIsExplosionModalOpen(true)} 
                    variant="secondary" 
                    size="sm" 
                    icon={<FireIcon className="w-3.5 h-3.5" />} 
                    className="w-full"
                    justify="start"
                    title="Crear secuencia animada de explosión (MSX1)"
                >
                    Gen Explosion
                </Button>
                <Button 
                    onClick={handleAddContour}
                    variant="secondary"
                    size="sm"
                    icon={<ContourIcon className="w-3.5 h-3.5" />}
                    className="w-full mt-1"
                    justify="start"
                    title="Add a 1px contour around the sprite using the active brush color"
                    disabled={isFrameEmpty}
                >
                    Add Contour
                </Button>
            </Panel>
        </div>
      </div>

      {showAttributesEditor && (
        <div className="p-2 border-t border-msx-border bg-msx-panelbg/50 text-xs">
          <h4 className="pixel-font text-msx-cyan mb-1">Sprite Attributes (VDP) - Mock</h4>
          <div className="grid grid-cols-2 gap-2">
            <div><label>Pattern Name Offset: <input type="text" defaultValue="0" className="w-12 ml-1 p-0.5 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary" /></label></div>
            <div><label>Color: <input type="text" defaultValue="15" className="w-8 ml-1 p-0.5 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary"/></label> (0-15)</div>
            <div><label>EC (Early Clock): <input type="checkbox" className="ml-1 form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"/></label></div>
             <div><label>CC (Collision Color): <input type="checkbox" className="ml-1 form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"/></label></div>
             <div><label>IC (Illegal Collision): <input type="checkbox" className="ml-1 form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"/></label> (Read-only)</div>
          </div>
        </div>
      )}

      {isExportAsmModalOpen && asmExportConfig && (
        <ExportSpriteASMModal
          isOpen={isExportAsmModalOpen}
          onClose={() => setIsExportAsmModalOpen(false)}
          spriteToExport={asmExportConfig.spriteToExport}
          dataOutputFormat={asmExportConfig.dataOutputFormat} 
        />
      )}
      {isExplosionModalOpen && (
        <ExplosionGeneratorModal
            isOpen={isExplosionModalOpen}
            onClose={() => setIsExplosionModalOpen(false)}
            onGenerate={handleGenerateExplosion}
            initialSpriteSize={sprite.size.width as typeof EXPLOSION_SPRITE_SIZES[number] || 16}
        />
      )}
      {isImportConfigModalOpen && importedImageData && (
        <SpriteImportConfigModal
          isOpen={isImportConfigModalOpen}
          onClose={() => { setIsImportConfigModalOpen(false); setImportedImageData(null); }}
          imageData={importedImageData}
          onImportConfirm={onSpriteImported}
        />
      )}
      {isWatcherModalOpen && (
        <AnimationWatcherModal
          isOpen={isWatcherModalOpen}
          onClose={() => setIsWatcherModalOpen(false)}
          sprite={sprite}
          allAssets={allAssets}
          currentScreenMode={currentScreenMode}
        />
      )}
    </Panel>
  );
};