import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Tile, MSXColor, MSXColorValue, PixelData, Point, LineColorAttribute, MSX1ColorValue, MSX1Color, SymmetrySettings, ProjectAsset, DataFormat, TileLogicalProperties, DrawingTool, DITHER_BRUSH_DIAMETERS, DitherBrushDiameter, SolidityTypeId, SOLIDITY_TYPES, PROPERTY_FLAGS, PropertyFlagKey, TextureGeneratorType, RockGeneratorParams, BrickGeneratorParams, LadderGeneratorParams, AllGeneratorParams, CellBarsGeneratorParams, IceGeneratorParams, GrassGeneratorParams, StylizedGrassGeneratorParams, FrameGeneratorParams, Screen5PaletteSlot, TileAnimationSettings, TileAnimationMode, TileTransformEffect, TileInteractionType, TILE_INTERACTION_TYPES } from '../../types';
import { Panel } from '../common/Panel';
import { Tooltip } from '../common/Tooltip';
import {
  EDITABLE_TILE_DIMENSIONS, MSX1_PALETTE, MSX1_PALETTE_MAP, MSX1_PALETTE_IDX_MAP,
  SCREEN2_PIXELS_PER_COLOR_SEGMENT, DEFAULT_SCREEN2_FG_COLOR, DEFAULT_SCREEN2_BG_COLOR,
  DEFAULT_SCREEN2_FG_COLOR_INDEX, DEFAULT_SCREEN2_BG_COLOR_INDEX, MSX_SCREEN5_PALETTE, EDITOR_BASE_TILE_DIM_S2
} from '../../constants';
import { Button } from '../common/Button';
import {
  PatternBrushIcon, TilesetIcon as SplitIcon, CopyIcon, PasteIcon, SparklesIcon,
  ArrowUpIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, SwapHorizIcon, SwapVertIcon,
  GridIcon
} from '../icons/MsxIcons';
import { PngIcon } from '../icons/PngIcon';
import pencilImg from '../../src/assets/icons/pencil.png';
import paintBucketImg from '../../src/assets/icons/paint_bucket.png';
import floppyDiskImg from '../../src/assets/icons/floppy_disk.png';
import { TileFileOperationsModal } from '../modals/TileFileOperationsModal';
import {
  createDefaultLineAttributes,
  shiftTileDataUp,
  shiftTileDataDown,
  shiftTileDataLeft,
  shiftTileDataRight,
  mirrorTileDataHorizontal,
  mirrorTileDataVertical
} from '../utils/tileUtils';
import { TileEditorAdvancedLayout } from './TileEditorAdvancedLayout';
import { ensureScreen5PaletteSlots, getScreen5PaletteColor, screen5SlotsToMsxColors } from '../../utils/screen5PaletteUtils';
import { isTriggeredTileInteractionType } from '../utils/screenUtils';


/**
 * Resizes a 2D array of pixel data to new dimensions.
 * @param oldData The original pixel data.
 * @param oldWidth The original width.
 * @param oldHeight The original height.
 * @param newWidth The new width.
 * @param newHeight The new height.
 * @param defaultPixelColor The color to fill new cells with.
 * @returns The resized pixel data.
 * @internal
 */
const resizePixelPatternData = (oldData: PixelData, oldWidth: number, oldHeight: number, newWidth: number, newHeight: number, defaultPixelColor: MSXColorValue): PixelData => {
  const newData: PixelData = [];
  for (let y = 0; y < newHeight; y++) {
    const newRow: MSXColorValue[] = [];
    for (let x = 0; x < newWidth; x++) {
      if (y < oldHeight && x < oldWidth && oldData[y] && oldData[y][x] !== undefined) {
        newRow.push(oldData[y][x]);
      } else {
        newRow.push(defaultPixelColor);
      }
    }
    newData.push(newRow);
  }
  return newData;
};

/**
 * Resizes a 2D array of line color attributes for SCREEN 2 mode.
 * @param oldAttributes The original line attributes.
 * @param oldWidth The original width.
 * @param oldHeight The original height.
 * @param newWidth The new width.
 * @param newHeight The new height.
 * @param defaultFg The default foreground color.
 * @param defaultBg The default background color.
 * @returns The resized line attributes.
 * @internal
 */
const resizeLineAttributes = (
  oldAttributes: LineColorAttribute[][] | undefined,
  oldWidth: number, oldHeight: number,
  newWidth: number, newHeight: number,
  defaultFg: MSX1ColorValue, defaultBg: MSX1ColorValue
): LineColorAttribute[][] => {
  const newNumSegmentsPerRow = Math.max(1, newWidth / SCREEN2_PIXELS_PER_COLOR_SEGMENT);
  const oldNumSegmentsPerRow = Math.max(1, oldWidth / SCREEN2_PIXELS_PER_COLOR_SEGMENT);
  const newAttrs: LineColorAttribute[][] = [];

  for (let y = 0; y < newHeight; y++) {
    const newRowAttrs: LineColorAttribute[] = [];
    for (let s = 0; s < newNumSegmentsPerRow; s++) {
      if (oldAttributes && y < oldHeight && s < oldNumSegmentsPerRow && oldAttributes[y] && oldAttributes[y][s]) {
        newRowAttrs.push(oldAttributes[y][s]);
      } else {
        newRowAttrs.push({ fg: defaultFg, bg: defaultBg });
      }
    }
    newAttrs.push(newRowAttrs);
  }
  return newAttrs;
};

// ---------------------------------------------------------------------------
// CollapsiblePanel — accordion section for the TileEditor left column
// ---------------------------------------------------------------------------
interface CollapsiblePanelProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({ title, isOpen, onToggle, children }) => (
  <div className="bg-msx-panelbg border border-msx-border rounded-md shadow-lg flex flex-col">
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center w-full text-left px-2 py-1.5 hover:bg-msx-border/30 transition-colors select-none"
      style={{ borderBottom: isOpen ? '1px solid var(--color-msx-border, #2a2a3a)' : 'none' }}
    >
      <span className="mr-2 text-msx-highlight text-xs">{isOpen ? '▾' : '▸'}</span>
      <span className="text-sm text-msx-textprimary flex-grow font-sans">{title}</span>
    </button>
    {isOpen && (
      <div className="p-2">
        {children}
      </div>
    )}
  </div>
);

/**
 * Props for the {@link PixelGrid} component.
 * @internal
 */
interface PixelGridProps {
  pixelData: PixelData;
  tileWidth: number;
  tileHeight: number;
  lineAttributes: LineColorAttribute[][];
  onGridInteraction: (point: Point, isRightClick: boolean) => void;
  pixelSize?: number;
  showCenterGuide?: boolean;
  showGrid8x8?: boolean;
  selectedGrid8x8Cell?: Point | null;
  selectedGrid8x8Cells?: Point[];
  currentScreenMode: string;
  symmetrySettings: SymmetrySettings;
  currentTool: DrawingTool;
}

/**
 * The interactive pixel grid component for drawing tiles.
 * @internal
 */
const PixelGrid: React.FC<PixelGridProps> = ({
  pixelData, tileWidth, tileHeight, lineAttributes, onGridInteraction,
  pixelSize = 20, showCenterGuide, showGrid8x8, selectedGrid8x8Cell, selectedGrid8x8Cells, currentScreenMode, symmetrySettings, currentTool
}) => {
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isRightMBDown, setIsRightMBDown] = useState(false);

  const handleMouseDown = (x: number, y: number, event: React.MouseEvent) => {
    const isRight = event.button === 2 || event.ctrlKey;
    setIsMouseDown(true);
    setIsRightMBDown(isRight);
    onGridInteraction({ x, y }, isRight);
    event.preventDefault();
  };

  const handleMouseEnter = (x: number, y: number) => {
    if (isMouseDown && (currentTool === 'pencil' || currentTool === 'dither')) { // Allow drag for pencil and dither
      onGridInteraction({ x, y }, isRightMBDown);
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setIsRightMBDown(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isMouseDown) handleMouseUp();
    };
    const preventContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('mouseup', handleGlobalMouseUp);
    const gridElement = document.getElementById('pixel-grid-interactive');
    gridElement?.addEventListener('contextmenu', preventContextMenu);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      gridElement?.removeEventListener('contextmenu', preventContextMenu);
    };
  }, [isMouseDown]);

  const gridLines = [];
  // Standard pixel grid lines
  for (let i = 1; i < tileWidth; i++) {
    const isSegmentLine = currentScreenMode === "SCREEN 2 (Graphics I)" && i % SCREEN2_PIXELS_PER_COLOR_SEGMENT === 0;
    gridLines.push(
      <div key={`v-${i}`} className={`absolute ${isSegmentLine ? 'bg-msx-accent' : 'bg-msx-border'} ${isSegmentLine ? 'opacity-40' : 'opacity-20'}`} style={{ left: i * pixelSize - 0.5, top: 0, width: 1, height: '100%' }} />
    );
  }
  for (let i = 1; i < tileHeight; i++) {
    gridLines.push(
      <div key={`h-${i}`} className="absolute bg-msx-border opacity-20" style={{ top: i * pixelSize - 0.5, left: 0, height: 1, width: '100%' }} />
    );
  }

  // Symmetry guide lines
  if (pixelSize > 6) {
    const centerColor = "rgba(255, 255, 0, 0.4)";
    const lineWidth = 1;

    if (symmetrySettings.horizontal || symmetrySettings.quadMirror) {
      gridLines.push(<div key="sym-center-v" className="absolute" style={{ backgroundColor: centerColor, left: (tileWidth / 2) * pixelSize - lineWidth / 2, top: 0, width: lineWidth, height: '100%' }} />);
    }
    if (symmetrySettings.vertical || symmetrySettings.quadMirror) {
      gridLines.push(<div key="sym-center-h" className="absolute" style={{ backgroundColor: centerColor, top: (tileHeight / 2) * pixelSize - lineWidth / 2, left: 0, height: lineWidth, width: '100%' }} />);
    }
    if (symmetrySettings.diagonalMain) {
      gridLines.push(<div key="sym-diag-main" className="absolute origin-top-left" style={{ backgroundColor: centerColor, top: 0, left: 0, width: lineWidth, height: Math.sqrt(2) * Math.max(tileWidth, tileHeight) * pixelSize, transform: `rotate(45deg) translateX(${-(Math.sqrt(2) * Math.max(tileWidth, tileHeight) * pixelSize - Math.max(tileWidth, tileHeight) * pixelSize) / 4}px) translateY(${-(Math.sqrt(2) * Math.max(tileWidth, tileHeight) * pixelSize - Math.max(tileWidth, tileHeight) * pixelSize) / 4}px)` }} />);
    }
    if (symmetrySettings.diagonalAnti && tileWidth === tileHeight) {
      gridLines.push(<div key="sym-diag-anti" className="absolute origin-top-right" style={{ backgroundColor: centerColor, top: 0, right: 0, width: lineWidth, height: Math.sqrt(2) * tileWidth * pixelSize, transform: `rotate(-45deg) translateX(${(Math.sqrt(2) * tileWidth * pixelSize - tileWidth * pixelSize) / 4}px) translateY(${-(Math.sqrt(2) * tileWidth * pixelSize - tileWidth * pixelSize) / 4}px)` }} />);
    }
  }

  const grid8x8Lines = [];
  if (showGrid8x8) {
    const dashedLineColor = 'rgba(255, 255, 255, 0.65)';
    const dashedLinePatternV = `repeating-linear-gradient(to bottom, ${dashedLineColor} 0 4px, transparent 4px 8px)`;
    const dashedLinePatternH = `repeating-linear-gradient(to right, ${dashedLineColor} 0 4px, transparent 4px 8px)`;

    for (let i = 8; i < tileWidth; i += 8) {
      grid8x8Lines.push(
        <div
          key={`grid8-v-${i}`}
          className="absolute pointer-events-none"
          style={{ left: i * pixelSize - 1, top: 0, width: 2, height: '100%', backgroundImage: dashedLinePatternV, zIndex: 20 }}
        />
      );
    }
    for (let i = 8; i < tileHeight; i += 8) {
      grid8x8Lines.push(
        <div
          key={`grid8-h-${i}`}
          className="absolute pointer-events-none"
          style={{ top: i * pixelSize - 1, left: 0, height: 2, width: '100%', backgroundImage: dashedLinePatternH, zIndex: 20 }}
        />
      );
    }
  }

  const selectedGrid8x8OverlayCells = selectedGrid8x8Cells && selectedGrid8x8Cells.length > 0
    ? selectedGrid8x8Cells
    : selectedGrid8x8Cell
      ? [selectedGrid8x8Cell]
      : [];
  const selectedGrid8x8Overlays = selectedGrid8x8OverlayCells.map((cell) => {
        const startX = cell.x * EDITOR_BASE_TILE_DIM_S2;
        const startY = cell.y * EDITOR_BASE_TILE_DIM_S2;
        if (startX >= tileWidth || startY >= tileHeight) return null;
        const cellWidth = Math.min(EDITOR_BASE_TILE_DIM_S2, tileWidth - startX);
        const cellHeight = Math.min(EDITOR_BASE_TILE_DIM_S2, tileHeight - startY);
        return (
          <div
            key={`selected-grid8-${cell.x}-${cell.y}`}
            className="absolute pointer-events-none border-2 border-msx-highlight"
            style={{
              left: startX * pixelSize,
              top: startY * pixelSize,
              width: cellWidth * pixelSize,
              height: cellHeight * pixelSize,
              zIndex: 30,
              boxShadow: '0 0 0 1px rgba(0,0,0,0.65) inset',
            }}
          />
        );
      });


  return (
    <div
      id="pixel-grid-interactive"
      className="grid border border-msx-border bg-gray-700 shadow-inner relative"
      style={{
        gridTemplateColumns: `repeat(${tileWidth}, ${pixelSize}px)`,
        gridTemplateRows: `repeat(${tileHeight}, ${pixelSize}px)`,
        width: tileWidth * pixelSize,
        height: tileHeight * pixelSize,
        imageRendering: 'pixelated',
        cursor: currentTool === 'floodfill' ? 'pointer' : 'crosshair'
      }}
      onMouseLeave={handleMouseUp}
    >
      {gridLines}
      {pixelData.map((row, y) =>
        row.map((color, x) => {
          let isValidPixel = true;
          if (currentScreenMode === "SCREEN 2 (Graphics I)" && lineAttributes[y]) {
            const segmentIndex = Math.floor(x / SCREEN2_PIXELS_PER_COLOR_SEGMENT);
            const attributes = lineAttributes[y][segmentIndex];
            if (attributes && color !== attributes.fg && color !== attributes.bg) {
              isValidPixel = false;
            }
          }
          return (
            <div
              key={`${x}-${y}`}
              className={`hover:outline hover:outline-1 hover:outline-msx-highlight z-10 ${!isValidPixel ? 'outline outline-2 outline-red-500' : ''}`}
              style={{ backgroundColor: color, width: `${pixelSize}px`, height: `${pixelSize}px` }}
              onMouseDown={(e) => handleMouseDown(x, y, e)}
              onMouseEnter={() => handleMouseEnter(x, y)}
              title={!isValidPixel ? `Invalid color for segment! Allowed: ${lineAttributes[y]?.[Math.floor(x / SCREEN2_PIXELS_PER_COLOR_SEGMENT)]?.fg}, ${lineAttributes[y]?.[Math.floor(x / SCREEN2_PIXELS_PER_COLOR_SEGMENT)]?.bg}` : `(${x},${y}) Tool: ${currentTool}`}
            />
          );
        })
      )}
      {grid8x8Lines}
      {selectedGrid8x8Overlays}
    </div>
  );
};


/**
 * Props for the {@link LineAttributeEditorPanel} component.
 * @internal
 */
interface LineAttributeEditorPanelProps {
  tile: Tile;
  onUpdateLineAttribute: (rowIndex: number, segmentIndex: number, newAttribute: LineColorAttribute) => void;
  selectedPaletteColor: MSX1ColorValue;
  onCopyAttributes: (rowIndex: number, segmentIndex: number) => void;
  onPasteAttributes: (rowIndex: number, segmentIndex: number) => void;
  copiedAttribute: LineColorAttribute | null;
  onFillAllFg: (newColor: MSX1ColorValue) => void;
  onFillAllBg: (newColor: MSX1ColorValue) => void;
}

/**
 * A panel for editing the line color attributes of a tile in SCREEN 2 mode.
 * @internal
 */
const LineAttributeEditorPanel: React.FC<LineAttributeEditorPanelProps> = ({
  tile, onUpdateLineAttribute, selectedPaletteColor,
  onCopyAttributes, onPasteAttributes, copiedAttribute,
  onFillAllFg, onFillAllBg
}) => {
  if (!tile.lineAttributes) return <div className="p-2 text-xs text-red-500">Line attributes not available for this tile.</div>;

  const numSegmentsPerRow = Math.max(1, tile.width / SCREEN2_PIXELS_PER_COLOR_SEGMENT);

  const handleSetColor = (rowIndex: number, segmentIndex: number, type: 'fg' | 'bg') => {
    const currentAttr = tile.lineAttributes![rowIndex][segmentIndex];
    const newAttr = { ...currentAttr };
    if (type === 'fg') newAttr.fg = selectedPaletteColor;
    else newAttr.bg = selectedPaletteColor;
    onUpdateLineAttribute(rowIndex, segmentIndex, newAttr);
  };

  return (
    <Panel title="MSX1 SCREEN 2 Line Color Attributes" className="flex-grow flex flex-col overflow-y-auto">
      <p className="text-xs text-msx-textsecondary mb-2 p-1">
        Define 2 colors (Foreground/Background) for each 8-pixel segment of each row.
        Selected palette color <span className="inline-block w-3 h-3 border border-msx-border align-middle" style={{ backgroundColor: selectedPaletteColor }}></span> will be used.
      </p>
      <div className="flex space-x-2 mb-2 px-1">
        <Button onClick={() => onFillAllFg(selectedPaletteColor)} size="sm" variant="secondary" className="flex-1 text-xs" title="Set the Foreground color of all segments to the selected palette color">
          Fill All FG
        </Button>
        <Button onClick={() => onFillAllBg(selectedPaletteColor)} size="sm" variant="secondary" className="flex-1 text-xs" title="Set the Background color of all segments to the selected palette color">
          Fill All BG
        </Button>
      </div>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-msx-border">
            <th className="p-1 border border-msx-border">Row</th>
            {Array.from({ length: numSegmentsPerRow }).map((_, segIdx) => (
              <th key={segIdx} colSpan={3} className="p-1 border border-msx-border">Segment {segIdx} (px {segIdx * 8}-{segIdx * 8 + 7})</th>
            ))}
          </tr>
          <tr className="bg-msx-border text-center">
            <th className="p-1 border border-msx-border"></th>
            {Array.from({ length: numSegmentsPerRow }).map((_, segIdx) => (
              <React.Fragment key={`header-${segIdx}`}>
                <th className="p-1 border border-msx-border">FG</th>
                <th className="p-1 border border-msx-border">BG</th>
                <th className="p-1 border border-msx-border">Actions</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {tile.lineAttributes.map((rowAttrs, rowIndex) => (
            <tr key={rowIndex} className={`${rowIndex % 2 === 0 ? 'bg-msx-bgcolor' : 'bg-msx-panelbg/60'}`}>
              <td className="p-1 border border-msx-border text-center font-bold">{rowIndex}</td>
              {rowAttrs.map((attr, segmentIndex) => (
                <React.Fragment key={`${rowIndex}-${segmentIndex}`}>
                  <td
                    className="p-1 border border-msx-border cursor-pointer hover:ring-1 ring-msx-accent"
                    style={{ backgroundColor: attr.fg }}
                    onClick={() => handleSetColor(rowIndex, segmentIndex, 'fg')}
                    title={`Set FG to ${MSX1_PALETTE_MAP.get(selectedPaletteColor)?.name || selectedPaletteColor}`}
                  >
                    <span className="mix-blend-difference text-white text-[0.6rem]">{MSX1_PALETTE_MAP.get(attr.fg)?.index ?? '?'}</span>
                  </td>
                  <td
                    className="p-1 border border-msx-border cursor-pointer hover:ring-1 ring-msx-accent"
                    style={{ backgroundColor: attr.bg }}
                    onClick={() => handleSetColor(rowIndex, segmentIndex, 'bg')}
                    title={`Set BG to ${MSX1_PALETTE_MAP.get(selectedPaletteColor)?.name || selectedPaletteColor}`}
                  >
                    <span className="mix-blend-difference text-white text-[0.6rem]">{MSX1_PALETTE_MAP.get(attr.bg)?.index ?? '?'}</span>
                  </td>
                  <td className="p-1 border border-msx-border text-center">
                    <Button onClick={() => onCopyAttributes(rowIndex, segmentIndex)} size="sm" variant="ghost" className="p-0.5 text-[0.6rem]">C</Button>
                    <Button onClick={() => onPasteAttributes(rowIndex, segmentIndex)} size="sm" variant="ghost" className="p-0.5 text-[0.6rem]" disabled={!copiedAttribute}>P</Button>
                  </td>
                </React.Fragment>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
};

/**
 * Props for the {@link TechnicalPreviewPanel} component.
 * @internal
 */
interface TechnicalPreviewPanelProps {
  tile: Tile;
  dataFormat: DataFormat;
}

/**
 * A panel that displays a technical preview of the tile's data for SCREEN 2 mode.
 * @internal
 */
const TechnicalPreviewPanel: React.FC<TechnicalPreviewPanelProps> = ({ tile, dataFormat }) => {
  if (!tile.lineAttributes) return null;

  const attributeBytesPerCharBlock: string[][] = [];
  const numCharBlocksX = tile.width / 8;
  const numCharBlocksY = tile.height / 8;

  const formatNumber = (value: number): string => {
    return dataFormat === 'hex' ? `#${value.toString(16).padStart(2, '0').toUpperCase()}` : value.toString(10);
  };

  for (let cbY = 0; cbY < numCharBlocksY; cbY++) {
    for (let cbX = 0; cbX < numCharBlocksX; cbX++) {
      const blockAttrs: string[] = [];
      for (let r = 0; r < 8; r++) { // 8 rows per character block
        const currentTileRow = cbY * 8 + r;
        if (tile.lineAttributes[currentTileRow] && tile.lineAttributes[currentTileRow][cbX]) {
          const segment = tile.lineAttributes[currentTileRow][cbX];
          const fgIndex = MSX1_PALETTE_MAP.get(segment.fg)?.index ?? 0;
          const bgIndex = MSX1_PALETTE_MAP.get(segment.bg)?.index ?? 0;
          const byte = (fgIndex << 4) | bgIndex; // MSX: FG in high nibble, BG in low nibble
          blockAttrs.push(formatNumber(byte));
        } else {
          blockAttrs.push(formatNumber((DEFAULT_SCREEN2_FG_COLOR_INDEX << 4) | DEFAULT_SCREEN2_BG_COLOR_INDEX)); // Default if somehow missing
        }
      }
      attributeBytesPerCharBlock.push(blockAttrs);
    }
  }

  const totalAttributeBytes = attributeBytesPerCharBlock.flat().length;

  const patternVRAM = (tile.width * tile.height) / 8; // Each pixel is 1 bit in pattern table for its character block
  // Attribute VRAM is 1 byte per row of each 8x8 character block.
  const attributeVRAMActual = numCharBlocksX * numCharBlocksY * 8;


  return (
    <Panel title="MSX1 Technical Preview (SCREEN 2)" className="mt-2">
      <div className="text-xs space-y-1">
        <div><strong className="text-msx-highlight">Data Format:</strong> {dataFormat.toUpperCase()}</div>
        <div><strong className="text-msx-highlight">Color Attribute Bytes (FG|BG, Per 8x8 Block):</strong> ({totalAttributeBytes} bytes total)</div>
        <div className="font-mono bg-msx-bgcolor p-1 rounded max-h-20 overflow-y-auto break-all">
          {attributeBytesPerCharBlock.map((block, idx) => (
            <div key={idx}>
              <span className="text-msx-textsecondary">Block {idx}: </span>{block.join(' ')}
            </div>
          ))}
          <i className="text-msx-textsecondary text-[0.6rem]">Order: Block(0,0)Row0..7, Block(0,1)Row0..7 ...</i>
        </div>
        <div><strong className="text-msx-highlight">Pattern VRAM:</strong> {patternVRAM} bytes</div>
        <div><strong className="text-msx-highlight">Attribute VRAM (actual for Color Table):</strong> {attributeVRAMActual} bytes</div>
        <div><strong className="text-msx-highlight">Total VRAM (Pattern+Color):</strong> {patternVRAM + attributeVRAMActual} bytes</div>
      </div>
    </Panel>
  );
};

interface TileCanvasPreviewProps {
  tile: Tile;
  scale: number;
  className?: string;
}

const TileCanvasPreview: React.FC<TileCanvasPreviewProps> = ({ tile, scale, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWidth = Math.max(1, tile.width * scale);
  const canvasHeight = Math.max(1, tile.height * scale);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < tile.height; y++) {
      for (let x = 0; x < tile.width; x++) {
        ctx.fillStyle = tile.data[y]?.[x] ?? 'rgba(0,0,0,0)';
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }, [tile, scale]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className={className}
      style={{ imageRendering: 'pixelated', width: canvasWidth, height: canvasHeight }}
    />
  );
};

interface CopiedTileBuffer {
  data: PixelData;
  lineAttributes?: LineColorAttribute[][];
  width: number;
  height: number;
}


// --- REWRITTEN TEXTURE GENERATOR ---

/**
 * Props for the {@link TextureGeneratorModal} component.
 * @internal
 */
interface TextureGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (pixels: PixelData) => void;
  currentTile: Tile;
  currentScreenMode: string;
  params: AllGeneratorParams;
  onParamsChange: (params: AllGeneratorParams) => void;
  screen5PaletteForPicker: MSXColor[];
}

interface PalettePickerProps {
  label: string;
  selectedColor: MSXColorValue;
  onChange: (color: MSXColorValue) => void;
  palette: { name: string; hex: string; index?: number }[];
}

/**
 * A reusable palette picker component for the texture generator modal.
 * @internal
 */
const PalettePicker: React.FC<PalettePickerProps> = ({ label, selectedColor, onChange, palette }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <label className="block text-msx-textsecondary">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="w-full h-7 p-1 border border-msx-border rounded flex items-center justify-between"
      >
        <div className="w-6 h-5 rounded" style={{ backgroundColor: selectedColor }}></div>
        <span className="text-xs">{selectedColor}</span>
      </button>
      {isOpen && (
        <div ref={pickerRef} className="absolute z-20 mt-1 bg-msx-panelbg border border-msx-border rounded shadow-lg p-2 w-full">
          <div className="grid grid-cols-8 gap-1">
            {palette.map(color => (
              <button
                type="button"
                key={color.hex + (color as any).index}
                className={`w-full aspect-square rounded border-2 ${selectedColor === color.hex ? 'border-white ring-1 ring-white' : 'border-transparent'}`}
                style={{ backgroundColor: color.hex }}
                onClick={() => {
                  onChange(color.hex);
                  setIsOpen(false);
                }}
                title={`${color.name}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


/**
 * A modal dialog for procedurally generating textures for tiles.
 * @internal
 */
const TextureGeneratorModal: React.FC<TextureGeneratorModalProps> = ({ isOpen, onClose, onGenerate, currentTile, currentScreenMode, params, onParamsChange, screen5PaletteForPicker }) => {
  const [generatorType, setGeneratorType] = useState<TextureGeneratorType>('Rock');
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const PREVIEW_SIZE = 128;
  const isScreen2 = currentScreenMode === "SCREEN 2 (Graphics I)";

  const generatePixelData = useCallback((width: number, height: number): PixelData => {
    const newData: PixelData = Array(height).fill(null).map(() => Array(width).fill(''));
    const currentParams = params[generatorType];

    if (generatorType === 'Rock') {
      const rockParams = currentParams as RockGeneratorParams;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const isBorder = rockParams.seamless
            ? (x === 0 || y === height - 1) // Keep left and bottom for seamless tiling
            : (x === 0 || x === width - 1 || y === 0 || y === height - 1); // Full border

          if (isScreen2) {
            const { fg, bg } = currentTile.lineAttributes?.[y]?.[Math.floor(x / SCREEN2_PIXELS_PER_COLOR_SEGMENT)] || { fg: DEFAULT_SCREEN2_FG_COLOR, bg: DEFAULT_SCREEN2_BG_COLOR };
            if (isBorder) {
              newData[y][x] = bg;
            } else {
              const isRockPixel = Math.random() < (rockParams.density / 100);
              newData[y][x] = isRockPixel ? fg : bg;
            }
          } else {
            if (isBorder) {
              newData[y][x] = rockParams.baseColor;
            } else {
              const rand = Math.random();
              const densityFactor = rockParams.density / 100;
              if (rand < densityFactor * 0.2) newData[y][x] = rockParams.shadowColor;
              else if (rand < densityFactor * 0.4) newData[y][x] = rockParams.highlightColor;
              else newData[y][x] = rockParams.baseColor;
            }
          }
        }
      }
    } else if (generatorType === 'Brick') {
      const brickParams = currentParams as BrickGeneratorParams;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const rowIsOdd = Math.floor(y / (brickParams.brickHeight + brickParams.mortarThickness)) % 2 !== 0;
          const offsetX = rowIsOdd ? brickParams.rowOffset * (brickParams.brickWidth + brickParams.mortarThickness) : 0;
          const effectiveX = x + offsetX;

          const isMortarX = effectiveX % (brickParams.brickWidth + brickParams.mortarThickness) < brickParams.mortarThickness;
          const isMortarY = y % (brickParams.brickHeight + brickParams.mortarThickness) < brickParams.mortarThickness;

          let isMortarPixel = isMortarX || isMortarY;

          if (isScreen2) {
            const { fg, bg } = currentTile.lineAttributes?.[y]?.[Math.floor(x / SCREEN2_PIXELS_PER_COLOR_SEGMENT)] || { fg: DEFAULT_SCREEN2_FG_COLOR, bg: DEFAULT_SCREEN2_BG_COLOR };
            newData[y][x] = isMortarPixel ? bg : fg;
          } else {
            // Add edge variation for non-S2 modes
            if (brickParams.edgeVariation > 0) {
              const variation = brickParams.edgeVariation / 100.0;
              const isEdgeX = effectiveX % (brickParams.brickWidth + brickParams.mortarThickness) >= brickParams.mortarThickness - 1 && effectiveX % (brickParams.brickWidth + brickParams.mortarThickness) < brickParams.mortarThickness + 1;
              const isEdgeY = y % (brickParams.brickHeight + brickParams.mortarThickness) >= brickParams.mortarThickness - 1 && y % (brickParams.brickHeight + brickParams.mortarThickness) < brickParams.mortarThickness + 1;
              if ((isEdgeX || isEdgeY) && Math.random() < variation) {
                isMortarPixel = !isMortarPixel;
              }
            }
            newData[y][x] = isMortarPixel ? brickParams.mortarColor : brickParams.brickColor;
          }
        }
      }
    } else if (generatorType === 'Ladder') {
      const ladderParams = currentParams as LadderGeneratorParams;
      const { railWidth, rungHeight, rungSpacing, railInset, style } = ladderParams;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const { fg, bg } = isScreen2
            ? currentTile.lineAttributes?.[y]?.[Math.floor(x / SCREEN2_PIXELS_PER_COLOR_SEGMENT)] || { fg: DEFAULT_SCREEN2_FG_COLOR, bg: DEFAULT_SCREEN2_BG_COLOR }
            : { fg: ladderParams.railColor, bg: ladderParams.backgroundColor };

          const rungColor = isScreen2 ? fg : ladderParams.rungColor;
          newData[y][x] = bg;

          // Draw rails
          const isLeftRail = x >= railInset && x < railInset + railWidth;
          const isRightRail = x >= width - railInset - railWidth && x < width - railInset;
          if (isLeftRail || isRightRail) {
            newData[y][x] = isScreen2 ? fg : ladderParams.railColor;
            continue;
          }

          // Draw rungs
          const isInsideRails = x >= railInset + railWidth && x < width - railInset - railWidth;
          if (isInsideRails) {
            const totalStep = rungHeight + rungSpacing;
            if (totalStep > 0 && y % totalStep < rungHeight) {
              if (style === 'dashed') {
                if (x % 2 === 0) newData[y][x] = rungColor;
              } else {
                newData[y][x] = rungColor;
              }
            }
          }
        }
      }
    } else if (generatorType === 'CellBars') {
      const cellParams = currentParams as CellBarsGeneratorParams;
      const { barCount, barThickness, hasOutline } = cellParams;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const { fg, bg } = isScreen2 ? currentTile.lineAttributes?.[y]?.[Math.floor(x / SCREEN2_PIXELS_PER_COLOR_SEGMENT)] || { fg: DEFAULT_SCREEN2_FG_COLOR, bg: DEFAULT_SCREEN2_BG_COLOR } : { fg: cellParams.barColor, bg: cellParams.backgroundColor };
          let isPixelSet = false;
          if (hasOutline && (x === 0 || x === width - 1 || y === 0 || y === height - 1)) {
            isPixelSet = true;
          } else {
            const startX = hasOutline ? 1 : 0;
            const drawableWidth = width - (hasOutline ? 2 : 0);
            if (x >= startX && x < startX + drawableWidth) {
              if (drawableWidth > 0 && barCount > 0) {
                const totalBarThickness = barCount * barThickness;
                if (totalBarThickness <= drawableWidth) {
                  const spaceForGaps = drawableWidth - totalBarThickness;
                  const gapSize = spaceForGaps / (barCount + 1);
                  let currentBarStartX = startX + gapSize;
                  for (let i = 0; i < barCount; i++) {
                    const barStartPixel = Math.round(currentBarStartX);
                    const barEndPixel = barStartPixel + barThickness;
                    if (x >= barStartPixel && x < barEndPixel) {
                      isPixelSet = true;
                      break;
                    }
                    currentBarStartX += barThickness + gapSize;
                  }
                }
              }
            }
          }
          newData[y][x] = isPixelSet ? fg : bg;
        }
      }
    } else if (generatorType === 'Ice') {
      const iceParams = currentParams as IceGeneratorParams;
      // Fill base
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const { fg, bg } = isScreen2 ? currentTile.lineAttributes?.[y]?.[Math.floor(x / SCREEN2_PIXELS_PER_COLOR_SEGMENT)] || { fg: DEFAULT_SCREEN2_FG_COLOR, bg: DEFAULT_SCREEN2_BG_COLOR } : { fg: iceParams.crackColor, bg: iceParams.baseColor };
          newData[y][x] = bg;
        }
      }
      // Generate cracks (random walks)
      const numWalkers = Math.floor(width * height * 0.05 * iceParams.crackDensity);
      for (let i = 0; i < numWalkers; i++) {
        let wx = Math.floor(Math.random() * width);
        let wy = Math.floor(Math.random() * height);
        const walkLength = Math.floor(Math.random() * (width / 4)) + 3;
        for (let j = 0; j < walkLength; j++) {
          if (wx >= 0 && wx < width && wy >= 0 && wy < height) {
            const { fg, bg } = isScreen2 ? currentTile.lineAttributes?.[wy]?.[Math.floor(wx / SCREEN2_PIXELS_PER_COLOR_SEGMENT)] || { fg: DEFAULT_SCREEN2_FG_COLOR, bg: DEFAULT_SCREEN2_BG_COLOR } : { fg: iceParams.crackColor, bg: iceParams.baseColor };
            newData[wy][wx] = fg;
          }
          wx += Math.floor(Math.random() * 3) - 1;
          wy += Math.floor(Math.random() * 3) - 1;
        }
      }
      // Add highlights
      const highlightRows = Math.floor(height * 0.25);
      for (let y = 0; y < highlightRows; y++) {
        for (let x = 0; x < width; x++) {
          if (Math.random() < 0.1) {
            const { fg, bg } = isScreen2 ? currentTile.lineAttributes?.[y]?.[Math.floor(x / SCREEN2_PIXELS_PER_COLOR_SEGMENT)] || { fg: DEFAULT_SCREEN2_FG_COLOR, bg: DEFAULT_SCREEN2_BG_COLOR } : { fg: iceParams.shineColor, bg: iceParams.baseColor };
            newData[y][x] = isScreen2 ? fg : iceParams.shineColor;
          }
        }
      }
    } else if (generatorType === 'Grass') {
      const grassParams = currentParams as GrassGeneratorParams;
      // Base noisy ground
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const { fg, bg } = isScreen2 ? currentTile.lineAttributes?.[y]?.[Math.floor(x / SCREEN2_PIXELS_PER_COLOR_SEGMENT)] || { fg: DEFAULT_SCREEN2_FG_COLOR, bg: DEFAULT_SCREEN2_BG_COLOR } : { fg: grassParams.baseGrassColor, bg: grassParams.shadowGrassColor };
          newData[y][x] = Math.random() > 0.4 ? fg : bg;
        }
      }
      // Add blades
      for (let x = 0; x < width; x++) {
        if (Math.random() > 0.6) {
          const bladeHeight = Math.floor(Math.random() * 4) + 2;
          for (let y = 0; y < bladeHeight; y++) {
            const currentY = height - 1 - y;
            if (currentY >= 0) {
              const { fg, bg } = isScreen2 ? currentTile.lineAttributes?.[currentY]?.[Math.floor(x / SCREEN2_PIXELS_PER_COLOR_SEGMENT)] || { fg: DEFAULT_SCREEN2_FG_COLOR, bg: DEFAULT_SCREEN2_BG_COLOR } : { fg: grassParams.baseGrassColor, bg: grassParams.shadowGrassColor };
              newData[currentY][x] = bg;
            }
          }
        }
      }
      // Add detail (flower)
      if (Math.random() < grassParams.detailProbability) {
        const flowerX = Math.floor(Math.random() * (width - 1));
        const flowerY = Math.floor(Math.random() * (height / 2));
        const { fg, bg } = isScreen2 ? currentTile.lineAttributes?.[flowerY]?.[Math.floor(flowerX / SCREEN2_PIXELS_PER_COLOR_SEGMENT)] || { fg: DEFAULT_SCREEN2_FG_COLOR, bg: DEFAULT_SCREEN2_BG_COLOR } : { fg: grassParams.detailColor, bg: grassParams.shadowGrassColor };
        const detailColor = isScreen2 ? fg : grassParams.detailColor;
        if (newData[flowerY]) newData[flowerY][flowerX] = detailColor;
        if (newData[flowerY + 1]?.[flowerX]) newData[flowerY + 1][flowerX] = detailColor;
        if (newData[flowerY]?.[flowerX + 1]) newData[flowerY][flowerX + 1] = detailColor;
      }
    } else if (generatorType === 'StylizedGrass') {
      const grassParams = currentParams as StylizedGrassGeneratorParams;
      const groundRows = Math.max(1, Math.floor(height * 0.3));
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const { fg, bg } = isScreen2 ? currentTile.lineAttributes?.[y]?.[Math.floor(x / SCREEN2_PIXELS_PER_COLOR_SEGMENT)] || { fg: DEFAULT_SCREEN2_FG_COLOR, bg: DEFAULT_SCREEN2_BG_COLOR } : { fg: grassParams.lightGrassColor, bg: grassParams.darkGrassColor };
          newData[y][x] = y >= height - groundRows ? bg : (Math.random() < 0.2 ? bg : fg);
        }
      }
      // Draw blades
      for (let x = 0; x < width; x++) {
        if (Math.random() < grassParams.bladeDensity) {
          const bladeHeight = Math.floor(Math.random() * (height - groundRows - 1)) + 2;
          let currentX = x;
          for (let y = 0; y < bladeHeight; y++) {
            const currentY = height - groundRows - y;
            if (currentY >= 0 && currentX >= 0 && currentX < width) {
              const { fg, bg } = isScreen2 ? currentTile.lineAttributes?.[currentY]?.[Math.floor(currentX / SCREEN2_PIXELS_PER_COLOR_SEGMENT)] || { fg: DEFAULT_SCREEN2_FG_COLOR, bg: DEFAULT_SCREEN2_BG_COLOR } : { fg: grassParams.lightGrassColor, bg: grassParams.darkGrassColor };
              newData[currentY][currentX] = y < 2 ? bg : fg;
              if (grassParams.style === 'wavy' && y % 2 === 0) {
                currentX += Math.random() < 0.5 ? 1 : -1;
              } else if (grassParams.style === 'random') {
                currentX += Math.floor(Math.random() * 3) - 1;
              }
            }
          }
        }
      }
    } else if (generatorType === 'Frame') {
      const frameParams = currentParams as FrameGeneratorParams;
      const { thickness, style, corners } = frameParams;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const { fg, bg } = isScreen2
            ? currentTile.lineAttributes?.[y]?.[Math.floor(x / SCREEN2_PIXELS_PER_COLOR_SEGMENT)] || { fg: DEFAULT_SCREEN2_FG_COLOR, bg: DEFAULT_SCREEN2_BG_COLOR }
            : { fg: frameParams.frameColor, bg: frameParams.backgroundColor };

          let isFramePixel = false;

          // Determine if pixel is part of frame
          const isTop = y < thickness;
          const isBottom = y >= height - thickness;
          const isLeft = x < thickness;
          const isRight = x >= width - thickness;

          // Basic frame border
          if (isTop || isBottom || isLeft || isRight) {
            isFramePixel = true;

            // Handle corners based on corner style
            if (corners === 'rounded' || corners === 'fancy') {
              const inTopLeftCorner = x < thickness && y < thickness;
              const inTopRightCorner = x >= width - thickness && y < thickness;
              const inBottomLeftCorner = x < thickness && y >= height - thickness;
              const inBottomRightCorner = x >= width - thickness && y >= height - thickness;

              if (corners === 'rounded') {
                // Simple rounded corners - cut off diagonal pixel
                if (inTopLeftCorner && (x + y < thickness)) isFramePixel = false;
                if (inTopRightCorner && ((width - 1 - x) + y < thickness)) isFramePixel = false;
                if (inBottomLeftCorner && (x + (height - 1 - y) < thickness)) isFramePixel = false;
                if (inBottomRightCorner && ((width - 1 - x) + (height - 1 - y) < thickness)) isFramePixel = false;
              } else if (corners === 'fancy') {
                // Fancy corners with decorative pattern
                if (inTopLeftCorner && x === y) isFramePixel = true;
                if (inTopRightCorner && (width - 1 - x) === y) isFramePixel = true;
                if (inBottomLeftCorner && x === (height - 1 - y)) isFramePixel = true;
                if (inBottomRightCorner && (width - 1 - x) === (height - 1 - y)) isFramePixel = true;
              }
            }

            // Handle double frame style
            if (style === 'double' && thickness >= 2) {
              const midPoint = Math.floor(thickness / 2);
              const isMidLine = (isTop || isBottom) && (y === midPoint || y === height - 1 - midPoint);
              const isMidCol = (isLeft || isRight) && (x === midPoint || x === width - 1 - midPoint);

              if (!isMidLine && !isMidCol) {
                // Only draw the outer and an inner line for double style
                if (isTop && y !== 0 && y !== thickness - 1) isFramePixel = false;
                if (isBottom && y !== height - 1 && y !== height - thickness) isFramePixel = false;
                if (isLeft && x !== 0 && x !== thickness - 1) isFramePixel = false;
                if (isRight && x !== width - 1 && x !== width - thickness) isFramePixel = false;
              }
            } else if (style === 'decorative' && thickness >= 2) {
              // Decorative style with dots pattern
              if ((isTop || isBottom) && !isLeft && !isRight) {
                if (x % 2 === 0 && y % 2 !== 0) isFramePixel = false;
              }
              if ((isLeft || isRight) && !isTop && !isBottom) {
                if (y % 2 === 0 && x % 2 !== 0) isFramePixel = false;
              }
            } else if (style === 'braided' && thickness >= 2) {
              // Braided pattern - alternating diagonal weave
              const inTopLeftCorner = x < thickness && y < thickness;
              const inTopRightCorner = x >= width - thickness && y < thickness;
              const inBottomLeftCorner = x < thickness && y >= height - thickness;
              const inBottomRightCorner = x >= width - thickness && y >= height - thickness;

              // Skip corners for braided effect
              if (inTopLeftCorner || inTopRightCorner || inBottomLeftCorner || inBottomRightCorner) {
                // Keep corners solid
              } else {
                // Create braided pattern
                const period = Math.max(2, thickness);

                if (isTop || isBottom) {
                  // Horizontal braiding
                  const phase = Math.floor(x / period) % 2;
                  const localY = isTop ? y : (height - 1 - y);

                  if (phase === 0) {
                    // Over pattern
                    if (localY % 2 === 1 && localY < thickness - 1) isFramePixel = false;
                  } else {
                    // Under pattern
                    if (localY % 2 === 0 && localY > 0) isFramePixel = false;
                  }
                }

                if (isLeft || isRight) {
                  // Vertical braiding
                  const phase = Math.floor(y / period) % 2;
                  const localX = isLeft ? x : (width - 1 - x);

                  if (phase === 0) {
                    // Over pattern
                    if (localX % 2 === 1 && localX < thickness - 1) isFramePixel = false;
                  } else {
                    // Under pattern
                    if (localX % 2 === 0 && localX > 0) isFramePixel = false;
                  }
                }
              }
            } else if (style === 'chain' && thickness >= 3) {
              // Chain/Link pattern - interlocking rings
              const inTopLeftCorner = x < thickness && y < thickness;
              const inTopRightCorner = x >= width - thickness && y < thickness;
              const inBottomLeftCorner = x < thickness && y >= height - thickness;
              const inBottomRightCorner = x >= width - thickness && y >= height - thickness;

              if (!inTopLeftCorner && !inTopRightCorner && !inBottomLeftCorner && !inBottomRightCorner) {
                const linkSize = Math.max(3, Math.floor(thickness * 1.5));

                if (isTop || isBottom) {
                  const linkPos = x % linkSize;
                  const localY = isTop ? y : (height - 1 - y);
                  const midY = Math.floor(thickness / 2);

                  // Create oval link shapes
                  if (linkPos < linkSize / 3 || linkPos >= 2 * linkSize / 3) {
                    if (localY === 0 || localY === thickness - 1) {
                      // Outer edges
                    } else if (localY === midY) {
                      isFramePixel = false; // Center gap
                    }
                  } else {
                    // Middle section of link
                    if (localY > 0 && localY < thickness - 1 && localY !== midY - 1 && localY !== midY + 1) {
                      isFramePixel = false;
                    }
                  }
                }

                if (isLeft || isRight) {
                  const linkPos = y % linkSize;
                  const localX = isLeft ? x : (width - 1 - x);
                  const midX = Math.floor(thickness / 2);

                  if (linkPos < linkSize / 3 || linkPos >= 2 * linkSize / 3) {
                    if (localX === 0 || localX === thickness - 1) {
                      // Outer edges
                    } else if (localX === midX) {
                      isFramePixel = false; // Center gap
                    }
                  } else {
                    if (localX > 0 && localX < thickness - 1 && localX !== midX - 1 && localX !== midX + 1) {
                      isFramePixel = false;
                    }
                  }
                }
              }
            } else if (style === 'carved' && thickness >= 2) {
              // Carved 3D effect - simulates depth with light/shadow
              const inTopLeftCorner = x < thickness && y < thickness;
              const inTopRightCorner = x >= width - thickness && y < thickness;
              const inBottomLeftCorner = x < thickness && y >= height - thickness;
              const inBottomRightCorner = x >= width - thickness && y >= height - thickness;

              if (!inTopLeftCorner && !inTopRightCorner && !inBottomLeftCorner && !inBottomRightCorner) {
                // For Screen2, we'll use fg/bg to create the carved effect
                // For other modes, we'd need a third color but we'll work with what we have

                if (isTop) {
                  // Top edge - simulate raised edge
                  if (y === 0) {
                    // Outermost line stays solid (highlight)
                  } else if (y < thickness / 2) {
                    // Upper half - lighter (highlight)
                  } else {
                    // Lower half - darker (shadow)
                    if (x % 2 === (y % 2)) {
                      isFramePixel = false; // Dithered shadow
                    }
                  }
                } else if (isBottom) {
                  // Bottom edge - simulate depressed edge
                  const localY = height - 1 - y;
                  if (localY === 0) {
                    // Outermost line stays solid (shadow)
                    if (x % 2 === 0) {
                      isFramePixel = false; // Dithered for depth
                    }
                  } else if (localY < thickness / 2) {
                    if (x % 2 === (localY % 2)) {
                      isFramePixel = false;
                    }
                  }
                }

                if (isLeft) {
                  // Left edge - raised
                  if (x === 0) {
                    // Highlight edge
                  } else if (x < thickness / 2) {
                    // Light side
                  } else {
                    if (y % 2 === (x % 2)) {
                      isFramePixel = false;
                    }
                  }
                } else if (isRight) {
                  // Right edge - shadow
                  const localX = width - 1 - x;
                  if (localX === 0) {
                    if (y % 2 === 0) {
                      isFramePixel = false;
                    }
                  } else if (localX < thickness / 2) {
                    if (y % 2 === (localX % 2)) {
                      isFramePixel = false;
                    }
                  }
                }
              }
            }
          }

          newData[y][x] = isFramePixel ? fg : bg;
        }
      }
    }
    return newData;
  }, [generatorType, params, currentTile, currentScreenMode, isScreen2]);

  useEffect(() => {
    if (!isOpen || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previewPixelData = generatePixelData(PREVIEW_SIZE, PREVIEW_SIZE);
    ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
    for (let y = 0; y < PREVIEW_SIZE; y++) {
      for (let x = 0; x < PREVIEW_SIZE; x++) {
        ctx.fillStyle = previewPixelData[y][x];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [isOpen, generatePixelData]);

  const handleGenerateClick = () => {
    const finalPixelData = generatePixelData(currentTile.width, currentTile.height);
    onGenerate(finalPixelData);
  };

  if (!isOpen) return null;

  const rockParams = params.Rock;
  const brickParams = params.Brick;
  const ladderParams = params.Ladder;
  const cellParams = params.CellBars;
  const iceParams = params.Ice;
  const grassParams = params.Grass;
  const stylizedGrassParams = params.StylizedGrass;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn" onClick={onClose}>
      <div className="bg-msx-panelbg p-4 rounded-lg shadow-xl w-full max-w-2xl flex flex-col animate-slideIn" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg text-msx-highlight mb-3 pixel-font">Texture Generator</h3>
        <div className="flex-grow flex gap-4">
          {/* Left: Controls */}
          <div className="w-1/2 space-y-3 text-xs">
            <div className="flex space-x-1 flex-wrap gap-1">
              {(['Rock', 'Brick', 'Ladder', 'CellBars', 'Ice', 'Grass', 'StylizedGrass', 'Frame'] as TextureGeneratorType[]).map(type => (
                <Button key={type} onClick={() => setGeneratorType(type)} variant={generatorType === type ? 'primary' : 'ghost'}>{type}</Button>
              ))}
            </div>
            {generatorType === 'Rock' ? (
              <div className="space-y-2">
                {!isScreen2 ? (
                  <>
                    <PalettePicker label="Base Color:" selectedColor={rockParams.baseColor} onChange={color => onParamsChange({ ...params, Rock: { ...rockParams, baseColor: color } })} palette={screen5PaletteForPicker} />
                    <PalettePicker label="Highlight Color:" selectedColor={rockParams.highlightColor} onChange={color => onParamsChange({ ...params, Rock: { ...rockParams, highlightColor: color } })} palette={screen5PaletteForPicker} />
                    <PalettePicker label="Shadow Color:" selectedColor={rockParams.shadowColor} onChange={color => onParamsChange({ ...params, Rock: { ...rockParams, shadowColor: color } })} palette={screen5PaletteForPicker} />
                  </>
                ) : (
                  <p className="text-xs text-msx-textsecondary p-1 border border-dashed border-msx-border rounded">
                    Rock texture will use the tile's per-segment <strong>Foreground</strong> and <strong>Background</strong> colors. Density controls the amount of 'rock' (FG) vs 'empty space' (BG).
                  </p>
                )}
                <div><label>Density ({rockParams.density}%):</label><input type="range" min="1" max="100" value={rockParams.density} onChange={e => onParamsChange({ ...params, Rock: { ...rockParams, density: parseInt(e.target.value) } })} className="w-full" /></div>
                <label className="flex items-center space-x-2 text-msx-textsecondary cursor-pointer pt-1">
                  <input type="checkbox" checked={rockParams.seamless} onChange={e => onParamsChange({ ...params, Rock: { ...rockParams, seamless: e.target.checked } })} className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent" />
                  <span>Seamless Tiling (Removes top/right border)</span>
                </label>
              </div>
            ) : generatorType === 'Brick' ? (
              <div className="space-y-2">
                {!isScreen2 ? (
                  <>
                    <PalettePicker label="Brick Color:" selectedColor={brickParams.brickColor} onChange={color => onParamsChange({ ...params, Brick: { ...brickParams, brickColor: color } })} palette={screen5PaletteForPicker} />
                    <PalettePicker label="Mortar Color:" selectedColor={brickParams.mortarColor} onChange={color => onParamsChange({ ...params, Brick: { ...brickParams, mortarColor: color } })} palette={screen5PaletteForPicker} />
                  </>
                ) : (
                  <p className="text-xs text-msx-textsecondary p-1 border border-dashed border-msx-border rounded">
                    Brick texture uses <strong>Foreground</strong> for bricks and <strong>Background</strong> for mortar, based on the tile's line color attributes.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div><label>Brick W:</label><input type="number" min="2" value={brickParams.brickWidth} onChange={e => onParamsChange({ ...params, Brick: { ...brickParams, brickWidth: parseInt(e.target.value) } })} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded" /></div>
                  <div><label>Brick H:</label><input type="number" min="2" value={brickParams.brickHeight} onChange={e => onParamsChange({ ...params, Brick: { ...brickParams, brickHeight: parseInt(e.target.value) } })} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded" /></div>
                </div>
                <div><label>Mortar Size:</label><input type="number" min="1" value={brickParams.mortarThickness} onChange={e => onParamsChange({ ...params, Brick: { ...brickParams, mortarThickness: parseInt(e.target.value) } })} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded" /></div>
                <div><label>Row Offset ({(brickParams.rowOffset * 100).toFixed(0)}%):</label><input type="range" min="0" max="1" step="0.05" value={brickParams.rowOffset} onChange={e => onParamsChange({ ...params, Brick: { ...brickParams, rowOffset: parseFloat(e.target.value) } })} className="w-full" /></div>
                {!isScreen2 && (
                  <div><label>Edge Variation ({brickParams.edgeVariation}%):</label><input type="range" min="0" max="100" value={brickParams.edgeVariation} onChange={e => onParamsChange({ ...params, Brick: { ...brickParams, edgeVariation: parseInt(e.target.value) } })} className="w-full" /></div>
                )}
              </div>
            ) : generatorType === 'Ladder' ? (
              <div className="space-y-2">
                {!isScreen2 ? (
                  <>
                    <PalettePicker label="Rail Color:" selectedColor={ladderParams.railColor} onChange={color => onParamsChange({ ...params, Ladder: { ...ladderParams, railColor: color } })} palette={screen5PaletteForPicker} />
                    <PalettePicker label="Rung Color:" selectedColor={ladderParams.rungColor} onChange={color => onParamsChange({ ...params, Ladder: { ...ladderParams, rungColor: color } })} palette={screen5PaletteForPicker} />
                    <PalettePicker label="Background Color:" selectedColor={ladderParams.backgroundColor} onChange={color => onParamsChange({ ...params, Ladder: { ...ladderParams, backgroundColor: color } })} palette={screen5PaletteForPicker} />
                  </>
                ) : (
                  <p className="text-xs text-msx-textsecondary p-1 border border-dashed border-msx-border rounded">
                    Ladder texture uses <strong>Foreground</strong> for rails/rungs and <strong>Background</strong> for empty space, based on the tile's line color attributes.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div><label>Rail Width (px):</label><input type="number" min="1" max="2" value={ladderParams.railWidth} onChange={e => onParamsChange({ ...params, Ladder: { ...ladderParams, railWidth: parseInt(e.target.value) } })} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded" /></div>
                  <div><label>Rung Height (px):</label><input type="number" min="1" max="2" value={ladderParams.rungHeight} onChange={e => onParamsChange({ ...params, Ladder: { ...ladderParams, rungHeight: parseInt(e.target.value) } })} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded" /></div>
                </div>
                <div><label>Rung Spacing (px):</label><input type="number" min="1" max="8" value={ladderParams.rungSpacing} onChange={e => onParamsChange({ ...params, Ladder: { ...ladderParams, rungSpacing: parseInt(e.target.value) } })} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded" /></div>
                <div><label>Rail Inset (px):</label><input type="number" min="0" max="3" value={ladderParams.railInset} onChange={e => onParamsChange({ ...params, Ladder: { ...ladderParams, railInset: parseInt(e.target.value) } })} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded" /></div>
                <div><label>Rung Style:</label><div className="flex space-x-1 mt-0.5"><Button size="sm" variant={ladderParams.style === 'solid' ? 'secondary' : 'ghost'} onClick={() => onParamsChange({ ...params, Ladder: { ...ladderParams, style: 'solid' } })}>Solid</Button><Button size="sm" variant={ladderParams.style === 'dashed' ? 'secondary' : 'ghost'} onClick={() => onParamsChange({ ...params, Ladder: { ...ladderParams, style: 'dashed' } })}>Dashed</Button></div></div>
              </div>
            ) : generatorType === 'Ice' ? (
              <div className="space-y-2">
                {!isScreen2 ? (
                  <>
                    <PalettePicker label="Base Color:" selectedColor={iceParams.baseColor} onChange={color => onParamsChange({ ...params, Ice: { ...iceParams, baseColor: color } })} palette={screen5PaletteForPicker} />
                    <PalettePicker label="Crack Color:" selectedColor={iceParams.crackColor} onChange={color => onParamsChange({ ...params, Ice: { ...iceParams, crackColor: color } })} palette={screen5PaletteForPicker} />
                    <PalettePicker label="Shine Color:" selectedColor={iceParams.shineColor} onChange={color => onParamsChange({ ...params, Ice: { ...iceParams, shineColor: color } })} palette={screen5PaletteForPicker} />
                  </>
                ) : (
                  <p className="text-xs text-msx-textsecondary p-1 border border-dashed border-msx-border rounded">
                    Ice texture uses <strong>Background</strong> for base and <strong>Foreground</strong> for cracks/shine.
                  </p>
                )}
                <div><label>Crack Density ({(iceParams.crackDensity * 100).toFixed(0)}%):</label><input type="range" min="0" max="1" step="0.05" value={iceParams.crackDensity} onChange={e => onParamsChange({ ...params, Ice: { ...iceParams, crackDensity: parseFloat(e.target.value) } })} className="w-full" /></div>
              </div>
            ) : generatorType === 'Grass' ? (
              <div className="space-y-2">
                {!isScreen2 ? (
                  <>
                    <PalettePicker label="Base Grass Color:" selectedColor={grassParams.baseGrassColor} onChange={color => onParamsChange({ ...params, Grass: { ...grassParams, baseGrassColor: color } })} palette={screen5PaletteForPicker} />
                    <PalettePicker label="Shadow/Blade Color:" selectedColor={grassParams.shadowGrassColor} onChange={color => onParamsChange({ ...params, Grass: { ...grassParams, shadowGrassColor: color } })} palette={screen5PaletteForPicker} />
                    <PalettePicker label="Detail (Flower) Color:" selectedColor={grassParams.detailColor} onChange={color => onParamsChange({ ...params, Grass: { ...grassParams, detailColor: color } })} palette={screen5PaletteForPicker} />
                  </>
                ) : (
                  <p className="text-xs text-msx-textsecondary p-1 border border-dashed border-msx-border rounded">
                    Grass uses <strong>FG</strong> for base grass/details and <strong>BG</strong> for shadows/blades.
                  </p>
                )}
                <div><label>Flower Probability ({(grassParams.detailProbability * 100).toFixed(0)}%):</label><input type="range" min="0" max="1" step="0.05" value={grassParams.detailProbability} onChange={e => onParamsChange({ ...params, Grass: { ...grassParams, detailProbability: parseFloat(e.target.value) } })} className="w-full" /></div>
              </div>
            ) : generatorType === 'StylizedGrass' ? (
              <div className="space-y-2">
                {!isScreen2 ? (
                  <>
                    <PalettePicker label="Light Grass Color:" selectedColor={stylizedGrassParams.lightGrassColor} onChange={color => onParamsChange({ ...params, StylizedGrass: { ...stylizedGrassParams, lightGrassColor: color } })} palette={screen5PaletteForPicker} />
                    <PalettePicker label="Dark Grass Color:" selectedColor={stylizedGrassParams.darkGrassColor} onChange={color => onParamsChange({ ...params, StylizedGrass: { ...stylizedGrassParams, darkGrassColor: color } })} palette={screen5PaletteForPicker} />
                  </>
                ) : (
                  <p className="text-xs text-msx-textsecondary p-1 border border-dashed border-msx-border rounded">
                    Stylized grass uses <strong>FG</strong> for light blades and <strong>BG</strong> for the darker base.
                  </p>
                )}
                <div><label>Blade Density ({(stylizedGrassParams.bladeDensity * 100).toFixed(0)}%):</label><input type="range" min="0.1" max="1" step="0.05" value={stylizedGrassParams.bladeDensity} onChange={e => onParamsChange({ ...params, StylizedGrass: { ...stylizedGrassParams, bladeDensity: parseFloat(e.target.value) } })} className="w-full" /></div>
                <div>
                  <label>Blade Style:</label>
                  <select value={stylizedGrassParams.style} onChange={e => onParamsChange({ ...params, StylizedGrass: { ...stylizedGrassParams, style: e.target.value as any } })} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded">
                    <option value="wavy">Wavy</option>
                    <option value="straight">Straight</option>
                    <option value="random">Random</option>
                  </select>
                </div>
              </div>
            ) : generatorType === 'Frame' ? (
              <div className="space-y-2">
                {!isScreen2 ? (
                  <>
                    <PalettePicker label="Frame Color:" selectedColor={(params.Frame as FrameGeneratorParams).frameColor} onChange={color => onParamsChange({ ...params, Frame: { ...(params.Frame as FrameGeneratorParams), frameColor: color } })} palette={screen5PaletteForPicker} />
                    <PalettePicker label="Background Color:" selectedColor={(params.Frame as FrameGeneratorParams).backgroundColor} onChange={color => onParamsChange({ ...params, Frame: { ...(params.Frame as FrameGeneratorParams), backgroundColor: color } })} palette={screen5PaletteForPicker} />
                  </>
                ) : (
                  <p className="text-xs text-msx-textsecondary p-1 border border-dashed border-msx-border rounded">
                    Frame generator uses <strong>FG</strong> for the frame border and <strong>BG</strong> for the interior. Perfect for HUD elements like SCORE displays.
                  </p>
                )}
                <div>
                  <label>Thickness ({(params.Frame as FrameGeneratorParams).thickness}px):</label>
                  <input type="range" min="1" max="8" value={(params.Frame as FrameGeneratorParams).thickness} onChange={e => onParamsChange({ ...params, Frame: { ...(params.Frame as FrameGeneratorParams), thickness: parseInt(e.target.value) } })} className="w-full" />
                </div>
                <div>
                  <label>Frame Style:</label>
                  <select value={(params.Frame as FrameGeneratorParams).style} onChange={e => onParamsChange({ ...params, Frame: { ...(params.Frame as FrameGeneratorParams), style: e.target.value as 'simple' | 'double' | 'decorative' | 'braided' | 'chain' | 'carved' } })} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded">
                    <option value="simple">Simple</option>
                    <option value="double">Double Line</option>
                    <option value="decorative">Decorative</option>
                    <option value="braided">Braided</option>
                    <option value="chain">Chain</option>
                    <option value="carved">Carved (3D)</option>
                  </select>
                </div>
                <div>
                  <label>Corner Style:</label>
                  <select value={(params.Frame as FrameGeneratorParams).corners} onChange={e => onParamsChange({ ...params, Frame: { ...(params.Frame as FrameGeneratorParams), corners: e.target.value as 'square' | 'rounded' | 'fancy' } })} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded">
                    <option value="square">Square</option>
                    <option value="rounded">Rounded</option>
                    <option value="fancy">Fancy</option>
                  </select>
                </div>
                <p className="text-xs text-msx-textsecondary italic mt-2 p-2 bg-msx-bgcolor/50 rounded border border-msx-border">
                  💡 Tip: Create multiple frame tiles with different thicknesses to build complete SCORE borders.
                </p>
              </div>
            ) : ( // CellBars
              (() => { // IIFE to create a scope for dynamic values
                const drawableWidth = currentTile.width - (cellParams.hasOutline ? 2 : 0);
                const maxBarCount = Math.max(1, drawableWidth);
                const maxThicknessForCurrentBars = cellParams.barCount > 0 ? Math.floor(drawableWidth / cellParams.barCount) : 1;

                return (
                  <div className="space-y-2">
                    {!isScreen2 ? (
                      <>
                        <PalettePicker label="Bar Color:" selectedColor={cellParams.barColor} onChange={color => onParamsChange({ ...params, CellBars: { ...cellParams, barColor: color } })} palette={screen5PaletteForPicker} />
                        <PalettePicker label="Background Color:" selectedColor={cellParams.backgroundColor} onChange={color => onParamsChange({ ...params, CellBars: { ...cellParams, backgroundColor: color } })} palette={screen5PaletteForPicker} />
                      </>
                    ) : (
                      <p className="text-xs text-msx-textsecondary p-1 border border-dashed border-msx-border rounded">
                        Cell Bars texture uses <strong>Foreground</strong> for bars and <strong>Background</strong> for empty space, based on the tile's line color attributes.
                      </p>
                    )}
                    <div>
                      <label>Bar Count ({cellParams.barCount}):</label>
                      <input type="range" min="1" max={maxBarCount} step="1" value={cellParams.barCount}
                        onChange={e => {
                          const newCount = parseInt(e.target.value);
                          const newMaxThick = newCount > 0 ? Math.floor(drawableWidth / newCount) : 1;
                          const newThickness = Math.min(cellParams.barThickness, newMaxThick);
                          onParamsChange({ ...params, CellBars: { ...cellParams, barCount: newCount, barThickness: newThickness } });
                        }}
                        className="w-full" />
                    </div>
                    <div>
                      <label>Bar Thickness ({cellParams.barThickness}px):</label>
                      <input type="range" min="1" max={maxThicknessForCurrentBars} step="1" value={cellParams.barThickness}
                        onChange={e => onParamsChange({ ...params, CellBars: { ...cellParams, barThickness: parseInt(e.target.value) } })}
                        className="w-full"
                        disabled={cellParams.barCount === 0 || maxThicknessForCurrentBars <= 1}
                      />
                    </div>
                    <label className="flex items-center space-x-2 text-msx-textsecondary cursor-pointer pt-1">
                      <input type="checkbox" checked={cellParams.hasOutline}
                        onChange={e => {
                          const newHasOutline = e.target.checked;
                          const newDrawableWidth = currentTile.width - (newHasOutline ? 2 : 0);
                          const newBarCount = Math.min(cellParams.barCount, newDrawableWidth);
                          const newMaxThickness = newBarCount > 0 ? Math.floor(newDrawableWidth / newBarCount) : 1;
                          const newThickness = Math.min(cellParams.barThickness, newMaxThickness);
                          onParamsChange({ ...params, CellBars: { ...cellParams, hasOutline: newHasOutline, barCount: newBarCount, barThickness: newThickness } })
                        }}
                        className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent" />
                      <span>Add 1px Outline</span>
                    </label>
                  </div>
                );
              })()
            )}
          </div>
          {/* Right: Preview */}
          <div className="w-1/2 flex flex-col items-center">
            <h4 className="text-sm text-msx-cyan mb-1">Live Preview</h4>
            <canvas ref={previewCanvasRef} width={PREVIEW_SIZE} height={PREVIEW_SIZE} className="border border-msx-border" style={{ imageRendering: 'pixelated' }} />
          </div>
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <Button onClick={onClose} variant="ghost">Cancel</Button>
          <Button onClick={handleGenerateClick} variant="primary">Generate & Apply</Button>
        </div>
      </div>
    </div>
  );
};


/**
 * Props for the {@link TileEditor} component.
 * @category Editors
 */
interface TileEditorProps {
  /** The tile asset currently being edited. */
  currentTile: Tile;
  /** Callback to update the current tile asset. */
  onUpdateCurrentTile: (data: Partial<Tile>, newAssetsToCreate?: ProjectAsset[]) => void;
  /** A list of all tile assets in the project. */
  allTileAssets: ProjectAsset[];
  /** Callback to update the entire list of tile assets. */
  onUpdateAllTileAssets: (newTiles: ProjectAsset[]) => void;
  /** The currently selected color from the palette. */
  selectedColor: MSXColorValue;
  /** The current screen mode, which affects editing behavior. */
  currentScreenMode: string;
  /** The data format for ASM output. */
  dataOutputFormat: DataFormat;
  /** The tile data currently in the copy buffer. */
  copiedTileData: CopiedTileBuffer | null;
  /** Callback to copy the current tile's data to the buffer. */
  onCopyTileData: (tile: Tile) => void;
  /** Callback to set a message in the status bar. */
  setStatusBarMessage: (message: string) => void;
  /** The current zoom level of the pixel grid. */
  zoom: number;
  /** Callback to set the zoom level. */
  setZoom: (zoom: number) => void;
  /** Callback to update the global palette selection (used for MSX2 custom palettes). */
  onSelectGlobalColor: (color: MSXColorValue) => void;
}

const defaultLogicalProps: TileLogicalProperties = {
  mapId: 0, familyId: 0, instanceId: 0,
  isSolid: false, isBreakable: false, isMovable: false, causesDamage: false, isInteractiveSwitch: false,
  isInteractable: false, interactionType: 'none', interactionValue: 1, interactionTarget: '',
};

type LogicalEditScope = 'tile' | 'char';

const getTileCharKey = (charX: number, charY: number): string => `${charX},${charY}`;

const cloneLogicalProperties = (props?: TileLogicalProperties | null): TileLogicalProperties => ({
  ...(props || defaultLogicalProps),
});

const logicalPropertiesEqual = (a?: TileLogicalProperties | null, b?: TileLogicalProperties | null): boolean => (
  JSON.stringify(a || defaultLogicalProps) === JSON.stringify(b || defaultLogicalProps)
);

const trimCharLogicalPropertiesForDimensions = (
  charLogicalProperties: Record<string, TileLogicalProperties> | undefined,
  width: number,
  height: number
): Record<string, TileLogicalProperties> | undefined => {
  if (!charLogicalProperties) return undefined;
  const cols = Math.max(1, Math.ceil(width / EDITOR_BASE_TILE_DIM_S2));
  const rows = Math.max(1, Math.ceil(height / EDITOR_BASE_TILE_DIM_S2));
  const next: Record<string, TileLogicalProperties> = {};

  Object.entries(charLogicalProperties).forEach(([key, value]) => {
    const [x, y] = key.split(',').map(Number);
    if (Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < cols && y < rows) {
      next[key] = cloneLogicalProperties(value);
    }
  });

  return Object.keys(next).length > 0 ? next : undefined;
};

const DEFAULT_TILE_ANIMATION_SPEED = 8;

const clampInt = (value: number, min: number, max: number, fallback: number): number => {
  if (!Number.isFinite(value)) return fallback;
  if (value < min) return min;
  if (value > max) return max;
  return Math.floor(value);
};

interface ResolvedTileAnimationMeta {
  enabled: boolean;
  mode: TileAnimationMode;
  groupId: string;
  baseTileId: string;
  frameIndex: number;
  speed: number;
  transformEffect: TileTransformEffect;
  transformCheckpoints: number;
  transformIncludeColors: boolean;
}

const normalizeAnimationGroupId = (value: string): string => value.trim().toLowerCase();

const TRANSFORM_EFFECT_OPTIONS: Array<{ value: TileTransformEffect; label: string; description: string; }> = [
  { value: 'rotate_left', label: 'Rotate Left (RLCA)', description: 'Rota bits a la izquierda en cada fila.' },
  { value: 'rotate_right', label: 'Rotate Right (RRCA)', description: 'Rota bits a la derecha en cada fila.' },
  { value: 'shift_left', label: 'Shift Left (SLA)', description: 'Desplaza bits a izquierda, entra 0 por la derecha.' },
  { value: 'shift_right', label: 'Shift Right (SRL)', description: 'Desplaza bits a derecha, entra 0 por la izquierda.' },
  { value: 'shift_up', label: 'Shift Up (rows)', description: 'Mueve filas hacia arriba y hace wrap.' },
  { value: 'shift_down', label: 'Shift Down (rows)', description: 'Mueve filas hacia abajo y hace wrap.' },
  { value: 'swap_top_bottom', label: 'Swap Top/Bottom', description: 'Intercambia fila superior e inferior.' },
];

const DEFAULT_TRANSFORM_EFFECT: TileTransformEffect = 'rotate_left';
const DEFAULT_TRANSFORM_CHECKPOINTS = 8;

const buildDefaultAnimationGroupId = (tile: Tile): string => {
  const fromName = (tile.name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (fromName) return fromName;
  return `anim_${(tile.id || 'tile').toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
};

const resolveTileAnimationSettings = (tile: Tile): ResolvedTileAnimationMeta => {
  const raw = (tile.animation || {}) as TileAnimationSettings;
  const enabled = typeof tile.isAnimated === 'boolean'
    ? tile.isAnimated
    : (typeof raw.enabled === 'boolean' ? raw.enabled : false);

  const groupId = typeof tile.animationGroup === 'string'
    ? tile.animationGroup
    : (typeof raw.groupId === 'string' ? raw.groupId : '');

  const baseTileId = typeof tile.animationBaseTileId === 'string'
    ? tile.animationBaseTileId
    : (typeof raw.baseTileId === 'string' ? raw.baseTileId : '');

  const frameIndexRaw = typeof tile.animationFrameIndex === 'number'
    ? tile.animationFrameIndex
    : (typeof raw.frameIndex === 'number' ? raw.frameIndex : 0);
  const speedRaw = typeof tile.animationSpeed === 'number'
    ? tile.animationSpeed
    : (typeof raw.speed === 'number' ? raw.speed : DEFAULT_TILE_ANIMATION_SPEED);

  const modeRaw = tile.animationMode ?? raw.mode;
  const mode: TileAnimationMode = modeRaw === 'transform' ? 'transform' : 'frames';
  const transform = (raw.transform || {}) as any;
  const transformEffectRaw = tile.animationTransformEffect ?? transform.effect ?? DEFAULT_TRANSFORM_EFFECT;
  const transformEffect: TileTransformEffect =
    TRANSFORM_EFFECT_OPTIONS.some(option => option.value === transformEffectRaw)
      ? transformEffectRaw as TileTransformEffect
      : DEFAULT_TRANSFORM_EFFECT;
  const checkpointsRaw = tile.animationTransformCheckpoints ?? transform.checkpoints ?? DEFAULT_TRANSFORM_CHECKPOINTS;
  const includeColorsRaw = tile.animationTransformIncludeColors ?? transform.includeColors;

  return {
    enabled,
    mode,
    groupId: (groupId || '').trim(),
    baseTileId: (baseTileId || '').trim(),
    frameIndex: clampInt(frameIndexRaw, 0, 255, 0),
    speed: clampInt(speedRaw, 1, 255, DEFAULT_TILE_ANIMATION_SPEED),
    transformEffect,
    transformCheckpoints: clampInt(Number(checkpointsRaw), 1, 255, DEFAULT_TRANSFORM_CHECKPOINTS),
    transformIncludeColors: typeof includeColorsRaw === 'boolean' ? includeColorsRaw : true,
  };
};

const clonePixelData = (pixels: PixelData): PixelData => pixels.map(row => [...row]);

const cloneLineAttributes = (attrs?: LineColorAttribute[][]): LineColorAttribute[][] | undefined => {
  if (!attrs) return undefined;
  return attrs.map(row => row.map(segment => ({ ...segment })));
};

const shiftRow = <T,>(row: T[], amount: number, wrap: boolean): T[] => {
  const width = row.length;
  if (width <= 0) return [];
  const result = new Array<T>(width);
  const delta = ((amount % width) + width) % width;
  for (let x = 0; x < width; x++) {
    const src = x - delta;
    if (wrap) {
      const wrapped = ((src % width) + width) % width;
      result[x] = row[wrapped];
    } else if (src >= 0 && src < width) {
      result[x] = row[src];
    } else {
      result[x] = row[0];
    }
  }
  return result;
};

const shiftRows = <T,>(rows: T[][], amount: number, wrap: boolean): T[][] => {
  const height = rows.length;
  if (height <= 0) return [];
  const result = new Array<T[]>(height);
  const delta = ((amount % height) + height) % height;
  for (let y = 0; y < height; y++) {
    const src = y - delta;
    if (wrap) {
      const wrapped = ((src % height) + height) % height;
      result[y] = [...rows[wrapped]];
    } else if (src >= 0 && src < height) {
      result[y] = [...rows[src]];
    } else {
      result[y] = [...rows[0]];
    }
  }
  return result;
};

const applyTileTransformOnce = (sourceTile: Tile, effect: TileTransformEffect): Tile => {
  const width = sourceTile.width;
  const height = sourceTile.height;
  const sourceData = clonePixelData(sourceTile.data);
  let data = clonePixelData(sourceData);
  const getRowFillColor = (rowIndex: number): MSXColorValue => {
    return sourceTile.lineAttributes?.[rowIndex]?.[0]?.bg ?? 'rgba(0,0,0,0)';
  };

  if (effect === 'rotate_left') {
    data = sourceData.map(row => shiftRow(row, -1, true));
  } else if (effect === 'rotate_right') {
    data = sourceData.map(row => shiftRow(row, 1, true));
  } else if (effect === 'shift_left') {
    data = sourceData.map((row, rowIndex) => {
      const out = shiftRow(row, -1, false);
      if (out.length > 0) out[out.length - 1] = getRowFillColor(rowIndex);
      return out;
    });
  } else if (effect === 'shift_right') {
    data = sourceData.map((row, rowIndex) => {
      const out = shiftRow(row, 1, false);
      if (out.length > 0) out[0] = getRowFillColor(rowIndex);
      return out;
    });
  } else if (effect === 'shift_up') {
    data = shiftRows(sourceData, -1, true);
  } else if (effect === 'shift_down') {
    data = shiftRows(sourceData, 1, true);
  } else if (effect === 'swap_top_bottom') {
    data = clonePixelData(sourceData);
    if (height > 1) {
      const top = [...sourceData[0]];
      const bottom = [...sourceData[height - 1]];
      data[0] = bottom;
      data[height - 1] = top;
    }
  }

  return {
    ...sourceTile,
    width,
    height,
    data
  };
};

const applyTileTransformSteps = (sourceTile: Tile, effect: TileTransformEffect, steps: number): Tile => {
  const count = Math.max(0, Math.floor(steps));
  let current = {
    ...sourceTile,
    data: clonePixelData(sourceTile.data)
  };
  for (let i = 0; i < count; i++) {
    current = applyTileTransformOnce(current, effect);
  }
  return current;
};

/**
 * The main editor component for creating and modifying tile assets.
 * @param props The component props.
 * @returns A React component.
 * @category Editors
 */
export const TileEditor: React.FC<TileEditorProps> = ({
  currentTile: tile, onUpdateCurrentTile: onUpdate,
  allTileAssets, onUpdateAllTileAssets,
  selectedColor, currentScreenMode,
  dataOutputFormat, copiedTileData, onCopyTileData, setStatusBarMessage,
  zoom, setZoom, onSelectGlobalColor
}) => {
  const [showCenterGuide, setShowCenterGuide] = useState(true);
  const [showGrid8x8, setShowGrid8x8] = useState(false);
  const [logicalEditScope, setLogicalEditScope] = useState<LogicalEditScope>('tile');
  const [selectedLogicalChar, setSelectedLogicalChar] = useState<Point>({ x: 0, y: 0 });
  const [selectedLogicalChars, setSelectedLogicalChars] = useState<Point[]>([{ x: 0, y: 0 }]);
  const [copiedAttribute, setCopiedAttribute] = useState<LineColorAttribute | null>(null);
  const [symmetrySettings, setSymmetrySettings] = useState<SymmetrySettings>({
    horizontal: false,
    vertical: false,
    diagonalMain: false,
    diagonalAnti: false,
    quadMirror: false,
  });
  const [currentTool, setCurrentTool] = useState<DrawingTool>('pencil');
  const [ditherBrushDiameter, setDitherBrushDiameter] = useState<DitherBrushDiameter>(3);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [selectedSolidityFamilyId, setSelectedSolidityFamilyId] = useState<SolidityTypeId>(0);
  const [flagStates, setFlagStates] = useState<Record<PropertyFlagKey, boolean>>({
    isBreakable: false, isMovable: false, causesDamage: false, isInteractiveSwitch: false,
  });
  const [selectedInteractionType, setSelectedInteractionType] = useState<TileInteractionType>('none');
  const [interactionValue, setInteractionValue] = useState<number>(1);
  const [interactionTarget, setInteractionTarget] = useState<string>('');
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [isAnimationPreviewPlaying, setIsAnimationPreviewPlaying] = useState(true);
  const [animationPreviewFrameIndex, setAnimationPreviewFrameIndex] = useState(0);
  const [animationTransformCheckpoint, setAnimationTransformCheckpoint] = useState(0);
  const [splitWidth, setSplitWidth] = useState(8);
  const [splitHeight, setSplitHeight] = useState(8);

  // Collapsible left-column sections
  const [leftPanelOpen, setLeftPanelOpen] = useState<Record<string, boolean>>({
    properties: true,
    logical: false,
    animation: true,
    technical: false,
  });
  const toggleLeftPanel = (key: string) =>
    setLeftPanelOpen(prev => ({ ...prev, [key]: !prev[key] }));

  const isScreen2 = currentScreenMode === "SCREEN 2 (Graphics I)";
  const tileCharColumns = Math.max(1, Math.ceil(tile.width / EDITOR_BASE_TILE_DIM_S2));
  const tileCharRows = Math.max(1, Math.ceil(tile.height / EDITOR_BASE_TILE_DIM_S2));
  const tileCharTotal = tileCharColumns * tileCharRows;
  const selectedLogicalCharKey = getTileCharKey(selectedLogicalChar.x, selectedLogicalChar.y);
  const selectedLogicalCharKeys = useMemo(() => {
    const keys = new Set<string>();
    selectedLogicalChars.forEach(({ x, y }) => {
      if (x >= 0 && y >= 0 && x < tileCharColumns && y < tileCharRows) {
        keys.add(getTileCharKey(x, y));
      }
    });
    if (keys.size === 0) keys.add(selectedLogicalCharKey);
    return Array.from(keys);
  }, [selectedLogicalChars, selectedLogicalCharKey, tileCharColumns, tileCharRows]);
  const selectedLogicalCharCells = useMemo(
    () => selectedLogicalCharKeys.map(key => {
      const [x, y] = key.split(',').map(Number);
      return { x, y };
    }),
    [selectedLogicalCharKeys]
  );
  const selectedGroupHasOverride = useMemo(
    () => selectedLogicalCharKeys.some(key => !!tile.charLogicalProperties?.[key]),
    [selectedLogicalCharKeys, tile.charLogicalProperties]
  );
  const selectedCharLogicalOverride = tile.charLogicalProperties?.[selectedLogicalCharKey];
  const activeLogicalProperties = useMemo(
    () => logicalEditScope === 'char'
      ? cloneLogicalProperties(selectedCharLogicalOverride || tile.logicalProperties)
      : cloneLogicalProperties(tile.logicalProperties),
    [logicalEditScope, selectedCharLogicalOverride, tile.logicalProperties]
  );
  const charOverrideCount = useMemo(
    () => Object.keys(trimCharLogicalPropertiesForDimensions(tile.charLogicalProperties, tile.width, tile.height) || {}).length,
    [tile.charLogicalProperties, tile.width, tile.height]
  );
  const splitWidthOptions = useMemo(
    () => EDITABLE_TILE_DIMENSIONS.filter(d => d <= tile.width && tile.width % d === 0),
    [tile.width]
  );
  const splitHeightOptions = useMemo(
    () => EDITABLE_TILE_DIMENSIONS.filter(d => d <= tile.height && tile.height % d === 0),
    [tile.height]
  );
  const { slots: screen5PaletteSlots, changed: screen5PaletteChanged } = useMemo(() => ensureScreen5PaletteSlots(tile.screen5Palette), [tile.screen5Palette]);
  const screen5PaletteForPicker = useMemo(() => screen5SlotsToMsxColors(screen5PaletteSlots), [screen5PaletteSlots]);
  const [activeScreen5PaletteSlot, setActiveScreen5PaletteSlot] = useState(1);

  useEffect(() => {
    if (!splitWidthOptions.includes(splitWidth)) {
      setSplitWidth(splitWidthOptions[0] ?? 8);
    }
  }, [splitWidth, splitWidthOptions]);

  useEffect(() => {
    if (!splitHeightOptions.includes(splitHeight)) {
      setSplitHeight(splitHeightOptions[0] ?? 8);
    }
  }, [splitHeight, splitHeightOptions]);

  useEffect(() => {
    setSelectedLogicalChar(prev => ({
      x: Math.min(prev.x, tileCharColumns - 1),
      y: Math.min(prev.y, tileCharRows - 1),
    }));
    setSelectedLogicalChars(current => {
      const bounded = current
        .map(cell => ({
          x: Math.min(cell.x, tileCharColumns - 1),
          y: Math.min(cell.y, tileCharRows - 1),
        }))
        .filter((cell, index, cells) =>
          cells.findIndex(other => other.x === cell.x && other.y === cell.y) === index
        );
      return bounded.length > 0 ? bounded : [{ x: 0, y: 0 }];
    });
  }, [tileCharColumns, tileCharRows]);

  useEffect(() => {
    if (!isScreen2 && screen5PaletteChanged) {
      onUpdate({ screen5Palette: screen5PaletteSlots });
    }
  }, [isScreen2, screen5PaletteChanged, screen5PaletteSlots, onUpdate]);

  useEffect(() => {
    if (isScreen2) {
      setActiveScreen5PaletteSlot(1);
      return;
    }
    if (activeScreen5PaletteSlot <= 0 || activeScreen5PaletteSlot >= screen5PaletteSlots.length) {
      setActiveScreen5PaletteSlot(1);
    }
  }, [isScreen2, activeScreen5PaletteSlot, screen5PaletteSlots.length]);

  const getScreen5Color = useCallback((slotIndex: number, fallbackSlotIndex = 1) => {
    const fallbackHex = MSX_SCREEN5_PALETTE[fallbackSlotIndex]?.hex ?? '#000000';
    return getScreen5PaletteColor(screen5PaletteSlots, slotIndex, fallbackHex);
  }, [screen5PaletteSlots]);

  const getEffectiveSelectedColor = useCallback((color: MSXColorValue) => {
    if (isScreen2) return color;
    const exists = screen5PaletteSlots.some(slot => slot.hex === color);
    if (exists) return color;
    return getScreen5Color(Math.max(1, activeScreen5PaletteSlot));
  }, [isScreen2, screen5PaletteSlots, getScreen5Color, activeScreen5PaletteSlot]);

  const handleSelectScreen5PaletteSlot = useCallback((slotIndex: number) => {
    if (isScreen2) return;
    setActiveScreen5PaletteSlot(slotIndex);
    const slotColor = screen5PaletteSlots[slotIndex]?.hex;
    if (slotColor && onSelectGlobalColor) {
      onSelectGlobalColor(slotColor);
    }
  }, [isScreen2, screen5PaletteSlots, onSelectGlobalColor]);

  const [generatorParams, setGeneratorParams] = useState<AllGeneratorParams>(() => ({
    Rock: {
      baseColor: isScreen2 ? MSX1_PALETTE[14].hex : getScreen5Color(14, 14),
      highlightColor: isScreen2 ? MSX1_PALETTE[15].hex : getScreen5Color(15, 15),
      shadowColor: isScreen2 ? MSX1_PALETTE[1].hex : getScreen5Color(1, 1),
      density: 50,
      seamless: true,
    },
    Brick: {
      brickColor: isScreen2 ? MSX1_PALETTE[6].hex : getScreen5Color(6, 6),
      mortarColor: isScreen2 ? MSX1_PALETTE[14].hex : getScreen5Color(14, 14),
      brickWidth: 8,
      brickHeight: 4,
      mortarThickness: 1,
      rowOffset: 0.5,
      edgeVariation: 10,
    },
    Ladder: {
      railColor: isScreen2 ? MSX1_PALETTE[10].hex : getScreen5Color(10, 10),
      rungColor: isScreen2 ? MSX1_PALETTE[10].hex : getScreen5Color(10, 10),
      backgroundColor: 'transparent',
      railWidth: 1,
      rungHeight: 1,
      rungSpacing: 3,
      railInset: 1,
      style: 'solid',
    },
    CellBars: {
      barColor: isScreen2 ? MSX1_PALETTE[15].hex : getScreen5Color(15, 15),
      backgroundColor: isScreen2 ? MSX1_PALETTE[0].hex : 'transparent',
      barCount: 3,
      barThickness: 1,
      hasOutline: true,
    },
    Ice: {
      baseColor: isScreen2 ? MSX1_PALETTE[5].hex : getScreen5Color(5, 5),
      crackColor: isScreen2 ? MSX1_PALETTE[7].hex : getScreen5Color(7, 7),
      shineColor: isScreen2 ? MSX1_PALETTE[15].hex : getScreen5Color(15, 15),
      crackDensity: 0.4,
    },
    Grass: {
      baseGrassColor: isScreen2 ? MSX1_PALETTE[3].hex : getScreen5Color(3, 3),
      shadowGrassColor: isScreen2 ? MSX1_PALETTE[12].hex : getScreen5Color(12, 12),
      detailColor: isScreen2 ? MSX1_PALETTE[9].hex : getScreen5Color(9, 9),
      detailProbability: 0.15,
    },
    StylizedGrass: {
      lightGrassColor: isScreen2 ? MSX1_PALETTE[2].hex : getScreen5Color(2, 2),
      darkGrassColor: isScreen2 ? MSX1_PALETTE[12].hex : getScreen5Color(12, 12),
      bladeDensity: 0.6,
      style: 'wavy',
    },
    Frame: {
      frameColor: isScreen2 ? MSX1_PALETTE[15].hex : getScreen5Color(15, 15),
      backgroundColor: isScreen2 ? MSX1_PALETTE[0].hex : getScreen5Color(0, 0),
      thickness: 2,
      style: 'simple',
      corners: 'square',
    }
  }));


  useEffect(() => {
    const props = activeLogicalProperties || defaultLogicalProps;
    const mapId = props.mapId ?? 0;

    const familyId = (mapId >> 4) & 0x0F;
    const instanceId = mapId & 0x0F;

    setSelectedSolidityFamilyId(familyId as SolidityTypeId);

    const newFlagStates: Record<PropertyFlagKey, boolean> = {} as any;
    for (const key in PROPERTY_FLAGS) {
      const flagKey = key as PropertyFlagKey;
      newFlagStates[flagKey] = (instanceId & (1 << PROPERTY_FLAGS[flagKey].bit)) !== 0;
    }
    setFlagStates(newFlagStates);

    const interactableFlag = newFlagStates.isInteractiveSwitch || props.isInteractable === true;
    const interactionType = props.interactionType && props.interactionType !== 'none'
      ? props.interactionType
      : interactableFlag
        ? 'collect_gem'
        : 'none';
    setSelectedInteractionType(interactionType);
    setInteractionValue(clampInt(Number(props.interactionValue ?? 1), 0, 255, 1));
    setInteractionTarget(typeof props.interactionTarget === 'string' ? props.interactionTarget : '');
  }, [activeLogicalProperties]);


  useEffect(() => {
    if (currentScreenMode === "SCREEN 2 (Graphics I)" && tile.width % SCREEN2_PIXELS_PER_COLOR_SEGMENT !== 0) {
      const newWidth = Math.max(SCREEN2_PIXELS_PER_COLOR_SEGMENT, Math.floor(tile.width / SCREEN2_PIXELS_PER_COLOR_SEGMENT) * SCREEN2_PIXELS_PER_COLOR_SEGMENT);
      if (newWidth !== tile.width) {
        console.warn(`Tile width ${tile.width} not multiple of ${SCREEN2_PIXELS_PER_COLOR_SEGMENT} for SCREEN 2. Adjusting to ${newWidth}.`);
        handleDimensionChange(newWidth, tile.height);
      }
    }
  }, [tile.width, currentScreenMode, tile.height]);

  const tileAnimation = useMemo(() => resolveTileAnimationSettings(tile), [
    tile.animation,
    tile.isAnimated,
    tile.animationGroup,
    tile.animationFrameIndex,
    tile.animationSpeed,
    tile.animationBaseTileId,
    tile.animationMode,
    tile.animationTransformEffect,
    tile.animationTransformCheckpoints,
    tile.animationTransformIncludeColors
  ]);

  const availableAnimationTiles = useMemo(() => {
    return allTileAssets
      .filter(asset => asset.type === 'tile' && asset.data)
      .map(asset => asset.data as Tile);
  }, [allTileAssets]);

  const animationGroupIdNormalized = useMemo(
    () => normalizeAnimationGroupId(tileAnimation.groupId),
    [tileAnimation.groupId]
  );

  const animationFrames = useMemo(() => {
    if (tileAnimation.mode === 'transform') return [];
    if (!animationGroupIdNormalized) return [];

    return availableAnimationTiles
      .map(candidate => ({ tile: candidate, meta: resolveTileAnimationSettings(candidate) }))
      .filter(entry => normalizeAnimationGroupId(entry.meta.groupId) === animationGroupIdNormalized)
      .sort((a, b) => {
        if (a.meta.frameIndex !== b.meta.frameIndex) return a.meta.frameIndex - b.meta.frameIndex;
        return a.tile.name.localeCompare(b.tile.name);
      });
  }, [availableAnimationTiles, animationGroupIdNormalized, tileAnimation.mode]);

  const animationPreviewMs = useMemo(() => {
    const speedFrames = clampInt(tileAnimation.speed, 1, 255, DEFAULT_TILE_ANIMATION_SPEED);
    return Math.max(40, Math.round((speedFrames * 1000) / 60));
  }, [tileAnimation.speed]);

  const transformPreviewTile = useMemo(() => {
    if (tileAnimation.mode !== 'transform') return tile;
    return applyTileTransformSteps(tile, tileAnimation.transformEffect, animationTransformCheckpoint);
  }, [tileAnimation.mode, tileAnimation.transformEffect, animationTransformCheckpoint, tile]);

  const transformPreviewEntry = useMemo(() => ({
    tile: transformPreviewTile,
    meta: {
      ...tileAnimation,
      frameIndex: animationTransformCheckpoint
    }
  }), [transformPreviewTile, tileAnimation, animationTransformCheckpoint]);

  const animationPreviewFrames = useMemo(() => {
    if (tileAnimation.mode === 'transform') {
      return [transformPreviewEntry];
    }
    if (animationFrames.length > 0) return animationFrames;
    return [{ tile, meta: tileAnimation }];
  }, [tileAnimation.mode, transformPreviewEntry, animationFrames, tile, tileAnimation]);

  const updateTileAnimation = useCallback((patch: Partial<TileAnimationSettings>) => {
    const nextEnabled = typeof patch.enabled === 'boolean' ? patch.enabled : tileAnimation.enabled;
    const nextMode = patch.mode === 'transform' ? 'transform' : (patch.mode === 'frames' ? 'frames' : tileAnimation.mode);
    const nextGroupId = typeof patch.groupId === 'string' ? patch.groupId : tileAnimation.groupId;
    const nextBaseTileId = typeof patch.baseTileId === 'string' ? patch.baseTileId : tileAnimation.baseTileId;
    const nextFrameIndex = clampInt(
      typeof patch.frameIndex === 'number' ? patch.frameIndex : tileAnimation.frameIndex || 0,
      0,
      255,
      0
    );
    const nextSpeed = clampInt(
      typeof patch.speed === 'number' ? patch.speed : tileAnimation.speed || DEFAULT_TILE_ANIMATION_SPEED,
      1,
      255,
      DEFAULT_TILE_ANIMATION_SPEED
    );
    const patchTransform = (patch.transform || {}) as any;
    const currentTransform = {
      effect: tileAnimation.transformEffect,
      checkpoints: tileAnimation.transformCheckpoints,
      includeColors: tileAnimation.transformIncludeColors,
    };
    const nextTransformEffectRaw = patchTransform.effect ?? tileAnimation.transformEffect;
    const nextTransformEffect: TileTransformEffect =
      TRANSFORM_EFFECT_OPTIONS.some(option => option.value === nextTransformEffectRaw)
        ? nextTransformEffectRaw as TileTransformEffect
        : DEFAULT_TRANSFORM_EFFECT;
    const nextTransformCheckpoints = clampInt(
      Number(patchTransform.checkpoints ?? tileAnimation.transformCheckpoints),
      1,
      255,
      DEFAULT_TRANSFORM_CHECKPOINTS
    );
    const nextTransformIncludeColors = typeof patchTransform.includeColors === 'boolean'
      ? patchTransform.includeColors
      : tileAnimation.transformIncludeColors;

    onUpdate({
      isAnimated: nextEnabled,
      animationGroup: (nextGroupId || '').trim(),
      animationFrameIndex: nextFrameIndex,
      animationSpeed: nextSpeed,
      animationBaseTileId: (nextBaseTileId || '').trim(),
      animationMode: nextMode,
      animationTransformEffect: nextTransformEffect,
      animationTransformCheckpoints: nextTransformCheckpoints,
      animationTransformIncludeColors: nextTransformIncludeColors,
      animation: {
        enabled: nextEnabled,
        mode: nextMode,
        groupId: (nextGroupId || '').trim(),
        frameIndex: nextFrameIndex,
        speed: nextSpeed,
        baseTileId: (nextBaseTileId || '').trim(),
        transform: {
          ...currentTransform,
          ...patchTransform,
          effect: nextTransformEffect,
          checkpoints: nextTransformCheckpoints,
          includeColors: nextTransformIncludeColors,
        }
      }
    });
  }, [onUpdate, tileAnimation]);

  useEffect(() => {
    setAnimationPreviewFrameIndex(0);
    setAnimationTransformCheckpoint(0);
  }, [
    tile.id,
    tileAnimation.mode,
    tileAnimation.groupId,
    tileAnimation.frameIndex,
    tileAnimation.transformEffect,
    tileAnimation.transformCheckpoints,
    animationFrames.length,
  ]);

  useEffect(() => {
    if (!isAnimationPreviewPlaying) return;

    if (tileAnimation.mode === 'transform') {
      const intervalId = window.setInterval(() => {
        setAnimationTransformCheckpoint(prev => (prev + 1) % Math.max(1, tileAnimation.transformCheckpoints));
      }, animationPreviewMs);
      return () => window.clearInterval(intervalId);
    }

    if (animationPreviewFrames.length <= 1) return;
    const intervalId = window.setInterval(() => {
      setAnimationPreviewFrameIndex(prev => (prev + 1) % animationPreviewFrames.length);
    }, animationPreviewMs);
    return () => window.clearInterval(intervalId);
  }, [
    isAnimationPreviewPlaying,
    tileAnimation.mode,
    tileAnimation.transformCheckpoints,
    animationPreviewFrames.length,
    animationPreviewMs
  ]);

  const handleCreateNextAnimationFrame = useCallback(() => {
    const groupId = tileAnimation.groupId.trim() || buildDefaultAnimationGroupId(tile);
    const normalizedGroupId = normalizeAnimationGroupId(groupId);
    const groupEntries = availableAnimationTiles
      .map(candidate => ({ tile: candidate, meta: resolveTileAnimationSettings(candidate) }))
      .filter(entry => normalizeAnimationGroupId(entry.meta.groupId) === normalizedGroupId);

    const maxFrameIndex = groupEntries.reduce((max, entry) => Math.max(max, entry.meta.frameIndex), -1);
    const nextFrameIndex = clampInt(maxFrameIndex + 1, 0, 255, 0);

    const explicitBase = tileAnimation.baseTileId.trim();
    const inferredBase = groupEntries.find(entry => entry.meta.baseTileId.trim())?.meta.baseTileId.trim() || tile.id;
    const baseTileId = explicitBase || inferredBase;
    const speed = clampInt(tileAnimation.speed, 1, 255, DEFAULT_TILE_ANIMATION_SPEED);

    const currentFrameIndex = tileAnimation.groupId.trim()
      ? clampInt(tileAnimation.frameIndex, 0, 255, 0)
      : 0;

    const newTileId = `tile_anim_${tile.id}_${nextFrameIndex}_${Date.now()}`;
    const newTileName = `${tile.name}_f${nextFrameIndex}`;

    const newTile: Tile = {
      ...tile,
      id: newTileId,
      name: newTileName,
      data: clonePixelData(tile.data),
      lineAttributes: cloneLineAttributes(tile.lineAttributes),
      logicalProperties: tile.logicalProperties ? { ...tile.logicalProperties } : { ...defaultLogicalProps },
      charLogicalProperties: tile.charLogicalProperties
        ? Object.fromEntries(Object.entries(tile.charLogicalProperties).map(([key, value]) => [key, cloneLogicalProperties(value)]))
        : undefined,
      screen5Palette: isScreen2
        ? undefined
        : (tile.screen5Palette?.map(slot => ({ ...slot })) ?? screen5PaletteSlots.map(slot => ({ ...slot }))),
      isAnimated: true,
      animationMode: 'frames',
      animationGroup: groupId,
      animationFrameIndex: nextFrameIndex,
      animationSpeed: speed,
      animationBaseTileId: baseTileId,
      animationTransformEffect: tileAnimation.transformEffect,
      animationTransformCheckpoints: tileAnimation.transformCheckpoints,
      animationTransformIncludeColors: tileAnimation.transformIncludeColors,
      animation: {
        enabled: true,
        mode: 'frames',
        groupId,
        frameIndex: nextFrameIndex,
        speed,
        baseTileId,
        transform: {
          effect: tileAnimation.transformEffect,
          checkpoints: tileAnimation.transformCheckpoints,
          includeColors: tileAnimation.transformIncludeColors,
        }
      }
    };

    onUpdate({
      isAnimated: true,
      animationMode: 'frames',
      animationGroup: groupId,
      animationFrameIndex: currentFrameIndex,
      animationSpeed: speed,
      animationBaseTileId: baseTileId,
      animationTransformEffect: tileAnimation.transformEffect,
      animationTransformCheckpoints: tileAnimation.transformCheckpoints,
      animationTransformIncludeColors: tileAnimation.transformIncludeColors,
      animation: {
        enabled: true,
        mode: 'frames',
        groupId,
        frameIndex: currentFrameIndex,
        speed,
        baseTileId,
        transform: {
          effect: tileAnimation.transformEffect,
          checkpoints: tileAnimation.transformCheckpoints,
          includeColors: tileAnimation.transformIncludeColors,
        }
      }
    }, [
      {
        id: newTileId,
        name: newTileName,
        type: 'tile',
        data: newTile
      }
    ]);

    setStatusBarMessage(`Created animation frame "${newTileName}" (group: ${groupId}, frame ${nextFrameIndex}).`);
    setIsAnimationPreviewPlaying(true);
  }, [
    tile,
    tileAnimation,
    availableAnimationTiles,
    isScreen2,
    screen5PaletteSlots,
    onUpdate,
    setStatusBarMessage
  ]);

  const animationPreviewCount = tileAnimation.mode === 'transform'
    ? tileAnimation.transformCheckpoints
    : animationPreviewFrames.length;
  const currentAnimationPreviewIndex = tileAnimation.mode === 'transform'
    ? clampInt(animationTransformCheckpoint, 0, Math.max(0, tileAnimation.transformCheckpoints - 1), 0)
    : clampInt(
      animationPreviewFrameIndex,
      0,
      Math.max(0, animationPreviewFrames.length - 1),
      0
    );
  const currentAnimationPreviewEntry = animationPreviewFrames[currentAnimationPreviewIndex] || animationPreviewFrames[0];


  const handleDimensionChange = (newWidth: number, newHeight: number) => {
    if (newWidth === tile.width && newHeight === tile.height) return;

    let newPixelData: PixelData;
    let newLineAttributes: LineColorAttribute[][] | undefined = undefined;

    if (currentScreenMode === "SCREEN 2 (Graphics I)") {
      const defaultFg = tile.lineAttributes?.[0]?.[0]?.fg || DEFAULT_SCREEN2_FG_COLOR;
      const defaultBg = tile.lineAttributes?.[0]?.[0]?.bg || DEFAULT_SCREEN2_BG_COLOR;

      newLineAttributes = resizeLineAttributes(tile.lineAttributes, tile.width, tile.height, newWidth, newHeight, defaultFg, defaultBg);
      const initialColorForResize = newLineAttributes[0]?.[0]?.bg || defaultBg;
      newPixelData = resizePixelPatternData(tile.data, tile.width, tile.height, newWidth, newHeight, initialColorForResize);

      for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < newWidth; x++) {
          const segmentIndex = Math.floor(x / SCREEN2_PIXELS_PER_COLOR_SEGMENT);
          const attr = newLineAttributes[y]?.[segmentIndex];
          if (attr) {
            if (x >= tile.width || y >= tile.height) {
              newPixelData[y][x] = attr.bg;
            } else {
              const currentResizedPixel = newPixelData[y][x];
              if (currentResizedPixel !== attr.fg && currentResizedPixel !== attr.bg) {
                newPixelData[y][x] = attr.bg;
              }
            }
          }
        }
      }
    } else {
      newPixelData = resizePixelPatternData(tile.data, tile.width, tile.height, newWidth, newHeight, selectedColor);
    }
    onUpdate({
      width: newWidth,
      height: newHeight,
      data: newPixelData,
      lineAttributes: newLineAttributes,
      charLogicalProperties: trimCharLogicalPropertiesForDimensions(tile.charLogicalProperties, newWidth, newHeight),
    });
  };


  const handleUpdateLineAttribute = (rowIndex: number, segmentIndex: number, newAttribute: LineColorAttribute) => {
    if (!tile.lineAttributes || !tile.lineAttributes[rowIndex] || !tile.lineAttributes[rowIndex][segmentIndex]) {
      const fallbackLineAttributes = tile.lineAttributes?.map((row, rIdx) =>
        rIdx === rowIndex ? row.map((seg, sIdx) => (sIdx === segmentIndex ? newAttribute : seg)) : row
      ) || [];
      onUpdate({ lineAttributes: fallbackLineAttributes as LineColorAttribute[][] });
      return;
    }

    const oldAttribute = tile.lineAttributes[rowIndex][segmentIndex];
    const newLineAttributes = tile.lineAttributes.map((row, rIdx) =>
      rIdx === rowIndex ? row.map((seg, sIdx) => (sIdx === segmentIndex ? newAttribute : seg)) : row
    );

    const newPixelData = tile.data.map(row => [...row]);
    const startX = segmentIndex * SCREEN2_PIXELS_PER_COLOR_SEGMENT;
    const endX = startX + SCREEN2_PIXELS_PER_COLOR_SEGMENT;

    if (rowIndex >= 0 && rowIndex < tile.height) {
      for (let x = startX; x < endX && x < tile.width; x++) {
        if (newPixelData[rowIndex] && newPixelData[rowIndex][x] !== undefined) {
          const currentPixelColor = newPixelData[rowIndex][x];
          let newPixelColorToSet = currentPixelColor;
          if (currentPixelColor === oldAttribute.fg) {
            newPixelColorToSet = newAttribute.fg;
          } else if (currentPixelColor === oldAttribute.bg) {
            newPixelColorToSet = newAttribute.bg;
          } else {
            newPixelColorToSet = newAttribute.fg;
          }
          if (newPixelData[rowIndex][x] !== newPixelColorToSet) {
            newPixelData[rowIndex][x] = newPixelColorToSet;
          }
        }
      }
    }
    onUpdate({ data: newPixelData, lineAttributes: newLineAttributes });
  };


  const handleCopyAttributes = (rowIndex: number, segmentIndex: number) => {
    if (tile.lineAttributes?.[rowIndex]?.[segmentIndex]) {
      setCopiedAttribute({ ...tile.lineAttributes[rowIndex][segmentIndex] });
    }
  };
  const handlePasteAttributes = (rowIndex: number, segmentIndex: number) => {
    if (copiedAttribute && tile.lineAttributes) {
      handleUpdateLineAttribute(rowIndex, segmentIndex, copiedAttribute);
    }
  };

  const getSymmetricPoints = (initialPoint: Point): Point[] => {
    const { width, height } = tile;
    const points = new Set<string>();

    const addPoint = (p: Point) => {
      if (p.x >= 0 && p.x < width && p.y >= 0 && p.y < height) {
        points.add(`${p.x},${p.y}`);
      }
    };

    addPoint(initialPoint);

    if (symmetrySettings.quadMirror) {
      addPoint({ x: width - 1 - initialPoint.x, y: initialPoint.y });
      addPoint({ x: initialPoint.x, y: height - 1 - initialPoint.y });
      addPoint({ x: width - 1 - initialPoint.x, y: height - 1 - initialPoint.y });
    } else {
      if (symmetrySettings.horizontal) {
        Array.from(points).map(s => s.split(',').map(Number)).forEach(p_coords => {
          addPoint({ x: width - 1 - p_coords[0], y: p_coords[1] });
        });
      }
      if (symmetrySettings.vertical) {
        Array.from(points).map(s => s.split(',').map(Number)).forEach(p_coords => {
          addPoint({ x: p_coords[0], y: height - 1 - p_coords[1] });
        });
      }
      if (symmetrySettings.diagonalMain) {
        Array.from(points).map(s => s.split(',').map(Number)).forEach(p_coords => {
          addPoint({ x: p_coords[1], y: p_coords[0] });
        });
      }
      if (symmetrySettings.diagonalAnti) {
        Array.from(points).map(s => s.split(',').map(Number)).forEach(p_coords => {
          addPoint({ x: width - 1 - p_coords[1], y: height - 1 - p_coords[0] });
        });
      }
    }
    return Array.from(points).map(s => {
      const [x, y] = s.split(',').map(Number);
      return { x, y };
    });
  };

  const determineColorForPoint = useCallback((
    point: Point,
    isRightClick: boolean,
    lineAttrs: LineColorAttribute[][] | undefined,
    primarySelectedColor: MSXColorValue,
    currentScreenModeForColor: string
  ): MSXColorValue => {
    if (currentScreenModeForColor === "SCREEN 2 (Graphics I)") {
      if (!lineAttrs || !lineAttrs[point.y]) return primarySelectedColor;
      const segmentIndex = Math.floor(point.x / SCREEN2_PIXELS_PER_COLOR_SEGMENT);
      const attributes = lineAttrs[point.y]?.[segmentIndex];
      if (!attributes) return primarySelectedColor;
      return isRightClick ? attributes.bg : attributes.fg;
    }
    return isRightClick ? getScreen5Color(0, 0) : getEffectiveSelectedColor(primarySelectedColor);
  }, [getScreen5Color, getEffectiveSelectedColor]);


  const drawPixelSymmetrically = useCallback((point: Point, isRightClick: boolean) => {
    const pointsToDraw = getSymmetricPoints(point);
    const newData = tile.data.map(row => [...row]);
    let changed = false;

    pointsToDraw.forEach(p => {
      const colorToDraw = determineColorForPoint(p, isRightClick, tile.lineAttributes, selectedColor, currentScreenMode);
      if (newData[p.y]?.[p.x] !== colorToDraw) {
        newData[p.y][p.x] = colorToDraw;
        changed = true;
      }
    });

    if (changed) {
      onUpdate({ data: newData });
    }
  }, [tile.data, tile.lineAttributes, selectedColor, onUpdate, currentScreenMode, symmetrySettings, determineColorForPoint, getSymmetricPoints]);

  const performFloodFill = useCallback((startPoint: Point, isRightClick: boolean) => {
    const W = tile.width;
    const H = tile.height;

    const targetColor = tile.data[startPoint.y]?.[startPoint.x];
    if (targetColor === undefined) return;

    const initialFillColor = determineColorForPoint(startPoint, isRightClick, tile.lineAttributes, selectedColor, currentScreenMode);
    if (targetColor === initialFillColor) return;

    const newData = tile.data.map(row => [...row]);
    const queue: Point[] = [startPoint];
    const visited = Array(H).fill(null).map(() => Array(W).fill(false));

    visited[startPoint.y][startPoint.x] = true;
    newData[startPoint.y][startPoint.x] = initialFillColor;

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = [
        { x: current.x + 1, y: current.y }, { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 }, { x: current.x, y: current.y - 1 },
      ];

      for (const neighbor of neighbors) {
        const { x: nx, y: ny } = neighbor;
        if (nx >= 0 && nx < W && ny >= 0 && ny < H && !visited[ny][nx] && newData[ny][nx] === targetColor) {
          visited[ny][nx] = true;
          const neighborFillColor = determineColorForPoint({ x: nx, y: ny }, isRightClick, tile.lineAttributes, selectedColor, currentScreenMode);
          newData[ny][nx] = neighborFillColor;
          queue.push(neighbor);
        }
      }
    }
    onUpdate({ data: newData });
  }, [tile.data, tile.width, tile.height, tile.lineAttributes, selectedColor, onUpdate, currentScreenMode, determineColorForPoint]);

  const applyDitherBrush = useCallback((centerPoint: Point, isRightClickForSecondary: boolean) => {
    const diameter = ditherBrushDiameter;
    const radius = Math.floor(diameter / 2);
    const newData = tile.data.map(row => [...row]);
    let changed = false;

    const pointsToProcessSymmetrically = getSymmetricPoints(centerPoint);

    pointsToProcessSymmetrically.forEach(symmetricCenter => {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const px = symmetricCenter.x + dx;
          const py = symmetricCenter.y + dy;

          if (px >= 0 && px < tile.width && py >= 0 && py < tile.height) {
            const localX = dx + radius; // 0 to diameter-1
            const localY = dy + radius; // 0 to diameter-1

            let ditherColorToUse: MSXColorValue;
            if (currentScreenMode === "SCREEN 2 (Graphics I)") {
              const segmentIndex = Math.floor(px / SCREEN2_PIXELS_PER_COLOR_SEGMENT);
              const attributes = tile.lineAttributes?.[py]?.[segmentIndex];
              const segFg = attributes?.fg || DEFAULT_SCREEN2_FG_COLOR;
              const segBg = attributes?.bg || DEFAULT_SCREEN2_BG_COLOR;
              ditherColorToUse = ((localX % 2) === (localY % 2)) ? segFg : segBg;
            } else {
              const primaryDitherColor = getEffectiveSelectedColor(selectedColor);
              const secondaryDitherColor = getScreen5Color(0, 0); // Transparent/eraser
              ditherColorToUse = ((localX % 2) === (localY % 2)) ? primaryDitherColor : secondaryDitherColor;
            }

            if (newData[py][px] !== ditherColorToUse) {
              newData[py][px] = ditherColorToUse;
              changed = true;
            }
          }
        }
      }
    });


    if (changed) {
      onUpdate({ data: newData });
    }
  }, [tile.data, tile.width, tile.height, tile.lineAttributes, selectedColor, currentScreenMode, ditherBrushDiameter, onUpdate, getSymmetricPoints, getEffectiveSelectedColor, getScreen5Color]);


  const handleGridInteraction = useCallback((point: Point, isRightClick: boolean) => {
    if (currentTool === 'floodfill') {
      performFloodFill(point, isRightClick);
    } else if (currentTool === 'pencil') {
      drawPixelSymmetrically(point, isRightClick);
    } else if (currentTool === 'dither') {
      applyDitherBrush(point, isRightClick);
    }
  }, [currentTool, drawPixelSymmetrically, performFloodFill, applyDitherBrush]);


  const clearTile = () => {
    let clearedData: PixelData;
    if (currentScreenMode === "SCREEN 2 (Graphics I)" && tile.lineAttributes) {
      clearedData = tile.lineAttributes.map(rowAttrs =>
        Array(tile.width).fill(null).map((_, x) => {
          const segmentIndex = Math.floor(x / SCREEN2_PIXELS_PER_COLOR_SEGMENT);
          return rowAttrs[segmentIndex]?.bg || DEFAULT_SCREEN2_BG_COLOR;
        })
      );
    } else {
      const colorToClearWith = currentScreenMode === "SCREEN 2 (Graphics I)" ? DEFAULT_SCREEN2_BG_COLOR : getEffectiveSelectedColor(selectedColor);
      clearedData = Array(tile.height).fill(null).map(() => Array(tile.width).fill(colorToClearWith));
    }
    onUpdate({ data: clearedData });
  };

  const toggleSymmetry = (key: keyof SymmetrySettings) => {
    setSymmetrySettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const clearAllSymmetry = () => {
    setSymmetrySettings({ horizontal: false, vertical: false, diagonalMain: false, diagonalAnti: false, quadMirror: false });
  };

  const symmetryButtonClass = (isActive: boolean) =>
    `px-1.5 py-0.5 text-[0.65rem] ${isActive ? 'bg-msx-accent text-white' : 'bg-msx-border text-msx-textsecondary hover:bg-msx-highlight'}`;

  const toolButtonClass = (toolName: DrawingTool) =>
    `px-2 py-1 ${currentTool === toolName ? 'bg-msx-highlight text-msx-bgcolor' : 'bg-msx-border text-msx-textsecondary hover:bg-opacity-80'}`;


  const updateTileLogicalProperties = (
    newFamilyId?: SolidityTypeId,
    newFlagStates?: Record<PropertyFlagKey, boolean>,
    interactionOverrides?: Partial<{ type: TileInteractionType; value: number; target: string }>
  ) => {
    const familyIdToUse = newFamilyId !== undefined ? newFamilyId : selectedSolidityFamilyId;
    const flagsToUse = newFlagStates || flagStates;
    const interactionTypeToUse = interactionOverrides?.type ?? selectedInteractionType;
    const interactionValueToUse = clampInt(interactionOverrides?.value ?? interactionValue, 0, 255, 1);
    const interactionTargetToUse = interactionOverrides?.target ?? interactionTarget;
    const interactionUsesTrigger = isTriggeredTileInteractionType(interactionTypeToUse);
    const interactableEnabled = flagsToUse.isInteractiveSwitch || interactionUsesTrigger;
    const normalizedFlags = {
      ...flagsToUse,
      isInteractiveSwitch: interactableEnabled,
    };

    let newInstanceId = 0;
    for (const key in PROPERTY_FLAGS) {
      const flagKey = key as PropertyFlagKey;
      if (normalizedFlags[flagKey]) {
        newInstanceId |= (1 << PROPERTY_FLAGS[flagKey].bit);
      }
    }

    const newMapId = (familyIdToUse << 4) | newInstanceId;
    const solidityTypeInfo = SOLIDITY_TYPES.find(st => st.id === familyIdToUse);
    const newIsSolid = solidityTypeInfo ? solidityTypeInfo.isSolid : false;

    const updatedLogicalProps: TileLogicalProperties = {
      ...activeLogicalProperties,
      mapId: newMapId,
      familyId: familyIdToUse,
      instanceId: newInstanceId,
      isSolid: newIsSolid,
      isBreakable: normalizedFlags.isBreakable,
      isMovable: normalizedFlags.isMovable,
      causesDamage: normalizedFlags.causesDamage,
      isInteractiveSwitch: normalizedFlags.isInteractiveSwitch,
      isInteractable: interactionUsesTrigger,
      interactionType: interactionTypeToUse,
      interactionValue: interactionValueToUse,
      interactionTarget: interactionTargetToUse,
    };
    if (logicalEditScope === 'char') {
      const nextCharLogicalProperties: Record<string, TileLogicalProperties> = {
        ...(tile.charLogicalProperties || {}),
      };
      selectedLogicalCharKeys.forEach(key => {
        nextCharLogicalProperties[key] = updatedLogicalProps;
      });
      onUpdate({ charLogicalProperties: nextCharLogicalProperties });
    } else {
      onUpdate({ logicalProperties: updatedLogicalProps });
    }
  };

  const handleSelectLogicalChar = (charX: number, charY: number, addToSelection = false) => {
    const nextCell = { x: charX, y: charY };
    setSelectedLogicalChar(nextCell);
    setSelectedLogicalChars(prev => {
      if (!addToSelection) return [nextCell];
      const key = getTileCharKey(charX, charY);
      const exists = prev.some(cell => getTileCharKey(cell.x, cell.y) === key);
      if (exists) {
        const filtered = prev.filter(cell => getTileCharKey(cell.x, cell.y) !== key);
        return filtered.length > 0 ? filtered : [nextCell];
      }
      return [...prev, nextCell];
    });
    setLogicalEditScope('char');
    setShowGrid8x8(true);
  };

  const handleClearSelectedCharLogicalOverride = () => {
    if (!selectedGroupHasOverride) return;
    const nextCharLogicalProperties: Record<string, TileLogicalProperties> = { ...(tile.charLogicalProperties || {}) };
    selectedLogicalCharKeys.forEach(key => {
      delete nextCharLogicalProperties[key];
    });
    onUpdate({
      charLogicalProperties: Object.keys(nextCharLogicalProperties).length > 0 ? nextCharLogicalProperties : undefined,
    });
  };

  const handleClearAllCharLogicalOverrides = () => {
    if (!tile.charLogicalProperties || Object.keys(tile.charLogicalProperties).length === 0) return;
    onUpdate({ charLogicalProperties: undefined });
  };

  const handleSolidityTypeChange = (newFamilyIdValue: SolidityTypeId) => {
    setSelectedSolidityFamilyId(newFamilyIdValue);
    updateTileLogicalProperties(newFamilyIdValue, undefined);
  };

  const handlePropertyFlagChange = (flagKey: PropertyFlagKey, newValue: boolean) => {
    const newFlags = { ...flagStates, [flagKey]: newValue };
    let nextInteractionType = selectedInteractionType;
    if (flagKey === 'isInteractiveSwitch') {
      if (newValue && selectedInteractionType === 'none') {
        nextInteractionType = 'collect_gem';
        setSelectedInteractionType(nextInteractionType);
      }
      if (!newValue) {
        nextInteractionType = 'none';
        setSelectedInteractionType('none');
      }
    }
    setFlagStates(newFlags);
    updateTileLogicalProperties(undefined, newFlags, { type: nextInteractionType });
  };

  const handleInteractionTypeChange = (newType: TileInteractionType) => {
    setSelectedInteractionType(newType);
    const nextFlags = { ...flagStates, isInteractiveSwitch: isTriggeredTileInteractionType(newType) };
    setFlagStates(nextFlags);
    updateTileLogicalProperties(undefined, nextFlags, { type: newType });
  };

  const handleInteractionValueChange = (newValue: number) => {
    const clamped = clampInt(newValue, 0, 255, 1);
    setInteractionValue(clamped);
    updateTileLogicalProperties(undefined, undefined, { value: clamped });
  };

  const handleInteractionTargetChange = (newTarget: string) => {
    setInteractionTarget(newTarget);
    updateTileLogicalProperties(undefined, undefined, { target: newTarget });
  };

  const currentDisplayedMapId = (selectedSolidityFamilyId << 4) |
    (Object.entries(flagStates).reduce((acc, [key, val]) =>
      val ? acc | (1 << PROPERTY_FLAGS[key as PropertyFlagKey].bit) : acc, 0));

  const handleSplitTile = () => {
    if (tile.width % splitWidth !== 0 || tile.height % splitHeight !== 0) {
      alert(`Tile dimensions must be divisible by the split size (${splitWidth}x${splitHeight}).`);
      return;
    }
    const newAssetsToCreate: ProjectAsset[] = [];
    const numTilesX = tile.width / splitWidth;
    const numTilesY = tile.height / splitHeight;
    const splitSegmentsX = splitWidth / SCREEN2_PIXELS_PER_COLOR_SEGMENT;

    for (let ty = 0; ty < numTilesY; ty++) {
      for (let tx = 0; tx < numTilesX; tx++) {
        const newTilePixelData: PixelData = [];
        let newTileLineAttributes: LineColorAttribute[][] | undefined = undefined;

        if (currentScreenMode === "SCREEN 2 (Graphics I)") {
          newTileLineAttributes = [];
        }

        for (let pixelY = 0; pixelY < splitHeight; pixelY++) {
          const originalPixelY = ty * splitHeight + pixelY;
          const newRow: MSXColorValue[] = [];
          const newRowAttrs: LineColorAttribute[] = [];

          for (let pixelX = 0; pixelX < splitWidth; pixelX++) {
            const originalPixelX = tx * splitWidth + pixelX;
            if (tile.data[originalPixelY] && tile.data[originalPixelY][originalPixelX] !== undefined) {
              newRow.push(tile.data[originalPixelY][originalPixelX]);
            } else {
              newRow.push(currentScreenMode === "SCREEN 2 (Graphics I)" ? DEFAULT_SCREEN2_FG_COLOR : getScreen5Color(1, 1)); // Fallback pixel
            }
          }
          newTilePixelData.push(newRow);

          if (currentScreenMode === "SCREEN 2 (Graphics I)" && newTileLineAttributes && tile.lineAttributes) {
            const originalSegmentOffset = tx * splitSegmentsX;
            for (let segX = 0; segX < splitSegmentsX; segX++) {
              const originalSegmentX = originalSegmentOffset + segX;
              if (tile.lineAttributes[originalPixelY] && tile.lineAttributes[originalPixelY][originalSegmentX]) {
                newRowAttrs.push({ ...tile.lineAttributes[originalPixelY][originalSegmentX] });
              } else {
                // Fallback if original attributes are missing for this segment (should not happen ideally)
                newRowAttrs.push({ fg: DEFAULT_SCREEN2_FG_COLOR, bg: DEFAULT_SCREEN2_BG_COLOR });
              }
            }
            newTileLineAttributes.push(newRowAttrs);
          }
        }

        const newTileId = `tile_split_${tile.id}_${tx}_${ty}_${Date.now()}`;
        const newTileName = `${tile.name}_part_${ty}_${tx}_${splitWidth}x${splitHeight}`;
        const splitCharsX = Math.max(1, Math.floor(splitWidth / EDITOR_BASE_TILE_DIM_S2));
        const splitCharsY = Math.max(1, Math.floor(splitHeight / EDITOR_BASE_TILE_DIM_S2));
        const splitBaseCharX = tx * splitCharsX;
        const splitBaseCharY = ty * splitCharsY;
        let splitBaseLogicalProperties = cloneLogicalProperties(tile.logicalProperties);
        const splitCharLogicalProperties: Record<string, TileLogicalProperties> = {};

        for (let charY = 0; charY < splitCharsY; charY++) {
          for (let charX = 0; charX < splitCharsX; charX++) {
            const sourceKey = getTileCharKey(splitBaseCharX + charX, splitBaseCharY + charY);
            const sourceProps = cloneLogicalProperties(tile.charLogicalProperties?.[sourceKey] || tile.logicalProperties);
            if (charX === 0 && charY === 0) {
              splitBaseLogicalProperties = sourceProps;
            } else if (!logicalPropertiesEqual(sourceProps, splitBaseLogicalProperties)) {
              splitCharLogicalProperties[getTileCharKey(charX, charY)] = sourceProps;
            }
          }
        }

        const newSplitTile: Tile = {
          id: newTileId,
          name: newTileName,
          width: splitWidth,
          height: splitHeight,
          data: newTilePixelData,
          lineAttributes: newTileLineAttributes,
          logicalProperties: splitBaseLogicalProperties,
          charLogicalProperties: Object.keys(splitCharLogicalProperties).length > 0 ? splitCharLogicalProperties : undefined,
          ...(isScreen2 ? {} : { screen5Palette: screen5PaletteSlots.map(slot => ({ ...slot })) })
        };
        newAssetsToCreate.push({
          id: newTileId,
          name: newTileName,
          type: 'tile',
          data: newSplitTile
        });
      }
    }
    if (newAssetsToCreate.length > 0) {
      onUpdate({}, newAssetsToCreate); // Pass empty object for current tile data as it's not modified
    }
  };

  const handleCopyCurrentTile = () => {
    onCopyTileData(tile);
  };

  const handlePasteTileData = () => {
    if (!copiedTileData) {
      setStatusBarMessage("Tile buffer is empty. Copy a tile first.");
      return;
    }

    const { data: copiedPixelData, lineAttributes: copiedLineAttributes, width: copiedWidth, height: copiedHeight } = copiedTileData;
    const { width: targetWidth, height: targetHeight } = tile;

    const newPixelData = Array(targetHeight).fill(null).map((_, r) =>
      Array(targetWidth).fill(null).map((__, c) => {
        if (r < tile.data.length && c < tile.data[r]?.length) {
          return tile.data[r][c];
        }
        return getScreen5Color(1, 1);
      })
    );

    for (let y = 0; y < Math.min(targetHeight, copiedHeight); y++) {
      for (let x = 0; x < Math.min(targetWidth, copiedWidth); x++) {
        if (copiedPixelData[y]?.[x] !== undefined) {
          newPixelData[y][x] = copiedPixelData[y][x];
        }
      }
    }

    let newLineAttributes: LineColorAttribute[][] | undefined = undefined;
    if (currentScreenMode === "SCREEN 2 (Graphics I)") {
      newLineAttributes = createDefaultLineAttributes(targetWidth, targetHeight, DEFAULT_SCREEN2_FG_COLOR, DEFAULT_SCREEN2_BG_COLOR);
      if (copiedLineAttributes) {
        const numCopiedSegmentsX = Math.floor(copiedWidth / SCREEN2_PIXELS_PER_COLOR_SEGMENT);
        for (let y = 0; y < Math.min(targetHeight, copiedHeight); y++) {
          const numTargetSegmentsXThisRow = Math.floor(targetWidth / SCREEN2_PIXELS_PER_COLOR_SEGMENT);
          for (let segX = 0; segX < Math.min(numTargetSegmentsXThisRow, numCopiedSegmentsX); segX++) {
            if (copiedLineAttributes[y]?.[segX]) {
              newLineAttributes[y][segX] = { ...copiedLineAttributes[y][segX] };
            }
          }
        }
      }
    }
    onUpdate({ data: newPixelData, lineAttributes: newLineAttributes });
    setStatusBarMessage(`Pasted tile data onto "${tile.name}".`);
  };

  const handleGenerateTexture = (pixelData: PixelData) => {
    onUpdate({ data: pixelData });
    setIsGeneratorModalOpen(false);
    setStatusBarMessage("Texture generated successfully.");
  };

  const handleShiftUp = () => onUpdate({ data: shiftTileDataUp(tile.data, tile.lineAttributes, currentScreenMode) });
  const handleShiftDown = () => onUpdate({ data: shiftTileDataDown(tile.data, tile.lineAttributes, currentScreenMode) });
  const handleShiftLeft = () => onUpdate({ data: shiftTileDataLeft(tile.data, tile.lineAttributes, currentScreenMode) });
  const handleShiftRight = () => onUpdate({ data: shiftTileDataRight(tile.data, tile.lineAttributes, currentScreenMode) });
  const handleMirrorHorizontal = () => onUpdate({ data: mirrorTileDataHorizontal(tile.data, tile.lineAttributes, currentScreenMode) });
  const handleMirrorVertical = () => onUpdate({ data: mirrorTileDataVertical(tile.data, tile.lineAttributes, currentScreenMode) });

  const handleSaveTile = useCallback(() => {
    try {
      const tileJson = JSON.stringify(tile, null, 2);
      const blob = new Blob([tileJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tile.name}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusBarMessage(`Tile '${tile.name}' saved as JSON.`);
    } catch (error) {
      console.error("Failed to save tile as JSON:", error);
      setStatusBarMessage("Error saving tile as JSON.");
    }
  }, [tile, setStatusBarMessage]);

  const handleLoadTile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const loadedTile: Tile = JSON.parse(e.target?.result as string);
            // Basic validation to ensure it's a tile object
            if (loadedTile && loadedTile.id && loadedTile.name && loadedTile.data) {
              onUpdate({ ...loadedTile, id: tile.id });
              setStatusBarMessage(`Tile '${loadedTile.name}' loaded successfully.`);
            } else {
              throw new Error("Invalid tile JSON structure.");
            }
          } catch (error) {
            console.error("Failed to load tile from JSON:", error);
            setStatusBarMessage("Error loading tile from JSON. Invalid file format?");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [onUpdate, setStatusBarMessage, tile.id]);

  const handleFillAll = (type: 'fg' | 'bg', newColor: MSX1ColorValue) => {
    if (!tile.lineAttributes) return;

    const newPixelData = tile.data.map(row => [...row]);
    const newLineAttributes = JSON.parse(JSON.stringify(tile.lineAttributes)); // Deep copy

    for (let y = 0; y < tile.height; y++) {
      for (let s = 0; s < newLineAttributes[y].length; s++) {
        const segment = newLineAttributes[y][s];
        const oldColor = segment[type];

        if (oldColor !== newColor) {
          // Update the attribute
          segment[type] = newColor;

          // Update the corresponding pixels
          const startX = s * SCREEN2_PIXELS_PER_COLOR_SEGMENT;
          const endX = startX + SCREEN2_PIXELS_PER_COLOR_SEGMENT;

          for (let x = startX; x < endX && x < tile.width; x++) {
            if (newPixelData[y]?.[x] === oldColor) {
              newPixelData[y][x] = newColor;
            }
          }
        }
      }
    }
    onUpdate({ data: newPixelData, lineAttributes: newLineAttributes });
    setStatusBarMessage(`Filled all ${type.toUpperCase()} colors with the selected palette color.`);
  };

  return (
    <Panel title={`Tile Editor: ${tile.name} ${currentScreenMode === "SCREEN 2 (Graphics I)" ? "(MSX1 SCREEN 2 Mode)" : ""}`} className="flex-grow flex flex-col p-2 bg-msx-bgcolor select-none">
      <TileEditorAdvancedLayout
        columnaIzquierda={
          <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: '100%' }}>
            <CollapsiblePanel title="Tile Properties" isOpen={!!leftPanelOpen.properties} onToggle={() => toggleLeftPanel('properties')}>
              <div className="space-y-2 text-xs">
                <div>
                  <label>Tile Name:</label>
                  <span className="block w-full p-1 text-msx-textprimary">{tile.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <label>Dimensions (px):</label>
                  <select value={tile.width} onChange={(e) => handleDimensionChange(parseInt(e.target.value), tile.height)} className="p-1 bg-msx-bgcolor border-msx-border rounded">
                    {EDITABLE_TILE_DIMENSIONS.map(d => <option key={`w-${d}`} value={d}>{d}</option>)}
                  </select>
                  <span>x</span>
                  <select value={tile.height} onChange={(e) => handleDimensionChange(tile.width, parseInt(e.target.value))} className="p-1 bg-msx-bgcolor border-msx-border rounded">
                    {EDITABLE_TILE_DIMENSIONS.map(d => <option key={`h-${d}`} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button onClick={handleCopyCurrentTile} size="sm" variant="secondary" icon={<CopyIcon />}>Copy Tile</Button>
                  <Button onClick={handlePasteTileData} size="sm" variant="secondary" icon={<PasteIcon />} disabled={!copiedTileData}>Paste Data</Button>
                  <Button onClick={() => setIsGeneratorModalOpen(true)} size="sm" variant="secondary" icon={<SparklesIcon />}>Generator</Button>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-msx-textsecondary">Split size:</span>
                  <select
                    value={splitWidth}
                    onChange={(e) => setSplitWidth(parseInt(e.target.value, 10))}
                    className="p-1 bg-msx-bgcolor border-msx-border rounded"
                    title="Split part width"
                  >
                    {splitWidthOptions.map(d => <option key={`split-w-${d}`} value={d}>{d}</option>)}
                  </select>
                  <span>x</span>
                  <select
                    value={splitHeight}
                    onChange={(e) => setSplitHeight(parseInt(e.target.value, 10))}
                    className="p-1 bg-msx-bgcolor border-msx-border rounded"
                    title="Split part height"
                  >
                    {splitHeightOptions.map(d => <option key={`split-h-${d}`} value={d}>{d}</option>)}
                  </select>
                  <span className="text-msx-textsecondary">
                    {Math.floor(tile.width / splitWidth) * Math.floor(tile.height / splitHeight)} parts
                  </span>
                    <Button
                      onClick={handleSplitTile}
                      size="sm"
                      variant="secondary"
                      icon={<SplitIcon />}
                      disabled={splitWidthOptions.length === 0 || splitHeightOptions.length === 0 || (splitWidth === tile.width && splitHeight === tile.height)}
                      title={`Create ${Math.floor(tile.width / splitWidth) * Math.floor(tile.height / splitHeight)} tile parts of ${splitWidth}x${splitHeight}px`}
                    >
                      Split
                    </Button>
                </div>
              </div>
            </CollapsiblePanel>
            {!isScreen2 && (
              <CollapsiblePanel title="MSX2 SCREEN 4 Palette (16 colores)" isOpen={!!leftPanelOpen.screen5} onToggle={() => toggleLeftPanel('screen5')}>
                <p className="text-xs text-msx-textsecondary mb-2">
                  Selecciona un slot (0 reservado como transparente). Los colores se cargan desde las paletas guardadas.
                </p>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {screen5PaletteSlots.map((slot) => {
                    const isActive = slot.slotIndex === activeScreen5PaletteSlot;
                    return (
                      <button
                        key={`screen5-slot-${slot.slotIndex}`}
                        type="button"
                        onClick={() => handleSelectScreen5PaletteSlot(slot.slotIndex)}
                        className={`p-2 rounded border text-left transition-colors ${isActive ? 'border-msx-highlight ring-1 ring-msx-highlight' : 'border-msx-border'
                          } ${slot.slotIndex === 0 ? 'opacity-80 cursor-not-allowed' : 'hover:border-msx-highlight'}`}
                        style={{ backgroundColor: slot.hex === 'rgba(0,0,0,0)' ? undefined : slot.hex }}
                        title={slot.slotIndex === 0 ? 'Transparente / borrado' : `Slot ${slot.slotIndex}`}
                      >
                        <div className={`text-[0.7rem] font-semibold ${slot.slotIndex === 0 ? 'text-msx-textsecondary' : 'text-msx-bgcolor mix-blend-difference'}`}>
                          {slot.slotIndex === 0 ? 'Slot 0' : `Slot ${slot.slotIndex}`}
                        </div>
                        <div className="text-[0.6rem] text-msx-textsecondary mt-1">
                          {slot.slotIndex === 0 ? 'Transparente' : `Idx ${slot.masterIndex}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CollapsiblePanel>
            )}
            <CollapsiblePanel title="Logical Properties (Collision/Behavior)" isOpen={!!leftPanelOpen.logical} onToggle={() => toggleLeftPanel('logical')}>
              <div className="space-y-2 text-xs">
                <p className="text-[0.65rem] text-msx-textsecondary">Define gameplay attributes for this tile. These are exported in the Behavior Map.</p>
                <div className="pt-1 border-t border-msx-border/50 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-msx-textsecondary">Edit:</span>
                    <Button
                      onClick={() => setLogicalEditScope('tile')}
                      size="sm"
                      variant={logicalEditScope === 'tile' ? 'secondary' : 'ghost'}
                      className="px-2 py-0.5 text-[0.65rem]"
                    >
                      Whole Tile
                    </Button>
                    <Button
                      onClick={() => {
                        setLogicalEditScope('char');
                        setShowGrid8x8(true);
                      }}
                      size="sm"
                      variant={logicalEditScope === 'char' ? 'secondary' : 'ghost'}
                      className="px-2 py-0.5 text-[0.65rem]"
                    >
                      8x8 Char
                    </Button>
                    <span className="text-msx-textsecondary" title="Ctrl+click cells to add or remove them from the edit group">
                      {charOverrideCount} overrides
                    </span>
                  </div>
                  <div
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `repeat(${tileCharColumns}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: tileCharRows }).flatMap((_, charY) =>
                      Array.from({ length: tileCharColumns }).map((__, charX) => {
                        const key = getTileCharKey(charX, charY);
                        const hasOverride = !!tile.charLogicalProperties?.[key];
                        const props = cloneLogicalProperties(tile.charLogicalProperties?.[key] || tile.logicalProperties);
                        const familyId = props.familyId ?? ((props.mapId ?? 0) >> 4);
                        const mapId = props.mapId ?? ((familyId << 4) | (props.instanceId ?? 0));
                        const isSelected = logicalEditScope === 'char' && selectedLogicalCharKeys.includes(key);
                        const isPrimary = logicalEditScope === 'char' && selectedLogicalChar.x === charX && selectedLogicalChar.y === charY;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={(event) => handleSelectLogicalChar(charX, charY, event.ctrlKey || event.metaKey)}
                            className={`h-7 rounded border font-mono text-[0.6rem] transition-colors ${isSelected
                              ? `border-msx-highlight ${isPrimary ? 'ring-1 ring-msx-highlight' : 'bg-msx-highlight/15'}`
                              : 'border-msx-border hover:border-msx-highlight'
                              } ${familyId > 0 ? 'bg-msx-danger/30 text-msx-textprimary' : 'bg-msx-bgcolor text-msx-textsecondary'}`}
                            title={`Char ${charX},${charY} MapID ${mapId}${hasOverride ? ' (override)' : ' (inherits whole tile)'}. Ctrl+click to group cells.`}
                          >
                            {hasOverride ? '*' : ''}{mapId.toString(16).padStart(2, '0').toUpperCase()}
                          </button>
                        );
                      })
                    )}
                  </div>
                  {logicalEditScope === 'char' && (
                    <div className="flex flex-wrap items-center gap-2 text-msx-textsecondary">
                      <span>
                        {selectedLogicalCharKeys.length > 1
                          ? `Selected chars: ${selectedLogicalCharKeys.length} (active ${selectedLogicalChar.x},${selectedLogicalChar.y})`
                          : `Selected char: ${selectedLogicalChar.x},${selectedLogicalChar.y}`}
                      </span>
                      <Button
                        onClick={() => handleSolidityTypeChange(0)}
                        size="sm"
                        variant="ghost"
                        className="px-2 py-0.5 text-[0.65rem]"
                        title="Apply NoSolid to the selected chars"
                      >
                        NoSolid
                      </Button>
                      <Button
                        onClick={() => handleSolidityTypeChange(1)}
                        size="sm"
                        variant="ghost"
                        className="px-2 py-0.5 text-[0.65rem]"
                        title="Apply Solid to the selected chars"
                      >
                        Solid
                      </Button>
                      <Button
                        onClick={handleClearSelectedCharLogicalOverride}
                        size="sm"
                        variant="ghost"
                        className="px-2 py-0.5 text-[0.65rem]"
                        disabled={!selectedGroupHasOverride}
                        title="Remove selected char overrides and inherit the whole tile properties"
                      >
                        Use Tile Default
                      </Button>
                      <Button
                        onClick={handleClearAllCharLogicalOverrides}
                        size="sm"
                        variant="ghost"
                        className="px-2 py-0.5 text-[0.65rem]"
                        disabled={charOverrideCount === 0}
                        title="Remove all per-char logical overrides"
                      >
                        Clear All
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block mb-0.5">Solidity Family:</label>
                  <select
                    value={selectedSolidityFamilyId}
                    onChange={(e) => handleSolidityTypeChange(parseInt(e.target.value, 10) as SolidityTypeId)}
                    className="w-full p-1 bg-msx-bgcolor border-msx-border rounded text-xs"
                  >
                    {SOLIDITY_TYPES.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-0.5">Property Flags:</label>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {Object.entries(PROPERTY_FLAGS).map(([key, flag]) => {
                      const flagKey = key as PropertyFlagKey;
                      return (
                        <label key={key} className="flex items-center space-x-1.5 cursor-pointer p-0.5 hover:bg-msx-border rounded">
                          <input
                            type="checkbox"
                            checked={flagStates[flagKey]}
                            onChange={(e) => handlePropertyFlagChange(flagKey, e.target.checked)}
                            className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"
                          />
                          <span className="text-msx-textsecondary truncate" title={flag.label}>{flag.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="pt-1 border-t border-msx-border/50 text-msx-textsecondary text-center">
                  Final Map ID Byte: <span className="font-mono text-msx-highlight">{currentDisplayedMapId}</span> (Hex: <span className="font-mono text-msx-highlight">0x{currentDisplayedMapId.toString(16).padStart(2, '0').toUpperCase()}</span>)
                </div>
                <div className="pt-1 border-t border-msx-border/50 space-y-2">
                  <div>
                    <label className="block mb-0.5">Interaction Type:</label>
                    <select
                      value={selectedInteractionType}
                      onChange={(e) => handleInteractionTypeChange(e.target.value as TileInteractionType)}
                      className="w-full p-1 bg-msx-bgcolor border-msx-border rounded text-xs"
                    >
                      {TILE_INTERACTION_TYPES.map(interaction => (
                        <option key={interaction.key} value={interaction.key}>{interaction.label}</option>
                      ))}
                    </select>
                  </div>
                  {selectedInteractionType !== 'none' && (
                    <>
                      <div>
                        <label className="block mb-0.5">Interaction Value:</label>
                        <input
                          type="number"
                          min={0}
                          max={255}
                          value={interactionValue}
                          onChange={(e) => handleInteractionValueChange(Number(e.target.value))}
                          className="w-full p-1 bg-msx-bgcolor border border-msx-border rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block mb-0.5">Interaction Target:</label>
                        <input
                          type="text"
                          value={interactionTarget}
                          onChange={(e) => handleInteractionTargetChange(e.target.value)}
                          placeholder="global variable / hook"
                          className="w-full p-1 bg-msx-bgcolor border border-msx-border rounded text-xs"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CollapsiblePanel>
            <CollapsiblePanel title="Animated Tile (MSX ASM)" isOpen={!!leftPanelOpen.animation} onToggle={() => toggleLeftPanel('animation')}>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer p-0.5 hover:bg-msx-border rounded">
                  <input
                    type="checkbox"
                    checked={!!tileAnimation.enabled}
                    onChange={(e) => updateTileAnimation({ enabled: e.target.checked })}
                    className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"
                  />
                  <span className="text-msx-textsecondary">Enable animated tile</span>
                </label>
                <div>
                  <label className="block mb-0.5">Mode:</label>
                  <select
                    value={tileAnimation.mode}
                    onChange={(e) => updateTileAnimation({ mode: e.target.value === 'transform' ? 'transform' : 'frames' })}
                    className="w-full p-1 bg-msx-bgcolor border border-msx-border rounded text-xs text-msx-textprimary"
                  >
                    <option value="frames">Frames (classic)</option>
                    <option value="transform">Z80 Transform (single frame)</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-0.5">Group ID:</label>
                  <input
                    type="text"
                    value={tileAnimation.groupId || ''}
                    onChange={(e) => updateTileAnimation({ groupId: e.target.value })}
                    className="w-full p-1 bg-msx-bgcolor border border-msx-border rounded text-xs text-msx-textprimary"
                    placeholder="torch / water / waterfall"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block mb-0.5">Speed (frames):</label>
                    <input
                      type="number"
                      min={1}
                      max={255}
                      value={tileAnimation.speed ?? DEFAULT_TILE_ANIMATION_SPEED}
                      onChange={(e) => updateTileAnimation({ speed: clampInt(parseInt(e.target.value, 10), 1, 255, DEFAULT_TILE_ANIMATION_SPEED) })}
                      className="w-full p-1 bg-msx-bgcolor border border-msx-border rounded text-xs text-msx-textprimary"
                    />
                  </div>
                  {tileAnimation.mode === 'frames' && (
                    <div>
                      <label className="block mb-0.5">Frame Index:</label>
                      <input
                        type="number"
                        min={0}
                        max={255}
                        value={tileAnimation.frameIndex ?? 0}
                        onChange={(e) => updateTileAnimation({ frameIndex: clampInt(parseInt(e.target.value, 10), 0, 255, 0) })}
                        className="w-full p-1 bg-msx-bgcolor border border-msx-border rounded text-xs text-msx-textprimary"
                      />
                    </div>
                  )}
                  {tileAnimation.mode === 'transform' && (
                    <div>
                      <label className="block mb-0.5">Checkpoints:</label>
                      <input
                        type="number"
                        min={1}
                        max={255}
                        value={tileAnimation.transformCheckpoints}
                        onChange={(e) => updateTileAnimation({
                          transform: { checkpoints: clampInt(parseInt(e.target.value, 10), 1, 255, DEFAULT_TRANSFORM_CHECKPOINTS) }
                        })}
                        className="w-full p-1 bg-msx-bgcolor border border-msx-border rounded text-xs text-msx-textprimary"
                      />
                    </div>
                  )}
                </div>
                {tileAnimation.mode === 'transform' && (
                  <>
                    <div>
                      <label className="block mb-0.5">Transform Effect:</label>
                      <select
                        value={tileAnimation.transformEffect}
                        onChange={(e) => updateTileAnimation({
                          transform: {
                            effect: (TRANSFORM_EFFECT_OPTIONS.find(option => option.value === e.target.value)?.value || DEFAULT_TRANSFORM_EFFECT) as TileTransformEffect
                          }
                        })}
                        className="w-full p-1 bg-msx-bgcolor border border-msx-border rounded text-xs text-msx-textprimary"
                      >
                        {TRANSFORM_EFFECT_OPTIONS.map((option) => (
                          <option key={`transform-op-${option.value}`} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer p-0.5 hover:bg-msx-border rounded">
                      <input
                        type="checkbox"
                        checked={tileAnimation.transformIncludeColors}
                        onChange={(e) => updateTileAnimation({ transform: { includeColors: e.target.checked } })}
                        className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"
                      />
                      <span className="text-msx-textsecondary">Apply vertical transforms to color rows too</span>
                    </label>
                  </>
                )}
                <div>
                  <label className="block mb-0.5">Base Tile Target:</label>
                  <select
                    value={tileAnimation.baseTileId || ''}
                    onChange={(e) => updateTileAnimation({ baseTileId: e.target.value })}
                    className="w-full p-1 bg-msx-bgcolor border border-msx-border rounded text-xs text-msx-textprimary"
                  >
                    <option value="">Auto (first frame by order)</option>
                    {availableAnimationTiles.map((t) => (
                      <option key={`anim-base-${t.id}`} value={t.id}>
                        {t.name}{t.id === tile.id ? ' (this tile)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[0.65rem] text-msx-textsecondary">
                  {tileAnimation.mode === 'frames'
                    ? 'Usa el mismo Group ID en todos los frames. Ejemplo: torch_f0, torch_f1, torch_f2.'
                    : 'Modo transform aplica operaciones Z80 (rotaciones/desplazamientos) sobre el mismo tile sin crear más frames.'}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {tileAnimation.mode === 'frames' && (
                    <Button
                      onClick={handleCreateNextAnimationFrame}
                      size="sm"
                      variant="secondary"
                    >
                      Create Next Frame
                    </Button>
                  )}
                  {tileAnimation.mode === 'transform' && (
                    <>
                      <Button
                        onClick={() => setAnimationTransformCheckpoint(prev => (prev - 1 + tileAnimation.transformCheckpoints) % Math.max(1, tileAnimation.transformCheckpoints))}
                        size="sm"
                        variant="ghost"
                        disabled={tileAnimation.transformCheckpoints <= 1}
                      >
                        Step -
                      </Button>
                      <Button
                        onClick={() => setAnimationTransformCheckpoint(prev => (prev + 1) % Math.max(1, tileAnimation.transformCheckpoints))}
                        size="sm"
                        variant="ghost"
                        disabled={tileAnimation.transformCheckpoints <= 1}
                      >
                        Step +
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={() => setIsAnimationPreviewPlaying(prev => !prev)}
                    size="sm"
                    variant={isAnimationPreviewPlaying ? 'primary' : 'ghost'}
                    disabled={animationPreviewCount <= 1}
                  >
                    {isAnimationPreviewPlaying ? 'Pause' : 'Play'}
                  </Button>
                  <Button
                    onClick={() => {
                      setAnimationPreviewFrameIndex(0);
                      setAnimationTransformCheckpoint(0);
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    Reset
                  </Button>
                </div>
                <div className="p-2 bg-msx-panelbg border border-msx-border rounded space-y-2">
                  <div className="flex justify-between text-[0.65rem] text-msx-textsecondary">
                    <span>{tileAnimation.mode === 'frames' ? `Frames: ${animationPreviewCount}` : `Checkpoint: ${currentAnimationPreviewIndex + 1}/${Math.max(1, animationPreviewCount)}`}</span>
                    <span>Speed: ~{animationPreviewMs} ms</span>
                  </div>
                  {currentAnimationPreviewEntry && (
                    <div className="flex justify-center">
                      <TileCanvasPreview
                        tile={currentAnimationPreviewEntry.tile}
                        scale={8}
                        className="border border-msx-border bg-msx-bgcolor"
                      />
                    </div>
                  )}
                  <div className="max-h-28 overflow-y-auto">
                    <div className="flex flex-wrap gap-1">
                      {tileAnimation.mode === 'frames' && animationPreviewFrames.map((entry, index) => (
                        <button
                          key={`anim-preview-${entry.tile.id}-${index}`}
                          type="button"
                          onClick={() => setAnimationPreviewFrameIndex(index)}
                          className={`p-1 border rounded text-left ${index === currentAnimationPreviewIndex
                            ? 'border-msx-highlight bg-msx-highlight/20'
                            : 'border-msx-border hover:border-msx-highlight'}`}
                          title={`${entry.tile.name} (frame ${entry.meta.frameIndex})`}
                        >
                          <TileCanvasPreview
                            tile={entry.tile}
                            scale={3}
                            className="border border-msx-border bg-msx-bgcolor"
                          />
                          <div className="text-[0.6rem] text-msx-textsecondary mt-0.5">
                            f{entry.meta.frameIndex}
                          </div>
                        </button>
                      ))}
                      {tileAnimation.mode === 'transform' && Array.from({ length: Math.max(1, Math.min(tileAnimation.transformCheckpoints, 32)) }, (_, index) => (
                        <button
                          key={`transform-checkpoint-${index}`}
                          type="button"
                          onClick={() => setAnimationTransformCheckpoint(index)}
                          className={`px-2 py-1 border rounded text-[0.65rem] ${index === currentAnimationPreviewIndex
                            ? 'border-msx-highlight bg-msx-highlight/20'
                            : 'border-msx-border hover:border-msx-highlight'}`}
                          title={`Checkpoint ${index}`}
                        >
                          C{index}
                        </button>
                      ))}
                    </div>
                  </div>
                  {tileAnimation.mode === 'transform' && (
                    <p className="text-[0.6rem] text-msx-textsecondary">
                      Efecto: {TRANSFORM_EFFECT_OPTIONS.find(option => option.value === tileAnimation.transformEffect)?.description}
                    </p>
                  )}
                </div>
              </div>
            </CollapsiblePanel>
            {currentScreenMode === "SCREEN 2 (Graphics I)" && tile.lineAttributes && (
              <CollapsiblePanel title="MSX1 Technical Preview [SCREEN 2]" isOpen={!!leftPanelOpen.technical} onToggle={() => toggleLeftPanel('technical')}>
                <TechnicalPreviewPanel tile={tile} dataFormat={dataOutputFormat} />
              </CollapsiblePanel>
            )}
          </div>
        }
        columnaCentral={
          <>
            <div className="flex flex-wrap items-center gap-2 p-2 bg-msx-panelbg rounded border border-msx-border">
              <div className="flex items-center space-x-1">
                <label className="text-xs">Tool:</label>
                <Button onClick={() => setCurrentTool('pencil')} className={toolButtonClass('pencil')} title="Pencil (Draw/Erase)"><PngIcon src={pencilImg} alt="Pencil" className="w-4 h-4" /></Button>
                <Button onClick={() => setCurrentTool('floodfill')} className={toolButtonClass('floodfill')} title="Flood Fill"><PngIcon src={paintBucketImg} alt="Flood Fill" className="w-4 h-4" /></Button>
                <Button onClick={() => setCurrentTool('dither')} className={toolButtonClass('dither')} title="Dither Brush"><PatternBrushIcon className="w-4 h-4" /></Button>
              </div>
              {currentTool === 'dither' && (
                <div className="flex items-center space-x-1">
                  <label className="text-xs">Brush Size:</label>
                  {DITHER_BRUSH_DIAMETERS.map(d =>
                    <Button key={d} onClick={() => setDitherBrushDiameter(d)} size="sm" variant={ditherBrushDiameter === d ? 'secondary' : 'ghost'} className="!p-1 text-[0.6rem] w-6 h-6">{d}x{d}</Button>
                  )}
                </div>
              )}
              <Button
                onClick={() => setShowGrid8x8(v => !v)}
                size="sm"
                variant={showGrid8x8 ? 'secondary' : 'ghost'}
                icon={<GridIcon className="w-4 h-4" />}
                title={showGrid8x8 ? 'Hide dashed 8x8 grid' : 'Show dashed 8x8 grid'}
              >
                8x8 Grid
              </Button>
              <div
                className="ml-auto px-2 py-1 rounded border border-msx-border bg-msx-bgcolor text-xs text-msx-textprimary font-mono whitespace-nowrap"
                title={`Tile actual: ${tile.width}x${tile.height}px, ${tileCharTotal} casillas de 8x8`}
              >
                8x8: {tileCharColumns}x{tileCharRows} = {tileCharTotal}
              </div>
              <Button onClick={() => setIsFileModalOpen(true)} size="sm" variant="secondary" icon={<PngIcon src={floppyDiskImg} alt="File Ops" className="w-4 h-4" />}>File Ops</Button>
            </div>
            {isFileModalOpen && (
              <TileFileOperationsModal
                isOpen={isFileModalOpen}
                onClose={() => setIsFileModalOpen(false)}
                allTileAssets={allTileAssets}
                onUpdateAllTileAssets={onUpdateAllTileAssets}
                currentTile={tile}
                currentScreenMode={currentScreenMode}
                dataOutputFormat={dataOutputFormat}
                onSaveTile={handleSaveTile}
                onLoadTile={handleLoadTile}
              />
            )}
            {/* --- Tile Manipulation Tools --- */}
            <div
              className="p-1 bg-msx-panelbg rounded border border-msx-border flex flex-row gap-2 items-center"
              style={{ marginTop: '8px', padding: '5px' }}
            >
              <div className="flex gap-1">
                <Button onClick={handleShiftUp} size="sm" variant="secondary" title="Desplazar tile hacia arriba (Norte)">
                  <ArrowUpIcon className="w-4 h-4" />
                </Button>
                <Button onClick={handleShiftDown} size="sm" variant="secondary" title="Desplazar tile hacia abajo (Sur)">
                  <ArrowDownIcon className="w-4 h-4" />
                </Button>
                <Button onClick={handleShiftLeft} size="sm" variant="secondary" title="Desplazar tile hacia la izquierda (Oeste)">
                  <ArrowLeftIcon className="w-4 h-4" />
                </Button>
                <Button onClick={handleShiftRight} size="sm" variant="secondary" title="Desplazar tile hacia la derecha (Este)">
                  <ArrowRightIcon className="w-4 h-4" />
                </Button>
              </div>
              <div className="border-l border-msx-border h-5"></div>
              <div className="flex gap-1">
                <Button onClick={handleMirrorHorizontal} size="sm" variant="secondary" title="Espejo Horizontal (Mirror H)">
                  <SwapHorizIcon className="w-4 h-4" />
                </Button>
                <Button onClick={handleMirrorVertical} size="sm" variant="secondary" title="Espejo Vertical (Mirror V)">
                  <SwapVertIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="w-full overflow-auto p-1" style={{ maxHeight: 'max(240px, calc(100vh - 300px))' }}>
              <div className="w-max mx-auto">
                <PixelGrid
                  pixelData={tile.data}
                  tileWidth={tile.width}
                  tileHeight={tile.height}
                  lineAttributes={tile.lineAttributes || []}
                  onGridInteraction={handleGridInteraction}
                  pixelSize={zoom}
                  showCenterGuide={showCenterGuide}
                  showGrid8x8={showGrid8x8}
                  selectedGrid8x8Cell={logicalEditScope === 'char' ? selectedLogicalChar : null}
                  selectedGrid8x8Cells={logicalEditScope === 'char' ? selectedLogicalCharCells : []}
                  currentScreenMode={currentScreenMode}
                  symmetrySettings={symmetrySettings}
                  currentTool={currentTool}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span>Zoom:</span>
              <input type="range" min="2" max="40" value={zoom} onChange={(e) => setZoom(parseInt(e.target.value))} className="w-24 accent-msx-accent" />
              <label><input type="checkbox" checked={showCenterGuide} onChange={() => setShowCenterGuide(s => !s)} /> Guide</label>
            </div>
            <div className="p-1 bg-msx-panelbg rounded border border-msx-border text-xs flex flex-wrap gap-1 items-center">
              <span className="text-msx-textsecondary mr-1">Symmetry:</span>
              <Tooltip text="Toggle Horizontal Symmetry"><Button onClick={() => toggleSymmetry('horizontal')} className={symmetryButtonClass(symmetrySettings.horizontal)}>H</Button></Tooltip>
              <Tooltip text="Toggle Vertical Symmetry"><Button onClick={() => toggleSymmetry('vertical')} className={symmetryButtonClass(symmetrySettings.vertical)}>V</Button></Tooltip>
              <Tooltip text="Toggle Diagonal Symmetry (\)"><Button onClick={() => toggleSymmetry('diagonalMain')} className={symmetryButtonClass(symmetrySettings.diagonalMain)}>D1</Button></Tooltip>
              <Tooltip text="Toggle Anti-Diagonal Symmetry (/)"><Button onClick={() => toggleSymmetry('diagonalAnti')} className={symmetryButtonClass(symmetrySettings.diagonalAnti)}>D2</Button></Tooltip>
              <Tooltip text="Toggle Quad Symmetry (4-way)"><Button onClick={() => toggleSymmetry('quadMirror')} className={symmetryButtonClass(symmetrySettings.quadMirror)}>Quad</Button></Tooltip>
              <Button onClick={clearAllSymmetry} className="px-1.5 py-0.5 text-[0.65rem] bg-msx-danger text-white hover:bg-opacity-80">Off</Button>
            </div>
          </>
        }
        columnaDerecha={
          <>
            {currentScreenMode === "SCREEN 2 (Graphics I)" && tile.lineAttributes && (
              <LineAttributeEditorPanel
                tile={tile}
                onUpdateLineAttribute={handleUpdateLineAttribute}
                selectedPaletteColor={selectedColor as MSX1ColorValue}
                onCopyAttributes={handleCopyAttributes}
                onPasteAttributes={handlePasteAttributes}
                copiedAttribute={copiedAttribute}
                onFillAllFg={(color) => handleFillAll('fg', color)}
                onFillAllBg={(color) => handleFillAll('bg', color)}
              />
            )}
          </>
        }
      />
      {isGeneratorModalOpen && (
        <TextureGeneratorModal
          isOpen={isGeneratorModalOpen}
          onClose={() => setIsGeneratorModalOpen(false)}
          onGenerate={handleGenerateTexture}
          currentTile={tile}
          currentScreenMode={currentScreenMode}
          params={generatorParams}
          onParamsChange={setGeneratorParams}
          screen5PaletteForPicker={screen5PaletteForPicker}
        />
      )}
    </Panel>
  );
};

