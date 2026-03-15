import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PresentationScreenCellCoordinate, PresentationScreenConfig, PresentationScreenEditableTile } from '../../types';
import { Button } from '../common/Button';
import { Panel } from '../common/Panel';
import { MapIcon, TrashIcon } from '../icons/MsxIcons';
import {
  applyEditedPresentationTile,
  convertImageDataToPresentationScreen,
  decodePresentationCharToEditableTile,
  drawPresentationScreenPreview,
  getPresentationScreenCellInfo,
  hasPresentationScreenData,
  SCREEN2_HEIGHT,
  SCREEN2_WIDTH,
  TILES_X,
  TILES_Y,
} from '../utils/presentationScreenUtils';
import { DEFAULT_PRESENTATION_SCREEN_CONFIG } from '../../constants';
import { PresentationScreenTileEditor } from './PresentationScreenTileEditor';

interface PresentationScreenEditorProps {
  presentationScreen: PresentationScreenConfig;
  onUpdatePresentationScreen: (
    updater: PresentationScreenConfig | ((prev: PresentationScreenConfig) => PresentationScreenConfig)
  ) => void;
}

function loadImageDataFromFile(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el PNG seleccionado.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('El archivo no es una imagen PNG valida.'));
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo preparar el canvas para importar el PNG.'));
          return;
        }
        ctx.drawImage(image, 0, 0);
        resolve(ctx.getImageData(0, 0, image.width, image.height));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function sameCell(a: PresentationScreenCellCoordinate | null, b: PresentationScreenCellCoordinate | null): boolean {
  return !!a && !!b && a.x === b.x && a.y === b.y;
}

function getCellFromPointerEvent(
  event: React.MouseEvent<HTMLDivElement>,
): PresentationScreenCellCoordinate | null {
  const rect = event.currentTarget.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  const rawX = Math.floor(((event.clientX - rect.left) / rect.width) * TILES_X);
  const rawY = Math.floor(((event.clientY - rect.top) / rect.height) * TILES_Y);
  const x = Math.max(0, Math.min(TILES_X - 1, rawX));
  const y = Math.max(0, Math.min(TILES_Y - 1, rawY));

  return { x, y };
}

export const PresentationScreenEditor: React.FC<PresentationScreenEditorProps> = ({
  presentationScreen,
  onUpdatePresentationScreen,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<PresentationScreenCellCoordinate | null>(null);
  const [selectedCell, setSelectedCell] = useState<PresentationScreenCellCoordinate | null>(null);
  const [editingTile, setEditingTile] = useState<PresentationScreenEditableTile | null>(null);

  const hasData = hasPresentationScreenData(presentationScreen);

  useEffect(() => {
    if (previewCanvasRef.current) {
      drawPresentationScreenPreview(previewCanvasRef.current, presentationScreen);
    }
  }, [presentationScreen]);

  useEffect(() => {
    if (!hasData) {
      setHoveredCell(null);
      setSelectedCell(null);
      setEditingTile(null);
      return;
    }

    setSelectedCell(prev => prev ?? { x: 0, y: 0 });
  }, [hasData]);

  const selectedCellInfo = useMemo(() => {
    if (!selectedCell || !hasData) {
      return null;
    }
    return getPresentationScreenCellInfo(presentationScreen, selectedCell.x, selectedCell.y);
  }, [hasData, presentationScreen, selectedCell]);

  const hoveredCellInfo = useMemo(() => {
    if (!hoveredCell || !hasData) {
      return null;
    }
    return getPresentationScreenCellInfo(presentationScreen, hoveredCell.x, hoveredCell.y);
  }, [hasData, hoveredCell, presentationScreen]);

  const openTileEditor = (cell: PresentationScreenCellCoordinate | null) => {
    if (!cell) {
      return;
    }
    const editableTile = decodePresentationCharToEditableTile(presentationScreen, cell.x, cell.y);
    if (editableTile) {
      setSelectedCell(cell);
      setEditingTile(editableTile);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleClear = () => {
    setHoveredCell(null);
    setSelectedCell(null);
    setEditingTile(null);
    onUpdatePresentationScreen(prev => ({
      ...DEFAULT_PRESENTATION_SCREEN_CONFIG,
      runtime: { ...prev.runtime },
      compression: { ...prev.compression },
      enabled: false,
      lastImportError: null,
    }));
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const imageData = await loadImageDataFromFile(file);
      setHoveredCell(null);
      setSelectedCell({ x: 0, y: 0 });
      setEditingTile(null);
      onUpdatePresentationScreen(prev => ({
        ...prev,
        enabled: true,
        sourceFileName: file.name,
        name: prev.name || 'Presentation Screen',
        ...convertImageDataToPresentationScreen(imageData, prev),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      onUpdatePresentationScreen(prev => ({
        ...prev,
        lastImportError: message,
      }));
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setIsImporting(false);
    }
  };

  const updateRuntime = (field: keyof PresentationScreenConfig['runtime'], value: boolean | number) => {
    onUpdatePresentationScreen(prev => ({
      ...prev,
      runtime: {
        ...prev.runtime,
        [field]: value,
      },
    }));
  };

  const updateCompression = (field: keyof PresentationScreenConfig['compression'], value: boolean) => {
    onUpdatePresentationScreen(prev => ({
      ...prev,
      compression: {
        ...prev.compression,
        [field]: value,
      },
    }));
  };

  const handlePreviewMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!hasData) {
      return;
    }
    setHoveredCell(getCellFromPointerEvent(event));
  };

  const handlePreviewClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!hasData) {
      return;
    }
    setSelectedCell(getCellFromPointerEvent(event));
  };

  const handlePreviewDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!hasData) {
      return;
    }
    const cell = getCellFromPointerEvent(event);
    setSelectedCell(cell);
    openTileEditor(cell);
  };

  const handlePreviewKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!hasData || !selectedCell) {
      return;
    }

    let nextCell: PresentationScreenCellCoordinate | null = null;
    switch (event.key) {
      case 'ArrowLeft':
        nextCell = { x: Math.max(0, selectedCell.x - 1), y: selectedCell.y };
        break;
      case 'ArrowRight':
        nextCell = { x: Math.min(TILES_X - 1, selectedCell.x + 1), y: selectedCell.y };
        break;
      case 'ArrowUp':
        nextCell = { x: selectedCell.x, y: Math.max(0, selectedCell.y - 1) };
        break;
      case 'ArrowDown':
        nextCell = { x: selectedCell.x, y: Math.min(TILES_Y - 1, selectedCell.y + 1) };
        break;
      case 'Enter':
        event.preventDefault();
        openTileEditor(selectedCell);
        return;
      default:
        return;
    }

    event.preventDefault();
    setSelectedCell(nextCell);
  };

  const handleSaveEditedTile = (payload: {
    patternBytes: number[];
    colorBytes: number[];
    mode: 'single' | 'shared';
  }) => {
    if (!editingTile) {
      return;
    }

    try {
      const nextConfig = applyEditedPresentationTile(presentationScreen, {
        tileX: editingTile.cell.x,
        tileY: editingTile.cell.y,
        patternBytes: payload.patternBytes,
        colorBytes: payload.colorBytes,
        mode: payload.mode,
      });

      onUpdatePresentationScreen(nextConfig);
      setSelectedCell(editingTile.cell);
      setEditingTile(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      onUpdatePresentationScreen(prev => ({
        ...prev,
        lastImportError: message,
      }));
    }
  };

  const renderSelectionRect = (
    cell: PresentationScreenCellCoordinate | null,
    stroke: string,
    fill: string,
    strokeWidth: number,
  ) => {
    if (!cell) {
      return null;
    }

    return (
      <rect
        x={cell.x * 8}
        y={cell.y * 8}
        width={8}
        height={8}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  return (
    <Panel
      title="Presentation Screen"
      icon={<MapIcon className="w-4 h-4 text-msx-textsecondary" />}
      className="flex-grow flex flex-col"
      bodyClassName="p-3 flex-grow overflow-y-auto space-y-3"
    >
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleImportClick} disabled={isImporting}>
          {isImporting ? 'Importing PNG...' : 'Import PNG'}
        </Button>
        <Button onClick={() => openTileEditor(selectedCell)} variant="secondary" disabled={!selectedCellInfo}>
          Edit Tile
        </Button>
        <Button onClick={handleClear} variant="ghost" disabled={!hasData} icon={<TrashIcon className="w-4 h-4" />}>
          Clear
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".png,image/png"
        className="hidden"
        onChange={handleFileSelected}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-3">
        <Panel title="Preview" className="min-h-0" bodyClassName="p-3 space-y-2">
          <div
            className="relative w-full border border-msx-border rounded bg-black outline-none"
            style={{ aspectRatio: `${SCREEN2_WIDTH} / ${SCREEN2_HEIGHT}` }}
            onMouseMove={handlePreviewMouseMove}
            onMouseLeave={() => setHoveredCell(null)}
            onClick={handlePreviewClick}
            onDoubleClick={handlePreviewDoubleClick}
            onKeyDown={handlePreviewKeyDown}
            tabIndex={hasData ? 0 : -1}
          >
            <canvas
              ref={previewCanvasRef}
              className="absolute inset-0 w-full h-full rounded"
              style={{ imageRendering: 'pixelated' }}
            />
            {hasData && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox={`0 0 ${SCREEN2_WIDTH} ${SCREEN2_HEIGHT}`}
                preserveAspectRatio="none"
              >
                {Array.from({ length: TILES_X + 1 }).map((_, index) => (
                  <line
                    key={`grid-x-${index}`}
                    x1={index * 8}
                    y1={0}
                    x2={index * 8}
                    y2={SCREEN2_HEIGHT}
                    stroke="rgba(255,255,255,0.10)"
                    strokeWidth={0.5}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                {Array.from({ length: TILES_Y + 1 }).map((_, index) => (
                  <line
                    key={`grid-y-${index}`}
                    x1={0}
                    y1={index * 8}
                    x2={SCREEN2_WIDTH}
                    y2={index * 8}
                    stroke={index === 8 || index === 16 ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.10)'}
                    strokeWidth={index === 8 || index === 16 ? 1 : 0.5}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                {!sameCell(hoveredCell, selectedCell) && renderSelectionRect(hoveredCell, '#8be9fd', 'rgba(139,233,253,0.14)', 1)}
                {renderSelectionRect(selectedCell, '#f8f32b', 'rgba(248,243,43,0.12)', 1.5)}
              </svg>
            )}
          </div>
          <div className="text-xs text-msx-textsecondary">
            Click to select. Double click or press Enter to edit. Cursor keys move the selection.
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="Source" bodyClassName="p-3 space-y-2">
            <label className="block text-xs text-msx-textsecondary">
              Name
              <input
                type="text"
                value={presentationScreen.name}
                onChange={(e) => onUpdatePresentationScreen(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 w-full p-1 text-xs bg-msx-bgcolor border border-msx-border rounded"
              />
            </label>
            <div className="text-xs text-msx-textsecondary">
              <div>File: {presentationScreen.sourceFileName || 'None'}</div>
              <div>Original size: {presentationScreen.sourceImageWidth} x {presentationScreen.sourceImageHeight}</div>
              <div>Target mode: {presentationScreen.screenMode}</div>
              <div>Palette: {presentationScreen.paletteMode}</div>
            </div>
            {presentationScreen.preview.warning && (
              <div className="text-xs text-yellow-300">{presentationScreen.preview.warning}</div>
            )}
            {presentationScreen.lastImportError && (
              <div className="text-xs text-red-300">{presentationScreen.lastImportError}</div>
            )}
          </Panel>

          <Panel title="Selected Tile" bodyClassName="p-3 space-y-2 text-xs">
            {selectedCellInfo ? (
              <>
                <div className="text-msx-textsecondary">Cell: {selectedCellInfo.x}, {selectedCellInfo.y}</div>
                <div className="text-msx-textsecondary">Bank: {selectedCellInfo.bank}</div>
                <div className="text-msx-textsecondary">Char code: {selectedCellInfo.charCode}</div>
                <div className="text-msx-textsecondary">Shared uses: {selectedCellInfo.charUsageCount}</div>
                <Button onClick={() => openTileEditor(selectedCell)} size="sm" variant="secondary">
                  Edit Tile
                </Button>
              </>
            ) : (
              <div className="text-msx-textsecondary">Select a tile from the preview grid.</div>
            )}
            {hoveredCellInfo && (
              <div className="pt-2 border-t border-msx-border text-msx-textsecondary">
                Hover: {hoveredCellInfo.x}, {hoveredCellInfo.y} | Bank {hoveredCellInfo.bank} | Char {hoveredCellInfo.charCode}
              </div>
            )}
          </Panel>

          <Panel title="Stats" bodyClassName="p-3 space-y-1 text-xs text-msx-textsecondary">
            <div>Bank 0 chars: {presentationScreen.preview.uniqueCharsPerBank[0]}</div>
            <div>Bank 1 chars: {presentationScreen.preview.uniqueCharsPerBank[1]}</div>
            <div>Bank 2 chars: {presentationScreen.preview.uniqueCharsPerBank[2]}</div>
            <div>Total chars: {presentationScreen.preview.totalUniqueChars}</div>
            <div>Name table bytes: {presentationScreen.data.nameTable.length}</div>
          </Panel>

          <Panel title="Runtime" bodyClassName="p-3 space-y-2 text-xs">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={presentationScreen.enabled}
                onChange={(e) => onUpdatePresentationScreen(prev => ({ ...prev, enabled: e.target.checked }))}
              />
              <span>Enable export</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={presentationScreen.runtime.showAtBoot}
                onChange={(e) => updateRuntime('showAtBoot', e.target.checked)}
              />
              <span>Show at boot</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={presentationScreen.runtime.clearSpritesBeforeShow}
                onChange={(e) => updateRuntime('clearSpritesBeforeShow', e.target.checked)}
              />
              <span>Clear sprites before show</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={presentationScreen.runtime.waitForKey}
                onChange={(e) => updateRuntime('waitForKey', e.target.checked)}
              />
              <span>Wait for key/fire</span>
            </label>
            <label className="block text-msx-textsecondary">
              Wait frames
              <input
                type="number"
                min="0"
                value={presentationScreen.runtime.waitForFrames}
                onChange={(e) => updateRuntime('waitForFrames', Math.max(0, parseInt(e.target.value || '0', 10) || 0))}
                className="mt-1 w-full p-1 text-xs bg-msx-bgcolor border border-msx-border rounded"
              />
            </label>
          </Panel>

          <Panel title="Compression" bodyClassName="p-3 space-y-2 text-xs">
            <div className="text-msx-textsecondary">Codec: {presentationScreen.compression.codec}</div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={presentationScreen.compression.compressNameTable}
                onChange={(e) => updateCompression('compressNameTable', e.target.checked)}
              />
              <span>Compress name table</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={presentationScreen.compression.compressPatterns}
                onChange={(e) => updateCompression('compressPatterns', e.target.checked)}
              />
              <span>Compress patterns</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={presentationScreen.compression.compressColors}
                onChange={(e) => updateCompression('compressColors', e.target.checked)}
              />
              <span>Compress colors</span>
            </label>
          </Panel>
        </div>
      </div>

      <PresentationScreenTileEditor
        isOpen={!!editingTile}
        tile={editingTile}
        onClose={() => setEditingTile(null)}
        onSave={handleSaveEditedTile}
      />
    </Panel>
  );
};
