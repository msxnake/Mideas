

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Sprite, MSXColorValue, PixelData, Point, SpriteFrame, DataFormat, ProjectAsset, FacingDirection } from '../../types';
import { mirrorPixelDataHorizontally, mirrorPixelDataVertically } from '../utils/spriteUtils';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { Tooltip } from '../common/Tooltip';
import { PlusCircleIcon, SaveIcon, DocumentDuplicateIcon, TrashIcon, CodeIcon, RotateCcwIcon, ArrowUpIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, PencilIcon, EraserIcon, CogIcon, CompressVerticalIcon, CompressHorizontalIcon, FireIcon, PlayIcon, StopIcon, FolderOpenIcon, SphereIcon, ViewfinderCircleIcon, TilesetIcon, SpriteIcon, ContourIcon, EraserIcon as DisintegrationIcon, CopyIcon, PasteIcon } from '../icons/MsxIcons';
import { ExportSpriteASMModal } from '../modals/ExportSpriteASMModal';
import { ExportSpriteZX0ASMModal } from '../modals/ExportSpriteZX0ASMModal';
import { DisintegrationGeneratorModal, DisintegrationParams } from '../modals/DisintegrationGeneratorModal';
import { FragmentGeneratorModal, FragmentParams } from '../modals/FragmentGeneratorModal';
import { WarpGeneratorModal, WarpParams } from '../modals/WarpGeneratorModal';
import { SpriteImportConfigModal, SpriteImportConfig } from '../modals/SpriteImportConfigModal';
import { AnimationWatcherModal } from '../modals/AnimationWatcherModal';


/**
 * Props for the {@link SpriteEditor} component.
 * @category Editors
 */
interface SpriteEditorProps {
  /** The sprite asset currently being edited. */
  sprite: Sprite;
  /** Callback to update the sprite asset. */
  onUpdate: (data: Partial<Sprite>) => void;
  /** Callback after a sprite is successfully imported from a PNG. */
  onSpriteImported: (newSpriteData: Omit<Sprite, 'id' | 'name'>) => void;
  /** Callback to create a new sprite asset from a single frame of the current sprite. */
  onCreateSpriteFromFrame: (spriteAssetId: string, frameIndex: number) => void;
  /** The color currently selected in the main MSX palette. */
  globalSelectedColor: MSXColorValue; 
  /** The data format for ASM output. */
  dataOutputFormat: DataFormat; 
  /** A list of all project assets. */
  allAssets: ProjectAsset[];
  /** The current screen mode. */
  currentScreenMode: string;
  /** Callback to open the sprite sheet reordering modal. */
  onOpenSpriteSheetModal: () => void;
  /** Whether to persist the sprite editor zoom across sessions. */
  saveSpriteZoom?: boolean;
}

type SpriteToolMode = 'draw' | 'erase' | 'sphere';

const createEmptySpriteFrameData = (width: number, height: number, fillColor: MSXColorValue): PixelData => {
  return Array(height).fill(null).map(() => Array(width).fill(fillColor));
};

const SPRITE_SIZE_OPTIONS = [16, 24, 32, 48, 64] as const;
const MSX1_LAYER_OFFSET_MIN = -16;
const MSX1_LAYER_OFFSET_MAX = 16;

const clampLayerYOffset = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(MSX1_LAYER_OFFSET_MIN, Math.min(MSX1_LAYER_OFFSET_MAX, Math.trunc(value)));
};

const createEmptyLayerPlane = (width: number, height: number): boolean[][] =>
  Array(height).fill(null).map(() => Array(width).fill(false));

const getFrameLayerPlane = (
  frame: SpriteFrame | undefined,
  paletteIndex: number,
  layerColor: MSXColorValue,
  width: number,
  height: number
): boolean[][] => {
  const storedPlane = frame?.msx1LayerData?.[paletteIndex];
  if (storedPlane) {
    return Array(height).fill(null).map((_, y) =>
      Array(width).fill(false).map((__, x) => !!storedPlane[y]?.[x])
    );
  }

  return Array(height).fill(null).map((_, y) =>
    Array(width).fill(false).map((__, x) => frame?.data?.[y]?.[x] === layerColor)
  );
};

const frameUsesPaletteLayer = (
  frame: SpriteFrame,
  paletteIndex: number,
  layerColor: MSXColorValue
): boolean =>
  !!frame.msx1LayerData?.[paletteIndex]?.some(row => row.some(Boolean)) ||
  frame.data?.some(row => row?.some(pixel => pixel === layerColor));

const ensureFrameLayerData = (
  frame: SpriteFrame,
  palette: [MSXColorValue, MSXColorValue, MSXColorValue, MSXColorValue],
  backgroundColor: MSXColorValue,
  width: number,
  height: number
): Record<number, boolean[][]> => {
  const nextLayerData: Record<number, boolean[][]> = { ...(frame.msx1LayerData ?? {}) };
  palette.forEach((color, index) => {
    if (!color || color === backgroundColor) return;
    nextLayerData[index] = getFrameLayerPlane(frame, index, color, width, height);
  });
  return nextLayerData;
};

/**
 * Props for the {@link SpritePixelGrid} component.
 * @internal
 */
interface SpritePixelGridProps {
  pixelData: PixelData;
  onPixelClick?: (point: Point, isRightClick: boolean) => void;
  pixelSize?: number;
  spriteWidth: number;
  spriteHeight: number;
  sourceSpriteHeight?: number;
  previewOriginOffsetY?: number;
  interactionLayerOffsetY?: number;
  activeLayerColor?: MSXColorValue;
  className?: string;
  onionSkinEnabled?: boolean;
  onionSkinOpacity?: number;
  prevFrameData?: PixelData | null;
  nextFrameData?: PixelData | null;
  backgroundColor: MSXColorValue;
  toolMode?: SpriteToolMode;
  showHitbox?: boolean;
  hitboxWidth?: number;
  hitboxHeight?: number;
  hitboxOffsetX?: number;
  hitboxOffsetY?: number;
}

/**
 * A component that renders a semi-transparent layer for onion skinning.
 * @internal
 */
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


/**
 * An interactive pixel grid component for drawing sprites.
 * @internal
 */
const SpritePixelGrid: React.FC<SpritePixelGridProps> = ({
    pixelData, onPixelClick, pixelSize = 10, spriteWidth, spriteHeight, className = "",
    sourceSpriteHeight,
    previewOriginOffsetY = 0,
    interactionLayerOffsetY = 0,
    activeLayerColor = '#FFFFFF',
    onionSkinEnabled, onionSkinOpacity = 0.3, prevFrameData, nextFrameData, backgroundColor,
    toolMode, showHitbox, hitboxWidth, hitboxHeight, hitboxOffsetX = 0, hitboxOffsetY = 0
}) => {
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isRightMBDown, setIsRightMBDown] = useState(false);

  const handleMouseDown = (e: React.MouseEvent, x: number, y: number) => {
    if (!onPixelClick) return;
    e.preventDefault();
    const sourceY = y + previewOriginOffsetY - interactionLayerOffsetY;
    if (sourceY < 0 || sourceY >= (sourceSpriteHeight ?? spriteHeight)) return;
    const isRight = e.button === 2;
    setIsMouseDown(true);
    setIsRightMBDown(isRight);
    onPixelClick({ x, y: sourceY }, isRight);
  };

  const sourceHeight = sourceSpriteHeight ?? spriteHeight;
  const activeLayerTop = (interactionLayerOffsetY - previewOriginOffsetY) * pixelSize;
  const activeLayerHeight = sourceHeight * pixelSize;
  const isInsideActiveLayer = (y: number) => {
    const sourceY = y + previewOriginOffsetY - interactionLayerOffsetY;
    return sourceY >= 0 && sourceY < sourceHeight;
  };

  const handleMouseEnter = (x: number, y: number) => {
    if (isMouseDown && onPixelClick) {
      if (toolMode === 'sphere') return; // Do not drag-draw spheres
      const sourceY = y + previewOriginOffsetY - interactionLayerOffsetY;
      if (sourceY < 0 || sourceY >= (sourceSpriteHeight ?? spriteHeight)) return;
      onPixelClick({ x, y: sourceY }, isRightMBDown);
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
            className={onPixelClick && isInsideActiveLayer(y) ? "hover:outline hover:outline-1 hover:outline-msx-highlight z-10" : "z-10"}
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

      {onPixelClick && (
        <div
          className="absolute pointer-events-none z-30"
          style={{
            left: 0,
            top: `${activeLayerTop}px`,
            width: `${spriteWidth * pixelSize}px`,
            height: `${activeLayerHeight}px`,
            border: `2px solid ${activeLayerColor}`,
            boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.85)',
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.26) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.26) 1px, transparent 1px)
            `,
            backgroundSize: `${pixelSize}px ${pixelSize}px`,
            imageRendering: 'pixelated'
          }}
          aria-hidden="true"
        />
      )}

      {/* Hitbox Overlay */}
      {showHitbox && hitboxWidth !== undefined && hitboxHeight !== undefined && (
        <div
          className="absolute pointer-events-none z-20"
          style={{
            left: `${hitboxOffsetX * pixelSize}px`,
            top: `${(hitboxOffsetY - previewOriginOffsetY) * pixelSize}px`,
            width: `${hitboxWidth * pixelSize}px`,
            height: `${hitboxHeight * pixelSize}px`,
            border: '2px solid #00ff00',
            boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(0, 0, 0, 0.5)',
            backgroundColor: 'rgba(0, 255, 0, 0.1)',
          }}
        />
      )}
    </div>
  );
};

/**
 * The main editor component for creating and modifying sprite assets.
 * It includes a pixel grid for drawing, frame management tools, animation previews,
 * and property editors for size, palette, and attributes.
 *
 * @param props The component props.
 * @returns A React component.
 * @category Editors
 */
export const SpriteEditor: React.FC<SpriteEditorProps> = ({ sprite, onUpdate, onSpriteImported, onCreateSpriteFromFrame, globalSelectedColor, dataOutputFormat, allAssets, currentScreenMode, onOpenSpriteSheetModal, saveSpriteZoom }) => {
  const [localSpriteName, setLocalSpriteName] = useState(sprite.name);
  const [pixelSize, setPixelSize] = useState<number>(() => {
    if (saveSpriteZoom) {
      const savedConfig = localStorage.getItem('ideConfig');
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          if (config.spriteEditorZoom !== undefined) return config.spriteEditorZoom;
        } catch (e) { /* ignore */ }
      }
    }
    return sprite.size.width > 16 ? 10 : 16;
  });

  useEffect(() => {
    if (saveSpriteZoom) {
      const savedConfig = localStorage.getItem('ideConfig');
      const config = savedConfig ? JSON.parse(savedConfig) : {};
      config.spriteEditorZoom = pixelSize;
      localStorage.setItem('ideConfig', JSON.stringify(config));
    }
  }, [pixelSize, saveSpriteZoom]);
  const [showAttributesEditor, setShowAttributesEditor] = useState(false);
  const [showHitbox, setShowHitbox] = useState(false);

  const [isExportAsmModalOpen, setIsExportAsmModalOpen] = useState<boolean>(false);
  const [isExportZx0AsmModalOpen, setIsExportZx0AsmModalOpen] = useState<boolean>(false);
  const [asmExportConfig, setAsmExportConfig] = useState<{ spriteToExport: Sprite; dataOutputFormat: DataFormat; } | null>(null);

  const [toolMode, setToolMode] = useState<SpriteToolMode>('draw');
  const [sphereRadius, setSphereRadius] = useState<number>(5);
  const [activeBrushColorIndex, setActiveBrushColorIndex] = useState<number>(0);
  const [activePaletteSetupSlotIndex, setActivePaletteSetupSlotIndex] = useState<number | 'bg' | null>(null);

  const [isDisintegrationModalOpen, setIsDisintegrationModalOpen] = useState<boolean>(false);
  const [isFragmentModalOpen, setIsFragmentModalOpen] = useState<boolean>(false);
  const [isWarpModalOpen, setIsWarpModalOpen] = useState<boolean>(false);

  const animationFrameIdRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  const [isAnimationPlaying, setIsAnimationPlaying] = useState(false);
  const [animationSpeedMs, setAnimationSpeedMs] = useState<number>(sprite.animationSpeedMs ?? 200);
  const animationIntervalRef = useRef<number | null>(null);

  const [isImportConfigModalOpen, setIsImportConfigModalOpen] = useState(false);
  const [importedImageData, setImportedImageData] = useState<ImageData | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const [isWatcherModalOpen, setIsWatcherModalOpen] = useState(false);

  // New states for Onion Skinning
  const [onionSkinEnabled, setOnionSkinEnabled] = useState(true);
  const [onionSkinOpacity, setOnionSkinOpacity] = useState(0.3);

  // State for layer copy/paste
  const [copiedFrameData, setCopiedFrameData] = useState<PixelData | null>(null);


  useEffect(() => {
    setLocalSpriteName(sprite.name);
    setPixelSize(sprite.size.width > 16 || sprite.size.height > 16 ? 10 : (sprite.size.width > 8 || sprite.size.height > 8 ? 16 : 20));
  }, [sprite.name, sprite.size]);

  const currentFrameData = sprite.frames[sprite.currentFrameIndex]?.data;
  const prevFrameData = sprite.frames[sprite.currentFrameIndex - 1]?.data;
  const nextFrameData = sprite.frames[sprite.currentFrameIndex + 1]?.data;
  const drawablePaletteLayerIndexes = useMemo(() => {
    return sprite.spritePalette
      .map((color, index) => ({ color, index }))
      .filter(({ color }) => color && color !== sprite.backgroundColor)
      .filter(({ color, index }) => sprite.frames.some(frame =>
        frameUsesPaletteLayer(frame, index, color)
      ))
      .map(({ index }) => index);
  }, [sprite.spritePalette, sprite.backgroundColor, sprite.frames]);
  const msx1LayerOffsets = sprite.msx1LayerOffsets ?? {};
  const msx1LayerOffsetPreview = useMemo(() => {
    const sourceData = currentFrameData;
    if (!sourceData || sourceData.length === 0 || sourceData[0]?.length === 0) {
      return {
        data: sourceData,
        height: sprite.size.height,
        originOffsetY: 0
      };
    }

    const offsets = drawablePaletteLayerIndexes.map(index => clampLayerYOffset(msx1LayerOffsets[index]?.offsetY ?? 0));
    const minOffsetY = Math.min(0, ...offsets);
    const maxOffsetY = Math.max(0, ...offsets);
    const previewHeight = sprite.size.height + maxOffsetY - minOffsetY;
    const previewData: PixelData = Array(previewHeight)
      .fill(null)
      .map(() => Array(sprite.size.width).fill(sprite.backgroundColor));

    for (const paletteIndex of drawablePaletteLayerIndexes) {
      const color = sprite.spritePalette[paletteIndex];
      if (!color || color === sprite.backgroundColor) continue;
      const plane = getFrameLayerPlane(
        sprite.frames[sprite.currentFrameIndex],
        paletteIndex,
        color,
        sprite.size.width,
        sprite.size.height
      );
      const offsetY = clampLayerYOffset(msx1LayerOffsets[paletteIndex]?.offsetY ?? 0);
      for (let y = 0; y < sprite.size.height; y++) {
        for (let x = 0; x < sprite.size.width; x++) {
          if (!plane[y]?.[x]) continue;
          const targetY = y + offsetY - minOffsetY;
          if (targetY >= 0 && targetY < previewHeight) {
            previewData[targetY][x] = color;
          }
        }
      }
    }

    return {
      data: previewData,
      height: previewHeight,
      originOffsetY: minOffsetY
    };
  }, [
    currentFrameData,
    sprite.size.width,
    sprite.size.height,
    sprite.spritePalette,
    sprite.backgroundColor,
    msx1LayerOffsets,
    drawablePaletteLayerIndexes,
    sprite.currentFrameIndex,
    sprite.frames
  ]);

  const isFrameEmpty = useMemo(() => {
    if (!currentFrameData) return true;
    return currentFrameData.every(row => row.every(pixel => pixel === sprite.backgroundColor));
  }, [currentFrameData, sprite.backgroundColor]);

  const handleLayerYOffsetChange = useCallback((paletteIndex: number, rawValue: number) => {
    const offsetY = clampLayerYOffset(rawValue);
    const nextOffsets = { ...(sprite.msx1LayerOffsets ?? {}) };
    const currentLayer = { ...(nextOffsets[paletteIndex] ?? {}) };

    if (offsetY === 0) {
      delete currentLayer.offsetY;
    } else {
      currentLayer.offsetY = offsetY;
    }

    if (Object.keys(currentLayer).length === 0) {
      delete nextOffsets[paletteIndex];
    } else {
      nextOffsets[paletteIndex] = currentLayer;
    }

    onUpdate({ msx1LayerOffsets: Object.keys(nextOffsets).length > 0 ? nextOffsets : undefined });
  }, [sprite.msx1LayerOffsets, onUpdate]);

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

    const activeLayerColor = sprite.spritePalette[activeBrushColorIndex];
    const useIndependentLayerPlanes =
      !!sprite.frames[sprite.currentFrameIndex]?.msx1LayerData ||
      Object.values(sprite.msx1LayerOffsets ?? {}).some(layer => clampLayerYOffset(layer?.offsetY ?? 0) !== 0);

    if (toolMode === 'sphere' && !isRightClick) {
      drawSphere(point);
      return;
    }

    if (useIndependentLayerPlanes && activeLayerColor && activeLayerColor !== sprite.backgroundColor) {
      const updatedFrames = sprite.frames.map((frame, index) => {
        if (index !== sprite.currentFrameIndex) return frame;

        const nextLayerData = ensureFrameLayerData(
          frame,
          sprite.spritePalette,
          sprite.backgroundColor,
          sprite.size.width,
          sprite.size.height
        );
        const activePlane = nextLayerData[activeBrushColorIndex] ?? createEmptyLayerPlane(sprite.size.width, sprite.size.height);
        const nextPlane = activePlane.map(row => [...row]);
        const shouldPaint = toolMode === 'draw' && !isRightClick;
        const shouldErase = toolMode === 'erase' || isRightClick;

        if (nextPlane[point.y]?.[point.x] === undefined) return frame;
        nextPlane[point.y][point.x] = shouldPaint ? true : shouldErase ? false : nextPlane[point.y][point.x];
        nextLayerData[activeBrushColorIndex] = nextPlane;

        const compositeData = frame.data.map(row => [...row]);
        compositeData[point.y][point.x] = shouldPaint ? activeLayerColor : sprite.backgroundColor;

        return { ...frame, data: compositeData, msx1LayerData: nextLayerData };
      });
      onUpdate({ frames: updatedFrames });
      return;
    }

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

    const newPixelData = currentFrameData.map(row => [...row]);
    const colorToApply = toolMode === 'draw'
      ? activeLayerColor
      : sprite.backgroundColor;

    if (newPixelData[point.y]?.[point.x] !== colorToApply) {
      newPixelData[point.y][point.x] = colorToApply;
      const updatedFrames = sprite.frames.map((frame, index) =>
        index === sprite.currentFrameIndex ? { ...frame, data: newPixelData } : frame
      );
      onUpdate({ frames: updatedFrames });
    }
  }, [currentFrameData, sprite.spritePalette, sprite.backgroundColor, sprite.msx1LayerOffsets, sprite.size, activeBrushColorIndex, toolMode, sprite.currentFrameIndex, onUpdate, sprite.frames, drawSphere]);

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

  const handleCopyLayer = () => {
    if (currentFrameData) {
      // Deep copy of the current frame data
      const copiedData = currentFrameData.map(row => [...row]);
      setCopiedFrameData(copiedData);
    }
  };

  const handlePasteLayer = () => {
    if (copiedFrameData && currentFrameData) {
      // Paste the copied frame data into the current frame
      const updatedFrames = sprite.frames.map((frame, index) =>
        index === sprite.currentFrameIndex ? { ...frame, data: copiedFrameData.map(row => [...row]) } : frame
      );
      onUpdate({ frames: updatedFrames });
    }
  };

  const handleTransform = (action: 'rotate' | 'shiftUp' | 'shiftDown' | 'shiftLeft' | 'shiftRight' | 'flipHorizontal' | 'flipVertical') => {
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
        case 'flipHorizontal':
            newData = mirrorPixelDataHorizontally(newData);
            break;
        case 'flipVertical':
            newData = mirrorPixelDataVertically(newData);
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

  const convertToGrayscale = (pixelData: PixelData, backgroundColor: MSXColorValue): PixelData => {
    // Find the closest grayscale colors in MSX palette
    const grayscaleColors = [
      '#000000', // Black
      '#555555', // Dark gray  
      '#AAAAAA', // Light gray
      '#FFFFFF'  // White
    ];

    return pixelData.map(row => 
      row.map(pixel => {
        if (pixel === backgroundColor) return backgroundColor;
        
        // Simple grayscale conversion - pick closest gray
        const pixelBrightness = getBrightness(pixel);
        if (pixelBrightness < 0.25) return grayscaleColors[0];
        else if (pixelBrightness < 0.5) return grayscaleColors[1]; 
        else if (pixelBrightness < 0.75) return grayscaleColors[2];
        else return grayscaleColors[3];
      })
    );
  };

  const getBrightness = (color: string): number => {
    // Convert hex to RGB and calculate brightness
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  };

  const handleGenerateDisintegration = (params: DisintegrationParams) => {
    if (!currentFrameData) return;

    const { numFrames, convertToGrayscale: shouldConvertToGrayscale } = params;
    const newFramesArray: SpriteFrame[] = [];

    // Start with current frame data
    let basePixelData = currentFrameData.map(row => [...row]);

    // Convert to grayscale if requested
    if (shouldConvertToGrayscale) {
      basePixelData = convertToGrayscale(basePixelData, sprite.backgroundColor);
    }

    // Collect all non-background pixels with their positions
    const nonBackgroundPixels: { x: number; y: number }[] = [];
    for (let y = 0; y < sprite.size.height; y++) {
      for (let x = 0; x < sprite.size.width; x++) {
        if (basePixelData[y][x] !== sprite.backgroundColor) {
          nonBackgroundPixels.push({ x, y });
        }
      }
    }

    console.log(`🔥 Generating ${numFrames} disintegration frames from ${nonBackgroundPixels.length} pixels`);

    // Generate frames with progressive pixel removal
    for (let frameIndex = 0; frameIndex < numFrames; frameIndex++) {
      const frameData = basePixelData.map(row => [...row]);

      // Calculate how many pixels to remove for this frame
      const totalPixels = nonBackgroundPixels.length;
      const pixelsToRemoveByThisFrame = Math.floor((frameIndex + 1) * totalPixels / numFrames);

      // Shuffle pixels for random removal order (but deterministic)
      const shuffledPixels = [...nonBackgroundPixels];
      for (let i = shuffledPixels.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPixels[i], shuffledPixels[j]] = [shuffledPixels[j], shuffledPixels[i]];
      }

      // Remove pixels for this frame
      for (let i = 0; i < pixelsToRemoveByThisFrame; i++) {
        const pixel = shuffledPixels[i];
        frameData[pixel.y][pixel.x] = sprite.backgroundColor;
      }

      newFramesArray.push({
        id: `disintegration_frame_${Date.now()}_${frameIndex}`,
        data: frameData
      });

      console.log(`📉 Frame ${frameIndex + 1}: ${totalPixels - pixelsToRemoveByThisFrame} pixels remaining`);
    }

    // Update sprite with new frames
    onUpdate({
      frames: newFramesArray,
      currentFrameIndex: 0
    });

    setIsDisintegrationModalOpen(false);
  };

  const handleGenerateFragment = (params: FragmentParams) => {
    if (!currentFrameData) return;

    const { numFrames, separationSpeed } = params;
    const W = sprite.size.width;
    const H = sprite.size.height;
    const midX = Math.floor(W / 2);
    const midY = Math.floor(H / 2);

    // Store the original sprite data
    const originalData = currentFrameData.map(row => [...row]);

    // Create 4 quadrants
    const quadrants = {
      topLeft: [] as PixelData,
      topRight: [] as PixelData,
      bottomLeft: [] as PixelData,
      bottomRight: [] as PixelData
    };

    // Split sprite into 4 quadrants
    for (let y = 0; y < midY; y++) {
      quadrants.topLeft.push(originalData[y].slice(0, midX));
      quadrants.topRight.push(originalData[y].slice(midX, W));
    }
    for (let y = midY; y < H; y++) {
      quadrants.bottomLeft.push(originalData[y].slice(0, midX));
      quadrants.bottomRight.push(originalData[y].slice(midX, W));
    }

    const newFramesArray: SpriteFrame[] = [];
    const maxSeparation = Math.max(midX, midY);
    const separationFactor = (separationSpeed / 100);

    // Generate frames with progressive separation
    for (let frameIndex = 0; frameIndex < numFrames; frameIndex++) {
      const frameData: PixelData = Array(H).fill(null).map(() => Array(W).fill(sprite.backgroundColor));

      // Calculate separation distance for this frame
      const progress = frameIndex / (numFrames - 1);
      const separation = Math.floor(progress * maxSeparation * separationFactor);

      // Calculate line-by-line removal (from edges inward)
      const linesToRemove = Math.floor(progress * Math.min(midX, midY));

      // Place top-left quadrant (moving up-left)
      for (let y = linesToRemove; y < quadrants.topLeft.length; y++) {
        for (let x = linesToRemove; x < quadrants.topLeft[0].length; x++) {
          const newY = y - separation;
          const newX = x - separation;
          if (newY >= 0 && newY < H && newX >= 0 && newX < W) {
            frameData[newY][newX] = quadrants.topLeft[y][x];
          }
        }
      }

      // Place top-right quadrant (moving up-right)
      for (let y = linesToRemove; y < quadrants.topRight.length; y++) {
        for (let x = 0; x < quadrants.topRight[0].length - linesToRemove; x++) {
          const newY = y - separation;
          const newX = midX + x + separation;
          if (newY >= 0 && newY < H && newX >= 0 && newX < W) {
            frameData[newY][newX] = quadrants.topRight[y][x];
          }
        }
      }

      // Place bottom-left quadrant (moving down-left)
      for (let y = 0; y < quadrants.bottomLeft.length - linesToRemove; y++) {
        for (let x = linesToRemove; x < quadrants.bottomLeft[0].length; x++) {
          const newY = midY + y + separation;
          const newX = x - separation;
          if (newY >= 0 && newY < H && newX >= 0 && newX < W) {
            frameData[newY][newX] = quadrants.bottomLeft[y][x];
          }
        }
      }

      // Place bottom-right quadrant (moving down-right)
      for (let y = 0; y < quadrants.bottomRight.length - linesToRemove; y++) {
        for (let x = 0; x < quadrants.bottomRight[0].length - linesToRemove; x++) {
          const newY = midY + y + separation;
          const newX = midX + x + separation;
          if (newY >= 0 && newY < H && newX >= 0 && newX < W) {
            frameData[newY][newX] = quadrants.bottomRight[y][x];
          }
        }
      }

      newFramesArray.push({
        id: `fragment_frame_${Date.now()}_${frameIndex}`,
        data: frameData
      });
    }

    onUpdate({
      frames: newFramesArray,
      currentFrameIndex: 0
    });

    setIsFragmentModalOpen(false);
  };

  const handleGenerateWarp = (params: WarpParams) => {
    if (!currentFrameData) return;

    const { numFrames, spiralTightness, rotationSpeed } = params;
    const W = sprite.size.width;
    const H = sprite.size.height;
    const centerX = W / 2;
    const centerY = H / 2;

    // Collect all non-background pixels with their positions and colors
    interface PixelInfo {
      x: number;
      y: number;
      color: MSXColorValue;
      angle: number;
      distance: number;
    }

    const pixels: PixelInfo[] = [];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (currentFrameData[y][x] !== sprite.backgroundColor) {
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          pixels.push({
            x,
            y,
            color: currentFrameData[y][x],
            angle,
            distance
          });
        }
      }
    }

    if (pixels.length === 0) {
      alert("No pixels to warp - sprite is empty");
      return;
    }

    console.log(`🌀 Generating ${numFrames} warp frames from ${pixels.length} pixels`);

    const newFramesArray: SpriteFrame[] = [];
    const maxDistance = Math.sqrt((W/2) * (W/2) + (H/2) * (H/2));

    // Generate frames
    for (let frameIndex = 0; frameIndex < numFrames; frameIndex++) {
      const frameData: PixelData = Array(H).fill(null).map(() => Array(W).fill(sprite.backgroundColor));
      const progress = frameIndex / (numFrames - 1);

      // Calculate spiral parameters for this frame
      const spiralFactor = (spiralTightness / 100) * 6; // How many rotations
      const rotationFactor = (rotationSpeed / 100) * Math.PI * 4; // Total rotation amount

      pixels.forEach(pixel => {
        // Calculate how much this pixel has moved toward center
        const pixelProgress = Math.min(1, progress + (pixel.distance / maxDistance) * 0.3);

        // Distance from center shrinks over time
        const newDistance = pixel.distance * (1 - pixelProgress);

        // Angle rotates based on distance (spiral effect)
        const spiralAngle = pixel.angle + (pixelProgress * spiralFactor * Math.PI * 2) +
                           (progress * rotationFactor);

        // Calculate new position
        const newX = centerX + newDistance * Math.cos(spiralAngle);
        const newY = centerY + newDistance * Math.sin(spiralAngle);

        // Only draw if pixel is still visible (not converged to center yet)
        if (newDistance > 0.5 && pixelProgress < 0.95) {
          const pixelX = Math.round(newX);
          const pixelY = Math.round(newY);

          if (pixelX >= 0 && pixelX < W && pixelY >= 0 && pixelY < H) {
            frameData[pixelY][pixelX] = pixel.color;
          }
        }
      });

      newFramesArray.push({
        id: `warp_frame_${Date.now()}_${frameIndex}`,
        data: frameData
      });

      console.log(`🌀 Frame ${frameIndex + 1}: Warp progress ${Math.round(progress * 100)}%`);
    }

    onUpdate({
      frames: newFramesArray,
      currentFrameIndex: 0
    });

    setIsWarpModalOpen(false);
  };

  const handleExportAsm = () => {
    setAsmExportConfig({ spriteToExport: sprite, dataOutputFormat: dataOutputFormat }); 
    setIsExportAsmModalOpen(true);
  };

  const handleExportZx0Asm = () => {
    setAsmExportConfig({ spriteToExport: sprite, dataOutputFormat: dataOutputFormat });
    setIsExportZx0AsmModalOpen(true);
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

  // Keep local speed in sync if sprite prop changes (e.g., loaded from asset)
  useEffect(() => {
    if (typeof sprite.animationSpeedMs === 'number' && !isNaN(sprite.animationSpeedMs)) {
      setAnimationSpeedMs(sprite.animationSpeedMs);
    }
  }, [sprite.animationSpeedMs, sprite.id]);


  if (!currentFrameData && sprite.frames.length > 0 && sprite.currentFrameIndex < sprite.frames.length) {
    if (sprite.frames.length > 0) {
      onUpdate({ currentFrameIndex: 0 });
    }
    return <Panel title="Sprite Editor"><p className="p-4 text-red-500">Error: Current frame data is missing. Attempting to recover...</p></Panel>;
  }
  if (!currentFrameData && (sprite.frames.length === 0 || sprite.currentFrameIndex >= sprite.frames.length)) {
       return <Panel title="Sprite Editor"><p className="p-4 text-red-500">Sprite has no frames or current frame is invalid.</p></Panel>;
  }

  const defaultMultiHitbox = {
    width: sprite.size.width,
    height: msx1LayerOffsetPreview.height,
    offsetX: 0,
    offsetY: msx1LayerOffsetPreview.originOffsetY
  };
  const storedHitboxIsBaseSpriteBounds =
    sprite.hitbox?.width === sprite.size.width &&
    sprite.hitbox?.height === sprite.size.height &&
    (sprite.hitbox?.offsetX ?? 0) === 0 &&
    (sprite.hitbox?.offsetY ?? 0) === 0 &&
    (defaultMultiHitbox.height !== sprite.size.height || defaultMultiHitbox.offsetY !== 0);
  const resolvedHitbox = !sprite.hitbox || storedHitboxIsBaseSpriteBounds
    ? defaultMultiHitbox
    : {
        width: sprite.hitbox.width,
        height: sprite.hitbox.height,
        offsetX: sprite.hitbox.offsetX,
        offsetY: sprite.hitbox.offsetY
      };
  const fitHitboxToMultiSprite = () => onUpdate({ hitbox: defaultMultiHitbox });


  return (
    <Panel title={`MSX1 Sprite Editor: ${localSpriteName}`} className="flex-grow flex flex-col bg-msx-bgcolor">
      <div className="p-2 border-b border-msx-border flex items-center space-x-2 flex-wrap gap-y-1">
        <label className="text-xs pixel-font text-msx-textsecondary">Name:</label>
        <span className="p-1 text-xs text-msx-textprimary flex-grow min-w-[100px]">{sprite.name}</span>

        <label htmlFor="spriteWidth" className="text-xs pixel-font text-msx-textsecondary ml-2">Size:</label>
        <select value={sprite.size.width} onChange={e => handleResizeSprite(parseInt(e.target.value), sprite.size.height)} className="p-1 text-xs bg-msx-panelbg border-msx-border rounded">
            {SPRITE_SIZE_OPTIONS.map(s => <option key={`w-${s}`} value={s}>{s}</option>)}
        </select>
        <span className="text-xs">x</span>
        <select value={sprite.size.height} onChange={e => handleResizeSprite(sprite.size.width, parseInt(e.target.value))} className="p-1 text-xs bg-msx-panelbg border-msx-border rounded">
           {SPRITE_SIZE_OPTIONS.map(s => <option key={`h-${s}`} value={s}>{s}</option>)}
        </select>
        
        <Button onClick={handleExportToPng} size="sm" variant="secondary" icon={<SaveIcon />}>MSX1 Export PNG</Button>
        <Button onClick={handleImportFromPngClick} size="sm" variant="secondary" icon={<FolderOpenIcon />}>MSX1 Import PNG</Button>
        <input type="file" accept="image/png" ref={importFileRef} onChange={handlePngFileSelected} className="hidden" />
        <Button onClick={onOpenSpriteSheetModal} size="sm" variant="secondary" icon={<TilesetIcon className="w-4 h-4" />} title="MSX1 reorder sprite sheet">MSX1 Sheet</Button>

        <Button onClick={() => setShowAttributesEditor(s => !s)} size="sm" variant="ghost" className="ml-auto" icon={<CogIcon />}>Attribs</Button>
        <Button onClick={handleExportAsm} size="sm" variant="secondary" icon={<CodeIcon />}>MSX1 Export ASM</Button>
        <Button onClick={handleExportZx0Asm} size="sm" variant="primary" icon={<CodeIcon />}>MSX1 ZX0 Export ASM</Button>
      </div>

      <div className="flex-grow flex overflow-hidden" style={{ userSelect: 'none' }}>
        {/* Left Panel: Tools & Palette */}
        <div className="w-48 p-2 border-r border-msx-border flex-shrink-0 flex flex-col space-y-3 overflow-y-auto">
            <div>
                <h4 className="text-sm pixel-font text-msx-highlight mb-1.5">MSX1 Tools</h4>
                <div className="space-y-1">
                    <Button onClick={() => setToolMode('draw')} variant={toolMode === 'draw' ? 'primary' : 'ghost'} size="sm" icon={<PencilIcon />} className="w-full" justify="start">MSX1 Draw</Button>
                    <Button onClick={() => setToolMode('sphere')} variant={toolMode === 'sphere' ? 'primary' : 'ghost'} size="sm" icon={<SphereIcon />} className="w-full" justify="start">MSX1 Sphere</Button>
                    <Button onClick={() => setToolMode('erase')} variant={toolMode === 'erase' ? 'primary' : 'ghost'} size="sm" icon={<EraserIcon />} className="w-full" justify="start">MSX1 Erase (BG)</Button>
                    <Button onClick={handleCopyLayer} variant="ghost" size="sm" icon={<CopyIcon />} className="w-full" justify="start">MSX1 Copy Layer</Button>
                    <Button onClick={handlePasteLayer} variant="ghost" size="sm" icon={<PasteIcon />} className="w-full" justify="start" disabled={!copiedFrameData}>MSX1 Paste Layer</Button>
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
                <h4 className="text-sm pixel-font text-msx-highlight mb-1.5">MSX1 Active Brush</h4>
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

            <div>
                <h4 className="text-sm pixel-font text-msx-highlight mb-1.5">MSX1 Transform Frame</h4>
                <div className="grid grid-cols-3 gap-1 text-xs mb-2">
                    <Tooltip text="Shift pixels left"><Button onClick={() => handleTransform('shiftLeft')} variant="ghost" size="sm" icon={<ArrowLeftIcon className="w-3 h-3"/>}>{null}</Button></Tooltip>
                    <Tooltip text="Shift pixels up"><Button onClick={() => handleTransform('shiftUp')} variant="ghost" size="sm" icon={<ArrowUpIcon className="w-3 h-3"/>}>{null}</Button></Tooltip>
                    <Tooltip text="Shift pixels right"><Button onClick={() => handleTransform('shiftRight')} variant="ghost" size="sm" icon={<ArrowRightIcon className="w-3 h-3"/>}>{null}</Button></Tooltip>

                    <Tooltip text="Rotate 90° clockwise"><Button onClick={() => handleTransform('rotate')} variant="ghost" size="sm" icon={<RotateCcwIcon className="w-3 h-3"/>}>{null}</Button></Tooltip>
                    <Tooltip text="Shift pixels down"><Button onClick={() => handleTransform('shiftDown')} variant="ghost" size="sm" icon={<ArrowDownIcon className="w-3 h-3"/>}>{null}</Button></Tooltip>
                    <Button onClick={handleClearFrame} variant="danger" size="sm" className="col-span-1" title="MSX1 Clear Frame">MSX1 Clr</Button>

                    <Tooltip text="Delete middle row"><Button onClick={handleContractRow} variant="ghost" size="sm" icon={<CompressVerticalIcon className="w-3 h-3"/>} disabled={sprite.size.height <= 1}>{null}</Button></Tooltip>
                    <Tooltip text="Delete middle column"><Button onClick={handleContractColumn} variant="ghost" size="sm" icon={<CompressHorizontalIcon className="w-3 h-3"/>} disabled={sprite.size.width <= 1}>{null}</Button></Tooltip>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs mb-2">
                    <Button onClick={() => handleTransform('flipHorizontal')} variant="ghost" size="sm" className="w-full" justify="start">MSX1 Flip H</Button>
                    <Button onClick={() => handleTransform('flipVertical')} variant="ghost" size="sm" className="w-full" justify="start">MSX1 Flip V</Button>
                </div>
                <Button
                    onClick={() => setIsFragmentModalOpen(true)}
                    variant="secondary"
                    size="sm"
                    icon={<FireIcon className="w-3.5 h-3.5" />}
                    className="w-full mb-1"
                    justify="start"
                    title="Break sprite into 4 fragments with line-by-line separation"
                    disabled={isFrameEmpty}
                >
                    MSX1 Gen Fragment
                </Button>
                <Button
                    onClick={() => setIsDisintegrationModalOpen(true)}
                    variant="secondary"
                    size="sm"
                    icon={<DisintegrationIcon className="w-3.5 h-3.5" />}
                    className="w-full mb-1"
                    justify="start"
                    title="Generate disintegration animation with progressive pixel removal"
                    disabled={isFrameEmpty}
                >
                    MSX1 Gen Disintegration
                </Button>
                <Button
                    onClick={() => setIsWarpModalOpen(true)}
                    variant="secondary"
                    size="sm"
                    icon={<FireIcon className="w-3.5 h-3.5" />}
                    className="w-full mb-1"
                    justify="start"
                    title="Generate warp spiral effect converging to center"
                    disabled={isFrameEmpty}
                >
                    MSX1 Gen Warp
                </Button>
                <Button
                    onClick={handleAddContour}
                    variant="secondary"
                    size="sm"
                    icon={<ContourIcon className="w-3.5 h-3.5" />}
                    className="w-full"
                    justify="start"
                    title="Add a 1px contour around the sprite using the active brush color"
                    disabled={isFrameEmpty}
                >
                    MSX1 Add Contour
                </Button>
            </div>
        </div>

        {/* Center Panel: Pixel Grid & Horizontal Animation Preview */}
        <div className="flex-grow p-2 flex flex-col items-center justify-start overflow-hidden">
          {currentFrameData && sprite.size.width > 0 && sprite.size.height > 0 ? (
            <SpritePixelGrid
              pixelData={msx1LayerOffsetPreview.data ?? currentFrameData}
              onPixelClick={handlePixelClick}
              pixelSize={pixelSize}
              spriteWidth={sprite.size.width}
              spriteHeight={msx1LayerOffsetPreview.height}
              sourceSpriteHeight={sprite.size.height}
              previewOriginOffsetY={msx1LayerOffsetPreview.originOffsetY}
              interactionLayerOffsetY={clampLayerYOffset(msx1LayerOffsets[activeBrushColorIndex]?.offsetY ?? 0)}
              activeLayerColor={sprite.spritePalette[activeBrushColorIndex]}
              onionSkinEnabled={onionSkinEnabled}
              onionSkinOpacity={onionSkinOpacity}
              prevFrameData={prevFrameData}
              nextFrameData={nextFrameData}
              backgroundColor={sprite.backgroundColor}
              toolMode={toolMode}
              showHitbox={showHitbox}
              hitboxWidth={resolvedHitbox.width}
              hitboxHeight={resolvedHitbox.height}
              hitboxOffsetX={resolvedHitbox.offsetX}
              hitboxOffsetY={resolvedHitbox.offsetY}
            />
          ) : (
            <div className="text-msx-textsecondary pixel-font">
              {sprite.frames.length === 0 ? "No frames in sprite. Add one!" : "Select a frame or check sprite size."}
            </div>
          )}
          <div className="mt-2 text-xs pixel-font text-msx-textsecondary flex flex-wrap items-center justify-center gap-2">
            <span>Frame: {sprite.currentFrameIndex + 1} / {sprite.frames.length}</span>
            <span>|</span>
            <span>Grid Zoom:</span>
            <input type="range" min={(sprite.size?.width ?? 16) > 32 ? 4 : 8} max="32" value={pixelSize} onChange={(e) => setPixelSize(parseInt(e.target.value))} className="w-20 accent-msx-accent" />
            <div className="flex gap-1">
              <button onClick={() => setPixelSize(8)} className={`px-1.5 py-0.5 rounded ${pixelSize === 8 ? 'bg-msx-accent text-msx-black' : 'bg-msx-panelbg hover:bg-msx-border'}`}>100%</button>
              <button onClick={() => setPixelSize(16)} className={`px-1.5 py-0.5 rounded ${pixelSize === 16 ? 'bg-msx-accent text-msx-black' : 'bg-msx-panelbg hover:bg-msx-border'}`}>200%</button>
              <button onClick={() => setPixelSize(24)} className={`px-1.5 py-0.5 rounded ${pixelSize === 24 ? 'bg-msx-accent text-msx-black' : 'bg-msx-panelbg hover:bg-msx-border'}`}>400%</button>
              <button onClick={() => setPixelSize(32)} className={`px-1.5 py-0.5 rounded ${pixelSize === 32 ? 'bg-msx-accent text-msx-black' : 'bg-msx-panelbg hover:bg-msx-border'}`}>800%</button>
            </div>
          </div>
          
        </div>

        {/* Right Panel 1: Sprite Configuration */}
        <div className="w-48 p-2 border-l border-msx-border flex-shrink-0 flex flex-col space-y-3 overflow-y-auto">
          <Panel title="MSX1 Define Sprite Colors" collapsible>
            <p className="text-[0.65rem] text-msx-textsecondary mb-2">Click a slot, then pick from main MSX1 Palette Panel.</p>
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
                  style={{backgroundColor: sprite.backgroundColor, outline: activePaletteSetupSlotIndex === 'bg' ? '1px dashed #FF8E81' : undefined}}
                  title={`Assign Background Color. Current: ${sprite.backgroundColor}`}
                  aria-pressed={activePaletteSetupSlotIndex === 'bg'}
                  aria-label="Set background color"
                />
              </div>
            </div>
          </Panel>
          <Panel title="MSX1 Sprite Settings" collapsible>
            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between">
                <span>Facing</span>
                <select
                  value={sprite.facingDirection ?? 'neutral'}
                  onChange={e => onUpdate({ facingDirection: e.target.value as any })}
                  className="p-1 text-xs bg-msx-panelbg border-msx-border rounded"
                >
                  <option value="neutral">Neutral</option>
                  <option value="right">Right</option>
                  <option value="left">Left</option>
                  <option value="up">Up</option>
                  <option value="down">Down</option>
                </select>
              </label>
              <label className="flex items-center justify-between">
                <span>Loop Animation</span>
                <input
                  type="checkbox"
                  checked={sprite.loops !== false}
                  onChange={e => onUpdate({ loops: e.target.checked })}
                  className="w-4 h-4 bg-msx-bgcolor border border-msx-border rounded"
                />
              </label>
            </div>
          </Panel>
          <Panel title="MSX1 HW Sprite Layout" collapsible>
            <div className="space-y-2 text-xs">
              {drawablePaletteLayerIndexes.length > 0 ? (
                drawablePaletteLayerIndexes.map(paletteIndex => {
                  const color = sprite.spritePalette[paletteIndex];
                  const offsetY = clampLayerYOffset(msx1LayerOffsets[paletteIndex]?.offsetY ?? 0);
                  return (
                    <div key={`msx1-layer-offset-${paletteIndex}`} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 min-w-0">
                          <span
                            className="inline-block w-4 h-4 border border-msx-border rounded-sm flex-shrink-0"
                            style={{ backgroundColor: color }}
                            title={`Palette slot ${paletteIndex + 1}: ${color}`}
                          />
                          <span className="text-msx-textsecondary truncate">Slot {paletteIndex + 1}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleLayerYOffsetChange(paletteIndex, offsetY - 1)}
                            disabled={offsetY <= MSX1_LAYER_OFFSET_MIN}
                            className="w-6 h-6 rounded border border-msx-border bg-msx-bgcolor text-msx-textprimary hover:border-msx-highlight disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Move this hardware sprite layer up 1 pixel"
                          >
                            -1
                          </button>
                          <input
                            type="number"
                            min={MSX1_LAYER_OFFSET_MIN}
                            max={MSX1_LAYER_OFFSET_MAX}
                            value={offsetY}
                            onChange={e => handleLayerYOffsetChange(paletteIndex, parseInt(e.target.value, 10))}
                            className="w-12 p-1 text-xs bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary text-center"
                            title="Vertical position of this 16x16 hardware sprite layer"
                          />
                          <button
                            type="button"
                            onClick={() => handleLayerYOffsetChange(paletteIndex, offsetY + 1)}
                            disabled={offsetY >= MSX1_LAYER_OFFSET_MAX}
                            className="w-6 h-6 rounded border border-msx-border bg-msx-bgcolor text-msx-textprimary hover:border-msx-highlight disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Move this hardware sprite layer down 1 pixel"
                          >
                            +1
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={MSX1_LAYER_OFFSET_MIN}
                        max={MSX1_LAYER_OFFSET_MAX}
                        value={offsetY}
                        onChange={e => handleLayerYOffsetChange(paletteIndex, parseInt(e.target.value, 10))}
                        className="w-full accent-msx-accent"
                        title="Vertical position of this 16x16 hardware sprite layer"
                      />
                    </div>
                  );
                })
              ) : (
                <div className="text-msx-textsecondary">No drawable color layers.</div>
              )}
            </div>
          </Panel>
          <Panel title="Hitbox Settings" collapsible>
            <div className="space-y-2 text-xs">
              <Button
                onClick={fitHitboxToMultiSprite}
                variant="ghost"
                size="sm"
                className="w-full"
                justify="start"
                title="Fit hitbox to the full visible multi-sprite bounds"
              >
                Fit Multi Sprite
              </Button>
              <label className="flex items-center justify-between">
                <span>Width</span>
                <input
                  type="number"
                  min="1"
                  max={sprite.size.width}
                  value={resolvedHitbox.width}
                  onChange={e => onUpdate({ 
                    hitbox: { 
                      ...sprite.hitbox, 
                      width: parseInt(e.target.value) || sprite.size.width,
                      height: resolvedHitbox.height,
                      offsetX: resolvedHitbox.offsetX,
                      offsetY: resolvedHitbox.offsetY
                    } 
                  })}
                  className="w-16 p-1 text-xs bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary"
                />
              </label>
              <label className="flex items-center justify-between">
                <span>Height</span>
                <input
                  type="number"
                  min="1"
                  max={Math.max(sprite.size.height, msx1LayerOffsetPreview.height)}
                  value={resolvedHitbox.height}
                  onChange={e => onUpdate({ 
                    hitbox: { 
                      ...sprite.hitbox, 
                      width: resolvedHitbox.width,
                      height: parseInt(e.target.value) || defaultMultiHitbox.height,
                      offsetX: resolvedHitbox.offsetX,
                      offsetY: resolvedHitbox.offsetY
                    } 
                  })}
                  className="w-16 p-1 text-xs bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary"
                />
              </label>
              <label className="flex items-center justify-between">
                <span>Offset X</span>
                <input
                  type="number"
                  min={-(sprite.size?.width ?? 16)}
                  max={sprite.size?.width ?? 16}
                  value={resolvedHitbox.offsetX}
                  onChange={e => onUpdate({ 
                    hitbox: { 
                      ...sprite.hitbox, 
                      width: resolvedHitbox.width,
                      height: resolvedHitbox.height,
                      offsetX: parseInt(e.target.value) || 0,
                      offsetY: resolvedHitbox.offsetY
                    } 
                  })}
                  className="w-16 p-1 text-xs bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary"
                />
              </label>
              <label className="flex items-center justify-between">
                <span>Offset Y</span>
                <input
                  type="number"
                  min={MSX1_LAYER_OFFSET_MIN}
                  max={MSX1_LAYER_OFFSET_MAX}
                  value={resolvedHitbox.offsetY}
                  onChange={e => onUpdate({
                    hitbox: {
                      ...sprite.hitbox,
                      width: resolvedHitbox.width,
                      height: resolvedHitbox.height,
                      offsetX: resolvedHitbox.offsetX,
                      offsetY: parseInt(e.target.value) || 0
                    }
                  })}
                  className="w-16 p-1 text-xs bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary"
                />
              </label>
              <div className="pt-2 border-t border-msx-border">
                <label className="flex items-center justify-between">
                  <span>Show Hitbox</span>
                  <input
                    type="checkbox"
                    checked={showHitbox}
                    onChange={e => setShowHitbox(e.target.checked)}
                    className="w-4 h-4 bg-msx-bgcolor border border-msx-border rounded accent-msx-accent cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </Panel>
        </div>

        {/* Right Panel 2: Animation Tools */}
        <div className="w-48 p-2 border-l border-msx-border flex-shrink-0 flex flex-col space-y-3 overflow-y-auto">
          <Panel title="Animation Tools" collapsible>
            <div className="text-center">
              {currentFrameData && sprite.size.width > 0 && sprite.size.height > 0 ? (
                  <div
                    className="border border-msx-border mx-auto inline-block"
                    style={{
                      width: sprite.size.width * 2,
                      height: msx1LayerOffsetPreview.height * 2,
                      imageRendering: 'pixelated',
                      backgroundColor: sprite.backgroundColor
                    }}
                  >
                      <SpritePixelGrid
                        pixelData={msx1LayerOffsetPreview.data ?? currentFrameData}
                        pixelSize={2}
                        spriteWidth={sprite.size.width}
                        spriteHeight={msx1LayerOffsetPreview.height}
                        sourceSpriteHeight={sprite.size.height}
                        previewOriginOffsetY={msx1LayerOffsetPreview.originOffsetY}
                        interactionLayerOffsetY={clampLayerYOffset(msx1LayerOffsets[activeBrushColorIndex]?.offsetY ?? 0)}
                        activeLayerColor={sprite.spritePalette[activeBrushColorIndex]}
                        backgroundColor={sprite.backgroundColor}
                      />
                  </div>
              ) : <div className="text-xs text-msx-textsecondary text-center h-16 flex items-center justify-center">No preview</div>}
            </div>
            <div className="mt-1.5 flex items-center space-x-1">
                <Button onClick={() => setIsAnimationPlaying(p => !p)} variant="ghost" size="sm" icon={isAnimationPlaying ? <StopIcon/> : <PlayIcon/>} className="flex-1">{isAnimationPlaying ? "Pause" : "Play"}</Button>
                <Button onClick={() => setIsWatcherModalOpen(true)} variant="secondary" size="sm" icon={<ViewfinderCircleIcon />} title="Open Animation Watcher">Watch</Button>
                <label className="text-[0.6rem] text-msx-textsecondary">Speed:</label>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="50"
                  value={animationSpeedMs}
                  onChange={e => {
                    const v = parseInt(e.target.value);
                    setAnimationSpeedMs(v);
                    onUpdate({ animationSpeedMs: v });
                  }}
                  className="w-12 accent-msx-accent"
                  title={`Frame Animation Speed: ${animationSpeedMs}ms/frame`}
                />
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
          <Panel title="Frame Control" collapsible>
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
      {isExportZx0AsmModalOpen && asmExportConfig && (
        <ExportSpriteZX0ASMModal
          isOpen={isExportZx0AsmModalOpen}
          onClose={() => setIsExportZx0AsmModalOpen(false)}
          spriteToExport={asmExportConfig.spriteToExport}
          dataOutputFormat={asmExportConfig.dataOutputFormat}
        />
      )}
      {isDisintegrationModalOpen && (
        <DisintegrationGeneratorModal
            isOpen={isDisintegrationModalOpen}
            onClose={() => setIsDisintegrationModalOpen(false)}
            onGenerate={handleGenerateDisintegration}
        />
      )}
      {isFragmentModalOpen && (
        <FragmentGeneratorModal
            isOpen={isFragmentModalOpen}
            onClose={() => setIsFragmentModalOpen(false)}
            onGenerate={handleGenerateFragment}
        />
      )}
      {isWarpModalOpen && (
        <WarpGeneratorModal
            isOpen={isWarpModalOpen}
            onClose={() => setIsWarpModalOpen(false)}
            onGenerate={handleGenerateWarp}
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
