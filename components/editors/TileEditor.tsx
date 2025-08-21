import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Tile, MSXColorValue, PixelData, Point, LineColorAttribute, MSX1ColorValue, MSX1Color, SymmetrySettings, ProjectAsset, DataFormat, TileLogicalProperties, DrawingTool, DITHER_BRUSH_DIAMETERS, DitherBrushDiameter, SolidityTypeId, SOLIDITY_TYPES, PROPERTY_FLAGS, PropertyFlagKey, TextureGeneratorType, RockGeneratorParams, BrickGeneratorParams, LadderGeneratorParams, AllGeneratorParams, CellBarsGeneratorParams, IceGeneratorParams, GrassGeneratorParams, StylizedGrassGeneratorParams } from '../../types';
import { Panel } from '../common/Panel';
import { 
  EDITABLE_TILE_DIMENSIONS, MSX1_PALETTE, MSX1_PALETTE_MAP, MSX1_PALETTE_IDX_MAP,
  SCREEN2_PIXELS_PER_COLOR_SEGMENT, DEFAULT_SCREEN2_FG_COLOR, DEFAULT_SCREEN2_BG_COLOR,
  DEFAULT_SCREEN2_FG_COLOR_INDEX, DEFAULT_SCREEN2_BG_COLOR_INDEX, MSX_SCREEN5_PALETTE, EDITOR_BASE_TILE_DIM_S2
} from '../../constants';
import { Button } from '../common/Button';
import { PencilIcon, FireIcon as FloodFillIcon, SaveFloppyIcon, PatternBrushIcon, TilesetIcon as SplitIcon, CopyIcon, PasteIcon, SparklesIcon } from '../icons/MsxIcons'; 
import { TileFileOperationsModal } from '../modals/TileFileOperationsModal';
import { createDefaultLineAttributes } from '../utils/tileUtils';


// Helper to resize PixelData (Pattern)
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

// Helper to resize LineAttributes
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


interface PixelGridProps { 
  pixelData: PixelData;
  tileWidth: number;
  tileHeight: number;
  lineAttributes: LineColorAttribute[][];
  onGridInteraction: (point: Point, isRightClick: boolean) => void; 
  pixelSize?: number;
  showCenterGuide?: boolean; 
  currentScreenMode: string;
  symmetrySettings: SymmetrySettings;
  currentTool: DrawingTool;
}

const PixelGrid: React.FC<PixelGridProps> = ({ 
  pixelData, tileWidth, tileHeight, lineAttributes, onGridInteraction, 
  pixelSize = 20, showCenterGuide, currentScreenMode, symmetrySettings, currentTool
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
      gridLines.push(<div key="sym-diag-main" className="absolute origin-top-left" style={{ backgroundColor: centerColor, top: 0, left: 0, width: lineWidth, height: Math.sqrt(2) * Math.max(tileWidth, tileHeight) * pixelSize, transform: `rotate(45deg) translateX(${-(Math.sqrt(2) * Math.max(tileWidth, tileHeight) * pixelSize - Math.max(tileWidth,tileHeight)*pixelSize)/4}px) translateY(${-(Math.sqrt(2) * Math.max(tileWidth, tileHeight) * pixelSize - Math.max(tileWidth,tileHeight)*pixelSize)/4}px)` }} />);
    }
    if (symmetrySettings.diagonalAnti && tileWidth === tileHeight) { 
        gridLines.push(<div key="sym-diag-anti" className="absolute origin-top-right" style={{ backgroundColor: centerColor, top: 0, right: 0, width: lineWidth, height: Math.sqrt(2) * tileWidth*pixelSize, transform: `rotate(-45deg) translateX(${(Math.sqrt(2) * tileWidth * pixelSize - tileWidth*pixelSize)/4}px) translateY(${-(Math.sqrt(2) * tileWidth * pixelSize - tileWidth*pixelSize)/4}px)`}} />);
    }
  }


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
              onMouseDown={(e) => handleMouseDown(x,y,e)}
              onMouseEnter={() => handleMouseEnter(x,y)}
              title={!isValidPixel ? `Invalid color for segment! Allowed: ${lineAttributes[y]?.[Math.floor(x/SCREEN2_PIXELS_PER_COLOR_SEGMENT)]?.fg}, ${lineAttributes[y]?.[Math.floor(x/SCREEN2_PIXELS_PER_COLOR_SEGMENT)]?.bg}` : `(${x},${y}) Tool: ${currentTool}`}
            />
          );
        })
      )}
    </div>
  );
};


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
    <Panel title="SCREEN 2 Line Color Attributes" className="max-h-96 overflow-y-auto">
      <p className="text-xs text-msx-textsecondary mb-2 p-1">
        Define 2 colors (Foreground/Background) for each 8-pixel segment of each row.
        Selected palette color <div className="inline-block w-3 h-3 border border-msx-border" style={{backgroundColor: selectedPaletteColor}}></div> will be used.
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
              <th key={segIdx} colSpan={3} className="p-1 border border-msx-border">Segment {segIdx} (px {segIdx*8}-{segIdx*8+7})</th>
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
                    title={`Set FG to ${MSX1_PALETTE_MAP.get(selectedPaletteColor)?.name || selectedPaletteColor }`}
                  >
                    <span className="mix-blend-difference text-white text-[0.6rem]">{MSX1_PALETTE_MAP.get(attr.fg)?.index ?? '?'}</span>
                  </td>
                  <td 
                    className="p-1 border border-msx-border cursor-pointer hover:ring-1 ring-msx-accent" 
                    style={{ backgroundColor: attr.bg }}
                    onClick={() => handleSetColor(rowIndex, segmentIndex, 'bg')}
                    title={`Set BG to ${MSX1_PALETTE_MAP.get(selectedPaletteColor)?.name || selectedPaletteColor }`}
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

interface TechnicalPreviewPanelProps { 
  tile: Tile;
  dataFormat: DataFormat;
}

const TechnicalPreviewPanel: React.FC<TechnicalPreviewPanelProps> = ({tile, dataFormat}) => {
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
    <Panel title="Technical Preview (SCREEN 2)" className="mt-2">
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

interface CopiedTileBuffer {
  data: PixelData;
  lineAttributes?: LineColorAttribute[][];
  width: number;
  height: number;
}


// --- REWRITTEN TEXTURE GENERATOR ---

interface TextureGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (pixelData: PixelData) => void;
    currentTile: Tile;
    currentScreenMode: string;
    params: AllGeneratorParams;
    onParamsChange: (newParams: AllGeneratorParams) => void;
}

interface PalettePickerProps {
    label: string;
    selectedColor: MSXColorValue;
    onChange: (color: MSXColorValue) => void;
    palette: { name: string; hex: string; index?: number }[];
}

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


const TextureGeneratorModal: React.FC<TextureGeneratorModalProps> = ({ isOpen, onClose, onGenerate, currentTile, currentScreenMode, params, onParamsChange }) => {
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
                           const isEdgeX = effectiveX % (brickParams.brickWidth + brickParams.mortarThickness) >= brickParams.mortarThickness -1 && effectiveX % (brickParams.brickWidth + brickParams.mortarThickness) < brickParams.mortarThickness + 1;
                           const isEdgeY = y % (brickParams.brickHeight + brickParams.mortarThickness) >= brickParams.mortarThickness -1 && y % (brickParams.brickHeight + brickParams.mortarThickness) < brickParams.mortarThickness + 1;
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
                if (newData[flowerY+1]?.[flowerX]) newData[flowerY+1][flowerX] = detailColor;
                if (newData[flowerY]?.[flowerX+1]) newData[flowerY][flowerX+1] = detailColor;
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
                        {(['Rock', 'Brick', 'Ladder', 'CellBars', 'Ice', 'Grass', 'StylizedGrass'] as TextureGeneratorType[]).map(type => (
                            <Button key={type} onClick={() => setGeneratorType(type)} variant={generatorType === type ? 'primary' : 'ghost'}>{type}</Button>
                        ))}
                    </div>
                    {generatorType === 'Rock' ? (
                        <div className="space-y-2">
                           {!isScreen2 ? (
                                <>
                                <PalettePicker label="Base Color:" selectedColor={rockParams.baseColor} onChange={color => onParamsChange({...params, Rock: {...rockParams, baseColor: color}})} palette={MSX_SCREEN5_PALETTE} />
                                <PalettePicker label="Highlight Color:" selectedColor={rockParams.highlightColor} onChange={color => onParamsChange({...params, Rock: {...rockParams, highlightColor: color}})} palette={MSX_SCREEN5_PALETTE} />
                                <PalettePicker label="Shadow Color:" selectedColor={rockParams.shadowColor} onChange={color => onParamsChange({...params, Rock: {...rockParams, shadowColor: color}})} palette={MSX_SCREEN5_PALETTE} />
                                </>
                            ) : (
                                <p className="text-xs text-msx-textsecondary p-1 border border-dashed border-msx-border rounded">
                                    Rock texture will use the tile's per-segment <strong>Foreground</strong> and <strong>Background</strong> colors. Density controls the amount of 'rock' (FG) vs 'empty space' (BG).
                                </p>
                            )}
                           <div><label>Density ({rockParams.density}%):</label><input type="range" min="1" max="100" value={rockParams.density} onChange={e => onParamsChange({...params, Rock: {...rockParams, density: parseInt(e.target.value)}})} className="w-full"/></div>
                           <label className="flex items-center space-x-2 text-msx-textsecondary cursor-pointer pt-1">
                               <input type="checkbox" checked={rockParams.seamless} onChange={e => onParamsChange({...params, Rock: {...rockParams, seamless: e.target.checked}})} className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"/>
                               <span>Seamless Tiling (Removes top/right border)</span>
                           </label>
                        </div>
                    ) : generatorType === 'Brick' ? (
                        <div className="space-y-2">
                            {!isScreen2 ? (
                                <>
                                <PalettePicker label="Brick Color:" selectedColor={brickParams.brickColor} onChange={color => onParamsChange({...params, Brick: {...brickParams, brickColor: color}})} palette={MSX_SCREEN5_PALETTE} />
                                <PalettePicker label="Mortar Color:" selectedColor={brickParams.mortarColor} onChange={color => onParamsChange({...params, Brick: {...brickParams, mortarColor: color}})} palette={MSX_SCREEN5_PALETTE} />
                                </>
                            ) : (
                                <p className="text-xs text-msx-textsecondary p-1 border border-dashed border-msx-border rounded">
                                   Brick texture uses <strong>Foreground</strong> for bricks and <strong>Background</strong> for mortar, based on the tile's line color attributes.
                                </p>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                                <div><label>Brick W:</label><input type="number" min="2" value={brickParams.brickWidth} onChange={e => onParamsChange({...params, Brick: {...brickParams, brickWidth: parseInt(e.target.value)}})} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/></div>
                                <div><label>Brick H:</label><input type="number" min="2" value={brickParams.brickHeight} onChange={e => onParamsChange({...params, Brick: {...brickParams, brickHeight: parseInt(e.target.value)}})} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/></div>
                            </div>
                            <div><label>Mortar Size:</label><input type="number" min="1" value={brickParams.mortarThickness} onChange={e => onParamsChange({...params, Brick: {...brickParams, mortarThickness: parseInt(e.target.value)}})} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/></div>
                            <div><label>Row Offset ({(brickParams.rowOffset*100).toFixed(0)}%):</label><input type="range" min="0" max="1" step="0.05" value={brickParams.rowOffset} onChange={e => onParamsChange({...params, Brick: {...brickParams, rowOffset: parseFloat(e.target.value)}})} className="w-full"/></div>
                            {!isScreen2 && (
                                <div><label>Edge Variation ({brickParams.edgeVariation}%):</label><input type="range" min="0" max="100" value={brickParams.edgeVariation} onChange={e => onParamsChange({...params, Brick: {...brickParams, edgeVariation: parseInt(e.target.value)}})} className="w-full"/></div>
                            )}
                        </div>
                    ) : generatorType === 'Ladder' ? (
                         <div className="space-y-2">
                            {!isScreen2 ? (
                                <>
                                <PalettePicker label="Rail Color:" selectedColor={ladderParams.railColor} onChange={color => onParamsChange({...params, Ladder: {...ladderParams, railColor: color}})} palette={MSX_SCREEN5_PALETTE} />
                                <PalettePicker label="Rung Color:" selectedColor={ladderParams.rungColor} onChange={color => onParamsChange({...params, Ladder: {...ladderParams, rungColor: color}})} palette={MSX_SCREEN5_PALETTE} />
                                <PalettePicker label="Background Color:" selectedColor={ladderParams.backgroundColor} onChange={color => onParamsChange({...params, Ladder: {...ladderParams, backgroundColor: color}})} palette={MSX_SCREEN5_PALETTE} />
                                </>
                            ) : (
                                <p className="text-xs text-msx-textsecondary p-1 border border-dashed border-msx-border rounded">
                                   Ladder texture uses <strong>Foreground</strong> for rails/rungs and <strong>Background</strong> for empty space, based on the tile's line color attributes.
                                </p>
                            )}
                             <div className="grid grid-cols-2 gap-2">
                                <div><label>Rail Width (px):</label><input type="number" min="1" max="2" value={ladderParams.railWidth} onChange={e => onParamsChange({...params, Ladder: {...ladderParams, railWidth: parseInt(e.target.value)}})} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/></div>
                                <div><label>Rung Height (px):</label><input type="number" min="1" max="2" value={ladderParams.rungHeight} onChange={e => onParamsChange({...params, Ladder: {...ladderParams, rungHeight: parseInt(e.target.value)}})} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/></div>
                             </div>
                             <div><label>Rung Spacing (px):</label><input type="number" min="1" max="8" value={ladderParams.rungSpacing} onChange={e => onParamsChange({...params, Ladder: {...ladderParams, rungSpacing: parseInt(e.target.value)}})} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/></div>
                             <div><label>Rail Inset (px):</label><input type="number" min="0" max="3" value={ladderParams.railInset} onChange={e => onParamsChange({...params, Ladder: {...ladderParams, railInset: parseInt(e.target.value)}})} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded"/></div>
                             <div><label>Rung Style:</label><div className="flex space-x-1 mt-0.5"><Button size="sm" variant={ladderParams.style==='solid' ? 'secondary':'ghost'} onClick={()=>onParamsChange({...params, Ladder: {...ladderParams, style: 'solid'}})}>Solid</Button><Button size="sm" variant={ladderParams.style==='dashed' ? 'secondary':'ghost'} onClick={()=>onParamsChange({...params, Ladder: {...ladderParams, style: 'dashed'}})}>Dashed</Button></div></div>
                        </div>
                    ) : generatorType === 'Ice' ? (
                        <div className="space-y-2">
                           {!isScreen2 ? (
                                <>
                                <PalettePicker label="Base Color:" selectedColor={iceParams.baseColor} onChange={color => onParamsChange({...params, Ice: {...iceParams, baseColor: color}})} palette={MSX_SCREEN5_PALETTE} />
                                <PalettePicker label="Crack Color:" selectedColor={iceParams.crackColor} onChange={color => onParamsChange({...params, Ice: {...iceParams, crackColor: color}})} palette={MSX_SCREEN5_PALETTE} />
                                <PalettePicker label="Shine Color:" selectedColor={iceParams.shineColor} onChange={color => onParamsChange({...params, Ice: {...iceParams, shineColor: color}})} palette={MSX_SCREEN5_PALETTE} />
                                </>
                            ) : (
                                <p className="text-xs text-msx-textsecondary p-1 border border-dashed border-msx-border rounded">
                                    Ice texture uses <strong>Background</strong> for base and <strong>Foreground</strong> for cracks/shine.
                                </p>
                            )}
                           <div><label>Crack Density ({(iceParams.crackDensity*100).toFixed(0)}%):</label><input type="range" min="0" max="1" step="0.05" value={iceParams.crackDensity} onChange={e => onParamsChange({...params, Ice: {...iceParams, crackDensity: parseFloat(e.target.value)}})} className="w-full"/></div>
                        </div>
                    ) : generatorType === 'Grass' ? (
                         <div className="space-y-2">
                           {!isScreen2 ? (
                                <>
                                <PalettePicker label="Base Grass Color:" selectedColor={grassParams.baseGrassColor} onChange={color => onParamsChange({...params, Grass: {...grassParams, baseGrassColor: color}})} palette={MSX_SCREEN5_PALETTE} />
                                <PalettePicker label="Shadow/Blade Color:" selectedColor={grassParams.shadowGrassColor} onChange={color => onParamsChange({...params, Grass: {...grassParams, shadowGrassColor: color}})} palette={MSX_SCREEN5_PALETTE} />
                                <PalettePicker label="Detail (Flower) Color:" selectedColor={grassParams.detailColor} onChange={color => onParamsChange({...params, Grass: {...grassParams, detailColor: color}})} palette={MSX_SCREEN5_PALETTE} />
                                </>
                            ) : (
                                <p className="text-xs text-msx-textsecondary p-1 border border-dashed border-msx-border rounded">
                                    Grass uses <strong>FG</strong> for base grass/details and <strong>BG</strong> for shadows/blades.
                                </p>
                            )}
                           <div><label>Flower Probability ({(grassParams.detailProbability*100).toFixed(0)}%):</label><input type="range" min="0" max="1" step="0.05" value={grassParams.detailProbability} onChange={e => onParamsChange({...params, Grass: {...grassParams, detailProbability: parseFloat(e.target.value)}})} className="w-full"/></div>
                        </div>
                    ) : generatorType === 'StylizedGrass' ? (
                        <div className="space-y-2">
                            {!isScreen2 ? (
                                <>
                                <PalettePicker label="Light Grass Color:" selectedColor={stylizedGrassParams.lightGrassColor} onChange={color => onParamsChange({...params, StylizedGrass: {...stylizedGrassParams, lightGrassColor: color}})} palette={MSX_SCREEN5_PALETTE} />
                                <PalettePicker label="Dark Grass Color:" selectedColor={stylizedGrassParams.darkGrassColor} onChange={color => onParamsChange({...params, StylizedGrass: {...stylizedGrassParams, darkGrassColor: color}})} palette={MSX_SCREEN5_PALETTE} />
                                </>
                             ) : (
                                <p className="text-xs text-msx-textsecondary p-1 border border-dashed border-msx-border rounded">
                                    Stylized grass uses <strong>FG</strong> for light blades and <strong>BG</strong> for the darker base.
                                </p>
                            )}
                            <div><label>Blade Density ({(stylizedGrassParams.bladeDensity*100).toFixed(0)}%):</label><input type="range" min="0.1" max="1" step="0.05" value={stylizedGrassParams.bladeDensity} onChange={e => onParamsChange({...params, StylizedGrass: {...stylizedGrassParams, bladeDensity: parseFloat(e.target.value)}})} className="w-full"/></div>
                            <div>
                                <label>Blade Style:</label>
                                <select value={stylizedGrassParams.style} onChange={e => onParamsChange({...params, StylizedGrass: {...stylizedGrassParams, style: e.target.value as any}})} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded">
                                    <option value="wavy">Wavy</option>
                                    <option value="straight">Straight</option>
                                    <option value="random">Random</option>
                                </select>
                            </div>
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
                                        <PalettePicker label="Bar Color:" selectedColor={cellParams.barColor} onChange={color => onParamsChange({...params, CellBars: {...cellParams, barColor: color}})} palette={MSX_SCREEN5_PALETTE} />
                                        <PalettePicker label="Background Color:" selectedColor={cellParams.backgroundColor} onChange={color => onParamsChange({...params, CellBars: {...cellParams, backgroundColor: color}})} palette={MSX_SCREEN5_PALETTE} />
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
                                                onParamsChange({...params, CellBars: {...cellParams, barCount: newCount, barThickness: newThickness }});
                                            }} 
                                            className="w-full"/>
                                    </div>
                                    <div>
                                        <label>Bar Thickness ({cellParams.barThickness}px):</label>
                                        <input type="range" min="1" max={maxThicknessForCurrentBars} step="1" value={cellParams.barThickness}
                                             onChange={e => onParamsChange({...params, CellBars: {...cellParams, barThickness: parseInt(e.target.value)}})} 
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
                                                onParamsChange({...params, CellBars: {...cellParams, hasOutline: newHasOutline, barCount: newBarCount, barThickness: newThickness }})
                                            }}
                                            className="form-checkbox bg-msx-bgcolor border-msx-border text-msx-accent focus:ring-msx-accent"/>
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


interface TileEditorProps {
  currentTile: Tile;
  onUpdateCurrentTile: (data: Partial<Tile>, newAssetsToCreate?: ProjectAsset[]) => void;
  allTileAssets: ProjectAsset[];
  onUpdateAllTileAssets: (newTiles: ProjectAsset[]) => void;
  selectedColor: MSXColorValue;
  currentScreenMode: string;
  dataOutputFormat: DataFormat;
  copiedTileData: CopiedTileBuffer | null;
  onCopyTileData: (tile: Tile) => void;
  setStatusBarMessage: (message: string) => void;
}

const defaultLogicalProps: TileLogicalProperties = {
  mapId: 0, familyId: 0, instanceId: 0,
  isSolid: false, isBreakable: false, isMovable: false, causesDamage: false, isInteractiveSwitch: false,
};

export const TileEditor: React.FC<TileEditorProps> = ({ 
    currentTile: tile, onUpdateCurrentTile: onUpdate, 
    allTileAssets, onUpdateAllTileAssets,
    selectedColor, currentScreenMode,
    dataOutputFormat, copiedTileData, onCopyTileData, setStatusBarMessage
}) => {
  const [zoom, setZoom] = useState(20); 
  const [showCenterGuide, setShowCenterGuide] = useState(true); 
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
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  
  const isScreen2 = currentScreenMode === "SCREEN 2 (Graphics I)";
  
  const [generatorParams, setGeneratorParams] = useState<AllGeneratorParams>(() => ({
      Rock: {
          baseColor: isScreen2 ? MSX1_PALETTE[14].hex : MSX_SCREEN5_PALETTE[14].hex,
          highlightColor: isScreen2 ? MSX1_PALETTE[15].hex : MSX_SCREEN5_PALETTE[15].hex,
          shadowColor: isScreen2 ? MSX1_PALETTE[1].hex : MSX_SCREEN5_PALETTE[1].hex,
          density: 50,
          seamless: true,
      },
      Brick: {
          brickColor: isScreen2 ? MSX1_PALETTE[6].hex : MSX_SCREEN5_PALETTE[6].hex,
          mortarColor: isScreen2 ? MSX1_PALETTE[14].hex : MSX_SCREEN5_PALETTE[14].hex,
          brickWidth: 8,
          brickHeight: 4,
          mortarThickness: 1,
          rowOffset: 0.5,
          edgeVariation: 10,
      },
      Ladder: {
          railColor: isScreen2 ? MSX1_PALETTE[10].hex : MSX_SCREEN5_PALETTE[10].hex,
          rungColor: isScreen2 ? MSX1_PALETTE[10].hex : MSX_SCREEN5_PALETTE[10].hex,
          backgroundColor: 'transparent',
          railWidth: 1,
          rungHeight: 1,
          rungSpacing: 3,
          railInset: 1,
          style: 'solid',
      },
      CellBars: {
          barColor: isScreen2 ? MSX1_PALETTE[15].hex : MSX_SCREEN5_PALETTE[15].hex,
          backgroundColor: isScreen2 ? MSX1_PALETTE[0].hex : 'transparent',
          barCount: 3,
          barThickness: 1,
          hasOutline: true,
      },
      Ice: {
        baseColor: isScreen2 ? MSX1_PALETTE[5].hex : '#B4FFFF', // Light Blue
        crackColor: isScreen2 ? MSX1_PALETTE[7].hex : '#00C4C4', // Cyan
        shineColor: isScreen2 ? MSX1_PALETTE[15].hex : '#FFFFFF', // White
        crackDensity: 0.4,
      },
      Grass: {
          baseGrassColor: isScreen2 ? MSX1_PALETTE[3].hex : '#3AD84A', // Light Green
          shadowGrassColor: isScreen2 ? MSX1_PALETTE[12].hex : '#1E8C28', // Dark Green
          detailColor: isScreen2 ? MSX1_PALETTE[9].hex : '#FF7373', // Light Red
          detailProbability: 0.15,
      },
      StylizedGrass: {
          lightGrassColor: isScreen2 ? MSX1_PALETTE[2].hex : '#5EF75A', // Medium Green
          darkGrassColor: isScreen2 ? MSX1_PALETTE[12].hex : '#2A7D2E', // Dark Green
          bladeDensity: 0.6,
          style: 'wavy',
      }
  }));


  useEffect(() => {
    const props = tile.logicalProperties || defaultLogicalProps;
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
  }, [tile.logicalProperties]);
  

  useEffect(() => {
    if (currentScreenMode === "SCREEN 2 (Graphics I)" && tile.width % SCREEN2_PIXELS_PER_COLOR_SEGMENT !== 0) {
      const newWidth = Math.max(SCREEN2_PIXELS_PER_COLOR_SEGMENT, Math.floor(tile.width / SCREEN2_PIXELS_PER_COLOR_SEGMENT) * SCREEN2_PIXELS_PER_COLOR_SEGMENT);
      if (newWidth !== tile.width) {
         console.warn(`Tile width ${tile.width} not multiple of ${SCREEN2_PIXELS_PER_COLOR_SEGMENT} for SCREEN 2. Adjusting to ${newWidth}.`);
         handleDimensionChange(newWidth, tile.height);
      }
    }
  }, [tile.width, currentScreenMode, tile.height]); 


  const handleDimensionChange = (newWidth: number, newHeight: number) => {
    if (newWidth === tile.width && newHeight === tile.height) return;
    
    let newPixelData: PixelData;
    let newLineAttributes: LineColorAttribute[][] | undefined = undefined;

    if (currentScreenMode === "SCREEN 2 (Graphics I)") {
      const defaultFg = tile.lineAttributes?.[0]?.[0]?.fg || DEFAULT_SCREEN2_FG_COLOR;
      const defaultBg = tile.lineAttributes?.[0]?.[0]?.bg || DEFAULT_SCREEN2_BG_COLOR;
      
      newLineAttributes = resizeLineAttributes(tile.lineAttributes, tile.width, tile.height, newWidth, newHeight, defaultFg, defaultBg);
      const initialColorForResize = newLineAttributes[0]?.[0]?.fg || defaultFg;
      newPixelData = resizePixelPatternData(tile.data, tile.width, tile.height, newWidth, newHeight, initialColorForResize);
      
      for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < newWidth; x++) {
          const segmentIndex = Math.floor(x / SCREEN2_PIXELS_PER_COLOR_SEGMENT);
          const attr = newLineAttributes[y]?.[segmentIndex];
          if (attr) {
            if (x >= tile.width || y >= tile.height) {
              newPixelData[y][x] = attr.fg;
            } else {
              const currentResizedPixel = newPixelData[y][x];
              if (currentResizedPixel !== attr.fg && currentResizedPixel !== attr.bg) {
                newPixelData[y][x] = attr.fg;
              }
            }
          }
        }
      }
    } else { 
      newPixelData = resizePixelPatternData(tile.data, tile.width, tile.height, newWidth, newHeight, selectedColor);
    }
    onUpdate({ width: newWidth, height: newHeight, data: newPixelData, lineAttributes: newLineAttributes });
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
      setCopiedAttribute({...tile.lineAttributes[rowIndex][segmentIndex]});
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
      const [x,y] = s.split(',').map(Number);
      return {x,y};
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
    return isRightClick ? MSX_SCREEN5_PALETTE[0].hex : primarySelectedColor; 
  }, []);


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
    
    while(queue.length > 0) {
        const current = queue.shift()!;
        const neighbors = [
            {x: current.x + 1, y: current.y}, {x: current.x - 1, y: current.y},
            {x: current.x, y: current.y + 1}, {x: current.x, y: current.y - 1},
        ];
        
        for(const neighbor of neighbors) {
            const { x: nx, y: ny } = neighbor;
            if (nx >= 0 && nx < W && ny >= 0 && ny < H && !visited[ny][nx] && newData[ny][nx] === targetColor) {
                visited[ny][nx] = true;
                const neighborFillColor = determineColorForPoint({x:nx, y:ny}, isRightClick, tile.lineAttributes, selectedColor, currentScreenMode);
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
                        const primaryDitherColor = selectedColor;
                        const secondaryDitherColor = MSX_SCREEN5_PALETTE[0].hex; // Transparent
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
  }, [tile.data, tile.width, tile.height, tile.lineAttributes, selectedColor, currentScreenMode, ditherBrushDiameter, onUpdate, getSymmetricPoints]);


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
          return rowAttrs[segmentIndex]?.fg || DEFAULT_SCREEN2_FG_COLOR;
        })
      );
    } else {
      const colorToClearWith = currentScreenMode === "SCREEN 2 (Graphics I)" ? DEFAULT_SCREEN2_FG_COLOR : selectedColor;
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

  
  const updateTileLogicalProperties = (newFamilyId?: SolidityTypeId, newFlagStates?: Record<PropertyFlagKey, boolean>) => {
    const familyIdToUse = newFamilyId !== undefined ? newFamilyId : selectedSolidityFamilyId;
    const flagsToUse = newFlagStates || flagStates;

    let newInstanceId = 0;
    for (const key in PROPERTY_FLAGS) {
      const flagKey = key as PropertyFlagKey;
      if (flagsToUse[flagKey]) {
        newInstanceId |= (1 << PROPERTY_FLAGS[flagKey].bit);
      }
    }
    
    const newMapId = (familyIdToUse << 4) | newInstanceId;
    const solidityTypeInfo = SOLIDITY_TYPES.find(st => st.id === familyIdToUse);
    const newIsSolid = solidityTypeInfo ? solidityTypeInfo.isSolid : false;

    const updatedLogicalProps: TileLogicalProperties = {
      ...(tile.logicalProperties || defaultLogicalProps),
      mapId: newMapId,
      familyId: familyIdToUse,
      instanceId: newInstanceId,
      isSolid: newIsSolid,
      isBreakable: flagsToUse.isBreakable,
      isMovable: flagsToUse.isMovable,
      causesDamage: flagsToUse.causesDamage,
      isInteractiveSwitch: flagsToUse.isInteractiveSwitch,
    };
    onUpdate({ logicalProperties: updatedLogicalProps });
  };
  
  const handleSolidityTypeChange = (newFamilyIdValue: SolidityTypeId) => {
    setSelectedSolidityFamilyId(newFamilyIdValue); 
    updateTileLogicalProperties(newFamilyIdValue, undefined); 
  };

  const handlePropertyFlagChange = (flagKey: PropertyFlagKey, newValue: boolean) => {
    const newFlags = { ...flagStates, [flagKey]: newValue };
    setFlagStates(newFlags); 
    updateTileLogicalProperties(undefined, newFlags);
  };
    
  const currentDisplayedMapId = (selectedSolidityFamilyId << 4) | 
      (Object.entries(flagStates).reduce((acc, [key, val]) => 
          val ? acc | (1 << PROPERTY_FLAGS[key as PropertyFlagKey].bit) : acc, 0));

  const handleSplitTile8x8 = () => {
    if (tile.width % 8 !== 0 || tile.height % 8 !== 0) {
        alert("Tile dimensions must be multiples of 8 to use 'Split 8x8'.");
        return;
    }
    const newAssetsToCreate: ProjectAsset[] = [];
    const numTilesX = tile.width / 8;
    const numTilesY = tile.height / 8;

    for (let ty = 0; ty < numTilesY; ty++) {
        for (let tx = 0; tx < numTilesX; tx++) {
            const newTilePixelData: PixelData = [];
            let newTileLineAttributes: LineColorAttribute[][] | undefined = undefined;

            if (currentScreenMode === "SCREEN 2 (Graphics I)") {
                newTileLineAttributes = [];
            }

            for (let pixelY = 0; pixelY < 8; pixelY++) {
                const originalPixelY = ty * 8 + pixelY;
                const newRow: MSXColorValue[] = [];
                const newRowAttrs: LineColorAttribute[] = [];

                for (let pixelX = 0; pixelX < 8; pixelX++) {
                    const originalPixelX = tx * 8 + pixelX;
                    if (tile.data[originalPixelY] && tile.data[originalPixelY][originalPixelX] !== undefined) {
                         newRow.push(tile.data[originalPixelY][originalPixelX]);
                    } else {
                         newRow.push(currentScreenMode === "SCREEN 2 (Graphics I)" ? DEFAULT_SCREEN2_FG_COLOR : MSX_SCREEN5_PALETTE[1].hex); // Fallback pixel
                    }
                }
                newTilePixelData.push(newRow);

                if (currentScreenMode === "SCREEN 2 (Graphics I)" && newTileLineAttributes && tile.lineAttributes) {
                    if (tile.lineAttributes[originalPixelY] && tile.lineAttributes[originalPixelY][tx]) {
                        newRowAttrs.push({...tile.lineAttributes[originalPixelY][tx]});
                    } else {
                        // Fallback if original attributes are missing for this segment (should not happen ideally)
                        newRowAttrs.push({ fg: DEFAULT_SCREEN2_FG_COLOR, bg: DEFAULT_SCREEN2_BG_COLOR });
                    }
                    newTileLineAttributes.push(newRowAttrs);
                }
            }

            const newTileId = `tile_split_${tile.id}_${tx}_${ty}_${Date.now()}`;
            const newTileName = `${tile.name}_part_${ty}_${tx}`;
            
            const newSplitTile: Tile = {
                id: newTileId,
                name: newTileName,
                width: 8,
                height: 8,
                data: newTilePixelData,
                lineAttributes: newTileLineAttributes,
                logicalProperties: { ...defaultLogicalProps } // New tiles get default logical props
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
        return MSX_SCREEN5_PALETTE[1].hex; 
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

import { TileEditorAdvancedLayout } from './TileEditorAdvancedLayout';

  return (
    <Panel title={`Tile Editor: ${tile.name} ${currentScreenMode === "SCREEN 2 (Graphics I)" ? "(SCREEN 2 Mode)" : ""}`} className="flex-grow flex flex-col p-2 bg-msx-bgcolor">
      <TileEditorAdvancedLayout
        columnaIzquierda={
          <>
            <Panel title="Tile Properties">
              <div className="space-y-2 text-xs">
                  <div>
                      <label>Tile Name:</label>
                      <input type="text" value={tile.name} onChange={(e) => onUpdate({name: e.target.value})} className="w-full p-1 bg-msx-bgcolor border-msx-border rounded" />
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
                  <div className="flex space-x-2 pt-1">
                      <Button onClick={handleCopyCurrentTile} size="sm" variant="secondary" icon={<CopyIcon/>}>Copy Tile</Button>
                      <Button onClick={handlePasteTileData} size="sm" variant="secondary" icon={<PasteIcon/>} disabled={!copiedTileData}>Paste Data</Button>
                      <Button onClick={handleSplitTile8x8} size="sm" variant="secondary" icon={<SplitIcon/>}>Split 8x8</Button>
                      <Button onClick={() => setIsGeneratorModalOpen(true)} size="sm" variant="secondary" icon={<SparklesIcon/>}>Generator</Button>
                  </div>
              </div>
            </Panel>

            <Panel title="Logical Properties (Collision/Behavior)">
              <div className="space-y-2 text-xs">
                    <p className="text-[0.65rem] text-msx-textsecondary">Define gameplay attributes for this tile. These are exported in the Behavior Map.</p>
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
                      Final Map ID Byte: <span className="font-mono text-msx-highlight">{currentDisplayedMapId}</span> (Hex: <span className="font-mono text-msx-highlight">0x{currentDisplayedMapId.toString(16).padStart(2,'0').toUpperCase()}</span>)
                  </div>
              </div>
            </Panel>
            {currentScreenMode === "SCREEN 2 (Graphics I)" && tile.lineAttributes && (
              <TechnicalPreviewPanel tile={tile} dataFormat={dataOutputFormat} />
            )}
          </>
        }
        columnaCentral={
          <>
            <div className="flex flex-wrap items-center gap-2 p-2 bg-msx-panelbg rounded border border-msx-border">
              <div className="flex items-center space-x-1">
                <label className="text-xs">Tool:</label>
                <Button onClick={() => setCurrentTool('pencil')} className={toolButtonClass('pencil')} title="Pencil (Draw/Erase)"><PencilIcon className="w-4 h-4" /></Button>
                <Button onClick={() => setCurrentTool('floodfill')} className={toolButtonClass('floodfill')} title="Flood Fill"><FloodFillIcon className="w-4 h-4" /></Button>
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
              <Button onClick={() => setIsFileModalOpen(true)} size="sm" variant="secondary" icon={<SaveFloppyIcon/>} className="ml-auto">File Ops</Button>
            </div>
            <PixelGrid
              pixelData={tile.data}
              tileWidth={tile.width}
              tileHeight={tile.height}
              lineAttributes={tile.lineAttributes || []}
              onGridInteraction={handleGridInteraction}
              pixelSize={zoom}
              showCenterGuide={showCenterGuide}
              currentScreenMode={currentScreenMode}
              symmetrySettings={symmetrySettings}
              currentTool={currentTool}
            />
            <div className="flex items-center space-x-2 text-xs">
              <span>Zoom:</span>
              <input type="range" min="8" max="40" value={zoom} onChange={(e) => setZoom(parseInt(e.target.value))} className="w-24 accent-msx-accent" />
              <label><input type="checkbox" checked={showCenterGuide} onChange={() => setShowCenterGuide(s => !s)} /> Guide</label>
            </div>
            <div className="p-1 bg-msx-panelbg rounded border border-msx-border text-xs flex flex-wrap gap-1 items-center">
                  <span className="text-msx-textsecondary mr-1">Symmetry:</span>
                  <Button onClick={() => toggleSymmetry('horizontal')} className={symmetryButtonClass(symmetrySettings.horizontal)}>H</Button>
                  <Button onClick={() => toggleSymmetry('vertical')} className={symmetryButtonClass(symmetrySettings.vertical)}>V</Button>
                  <Button onClick={() => toggleSymmetry('diagonalMain')} className={symmetryButtonClass(symmetrySettings.diagonalMain)}>D1</Button>
                  <Button onClick={() => toggleSymmetry('diagonalAnti')} className={symmetryButtonClass(symmetrySettings.diagonalAnti)}>D2</Button>
                  <Button onClick={() => toggleSymmetry('quadMirror')} className={symmetryButtonClass(symmetrySettings.quadMirror)}>Quad</Button>
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
      {isFileModalOpen && (
        <TileFileOperationsModal 
            isOpen={isFileModalOpen} 
            onClose={() => setIsFileModalOpen(false)} 
            allTileAssets={allTileAssets}
            onUpdateAllTileAssets={onUpdateAllTileAssets}
            currentTile={tile}
            currentScreenMode={currentScreenMode}
            dataOutputFormat={dataOutputFormat}
        />
      )}
      {isGeneratorModalOpen && (
          <TextureGeneratorModal
            isOpen={isGeneratorModalOpen}
            onClose={() => setIsGeneratorModalOpen(false)}
            onGenerate={handleGenerateTexture}
            currentTile={tile}
            currentScreenMode={currentScreenMode}
            params={generatorParams}
            onParamsChange={setGeneratorParams}
          />
      )}
    </Panel>
  );
};
