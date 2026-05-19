import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Msx2Screen5Tile, Msx2Screen5TileScreen } from '../../types';
import { ensureScreen5PaletteSlots } from '../../utils/screen5PaletteUtils';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';

interface Msx2Screen5TileScreenEditorProps {
  screen: Msx2Screen5TileScreen;
  onUpdate: (data: Partial<Msx2Screen5TileScreen>) => void;
}

const SCREEN_WIDTH = 256;
const SCREEN_HEIGHT = 212;
const TILE_SIZE = 16;
const MAP_WIDTH = 16;
const MAP_HEIGHT = 14;
const TRANSPARENT_HEX = 'rgba(0,0,0,0)';

const createTilePixels = (slot = 0): number[][] =>
  Array.from({ length: TILE_SIZE }, () => Array.from({ length: TILE_SIZE }, () => slot));

const cloneTile = (tile: Msx2Screen5Tile): Msx2Screen5Tile => ({
  ...tile,
  pixels: tile.pixels.map(row => [...row]),
});

const normalizeTiles = (tiles?: Msx2Screen5Tile[]): Msx2Screen5Tile[] => {
  const source = tiles?.length ? tiles : [{ id: 'tile_0', name: 'Tile 0', pixels: createTilePixels(0) }];
  return source.map((tile, index) => ({
    id: tile.id || `tile_${index}`,
    name: tile.name || `Tile ${index}`,
    pixels: Array.from({ length: TILE_SIZE }, (_, y) =>
      Array.from({ length: TILE_SIZE }, (_, x) => Math.max(0, Math.min(15, Number(tile.pixels?.[y]?.[x]) || 0)))
    ),
  }));
};

const normalizeMap = (map: number[][] | undefined, tileCount: number): number[][] =>
  Array.from({ length: MAP_HEIGHT }, (_, y) =>
    Array.from({ length: MAP_WIDTH }, (_, x) => Math.max(0, Math.min(Math.max(0, tileCount - 1), Number(map?.[y]?.[x]) || 0)))
  );

export const Msx2Screen5TileScreenEditor: React.FC<Msx2Screen5TileScreenEditorProps> = ({ screen, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tileCanvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTileIndex, setSelectedTileIndex] = useState(0);
  const [activeSlot, setActiveSlot] = useState(1);
  const [mode, setMode] = useState<'map' | 'tile'>('map');
  const [showGrid, setShowGrid] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);

  const { slots, changed } = useMemo(() => ensureScreen5PaletteSlots(screen.palette), [screen.palette]);
  const tiles = useMemo(() => normalizeTiles(screen.tiles), [screen.tiles]);
  const map = useMemo(() => normalizeMap(screen.map, tiles.length), [screen.map, tiles.length]);
  const selectedTile = tiles[Math.max(0, Math.min(tiles.length - 1, selectedTileIndex))];

  useEffect(() => {
    if (changed) onUpdate({ palette: slots.map(slot => ({ ...slot })) });
  }, [changed, onUpdate, slots]);

  useEffect(() => {
    setSelectedTileIndex(index => Math.max(0, Math.min(tiles.length - 1, index)));
  }, [tiles.length]);

  useEffect(() => {
    const stop = () => setIsDrawing(false);
    window.addEventListener('mouseup', stop);
    return () => window.removeEventListener('mouseup', stop);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = SCREEN_WIDTH * 2;
    canvas.height = SCREEN_HEIGHT * 2;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let my = 0; my < MAP_HEIGHT; my++) {
      for (let mx = 0; mx < MAP_WIDTH; mx++) {
        const tile = tiles[map[my][mx]] || tiles[0];
        for (let py = 0; py < TILE_SIZE; py++) {
          for (let px = 0; px < TILE_SIZE; px++) {
            const slot = tile.pixels[py][px] & 0x0f;
            const hex = slots[slot]?.hex || '#000000';
            ctx.fillStyle = hex === TRANSPARENT_HEX ? '#000000' : hex;
            ctx.fillRect(((mx * TILE_SIZE) + px) * 2, ((my * TILE_SIZE) + py) * 2, 2, 2);
          }
        }
      }
    }

    if (showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= MAP_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * TILE_SIZE * 2 + 0.5, 0);
        ctx.lineTo(x * TILE_SIZE * 2 + 0.5, MAP_HEIGHT * TILE_SIZE * 2);
        ctx.stroke();
      }
      for (let y = 0; y <= MAP_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * TILE_SIZE * 2 + 0.5);
        ctx.lineTo(SCREEN_WIDTH * 2 + 0.5, y * TILE_SIZE * 2 + 0.5);
        ctx.stroke();
      }
    }
  }, [map, slots, tiles, showGrid]);

  useEffect(() => {
    const canvas = tileCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !selectedTile) return;
    const zoom = 16;
    canvas.width = TILE_SIZE * zoom;
    canvas.height = TILE_SIZE * zoom;
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        const hex = slots[selectedTile.pixels[y][x]]?.hex || '#000';
        ctx.fillStyle = hex === TRANSPARENT_HEX ? '#05070b' : hex;
        ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
      }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i <= TILE_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * zoom + 0.5, 0);
      ctx.lineTo(i * zoom + 0.5, TILE_SIZE * zoom);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * zoom + 0.5);
      ctx.lineTo(TILE_SIZE * zoom, i * zoom + 0.5);
      ctx.stroke();
    }
  }, [selectedTile, slots]);

  const placeTile = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * MAP_WIDTH);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * MAP_HEIGHT);
    if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) return;
    const next = map.map(row => [...row]);
    next[y][x] = selectedTileIndex;
    onUpdate({ map: next });
  };

  const paintTilePixel = (event: React.MouseEvent<HTMLCanvasElement>, force = false) => {
    if (!force && !isDrawing) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * TILE_SIZE);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * TILE_SIZE);
    if (x < 0 || y < 0 || x >= TILE_SIZE || y >= TILE_SIZE || !selectedTile) return;
    const nextTiles = tiles.map(cloneTile);
    nextTiles[selectedTileIndex].pixels[y][x] = event.button === 2 ? 0 : activeSlot;
    onUpdate({ tiles: nextTiles });
  };

  const addTile = () => {
    const nextTiles = [...tiles.map(cloneTile), { id: `tile_${Date.now()}`, name: `Tile ${tiles.length}`, pixels: createTilePixels(0) }];
    onUpdate({ tiles: nextTiles });
    setSelectedTileIndex(nextTiles.length - 1);
  };

  const duplicateTile = () => {
    const copy = cloneTile(selectedTile);
    copy.id = `tile_${Date.now()}`;
    copy.name = `${selectedTile.name} copy`;
    const nextTiles = [...tiles.map(cloneTile), copy];
    onUpdate({ tiles: nextTiles });
    setSelectedTileIndex(nextTiles.length - 1);
  };

  const clearTile = () => {
    const nextTiles = tiles.map(cloneTile);
    nextTiles[selectedTileIndex].pixels = createTilePixels(0);
    onUpdate({ tiles: nextTiles });
  };

  return (
    <div className="h-full min-h-0 grid grid-cols-[220px_1fr_300px] gap-2 p-2 bg-msx-bgcolor overflow-hidden">
      <div className="min-h-0 overflow-y-auto border-r border-msx-border pr-2 space-y-2">
        <Panel title="MSX2 Screen">
          <div className="p-2 space-y-2 text-xs">
            <input
              value={screen.name}
              onChange={event => onUpdate({ name: event.target.value })}
              className="w-full px-2 py-1 bg-msx-panelbg border border-msx-border rounded"
            />
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant={mode === 'map' ? 'primary' : 'secondary'} onClick={() => setMode('map')}>Map</Button>
              <Button size="sm" variant={mode === 'tile' ? 'primary' : 'secondary'} onClick={() => setMode('tile')}>Tile</Button>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showGrid} onChange={event => setShowGrid(event.target.checked)} />
              Tile grid
            </label>
            <div className="text-msx-textsecondary">
              16x14 tiles, 16x16 px. Export crops the visible SCREEN 5 area to 256x212.
            </div>
          </div>
        </Panel>

        <Panel title="Tiles 16x16">
          <div className="p-2 space-y-2">
            <div className="grid grid-cols-2 gap-1">
              <Button size="sm" variant="secondary" onClick={addTile}>Add</Button>
              <Button size="sm" variant="secondary" onClick={duplicateTile}>Duplicate</Button>
              <Button size="sm" variant="danger" onClick={clearTile}>Clear</Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {tiles.map((tile, index) => (
                <button
                  key={tile.id}
                  type="button"
                  className={`text-left px-2 py-1 rounded border text-xs ${index === selectedTileIndex ? 'border-msx-highlight bg-msx-highlight/20' : 'border-msx-border bg-msx-panelbg'}`}
                  onClick={() => setSelectedTileIndex(index)}
                >
                  {index}: {tile.name}
                </button>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <div className="min-h-0 min-w-0 overflow-auto flex items-start justify-center p-3">
        <canvas
          ref={canvasRef}
          className="border border-msx-border bg-black"
          onMouseDown={event => { setIsDrawing(true); placeTile(event); }}
          onMouseMove={event => { if (isDrawing && mode === 'map') placeTile(event); }}
          onContextMenu={event => event.preventDefault()}
        />
      </div>

      <div className="min-h-0 overflow-y-auto border-l border-msx-border pl-2 space-y-2">
        <Panel title="Palette SCREEN 5">
          <div className="grid grid-cols-4 gap-2 p-2">
            {slots.map(slot => (
              <button
                key={slot.slotIndex}
                type="button"
                className={`h-8 rounded border text-[0.65rem] ${activeSlot === slot.slotIndex ? 'border-msx-highlight ring-1 ring-msx-highlight' : 'border-msx-border'}`}
                style={{ backgroundColor: slot.hex === TRANSPARENT_HEX ? '#111827' : slot.hex }}
                onClick={() => setActiveSlot(slot.slotIndex)}
                title={`Slot ${slot.slotIndex}: ${slot.hex}`}
              >
                <span className="bg-black/40 px-1 rounded text-white">{slot.slotIndex}</span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title={`Edit Tile ${selectedTileIndex}`}>
          <div className="p-2">
            <canvas
              ref={tileCanvasRef}
              className="w-full border border-msx-border bg-black"
              onMouseDown={event => { setIsDrawing(true); paintTilePixel(event, true); }}
              onMouseMove={event => paintTilePixel(event)}
              onContextMenu={event => event.preventDefault()}
            />
          </div>
        </Panel>

        <Panel title="Export Model">
          <div className="p-2 text-xs text-msx-textsecondary space-y-1">
            <div>Tile raw size: 128 bytes</div>
            <div>Map size: 208 bytes</div>
            <div>Current backend: rasterizes to 27136-byte SCREEN 5 bitmap.</div>
          </div>
        </Panel>
      </div>
    </div>
  );
};
