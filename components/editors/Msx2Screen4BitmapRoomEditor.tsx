import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Msx2BitmapRoomAtlasEntry, Msx2BitmapRoomCommand, Msx2Screen4BitmapRoom, Msx2Screen4Tile, Screen5PaletteSlot } from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { ensureScreen5PaletteSlots } from '../../utils/msx2PaletteUtils';
import { importTilesIntoAtlas } from '../../utils/msx2BitmapAtlasImport';
import { Msx2TileLibraryModal } from '../modals/Msx2TileLibraryModal';
import { FolderOpenIcon, MapIcon, PlusCircleIcon, TrashIcon } from '../icons/MsxIcons';

type BitmapRoomTool = 'copy8' | 'copy16' | 'fill' | 'lineH' | 'lineV';

interface Msx2Screen4BitmapRoomEditorProps {
  room: Msx2Screen4BitmapRoom;
  onUpdate: (data: Partial<Msx2Screen4BitmapRoom>) => void;
}

const SCREEN_W = 256;
const GRID = 8;
const FALLBACK_HEX = '#05070B';

const createPixels = (width: number, height: number, slot = 0): number[][] =>
  Array.from({ length: height }, () => Array.from({ length: width }, () => slot));

const normalizePixels = (pixels: number[][] | undefined, width: number, height: number): number[][] => {
  if (!pixels || pixels.length !== height || pixels.some(row => row.length !== width)) return createPixels(width, height, 0);
  return pixels.map(row => row.map(value => Math.max(0, Math.min(15, Number(value) || 0))));
};

const normalizeCommandNumber = (value: unknown, fallback = 0): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.trunc(numeric) : fallback;
};

const applyFill = (pixels: number[][], x: number, y: number, w: number, h: number, color: number): void => {
  for (let yy = Math.max(0, y); yy < Math.min(pixels.length, y + h); yy++) {
    for (let xx = Math.max(0, x); xx < Math.min(SCREEN_W, x + w); xx++) {
      pixels[yy][xx] = color & 0x0f;
    }
  }
};

const renderComposition = (
  room: Msx2Screen4BitmapRoom,
  atlasPixels: number[][],
  height: number
): number[][] => {
  const pixels = createPixels(SCREEN_W, height, 0);
  const atlasEntries = new Map((room.atlas?.entries || []).map(entry => [entry.id, entry]));
  (room.composition?.commands || []).forEach(command => {
    if (command.op === 'fill') {
      applyFill(pixels, command.x, command.y, command.w, command.h, command.color);
      return;
    }
    if (command.op === 'lineH') {
      applyFill(pixels, command.x, command.y, command.length, 1, command.color);
      return;
    }
    if (command.op === 'lineV') {
      applyFill(pixels, command.x, command.y, 1, command.length, command.color);
      return;
    }
    const entry = atlasEntries.get(command.atlasEntryId);
    if (!entry) return;
    const w = Math.max(1, normalizeCommandNumber(command.w, entry.w));
    const h = Math.max(1, normalizeCommandNumber(command.h, entry.h));
    for (let yy = 0; yy < h; yy++) {
      for (let xx = 0; xx < w; xx++) {
        const sourceY = entry.sy + yy;
        const sourceX = entry.sx + xx;
        const destY = command.dy + yy;
        const destX = command.dx + xx;
        if (destY < 0 || destY >= height || destX < 0 || destX >= SCREEN_W) continue;
        pixels[destY][destX] = atlasPixels[sourceY]?.[sourceX] ?? 0;
      }
    }
  });
  return pixels;
};

interface Screen4ColorLimitDiagnostic {
  tileX: number;
  tileY: number;
  row: number;
  colors: number[];
}

const analyzeScreen4ColorLimits = (pixels: number[][]): Screen4ColorLimitDiagnostic[] => {
  const diagnostics: Screen4ColorLimitDiagnostic[] = [];
  const tileRows = Math.floor(pixels.length / GRID);
  for (let tileY = 0; tileY < tileRows; tileY++) {
    for (let tileX = 0; tileX < SCREEN_W / GRID; tileX++) {
      for (let row = 0; row < GRID; row++) {
        const colors = new Set<number>();
        const y = tileY * GRID + row;
        for (let x = tileX * GRID; x < tileX * GRID + GRID; x++) {
          colors.add((pixels[y]?.[x] ?? 0) & 0x0f);
        }
        if (colors.size > 2) {
          diagnostics.push({ tileX, tileY, row, colors: [...colors].sort((a, b) => a - b) });
        }
      }
    }
  }
  return diagnostics;
};

export const Msx2Screen4BitmapRoomEditor: React.FC<Msx2Screen4BitmapRoomEditorProps> = ({ room, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tool, setTool] = useState<BitmapRoomTool>('copy8');
  const [activeColor, setActiveColor] = useState(4);
  const [selectedAtlasEntryId, setSelectedAtlasEntryId] = useState(room.atlas?.entries?.[0]?.id || '');
  const [zoom, setZoom] = useState(3);
  const [showGrid, setShowGrid] = useState(true);
  const [isTileLibraryOpen, setIsTileLibraryOpen] = useState(false);
  const { slots, changed } = useMemo(() => ensureScreen5PaletteSlots(room.palette), [room.palette]);
  const atlasWidth = Math.max(1, Number(room.atlas?.width) || 256);
  const atlasHeight = Math.max(1, Number(room.atlas?.height) || 128);
  const atlasPixels = useMemo(() => normalizePixels(room.atlas?.pixels, atlasWidth, atlasHeight), [room.atlas?.pixels, atlasWidth, atlasHeight]);
  const previewPixels = useMemo(() => renderComposition(room, atlasPixels, room.height || 192), [room, atlasPixels]);
  const colorLimitDiagnostics = useMemo(() => analyzeScreen4ColorLimits(previewPixels), [previewPixels]);
  const diagnosticPreview = colorLimitDiagnostics.slice(0, 6);
  const commands = room.composition?.commands || [];
  const atlasEntries = room.atlas?.entries || [];
  const selectedAtlasEntry = atlasEntries.find(entry => entry.id === selectedAtlasEntryId) || atlasEntries[0];

  useEffect(() => {
    if (changed) onUpdate({ palette: slots.map(slot => ({ ...slot })) });
  }, [changed, onUpdate, slots]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const height = room.height || 192;
    canvas.width = SCREEN_W * zoom;
    canvas.height = height * zoom;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < SCREEN_W; x++) {
        const slot = previewPixels[y]?.[x] ?? 0;
        const hex = slots[slot]?.hex || FALLBACK_HEX;
        ctx.fillStyle = hex === 'rgba(0,0,0,0)' ? FALLBACK_HEX : hex;
        ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
      }
    }
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      for (let x = 0; x <= SCREEN_W; x += GRID) {
        ctx.beginPath();
        ctx.moveTo(x * zoom + 0.5, 0);
        ctx.lineTo(x * zoom + 0.5, height * zoom);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += GRID) {
        ctx.beginPath();
        ctx.moveTo(0, y * zoom + 0.5);
        ctx.lineTo(SCREEN_W * zoom, y * zoom + 0.5);
        ctx.stroke();
      }
    }
  }, [previewPixels, room.height, showGrid, slots, zoom]);

  const updateComposition = (nextCommands: Msx2BitmapRoomCommand[]) => {
    onUpdate({
      composition: {
        source: room.composition?.source || 'authored',
        commands: nextCommands,
      },
    });
  };

  const addCommandAt = (x: number, y: number) => {
    const snapX = Math.max(0, Math.min(255, Math.floor(x / GRID) * GRID));
    const snapY = Math.max(0, Math.min((room.height || 192) - 1, Math.floor(y / GRID) * GRID));
    const id = `cmd_${Date.now()}`;
    let command: Msx2BitmapRoomCommand;
    if (tool === 'fill') {
      command = { id, op: 'fill', x: snapX, y: snapY, w: 16, h: 16, color: activeColor };
    } else if (tool === 'lineH') {
      command = { id, op: 'lineH', x: snapX, y: snapY, length: 32, color: activeColor };
    } else if (tool === 'lineV') {
      command = { id, op: 'lineV', x: snapX, y: snapY, length: 32, color: activeColor };
    } else {
      const entry = selectedAtlasEntry;
      command = {
        id,
        op: 'copy',
        atlasEntryId: entry?.id || 'atlas_block_0',
        dx: snapX,
        dy: snapY,
        w: tool === 'copy16' ? 16 : 8,
        h: tool === 'copy16' ? 16 : 8,
      };
    }
    updateComposition([...commands, command]);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // Map by the actual rendered size, not by `zoom`. The displayed canvas may be
    // scaled by CSS/flex (it has no fixed CSS size), so dividing by `zoom` lands the
    // command on the wrong pixel. rect.width/height always reflect what the user sees.
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const height = room.height || 192;
    const x = Math.floor((event.clientX - rect.left) * (SCREEN_W / rect.width));
    const y = Math.floor((event.clientY - rect.top) * (height / rect.height));
    addCommandAt(x, y);
  };

  const updateAtlasPixels = (pixels: number[][]) => {
    onUpdate({ atlas: { ...room.atlas, width: atlasWidth, height: atlasHeight, offscreenBaseY: room.atlas?.offscreenBaseY || 320, entries: atlasEntries, pixels } });
  };

  const handleImportAtlas = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = atlasWidth;
      canvas.height = atlasHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, 0, 0, atlasWidth, atlasHeight);
      const data = ctx.getImageData(0, 0, atlasWidth, atlasHeight).data;
      const next = createPixels(atlasWidth, atlasHeight, 0);
      for (let y = 0; y < atlasHeight; y++) {
        for (let x = 0; x < atlasWidth; x++) {
          const offset = (y * atlasWidth + x) * 4;
          let bestSlot = 0;
          let bestDistance = Infinity;
          slots.forEach((slot, slotIndex) => {
            if (slot.hex === 'rgba(0,0,0,0)') return;
            const r = parseInt(slot.hex.slice(1, 3), 16);
            const g = parseInt(slot.hex.slice(3, 5), 16);
            const b = parseInt(slot.hex.slice(5, 7), 16);
            const distance = ((r - data[offset]) ** 2) + ((g - data[offset + 1]) ** 2) + ((b - data[offset + 2]) ** 2);
            if (distance < bestDistance) {
              bestDistance = distance;
              bestSlot = slotIndex;
            }
          });
          next[y][x] = data[offset + 3] < 8 ? 0 : bestSlot;
        }
      }
      updateAtlasPixels(next);
      URL.revokeObjectURL(url);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    image.src = url;
  };

  // Brings SCREEN 4 tiles from the global tile library into the atlas as 16x16 blocks. The modal
  // reconciles each tile to the room palette first (destPalette={slots}), so the pixels handed back
  // are already in room-palette index space; we only persist the palette when the user overwrote
  // room slots (paletteChanged). Importing copies pixels into THIS room's atlas — it never creates a
  // SCREEN 4 tile screen asset, so the one-mode-per-ROM rule is preserved.
  const handleImportTilesFromLibrary = (
    tiles: Msx2Screen4Tile[],
    palette: Screen5PaletteSlot[],
    paletteChanged: boolean,
  ) => {
    if (!tiles.length) return;
    const { atlas, addedEntries } = importTilesIntoAtlas(
      {
        width: atlasWidth,
        height: atlasHeight,
        offscreenBaseY: room.atlas?.offscreenBaseY || 320,
        pixels: room.atlas?.pixels,
        entries: atlasEntries,
      },
      tiles,
    );
    onUpdate({
      atlas,
      ...(paletteChanged ? { palette: palette.map(slot => ({ ...slot })) } : {}),
    });
    if (addedEntries[0]) setSelectedAtlasEntryId(addedEntries[0].id);
    setTool('copy16');
  };

  const deleteCommand = (id: string) => updateComposition(commands.filter(command => command.id !== id));

  return (
    <Panel title="MSX2 SCREEN 5 Bitmap Room" icon={<MapIcon />} className="flex-grow flex flex-col bg-msx-bgcolor">
      <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg,.webp" onChange={handleImportAtlas} style={{ display: 'none' }} />
      <div className="p-2 border-b border-msx-border flex flex-wrap items-center gap-2">
        <Button size="sm" variant={tool === 'copy8' ? 'primary' : 'secondary'} onClick={() => setTool('copy8')}>Copy 8x8</Button>
        <Button size="sm" variant={tool === 'copy16' ? 'primary' : 'secondary'} onClick={() => setTool('copy16')}>Copy 16x16</Button>
        <Button size="sm" variant={tool === 'fill' ? 'primary' : 'secondary'} onClick={() => setTool('fill')}>Fill</Button>
        <Button size="sm" variant={tool === 'lineH' ? 'primary' : 'secondary'} onClick={() => setTool('lineH')}>Line H</Button>
        <Button size="sm" variant={tool === 'lineV' ? 'primary' : 'secondary'} onClick={() => setTool('lineV')}>Line V</Button>
        <Button size="sm" variant="secondary" icon={<FolderOpenIcon />} onClick={() => fileInputRef.current?.click()}>Import Atlas PNG</Button>
        <Button size="sm" variant="secondary" icon={<PlusCircleIcon />} onClick={() => setIsTileLibraryOpen(true)} title="Load SCREEN 4 tiles from the global library as 16x16 atlas blocks">Load Tiles</Button>
        <label className="ml-auto text-xs text-msx-textsecondary flex items-center gap-2">
          Zoom
          <input type="range" min={1} max={4} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
        </label>
        <label className="text-xs text-msx-textsecondary flex items-center gap-1">
          <input type="checkbox" checked={showGrid} onChange={(event) => setShowGrid(event.target.checked)} />
          Grid
        </label>
      </div>

      <div className="flex flex-grow min-h-0 overflow-hidden">
        <aside className="w-64 border-r border-msx-border p-2 overflow-y-auto">
          <h4 className="text-sm pixel-font text-msx-highlight mb-2">Atlas Entries</h4>
          <select value={selectedAtlasEntryId} onChange={(event) => setSelectedAtlasEntryId(event.target.value)} className="w-full bg-msx-bgcolor border border-msx-border rounded p-1 text-xs">
            {atlasEntries.map(entry => <option key={entry.id} value={entry.id}>{entry.name} ({entry.w}x{entry.h})</option>)}
          </select>
          <div className="mt-3 grid grid-cols-8 gap-1">
            {slots.map((slot, index) => (
              <button
                key={index}
                type="button"
                title={`Color ${index}`}
                className={`h-6 border ${activeColor === index ? 'border-white' : 'border-msx-border'}`}
                style={{ backgroundColor: slot.hex === 'rgba(0,0,0,0)' ? '#000' : slot.hex }}
                onClick={() => setActiveColor(index)}
              />
            ))}
          </div>
          <div className="mt-3 rounded border border-msx-border bg-msx-panelbg p-2 text-[0.7rem] text-msx-textsecondary space-y-1">
            <div className="font-semibold text-msx-highlight">SCREEN 5 bitmap export contract</div>
            <div>Authoring uses atlas + V9938 command list.</div>
            <div>Runtime: bitmap page VRAM #0000, atlas offscreen Y≥212.</div>
            <div>Primitives: cmd D0/98 copy, C0 fill, 70 line.</div>
          </div>
          <div className={`mt-2 rounded border p-2 text-[0.7rem] ${colorLimitDiagnostics.length ? 'border-msx-warning bg-msx-warning/10 text-msx-warning' : 'border-msx-border bg-msx-panelbg text-msx-textsecondary'}`}>
            <div className="font-semibold">{colorLimitDiagnostics.length ? 'Color rows will be reduced' : 'Color rows are SCREEN 5 safe'}</div>
            <div>{colorLimitDiagnostics.length ? `${colorLimitDiagnostics.length} rows use more than 2 colors.` : 'No 8-pixel row exceeds 2 colors.'}</div>
            {diagnosticPreview.length > 0 && (
              <div className="mt-1 max-h-20 overflow-auto font-mono">
                {diagnosticPreview.map(item => (
                  <div key={`${item.tileX}-${item.tileY}-${item.row}`}>
                    c{item.tileX},{item.tileY} r{item.row}: {item.colors.join(',')}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-auto p-3 flex justify-center bg-[#080A0F]">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="border border-msx-border"
            style={{
              imageRendering: 'pixelated',
              cursor: 'crosshair',
              // Pin the displayed size to the bitmap size so 1 CSS px == 1 device px / zoom.
              // Without this, the flex parent (align-items: stretch) distorts the canvas and
              // breaks both the zoom slider and click-to-place mapping.
              width: `${SCREEN_W * zoom}px`,
              height: `${(room.height || 192) * zoom}px`,
              flex: '0 0 auto',
              alignSelf: 'flex-start',
            }}
          />
        </main>

        <aside className="w-80 border-l border-msx-border p-2 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm pixel-font text-msx-highlight">Command List</h4>
            <PlusCircleIcon className="w-4 h-4 text-msx-textsecondary" />
          </div>
          <div className="space-y-1">
            {commands.map((command, index) => (
              <div key={command.id} className="bg-msx-panelbg border border-msx-border rounded p-2 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="font-mono text-msx-cyan">{index.toString().padStart(2, '0')} {command.op}</span>
                  <button type="button" onClick={() => deleteCommand(command.id)} className="text-msx-danger hover:text-white" title="Delete command">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-1 text-msx-textsecondary">
                  {'dx' in command ? `dst ${command.dx},${command.dy}` : `pos ${command.x},${command.y}`}
                  {'atlasEntryId' in command ? ` src ${command.atlasEntryId}` : ''}
                  {'w' in command ? ` ${command.w}x${command.h}` : ''}
                  {'length' in command ? ` len ${command.length}` : ''}
                  {'color' in command ? ` col ${command.color}` : ''}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <Msx2TileLibraryModal
        isOpen={isTileLibraryOpen}
        onClose={() => setIsTileLibraryOpen(false)}
        destPalette={slots}
        destScreenName={room.name}
        onImportTiles={handleImportTilesFromLibrary}
      />
    </Panel>
  );
};
