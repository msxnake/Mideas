import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ConnectionDirection,
  BitmapTileScreen5,
  Msx2BitmapRoomAtlasEntry,
  Msx2BitmapRoomCommand,
  Msx2Screen4BitmapRoom,
  Msx2Screen4Tile,
  PaletteAsset,
  ProjectAsset,
  Screen5PaletteSlot,
  WorldMapGraph,
} from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { ensureScreen5PaletteSlots } from '../../utils/msx2PaletteUtils';
import { importTilesIntoAtlas } from '../../utils/msx2BitmapAtlasImport';
import { Msx2TileLibraryModal } from '../modals/Msx2TileLibraryModal';
import { addEntryToMsx2TileLibrary } from '../../utils/msx2TileLibrary';
import {
  areScreen5PalettesEquivalent,
  bitmapTileScreen5ToAtlasTile,
  buildScreen5BitmapTileAsset,
  createScreen5PaletteAssetForTile,
  findMatchingScreen5PaletteAsset,
} from '../../utils/msx2Screen5BitmapTileLibrary';
import {
  EraserIcon,
  EyeIcon,
  EyeOffIcon,
  FolderOpenIcon,
  GridIcon,
  MapIcon,
  PaintBrushIcon,
  PencilIcon,
  PlusCircleIcon,
  SaveIcon,
  SpriteIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from '../icons/MsxIcons';

/**
 * NEW MSX2 "SCREEN 5" bitmap screen editor (UI shell / beta).
 *
 * This is a fresh layout built to match the provided "Tile Map Editor — MSX2" mockup.
 * It reuses the data model (`Msx2Screen4BitmapRoom`, asset type id `'msx2bitmaproom'`)
 * and the import-to-atlas flow from the existing `Msx2Screen4BitmapRoomEditor`, but does
 * NOT replace it. Wired: brush/eraser/flood-fill painting, layer-aware editing, cell
 * properties (collision flags), category filtering, palette load, export to library, and
 * a downsampled world minimap. Remaining nice-to-haves: in-place palette-slot colour
 * editing and merging flood-fill runs into taller rects. Every user-visible "Screen 4"
 * label says "SCREEN 5" (this is the MSX2 bitmap SCREEN 5 mode).
 */

type BrushTool = 'brush' | 'eraser' | 'fill';
type LayerKey = 'visual' | 'collision' | 'objects';
type CategoryKey = 'suelo' | 'pared' | 'decoracion' | 'interactivos';

const SCREEN_W = 256;
const SCREEN_H = 192;
const GRID = 16;
const FALLBACK_HEX = '#05070B';

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: 'suelo', label: 'Suelo' },
  { key: 'pared', label: 'Pared' },
  { key: 'decoracion', label: 'Decoración' },
  { key: 'interactivos', label: 'Interactivos' },
];

const LAYERS: { key: LayerKey; label: string }[] = [
  { key: 'visual', label: 'Visual' },
  { key: 'collision', label: 'Collision' },
  { key: 'objects', label: 'Objects' },
];

// NOTE: align with generator. Cell-property bitmask scheme mirrors the tile/screen
// editor flag bits used by the ASM generator (see CLAUDE.md "Collision Layers" + the
// "NoSolid Tile" memory: solidity is the high nibble & #F0, INTERACTABLE = 0x08).
const PROP_BIT: Record<string, number> = {
  breakable: 0x01,    // low-nibble flag
  movable: 0x02,      // low-nibble flag
  interactable: 0x08, // low-nibble flag (INTERACTABLE, matches generator)
  solid: 0x10,        // high nibble = family/solidity
  platform: 0x20,
  deadly: 0x40,
};

const PROPERTY_FLAGS: { key: string; label: string }[] = [
  { key: 'solid', label: 'Solid' },
  { key: 'breakable', label: 'Breakable' },
  { key: 'platform', label: 'Platform' },
  { key: 'movable', label: 'Movable' },
  { key: 'deadly', label: 'Deadly' },
  { key: 'interactable', label: 'Interactable' },
];

// Collision/behavior grids are addressed on a 16px cell grid (16 cols x 12 rows for a 192px page).
const COLLISION_CELL = 16;

const ZOOM_OPTIONS = [1, 2, 3, 4];

// Atlas entries carry no category field, so we infer one from the entry name by keyword.
// Entries with no matching keyword are treated as uncategorized and always shown.
const CATEGORY_KEYWORDS: Record<CategoryKey, string[]> = {
  suelo: ['suelo', 'floor', 'ground', 'piso'],
  pared: ['pared', 'wall', 'muro', 'brick'],
  decoracion: ['deco', 'decor', 'adorno', 'plant', 'arbol', 'tree'],
  interactivos: ['inter', 'gem', 'gema', 'coin', 'moneda', 'door', 'puerta', 'item', 'switch'],
};

const inferEntryCategory = (name: string): CategoryKey | null => {
  const lower = String(name || '').toLowerCase();
  for (const cat of Object.keys(CATEGORY_KEYWORDS) as CategoryKey[]) {
    if (CATEGORY_KEYWORDS[cat].some(keyword => lower.includes(keyword))) return cat;
  }
  return null;
};

const createPixels = (width: number, height: number, slot = 0): number[][] =>
  Array.from({ length: height }, () => Array.from({ length: width }, () => slot & 0x0f));

const normalizePixels = (pixels: number[][] | undefined, width: number, height: number): number[][] => {
  if (!pixels || pixels.length !== height || pixels.some(row => row.length !== width)) return createPixels(width, height, 0);
  return pixels.map(row => row.map(value => Math.max(0, Math.min(15, Number(value) || 0))));
};

const resolveSlotHex = (slots: Screen5PaletteSlot[], slot: number): string => {
  const hex = slots[slot]?.hex;
  return !hex || hex === 'rgba(0,0,0,0)' ? '#000' : hex;
};

const clampInt = (value: unknown, min: number, max: number, fallback: number): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(numeric)));
};

const toHex = (value: number): string => `0x${value.toString(16).toUpperCase().padStart(2, '0')}`;

/** True if a command's destination rect covers pixel (x,y). Mirrors the legacy editor. */
const commandContainsPoint = (command: Msx2BitmapRoomCommand, x: number, y: number): boolean => {
  if (command.op === 'fill') return x >= command.x && x < command.x + command.w && y >= command.y && y < command.y + command.h;
  if (command.op === 'lineH') return y === command.y && x >= command.x && x < command.x + command.length;
  if (command.op === 'lineV') return x === command.x && y >= command.y && y < command.y + command.length;
  return x >= command.dx && x < command.dx + (command.w || GRID) && y >= command.dy && y < command.dy + (command.h || GRID);
};

/** Reads a value from a 2D number grid, treating missing rows/cols as 0. */
const readCell = (grid: number[][] | undefined, cellX: number, cellY: number): number => grid?.[cellY]?.[cellX] ?? 0;

/**
 * Immutably writes a value into a 2D number grid, growing it (filling with 0) as
 * needed so the target cell exists. Returns a fresh array; never mutates input.
 */
const writeCell = (grid: number[][] | undefined, cellX: number, cellY: number, value: number, cols: number, rows: number): number[][] => {
  const height = Math.max(rows, cellY + 1, grid?.length || 0);
  const width = Math.max(cols, cellX + 1, ...(grid || []).map(row => row.length), 0);
  const next: number[][] = [];
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) row.push(grid?.[y]?.[x] ?? 0);
    next.push(row);
  }
  next[cellY][cellX] = value;
  return next;
};

/** Flatten the room composition commands into a SCREEN_W x SCREEN_H slot grid (same idea as the legacy editor's renderComposition). */
const renderComposition = (room: Msx2Screen4BitmapRoom, atlasPixels: number[][]): number[][] => {
  const pixels = createPixels(SCREEN_W, SCREEN_H, 0);
  const atlasEntries = new Map((room.atlas?.entries || []).map(entry => [entry.id, entry]));
  (room.composition?.commands || []).forEach(command => {
    const applyFill = (x: number, y: number, w: number, h: number, color: number) => {
      for (let yy = Math.max(0, y); yy < Math.min(SCREEN_H, y + h); yy++) {
        for (let xx = Math.max(0, x); xx < Math.min(SCREEN_W, x + w); xx++) pixels[yy][xx] = color & 0x0f;
      }
    };
    if (command.op === 'fill') return applyFill(command.x, command.y, command.w, command.h, command.color);
    if (command.op === 'lineH') return applyFill(command.x, command.y, command.length, 1, command.color);
    if (command.op === 'lineV') return applyFill(command.x, command.y, 1, command.length, command.color);
    const entry = atlasEntries.get(command.atlasEntryId);
    if (!entry) return;
    const w = Math.max(1, clampInt(command.w, 1, SCREEN_W, entry.w));
    const h = Math.max(1, clampInt(command.h, 1, SCREEN_H, entry.h));
    for (let yy = 0; yy < h; yy++) {
      for (let xx = 0; xx < w; xx++) {
        const destY = command.dy + yy;
        const destX = command.dx + xx;
        if (destY < 0 || destY >= SCREEN_H || destX < 0 || destX >= SCREEN_W) continue;
        pixels[destY][destX] = atlasPixels[entry.sy + yy]?.[entry.sx + xx] ?? 0;
      }
    }
  });
  return pixels;
};

/**
 * Builds the 16 x rows tile-map grid (atlas-entry index + 1 per cell; 0 = empty) for the visible
 * page. Prefers the persisted `room.tileGrid`; otherwise reconstructs it from the `copy` commands
 * (later commands overwrite the same cell, matching the render's "last wins").
 */
const buildTileGrid = (room: Msx2Screen4BitmapRoom, cols: number, rows: number): number[][] => {
  const entries = room.atlas?.entries || [];
  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
  if (Array.isArray(room.tileGrid)) {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const v = room.tileGrid[y]?.[x] ?? 0;
        grid[y][x] = v > 0 && v - 1 < entries.length ? v : 0;
      }
    }
    return grid;
  }
  const idToIndex = new Map(entries.map((entry, index) => [entry.id, index]));
  for (const command of room.composition?.commands || []) {
    if (command.op !== 'copy') continue;
    const index = idToIndex.get(command.atlasEntryId);
    if (index === undefined) continue;
    const cx = Math.floor(command.dx / GRID);
    const cy = Math.floor(command.dy / GRID);
    if (cx >= 0 && cx < cols && cy >= 0 && cy < rows) grid[cy][cx] = index + 1;
  }
  return grid;
};

interface Msx2BitmapScreenEditorProps {
  room: Msx2Screen4BitmapRoom;
  onUpdate: (data: Partial<Msx2Screen4BitmapRoom>, newAssets?: ProjectAsset[]) => void;
  allAssets?: ProjectAsset[];
  setStatusBarMessage?: (m: string) => void;
  /** Creates a new bitmap room adjacent to the current one (and the WorldMap rail). */
  onCreateAdjacentRoom?: (direction: ConnectionDirection) => void;
  /** Opens an existing room asset for editing (minimap navigation to a neighbour). */
  onOpenRoom?: (assetId: string) => void;
}

// Cardinal directions for the world-minimap cross. north=up, south=down, west=left, east=right.
const DIRECTION_LABELS: Record<ConnectionDirection, string> = {
  north: 'Norte',
  south: 'Sur',
  east: 'Este',
  west: 'Oeste',
};

interface CollapsiblePanelProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({ title, isOpen, onToggle, children, className = '' }) => (
  <section className={`rounded border border-msx-border bg-msx-panelbg ${className}`}>
    <div className="flex items-center justify-between gap-2 border-b border-msx-border px-2 py-1.5">
      <h4 className="text-sm pixel-font text-msx-highlight truncate">{title}</h4>
      <button
        type="button"
        className="text-msx-textsecondary hover:text-msx-highlight"
        onClick={onToggle}
        title={isOpen ? `Hide ${title}` : `Show ${title}`}
        aria-label={isOpen ? `Hide ${title}` : `Show ${title}`}
      >
        {isOpen ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
    {isOpen && <div className="p-2">{children}</div>}
  </section>
);

interface AtlasThumbProps {
  entry: Msx2BitmapRoomAtlasEntry;
  atlasPixels: number[][];
  slots: Screen5PaletteSlot[];
  isSelected: boolean;
  onSelect: () => void;
}

const AtlasThumb: React.FC<AtlasThumbProps> = ({ entry, atlasPixels, slots, isSelected, onSelect }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = Math.max(1, entry.w || 8);
  const height = Math.max(1, entry.h || 8);
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        ctx.fillStyle = resolveSlotHex(slots, atlasPixels[entry.sy + y]?.[entry.sx + x] ?? 0);
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [entry, atlasPixels, slots, width, height]);
  return (
    <button
      type="button"
      className={`rounded border p-1 text-left bg-msx-bgcolor hover:border-msx-highlight ${isSelected ? 'border-msx-highlight' : 'border-msx-border'}`}
      title={`${entry.name} (${entry.w}x${entry.h})`}
      onClick={onSelect}
    >
      <div className="aspect-square w-full bg-black border border-black/70 overflow-hidden">
        <canvas ref={canvasRef} width={width} height={height} className="w-full h-full" style={{ imageRendering: 'pixelated' }} />
      </div>
      <div className="mt-1 text-[0.6rem] leading-tight text-msx-textprimary truncate">{entry.name}</div>
    </button>
  );
};

const MINIMAP_STEP = 4;

interface RoomMinimapThumbProps {
  asset: ProjectAsset;
  isCurrent: boolean;
  /** When provided (and not the current room), the thumb becomes a clickable "open & edit" target. */
  onOpen?: () => void;
}

/** Renders a downsampled thumbnail of a bitmap room's composed page for the world minimap. */
const RoomMinimapThumb: React.FC<RoomMinimapThumbProps> = ({ asset, isCurrent, onOpen }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const room = asset.data as Msx2Screen4BitmapRoom;
  const tw = Math.ceil(SCREEN_W / MINIMAP_STEP);
  const th = Math.ceil(SCREEN_H / MINIMAP_STEP);
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const slots = ensureScreen5PaletteSlots(room?.palette).slots;
    const pixels = renderComposition(room, room?.atlas?.pixels || []);
    ctx.clearRect(0, 0, tw, th);
    for (let y = 0; y < th; y++) {
      for (let x = 0; x < tw; x++) {
        ctx.fillStyle = resolveSlotHex(slots, pixels[y * MINIMAP_STEP]?.[x * MINIMAP_STEP] ?? 0);
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [room, tw, th]);
  const interactive = !!onOpen && !isCurrent;
  return (
    <div
      title={interactive ? `Editar "${asset.name}"` : asset.name}
      role={interactive ? 'button' : undefined}
      onClick={interactive ? onOpen : undefined}
      className={`rounded border overflow-hidden transition-colors ${
        isCurrent
          ? 'border-msx-highlight ring-1 ring-msx-highlight'
          : interactive
            ? 'border-msx-border cursor-pointer hover:border-msx-highlight hover:ring-1 hover:ring-msx-highlight'
            : 'border-msx-border'
      }`}
    >
      <canvas ref={canvasRef} width={tw} height={th} className="w-full block bg-black" style={{ imageRendering: 'pixelated', aspectRatio: '4 / 3' }} />
    </div>
  );
};

interface EmptySilhouetteProps {
  direction: ConnectionDirection;
  interactive: boolean;
  isPending: boolean;
  onRequest: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Dashed placeholder for a missing neighbour; opens an inline confirm on click. */
const EmptySilhouette: React.FC<EmptySilhouetteProps> = ({ direction, interactive, isPending, onRequest, onConfirm, onCancel }) => (
  <div className="relative">
    <button
      type="button"
      disabled={!interactive}
      onClick={onRequest}
      title={interactive ? `Crear pantalla al ${DIRECTION_LABELS[direction]}` : 'Sin destino'}
      className={`w-full block rounded border border-dashed ${interactive ? 'border-msx-border text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight cursor-pointer' : 'border-msx-border/50 text-msx-textsecondary/40 cursor-default'} bg-msx-bgcolor/40 flex items-center justify-center text-lg leading-none`}
      style={{ aspectRatio: '4 / 3' }}
    >
      {interactive ? '+' : ''}
    </button>
    {isPending && (
      <div className="absolute z-30 left-1/2 -translate-x-1/2 top-full mt-1 w-40 rounded border border-msx-highlight bg-msx-panelbg p-2 shadow-lg space-y-1">
        <div className="text-[0.65rem] text-msx-textprimary text-center">¿Crear pantalla al {DIRECTION_LABELS[direction]}?</div>
        <div className="flex gap-1">
          <button type="button" onClick={onConfirm} className="flex-1 text-[0.65rem] rounded px-1 py-0.5 border border-msx-highlight text-msx-highlight hover:bg-msx-highlight/20">Crear</button>
          <button type="button" onClick={onCancel} className="flex-1 text-[0.65rem] rounded px-1 py-0.5 border border-msx-border text-msx-textsecondary hover:border-msx-highlight">Cancelar</button>
        </div>
      </div>
    )}
  </div>
);

export const Msx2BitmapScreenEditor: React.FC<Msx2BitmapScreenEditorProps> = ({ room, onUpdate, allAssets = [], setStatusBarMessage, onCreateAdjacentRoom, onOpenRoom }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // World-minimap: pending "create screen at <dir>" inline confirm.
  const [pendingCreateDir, setPendingCreateDir] = useState<ConnectionDirection | null>(null);

  // --- Local UI state ---
  const [tool, setTool] = useState<BrushTool>('brush');
  const [activeColor, setActiveColor] = useState(4);
  const [selectedAtlasEntryId, setSelectedAtlasEntryId] = useState(room.atlas?.entries?.[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('suelo');
  const [zoom, setZoom] = useState(2);
  const [showGrid, setShowGrid] = useState(true);
  const [editMode, setEditMode] = useState<'normal' | 'rect' | 'flood'>('normal');
  const [isTileLibraryOpen, setIsTileLibraryOpen] = useState(false);
  const [isPalettePickerOpen, setIsPalettePickerOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [layerVisible, setLayerVisible] = useState<Record<LayerKey, boolean>>({ visual: true, collision: false, objects: false });
  const [layerLocked, setLayerLocked] = useState<Record<LayerKey, boolean>>({ visual: false, collision: false, objects: false });
  const [activeLayer, setActiveLayer] = useState<LayerKey>('visual');
  const [cellProps, setCellProps] = useState<Record<string, boolean>>({});

  // collapsible panel toggles
  const [openTools, setOpenTools] = useState(true);
  const [openAtlas, setOpenAtlas] = useState(true);
  const [openBitmapTiles, setOpenBitmapTiles] = useState(true);
  const [openCategories, setOpenCategories] = useState(true);
  const [openLayers, setOpenLayers] = useState(true);
  const [openMinimap, setOpenMinimap] = useState(true);
  const [openConfig, setOpenConfig] = useState(true);
  const [openGridOptions, setOpenGridOptions] = useState(true);
  const [openTarget, setOpenTarget] = useState(true);
  const [openPalette, setOpenPalette] = useState(true);
  const [openBudget, setOpenBudget] = useState(true);

  const { slots, changed } = useMemo(() => ensureScreen5PaletteSlots(room.palette), [room.palette]);
  const atlasWidth = Math.max(1, Number(room.atlas?.width) || 256);
  const atlasHeight = Math.max(1, Number(room.atlas?.height) || 128);
  const atlasPixels = useMemo(() => normalizePixels(room.atlas?.pixels, atlasWidth, atlasHeight), [room.atlas?.pixels, atlasWidth, atlasHeight]);
  const atlasEntries = room.atlas?.entries || [];
  const selectedAtlasEntry = atlasEntries.find(entry => entry.id === selectedAtlasEntryId) || atlasEntries[0];
  const screen5BitmapTileAssets = useMemo(
    () => allAssets.filter(asset => asset.type === 'msx2bitmaptile'),
    [allAssets],
  );
  // Category filter: keep entries whose inferred category matches, plus uncategorized ones.
  const visibleAtlasEntries = useMemo(
    () => atlasEntries.filter(entry => {
      const cat = inferEntryCategory(entry.name);
      return cat === null || cat === selectedCategory;
    }),
    [atlasEntries, selectedCategory],
  );
  const composedPixels = useMemo(() => renderComposition(room, atlasPixels), [room, atlasPixels]);

  const roomHeight = Number(room.height) || SCREEN_H;
  const gridWidth = Math.floor(SCREEN_W / GRID); // 16 (256/16)
  const gridHeight = Math.floor(roomHeight / GRID); // 12 (192) / 13 (212)
  const collisionCols = Math.floor(SCREEN_W / COLLISION_CELL); // 16
  const collisionRows = Math.floor(roomHeight / COLLISION_CELL); // 12 (192) / 13 (212)

  // bitmap rooms in the project, for the minimap (real data when available)
  const bitmapRooms = useMemo(
    () => allAssets.filter(asset => asset.type === 'msx2bitmaproom'),
    [allAssets],
  );

  // World-minimap adjacency: find the WorldMap that contains this room and derive
  // the neighbour room asset per cardinal direction from its connections ("rails").
  // A connection encodes both ends, so we accept either orientation:
  //   - fromNode===current && fromDirection===dir  → neighbour is toNode
  //   - toNode===current   && toDirection===dir    → neighbour is fromNode (reverse rail)
  const neighbourRooms = useMemo(() => {
    const result: Record<ConnectionDirection, ProjectAsset | null> = {
      north: null, south: null, east: null, west: null,
    };
    const worldmapAsset = allAssets.find(asset =>
      asset.type === 'worldmap'
      && (asset.data as WorldMapGraph | undefined)?.nodes?.some(node => node.screenAssetId === room.id),
    );
    if (!worldmapAsset) return result;
    const graph = worldmapAsset.data as WorldMapGraph;
    const currentNode = graph.nodes.find(node => node.screenAssetId === room.id);
    if (!currentNode) return result;
    const roomById = new Map(bitmapRooms.map(asset => [asset.id, asset]));
    const nodeById = new Map(graph.nodes.map(node => [node.id, node]));
    const resolveRoom = (nodeId: string): ProjectAsset | null => {
      const node = nodeById.get(nodeId);
      if (!node) return null;
      return roomById.get(node.screenAssetId) ?? null;
    };
    (graph.connections || []).forEach(connection => {
      if (connection.fromNodeId === currentNode.id) {
        result[connection.fromDirection] = result[connection.fromDirection] ?? resolveRoom(connection.toNodeId);
      }
      if (connection.toNodeId === currentNode.id) {
        result[connection.toDirection] = result[connection.toDirection] ?? resolveRoom(connection.fromNodeId);
      }
    });
    return result;
  }, [allAssets, bitmapRooms, room.id]);

  // VRAM budget (realistic): atlas (4bpp) + visible framebuffer (128 bytes/line * height).
  const vramBytes = Math.round((atlasWidth * atlasHeight) / 2) + 128 * roomHeight;
  const vramKb = vramBytes / 1024;
  const VRAM_LIMIT_KB = 128;

  useEffect(() => {
    if (changed) onUpdate({ palette: slots.map(slot => ({ ...slot })) });
  }, [changed, onUpdate, slots]);

  // --- Main canvas render ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = SCREEN_W * zoom;
    canvas.height = roomHeight * zoom;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < roomHeight; y++) {
      for (let x = 0; x < SCREEN_W; x++) {
        const slot = composedPixels[y]?.[x] ?? 0;
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
        ctx.lineTo(x * zoom + 0.5, roomHeight * zoom);
        ctx.stroke();
      }
      for (let y = 0; y <= roomHeight; y += GRID) {
        ctx.beginPath();
        ctx.moveTo(0, y * zoom + 0.5);
        ctx.lineTo(SCREEN_W * zoom, y * zoom + 0.5);
        ctx.stroke();
      }
    }
    // Collision/objects overlay: tint cells whose stored flags are non-zero when the layer is visible.
    const drawOverlay = (grid: number[][] | undefined, tint: string) => {
      for (let cy = 0; cy < collisionRows; cy++) {
        for (let cx = 0; cx < collisionCols; cx++) {
          if ((grid?.[cy]?.[cx] ?? 0) === 0) continue;
          ctx.fillStyle = tint;
          ctx.fillRect(cx * COLLISION_CELL * zoom, cy * COLLISION_CELL * zoom, COLLISION_CELL * zoom, COLLISION_CELL * zoom);
        }
      }
    };
    if (layerVisible.collision) drawOverlay(room.collision, 'rgba(255,64,64,0.32)');
    if (layerVisible.objects) drawOverlay(room.behavior, 'rgba(64,160,255,0.32)');

    if (selectedCell) {
      ctx.strokeStyle = '#FFD24A';
      ctx.lineWidth = 2;
      ctx.strokeRect(selectedCell.x * GRID * zoom + 1, selectedCell.y * GRID * zoom + 1, GRID * zoom - 2, GRID * zoom - 2);
      ctx.lineWidth = 1;
    }
  }, [composedPixels, showGrid, slots, zoom, roomHeight, selectedCell, layerVisible, room.collision, room.behavior, collisionCols, collisionRows]);

  const commands = room.composition?.commands || [];

  // Persist a new command list (immutable; same shape as the legacy editor's updateComposition).
  const updateComposition = (nextCommands: Msx2BitmapRoomCommand[]) => {
    onUpdate({ composition: { source: 'authored', commands: nextCommands } });
  };

  // Tile-map grid (16 x rows): source of truth for placed tiles — one 16x16 tile per cell,
  // so painting over a cell overwrites (last wins) instead of stacking copy commands.
  const tileGrid = useMemo(() => buildTileGrid(room, gridWidth, gridHeight), [room, gridWidth, gridHeight]);

  // Persist a tile-grid change: keep the color/HUD fills+lines (non-'copy') and rebuild one
  // 'copy' per occupied cell, and store the grid itself (compact tilemap for MSX2 export).
  const applyTileGrid = (
    nextGrid: number[][],
    filterNonCopy?: (cmds: Msx2BitmapRoomCommand[]) => Msx2BitmapRoomCommand[],
  ) => {
    const entries = room.atlas?.entries || [];
    let nonCopy = (room.composition?.commands || []).filter(command => command.op !== 'copy');
    if (filterNonCopy) nonCopy = filterNonCopy(nonCopy);
    const tileCmds: Msx2BitmapRoomCommand[] = [];
    for (let y = 0; y < nextGrid.length; y++) {
      for (let x = 0; x < nextGrid[y].length; x++) {
        const v = nextGrid[y][x];
        if (!v) continue;
        const entry = entries[v - 1];
        if (!entry) continue;
        tileCmds.push({ id: `tile_${x}_${y}`, op: 'copy', atlasEntryId: entry.id, dx: x * GRID, dy: y * GRID, w: entry.w || GRID, h: entry.h || GRID });
      }
    }
    onUpdate({ tileGrid: nextGrid, composition: { source: 'authored', commands: [...nonCopy, ...tileCmds] } });
  };

  // Wipe ALL screen content (tiles, color fills/lines, and collision/effects/behavior layers),
  // keeping the palette and atlas (resources). Confirms first.
  const handleClearAll = () => {
    if (!window.confirm('¿Borrar TODO el contenido de esta pantalla SCREEN 5 (tiles, rellenos y capas de colisión)? Se conservan la paleta y el atlas.')) return;
    const emptyTiles = Array.from({ length: gridHeight }, () => Array.from({ length: gridWidth }, () => 0));
    const emptyCollision = () => Array.from({ length: collisionRows }, () => Array.from({ length: collisionCols }, () => 0));
    onUpdate({
      composition: { source: 'authored', commands: [] },
      tileGrid: emptyTiles,
      collision: emptyCollision(),
      effects: emptyCollision(),
      behavior: emptyCollision(),
    });
    setSelectedCell(null);
    setStatusBarMessage?.('SCREEN 5: pantalla vaciada (tiles, rellenos y capas).');
  };

  // --- Visual-layer painting on the 8px grid ---
  // px/py are pixel coords; painting snaps to the GRID (16px, matching 16x16 tiles).
  const paintVisualAt = (px: number, py: number) => {
    const snapX = Math.max(0, Math.min(SCREEN_W - GRID, Math.floor(px / GRID) * GRID));
    const snapY = Math.max(0, Math.min(roomHeight - GRID, Math.floor(py / GRID) * GRID));
    const id = `cmd_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    if (tool === 'eraser') {
      // Clear the tile cell (matrix) and drop any color fill/line that covers it.
      const cx = Math.max(0, Math.min(gridWidth - 1, Math.floor(px / GRID)));
      const cy = Math.max(0, Math.min(gridHeight - 1, Math.floor(py / GRID)));
      const next = tileGrid.map(row => [...row]);
      next[cy][cx] = 0;
      applyTileGrid(next, nonCopy => nonCopy.filter(command => !commandContainsPoint(command, snapX, snapY)));
      return;
    }
    if (tool === 'fill') {
      // Tile fill (MSX BASIC PAINT-style): 4-connected flood-fill on the tile matrix from the
      // clicked cell, replacing every contiguous cell holding the same tile (incl. empty) with the
      // selected tile. Cells holding a different tile act as the implicit border that stops it.
      if (selectedAtlasEntry) {
        const index = atlasEntries.indexOf(selectedAtlasEntry);
        if (index < 0) return;
        const cx = Math.max(0, Math.min(gridWidth - 1, Math.floor(px / GRID)));
        const cy = Math.max(0, Math.min(gridHeight - 1, Math.floor(py / GRID)));
        const target = tileGrid[cy]?.[cx] ?? 0;
        const value = index + 1;
        if (target === value) return;
        const next = tileGrid.map(row => [...row]);
        const stack: [number, number][] = [[cx, cy]];
        while (stack.length) {
          const [x, y] = stack.pop() as [number, number];
          if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) continue;
          if (next[y][x] !== target) continue;
          next[y][x] = value;
          stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
        applyTileGrid(next);
        return;
      }
      // No tile selected: fall back to a pixel-level colour flood-fill (scanline) using activeColor,
      // emitted as 1px-tall fill commands (one per horizontal run).
      const h = composedPixels.length || roomHeight;
      const at = (x: number, y: number) => composedPixels[y]?.[x] ?? 0;
      const target = at(px, py);
      if (target === (activeColor & 0x0f)) return;
      const seen = new Uint8Array(SCREEN_W * h);
      const runs: { y: number; x0: number; x1: number }[] = [];
      const stack: [number, number][] = [[px, py]];
      let guard = 0;
      while (stack.length && guard < 300000) {
        guard++;
        const [sx, sy] = stack.pop() as [number, number];
        if (sx < 0 || sx >= SCREEN_W || sy < 0 || sy >= h) continue;
        if (seen[sy * SCREEN_W + sx] || at(sx, sy) !== target) continue;
        let x0 = sx;
        while (x0 > 0 && !seen[sy * SCREEN_W + (x0 - 1)] && at(x0 - 1, sy) === target) x0--;
        let x1 = sx;
        while (x1 < SCREEN_W - 1 && !seen[sy * SCREEN_W + (x1 + 1)] && at(x1 + 1, sy) === target) x1++;
        for (let x = x0; x <= x1; x++) seen[sy * SCREEN_W + x] = 1;
        runs.push({ y: sy, x0, x1 });
        for (const ny of [sy - 1, sy + 1]) {
          if (ny < 0 || ny >= h) continue;
          for (let x = x0; x <= x1; x++) {
            if (!seen[ny * SCREEN_W + x] && at(x, ny) === target) stack.push([x, ny]);
          }
        }
      }
      if (runs.length === 0) return;
      if (runs.length > 4096) {
        setStatusBarMessage?.('SCREEN 5: region de relleno demasiado grande, cancelado.');
        return;
      }
      const stamp = Date.now();
      const fillCmds: Msx2BitmapRoomCommand[] = runs.map(run => ({
        id: `cmd_${stamp}_${run.y}_${run.x0}`,
        op: 'fill',
        x: run.x0,
        y: run.y,
        w: run.x1 - run.x0 + 1,
        h: 1,
        color: activeColor,
      }));
      updateComposition([...commands, ...fillCmds]);
      return;
    }
    // Brush: place the selected atlas tile into this cell of the matrix (overwrites — last wins).
    if (selectedAtlasEntry) {
      const index = atlasEntries.indexOf(selectedAtlasEntry);
      if (index >= 0) {
        const cx = Math.max(0, Math.min(gridWidth - 1, Math.floor(px / GRID)));
        const cy = Math.max(0, Math.min(gridHeight - 1, Math.floor(py / GRID)));
        const next = tileGrid.map(row => [...row]);
        next[cy][cx] = index + 1;
        applyTileGrid(next);
      }
    } else {
      // No tile selected: paint a single-cell color fill (preserved as a non-'copy' command).
      updateComposition([...commands, { id, op: 'fill', x: snapX, y: snapY, w: GRID, h: GRID, color: activeColor }]);
    }
  };

  // --- Collision/behavior-layer painting on the 16px grid ---
  // Toggles the active flag set for the cell. Uses `activeColor` as nothing here; the
  // collision layer paints solidity by default (Solid bit) for quick blocking-out.
  const paintCollisionAt = (px: number, py: number, grid: 'collision' | 'behavior') => {
    const cellX = Math.max(0, Math.min(collisionCols - 1, Math.floor(px / COLLISION_CELL)));
    const cellY = Math.max(0, Math.min(collisionRows - 1, Math.floor(py / COLLISION_CELL)));
    const source = grid === 'collision' ? room.collision : room.behavior;
    const current = readCell(source, cellX, cellY);
    // brush: set Solid; eraser: clear cell; fill: leave to checkbox UI (no-op block paint)
    const next = tool === 'eraser' ? 0 : (current | PROP_BIT.solid);
    const grown = writeCell(source, cellX, cellY, next, collisionCols, collisionRows);
    onUpdate(grid === 'collision' ? { collision: grown } : { behavior: grown });
  };

  // --- Canvas click → cell selection + paint ---
  // IMPORTANT: map clicks via rendered rect ratio (not raw zoom) to avoid the legacy distortion bug.
  const handleCanvasPaint = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const px = Math.floor((event.clientX - rect.left) * (SCREEN_W / rect.width));
    const py = Math.floor((event.clientY - rect.top) * (roomHeight / rect.height));
    const cellX = Math.max(0, Math.min(gridWidth - 1, Math.floor(px / GRID)));
    const cellY = Math.max(0, Math.min(gridHeight - 1, Math.floor(py / GRID)));
    setSelectedCell({ x: cellX, y: cellY });

    if (layerLocked[activeLayer]) {
      setStatusBarMessage?.(`SCREEN 5: capa "${activeLayer}" bloqueada (lock activo).`);
      return;
    }
    if (activeLayer === 'visual') {
      paintVisualAt(px, py);
      setStatusBarMessage?.(`SCREEN 5: ${tool} en celda (${cellX}, ${cellY}).`);
    } else {
      paintCollisionAt(px, py, activeLayer === 'collision' ? 'collision' : 'behavior');
      setStatusBarMessage?.(`SCREEN 5: capa ${activeLayer} actualizada en (${cellX}, ${cellY}).`);
    }
  };

  // Pointer-drag painting: paint on down and while dragging.
  const [isPainting, setIsPainting] = useState(false);
  const handleCanvasDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (event.button !== 0) return; // only left button paints; right button erases (onContextMenu)
    setIsPainting(true);
    handleCanvasPaint(event);
  };
  const handleCanvasMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPainting) return;
    // Drag-fill would re-clear the whole page each move; only stamp for brush/eraser.
    if (tool === 'fill') return;
    handleCanvasPaint(event);
  };
  const handleCanvasUp = () => setIsPainting(false);

  // Right-click on the grid erases the tile under the cell, regardless of the active tool.
  const handleCanvasContextMenu = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault(); // suppress the browser context menu
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const px = Math.floor((event.clientX - rect.left) * (SCREEN_W / rect.width));
    const py = Math.floor((event.clientY - rect.top) * (roomHeight / rect.height));
    const cellX = Math.max(0, Math.min(gridWidth - 1, Math.floor(px / GRID)));
    const cellY = Math.max(0, Math.min(gridHeight - 1, Math.floor(py / GRID)));
    setSelectedCell({ x: cellX, y: cellY });
    if (layerLocked[activeLayer]) {
      setStatusBarMessage?.(`SCREEN 5: capa "${activeLayer}" bloqueada (lock activo).`);
      return;
    }
    if (activeLayer === 'visual') {
      const snapX = Math.max(0, Math.min(SCREEN_W - GRID, Math.floor(px / GRID) * GRID));
      const snapY = Math.max(0, Math.min(roomHeight - GRID, Math.floor(py / GRID) * GRID));
      const had = tileGrid[cellY]?.[cellX] !== 0;
      const next = tileGrid.map(row => [...row]);
      next[cellY][cellX] = 0;
      applyTileGrid(next, nonCopy => nonCopy.filter(command => !commandContainsPoint(command, snapX, snapY)));
      if (had) setStatusBarMessage?.(`SCREEN 5: tile borrado en celda (${cellX}, ${cellY}).`);
    } else {
      const collX = Math.max(0, Math.min(collisionCols - 1, Math.floor(px / COLLISION_CELL)));
      const collY = Math.max(0, Math.min(collisionRows - 1, Math.floor(py / COLLISION_CELL)));
      const source = activeLayer === 'collision' ? room.collision : room.behavior;
      const grown = writeCell(source, collX, collY, 0, collisionCols, collisionRows);
      onUpdate(activeLayer === 'collision' ? { collision: grown } : { behavior: grown });
      setStatusBarMessage?.(`SCREEN 5: capa ${activeLayer} limpiada en (${collX}, ${collY}).`);
    }
  };

  // --- Atlas import (real, reused from legacy editor) ---
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
    setStatusBarMessage?.(`Importados ${addedEntries.length} tile(s) al atlas SCREEN 5.`);
  };

  // Project palette assets, for the "Cargar paleta" picker.
  const paletteAssets = useMemo(() => allAssets.filter(asset => asset.type === 'palette'), [allAssets]);

  // --- Export the selected atlas entry to the global tile library ---
  const handleExportToLibrary = () => {
    const entry = selectedAtlasEntry;
    if (!entry) {
      setStatusBarMessage?.('No hay tile de atlas seleccionado para exportar.');
      return;
    }
    const w = Math.max(1, entry.w || GRID);
    const h = Math.max(1, entry.h || GRID);
    // Slice the entry's region out of the shared atlas pixel buffer.
    const pixels: number[][] = Array.from({ length: h }, (_r, yy) =>
      Array.from({ length: w }, (_c, xx) => atlasPixels[entry.sy + yy]?.[entry.sx + xx] ?? 0),
    );
    const tile: Msx2Screen4Tile = { id: entry.id, name: entry.name, width: w, height: h, pixels };
    try {
      const saved = addEntryToMsx2TileLibrary(tile, slots, entry.name);
      setStatusBarMessage?.(`Exportado "${saved.name}" (${w}x${h}) a la biblioteca de tiles.`);
    } catch (error) {
      setStatusBarMessage?.(`Error al exportar a biblioteca: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleSaveAtlasEntryAsBitmapTileAsset = () => {
    const entry = selectedAtlasEntry;
    if (!entry) {
      setStatusBarMessage?.('No hay tile de atlas seleccionado para guardar como asset SCREEN 5.');
      return;
    }
    const w = Math.max(1, entry.w || GRID);
    const h = Math.max(1, entry.h || GRID);
    const pixels: number[][] = Array.from({ length: h }, (_r, yy) =>
      Array.from({ length: w }, (_c, xx) => atlasPixels[entry.sy + yy]?.[entry.sx + xx] ?? 0),
    );

    const draftTileId = `bitmap_tile_screen5_${Date.now()}`;
    const matchingPalette = findMatchingScreen5PaletteAsset(slots, allAssets);
    const paletteAsset = matchingPalette ?? createScreen5PaletteAssetForTile(slots, entry.name, draftTileId, allAssets);
    const tileAsset = buildScreen5BitmapTileAsset({
      name: entry.name,
      width: w,
      height: h,
      pixels,
      paletteId: paletteAsset.id,
      existingAssets: matchingPalette ? allAssets : [...allAssets, paletteAsset],
      sourceType: 'atlas-export',
    });
    if (!matchingPalette) {
      (paletteAsset.data as PaletteAsset).createdFromTileId = tileAsset.id;
    }
    onUpdate({}, matchingPalette ? [tileAsset] : [paletteAsset, tileAsset]);
    setStatusBarMessage?.(
      matchingPalette
        ? `Guardado "${tileAsset.name}" como MSX2 Bitmap Tile usando la paleta "${matchingPalette.name}".`
        : `Guardado "${tileAsset.name}" y creada la paleta "${paletteAsset.name}".`
    );
  };

  const handleImportBitmapTileAsset = (asset: ProjectAsset) => {
    const tile = asset.data as BitmapTileScreen5 | undefined;
    if (!tile || !tile.paletteId) {
      setStatusBarMessage?.(`"${asset.name}" no tiene paletteId; no se puede importar.`);
      return;
    }
    const paletteAsset = allAssets.find(candidate => candidate.id === tile.paletteId && candidate.type === 'palette');
    const palette = (paletteAsset?.data as PaletteAsset | undefined)?.slots;
    if (!palette) {
      setStatusBarMessage?.(`No existe la paleta asociada a "${asset.name}".`);
      return;
    }
    const shouldApplyPalette = !areScreen5PalettesEquivalent(slots, palette);
    if (shouldApplyPalette) {
      const ok = window.confirm(`El tile "${asset.name}" usa la paleta "${paletteAsset?.name || tile.paletteId}", distinta de la pantalla activa. ¿Cargar esa paleta en la pantalla antes de importarlo?`);
      if (!ok) {
        setStatusBarMessage?.('Importación cancelada para evitar colores incorrectos.');
        return;
      }
    }
    const atlasTile = bitmapTileScreen5ToAtlasTile(tile);
    const { atlas, addedEntries } = importTilesIntoAtlas(
      {
        width: atlasWidth,
        height: atlasHeight,
        offscreenBaseY: room.atlas?.offscreenBaseY || 320,
        pixels: room.atlas?.pixels,
        entries: atlasEntries,
      },
      [atlasTile as Msx2Screen4Tile],
    );
    onUpdate({
      atlas,
      ...(shouldApplyPalette ? { palette: palette.map(slot => ({ ...slot })) } : {}),
    });
    if (addedEntries[0]) setSelectedAtlasEntryId(addedEntries[0].id);
    setStatusBarMessage?.(`Importado "${asset.name}" al atlas SCREEN 5.`);
  };

  // --- Load a 16-color palette from a project palette asset ---
  const handleLoadPalette = () => {
    if (paletteAssets.length === 0) {
      setStatusBarMessage?.('No hay assets de paleta en el proyecto.');
      return;
    }
    setIsPalettePickerOpen(true);
  };

  const applyPaletteAsset = (asset: ProjectAsset) => {
    const data = asset.data as { slots?: Screen5PaletteSlot[] } | undefined;
    const { slots: normalized } = ensureScreen5PaletteSlots(data?.slots);
    onUpdate({ palette: normalized.map(slot => ({ ...slot })) });
    setIsPalettePickerOpen(false);
    setStatusBarMessage?.(`Paleta "${asset.name}" cargada (16 colores SCREEN 5).`);
  };

  const toggleLayerVisible = (key: LayerKey) => setLayerVisible(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleLayerLocked = (key: LayerKey) => setLayerLocked(prev => ({ ...prev, [key]: !prev[key] }));

  // Map the selected 8px cell to the 16px collision-cell grid (2 visual cells per collision cell).
  const selectedCollisionCell = selectedCell
    ? {
        x: Math.max(0, Math.min(collisionCols - 1, Math.floor((selectedCell.x * GRID) / COLLISION_CELL))),
        y: Math.max(0, Math.min(collisionRows - 1, Math.floor((selectedCell.y * GRID) / COLLISION_CELL))),
      }
    : null;

  // Reflect the selected cell's stored collision flags into the checkbox state.
  useEffect(() => {
    if (!selectedCollisionCell) {
      setCellProps({});
      return;
    }
    const flags = readCell(room.collision, selectedCollisionCell.x, selectedCollisionCell.y);
    const next: Record<string, boolean> = {};
    PROPERTY_FLAGS.forEach(flag => { next[flag.key] = (flags & PROP_BIT[flag.key]) !== 0; });
    setCellProps(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCollisionCell?.x, selectedCollisionCell?.y, room.collision]);

  const toggleProp = (key: string) => {
    if (!selectedCollisionCell) {
      setStatusBarMessage?.('Selecciona una celda en el lienzo primero.');
      return;
    }
    const bit = PROP_BIT[key];
    const current = readCell(room.collision, selectedCollisionCell.x, selectedCollisionCell.y);
    const nextValue = (current & bit) ? (current & ~bit) : (current | bit);
    const grown = writeCell(room.collision, selectedCollisionCell.x, selectedCollisionCell.y, nextValue, collisionCols, collisionRows);
    onUpdate({ collision: grown });
    setStatusBarMessage?.(`SCREEN 5: ${key} ${(nextValue & bit) ? 'ON' : 'OFF'} en celda (${selectedCollisionCell.x}, ${selectedCollisionCell.y}).`);
  };

  const selectedCellSlot = selectedCell ? composedPixels[selectedCell.y * GRID]?.[selectedCell.x * GRID] ?? 0 : 0;
  const statusCategoryLabel = CATEGORIES.find(c => c.key === selectedCategory)?.label || '';

  const toolBtn = (key: BrushTool, label: string, icon: React.ReactNode) => (
    <Button size="sm" variant={tool === key ? 'primary' : 'secondary'} icon={icon} onClick={() => setTool(key)}>{label}</Button>
  );

  return (
    <Panel title="MSX2 SCREEN 5 Bitmap Editor" icon={<MapIcon />} className="flex-grow flex flex-col min-h-0 bg-msx-bgcolor" bodyClassName="flex-grow flex flex-col min-h-0 overflow-hidden">
      {/* TOP TOOLBAR */}
      <div className="shrink-0 p-2 border-b border-msx-border flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" icon={<PlusCircleIcon />} onClick={() => setIsTileLibraryOpen(true)} title="Importar tile desde la biblioteca global como bloque de atlas">
          Importar tile
        </Button>
        <Button size="sm" variant="secondary" icon={<FolderOpenIcon />} onClick={handleExportToLibrary} title="Exportar el tile/atlas seleccionado a la biblioteca">
          Exportar a biblioteca
        </Button>
        <Button size="sm" variant="secondary" icon={<SaveIcon />} onClick={handleSaveAtlasEntryAsBitmapTileAsset} title="Guardar el tile seleccionado como asset MSX2 Bitmap Tile con paletteId persistente">
          Guardar asset bitmap
        </Button>
        <Button size="sm" variant="secondary" icon={<PaintBrushIcon />} onClick={handleLoadPalette} title="Cargar una paleta de 16 colores SCREEN 5">
          Cargar paleta de colores
        </Button>
        <Button size="sm" variant="danger" icon={<EraserIcon />} onClick={handleClearAll} title="Vaciar todo el contenido de la pantalla (tiles, rellenos y capas)">
          Clear All
        </Button>
        <span className="ml-auto text-[0.7rem] text-msx-textsecondary pixel-font">Tile Map Editor — MSX2 (SCREEN 5 beta)</span>
      </div>

      <div className="flex flex-grow min-h-0 overflow-hidden">
        {/* LEFT SIDEBAR */}
        <aside className="w-60 border-r border-msx-border p-2 overflow-y-auto space-y-2">
          <CollapsiblePanel title="Herramientas" isOpen={openTools} onToggle={() => setOpenTools(v => !v)}>
            <div className="grid grid-cols-1 gap-1">
              {toolBtn('brush', 'Pincel', <PencilIcon />)}
              {toolBtn('eraser', 'Borrador', <EraserIcon />)}
              {toolBtn('fill', 'Rellenar', <PaintBrushIcon />)}
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="Atlas de tiles" isOpen={openAtlas} onToggle={() => setOpenAtlas(v => !v)}>
            {atlasEntries.length === 0 ? (
              <div className="rounded border border-msx-border bg-msx-bgcolor p-2 text-xs text-msx-textsecondary">
                No hay tiles. Usa "Importar tile".
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto pr-1">
                <div className="grid grid-cols-3 gap-1">
                  {visibleAtlasEntries.map(entry => (
                    <AtlasThumb
                      key={entry.id}
                      entry={entry}
                      atlasPixels={atlasPixels}
                      slots={slots}
                      isSelected={entry.id === selectedAtlasEntry?.id}
                      onSelect={() => setSelectedAtlasEntryId(entry.id)}
                    />
                  ))}
                </div>
                {visibleAtlasEntries.length === 0 && (
                  <div className="mt-1 text-[0.6rem] text-msx-textsecondary">Sin tiles en la categoría "{statusCategoryLabel}".</div>
                )}
              </div>
            )}
          </CollapsiblePanel>

          <CollapsiblePanel title="MSX2 Bitmap Tiles" isOpen={openBitmapTiles} onToggle={() => setOpenBitmapTiles(v => !v)}>
            {screen5BitmapTileAssets.length === 0 ? (
              <div className="rounded border border-msx-border bg-msx-bgcolor p-2 text-xs text-msx-textsecondary">
                No hay assets Screen 5 Bitmap Tiles en el proyecto.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {screen5BitmapTileAssets.map(asset => {
                  const tile = asset.data as BitmapTileScreen5 | undefined;
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => handleImportBitmapTileAsset(asset)}
                      className="w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-left text-xs text-msx-textprimary hover:border-msx-highlight"
                      title={`Importar ${asset.name} al atlas (${tile?.width || 0}x${tile?.height || 0})`}
                    >
                      <span className="block truncate">{asset.name}</span>
                      <span className="text-[0.6rem] text-msx-textsecondary">{tile?.width || 0}x{tile?.height || 0}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </CollapsiblePanel>

          <CollapsiblePanel title="Categorías" isOpen={openCategories} onToggle={() => setOpenCategories(v => !v)}>
            {/* Filters the atlas grid by category inferred from entry names (uncategorized always shown). */}
            <div className="grid grid-cols-1 gap-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`text-left text-xs rounded px-2 py-1 border ${selectedCategory === cat.key ? 'border-msx-highlight bg-msx-panelbg text-msx-highlight' : 'border-msx-border text-msx-textsecondary hover:border-msx-highlight'}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="Layers" isOpen={openLayers} onToggle={() => setOpenLayers(v => !v)}>
            {/* Active layer routes painting (visual→composition, collision/objects→collision/behavior maps).
                Visibility toggles the canvas overlay; lock blocks painting on that layer. */}
            <div className="space-y-1">
              {LAYERS.map(layer => (
                <div
                  key={layer.key}
                  className={`flex items-center gap-2 rounded px-2 py-1 border ${activeLayer === layer.key ? 'border-msx-highlight bg-msx-panelbg' : 'border-msx-border'}`}
                >
                  <button type="button" className="flex-1 text-left text-xs text-msx-textprimary" onClick={() => setActiveLayer(layer.key)}>
                    {layer.label}
                  </button>
                  <button type="button" title="Toggle visibility" onClick={() => toggleLayerVisible(layer.key)} className="text-msx-textsecondary hover:text-msx-highlight">
                    {layerVisible[layer.key] ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                  <button type="button" title="Toggle lock" onClick={() => toggleLayerLocked(layer.key)} className={`text-xs ${layerLocked[layer.key] ? 'text-msx-warning' : 'text-msx-textsecondary'} hover:text-msx-highlight`}>
                    {layerLocked[layer.key] ? '🔒' : '🔓'}
                  </button>
                </div>
              ))}
            </div>
          </CollapsiblePanel>
        </aside>

        {/* CENTER */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* center header */}
          <div className="px-3 py-2 border-b border-msx-border flex flex-wrap items-center gap-3 bg-msx-panelbg">
            <span className="text-sm pixel-font text-msx-highlight">MSX2 SCREEN 5</span>
            <label className="text-xs text-msx-textsecondary flex items-center gap-1">
              Zoom
              <select value={zoom} onChange={e => setZoom(Number(e.target.value))} className="bg-msx-bgcolor border border-msx-border rounded p-0.5 text-xs">
                {ZOOM_OPTIONS.map(z => <option key={z} value={z}>{z * 100}%</option>)}
              </select>
            </label>
            <button type="button" className="text-msx-textsecondary hover:text-msx-highlight" title="Zoom in" onClick={() => setZoom(z => Math.min(4, z + 1))}><ZoomInIcon /></button>
            <button type="button" className="text-msx-textsecondary hover:text-msx-highlight" title="Zoom out" onClick={() => setZoom(z => Math.max(1, z - 1))}><ZoomOutIcon /></button>
            <button type="button" className={`hover:text-msx-highlight ${showGrid ? 'text-msx-highlight' : 'text-msx-textsecondary'}`} title="Toggle grid" onClick={() => setShowGrid(v => !v)}><GridIcon /></button>
            <label className="text-xs text-msx-textsecondary flex items-center gap-1">
              <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
              Grid:
            </label>
            <label className="text-xs text-msx-textsecondary flex items-center gap-1">
              Modo:
              <select value={editMode} onChange={e => setEditMode(e.target.value as typeof editMode)} className="bg-msx-bgcolor border border-msx-border rounded p-0.5 text-xs">
                <option value="normal">Normal</option>
                <option value="rect">Rectángulo</option>
                <option value="flood">Relleno</option>
              </select>
            </label>
          </div>

          {/* main canvas */}
          <div className="flex-1 overflow-auto p-3 flex justify-center bg-[#080A0F]">
            <canvas
              ref={canvasRef}
              onMouseDown={handleCanvasDown}
              onMouseMove={handleCanvasMove}
              onMouseUp={handleCanvasUp}
              onMouseLeave={handleCanvasUp}
              onContextMenu={handleCanvasContextMenu}
              className="border border-msx-border"
              style={{
                imageRendering: 'pixelated',
                cursor: tool === 'eraser' ? 'cell' : 'crosshair',
                width: `${SCREEN_W * zoom}px`,
                height: `${roomHeight * zoom}px`,
                flex: '0 0 auto',
                alignSelf: 'flex-start',
              }}
            />
          </div>

          {/* minimap */}
          <div className="border-t border-msx-border p-2">
            <CollapsiblePanel title="Minimapa del mundo" isOpen={openMinimap} onToggle={() => setOpenMinimap(v => !v)}>
              {/* 3x3 cross: current room centered; N/S/E/W show the neighbour room (via WorldMap
                  connection "rails") or an empty dashed silhouette to create one. Corners are blank. */}
              {(() => {
                const interactive = !!onCreateAdjacentRoom;
                const renderCell = (direction: ConnectionDirection) => {
                  const neighbour = neighbourRooms[direction];
                  if (neighbour) {
                    return <RoomMinimapThumb asset={neighbour} isCurrent={false} onOpen={onOpenRoom ? () => onOpenRoom(neighbour.id) : undefined} />;
                  }
                  return (
                    <EmptySilhouette
                      direction={direction}
                      interactive={interactive}
                      isPending={pendingCreateDir === direction}
                      onRequest={() => setPendingCreateDir(direction)}
                      onConfirm={() => { onCreateAdjacentRoom?.(direction); setPendingCreateDir(null); }}
                      onCancel={() => setPendingCreateDir(null)}
                    />
                  );
                };
                const blank = <div className="opacity-0" style={{ aspectRatio: '4 / 3' }} />;
                return (
                  <div className="mx-auto" style={{ maxWidth: '15rem' }}>
                    <div className="grid grid-cols-3 gap-1">
                      {blank}
                      {renderCell('north')}
                      {blank}
                      {renderCell('west')}
                      <RoomMinimapThumb asset={allAssets.find(a => a.id === room.id) ?? ({ id: room.id, name: room.name, type: 'msx2bitmaproom', data: room } as ProjectAsset)} isCurrent />
                      {renderCell('east')}
                      {blank}
                      {renderCell('south')}
                      {blank}
                    </div>
                  </div>
                );
              })()}
            </CollapsiblePanel>
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="w-80 border-l border-msx-border p-2 overflow-y-auto space-y-2">
          <CollapsiblePanel title="Configuración" isOpen={openConfig} onToggle={() => setOpenConfig(v => !v)}>
            {/* Tile seleccionado */}
            <div className="rounded border border-msx-border bg-msx-bgcolor p-2 mb-2">
              <div className="text-[0.7rem] text-msx-highlight mb-1">Tile seleccionado</div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-black border border-msx-border overflow-hidden flex items-center justify-center">
                  {selectedAtlasEntry ? (
                    <AtlasThumb entry={selectedAtlasEntry} atlasPixels={atlasPixels} slots={slots} isSelected={false} onSelect={() => { /* noop */ }} />
                  ) : (
                    <SpriteIcon />
                  )}
                </div>
                <div className="text-xs text-msx-textsecondary space-y-0.5">
                  <div>ID: <span className="text-msx-textprimary">{selectedAtlasEntry ? toHex(atlasEntries.indexOf(selectedAtlasEntry)) : '--'}</span></div>
                  <div>Categoría: <span className="text-msx-textprimary">{statusCategoryLabel || 'Suelo'}</span></div>
                </div>
              </div>
            </div>

            {/* Celda seleccionada */}
            <div className="rounded border border-msx-border bg-msx-bgcolor p-2 mb-2">
              <div className="text-[0.7rem] text-msx-highlight mb-1">Celda seleccionada</div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 border border-msx-border" style={{ backgroundColor: resolveSlotHex(slots, selectedCellSlot) }} />
                <div className="text-xs text-msx-textsecondary space-y-0.5">
                  <div>X: <span className="text-msx-textprimary">{selectedCell?.x ?? '--'}</span> &nbsp; Y: <span className="text-msx-textprimary">{selectedCell?.y ?? '--'}</span></div>
                  <div>Tile: <span className="text-msx-textprimary">{toHex(selectedCellSlot)}</span></div>
                </div>
              </div>
            </div>

            {/* Property checkboxes — backed by room.collision flags for the selected 16px cell. */}
            <div className="grid grid-cols-2 gap-1">
              {PROPERTY_FLAGS.map(flag => (
                <label key={flag.key} className="flex items-center gap-1 text-xs text-msx-textsecondary">
                  <input type="checkbox" checked={!!cellProps[flag.key]} onChange={() => toggleProp(flag.key)} />
                  {flag.label}
                </label>
              ))}
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="Grid Options" isOpen={openGridOptions} onToggle={() => setOpenGridOptions(v => !v)}>
            <div className="grid grid-cols-2 gap-2 text-xs text-msx-textsecondary">
              <label className="space-y-1">
                Width
                <input type="number" value={gridWidth} readOnly className="w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1" />
              </label>
              <label className="space-y-1">
                Height
                <input type="number" value={gridHeight} readOnly className="w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1" />
              </label>
              <label className="space-y-1">
                Tile size
                <select value="16" disabled className="w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1">
                  <option value="16">16x16</option>
                </select>
              </label>
              <label className="space-y-1">
                Screen mode
                <select value="SCREEN 5" disabled className="w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1">
                  <option value="SCREEN 5">SCREEN 5</option>
                </select>
              </label>
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="Target / Screen Mode" isOpen={openTarget} onToggle={() => setOpenTarget(v => !v)}>
            <div className="grid grid-cols-2 gap-2 text-xs text-msx-textsecondary">
              <label className="space-y-1">
                Sistema
                <select value="MSX2" disabled className="w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1">
                  <option value="MSX2">MSX2</option>
                </select>
              </label>
              <label className="space-y-1">
                Screen mode
                <select value="SCREEN 5" disabled className="w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1">
                  <option value="SCREEN 5">SCREEN 5</option>
                </select>
              </label>
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="Palette Manager" isOpen={openPalette} onToggle={() => setOpenPalette(v => !v)}>
            {/* Real palette data from ensureScreen5PaletteSlots(room.palette). */}
            <div className="grid grid-cols-8 gap-1">
              {slots.map((slot, index) => (
                <button
                  key={index}
                  type="button"
                  title={`Color ${index}`}
                  className={`h-6 border flex items-end justify-center text-[0.5rem] leading-none pb-0.5 ${activeColor === index ? 'border-white' : 'border-msx-border'}`}
                  style={{ backgroundColor: slot.hex === 'rgba(0,0,0,0)' ? '#000' : slot.hex, color: index < 8 ? '#fff' : '#000' }}
                  onClick={() => setActiveColor(index)}
                >
                  {index}
                </button>
              ))}
            </div>
            <div className="mt-2 text-[0.65rem] text-msx-textsecondary">Color activo: {activeColor}</div>
          </CollapsiblePanel>

          <CollapsiblePanel title="Screen Budget" isOpen={openBudget} onToggle={() => setOpenBudget(v => !v)}>
            <div className="space-y-2 text-xs">
              {/* VRAM: real estimate from atlas + framebuffer */}
              <div>
                <div className="flex justify-between text-msx-textsecondary mb-0.5">
                  <span>VRAM usage</span>
                  <span>{vramKb.toFixed(1)} KB / {VRAM_LIMIT_KB} KB</span>
                </div>
                <div className="h-2 rounded bg-msx-bgcolor border border-msx-border overflow-hidden">
                  <div className="h-full bg-msx-highlight" style={{ width: `${Math.min(100, (vramKb / VRAM_LIMIT_KB) * 100)}%` }} />
                </div>
              </div>
              {/* Atlas tiles: distinct 16x16/8x8 blocks staged in offscreen VRAM. */}
              <div>
                <div className="flex justify-between text-msx-textsecondary mb-0.5">
                  <span>Atlas tiles</span>
                  <span>{atlasEntries.length} / 256</span>
                </div>
                <div className="h-2 rounded bg-msx-bgcolor border border-msx-border overflow-hidden">
                  <div className="h-full bg-msx-accent" style={{ width: `${Math.min(100, (atlasEntries.length / 256) * 100)}%` }} />
                </div>
              </div>
              {/* Commands: V9938 copy/fill/line ops replayed at room load (bitmap room-load cost). */}
              <div>
                <div className="flex justify-between text-msx-textsecondary mb-0.5">
                  <span>Commands</span>
                  <span>{commands.length} / 512</span>
                </div>
                <div className="h-2 rounded bg-msx-bgcolor border border-msx-border overflow-hidden">
                  <div className="h-full bg-msx-cyan" style={{ width: `${Math.min(100, (commands.length / 512) * 100)}%` }} />
                </div>
              </div>
            </div>
          </CollapsiblePanel>
        </aside>
      </div>

      {/* BOTTOM STATUS BAR */}
      <div className="border-t border-msx-border px-3 py-1.5 flex items-center justify-between text-[0.7rem] text-msx-textsecondary bg-msx-panelbg">
        <span>
          Posición: {selectedCell?.x ?? '--'}, {selectedCell?.y ?? '--'} &nbsp; Tile: {toHex(selectedCellSlot)} ({statusCategoryLabel || 'Suelo'})
        </span>
        <span className="text-msx-highlight">● Pantalla seleccionada: MSX2 SCREEN 5</span>
        <span>Minimapa del mundo (todas las pantallas del nivel)</span>
      </div>

      <Msx2TileLibraryModal
        isOpen={isTileLibraryOpen}
        onClose={() => setIsTileLibraryOpen(false)}
        destPalette={slots}
        destScreenName={room.name}
        onImportTiles={handleImportTilesFromLibrary}
      />

      {/* Inline palette picker (project palette assets → Screen5PaletteSlot[16]). */}
      {isPalettePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setIsPalettePickerOpen(false)}>
          <div className="w-80 max-h-[70vh] overflow-y-auto rounded border border-msx-border bg-msx-panelbg p-3 space-y-2" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h4 className="text-sm pixel-font text-msx-highlight">Cargar paleta SCREEN 5</h4>
              <button type="button" className="text-msx-textsecondary hover:text-msx-highlight" onClick={() => setIsPalettePickerOpen(false)}>✕</button>
            </div>
            {paletteAssets.length === 0 ? (
              <div className="text-xs text-msx-textsecondary">No hay assets de paleta en el proyecto.</div>
            ) : (
              <div className="space-y-1">
                {paletteAssets.map(asset => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => applyPaletteAsset(asset)}
                    className="w-full text-left text-xs rounded px-2 py-1 border border-msx-border text-msx-textprimary hover:border-msx-highlight"
                  >
                    {asset.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
};
