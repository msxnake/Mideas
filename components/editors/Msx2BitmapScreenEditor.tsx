import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ConnectionDirection,
  BitmapTileScreen5,
  Msx2BitmapRoomAtlasEntry,
  Msx2BitmapRoomCommand,
  Msx2BitmapRoomForegroundTile,
  Msx2HudAsset,
  Msx2PlayerEntry,
  Msx2ProjectProfile,
  Msx2Screen5BitmapRoom,
  Msx2Screen4EntityInstance,
  Msx2Screen4Tile,
  PaletteAsset,
  ProjectAsset,
  Screen5PaletteSlot,
  WorldMapGraph,
} from '../../types';
import {
  MSX2_ENTITY_REPERTOIRE,
  buildMsx2EnemyEntityFromAsset,
  buildMsx2EntityComponents,
} from '../msx2_screen4_editor/msx2EntityCatalog';
import { filterMsx2EntityPresetsForProfile } from '../../utils/msx2ProjectProfiles';
import { createDefaultMsx2PlayerEntries, normalizeMsx2PlayerEntries } from '../../utils/msx2PlayerDefaults';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { ensureScreen5PaletteSlots } from '../../utils/msx2PaletteUtils';
import { importTilesIntoAtlas } from '../../utils/msx2BitmapAtlasImport';
import { Msx2TileLibraryModal } from '../modals/Msx2TileLibraryModal';
import { addEntryToMsx2TileLibrary } from '../../utils/msx2TileLibrary';
import {
  Msx2BitmapStampLibraryEntry,
  adaptStampEntryToPalette,
  mergeMsx2BitmapStampLibraryEntries,
} from '../../utils/msx2BitmapStampLibrary';
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
  HudIcon,
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
 * MSX2 "SCREEN 5" bitmap screen editor (Tile Map). This is the single editor for
 * `'msx2bitmaproom'` assets (the older atlas+command-list editor was removed).
 *
 * Layout built to match the "Tile Map Editor — MSX2" mockup over the
 * `Msx2Screen5BitmapRoom` data model. Wired: brush/eraser/flood-fill painting, layer-aware editing, cell
 * properties (collision flags), category filtering, palette load, export to library, and
 * a downsampled world minimap. Remaining nice-to-haves: in-place palette-slot colour
 * editing and merging flood-fill runs into taller rects. Every user-visible "Screen 4"
 * label says "SCREEN 5" (this is the MSX2 bitmap SCREEN 5 mode).
 */

type BrushTool = 'brush' | 'eraser' | 'fill';
type LayerKey = 'visual' | 'collision' | 'objects' | 'foreground';
type CategoryKey = 'suelo' | 'pared' | 'decoracion' | 'interactivos';
type CategoryFilterKey = 'all' | CategoryKey;

const SCREEN_W = 256;
const SCREEN_H = 192;
const GRID = 16;
const FALLBACK_HEX = '#05070B';

const CATEGORY_FILTERS: { key: CategoryFilterKey; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'suelo', label: 'Suelo' },
  { key: 'pared', label: 'Pared' },
  { key: 'decoracion', label: 'Decoración' },
  { key: 'interactivos', label: 'Interactivos' },
];
const CATEGORIES = CATEGORY_FILTERS.filter((cat): cat is { key: CategoryKey; label: string } => cat.key !== 'all');

const LAYERS: { key: LayerKey; label: string }[] = [
  { key: 'visual', label: 'Visual' },
  { key: 'collision', label: 'Collision' },
  { key: 'objects', label: 'Entities' },
  { key: 'foreground', label: 'Foreground' },
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

const BEHAVIOR_CODE = {
  none: 0,
  ice: 3,
} as const;

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

// Single backdrop slot (VDP R#7): clears the room AND paints the outer "franjas" plus every
// color-0 (transparent) bitmap pixel, so background/transparency/border are one and the same.
const roomBackgroundColor = (room: Msx2Screen5BitmapRoom): number => clampByte(room.backgroundColor, 0) & 0x0f;

const isFullScreenFillCommand = (command: Msx2BitmapRoomCommand, width = SCREEN_W, height = SCREEN_H): boolean =>
  command.op === 'fill'
  && command.x <= 0
  && command.y <= 0
  && command.x + command.w >= width
  && command.y + command.h >= height;

const resolveSlotHex = (slots: Screen5PaletteSlot[], slot: number): string => {
  const hex = slots[slot]?.hex;
  return !hex || hex === 'rgba(0,0,0,0)' ? '#000' : hex;
};

const clampInt = (value: unknown, min: number, max: number, fallback: number): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(numeric)));
};

const clampByte = (value: unknown, fallback: number): number => clampInt(value, 0, 255, fallback);

const toHex = (value: number): string => `0x${value.toString(16).toUpperCase().padStart(2, '0')}`;

const clampScreenPixelX = (value: unknown): number => clampInt(value, 0, SCREEN_W - 1, 0);
const clampScreenPixelY = (value: unknown, roomHeight = SCREEN_H): number => clampInt(value, 0, Math.max(0, roomHeight - 1), 0);

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
const renderComposition = (room: Msx2Screen5BitmapRoom, atlasPixels: number[][]): number[][] => {
  const pixels = createPixels(SCREEN_W, SCREEN_H, roomBackgroundColor(room));
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
const buildTileGrid = (room: Msx2Screen5BitmapRoom, cols: number, rows: number): number[][] => {
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
  room: Msx2Screen5BitmapRoom;
  onUpdate: (data: Partial<Msx2Screen5BitmapRoom>, newAssets?: ProjectAsset[]) => void;
  allAssets?: ProjectAsset[];
  setStatusBarMessage?: (m: string) => void;
  /** Creates a new bitmap room adjacent to the current one (and the WorldMap rail). */
  onCreateAdjacentRoom?: (direction: ConnectionDirection, options?: { copySharedEdgeTiles?: boolean }) => void;
  /** Opens an existing room asset for editing (minimap navigation to a neighbour). */
  onOpenRoom?: (assetId: string) => void;
  /** Marks a room as the world's start screen (sets startScreenNodeId on the owning WorldMap). */
  onSetWorldStartRoom?: (roomId: string) => void;
  /** Rebuilds the WorldMap that owns this room (drops deleted rooms, re-lays the grid). */
  onRecomposeWorld?: (roomId: string) => void;
  /** Project profile used to filter the entity preset repertoire (same as SCREEN 4). */
  msx2ProjectProfile?: Msx2ProjectProfile | null;
  /** Palette asset shared by the world that owns this room. */
  worldPaletteAssetId?: string;
  /** Assigns a palette asset as the shared palette for the owning world. */
  onSetWorldPaletteAssetId?: (paletteAssetId: string | undefined) => void;
  /** Updates an existing palette asset without routing through the active room. */
  onUpdatePaletteAsset?: (paletteAssetId: string, slots: Screen5PaletteSlot[]) => void;
  /** Updates an existing project asset that is not necessarily the active room. */
  onUpdateProjectAsset?: (assetId: string, data: unknown) => void;
  /** Opens a Msx2HudAsset (project asset type 'msx2hud') for editing in the Msx2HudEditor. */
  onOpenHudAsset?: (assetId: string) => void;
}

const createDefaultMsx2HudAsset = (): Msx2HudAsset => ({
  target: 'MSX2',
  width: 256,
  height: 20,
  layers: [
    {
      id: `hud_layer_${Date.now()}`,
      name: 'Background',
      kind: 'paint',
      visible: true,
      locked: false,
      pixels: Array.from({ length: 20 }, () => new Array(256).fill(-1)),
    },
  ],
  icons: [],
  notes: 'Standalone HUD asset for SCREEN 5 bitmap rooms. Link it from a room via runtime.hudAssetId.',
});

// Placement on the Entities layer: pick WHAT to place (a player entry, an entity
// preset from the repertoire, or an enemy from the project's msx2enemy library).
type PlaceableKind = 'none' | 'player' | 'preset' | 'enemy';
interface PlaceableSelection {
  kind: PlaceableKind;
  /** preset id (PlaceableKind 'preset'), enemy asset id (PlaceableKind 'enemy'), or empty when none. */
  id: string;
}

// Cardinal directions for the world-minimap cross. north=up, south=down, west=left, east=right.
const DIRECTION_LABELS: Record<ConnectionDirection, string> = {
  north: 'Norte',
  south: 'Sur',
  east: 'Este',
  west: 'Oeste',
};

type DiagonalDirection = 'northWest' | 'northEast' | 'southWest' | 'southEast';

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
  onDoubleClick?: () => void;
  onContextMenu?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const AtlasThumb: React.FC<AtlasThumbProps> = ({ entry, atlasPixels, slots, isSelected, onSelect, onDoubleClick, onContextMenu }) => {
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
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    >
      <div className="aspect-square w-full bg-black border border-black/70 overflow-hidden">
        <canvas ref={canvasRef} width={width} height={height} className="w-full h-full" style={{ imageRendering: 'pixelated' }} />
      </div>
      <div className="mt-1 text-[0.6rem] leading-tight text-msx-textprimary truncate">{entry.name}</div>
    </button>
  );
};

/**
 * Canvas-only preview of an atlas entry that fills its parent box. Unlike AtlasThumb
 * (a grid button with padding + name label sized to its own content), this draws just
 * the tile pixels scaled to the container, so embedding it in a fixed small square box
 * shows the WHOLE tile undistorted instead of a cropped centre. Same pixel source as
 * AtlasThumb / renderComposition, so the preview always matches the placed tile.
 */
const AtlasTilePreview: React.FC<{
  entry: Msx2BitmapRoomAtlasEntry;
  atlasPixels: number[][];
  slots: Screen5PaletteSlot[];
}> = ({ entry, atlasPixels, slots }) => {
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
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="h-full w-full"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

const StampThumb: React.FC<{
  entry: Msx2BitmapStampLibraryEntry;
  slots: Screen5PaletteSlot[];
  isSelected: boolean;
  onSelect: () => void;
}> = ({ entry, slots, isSelected, onSelect }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = Math.max(1, entry.stamp.columns * entry.stamp.tileWidth);
  const height = Math.max(1, entry.stamp.rows * entry.stamp.tileHeight);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = width;
    canvas.height = height;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#05070b';
    ctx.fillRect(0, 0, width, height);
    entry.stamp.tiles.forEach((tile, index) => {
      const ox = (index % entry.stamp.columns) * entry.stamp.tileWidth;
      const oy = Math.floor(index / entry.stamp.columns) * entry.stamp.tileHeight;
      for (let y = 0; y < tile.height; y++) {
        for (let x = 0; x < tile.width; x++) {
          const slot = tile.pixelData[y * tile.width + x] ?? 0;
          if (slot === 0) continue;
          ctx.fillStyle = resolveSlotHex(slots, slot);
          ctx.fillRect(ox + x, oy + y, 1, 1);
        }
      }
    });
  }, [entry, height, slots, width]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded border bg-msx-bgcolor p-1 text-left ${isSelected ? 'border-msx-highlight ring-1 ring-msx-highlight' : 'border-msx-border hover:border-msx-highlight'}`}
      title={`${entry.name} (${entry.stamp.columns}x${entry.stamp.rows})`}
    >
      <canvas ref={canvasRef} className="block h-12 w-full bg-black" style={{ imageRendering: 'pixelated' }} />
      <div className="mt-1 truncate text-[0.6rem] text-msx-textprimary">{entry.name}</div>
      <div className="text-[0.55rem] text-msx-textsecondary">{entry.stamp.columns}x{entry.stamp.rows}</div>
    </button>
  );
};

type BitmapTileTool = 'brush' | 'erase' | 'fill';

interface BitmapTileEditorModalProps {
  entry: Msx2BitmapRoomAtlasEntry | null;
  pixels: number[][];
  slots: Screen5PaletteSlot[];
  onClose: () => void;
  onSaveAtlas: (name: string, pixels: number[][]) => void;
  onSaveAsset: (name: string, pixels: number[][]) => void;
}

const clonePixelGrid = (pixels: number[][], width: number, height: number): number[][] =>
  Array.from({ length: height }, (_row, y) =>
    Array.from({ length: width }, (_col, x) => Math.max(0, Math.min(15, Math.trunc(Number(pixels[y]?.[x]) || 0))))
  );

const BitmapTileEditorModal: React.FC<BitmapTileEditorModalProps> = ({
  entry,
  pixels,
  slots,
  onClose,
  onSaveAtlas,
  onSaveAsset,
}) => {
  const width = Math.max(1, Math.trunc(entry?.w || GRID));
  const height = Math.max(1, Math.trunc(entry?.h || GRID));
  const [name, setName] = useState(entry?.name || 'Bitmap Tile');
  const [draftPixels, setDraftPixels] = useState<number[][]>(() => clonePixelGrid(pixels, width, height));
  const [activeSlot, setActiveSlot] = useState(1);
  const [tool, setTool] = useState<BitmapTileTool>('brush');
  const [isPainting, setIsPainting] = useState(false);
  // Slot index currently being dragged from its "used color" handle (drag-to-replace).
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null);

  useEffect(() => {
    setName(entry?.name || 'Bitmap Tile');
    setDraftPixels(clonePixelGrid(pixels, width, height));
    setIsPainting(false);
  }, [entry?.id, pixels, width, height]);

  useEffect(() => {
    const stop = () => setIsPainting(false);
    window.addEventListener('mouseup', stop);
    return () => window.removeEventListener('mouseup', stop);
  }, []);

  // Palette slot indices actually present in the tile, so the palette can mark
  // the colors in use (like the MSX2 sprite editor). Pixels store slot indices
  // directly, so this is unambiguous and needs no color de-duplication.
  const usedSlots = useMemo(() => {
    const used = new Set<number>();
    for (const row of draftPixels) {
      for (const value of row) used.add(value);
    }
    return used;
  }, [draftPixels]);

  if (!entry) return null;

  const applyAt = (x: number, y: number, nextTool = tool) => {
    setDraftPixels(current => {
      const next = current.map(row => [...row]);
      if (nextTool === 'fill') {
        const from = next[y]?.[x] ?? 0;
        const to = activeSlot;
        if (from === to) return current;
        const stack: Array<[number, number]> = [[x, y]];
        while (stack.length) {
          const [cx, cy] = stack.pop()!;
          if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
          if (next[cy][cx] !== from) continue;
          next[cy][cx] = to;
          stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
        }
        return next;
      }
      next[y][x] = nextTool === 'erase' ? 0 : activeSlot;
      return next;
    });
  };

  const clearTile = () => setDraftPixels(Array.from({ length: height }, () => Array.from({ length: width }, () => 0)));
  const fillTile = () => setDraftPixels(Array.from({ length: height }, () => Array.from({ length: width }, () => activeSlot)));

  // Remap every pixel painted with `fromSlot` to `toSlot` (drag-to-replace).
  // Pixels are slot indices, so this is a pure index swap with no ambiguity.
  const replaceSlot = (fromSlot: number, toSlot: number) => {
    if (fromSlot === toSlot) return;
    setDraftPixels(current => {
      let changed = false;
      const next = current.map(row => row.map(value => {
        if (value === fromSlot) { changed = true; return toSlot; }
        return value;
      }));
      return changed ? next : current;
    });
  };

  const handleSlotDrop = (toSlot: number) => {
    if (draggedSlot === null) return;
    replaceSlot(draggedSlot, toSlot);
    setDraggedSlot(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onMouseDown={event => event.stopPropagation()}>
      <div className="w-[min(92vw,760px)] max-h-[90vh] overflow-auto rounded border border-msx-highlight bg-msx-panelbg p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="pixel-font text-sm text-msx-highlight">SCREEN 5 Bitmap Tile Editor</div>
            <div className="text-[0.7rem] text-msx-textsecondary">{width}x{height} px · slot {activeSlot}</div>
          </div>
          <button type="button" className="rounded border border-msx-border px-2 py-1 text-xs text-msx-textsecondary hover:border-msx-highlight" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <div className="overflow-auto rounded border border-msx-border bg-black p-3">
            <div
              className="grid mx-auto"
              style={{
                width: width * 22,
                gridTemplateColumns: `repeat(${width}, 22px)`,
                gridTemplateRows: `repeat(${height}, 22px)`,
              }}
            >
              {draftPixels.map((row, y) => row.map((slot, x) => (
                <button
                  key={`${x}_${y}`}
                  type="button"
                  className="border border-msx-border/70"
                  style={{ width: 22, height: 22, backgroundColor: resolveSlotHex(slots, slot), imageRendering: 'pixelated' }}
                  title={`${x},${y} slot ${slot}`}
                  onMouseDown={event => {
                    event.preventDefault();
                    setIsPainting(true);
                    applyAt(x, y);
                  }}
                  onMouseEnter={() => {
                    if (isPainting && tool !== 'fill') applyAt(x, y);
                  }}
                />
              )))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs text-msx-textsecondary">
              Nombre
              <input
                value={name}
                onChange={event => setName(event.target.value)}
                className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
              />
            </label>

            <div className="grid grid-cols-3 gap-1">
              {(['brush', 'erase', 'fill'] as BitmapTileTool[]).map(item => (
                <button
                  key={item}
                  type="button"
                  className={`rounded border px-2 py-1 text-xs ${tool === item ? 'border-msx-highlight text-msx-highlight' : 'border-msx-border text-msx-textsecondary hover:border-msx-highlight'}`}
                  onClick={() => setTool(item)}
                >
                  {item === 'brush' ? 'Pincel' : item === 'erase' ? 'Goma' : 'Relleno'}
                </button>
              ))}
            </div>

            <div>
              <div className="mb-1 text-xs text-msx-highlight">Paleta SCREEN 5</div>
              <div className="grid grid-cols-4 gap-1">
                {slots.map((slot, index) => {
                  const isUsed = usedSlots.has(index);
                  const isDropTarget = draggedSlot !== null && draggedSlot !== index;
                  return (
                    <button
                      key={index}
                      type="button"
                      className={`relative h-8 rounded border text-[0.65rem] ${activeSlot === index ? 'border-white' : 'border-msx-border'} ${isDropTarget ? 'outline outline-1 outline-msx-highlight/70' : ''}`}
                      style={{ backgroundColor: resolveSlotHex(slots, index), color: index < 8 ? '#fff' : '#000' }}
                      onClick={() => setActiveSlot(index)}
                      onDragOver={event => { if (isDropTarget) event.preventDefault(); }}
                      onDrop={event => { event.preventDefault(); handleSlotDrop(index); }}
                      title={`Slot ${index} · master ${slot.masterIndex}${isUsed ? ' · en uso (arrastra el círculo para reemplazarlo)' : ''}`}
                    >
                      {index}
                      {isUsed && (
                        <span
                          draggable
                          className="absolute right-0.5 top-0.5 h-3.5 w-3.5 cursor-grab rounded-full border border-black/70 bg-msx-highlight shadow active:cursor-grabbing"
                          title={`Arrastra para reemplazar el slot ${index} por otro color`}
                          aria-label={`Arrastrar slot usado ${index} para reemplazarlo`}
                          onClick={event => event.stopPropagation()}
                          onDragStart={event => {
                            event.stopPropagation();
                            setDraggedSlot(index);
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', String(index));
                          }}
                          onDragEnd={() => setDraggedSlot(null)}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="rounded border border-msx-border px-2 py-1 text-xs text-msx-textsecondary hover:border-msx-highlight" onClick={fillTile}>
                Fill all
              </button>
              <button type="button" className="rounded border border-msx-border px-2 py-1 text-xs text-msx-textsecondary hover:border-msx-highlight" onClick={clearTile}>
                Clear
              </button>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                className="w-full rounded border border-msx-highlight px-2 py-1 text-xs text-msx-highlight hover:bg-msx-highlight/20"
                onClick={() => onSaveAtlas(name, draftPixels)}
              >
                Guardar en atlas
              </button>
              <button
                type="button"
                className="w-full rounded border border-msx-border px-2 py-1 text-xs text-msx-textprimary hover:border-msx-highlight"
                onClick={() => onSaveAsset(name, draftPixels)}
              >
                Guardar como asset bitmap
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MINIMAP_STEP = 4;

interface RoomMinimapThumbProps {
  asset: ProjectAsset;
  isCurrent: boolean;
  paletteSlots: Screen5PaletteSlot[];
  /** When provided (and not the current room), the thumb becomes a clickable "open & edit" target. */
  onOpen?: () => void;
  /** Whether this room is the world's start screen (renders a ★ badge). */
  isStart?: boolean;
}

/** Renders a downsampled thumbnail of a bitmap room's composed page for the world minimap. */
const RoomMinimapThumb: React.FC<RoomMinimapThumbProps> = ({ asset, isCurrent, paletteSlots, onOpen, isStart }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const room = asset.data as Msx2Screen5BitmapRoom;
  const tw = Math.ceil(SCREEN_W / MINIMAP_STEP);
  const th = Math.ceil(SCREEN_H / MINIMAP_STEP);
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const slots = ensureScreen5PaletteSlots(paletteSlots).slots;
    const pixels = renderComposition(room, room?.atlas?.pixels || []);
    ctx.clearRect(0, 0, tw, th);
    for (let y = 0; y < th; y++) {
      for (let x = 0; x < tw; x++) {
        ctx.fillStyle = resolveSlotHex(slots, pixels[y * MINIMAP_STEP]?.[x * MINIMAP_STEP] ?? 0);
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [room, paletteSlots, tw, th]);
  const interactive = !!onOpen && !isCurrent;
  return (
    <div
      title={`${isStart ? '★ Inicio del mundo — ' : ''}${interactive ? `Editar "${asset.name}"` : asset.name}`}
      role={interactive ? 'button' : undefined}
      onClick={interactive ? onOpen : undefined}
      className={`relative rounded border overflow-hidden transition-colors ${
        isCurrent
          ? 'border-msx-highlight ring-1 ring-msx-highlight'
          : interactive
            ? 'border-msx-border cursor-pointer hover:border-msx-highlight hover:ring-1 hover:ring-msx-highlight'
            : 'border-msx-border'
      }`}
    >
      <canvas ref={canvasRef} width={tw} height={th} className="w-full block bg-black" style={{ imageRendering: 'pixelated', aspectRatio: '4 / 3' }} />
      {isStart && (
        <span
          className="absolute top-0.5 left-0.5 rounded bg-black/70 px-1 text-[0.6rem] leading-none text-msx-highlight"
          title="Pantalla de inicio del mundo"
        >
          ★
        </span>
      )}
    </div>
  );
};

interface EmptySilhouetteProps {
  direction: ConnectionDirection;
  interactive: boolean;
  onRequest: () => void;
}

/** Dashed placeholder for a missing neighbour; requests a (centered, non-clipped) create confirm. */
const EmptySilhouette: React.FC<EmptySilhouetteProps> = ({ direction, interactive, onRequest }) => (
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
);

export const Msx2BitmapScreenEditor: React.FC<Msx2BitmapScreenEditorProps> = ({ room, onUpdate, allAssets = [], setStatusBarMessage, onCreateAdjacentRoom, onOpenRoom, onSetWorldStartRoom, onRecomposeWorld, msx2ProjectProfile = null, worldPaletteAssetId, onSetWorldPaletteAssetId, onUpdatePaletteAsset, onUpdateProjectAsset, onOpenHudAsset }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // World-minimap: pending "create screen at <dir>" inline confirm.
  const [pendingCreateDir, setPendingCreateDir] = useState<ConnectionDirection | null>(null);
  const [copySharedEdgeTiles, setCopySharedEdgeTiles] = useState(true);

  // --- Local UI state ---
  const [tool, setTool] = useState<BrushTool>('brush');
  const [activeColor, setActiveColor] = useState(4);
  const [selectedAtlasEntryId, setSelectedAtlasEntryId] = useState(room.atlas?.entries?.[0]?.id || '');
  const [selectedStampId, setSelectedStampId] = useState('');
  const [preparedStamp, setPreparedStamp] = useState<{ stampId: string; atlasEntryIds: string[] } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilterKey>('all');
  const [zoom, setZoom] = useState(2);
  const [showGrid, setShowGrid] = useState(true);
  const [editMode, setEditMode] = useState<'normal' | 'rect' | 'flood'>('normal');
  const [isTileLibraryOpen, setIsTileLibraryOpen] = useState(false);
  const [isPalettePickerOpen, setIsPalettePickerOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [configTarget, setConfigTarget] = useState<'tile' | 'cell'>('tile');
  const [layerVisible, setLayerVisible] = useState<Record<LayerKey, boolean>>({ visual: true, collision: false, objects: false, foreground: false });
  const [layerLocked, setLayerLocked] = useState<Record<LayerKey, boolean>>({ visual: false, collision: false, objects: false, foreground: false });
  const [activeLayer, setActiveLayer] = useState<LayerKey>('visual');
  const [cellProps, setCellProps] = useState<Record<string, boolean>>({});

  // --- Entity placement (internally keyed as the legacy "objects" layer) ---
  // What the next canvas click will place when the Entities layer is active.
  const [placeable, setPlaceable] = useState<PlaceableSelection>({ kind: 'none', id: '' });
  // Currently selected placed item (for highlight + delete). Players and entities use
  // disjoint id spaces, so a single selected id is unambiguous.
  const [selectedPlacedId, setSelectedPlacedId] = useState<string | null>(null);
  const [draggingPlaced, setDraggingPlaced] = useState<{ kind: 'entity' | 'player'; id: string } | null>(null);
  const [pendingDeletePlaced, setPendingDeletePlaced] = useState<{ kind: 'entity' | 'player'; id: string } | null>(null);
  const [pendingDeleteAtlasEntryId, setPendingDeleteAtlasEntryId] = useState<string | null>(null);
  const [editingAtlasEntryId, setEditingAtlasEntryId] = useState<string | null>(null);

  // collapsible panel toggles
  const [openTools, setOpenTools] = useState(true);
  const [openAtlas, setOpenAtlas] = useState(true);
  const [openStamps, setOpenStamps] = useState(true);
  const [openBitmapTiles, setOpenBitmapTiles] = useState(true);
  const [openCategories, setOpenCategories] = useState(true);
  const [openLayers, setOpenLayers] = useState(true);
  const [openForeground, setOpenForeground] = useState(true);
  const [openPlacement, setOpenPlacement] = useState(true);
  const [openMinimap, setOpenMinimap] = useState(true);
  const [openConfig, setOpenConfig] = useState(true);
  const [openGridOptions, setOpenGridOptions] = useState(true);
  const [openTarget, setOpenTarget] = useState(true);
  const [openPalette, setOpenPalette] = useState(true);
  const [openBudget, setOpenBudget] = useState(true);
  const [openHud, setOpenHud] = useState(true);

  const hudAssets = useMemo(() => allAssets.filter(asset => asset.type === 'msx2hud'), [allAssets]);
  const hudAssetId = room.runtime?.hudAssetId;
  const linkedHudAsset = useMemo(
    () => hudAssets.find(asset => asset.id === hudAssetId),
    [hudAssets, hudAssetId],
  );
  const selectedHudAssetId = linkedHudAsset ? linkedHudAsset.id : '';

  const withHudAssetId = (hudAssetIdValue: string | undefined) => ({
    screenKind: 'playable' as const,
    screenEngine: 'player' as const,
    activeAreaX: 0,
    activeAreaY: 0,
    activeAreaWidth: 256,
    activeAreaHeight: 192,
    ...room.runtime,
    hudAssetId: hudAssetIdValue,
  });

  const handleLinkHudAsset = (nextId: string) => {
    const nextHudAsset = nextId ? hudAssets.find(asset => asset.id === nextId) : undefined;
    onUpdate({ runtime: withHudAssetId(nextId || undefined) });
    setStatusBarMessage?.(
      nextHudAsset
        ? `SCREEN 5: HUD "${nextHudAsset.name}" vinculado a la pantalla.`
        : 'SCREEN 5: HUD desvinculado (NONE).'
    );
  };

  const handleCreateAndLinkHud = () => {
    const newAsset: ProjectAsset = {
      id: `msx2hud_${Date.now()}`,
      name: room.name ? `${room.name} HUD` : 'New MSX2 HUD',
      type: 'msx2hud',
      data: createDefaultMsx2HudAsset(),
    };
    onUpdate({ runtime: withHudAssetId(newAsset.id) }, [newAsset]);
    onOpenHudAsset?.(newAsset.id);
  };

  const worldPaletteAsset = useMemo(() => {
    if (!worldPaletteAssetId) return undefined;
    return allAssets.find(asset => asset.id === worldPaletteAssetId && asset.type === 'palette') as ProjectAsset | undefined;
  }, [allAssets, worldPaletteAssetId]);
  const worldPaletteData = worldPaletteAsset?.data as PaletteAsset | undefined;
  const { slots, changed } = useMemo(
    () => ensureScreen5PaletteSlots(worldPaletteData?.slots || room.palette),
    [room.palette, worldPaletteData?.slots],
  );
  const usesWorldPalette = Boolean(worldPaletteAsset && worldPaletteData?.slots);
  const atlasWidth = Math.max(1, Number(room.atlas?.width) || 256);
  const atlasHeight = Math.max(1, Number(room.atlas?.height) || 128);
  const atlasPixels = useMemo(() => normalizePixels(room.atlas?.pixels, atlasWidth, atlasHeight), [room.atlas?.pixels, atlasWidth, atlasHeight]);
  const atlasEntries = room.atlas?.entries || [];
  const selectedAtlasEntry = atlasEntries.find(entry => entry.id === selectedAtlasEntryId) || atlasEntries[0];
  const pendingDeleteAtlasEntry = pendingDeleteAtlasEntryId
    ? atlasEntries.find(entry => entry.id === pendingDeleteAtlasEntryId) || null
    : null;
  const editingAtlasEntry = editingAtlasEntryId
    ? atlasEntries.find(entry => entry.id === editingAtlasEntryId) || null
    : null;
  const screen5BitmapTileAssets = useMemo(
    () => allAssets.filter(asset => asset.type === 'msx2bitmaptile'),
    [allAssets],
  );
  // Stamps are PROJECT assets (persist in the JSON, absent from a new project), not the
  // global localStorage library. The "Stamps bitmap" panel lists these; "Subir a
  // biblioteca global" promotes a chosen one to the shared cross-project library.
  const stampEntries = useMemo<Msx2BitmapStampLibraryEntry[]>(
    () => allAssets
      .filter(asset => asset.type === 'msx2bitmapstamp')
      .map(asset => asset.data as Msx2BitmapStampLibraryEntry)
      .filter(Boolean),
    [allAssets],
  );
  const selectedStampEntry = stampEntries.find(entry => entry.id === selectedStampId) || null;
  const selectedStampAsset = selectedStampId
    ? allAssets.find(asset =>
      asset.type === 'msx2bitmapstamp'
      && (asset.id === selectedStampId || (asset.data as Msx2BitmapStampLibraryEntry | undefined)?.id === selectedStampId)
    ) || null
    : null;
  const backgroundColor = roomBackgroundColor(room);
  // Backdrop hex used for the franja frame and for color-0 (transparent) pixels.
  const backdropHex = resolveSlotHex(slots, backgroundColor);

  // Keep the stamp selection valid as the project's stamp assets change.
  useEffect(() => {
    setSelectedStampId(current => current && stampEntries.some(entry => entry.id === current) ? current : (stampEntries[0]?.id || ''));
  }, [stampEntries]);

  // --- Object placement: placed items + the placeable catalog ---
  // Placed entities/enemies (tile coords) and player spawns (pixel coords) live in the
  // room data model exactly like SCREEN 4, separate from tileGrid/composition.
  const placedEntities = useMemo<Msx2Screen4EntityInstance[]>(
    () => (Array.isArray(room.entities) ? room.entities : []),
    [room.entities],
  );
  const playerEntries = useMemo<Msx2PlayerEntry[]>(
    () => normalizeMsx2PlayerEntries(room.playerEntries),
    [room.playerEntries],
  );
  // Foreground overlay tiles (rendered as high-priority hardware sprites on MSX2,
  // so the player walks behind them). Edited on the Foreground layer.
  const foregroundTiles = useMemo<Msx2BitmapRoomForegroundTile[]>(
    () => (Array.isArray(room.foregroundTiles) ? room.foregroundTiles : []),
    [room.foregroundTiles],
  );
  const FOREGROUND_MAX = 3;
  // Optional explicit sprite colour for the next painted foreground tile. Empty
  // means "auto" (runtime derives the predominant non-background colour).
  const [foregroundColor, setForegroundColor] = useState<number | ''>('');
  // Entity presets filtered by profile. The PLAYER is never a generic entity (it is a dedicated
  // player spawn / playerEntry), so player-kind presets are excluded from this list — use the
  // "Player Spawn" placeable instead.
  const entityPresets = useMemo(
    () => filterMsx2EntityPresetsForProfile(MSX2_ENTITY_REPERTOIRE, msx2ProjectProfile).filter(preset => preset.kind !== 'player'),
    [msx2ProjectProfile],
  );
  const enemyLibraryAssets = useMemo(
    () => allAssets.filter(asset => asset.type === 'msx2enemy'),
    [allAssets],
  );
  // MSX2 Player assets in the project; a placed player spawn must link to one via `playerId`,
  // or it renders as an unlinked placeholder (the "black circle").
  const playerAssets = useMemo(
    () => allAssets.filter(asset => asset.type === 'msx2player'),
    [allAssets],
  );
  // Category filter: "Todos" disables filtering; other filters keep their category
  // plus uncategorized entries so legacy atlas tiles do not disappear unexpectedly.
  const visibleAtlasEntries = useMemo(
    () => selectedCategory === 'all' ? atlasEntries : atlasEntries.filter(entry => {
      const cat = inferEntryCategory(entry.name);
      return cat === null || cat === selectedCategory;
    }),
    [atlasEntries, selectedCategory],
  );
  const revealAtlasEntry = (entry?: Msx2BitmapRoomAtlasEntry) => {
    if (!entry) return;
    setSelectedAtlasEntryId(entry.id);
    const category = inferEntryCategory(entry.name);
    if (category) setSelectedCategory(category);
    setConfigTarget('tile');
  };
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
    const step = (graph.gridSize || 20) * 12;
    const offset: Record<ConnectionDirection, { x: number; y: number }> = {
      north: { x: 0, y: -step },
      south: { x: 0, y: step },
      west: { x: -step, y: 0 },
      east: { x: step, y: 0 },
    };
    (Object.keys(result) as ConnectionDirection[]).forEach(direction => {
      if (result[direction]) return;
      const target = offset[direction];
      const adjacentNode = graph.nodes.find(node =>
        node.id !== currentNode.id
        && node.position.x === currentNode.position.x + target.x
        && node.position.y === currentNode.position.y + target.y
      );
      result[direction] = adjacentNode ? resolveRoom(adjacentNode.id) : null;
    });
    return result;
  }, [allAssets, bitmapRooms, room.id]);

  const diagonalRooms = useMemo(() => {
    const result: Record<DiagonalDirection, ProjectAsset | null> = {
      northWest: null,
      northEast: null,
      southWest: null,
      southEast: null,
    };
    const worldmapAsset = allAssets.find(asset =>
      asset.type === 'worldmap'
      && (asset.data as WorldMapGraph | undefined)?.nodes?.some(node => node.screenAssetId === room.id),
    );
    const graph = worldmapAsset?.data as WorldMapGraph | undefined;
    const currentNode = graph?.nodes.find(node => node.screenAssetId === room.id);
    if (!graph || !currentNode) return result;
    const roomById = new Map(bitmapRooms.map(asset => [asset.id, asset]));
    const step = (graph.gridSize || 20) * 12;
    const offset: Record<DiagonalDirection, { x: number; y: number }> = {
      northWest: { x: -step, y: -step },
      northEast: { x: step, y: -step },
      southWest: { x: -step, y: step },
      southEast: { x: step, y: step },
    };
    (Object.keys(result) as DiagonalDirection[]).forEach(direction => {
      const target = offset[direction];
      const node = graph.nodes.find(item =>
        item.id !== currentNode.id
        && item.position.x === currentNode.position.x + target.x
        && item.position.y === currentNode.position.y + target.y
      );
      result[direction] = node ? (roomById.get(node.screenAssetId) ?? null) : null;
    });
    return result;
  }, [allAssets, bitmapRooms, room.id]);

  // World start-screen context: which room is the world's start (so the minimap can badge it),
  // and whether the current room is that start (so the "mark as start" button reflects state).
  const worldStart = useMemo(() => {
    const worldmapAsset = allAssets.find(asset =>
      asset.type === 'worldmap'
      && (asset.data as WorldMapGraph | undefined)?.nodes?.some(node => node.screenAssetId === room.id),
    );
    const graph = worldmapAsset?.data as WorldMapGraph | undefined;
    const startNode = graph?.nodes.find(node => node.id === graph.startScreenNodeId);
    return {
      hasWorld: !!graph,
      startRoomId: startNode?.screenAssetId ?? null,
      currentIsStart: !!startNode && startNode.screenAssetId === room.id,
    };
  }, [allAssets, room.id]);

  // VRAM budget (realistic): atlas (4bpp) + visible framebuffer (128 bytes/line * height).
  const vramBytes = Math.round((atlasWidth * atlasHeight) / 2) + 128 * roomHeight;
  const vramKb = vramBytes / 1024;
  const VRAM_LIMIT_KB = 128;

  useEffect(() => {
    if (!changed) return;
    if (usesWorldPalette && worldPaletteAssetId && onUpdatePaletteAsset) {
      onUpdatePaletteAsset(worldPaletteAssetId, slots.map(slot => ({ ...slot })));
      return;
    }
    onUpdate({ palette: slots.map(slot => ({ ...slot })) });
  }, [changed, onUpdate, onUpdatePaletteAsset, slots, usesWorldPalette, worldPaletteAssetId]);

  // --- Main canvas render ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = SCREEN_W * zoom;
    canvas.height = roomHeight * zoom;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const backgroundHex = resolveSlotHex(slots, backgroundColor);
    ctx.fillStyle = backgroundHex === 'rgba(0,0,0,0)' ? FALLBACK_HEX : backgroundHex;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (layerVisible.visual) {
      for (let y = 0; y < roomHeight; y++) {
        for (let x = 0; x < SCREEN_W; x++) {
          const slot = composedPixels[y]?.[x] ?? 0;
          // Color 0 is the SCREEN 5 backdrop (R#7): render it with the background color,
          // exactly as the V9938 shows transparent pixels on hardware.
          if (slot === 0) {
            ctx.fillStyle = backdropHex;
          } else {
            const hex = slots[slot]?.hex || FALLBACK_HEX;
            ctx.fillStyle = hex === 'rgba(0,0,0,0)' ? FALLBACK_HEX : hex;
          }
          ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
        }
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
    // Collision overlay: tint cells whose stored flags are non-zero when the layer is visible.
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

    // Entities layer: render placed entities/enemies/objects and player spawns as 16px markers
    // (a coloured cell tint + a 1-char label). These live in room.entities / room.playerEntries,
    // completely separate from the tile composition, so painting tiles never clobbers them.
    if (layerVisible.objects || activeLayer === 'objects') {
      const cell = GRID * zoom;
      const drawMarkerPx = (pixelX: number, pixelY: number, fill: string, stroke: string, label: string, isSel: boolean) => {
        const px = pixelX * zoom;
        const py = pixelY * zoom;
        ctx.fillStyle = fill;
        ctx.fillRect(px, py, cell, cell);
        ctx.strokeStyle = isSel ? '#FFD24A' : stroke;
        ctx.lineWidth = isSel ? 2 : 1;
        ctx.strokeRect(px + 1, py + 1, cell - 2, cell - 2);
        ctx.lineWidth = 1;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${Math.max(8, Math.floor(cell * 0.5))}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, px + cell / 2, py + cell / 2);
      };
      const drawMarker = (cellX: number, cellY: number, fill: string, stroke: string, label: string, isSel: boolean) => {
        drawMarkerPx(cellX * GRID, cellY * GRID, fill, stroke, label, isSel);
      };
      placedEntities.forEach(entity => {
        const cx = entity.position?.x ?? 0;
        const cy = entity.position?.y ?? 0;
        const isEnemy = entity.kind === 'enemy';
        const fill = isEnemy ? 'rgba(255,96,96,0.45)' : entity.kind === 'collectible' ? 'rgba(96,255,160,0.45)' : 'rgba(64,160,255,0.45)';
        const stroke = isEnemy ? '#FF6060' : '#40A0FF';
        const label = isEnemy ? 'E' : entity.kind === 'collectible' ? 'C' : entity.kind === 'hazard' ? 'H' : entity.kind === 'door' ? 'D' : '◆';
        drawMarker(cx, cy, fill, stroke, label, selectedPlacedId === entity.id);
      });
      playerEntries.forEach(entry => {
        drawMarkerPx(entry.x, entry.y, 'rgba(255,224,74,0.45)', '#FFE04A', 'P', selectedPlacedId === entry.id);
      });
    }

    if (layerVisible.foreground || activeLayer === 'foreground') {
      const cell = GRID * zoom;
      foregroundTiles.forEach(tile => {
        const px = tile.cellX * GRID * zoom;
        const py = tile.cellY * GRID * zoom;
        ctx.fillStyle = 'rgba(120,220,255,0.30)';
        ctx.fillRect(px, py, cell, cell);
        ctx.strokeStyle = '#78DCFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, cell - 2, cell - 2);
        ctx.lineWidth = 1;
        ctx.fillStyle = '#04222E';
        ctx.font = `${Math.max(8, Math.floor(cell * 0.5))}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('F', px + cell / 2, py + cell / 2);
      });
    }

    if (selectedCell) {
      ctx.strokeStyle = '#FFD24A';
      ctx.lineWidth = 2;
      ctx.strokeRect(selectedCell.x * GRID * zoom + 1, selectedCell.y * GRID * zoom + 1, GRID * zoom - 2, GRID * zoom - 2);
      ctx.lineWidth = 1;
    }
  }, [backgroundColor, backdropHex, composedPixels, showGrid, slots, zoom, roomHeight, selectedCell, layerVisible, room.collision, room.behavior, collisionCols, collisionRows, activeLayer, placedEntities, playerEntries, selectedPlacedId, foregroundTiles]);

  const commands = room.composition?.commands || [];

  // Persist a new command list (immutable; same shape as the legacy editor's updateComposition).
  const updateComposition = (nextCommands: Msx2BitmapRoomCommand[]) => {
    onUpdate({ composition: { source: 'authored', commands: nextCommands } });
  };

  const updateBackgroundColor = (nextColorRaw: unknown) => {
    const nextColor = clampByte(nextColorRaw, backgroundColor) & 0x0f;
    const commands = (room.composition?.commands || []).map(command =>
      isFullScreenFillCommand(command, SCREEN_W, roomHeight)
        ? { ...command, color: nextColor }
        : command
    );
    onUpdate({
      backgroundColor: nextColor,
      composition: {
        source: room.composition?.source || 'authored',
        commands,
      },
    });
    setActiveColor(nextColor);
    setStatusBarMessage?.(`SCREEN 5: color de fondo/transparencia/franjas cambiado a ${nextColor}.`);
  };

  // Tile-map grid (16 x rows): source of truth for placed tiles — one 16x16 tile per cell,
  // so painting over a cell overwrites (last wins) instead of stacking copy commands.
  const tileGrid = useMemo(() => buildTileGrid(room, gridWidth, gridHeight), [room, gridWidth, gridHeight]);

  const buildCopyCommandsFromGrid = (
    nextGrid: number[][],
    entries: Msx2BitmapRoomAtlasEntry[],
  ): Msx2BitmapRoomCommand[] => {
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
    return tileCmds;
  };

  // Persist a tile-grid change: keep the color/HUD fills+lines (non-'copy') and rebuild one
  // 'copy' per occupied cell, and store the grid itself (compact tilemap for MSX2 export).
  const applyTileGrid = (
    nextGrid: number[][],
    filterNonCopy?: (cmds: Msx2BitmapRoomCommand[]) => Msx2BitmapRoomCommand[],
    nextCollision?: number[][],
    nextBehavior?: number[][],
  ) => {
    const entries = room.atlas?.entries || [];
    let nonCopy = (room.composition?.commands || []).filter(command => command.op !== 'copy');
    if (filterNonCopy) nonCopy = filterNonCopy(nonCopy);
    const tileCmds = buildCopyCommandsFromGrid(nextGrid, entries);
    onUpdate({
      tileGrid: nextGrid,
      composition: { source: 'authored', commands: [...nonCopy, ...tileCmds] },
      ...(nextCollision ? { collision: nextCollision } : {}),
      ...(nextBehavior ? { behavior: nextBehavior } : {}),
    });
  };

  const getAtlasEntryUsageCount = (entry: Msx2BitmapRoomAtlasEntry | null): number => {
    if (!entry) return 0;
    const index = atlasEntries.findIndex(item => item.id === entry.id);
    if (index < 0) return 0;
    const tileValue = index + 1;
    return tileGrid.reduce((sum, row) => sum + row.filter(value => value === tileValue).length, 0);
  };

  const confirmDeleteAtlasEntry = () => {
    const entry = pendingDeleteAtlasEntry;
    if (!entry) return;
    const deleteIndex = atlasEntries.findIndex(item => item.id === entry.id);
    if (deleteIndex < 0) {
      setPendingDeleteAtlasEntryId(null);
      return;
    }

    const deleteValue = deleteIndex + 1;
    let clearedCells = 0;
    let nextCollision = room.collision;
    let nextBehavior = room.behavior;
    const nextGrid = tileGrid.map((row, y) => row.map((value, x) => {
      if (value === deleteValue) {
        clearedCells += 1;
        nextCollision = writeCell(nextCollision, x, y, 0, collisionCols, collisionRows);
        nextBehavior = writeCell(nextBehavior, x, y, 0, collisionCols, collisionRows);
        return 0;
      }
      return value > deleteValue ? value - 1 : value;
    }));
    const nextEntries = atlasEntries.filter(item => item.id !== entry.id);
    const nextPixels = atlasPixels.map(row => [...row]);
    const sx = Math.max(0, Math.trunc(entry.sx || 0));
    const sy = Math.max(0, Math.trunc(entry.sy || 0));
    const w = Math.max(1, Math.trunc(entry.w || GRID));
    const h = Math.max(1, Math.trunc(entry.h || GRID));
    for (let y = sy; y < Math.min(nextPixels.length, sy + h); y++) {
      for (let x = sx; x < Math.min(atlasWidth, sx + w); x++) {
        nextPixels[y][x] = 0;
      }
    }

    const nonCopy = (room.composition?.commands || []).filter(command => command.op !== 'copy');
    const tileCmds = buildCopyCommandsFromGrid(nextGrid, nextEntries);
    const fallbackSelection = nextEntries[deleteIndex]?.id || nextEntries[deleteIndex - 1]?.id || '';
    onUpdate({
      atlas: {
        width: atlasWidth,
        height: atlasHeight,
        offscreenBaseY: room.atlas?.offscreenBaseY || 320,
        pixels: nextPixels,
        entries: nextEntries,
      },
      tileGrid: nextGrid,
      collision: nextCollision,
      behavior: nextBehavior,
      composition: {
        source: room.composition?.source || 'authored',
        commands: [...nonCopy, ...tileCmds],
      },
    });
    setPendingDeleteAtlasEntryId(null);
    if (selectedAtlasEntryId === entry.id) {
      setSelectedAtlasEntryId(fallbackSelection);
    }
    setStatusBarMessage?.(`SCREEN 5: tile "${entry.name}" eliminado del atlas (${clearedCells} celdas limpiadas).`);
  };

  // Wipe ALL screen content (tiles, color fills/lines, collision/effects/behavior layers,
  // placed entities/enemies/objects, and player spawns), keeping palette and atlas resources.
  const handleClearAll = () => {
    if (!window.confirm('¿Borrar TODO el contenido de esta pantalla SCREEN 5 (tiles, rellenos, colisión, entidades, enemigos, objetos y player)? Se conservan la paleta y el atlas.')) return;
    const emptyTiles = Array.from({ length: gridHeight }, () => Array.from({ length: gridWidth }, () => 0));
    const emptyCollision = () => Array.from({ length: collisionRows }, () => Array.from({ length: collisionCols }, () => 0));
    onUpdate({
      composition: { source: 'authored', commands: [] },
      tileGrid: emptyTiles,
      collision: emptyCollision(),
      effects: emptyCollision(),
      behavior: emptyCollision(),
      entities: [],
      playerEntries: [],
    });
    setSelectedCell(null);
    setSelectedPlacedId(null);
    setStatusBarMessage?.('SCREEN 5: pantalla vaciada (tiles, capas, entidades y player).');
  };

  const selectedEntityPreset = useMemo(
    () => placeable.kind === 'preset'
      ? entityPresets.find(preset => preset.id === placeable.id) || null
      : null,
    [entityPresets, placeable.kind, placeable.id],
  );

  const cancelEntityPlacement = () => {
    setPlaceable({ kind: 'none', id: '' });
    setSelectedPlacedId(null);
    setActiveLayer('visual');
    setStatusBarMessage?.('SCREEN 5: colocación cancelada; capa Visual activa para seguir pintando tiles.');
  };

  const updatePlayerEntry = (id: string, patch: Partial<Msx2PlayerEntry>) => {
    const next = normalizeMsx2PlayerEntries(playerEntries.map(entry => (
      entry.id === id
        ? {
            ...entry,
            ...patch,
            x: patch.x !== undefined ? clampScreenPixelX(patch.x) : entry.x,
            y: patch.y !== undefined ? clampScreenPixelY(patch.y, roomHeight) : entry.y,
          }
        : entry
    )));
    onUpdate({ playerEntries: next });
  };

  const placeOrMovePlayerAtPixel = (pixelXRaw: number, pixelYRaw: number) => {
    const pixelX = clampScreenPixelX(pixelXRaw);
    const pixelY = clampScreenPixelY(pixelYRaw, roomHeight);
    if (playerAssets.length === 0) {
      setStatusBarMessage?.('SCREEN 5: crea primero un asset "MSX2 Player" para colocar el spawn del jugador.');
      return;
    }
    const selectedPlayer = selectedPlacedId
      ? playerEntries.find(entry => entry.id === selectedPlacedId)
      : undefined;
    if (selectedPlayer) {
      updatePlayerEntry(selectedPlayer.id, { x: pixelX, y: pixelY });
      setStatusBarMessage?.(`SCREEN 5: player recolocado en píxel (${pixelX}, ${pixelY}).`);
      return;
    }
    const base = createDefaultMsx2PlayerEntries();
    const id = `entry_${playerEntries.length + 1}`;
    // Link to a player asset (keep the existing entries' player if any, else the first asset),
    // otherwise the spawn has no sprite/behaviour and renders as a placeholder.
    const playerId = playerEntries.find(e => e.playerId)?.playerId || playerAssets[0].id;
    const nextEntry: Msx2PlayerEntry = {
      ...(base[0] || { id, x: pixelX, y: pixelY, facing: 'right' }),
      id,
      x: pixelX,
      y: pixelY,
      playerId,
    };
    const next = normalizeMsx2PlayerEntries([...playerEntries, nextEntry]);
    onUpdate({ playerEntries: next });
    setSelectedPlacedId(id);
    setStatusBarMessage?.(`SCREEN 5: spawn de jugador añadido en píxel (${pixelX}, ${pixelY}) [player: ${playerAssets.find(a => a.id === playerId)?.name || playerId}].`);
  };

  // --- Entity placement on the Entities layer ---
  // Entities/enemies store tile coords in position (like SCREEN 4); player entries
  // store exact pixel coords for SCREEN 5 bitmap placement.
  const placeAtCell = (cellX: number, cellY: number) => {
    if (placeable.kind === 'none') {
      setStatusBarMessage?.('SCREEN 5: selecciona Player, entidad o enemigo antes de colocar.');
      return;
    }
    if (placeable.kind === 'enemy') {
      const enemyAsset = enemyLibraryAssets.find(asset => asset.id === placeable.id);
      if (!enemyAsset) {
        setStatusBarMessage?.('SCREEN 5: selecciona un enemigo de la biblioteca primero.');
        return;
      }
      const enemyEntity = buildMsx2EnemyEntityFromAsset(enemyAsset, cellX, cellY);
      onUpdate({ entities: [...placedEntities, enemyEntity] });
      setSelectedPlacedId(enemyEntity.id);
      setStatusBarMessage?.(`SCREEN 5: enemigo "${enemyEntity.name}" colocado en (${cellX}, ${cellY}).`);
      return;
    }

    // preset
    if (!selectedEntityPreset) {
      setStatusBarMessage?.('SCREEN 5: no hay preset de entidad disponible.');
      return;
    }
    // The player is never a generic entity — it must be a player spawn (dedicated path).
    if (selectedEntityPreset.kind === 'player') {
      setStatusBarMessage?.('SCREEN 5: el jugador se coloca con "Player Spawn", no como entidad.');
      return;
    }
    const presetParams = { ...(selectedEntityPreset.params || {}) };
    const components = buildMsx2EntityComponents(selectedEntityPreset, cellX, cellY);
    const nextEntity: Msx2Screen4EntityInstance = {
      id: `msx2_entity_${Date.now()}`,
      name: `${selectedEntityPreset.label} ${placedEntities.length + 1}`,
      kind: selectedEntityPreset.kind,
      position: { x: cellX, y: cellY },
      components,
      params: presetParams,
    };
    onUpdate({ entities: [...placedEntities, nextEntity] });
    setSelectedPlacedId(nextEntity.id);
    setStatusBarMessage?.(`SCREEN 5: "${nextEntity.name}" colocada en (${cellX}, ${cellY}).`);
  };

  const deletePlacedEntity = (id: string) => {
    onUpdate({ entities: placedEntities.filter(entity => entity.id !== id) });
    if (selectedPlacedId === id) setSelectedPlacedId(null);
    if (pendingDeletePlaced?.id === id) setPendingDeletePlaced(null);
  };

  const deletePlayerEntry = (id: string) => {
    onUpdate({ playerEntries: normalizeMsx2PlayerEntries(playerEntries.filter(entry => entry.id !== id)) });
    if (selectedPlacedId === id) setSelectedPlacedId(null);
    if (pendingDeletePlaced?.id === id) setPendingDeletePlaced(null);
  };

  const getPlacedLabel = (target: { kind: 'entity' | 'player'; id: string } | null): string => {
    if (!target) return '';
    if (target.kind === 'player') {
      const entry = playerEntries.find(item => item.id === target.id);
      return entry ? `Player (${entry.x}, ${entry.y})` : 'Player';
    }
    const entity = placedEntities.find(item => item.id === target.id);
    return entity ? `${entity.kind}: ${entity.name}` : 'Entidad';
  };

  const confirmDeletePlaced = () => {
    if (!pendingDeletePlaced) return;
    if (pendingDeletePlaced.kind === 'entity') deletePlacedEntity(pendingDeletePlaced.id);
    else deletePlayerEntry(pendingDeletePlaced.id);
    setDraggingPlaced(null);
    setPendingDeletePlaced(null);
    setStatusBarMessage?.('SCREEN 5: objeto borrado.');
  };

  const movePlacedAtPoint = (target: { kind: 'entity' | 'player'; id: string }, px: number, py: number, cellX: number, cellY: number) => {
    if (target.kind === 'player') {
      const nextX = clampScreenPixelX(px);
      const nextY = clampScreenPixelY(py, roomHeight);
      const current = playerEntries.find(entry => entry.id === target.id);
      if (!current || (current.x === nextX && current.y === nextY)) return;
      onUpdate({
        playerEntries: normalizeMsx2PlayerEntries(playerEntries.map(entry =>
          entry.id === target.id ? { ...entry, x: nextX, y: nextY } : entry
        )),
      });
      return;
    }

    const current = placedEntities.find(entity => entity.id === target.id);
    if (!current || (current.position?.x === cellX && current.position?.y === cellY)) return;
    onUpdate({
      entities: placedEntities.map(entity =>
        entity.id === target.id
          ? { ...entity, position: { ...(entity.position || { x: 0, y: 0 }), x: cellX, y: cellY } }
          : entity
      ),
    });
  };

  // Hit-test a pixel point against placed items. Entities stay cell-based; player spawns use a 16x16 pixel box.
  const findPlacedAtPoint = (px: number, py: number, cellX: number, cellY: number): { kind: 'entity' | 'player'; id: string } | null => {
    const entity = placedEntities.find(item => item.position?.x === cellX && item.position?.y === cellY);
    if (entity) return { kind: 'entity', id: entity.id };
    const entry = playerEntries.find(item => px >= item.x && px < item.x + GRID && py >= item.y && py < item.y + GRID);
    if (entry) return { kind: 'player', id: entry.id };
    return null;
  };

  const stampToAtlasTiles = (entry: Msx2BitmapStampLibraryEntry): Msx2Screen4Tile[] =>
    entry.stamp.tiles.map((tile, index) => ({
      id: `${entry.id}_tile_${index}`,
      name: tile.name || `${entry.name}_${index + 1}`,
      width: tile.width,
      height: tile.height,
      pixels: Array.from({ length: tile.height }, (_row, y) =>
        Array.from({ length: tile.width }, (_col, x) => tile.pixelData[y * tile.width + x] ?? 0)
      ),
      behaviorKind: 'background',
      collisionFlags: tile.collisionFlags,
      behaviorCode: tile.behaviorCode,
    }));

  const prepareStampForPlacement = (entry: Msx2BitmapStampLibraryEntry) => {
    if (preparedStamp?.stampId === entry.id && preparedStamp.atlasEntryIds.every(id => atlasEntries.some(atlasEntry => atlasEntry.id === id))) {
      setSelectedStampId(entry.id);
      setActiveLayer('visual');
      setTool('brush');
      setStatusBarMessage?.(`SCREEN 5: stamp "${entry.name}" listo para colocar.`);
      return;
    }
    const shouldApplyPalette = !areScreen5PalettesEquivalent(slots, entry.palette);
    if (shouldApplyPalette) {
      const ok = window.confirm(`El stamp "${entry.name}" usa una paleta distinta. ¿Cargar esa paleta en la pantalla antes de colocarlo?`);
      if (!ok) {
        setStatusBarMessage?.('Stamp cancelado para evitar colores incorrectos.');
        return;
      }
    }
    const { atlas, addedEntries } = importTilesIntoAtlas(
      {
        width: atlasWidth,
        height: atlasHeight,
        offscreenBaseY: room.atlas?.offscreenBaseY || 320,
        pixels: room.atlas?.pixels,
        entries: atlasEntries,
      },
      stampToAtlasTiles(entry),
    );
    onUpdate({
      atlas,
      ...(shouldApplyPalette ? { palette: entry.palette.map(slot => ({ ...slot })) } : {}),
    });
    setSelectedStampId(entry.id);
    setPreparedStamp({ stampId: entry.id, atlasEntryIds: addedEntries.map(atlasEntry => atlasEntry.id) });
    revealAtlasEntry(addedEntries[0]);
    setActiveLayer('visual');
    setTool('brush');
    setStatusBarMessage?.(`SCREEN 5: stamp "${entry.name}" preparado; click en el grid para colocarlo.`);
  };

  // Adapt a stamp with a different palette to the CURRENT screen palette and prepare it
  // for placement, WITHOUT modifying the screen palette, the stamp asset or the global
  // library. Each stamp pixel is remapped to the nearest colour/tone of the current
  // palette; the adapted tiles (not the originals) are what get imported into the atlas.
  const prepareStampWithCurrentPalette = (entry: Msx2BitmapStampLibraryEntry) => {
    const adapted = adaptStampEntryToPalette(entry, slots);
    const { atlas, addedEntries } = importTilesIntoAtlas(
      {
        width: atlasWidth,
        height: atlasHeight,
        offscreenBaseY: room.atlas?.offscreenBaseY || 320,
        pixels: room.atlas?.pixels,
        entries: atlasEntries,
      },
      stampToAtlasTiles(adapted),
    );
    onUpdate({ atlas }); // No palette change: colours already remapped to the current palette.
    setSelectedStampId(entry.id);
    setPreparedStamp({ stampId: entry.id, atlasEntryIds: addedEntries.map(atlasEntry => atlasEntry.id) });
    revealAtlasEntry(addedEntries[0]);
    setActiveLayer('visual');
    setTool('brush');
    setStatusBarMessage?.(`SCREEN 5: stamp "${entry.name}" adaptado a la paleta actual; click en el grid para colocarlo.`);
  };

  // Promote a per-project stamp to the global (cross-project) library so it can be
  // reused in other projects from Libraries→Stamps. Project stamps stay in the project.
  const promoteStampToGlobalLibrary = (entry: Msx2BitmapStampLibraryEntry) => {
    mergeMsx2BitmapStampLibraryEntries([entry]);
    setStatusBarMessage?.(`Stamp "${entry.name}" guardado en la biblioteca global.`);
  };

  const placePreparedStampAtCell = (cellX: number, cellY: number): boolean => {
    const entry = selectedStampEntry;
    if (!entry || !preparedStamp || preparedStamp.stampId !== entry.id) return false;
    if (cellX + entry.stamp.columns > gridWidth || cellY + entry.stamp.rows > gridHeight) {
      setStatusBarMessage?.(`SCREEN 5: el stamp "${entry.name}" no cabe desde esa celda.`);
      return true;
    }
    const next = tileGrid.map(row => [...row]);
    let nextCollision = room.collision;
    let nextBehavior = room.behavior;
    for (let index = 0; index < preparedStamp.atlasEntryIds.length; index++) {
      const atlasEntryId = preparedStamp.atlasEntryIds[index];
      const atlasIndex = atlasEntries.findIndex(atlasEntry => atlasEntry.id === atlasEntryId);
      if (atlasIndex < 0) continue;
      const dx = index % entry.stamp.columns;
      const dy = Math.floor(index / entry.stamp.columns);
      const targetX = cellX + dx;
      const targetY = cellY + dy;
      next[targetY][targetX] = atlasIndex + 1;
      const flags = clampByte(atlasEntries[atlasIndex]?.collisionFlags, 0);
      const behaviorCode = clampByte(atlasEntries[atlasIndex]?.behaviorCode, 0);
      nextCollision = writeCell(nextCollision, targetX, targetY, flags, collisionCols, collisionRows);
      nextBehavior = writeCell(nextBehavior, targetX, targetY, behaviorCode, collisionCols, collisionRows);
    }
    applyTileGrid(next, undefined, nextCollision, nextBehavior);
    setStatusBarMessage?.(`SCREEN 5: stamp "${entry.name}" colocado en (${cellX}, ${cellY}).`);
    return true;
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
      const nextCollision = writeCell(room.collision, cx, cy, 0, collisionCols, collisionRows);
      const nextBehavior = writeCell(room.behavior, cx, cy, 0, collisionCols, collisionRows);
      applyTileGrid(next, nonCopy => nonCopy.filter(command => !commandContainsPoint(command, snapX, snapY)), nextCollision, nextBehavior);
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
        const paintedCells: Array<{ x: number; y: number }> = [];
        while (stack.length) {
          const [x, y] = stack.pop() as [number, number];
          if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) continue;
          if (next[y][x] !== target) continue;
          next[y][x] = value;
          paintedCells.push({ x, y });
          stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
        let nextCollision = room.collision;
        let nextBehavior = room.behavior;
        paintedCells.forEach(cell => {
          nextCollision = writeCell(nextCollision, cell.x, cell.y, selectedAtlasEntryFlags, collisionCols, collisionRows);
          nextBehavior = writeCell(nextBehavior, cell.x, cell.y, selectedAtlasEntryBehaviorCode, collisionCols, collisionRows);
        });
        applyTileGrid(next, undefined, nextCollision, nextBehavior);
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
    // Brush: place a prepared stamp first, otherwise place the selected atlas tile.
    if (tool === 'brush') {
      const cx = Math.max(0, Math.min(gridWidth - 1, Math.floor(px / GRID)));
      const cy = Math.max(0, Math.min(gridHeight - 1, Math.floor(py / GRID)));
      if (placePreparedStampAtCell(cx, cy)) return;
    }
    // Brush: place the selected atlas tile into this cell of the matrix (overwrites — last wins).
    if (selectedAtlasEntry) {
      const index = atlasEntries.indexOf(selectedAtlasEntry);
      if (index >= 0) {
        const cx = Math.max(0, Math.min(gridWidth - 1, Math.floor(px / GRID)));
        const cy = Math.max(0, Math.min(gridHeight - 1, Math.floor(py / GRID)));
        const next = tileGrid.map(row => [...row]);
        next[cy][cx] = index + 1;
        const nextCollision = writeCell(room.collision, cx, cy, selectedAtlasEntryFlags, collisionCols, collisionRows);
        const nextBehavior = writeCell(room.behavior, cx, cy, selectedAtlasEntryBehaviorCode, collisionCols, collisionRows);
        applyTileGrid(next, undefined, nextCollision, nextBehavior);
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

  // --- Foreground-layer painting on the 16px grid ---
  // Left-click stamps the selected atlas tile as a high-priority hardware sprite
  // (one per cell, last wins); eraser / right-click clears the cell. Capped at
  // FOREGROUND_MAX tiles per room (SAT/pattern budget on MSX2).
  const paintForegroundAt = (px: number, py: number, erase: boolean) => {
    const cellX = clampInt(Math.floor(px / GRID), 0, gridWidth - 1, 0);
    const cellY = clampInt(Math.floor(py / GRID), 0, gridHeight - 1, 0);
    if (erase || tool === 'eraser') {
      const next = foregroundTiles.filter(t => !(t.cellX === cellX && t.cellY === cellY));
      if (next.length !== foregroundTiles.length) {
        onUpdate({ foregroundTiles: next });
        setStatusBarMessage?.(`SCREEN 5: foreground borrado en celda (${cellX}, ${cellY}).`);
      }
      return;
    }
    if (!selectedAtlasEntry) {
      setStatusBarMessage?.('SCREEN 5: selecciona un tile del atlas para pintar Foreground.');
      return;
    }
    const occupied = foregroundTiles.some(t => t.cellX === cellX && t.cellY === cellY);
    if (!occupied && foregroundTiles.length >= FOREGROUND_MAX) {
      setStatusBarMessage?.(`SCREEN 5: máximo ${FOREGROUND_MAX} tiles foreground por sala.`);
      return;
    }
    const explicit = foregroundColor === '' ? undefined : clampInt(foregroundColor, 1, 15, 1);
    const tile: Msx2BitmapRoomForegroundTile = explicit === undefined
      ? { cellX, cellY, atlasEntryId: selectedAtlasEntry.id }
      : { cellX, cellY, atlasEntryId: selectedAtlasEntry.id, color: explicit };
    const next = [...foregroundTiles.filter(t => !(t.cellX === cellX && t.cellY === cellY)), tile];
    onUpdate({ foregroundTiles: next });
    setStatusBarMessage?.(`SCREEN 5: foreground colocado en celda (${cellX}, ${cellY}).`);
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
    setConfigTarget('cell');

    if (layerLocked[activeLayer]) {
      setStatusBarMessage?.(`SCREEN 5: capa "${activeLayer}" bloqueada (lock activo).`);
      return;
    }
    if (activeLayer === 'objects') {
      // Entities layer: left-click selects an existing placed item, or places the chosen one.
      const hit = findPlacedAtPoint(px, py, cellX, cellY);
      if (hit) {
        setSelectedPlacedId(hit.id);
        setDraggingPlaced(hit);
        if (hit.kind === 'player') setPlaceable({ kind: 'player', id: 'player' });
        setStatusBarMessage?.(`SCREEN 5: objeto seleccionado en píxel (${px}, ${py}).`);
        return;
      }
      if (placeable.kind === 'player') {
        placeOrMovePlayerAtPixel(px, py);
        return;
      }
      placeAtCell(cellX, cellY);
      return;
    }
    if (activeLayer === 'visual') {
      paintVisualAt(px, py);
      setStatusBarMessage?.(`SCREEN 5: ${tool} en celda (${cellX}, ${cellY}).`);
    } else if (activeLayer === 'foreground') {
      paintForegroundAt(px, py, false);
    } else {
      paintCollisionAt(px, py, 'collision');
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
    if (activeLayer === 'visual' && tool === 'brush' && preparedStamp) return;
    // Entities layer places/selects on click only — never on drag (avoids spamming entities).
    if (activeLayer === 'objects') {
      if (!draggingPlaced || layerLocked.objects) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const px = Math.floor((event.clientX - rect.left) * (SCREEN_W / rect.width));
      const py = Math.floor((event.clientY - rect.top) * (roomHeight / rect.height));
      const cellX = Math.max(0, Math.min(gridWidth - 1, Math.floor(px / GRID)));
      const cellY = Math.max(0, Math.min(gridHeight - 1, Math.floor(py / GRID)));
      setSelectedCell({ x: cellX, y: cellY });
      setConfigTarget('cell');
      movePlacedAtPoint(draggingPlaced, px, py, cellX, cellY);
      return;
    }
    handleCanvasPaint(event);
  };
  const handleCanvasUp = () => {
    if (draggingPlaced) setStatusBarMessage?.('SCREEN 5: objeto recolocado.');
    setIsPainting(false);
    setDraggingPlaced(null);
  };

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
    setConfigTarget('cell');
    if (layerLocked[activeLayer]) {
      setStatusBarMessage?.(`SCREEN 5: capa "${activeLayer}" bloqueada (lock activo).`);
      return;
    }
    if (activeLayer === 'objects') {
      // Right-click on the Entities layer selects an item and asks before deleting it.
      const hit = findPlacedAtPoint(px, py, cellX, cellY);
      if (!hit) {
        setPendingDeletePlaced(null);
        setStatusBarMessage?.(`SCREEN 5: sin objeto en píxel (${px}, ${py}).`);
        return;
      }
      setSelectedPlacedId(hit.id);
      setDraggingPlaced(null);
      setPendingDeletePlaced(hit);
      if (hit.kind === 'player') setPlaceable({ kind: 'player', id: 'player' });
      setStatusBarMessage?.(`SCREEN 5: objeto seleccionado para borrar en píxel (${px}, ${py}).`);
      return;
    }
    if (activeLayer === 'visual') {
      const snapX = Math.max(0, Math.min(SCREEN_W - GRID, Math.floor(px / GRID) * GRID));
      const snapY = Math.max(0, Math.min(roomHeight - GRID, Math.floor(py / GRID) * GRID));
      const had = tileGrid[cellY]?.[cellX] !== 0;
      const next = tileGrid.map(row => [...row]);
      next[cellY][cellX] = 0;
      const nextCollision = writeCell(room.collision, cellX, cellY, 0, collisionCols, collisionRows);
      const nextBehavior = writeCell(room.behavior, cellX, cellY, 0, collisionCols, collisionRows);
      applyTileGrid(next, nonCopy => nonCopy.filter(command => !commandContainsPoint(command, snapX, snapY)), nextCollision, nextBehavior);
      if (had) setStatusBarMessage?.(`SCREEN 5: tile borrado en celda (${cellX}, ${cellY}).`);
    } else if (activeLayer === 'foreground') {
      paintForegroundAt(px, py, true);
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
    paletteSourceId?: string,
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
    if (paletteChanged && paletteSourceId && paletteSourceId !== 'screen' && onUpdatePaletteAsset) {
      onUpdatePaletteAsset(paletteSourceId, palette.map(slot => ({ ...slot })));
      if (onSetWorldPaletteAssetId) onSetWorldPaletteAssetId(paletteSourceId);
    } else if (paletteChanged && usesWorldPalette && worldPaletteAssetId && onUpdatePaletteAsset) {
      onUpdatePaletteAsset(worldPaletteAssetId, palette.map(slot => ({ ...slot })));
    } else if (paletteChanged && !usesWorldPalette && onSetWorldPaletteAssetId && paletteSourceId && paletteSourceId !== 'screen') {
      onSetWorldPaletteAssetId(paletteSourceId);
    }
    onUpdate({
      atlas,
      ...(paletteChanged && !usesWorldPalette && (!paletteSourceId || paletteSourceId === 'screen') ? { palette: palette.map(slot => ({ ...slot })) } : {}),
    });
    revealAtlasEntry(addedEntries[0]);
    setStatusBarMessage?.(`Importados ${addedEntries.length} tile(s) al atlas SCREEN 5.`);
  };

  // Project palette assets, for the "Cargar paleta" picker.
  const paletteAssets = useMemo(() => allAssets.filter(asset => asset.type === 'palette'), [allAssets]);

  const getAtlasEntryPixels = (entry: Msx2BitmapRoomAtlasEntry): number[][] => {
    const w = Math.max(1, entry.w || GRID);
    const h = Math.max(1, entry.h || GRID);
    return Array.from({ length: h }, (_r, yy) =>
      Array.from({ length: w }, (_c, xx) => atlasPixels[entry.sy + yy]?.[entry.sx + xx] ?? 0),
    );
  };

  const saveBitmapTileAssetFromPixels = (
    name: string,
    pixels: number[][],
    sourceType: BitmapTileScreen5['sourceType'] = 'manual-edit',
  ) => {
    const h = Math.max(1, pixels.length);
    const w = Math.max(1, pixels[0]?.length || GRID);
    const draftTileId = `bitmap_tile_screen5_${Date.now()}`;
    const matchingPalette = findMatchingScreen5PaletteAsset(slots, allAssets);
    const paletteAsset = matchingPalette ?? createScreen5PaletteAssetForTile(slots, name, draftTileId, allAssets);
    const tileAsset = buildScreen5BitmapTileAsset({
      name,
      width: w,
      height: h,
      pixels,
      paletteId: paletteAsset.id,
      existingAssets: matchingPalette ? allAssets : [...allAssets, paletteAsset],
      sourceType,
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

  const saveBitmapTileEditorToAtlas = (name: string, pixels: number[][]) => {
    const entry = editingAtlasEntry;
    if (!entry) return;
    const nextPixels = atlasPixels.map(row => [...row]);
    const w = Math.max(1, entry.w || GRID);
    const h = Math.max(1, entry.h || GRID);
    for (let yy = 0; yy < h; yy++) {
      for (let xx = 0; xx < w; xx++) {
        const py = entry.sy + yy;
        const px = entry.sx + xx;
        if (py >= 0 && py < nextPixels.length && px >= 0 && px < atlasWidth) {
          nextPixels[py][px] = Math.max(0, Math.min(15, Math.trunc(Number(pixels[yy]?.[xx]) || 0)));
        }
      }
    }
    const nextEntries = atlasEntries.map(item => item.id === entry.id ? { ...item, name: name.trim() || item.name } : item);
    onUpdate({
      atlas: {
        width: atlasWidth,
        height: atlasHeight,
        offscreenBaseY: room.atlas?.offscreenBaseY || 320,
        pixels: nextPixels,
        entries: nextEntries,
      },
    });
    setStatusBarMessage?.(`SCREEN 5: tile "${name.trim() || entry.name}" actualizado en el atlas.`);
  };

  const saveBitmapTileEditorAsAsset = (name: string, pixels: number[][]) => {
    saveBitmapTileAssetFromPixels(name.trim() || editingAtlasEntry?.name || 'Bitmap Tile', pixels, 'manual-edit');
  };

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
    const pixels = getAtlasEntryPixels(entry);
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
    saveBitmapTileAssetFromPixels(entry.name, getAtlasEntryPixels(entry), 'atlas-export');
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
    if (shouldApplyPalette && usesWorldPalette && worldPaletteAssetId && onUpdatePaletteAsset) {
      onUpdatePaletteAsset(worldPaletteAssetId, palette.map(slot => ({ ...slot })));
    } else if (shouldApplyPalette && !usesWorldPalette && onSetWorldPaletteAssetId) {
      onSetWorldPaletteAssetId(tile.paletteId);
    }
    onUpdate({
      atlas,
      ...(shouldApplyPalette && !usesWorldPalette && !onSetWorldPaletteAssetId ? { palette: palette.map(slot => ({ ...slot })) } : {}),
    });
    revealAtlasEntry(addedEntries[0]);
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
    if (onSetWorldPaletteAssetId) {
      onSetWorldPaletteAssetId(asset.id);
    } else {
      onUpdate({ palette: normalized.map(slot => ({ ...slot })) });
    }
    setIsPalettePickerOpen(false);
    setStatusBarMessage?.(onSetWorldPaletteAssetId
      ? `Paleta "${asset.name}" asignada al mundo SCREEN 5.`
      : `Paleta "${asset.name}" cargada (16 colores SCREEN 5).`
    );
  };

  const createPaletteAssetFromCurrent = () => {
    const baseName = `${room.name || 'SCREEN 5'} Palette`;
    const usedNames = new Set(allAssets.map(asset => asset.name));
    let name = baseName;
    let suffix = 2;
    while (usedNames.has(name)) name = `${baseName} ${suffix++}`;
    const now = new Date().toISOString();
    const paletteAsset: ProjectAsset = {
      id: `palette_screen5_world_${Date.now()}`,
      name,
      type: 'palette',
      data: {
        mode: 'SCREEN5',
        slots: slots.map(slot => ({ ...slot })),
        source: 'manual',
        createdAt: now,
        updatedAt: now,
        notes: `Saved from SCREEN 5 Palette Manager for "${room.name}".`,
      } as PaletteAsset,
    };
    onUpdate({}, [paletteAsset]);
    onSetWorldPaletteAssetId?.(paletteAsset.id);
    setStatusBarMessage?.(`Paleta "${name}" creada como asset${onSetWorldPaletteAssetId ? ' y asignada al mundo' : ''}.`);
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

  const selectedAtlasEntryFlags = selectedAtlasEntry ? clampByte(selectedAtlasEntry.collisionFlags, 0) : 0;
  const selectedAtlasEntryBehaviorCode = selectedAtlasEntry ? clampByte(selectedAtlasEntry.behaviorCode, 0) : 0;
  const getConfigAtlasEntryIds = (): string[] => {
    if (configTarget !== 'tile') return [];
    const preparedIds = preparedStamp?.stampId === selectedStampId
      ? preparedStamp.atlasEntryIds.filter(id => atlasEntries.some(entry => entry.id === id))
      : [];
    if (preparedIds.length > 0 && (!selectedAtlasEntry || preparedIds.includes(selectedAtlasEntry.id))) return preparedIds;
    return selectedAtlasEntry ? [selectedAtlasEntry.id] : [];
  };
  const persistPreparedStampTileMetadata = (
    targetEntryIds: string[],
    updater: (tile: BitmapTileScreen5) => BitmapTileScreen5,
  ): boolean => {
    if (!onUpdateProjectAsset || !selectedStampAsset || !selectedStampEntry || preparedStamp?.stampId !== selectedStampId) return false;
    const targetSet = new Set(targetEntryIds);
    const now = Date.now();
    const updatedTiles = selectedStampEntry.stamp.tiles.map((tile, index) => (
      targetSet.has(preparedStamp.atlasEntryIds[index]) ? updater(tile) : tile
    ));
    const updatedEntry: Msx2BitmapStampLibraryEntry = {
      ...selectedStampEntry,
      savedAt: now,
      stamp: {
        ...selectedStampEntry.stamp,
        tiles: updatedTiles,
        updatedAt: new Date(now).toISOString(),
      },
    };
    onUpdateProjectAsset(selectedStampAsset.id, updatedEntry);
    return true;
  };
  const selectedCellBehaviorCode = selectedCollisionCell
    ? readCell(room.behavior, selectedCollisionCell.x, selectedCollisionCell.y)
    : 0;
  const configFlags = configTarget === 'cell' && selectedCollisionCell
    ? readCell(room.collision, selectedCollisionCell.x, selectedCollisionCell.y)
    : selectedAtlasEntryFlags;
  const configBehaviorCode = configTarget === 'cell' && selectedCollisionCell
    ? selectedCellBehaviorCode
    : selectedAtlasEntryBehaviorCode;
  const formatBehaviorCode = (value: number) =>
    value === BEHAVIOR_CODE.ice ? `${value} (Ice)` : `${value}`;

  // Reflect the selected tile/cell stored collision flags into the checkbox state.
  useEffect(() => {
    if (configTarget === 'cell' && !selectedCollisionCell) {
      setCellProps({});
      return;
    }
    const next: Record<string, boolean> = {};
    PROPERTY_FLAGS.forEach(flag => { next[flag.key] = (configFlags & PROP_BIT[flag.key]) !== 0; });
    next.ice = configBehaviorCode === BEHAVIOR_CODE.ice;
    setCellProps(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configTarget, selectedCollisionCell?.x, selectedCollisionCell?.y, room.collision, room.behavior, selectedAtlasEntry?.id, selectedAtlasEntryFlags, selectedAtlasEntryBehaviorCode]);

  const toggleProp = (key: string) => {
    const bit = PROP_BIT[key];
    if (configTarget === 'cell' && selectedCollisionCell) {
      const current = readCell(room.collision, selectedCollisionCell.x, selectedCollisionCell.y);
      const nextValue = (current & bit) ? (current & ~bit) : (current | bit);
      const grown = writeCell(room.collision, selectedCollisionCell.x, selectedCollisionCell.y, nextValue, collisionCols, collisionRows);
      onUpdate({ collision: grown });
      setStatusBarMessage?.(`SCREEN 5: ${key} ${(nextValue & bit) ? 'ON' : 'OFF'} en celda (${selectedCollisionCell.x}, ${selectedCollisionCell.y}).`);
      return;
    }

    const targetEntryIds = getConfigAtlasEntryIds();
    if (targetEntryIds.length === 0) {
      setStatusBarMessage?.('Selecciona un tile del atlas o una celda del lienzo primero.');
      return;
    }
    const targetSet = new Set(targetEntryIds);
    const current = selectedAtlasEntry && targetSet.has(selectedAtlasEntry.id)
      ? clampByte(selectedAtlasEntry.collisionFlags, 0)
      : clampByte(atlasEntries.find(entry => targetSet.has(entry.id))?.collisionFlags, 0);
    const turnOn = (current & bit) === 0;
    const beforeById = new Map(atlasEntries.map(entry => [entry.id, clampByte(entry.collisionFlags, 0)]));
    const afterById = new Map<string, number>();
    const entries = atlasEntries.map(entry => {
      if (!targetSet.has(entry.id)) return entry;
      const flags = clampByte(entry.collisionFlags, 0);
      const nextValue = turnOn ? (flags | bit) : (flags & ~bit);
      afterById.set(entry.id, nextValue);
      return { ...entry, collisionFlags: nextValue || undefined };
    });
    let syncedCells = 0;
    let nextCollision = room.collision;
    atlasEntries.forEach((entry, index) => {
      if (!targetSet.has(entry.id)) return;
      const tileIndexToSync = index + 1;
      const before = beforeById.get(entry.id) ?? 0;
      const after = afterById.get(entry.id) ?? before;
      tileGrid.forEach((row, y) => {
        row.forEach((tileIndex, x) => {
          if (tileIndex !== tileIndexToSync) return;
          if (readCell(nextCollision, x, y) !== before) return;
          nextCollision = writeCell(nextCollision, x, y, after, collisionCols, collisionRows);
          syncedCells++;
        });
      });
    });
    onUpdate({
      atlas: { ...room.atlas, entries },
      ...(syncedCells > 0 ? { collision: nextCollision } : {}),
    });
    const persistedStamp = persistPreparedStampTileMetadata(targetEntryIds, tile => {
      const flags = clampByte(tile.collisionFlags, 0);
      const nextValue = turnOn ? (flags | bit) : (flags & ~bit);
      return { ...tile, collisionFlags: nextValue || undefined, updatedAt: new Date().toISOString() };
    });
    const targetLabel = targetEntryIds.length > 1
      ? `${targetEntryIds.length} tiles del metatile`
      : `tile "${selectedAtlasEntry?.name || atlasEntries.find(entry => targetSet.has(entry.id))?.name || 'atlas'}"`;
    setStatusBarMessage?.(
      `SCREEN 5: ${key} ${turnOn ? 'ON' : 'OFF'} en ${targetLabel}` +
      (syncedCells > 0 ? `; ${syncedCells} celda(s) sincronizada(s)` : '') +
      (persistedStamp ? '; metatile actualizado.' : '.')
    );
  };

  const toggleIceSurface = () => {
    const nextValue = configBehaviorCode === BEHAVIOR_CODE.ice ? BEHAVIOR_CODE.none : BEHAVIOR_CODE.ice;
    if (configTarget === 'cell' && selectedCollisionCell) {
      const grown = writeCell(room.behavior, selectedCollisionCell.x, selectedCollisionCell.y, nextValue, collisionCols, collisionRows);
      onUpdate({ behavior: grown });
      setStatusBarMessage?.(`SCREEN 5: Ice ${nextValue === BEHAVIOR_CODE.ice ? 'ON' : 'OFF'} en celda (${selectedCollisionCell.x}, ${selectedCollisionCell.y}).`);
      return;
    }

    const targetEntryIds = getConfigAtlasEntryIds();
    if (targetEntryIds.length === 0) {
      setStatusBarMessage?.('Selecciona un tile del atlas o una celda del lienzo primero.');
      return;
    }
    const targetSet = new Set(targetEntryIds);
    const beforeById = new Map(atlasEntries.map(entry => [entry.id, clampByte(entry.behaviorCode, 0)]));
    const entries = atlasEntries.map(entry => targetSet.has(entry.id)
      ? { ...entry, behaviorCode: nextValue || undefined }
      : entry);
    let syncedCells = 0;
    let nextBehavior = room.behavior;
    atlasEntries.forEach((entry, index) => {
      if (!targetSet.has(entry.id)) return;
      const tileIndexToSync = index + 1;
      const before = beforeById.get(entry.id) ?? 0;
      tileGrid.forEach((row, y) => {
        row.forEach((tileIndex, x) => {
          if (tileIndex !== tileIndexToSync) return;
          if (readCell(nextBehavior, x, y) !== before) return;
          nextBehavior = writeCell(nextBehavior, x, y, nextValue, collisionCols, collisionRows);
          syncedCells++;
        });
      });
    });
    onUpdate({
      atlas: { ...room.atlas, entries },
      ...(syncedCells > 0 ? { behavior: nextBehavior } : {}),
    });
    const persistedStamp = persistPreparedStampTileMetadata(targetEntryIds, tile => ({
      ...tile,
      behaviorCode: nextValue || undefined,
      updatedAt: new Date().toISOString(),
    }));
    const targetLabel = targetEntryIds.length > 1
      ? `${targetEntryIds.length} tiles del metatile`
      : `tile "${selectedAtlasEntry?.name || atlasEntries.find(entry => targetSet.has(entry.id))?.name || 'atlas'}"`;
    setStatusBarMessage?.(
      `SCREEN 5: Ice ${nextValue === BEHAVIOR_CODE.ice ? 'ON' : 'OFF'} en ${targetLabel}` +
      (syncedCells > 0 ? `; ${syncedCells} celda(s) sincronizada(s)` : '') +
      (persistedStamp ? '; metatile actualizado.' : '.')
    );
  };

  const selectedCellSlot = selectedCell ? composedPixels[selectedCell.y * GRID]?.[selectedCell.x * GRID] ?? 0 : 0;
  const statusCategoryLabel = CATEGORY_FILTERS.find(c => c.key === selectedCategory)?.label || '';

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
        <Button size="sm" variant="danger" icon={<EraserIcon />} onClick={handleClearAll} title="Vaciar todo el contenido de la pantalla (tiles, rellenos, capas, entidades, enemigos, objetos y player)">
          Clear All
        </Button>
        <label className="flex items-center gap-1 text-xs text-msx-textsecondary">
          <HudIcon />
          MSX2 HUD
          <select
            value={selectedHudAssetId}
            onChange={event => handleLinkHudAsset(event.target.value)}
            className="bg-msx-bgcolor border border-msx-border rounded px-2 py-1 text-xs text-msx-textprimary min-w-32"
            title="Selecciona el asset MSX2 HUD que se integrara en la banda superior SCREEN 5; NONE quita el HUD vinculado."
          >
            <option value="">NONE</option>
            {hudAssets.map(asset => (
              <option key={asset.id} value={asset.id}>{asset.name}</option>
            ))}
          </select>
        </label>
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
                      onSelect={() => {
                        setSelectedAtlasEntryId(entry.id);
                        setConfigTarget('tile');
                      }}
                      onDoubleClick={() => {
                        setSelectedAtlasEntryId(entry.id);
                        setConfigTarget('tile');
                        setEditingAtlasEntryId(entry.id);
                      }}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        setSelectedAtlasEntryId(entry.id);
                        setConfigTarget('tile');
                        setPendingDeleteAtlasEntryId(entry.id);
                      }}
                    />
                  ))}
                </div>
                {pendingDeleteAtlasEntry && (
                  <div className="mt-2 rounded border border-red-500/60 bg-msx-bgcolor p-2 text-[0.65rem] text-msx-textsecondary">
                    <div className="font-semibold text-red-300">Eliminar tile del atlas?</div>
                    <div className="mt-1 truncate text-msx-textprimary">{pendingDeleteAtlasEntry.name}</div>
                    <div className="mt-1">
                      Se quitara del atlas y se vaciaran {getAtlasEntryUsageCount(pendingDeleteAtlasEntry)} celdas que lo usan.
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        className="rounded bg-red-600 px-2 py-1 text-white hover:bg-red-500"
                        onClick={confirmDeleteAtlasEntry}
                      >
                        Eliminar
                      </button>
                      <button
                        type="button"
                        className="rounded border border-msx-border px-2 py-1 text-msx-textprimary hover:border-msx-highlight"
                        onClick={() => setPendingDeleteAtlasEntryId(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
                {visibleAtlasEntries.length === 0 && (
                  <div className="mt-1 text-[0.6rem] text-msx-textsecondary">Sin tiles en la categoría "{statusCategoryLabel}".</div>
                )}
              </div>
            )}
          </CollapsiblePanel>

          <CollapsiblePanel title="Stamps bitmap" isOpen={openStamps} onToggle={() => setOpenStamps(v => !v)}>
            {stampEntries.length === 0 ? (
              <div className="rounded border border-msx-border bg-msx-bgcolor p-2 text-xs text-msx-textsecondary">
                No hay stamps. Importa un PNG SCREEN 5 de varios tiles para crear uno.
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                {stampEntries.map(entry => (
                  <div key={entry.id} className="rounded border border-msx-border bg-msx-bgcolor p-1">
                    <StampThumb
                      entry={entry}
                      slots={entry.palette}
                      isSelected={entry.id === selectedStampId}
                      onSelect={() => {
                        setSelectedStampId(entry.id);
                        setPreparedStamp(null);
                      }}
                    />
                    <div className="mt-1 flex gap-1">
                      <Button
                        size="sm"
                        variant={preparedStamp?.stampId === entry.id ? 'primary' : 'secondary'}
                        onClick={() => prepareStampForPlacement(entry)}
                        title="Importa las piezas al atlas y activa la colocaciÃ³n del bloque completo"
                      >
                        Colocar
                      </Button>
                      {!areScreen5PalettesEquivalent(slots, entry.palette) && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => prepareStampWithCurrentPalette(entry)}
                          title="Adapta los colores del stamp a la paleta actual (busca el tono mas cercano de cada slot) y lo deja listo para colocar sin cambiar la paleta de pantalla"
                        >
                          Adapt
                        </Button>
                      )}
                      {preparedStamp?.stampId === entry.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPreparedStamp(null)}
                          title="Cancelar colocaciÃ³n de stamp"
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => promoteStampToGlobalLibrary(entry)}
                        title="Guardar este stamp en la biblioteca global (compartida entre proyectos)"
                      >
                        ↑ Global
                      </Button>
                    </div>
                  </div>
                ))}
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
            {/* Filters the atlas grid by category inferred from entry names. "Todos" disables filtering. */}
            <div className="grid grid-cols-1 gap-1">
              {CATEGORY_FILTERS.map(cat => (
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
            {/* Active layer routes painting (visual→composition, collision→collision map, entities→placed items).
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

          <CollapsiblePanel title="Foreground (sprites)" isOpen={openForeground} onToggle={() => setOpenForeground(v => !v)}>
            {/* Foreground overlay tiles are drawn as MSX2 hardware sprites with HIGHER
                priority than the player, so the player walks behind them (pillars/columns).
                Left-click stamps the selected atlas tile; right-click erases. Max 3/room. */}
            <div className="space-y-2">
              {activeLayer !== 'foreground' && (
                <button
                  type="button"
                  onClick={() => setActiveLayer('foreground')}
                  className="w-full text-[0.7rem] rounded px-2 py-1 border border-msx-warning text-msx-warning hover:bg-msx-warning/10"
                >
                  Activa la capa "Foreground" para pintar
                </button>
              )}
              <div className="text-[0.65rem] text-msx-textsecondary leading-tight">
                Tile seleccionado: <span className="text-msx-textprimary">{selectedAtlasEntry?.name || '—'}</span>. Click pinta, click-derecho borra.
              </div>
              <label className="flex items-center gap-2 text-[0.7rem] text-msx-textsecondary">
                Color sprite
                <select
                  value={foregroundColor}
                  onChange={e => {
                    const v = e.target.value;
                    setForegroundColor(v === '' ? '' : clampInt(Number(v), 1, 15, 1));
                  }}
                  className="bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5 text-xs text-msx-textprimary"
                  title="Color del sprite foreground (vacío = automático: el color no-fondo más frecuente del tile)"
                >
                  <option value="">Auto</option>
                  {Array.from({ length: 15 }, (_unused, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </label>
              <div className="flex items-center justify-between text-[0.65rem] text-msx-textsecondary">
                <span>{foregroundTiles.length}/{FOREGROUND_MAX} tiles</span>
                {foregroundTiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => { onUpdate({ foregroundTiles: [] }); setStatusBarMessage?.('SCREEN 5: foreground limpiado.'); }}
                    className="rounded px-2 py-0.5 border border-msx-border text-msx-textsecondary hover:border-msx-danger hover:text-msx-danger"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="Colocar (Entities)" isOpen={openPlacement} onToggle={() => setOpenPlacement(v => !v)}>
            {/* Player / entity / enemy placement. Active when the Entities layer is selected:
                left-click on the canvas places the chosen item; right-click deletes the one
                under the cell. Items persist in room.entities / room.playerEntries (like SCREEN 4). */}
            <div className="space-y-2">
              {activeLayer !== 'objects' && (
                <button
                  type="button"
                  onClick={() => setActiveLayer('objects')}
                  className="w-full text-[0.7rem] rounded px-2 py-1 border border-msx-warning text-msx-warning hover:bg-msx-warning/10"
                >
                  Activa la capa "Entities" para colocar
                </button>
              )}
              {(placeable.kind !== 'none' || selectedPlacedId) && (
                <button
                  type="button"
                  onClick={cancelEntityPlacement}
                  className="w-full text-[0.7rem] rounded px-2 py-1 border border-msx-border text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight"
                  title="Cancelar la colocación actual y volver a pintar tiles en Visual"
                >
                  Cancel
                </button>
              )}

              <div>
                <div className="text-[0.7rem] text-msx-highlight mb-1">Jugador (spawn)</div>
                <button
                  type="button"
                  onClick={() => { setPlaceable({ kind: 'player', id: 'player' }); setActiveLayer('objects'); }}
                  className={`w-full text-left text-xs rounded px-2 py-1 border ${placeable.kind === 'player' ? 'border-msx-highlight bg-msx-panelbg text-msx-highlight' : 'border-msx-border text-msx-textsecondary hover:border-msx-highlight'}`}
                >
                  Player Spawn
                </button>
              </div>

              <div>
                <div className="text-[0.7rem] text-msx-highlight mb-1">Entidad (preset)</div>
                <select
                  value={placeable.kind === 'preset' ? placeable.id : ''}
                  onChange={e => { setPlaceable({ kind: 'preset', id: e.target.value }); setActiveLayer('objects'); }}
                  className="w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1 text-xs text-msx-textprimary"
                >
                  <option value="" disabled>Selecciona un preset…</option>
                  {entityPresets.map(preset => (
                    <option key={preset.id} value={preset.id}>{preset.label} ({preset.kind})</option>
                  ))}
                </select>
                {placeable.kind === 'preset' && selectedEntityPreset && (
                  <div className="mt-1 text-[0.6rem] text-msx-textsecondary leading-tight">{selectedEntityPreset.description}</div>
                )}
              </div>

              <div>
                <div className="text-[0.7rem] text-msx-highlight mb-1">Enemigo (biblioteca)</div>
                {enemyLibraryAssets.length === 0 ? (
                  <div className="text-[0.6rem] text-msx-textsecondary">No hay assets msx2enemy en el proyecto.</div>
                ) : (
                  <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                    {enemyLibraryAssets.map(asset => (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => { setPlaceable({ kind: 'enemy', id: asset.id }); setActiveLayer('objects'); }}
                        className={`w-full text-left text-xs rounded px-2 py-1 border ${placeable.kind === 'enemy' && placeable.id === asset.id ? 'border-msx-highlight bg-msx-panelbg text-msx-highlight' : 'border-msx-border text-msx-textsecondary hover:border-msx-highlight'}`}
                      >
                        {asset.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Placed items list (select / delete). */}
              <div>
                <div className="text-[0.7rem] text-msx-highlight mb-1">Colocados ({placedEntities.length + playerEntries.length})</div>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  {playerEntries.map(entry => (
                    <div key={entry.id} className={`flex items-center gap-1 rounded px-2 py-1 border text-xs ${selectedPlacedId === entry.id ? 'border-msx-highlight bg-msx-panelbg' : 'border-msx-border'}`}>
                      <button
                        type="button"
                        className="flex-1 text-left text-msx-textprimary truncate"
                        onClick={() => {
                          setSelectedPlacedId(entry.id);
                          setPlaceable({ kind: 'player', id: 'player' });
                          setActiveLayer('objects');
                        }}
                        title={`Player @ pixel (${entry.x}, ${entry.y})`}
                      >
                        P · {entry.id} · {entry.x},{entry.y}
                      </button>
                      <label className="flex items-center gap-0.5 text-[0.6rem] text-msx-textsecondary" title="Player X pixel">
                        X
                        <input
                          type="number"
                          min={0}
                          max={SCREEN_W - 1}
                          value={entry.x}
                          onChange={event => updatePlayerEntry(entry.id, { x: Number(event.target.value) })}
                          className="w-12 bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5 text-msx-textprimary"
                        />
                      </label>
                      <label className="flex items-center gap-0.5 text-[0.6rem] text-msx-textsecondary" title="Player Y pixel">
                        Y
                        <input
                          type="number"
                          min={0}
                          max={roomHeight - 1}
                          value={entry.y}
                          onChange={event => updatePlayerEntry(entry.id, { y: Number(event.target.value) })}
                          className="w-12 bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5 text-msx-textprimary"
                        />
                      </label>
                      <button type="button" className="text-msx-danger hover:text-msx-highlight" title="Borrar spawn" onClick={() => deletePlayerEntry(entry.id)}>✕</button>
                    </div>
                  ))}
                  {placedEntities.map(entity => (
                    <div key={entity.id} className={`flex items-center gap-1 rounded px-2 py-1 border text-xs ${selectedPlacedId === entity.id ? 'border-msx-highlight bg-msx-panelbg' : 'border-msx-border'}`}>
                      <button type="button" className="flex-1 text-left text-msx-textprimary truncate" onClick={() => setSelectedPlacedId(entity.id)} title={`${entity.kind} @ (${entity.position?.x}, ${entity.position?.y})`}>
                        {entity.kind.charAt(0).toUpperCase()} · {entity.name}
                      </button>
                      <button type="button" className="text-msx-danger hover:text-msx-highlight" title="Borrar entidad" onClick={() => deletePlacedEntity(entity.id)}>✕</button>
                    </div>
                  ))}
                  {placedEntities.length + playerEntries.length === 0 && (
                    <div className="text-[0.6rem] text-msx-textsecondary">Nada colocado todavía.</div>
                  )}
                </div>
              </div>
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

          {/* main canvas — wrapped in a "franja" frame painted with the R#7 border color */}
          <div className="relative flex-1 overflow-auto p-3 flex justify-center bg-[#080A0F]">
            <div
              style={{ backgroundColor: backdropHex, padding: `${Math.max(8, zoom * 8)}px`, alignSelf: 'flex-start', flex: '0 0 auto' }}
              title="Franjas exteriores (VDP R#7 = color de fondo)"
            >
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
                display: 'block',
              }}
            />
            </div>
            {pendingDeletePlaced && (
              <div className="absolute top-3 right-3 z-20 w-64 rounded border border-msx-warning bg-msx-panelbg p-3 shadow-lg">
                <div className="text-xs pixel-font text-msx-warning mb-2">Delete placed item?</div>
                <div className="text-xs text-msx-textprimary mb-3 break-words">{getPlacedLabel(pendingDeletePlaced)}</div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingDeletePlaced(null)}
                    className="rounded border border-msx-border px-2 py-1 text-xs text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeletePlaced}
                    className="rounded border border-msx-danger bg-msx-danger/20 px-2 py-1 text-xs text-msx-danger hover:border-msx-highlight hover:text-msx-highlight"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
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
                    return <RoomMinimapThumb asset={neighbour} isCurrent={false} paletteSlots={slots} onOpen={onOpenRoom ? () => onOpenRoom(neighbour.id) : undefined} isStart={neighbour.id === worldStart.startRoomId} />;
                  }
                  return (
                    <EmptySilhouette
                      direction={direction}
                      interactive={interactive}
                      onRequest={() => setPendingCreateDir(direction)}
                    />
                  );
                };
                const renderDiagonal = (direction: DiagonalDirection) => {
                  const neighbour = diagonalRooms[direction];
                  if (!neighbour) return <div className="opacity-0" style={{ aspectRatio: '4 / 3' }} />;
                  return <RoomMinimapThumb asset={neighbour} isCurrent={false} paletteSlots={slots} onOpen={onOpenRoom ? () => onOpenRoom(neighbour.id) : undefined} isStart={neighbour.id === worldStart.startRoomId} />;
                };
                return (
                  // Scrollable (both axes) so the map can grow without clipping.
                  <div className="overflow-auto" style={{ maxHeight: '13rem' }}>
                    <div className="mx-auto" style={{ width: '15rem', minWidth: '12rem' }}>
                      <div className="grid grid-cols-3 gap-1">
                        {renderDiagonal('northWest')}
                        {renderCell('north')}
                        {renderDiagonal('northEast')}
                        {renderCell('west')}
                        <RoomMinimapThumb asset={allAssets.find(a => a.id === room.id) ?? ({ id: room.id, name: room.name, type: 'msx2bitmaproom', data: room } as ProjectAsset)} isCurrent paletteSlots={slots} isStart={worldStart.currentIsStart} />
                        {renderCell('east')}
                        {renderDiagonal('southWest')}
                        {renderCell('south')}
                        {renderDiagonal('southEast')}
                      </div>
                    </div>
                  </div>
                );
              })()}
              {/* World start-screen control: marks this room as the world's entry point. */}
              <div className="mt-2 flex items-center justify-between gap-2 text-[0.65rem]">
                <span className={worldStart.currentIsStart ? 'text-msx-highlight' : 'text-msx-textsecondary'}>
                  {worldStart.currentIsStart
                    ? '★ Pantalla de inicio del mundo'
                    : worldStart.startRoomId
                      ? 'Otra pantalla es el inicio'
                      : 'Sin pantalla de inicio definida'}
                </span>
                <button
                  type="button"
                  disabled={!onSetWorldStartRoom || worldStart.currentIsStart}
                  onClick={() => onSetWorldStartRoom?.(room.id)}
                  title="Marca esta pantalla como punto de inicio del mundo (startScreenNodeId del World Map)"
                  className="rounded border border-msx-border px-2 py-0.5 text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight disabled:opacity-40 disabled:cursor-default disabled:hover:border-msx-border disabled:hover:text-msx-textsecondary"
                >
                  Marcar como inicio
                </button>
              </div>
              {/* Recompose: rebuild the owning WorldMap asset so the WorldView renders correctly
                  after rooms were deleted/edited (drops orphans + dangling rails, re-lays grid). */}
              <button
                type="button"
                disabled={!onRecomposeWorld || !worldStart.hasWorld}
                onClick={() => onRecomposeWorld?.(room.id)}
                title="Reconstruye el asset World Map que contiene esta pantalla: elimina pantallas borradas y recoloca el grid. Después la World View se verá bien."
                className="mt-1 w-full rounded border border-msx-accent px-2 py-1 text-[0.7rem] text-msx-accent hover:bg-msx-accent/15 disabled:opacity-40 disabled:cursor-default disabled:hover:bg-transparent"
              >
                Reconstruir World Map
              </button>
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
                    <AtlasTilePreview entry={selectedAtlasEntry} atlasPixels={atlasPixels} slots={slots} />
                  ) : (
                    <SpriteIcon />
                  )}
                </div>
                <div className="text-xs text-msx-textsecondary space-y-0.5">
                  <div>ID: <span className="text-msx-textprimary">{selectedAtlasEntry ? toHex(atlasEntries.indexOf(selectedAtlasEntry)) : '--'}</span></div>
                  <div>Behavior: <span className="text-msx-textprimary">{selectedAtlasEntry ? formatBehaviorCode(selectedAtlasEntryBehaviorCode) : '--'}</span></div>
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
                  <div>Behavior: <span className="text-msx-textprimary">{selectedCollisionCell ? formatBehaviorCode(selectedCellBehaviorCode) : '--'}</span></div>
                </div>
              </div>
            </div>

            {/* Property checkboxes: atlas tile flags by default, or the selected collision cell when requested. */}
            <div className="mb-1 flex items-center justify-between gap-2 text-[0.65rem] text-msx-textsecondary">
              <span>
                Editando:{' '}
                <span className="text-msx-textprimary">
                  {configTarget === 'cell' && selectedCollisionCell
                    ? `Celda (${selectedCollisionCell.x}, ${selectedCollisionCell.y})`
                    : selectedAtlasEntry
                      ? `Tile "${selectedAtlasEntry.name}"`
                      : 'sin seleccion'}
                </span>
              </span>
              {selectedCollisionCell && (
                <button
                  type="button"
                  onClick={() => setConfigTarget(configTarget === 'tile' ? 'cell' : 'tile')}
                  className="rounded border border-msx-border px-1 py-0.5 text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight"
                >
                  {configTarget === 'tile' ? 'Usar celda' : 'Usar tile'}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1">
              {PROPERTY_FLAGS.map(flag => (
                <label key={flag.key} className="flex items-center gap-1 text-xs text-msx-textsecondary">
                  <input type="checkbox" checked={!!cellProps[flag.key]} onChange={() => toggleProp(flag.key)} />
                  {flag.label}
                </label>
              ))}
              <label className="flex items-center gap-1 text-xs text-msx-textsecondary">
                <input type="checkbox" checked={!!cellProps.ice} onChange={toggleIceSurface} />
                Ice (behavior=3)
              </label>
            </div>
            <div className="mt-2 rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-[0.65rem] text-msx-textsecondary">
              {configTarget === 'cell' && selectedCollisionCell
                ? 'Editas solo la celda seleccionada; marca Ice para escribir behavior=3 en esa celda.'
                : 'Editas el tile del atlas; marca Ice para que ese tile pinte behavior=3 y sincronice sus celdas ya colocadas.'}
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="HUD" isOpen={openHud} onToggle={() => setOpenHud(v => !v)}>
            <div className="text-[0.65rem] text-msx-textsecondary mb-2">
              Vincula un asset MSX2 HUD (diseñado en el Mideas HUD Editor) a esta room. El HUD se dibuja siempre encima de la banda superior de 20px de SCREEN 5.
            </div>
            <select
              value={selectedHudAssetId}
              onChange={event => handleLinkHudAsset(event.target.value)}
              className="w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1 text-xs text-msx-textprimary mb-2"
            >
              <option value="">NONE</option>
              {hudAssets.map(asset => (
                <option key={asset.id} value={asset.id}>{asset.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" icon={<PlusCircleIcon />} onClick={handleCreateAndLinkHud} className="flex-1">
                Crear y vincular
              </Button>
              <Button
                size="sm"
                variant="ghost"
                icon={<HudIcon />}
                disabled={!linkedHudAsset}
                onClick={() => linkedHudAsset && onOpenHudAsset?.(linkedHudAsset.id)}
                className="flex-1"
              >
                Editar HUD
              </Button>
            </div>
            {linkedHudAsset && (
              <div className="mt-2 text-[0.65rem] text-msx-textsecondary">
                Vinculado: <span className="text-msx-textprimary">{linkedHudAsset.name}</span>
              </div>
            )}
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
            <div className="mb-2 rounded border border-msx-border bg-msx-bgcolor/50 p-2 text-[0.65rem] text-msx-textsecondary">
              <label className="block space-y-1">
                <span className="text-msx-highlight">Paleta del mundo</span>
                <select
                  value={worldPaletteAssetId || ''}
                  onChange={event => onSetWorldPaletteAssetId?.(event.target.value || undefined)}
                  disabled={!onSetWorldPaletteAssetId}
                  className="w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1 text-xs text-msx-textprimary"
                  title="Paleta compartida que el ROM carga una vez al entrar en este mundo"
                >
                  <option value="">Sin asignar: usar paleta local de esta pantalla</option>
                  {paletteAssets
                    .filter(asset => {
                      const palette = asset.data as PaletteAsset | undefined;
                      return palette?.mode === 'SCREEN4' || palette?.mode === 'SCREEN5';
                    })
                    .map(asset => (
                      <option key={asset.id} value={asset.id}>{asset.name}</option>
                    ))}
                </select>
              </label>
              <button
                type="button"
                onClick={createPaletteAssetFromCurrent}
                className="mt-2 w-full rounded border border-msx-highlight px-2 py-1 text-xs text-msx-highlight hover:bg-msx-highlight/20"
                title="Crear un asset de paleta con los 16 colores actuales y asignarlo al mundo"
              >
                Crear asset con paleta actual
              </button>
              <div className="mt-1">
                {usesWorldPalette
                  ? `Activa: ${worldPaletteAsset?.name || worldPaletteAssetId}.`
                  : 'Fallback: esta pantalla conserva su paleta local hasta asignar una paleta al mundo.'}
              </div>
            </div>
            {/* Real palette data from the world palette asset, or room.palette as fallback. */}
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
            <div className="mt-2 grid grid-cols-2 gap-2 text-[0.65rem] text-msx-textsecondary">
              <label className="space-y-1">
                Color fondo / transparencia / franjas
                <select
                  value={backgroundColor}
                  onChange={event => updateBackgroundColor(event.target.value)}
                  className="w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1 text-xs text-msx-textprimary"
                  title="VDP R#7: un único color para el fondo, los pixeles transparentes (color 0) y las franjas exteriores"
                >
                  {slots.map((_slot, index) => (
                    <option key={index} value={index}>Color {index}</option>
                  ))}
                </select>
              </label>
              <div className="space-y-1">
                <div>Vista fondo</div>
                <button
                  type="button"
                  onClick={() => updateBackgroundColor(activeColor)}
                  className="h-7 w-full rounded border border-msx-border text-[0.6rem] hover:border-msx-highlight"
                  style={{ backgroundColor: backdropHex, color: backgroundColor < 8 ? '#fff' : '#000' }}
                  title="Aplicar el color activo como fondo/transparencia/franjas"
                >
                  Usar activo ({activeColor})
                </button>
              </div>
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
        paletteAssets={paletteAssets as Array<{ id: string; name: string; data?: PaletteAsset }>}
        onImportTiles={handleImportTilesFromLibrary}
        activeTargetMode="screen5"
        allAssets={allAssets}
        onImportBitmapTileAssets={(newAssets) => {
          const bitmapTileAssets = newAssets.filter(asset => asset.type === 'msx2bitmaptile');
          const atlasTiles = bitmapTileAssets
            .map(asset => bitmapTileScreen5ToAtlasTile(asset.data as BitmapTileScreen5))
            .filter(tile => Array.isArray(tile.pixels));
          if (atlasTiles.length > 0) {
            const { atlas, addedEntries } = importTilesIntoAtlas(
              {
                width: atlasWidth,
                height: atlasHeight,
                offscreenBaseY: room.atlas?.offscreenBaseY || 320,
                pixels: room.atlas?.pixels,
                entries: atlasEntries,
              },
              atlasTiles,
            );
            onUpdate({ atlas }, newAssets);
            revealAtlasEntry(addedEntries[0]);
          } else {
            onUpdate({}, newAssets);
          }
          const importedStampCount = newAssets.filter(asset => asset.type === 'msx2bitmapstamp').length;
          setStatusBarMessage?.(importedStampCount > 0
            ? `Importado ${importedStampCount} stamp(s) al proyecto.`
            : `Importados ${bitmapTileAssets.length} tile(s) bitmap al proyecto y al atlas SCREEN 5.`);
        }}
      />

      <BitmapTileEditorModal
        entry={editingAtlasEntry}
        pixels={editingAtlasEntry ? getAtlasEntryPixels(editingAtlasEntry) : []}
        slots={slots}
        onClose={() => setEditingAtlasEntryId(null)}
        onSaveAtlas={saveBitmapTileEditorToAtlas}
        onSaveAsset={saveBitmapTileEditorAsAsset}
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

      {/* Create-neighbour confirm: centered modal so it is never clipped by the minimap panel. */}
      {pendingCreateDir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPendingCreateDir(null)}>
          <div className="w-80 rounded border border-msx-highlight bg-msx-panelbg p-4 space-y-3 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="text-sm text-msx-textprimary text-center">
              ¿Crear pantalla al <span className="text-msx-highlight font-semibold">{DIRECTION_LABELS[pendingCreateDir]}</span> y conectarla en el World Map?
            </div>
            <label className="flex items-start gap-2 rounded border border-msx-border bg-msx-bgcolor/60 p-2 text-xs text-msx-textsecondary">
              <input
                type="checkbox"
                checked={copySharedEdgeTiles}
                onChange={event => setCopySharedEdgeTiles(event.target.checked)}
                className="mt-0.5"
              />
              <span>
                {pendingCreateDir === 'east' && 'Copiar la columna derecha de tiles como primera columna de la nueva pantalla.'}
                {pendingCreateDir === 'west' && 'Copiar la columna izquierda de tiles como última columna de la nueva pantalla.'}
                {pendingCreateDir === 'north' && 'Copiar la fila superior de tiles como última fila de la nueva pantalla.'}
                {pendingCreateDir === 'south' && 'Copiar la fila inferior de tiles como primera fila de la nueva pantalla.'}
              </span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const dir = pendingCreateDir;
                  setPendingCreateDir(null);
                  onCreateAdjacentRoom?.(dir, { copySharedEdgeTiles });
                }}
                className="flex-1 rounded px-2 py-1 text-sm border border-msx-highlight text-msx-highlight hover:bg-msx-highlight/20"
              >
                Crear
              </button>
              <button
                type="button"
                onClick={() => setPendingCreateDir(null)}
                className="flex-1 rounded px-2 py-1 text-sm border border-msx-border text-msx-textsecondary hover:border-msx-highlight"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
};
