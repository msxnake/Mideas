import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ConnectionDirection,
  BitmapTileScreen5,
  Msx2BitmapAutoTerrain,
  Msx2BitmapAutoTerrainVariant,
  Msx2BitmapTerrainAsset,
  Msx2BitmapRoomAtlasEntry,
  Msx2BitmapRoomCommand,
  Msx2BitmapRoomForegroundTile,
  Msx2HudAsset,
  Msx2KeyItemDefinition,
  Msx2JumperConfig,
  Msx2WallJumperConfig,
  Msx2LockedDoorConfig,
  Msx2WorldExitConfig,
  Msx2PressureButtonConfig,
  Msx2PlayerEntry,
  Msx2ProjectProfile,
  Msx2Screen5BitmapRoom,
  Msx2Screen4EntityInstance,
  Msx2Screen4Tile,
  Msx2Sprite,
  PaletteAsset,
  ProjectAsset,
  Screen5PaletteSlot,
  WorldMapGraph,
} from '../../types';
import {
  MSX2_ENTITY_REPERTOIRE,
  buildMsx2EnemyEntityFromAsset,
  buildMsx2BossEntityFromAsset,
  buildMsx2EntityComponents,
} from '../msx2_screen4_editor/msx2EntityCatalog';
import { filterMsx2EntityPresetsForProfile } from '../../utils/msx2ProjectProfiles';
import { createDefaultMsx2PlayerEntries, normalizeMsx2PlayerEntries } from '../../utils/msx2PlayerDefaults';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { Msx2BitmapTileEditor } from './Msx2BitmapTileEditor';
import { ensureScreen5PaletteSlots } from '../../utils/msx2PaletteUtils';
import { importTilesIntoAtlas } from '../../utils/msx2BitmapAtlasImport';
import {
  applyTerrainToGrid,
  describeAutotileMask,
  findTerrainForGridValue,
  pruneTerrainsForEntries,
} from '../../utils/msx2Autotile';
import { Msx2TileLibraryModal } from '../modals/Msx2TileLibraryModal';
import { Msx2AutotileImportModal } from '../modals/Msx2AutotileImportModal';
import { ConfirmationModal } from '../modals/ConfirmationModal';
import { addEntryToMsx2TileLibrary } from '../../utils/msx2TileLibrary';
import {
  Msx2BitmapStampLibraryEntry,
  adaptStampEntryToPalette,
  mergeMsx2BitmapStampLibraryEntries,
} from '../../utils/msx2BitmapStampLibrary';
import { addTerrainToMsx2BitmapTerrainLibrary } from '../../utils/msx2BitmapTerrainLibrary';
import {
  areScreen5PalettesEquivalent,
  bitmapStampToPixelGrid,
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
  SelectionIcon,
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

type BrushTool = 'brush' | 'eraser' | 'fill' | 'select';
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
  // destroy_tile (pico) diggable bit, per collision CELL. High-nibble bit, so it also
  // reads as SOLID at runtime (probe `and #BF`) — a dug wall is solid until destroyed.
  // This lets the SAME visual tile be diggable in one cell and only-solid in another
  // (secret paths). Painting a "Destructible" atlas tile stamps it; Select toggles it.
  destructible: 0x80,
  // Crumbling floor (Manic Miner), per collision CELL. AUTHORING-ONLY bit: the exported
  // collision byte masks bits 2..1 away (`& 0xf9`, that field carries the Effects layer),
  // so it never reaches the ROM and cannot make a cell read as solid. The generator turns
  // the marked cells into a per-room record list instead.
  crumbling: 0x04,
};

// 8x8 SUB-CELL solidity (room.collisionShape): each 16x16 collision cell can be
// split into four 8x8 quadrants so a tile drawn on half its surface only collides
// where it is drawn. The generator packs this nibble into the high nibble of the
// exported behavior byte and flags the cell with HAS_SHAPE (0x01) in the collision
// byte; 0 (and 15) mean "the whole cell is solid", i.e. the legacy behaviour.
// Crumbling floor (Manic Miner): 8 erosion stages of 2px each consume the 16px cell.
// The speed is authored per atlas tile (frames the player must stand on it per stage).
const CRUMBLE_STAGES = 8;
const CRUMBLE_FRAMES_MIN = 2;
const CRUMBLE_FRAMES_MAX = 30;
const CRUMBLE_FRAMES_DEFAULT = 6;

const SHAPE_BIT = { tl: 1, tr: 2, bl: 4, br: 8 } as const;
const SHAPE_FULL = 0x0f;
const SHAPE_QUADRANTS: { key: keyof typeof SHAPE_BIT; label: string }[] = [
  { key: 'tl', label: 'Arriba izquierda' },
  { key: 'tr', label: 'Arriba derecha' },
  { key: 'bl', label: 'Abajo izquierda' },
  { key: 'br', label: 'Abajo derecha' },
];
const SHAPE_PRESETS: { label: string; value: number; title: string }[] = [
  { label: 'Llena', value: 0, title: 'Celda 16x16 solida entera (comportamiento clasico)' },
  { label: 'Mitad inf.', value: SHAPE_BIT.bl | SHAPE_BIT.br, title: 'Repisa: solo los 8px inferiores colisionan' },
  { label: 'Mitad sup.', value: SHAPE_BIT.tl | SHAPE_BIT.tr, title: 'Techo bajo: solo los 8px superiores colisionan' },
  { label: 'Izquierda', value: SHAPE_BIT.tl | SHAPE_BIT.bl, title: 'Media columna izquierda' },
  { label: 'Derecha', value: SHAPE_BIT.tr | SHAPE_BIT.br, title: 'Media columna derecha' },
];
/** Authored nibble -> the four quadrants actually solid (0 means the whole cell). */
const expandCellShape = (shape: number): number => {
  const value = shape & SHAPE_FULL;
  return value === 0 ? SHAPE_FULL : value;
};
// Same red as the canvas collision overlay so the mini-grid reads as "this is the
// solid part of the cell". Literal colours: the msx-* palette entries are CSS vars
// and Tailwind cannot apply its /opacity modifier to them (renders as no colour).
const SHAPE_ON_COLOR = 'rgba(255,64,64,0.55)';
const SHAPE_ON_BORDER = 'rgba(255,96,96,0.9)';
const countShapeQuadrants = (shape: number): number =>
  [SHAPE_BIT.tl, SHAPE_BIT.tr, SHAPE_BIT.bl, SHAPE_BIT.br].filter(bit => (shape & bit) !== 0).length;
/** Human label for the authored nibble, so the panel never shows just a number. */
const describeCellShape = (shape: number): string => {
  const value = shape & SHAPE_FULL;
  if (value === 0 || value === SHAPE_FULL) return 'Celda entera';
  const preset = SHAPE_PRESETS.find(item => item.value === value);
  return preset ? preset.label : `${countShapeQuadrants(value)} de 4 cuadrantes`;
};

const PROPERTY_FLAGS: { key: string; label: string }[] = [
  { key: 'solid', label: 'Solid' },
  { key: 'breakable', label: 'Breakable' },
  { key: 'platform', label: 'Platform' },
  { key: 'movable', label: 'Movable' },
  { key: 'deadly', label: 'Deadly' },
  { key: 'interactable', label: 'Interactable' },
];

const sanitizeKeyItemId = (value: string, fallback = 'key_item') => {
  const id = value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
  return id || fallback;
};

const slugifyIdPart = (value: string): string =>
  String(value || '').trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '') || 'metatile';

const normalizeLockedDoorConfig = (value: unknown): Msx2LockedDoorConfig => {
  const raw = value && typeof value === 'object' ? value as Partial<Msx2LockedDoorConfig> : {};
  return {
    enabled: Boolean(raw.enabled),
    requiredKeyId: typeof raw.requiredKeyId === 'string' ? raw.requiredKeyId : '',
    consumeKey: Boolean(raw.consumeKey),
    openOnce: raw.openOnce !== false,
    requireUpKey: Boolean(raw.requireUpKey),
    closedAtlasEntryId: typeof raw.closedAtlasEntryId === 'string' ? raw.closedAtlasEntryId : '',
    openAtlasEntryId: typeof raw.openAtlasEntryId === 'string' ? raw.openAtlasEntryId : '',
    lockedMessage: typeof raw.lockedMessage === 'string' ? raw.lockedMessage : '',
    targetRoomId: typeof raw.targetRoomId === 'string' ? raw.targetRoomId : '',
    targetEntryId: typeof raw.targetEntryId === 'string' ? raw.targetEntryId : '',
  };
};

const normalizeWorldExitConfig = (value: unknown): Msx2WorldExitConfig => {
  const raw = value && typeof value === 'object' ? value as Partial<Msx2WorldExitConfig> : {};
  const clampOffset = (input: unknown) => Math.max(0, Math.min(31, Math.floor(Number(input) || 0)));
  const clampSpan = (input: unknown) => Math.max(1, Math.min(32, Math.floor(Number(input) || 16)));
  return {
    enabled: raw.enabled !== false,
    atlasEntryId: typeof raw.atlasEntryId === 'string' ? raw.atlasEntryId : '',
    offsetX: clampOffset(raw.offsetX),
    offsetY: clampOffset(raw.offsetY),
    hitboxW: clampSpan(raw.hitboxW),
    hitboxH: clampSpan(raw.hitboxH),
  };
};

const isWorldExitEntity = (entity: Msx2Screen4EntityInstance | null | undefined): boolean => {
  if (!entity) return false;
  const engine = String(entity.params?.engine || '').replace(/[\s_-]+/g, '').toLowerCase();
  return engine === 'worldexit' || Boolean(entity.params?.worldExit || entity.components?.msx2_world_exit);
};

const normalizePressureButtonConfig = (value: unknown): Msx2PressureButtonConfig => {
  const raw = value && typeof value === 'object' ? value as Partial<Msx2PressureButtonConfig> : {};
  const actors = raw.actors === 'player' || raw.actors === 'enemies' ? raw.actors : 'playerAndEnemies';
  return {
    enabled: raw.enabled !== false,
    targetDoorId: typeof raw.targetDoorId === 'string' ? raw.targetDoorId : '',
    actors,
    latch: Boolean(raw.latch),
    atlasEntryId: typeof raw.atlasEntryId === 'string' ? raw.atlasEntryId : '',
    pressedAtlasEntryId: typeof raw.pressedAtlasEntryId === 'string' ? raw.pressedAtlasEntryId : '',
  };
};

const normalizeJumperConfig = (value: unknown): Msx2JumperConfig => {
  const raw = value && typeof value === 'object' ? value as Partial<Msx2JumperConfig> : {};
  const impulse = Math.round(Number(raw.impulsePx));
  return {
    enabled: raw.enabled !== false,
    atlasEntryId: typeof raw.atlasEntryId === 'string' ? raw.atlasEntryId : '',
    triggeredAtlasEntryId: typeof raw.triggeredAtlasEntryId === 'string' ? raw.triggeredAtlasEntryId : '',
    impulsePx: Number.isFinite(impulse) ? Math.max(2, Math.min(15, impulse)) : 8,
  };
};

const isJumperEntity = (entity: Msx2Screen4EntityInstance | null | undefined): boolean =>
  Boolean(entity && (entity.params?.engine === 'jumper' || entity.params?.jumper || entity.components?.msx2_jumper));

const normalizeWallJumperConfig = (value: unknown): Msx2WallJumperConfig => {
  const raw = value && typeof value === 'object' ? value as Partial<Msx2WallJumperConfig> : {};
  const impulse = Math.round(Number(raw.impulsePx));
  const direction = raw.direction === 'left' || raw.direction === 'right' ? raw.direction : 'right';
  return {
    enabled: raw.enabled !== false,
    atlasEntryId: typeof raw.atlasEntryId === 'string' ? raw.atlasEntryId : '',
    triggeredAtlasEntryId: typeof raw.triggeredAtlasEntryId === 'string' ? raw.triggeredAtlasEntryId : '',
    impulsePx: Number.isFinite(impulse) ? Math.max(2, Math.min(15, impulse)) : 8,
    direction,
  };
};

const isWallJumperEntity = (entity: Msx2Screen4EntityInstance | null | undefined): boolean =>
  Boolean(entity && (entity.params?.engine === 'wallJumper' || entity.params?.wallJumper || entity.components?.msx2_wall_jumper));

const BEHAVIOR_CODE = {
  none: 0,
  ice: 3,
  exitEnemy: 4,
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

/**
 * Collision byte to stamp when an atlas tile is painted. `crumbling` lives on the entry as a
 * boolean but its source of truth for the generator is the per-cell bit, so every painting
 * path must stamp it — brush, mix roll, autotile and fill alike.
 */
const entryPaintFlags = (entry: { collisionFlags?: number; crumbling?: boolean } | undefined): number =>
  clampByte(entry?.collisionFlags, 0) | (entry?.crumbling === true ? PROP_BIT.crumbling : 0);

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
  /** Deletes a room asset and removes its WorldMap node/incident rails after confirmation. */
  onDeleteRoom?: (assetId: string) => void;
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
  hudFontAssetId: null,
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

type PatrolPointKey = 'start' | 'end';

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
  /** Receives the click event so the caller can read Ctrl/Cmd for multi-selection. */
  onSelect: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onDoubleClick?: () => void;
  onContextMenu?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** 1-based position inside the random-mix multi-selection; null/undefined = not in the mix. */
  multiIndex?: number | null;
}

const AtlasThumb: React.FC<AtlasThumbProps> = ({ entry, atlasPixels, slots, isSelected, onSelect, onDoubleClick, onContextMenu, multiIndex }) => {
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
  const inMix = multiIndex !== null && multiIndex !== undefined;
  return (
    <button
      type="button"
      className={`relative rounded border p-1 text-left bg-msx-bgcolor hover:border-msx-highlight ${inMix ? 'border-msx-cyan ring-1 ring-msx-cyan' : isSelected ? 'border-msx-highlight' : 'border-msx-border'}`}
      title={`${entry.name} (${entry.w}x${entry.h})${inMix ? ` — en mezcla aleatoria (#${multiIndex})` : ''}\nCtrl+click: añadir/quitar de la mezcla aleatoria`}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    >
      <div className="aspect-square w-full bg-black border border-black/70 overflow-hidden">
        <canvas ref={canvasRef} width={width} height={height} className="w-full h-full" style={{ imageRendering: 'pixelated' }} />
      </div>
      <div className="mt-1 text-[0.6rem] leading-tight text-msx-textprimary truncate">{entry.name}</div>
      {inMix && (
        <span className="absolute right-0.5 top-0.5 rounded bg-msx-cyan px-1 text-[0.55rem] font-bold leading-tight text-black">
          {multiIndex}
        </span>
      )}
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
  /** Appends the draft as a NEW atlas entry (the edited tile stays untouched). */
  onSaveAtlasCopy: (name: string, pixels: number[][]) => void;
  /** Project assets, needed by the extended bitmap tile editor (palette lookups). */
  allAssets: ProjectAsset[];
  /** World palette asset used to render the extended editor with the room's colors. */
  worldPaletteAsset?: ProjectAsset;
  /** Persists assets created from the extended editor (e.g. "create palette asset"). */
  onAddAssets?: (assets: ProjectAsset[]) => void;
  setStatusBarMessage?: (message: string) => void;
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
  onSaveAtlasCopy,
  allAssets,
  worldPaletteAsset,
  onAddAssets,
  setStatusBarMessage,
}) => {
  const width = Math.max(1, Math.trunc(entry?.w || GRID));
  const height = Math.max(1, Math.trunc(entry?.h || GRID));
  const [name, setName] = useState(entry?.name || 'Bitmap Tile');
  const [draftPixels, setDraftPixels] = useState<number[][]>(() => clonePixelGrid(pixels, width, height));
  const [activeSlot, setActiveSlot] = useState(1);
  const [tool, setTool] = useState<BitmapTileTool>('brush');
  const [brushSize, setBrushSize] = useState<1 | 2 | 3>(1);
  const [ditherMaskEnabled, setDitherMaskEnabled] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const [paintingTool, setPaintingTool] = useState<BitmapTileTool>('brush');
  // Slot index currently being dragged from its "used color" handle (drag-to-replace).
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null);
  // Non-null while the "Extended" full bitmap tile editor overlay is open; holds the
  // live draft edited there (rotation may change width/height until it returns).
  const [extendedTile, setExtendedTile] = useState<BitmapTileScreen5 | null>(null);

  // Reset the draft only when the edited entry changes (open/close/switch tile). Depending
  // on the `pixels` identity would reset it on every parent re-render — e.g. when the
  // extended editor emits a status-bar message — wiping in-progress edits.
  useEffect(() => {
    if (!entry) return;
    setName(entry.name || 'Bitmap Tile');
    setDraftPixels(clonePixelGrid(pixels, width, height));
    setIsPainting(false);
    setExtendedTile(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.id]);

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

  // In-memory palette asset exposing the room's current slots, so the extended editor
  // renders with the right colors when the world has no palette asset linked.
  const fallbackPaletteAsset = useMemo<ProjectAsset>(() => ({
    id: '__bitmap_room_screen_palette__',
    name: 'Paleta de la pantalla (temporal)',
    type: 'palette',
    data: { mode: 'SCREEN5', slots: slots.map(slot => ({ ...slot })) } as PaletteAsset,
  }), [slots]);

  if (!entry) return null;

  const openExtendedEditor = () => {
    const now = new Date().toISOString();
    setExtendedTile({
      id: `atlas_ext_${entry.id}`,
      name: name.trim() || entry.name,
      mode: 'SCREEN5_BITMAP',
      width,
      height,
      sourceType: 'manual-edit',
      paletteId: worldPaletteAsset?.id || fallbackPaletteAsset.id,
      pixelData: draftPixels.flatMap(row => row.map(value => Math.max(0, Math.min(15, Math.trunc(Number(value) || 0))))),
      collisionFlags: entry.collisionFlags,
      behaviorCode: entry.behaviorCode,
      createdAt: now,
      updatedAt: now,
    });
  };

  // "Volver al atlas": brings the extended draft back into this modal (cropping/padding
  // to the atlas entry size if a rotation changed the dimensions). Saving to the atlas
  // is still done here with "Guardar en atlas".
  const applyExtendedDraft = () => {
    if (!extendedTile) return;
    const extW = Math.max(1, Math.trunc(extendedTile.width) || width);
    const extH = Math.max(1, Math.trunc(extendedTile.height) || height);
    const next = Array.from({ length: height }, (_row, y) =>
      Array.from({ length: width }, (_col, x) => {
        const value = y < extH && x < extW ? Number(extendedTile.pixelData[y * extW + x]) || 0 : 0;
        return Math.max(0, Math.min(15, Math.trunc(value)));
      }));
    setDraftPixels(next);
    if (extendedTile.name.trim()) setName(extendedTile.name.trim());
    if (extW !== width || extH !== height) {
      setStatusBarMessage?.(`El tile extendido era ${extW}x${extH}; se ha ajustado a ${width}x${height} (tamaño del atlas).`);
    }
    setExtendedTile(null);
  };

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
      const offset = brushSize === 3 ? 1 : 0;
      for (let by = 0; by < brushSize; by++) {
        for (let bx = 0; bx < brushSize; bx++) {
          const px = x + bx - offset;
          const py = y + by - offset;
          if (px < 0 || py < 0 || px >= width || py >= height) continue;
          if (ditherMaskEnabled && ((px + py) & 1) !== 0) continue;
          next[py][px] = nextTool === 'erase' ? 0 : activeSlot;
        }
      }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 select-none" onMouseDown={event => event.stopPropagation()}>
      <div className="w-[min(92vw,760px)] max-h-[90vh] overflow-auto rounded border border-msx-highlight bg-msx-panelbg p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="pixel-font text-sm text-msx-highlight">SCREEN 5 Bitmap Tile Editor</div>
            <div className="text-[0.7rem] text-msx-textsecondary">{width}x{height} px · slot {activeSlot}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded border border-msx-highlight px-2 py-1 text-xs text-msx-highlight hover:bg-msx-highlight/20"
              title="Abrir este tile en el editor bitmap completo (rotación, espejo, mover patrón, biblioteca...). Al volver, guarda aquí con 'Guardar en atlas'."
              onClick={openExtendedEditor}
            >
              Extended
            </button>
            <button type="button" className="rounded border border-msx-border px-2 py-1 text-xs text-msx-textsecondary hover:border-msx-highlight" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <div className="overflow-auto rounded border border-msx-border bg-black p-3">
            <div
              className="grid mx-auto"
              onContextMenu={event => event.preventDefault()}
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
                    if (event.button !== 0 && event.button !== 2) return;
                    const nextTool = event.button === 2 ? 'erase' : tool;
                    setPaintingTool(nextTool);
                    setIsPainting(true);
                    applyAt(x, y, nextTool);
                  }}
                  onContextMenu={event => event.preventDefault()}
                  onMouseEnter={() => {
                    if (isPainting && paintingTool !== 'fill') applyAt(x, y, paintingTool);
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

            <div className="space-y-2">
              <div className="text-xs text-msx-highlight">Brocha</div>
              <div className="grid grid-cols-3 gap-1">
                {([1, 2, 3] as const).map(size => (
                  <button
                    key={size}
                    type="button"
                    className={`rounded border px-2 py-1 text-xs ${brushSize === size ? 'border-msx-highlight text-msx-highlight' : 'border-msx-border text-msx-textsecondary hover:border-msx-highlight'}`}
                    onClick={() => setBrushSize(size)}
                    title={`Grosor de brocha ${size}x${size}`}
                  >
                    {size}x{size}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={`w-full rounded border px-2 py-1 text-xs ${ditherMaskEnabled ? 'border-msx-highlight text-msx-highlight' : 'border-msx-border text-msx-textsecondary hover:border-msx-highlight'}`}
                onClick={() => setDitherMaskEnabled(value => !value)}
                title="Aplica una máscara alterna 010101 al pintar o borrar para hacer degradado/dither."
              >
                Degradado 010101
              </button>
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
                title="Crea un tile NUEVO en el atlas con este dibujo; el original no cambia. Ideal para variantes de autotile."
                onClick={() => onSaveAtlasCopy(name === entry?.name ? `${name}_var` : name, draftPixels)}
              >
                Duplicar en atlas (tile nuevo)
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

      {extendedTile && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-msx-bgcolor">
          <div className="flex items-center justify-between gap-3 border-b border-msx-border px-3 py-2">
            <div className="min-w-0">
              <div className="pixel-font text-sm text-msx-highlight truncate">Edición extendida — {extendedTile.name}</div>
              <div className="text-[0.7rem] text-msx-textsecondary">Tile del atlas "{entry.name}". Al volver, guarda con "Guardar en atlas".</div>
            </div>
            <button
              type="button"
              className="flex-shrink-0 rounded border border-msx-highlight px-3 py-1 text-xs text-msx-highlight hover:bg-msx-highlight/20"
              onClick={applyExtendedDraft}
            >
              Volver al atlas
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <Msx2BitmapTileEditor
              tileAsset={{ id: extendedTile.id, name: extendedTile.name, type: 'msx2bitmaptile', data: extendedTile }}
              allAssets={worldPaletteAsset ? allAssets : [...allAssets, fallbackPaletteAsset]}
              worldPaletteAsset={worldPaletteAsset}
              onUpdate={(data, newAssets) => {
                setExtendedTile(data);
                if (newAssets?.length) onAddAssets?.(newAssets);
              }}
              onSelectAsset={() => setStatusBarMessage?.('Vuelve al atlas y cierra el editor de tile para abrir otros assets.')}
              setStatusBarMessage={setStatusBarMessage}
            />
          </div>
        </div>
      )}
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
  /** Opens the delete confirmation on right-click for a non-current room. */
  onRequestDelete?: () => void;
  /** Whether this room is the world's start screen (renders a ★ badge). */
  isStart?: boolean;
}

/** Renders a downsampled thumbnail of a bitmap room's composed page for the world minimap. */
const RoomMinimapThumb: React.FC<RoomMinimapThumbProps> = ({ asset, isCurrent, paletteSlots, onOpen, onRequestDelete, isStart }) => {
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
  const deletable = !!onRequestDelete && !isCurrent;
  return (
    <div
      title={`${isStart ? '★ Inicio del mundo — ' : ''}${interactive ? `Editar "${asset.name}"` : asset.name}`}
      role={interactive ? 'button' : undefined}
      onClick={interactive ? onOpen : undefined}
      onContextMenu={event => {
        if (!deletable) return;
        event.preventDefault();
        event.stopPropagation();
        onRequestDelete?.();
      }}
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

export const Msx2BitmapScreenEditor: React.FC<Msx2BitmapScreenEditorProps> = ({ room, onUpdate, allAssets = [], setStatusBarMessage, onCreateAdjacentRoom, onOpenRoom, onDeleteRoom, onSetWorldStartRoom, onRecomposeWorld, msx2ProjectProfile = null, worldPaletteAssetId, onSetWorldPaletteAssetId, onUpdatePaletteAsset, onUpdateProjectAsset, onOpenHudAsset }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const autoTerrainRestoreRoomRef = useRef<string | null>(null);

  // World-minimap: pending "create screen at <dir>" inline confirm.
  const [pendingCreateDir, setPendingCreateDir] = useState<ConnectionDirection | null>(null);
  const [pendingDeleteRoom, setPendingDeleteRoom] = useState<{ assetId: string; name: string; connectionCount: number } | null>(null);
  const [copySharedEdgeTiles, setCopySharedEdgeTiles] = useState(true);

  // --- Local UI state ---
  const [tool, setTool] = useState<BrushTool>('brush');
  const [activeColor, setActiveColor] = useState(4);
  const [selectedAtlasEntryId, setSelectedAtlasEntryId] = useState(room.atlas?.entries?.[0]?.id || '');
  const [selectedStampId, setSelectedStampId] = useState('');
  const [preparedStamp, setPreparedStamp] = useState<{ stampId: string; atlasEntryIds: string[] } | null>(null);
  const [selectedTerrainId, setSelectedTerrainId] = useState('');
  const [isAutotileImportOpen, setIsAutotileImportOpen] = useState(false);
  const [selectedTerrainAssetId, setSelectedTerrainAssetId] = useState('');
  // Out-of-bounds neighbours count as terrain: borders render solid, continuing into the next room.
  const [terrainEdgesAsTerrain, setTerrainEdgesAsTerrain] = useState(true);
  const [pendingDeleteTerrainId, setPendingDeleteTerrainId] = useState<string | null>(null);
  // Variants editor: which mask is being edited (null = default to the terrain's centre mask)
  // and whether the add-variant atlas picker is open.
  const [variantMask, setVariantMask] = useState<number | null>(null);
  const [isVariantPickerOpen, setIsVariantPickerOpen] = useState(false);
  // Random-mix brush: Ctrl+click on atlas thumbs builds this list; painting rolls one of
  // these entries per cell (weighted by percent, equal split by default). Editor-local state.
  const [multiTileSelection, setMultiTileSelection] = useState<Array<{ entryId: string; percent: number }>>([]);
  const [isRandomMixOpen, setIsRandomMixOpen] = useState(false);
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
  const [patrolPointPicker, setPatrolPointPicker] = useState<{ entityId: string; point: PatrolPointKey } | null>(null);
  const [pendingDeletePlaced, setPendingDeletePlaced] = useState<{ kind: 'entity' | 'player'; id: string } | null>(null);
  const [pendingDeleteAtlasEntryIds, setPendingDeleteAtlasEntryIds] = useState<string[]>([]);
  const [editingAtlasEntryId, setEditingAtlasEntryId] = useState<string | null>(null);

  // collapsible panel toggles
  const [openTools, setOpenTools] = useState(true);
  const [openAtlas, setOpenAtlas] = useState(true);
  const [openAutotile, setOpenAutotile] = useState(true);
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
  const [openLighting, setOpenLighting] = useState(true);

  const hudAssets = useMemo(() => allAssets.filter(asset => asset.type === 'msx2hud'), [allAssets]);
  const hudAssetId = room.runtime?.hudAssetId;
  const linkedHudAsset = useMemo(
    () => hudAssets.find(asset => asset.id === hudAssetId),
    [hudAssets, hudAssetId],
  );
  const selectedHudAssetId = linkedHudAsset ? linkedHudAsset.id : '';

  const baseRuntime = () => ({
    screenKind: 'playable' as const,
    screenEngine: 'player' as const,
    activeAreaX: 0,
    activeAreaY: 0,
    activeAreaWidth: 256,
    activeAreaHeight: 192,
    ...room.runtime,
  });

  const withHudAssetId = (hudAssetIdValue: string | undefined) => ({
    ...baseRuntime(),
    hudAssetId: hudAssetIdValue,
  });

  // Dark room: the runtime dims the whole game band and only cuts a halo around
  // the player (and around each wall torch, with the Torch skill). Needs a
  // paired 8x2 palette — slots 8..15 must be the dimmed twins of 0..7.
  const isDarkRoom = String(room.runtime?.lighting || 'off').toLowerCase() === 'lamp';
  const handleToggleDarkRoom = () => {
    const next = !isDarkRoom;
    onUpdate({ runtime: { ...baseRuntime(), lighting: next ? 'lamp' : 'off' } });
    setStatusBarMessage?.(
      next
        ? 'SCREEN 5: sala OSCURA. La luz sale del jugador (y de las antorchas de pared).'
        : 'SCREEN 5: sala iluminada normal.'
    );
  };

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
  const autoTerrains = room.autoTerrains || [];
  const selectedTerrain = autoTerrains.find(terrain => terrain.id === selectedTerrainId) || null;
  const pendingDeleteAtlasEntryIdSet = new Set(pendingDeleteAtlasEntryIds);
  const pendingDeleteAtlasEntries = atlasEntries.filter(entry => pendingDeleteAtlasEntryIdSet.has(entry.id));
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
  const terrainAssets = useMemo(
    () => allAssets.filter(asset => asset.type === 'msx2bitmapterrain' && asset.data) as Array<ProjectAsset & { data: Msx2BitmapTerrainAsset }>,
    [allAssets],
  );
  const selectedStampEntry = stampEntries.find(entry => entry.id === selectedStampId) || null;
  const selectedStampAsset = selectedStampId
    ? allAssets.find(asset =>
      asset.type === 'msx2bitmapstamp'
      && (asset.id === selectedStampId || (asset.data as Msx2BitmapStampLibraryEntry | undefined)?.id === selectedStampId)
    ) || null
    : null;

  useEffect(() => {
    if (selectedTerrainAssetId && !terrainAssets.some(asset => asset.id === selectedTerrainAssetId)) {
      setSelectedTerrainAssetId('');
    }
  }, [selectedTerrainAssetId, terrainAssets]);

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
  const keyItems = useMemo<Msx2KeyItemDefinition[]>(
    () => (Array.isArray(room.keyItems) ? room.keyItems : []),
    [room.keyItems],
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
  const bossLibraryAssets = useMemo(
    () => allAssets.filter(asset => asset.type === 'msx2boss'),
    [allAssets],
  );
  // MSX2 sprite assets, for binding a hardware sprite to placed entities that
  // are not enemy-library instances (e.g. moving platforms).
  const spriteLibraryAssets = useMemo(
    () => allAssets.filter(asset => asset.type === 'msx2sprite'),
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
  const currentWorldGraph = useMemo(() => {
    const worldmapAsset = allAssets.find(asset =>
      asset.type === 'worldmap'
      && (asset.data as WorldMapGraph | undefined)?.nodes?.some(node => node.screenAssetId === room.id),
    );
    return (worldmapAsset?.data as WorldMapGraph | undefined) || null;
  }, [allAssets, room.id]);
  const requestDeleteRoom = (asset: ProjectAsset) => {
    if (!onDeleteRoom || asset.id === room.id) return;
    const nodeIds = new Set(
      (currentWorldGraph?.nodes || [])
        .filter(node => node.screenAssetId === asset.id)
        .map(node => node.id),
    );
    const connectionCount = (currentWorldGraph?.connections || []).filter(connection => (
      nodeIds.has(connection.fromNodeId) || nodeIds.has(connection.toNodeId)
    )).length;
    setPendingDeleteRoom({ assetId: asset.id, name: asset.name, connectionCount });
  };
  const selectedPlacedEntity = useMemo(
    () => selectedPlacedId ? placedEntities.find(entity => entity.id === selectedPlacedId) || null : null,
    [placedEntities, selectedPlacedId],
  );
  const isSelectedCarryable = Boolean(selectedPlacedEntity && (
    selectedPlacedEntity.components?.msx2_carryable?.enabled !== false
    && selectedPlacedEntity.components?.msx2_carryable?.enabled !== 'false'
    && (
      selectedPlacedEntity.components?.msx2_carryable
      || selectedPlacedEntity.params?.carryable === true
      || selectedPlacedEntity.params?.carryable === 'true'
      || selectedPlacedEntity.kind === 'carryable'
    )
  ));
  const carryableBitmapEntries = useMemo(
    () => (room.atlas?.entries || []).filter(entry => Number(entry.w) >= 16 && Number(entry.h) >= 16),
    [room.atlas?.entries],
  );
  const selectedCarryableRenderMode = String(selectedPlacedEntity?.params?.carryableRenderMode || '').toLowerCase() === 'bitmap_sprite'
    || String(selectedPlacedEntity?.params?.carryableRenderMode || '').toLowerCase() === 'bitmap'
    ? 'bitmap_sprite'
    : 'hardware_sprite';
  const selectedCarryableBitmapEntryId = String(
    selectedPlacedEntity?.params?.carryableBitmapAtlasEntryId
      || selectedPlacedEntity?.params?.bitmapSpriteAtlasEntryId
      || '',
  ).trim();
  const carryableBitmapOptions = selectedCarryableBitmapEntryId
    && !carryableBitmapEntries.some(entry => entry.id === selectedCarryableBitmapEntryId)
    ? [{ id: selectedCarryableBitmapEntryId, name: `${selectedCarryableBitmapEntryId} (current)` } as Msx2BitmapRoomAtlasEntry, ...carryableBitmapEntries]
    : carryableBitmapEntries;
  const mushroomBitmapEntries = useMemo(
    () => (room.atlas?.entries || []).filter(entry => Number(entry.w) >= GRID && Number(entry.h) >= GRID),
    [room.atlas?.entries],
  );
  const selectedMushroomBitmapEntryId = String(
    selectedPlacedEntity?.params?.glowMushroomAtlasEntryId || '',
  ).trim();
  const mushroomBitmapOptions = selectedMushroomBitmapEntryId
    && !mushroomBitmapEntries.some(entry => entry.id === selectedMushroomBitmapEntryId)
    ? [{ id: selectedMushroomBitmapEntryId, name: `${selectedMushroomBitmapEntryId} (current)` } as Msx2BitmapRoomAtlasEntry, ...mushroomBitmapEntries]
    : mushroomBitmapEntries;
  const getEntityMovementMode = (entity: Msx2Screen4EntityInstance | null | undefined): string =>
    String(entity?.components?.msx2_movement?.mode ?? entity?.params?.movement ?? entity?.params?.movementMode ?? 'static');

  const getPatrolPixelBounds = (entity: Msx2Screen4EntityInstance) => {
    const params = entity.params || {};
    const usesPixels = String(entity.components?.msx2_movement?.boundsUnit ?? params.boundsUnit ?? '')
      .replace(/[\s_-]+/g, '')
      .toLowerCase() === 'px';
    const baseX = clampScreenPixelX((entity.position?.x ?? 0) * GRID);
    const baseY = clampScreenPixelY((entity.position?.y ?? 0) * GRID, roomHeight);
    const readBound = (key: 'minX' | 'maxX' | 'minY' | 'maxY', fallbackPx: number, maxTile: number, clamp: (value: unknown) => number) => {
      const raw = entity.components?.msx2_movement?.[key] ?? params[key];
      if (raw === undefined || raw === null || raw === '') return clamp(fallbackPx);
      const numeric = Number(raw);
      if (!Number.isFinite(numeric)) return clamp(fallbackPx);
      return usesPixels ? clamp(numeric) : clamp(clampInt(numeric, 0, maxTile, 0) * GRID);
    };
    return {
      minX: readBound('minX', baseX, gridWidth - 1, clampScreenPixelX),
      maxX: readBound('maxX', Math.min(SCREEN_W - GRID, baseX + GRID * 4), gridWidth - 1, clampScreenPixelX),
      minY: readBound('minY', baseY, gridHeight - 1, value => clampScreenPixelY(value, roomHeight)),
      maxY: readBound('maxY', baseY, gridHeight - 1, value => clampScreenPixelY(value, roomHeight)),
    };
  };

  const selectedPatrolBounds = selectedPlacedEntity ? getPatrolPixelBounds(selectedPlacedEntity) : null;
  const selectedMovementMode = getEntityMovementMode(selectedPlacedEntity);
  const selectedIsWorldExit = isWorldExitEntity(selectedPlacedEntity);
  const selectedWorldExitConfig = selectedIsWorldExit
    ? normalizeWorldExitConfig(selectedPlacedEntity?.params?.worldExit || selectedPlacedEntity?.components?.msx2_world_exit)
    : null;
  const selectedDoorConfig = selectedPlacedEntity?.kind === 'door' && !selectedIsWorldExit
    ? normalizeLockedDoorConfig(selectedPlacedEntity.params?.lockedDoor)
    : null;
  const selectedPressureButtonConfig = selectedPlacedEntity
    ? normalizePressureButtonConfig(selectedPlacedEntity.params?.pressureButton || selectedPlacedEntity.components?.msx2_pressure_button)
    : null;
  const selectedJumperConfig = selectedPlacedEntity && isJumperEntity(selectedPlacedEntity)
    ? normalizeJumperConfig(selectedPlacedEntity.params?.jumper || selectedPlacedEntity.components?.msx2_jumper)
    : null;
  const selectedWallJumperConfig = selectedPlacedEntity && isWallJumperEntity(selectedPlacedEntity)
    ? normalizeWallJumperConfig(selectedPlacedEntity.params?.wallJumper || selectedPlacedEntity.components?.msx2_wall_jumper)
    : null;
  const pressureButtonTargetDoors = placedEntities.filter(entity => entity.kind === 'door' && !isWorldExitEntity(entity));
  const selectedDoorTargetRoom = selectedDoorConfig?.targetRoomId
    ? bitmapRooms.find(asset => asset.id === selectedDoorConfig.targetRoomId) || null
    : null;
  const selectedDoorTargetEntries = normalizeMsx2PlayerEntries((selectedDoorTargetRoom?.data as Msx2Screen5BitmapRoom | undefined)?.playerEntries);

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
    // Collision overlay: tint cells whose stored flags are non-zero when the layer is
    // visible. Cells carrying an 8x8 sub-cell shape only tint their solid quadrants,
    // so a half-height ledge reads as half a cell on the canvas.
    const drawOverlay = (grid: number[][] | undefined, tint: string, shapeGrid?: number[][]) => {
      const half = (COLLISION_CELL / 2) * zoom;
      for (let cy = 0; cy < collisionRows; cy++) {
        for (let cx = 0; cx < collisionCols; cx++) {
          if ((grid?.[cy]?.[cx] ?? 0) === 0) continue;
          ctx.fillStyle = tint;
          const px = cx * COLLISION_CELL * zoom;
          const py = cy * COLLISION_CELL * zoom;
          const shape = (shapeGrid?.[cy]?.[cx] ?? 0) & SHAPE_FULL;
          if (shape === 0 || shape === SHAPE_FULL) {
            ctx.fillRect(px, py, COLLISION_CELL * zoom, COLLISION_CELL * zoom);
            continue;
          }
          if (shape & SHAPE_BIT.tl) ctx.fillRect(px, py, half, half);
          if (shape & SHAPE_BIT.tr) ctx.fillRect(px + half, py, half, half);
          if (shape & SHAPE_BIT.bl) ctx.fillRect(px, py + half, half, half);
          if (shape & SHAPE_BIT.br) ctx.fillRect(px + half, py + half, half, half);
        }
      }
    };
    if (layerVisible.collision) drawOverlay(room.collision, 'rgba(255,64,64,0.32)', room.collisionShape);

    // Entities layer: render placed entities/enemies/objects and player spawns as 16px markers
    // (a coloured cell tint + a 1-char label). These live in room.entities / room.playerEntries,
    // completely separate from the tile composition, so painting tiles never clobbers them.
    if (layerVisible.objects || activeLayer === 'objects') {
      const cell = GRID * zoom;
      const resolveEntitySprite = (entity: Msx2Screen4EntityInstance): Msx2Sprite | undefined => {
        const directSpriteId = String(
          entity.spriteAssetId ||
          entity.components?.msx2_hardware_sprite?.msx2SpriteAssetId ||
          ''
        ).trim();
        const enemyAssetId = String(entity.params?.enemyAssetId || '').trim();
        const enemySpriteId = enemyAssetId
          ? String((allAssets.find(asset => asset.id === enemyAssetId && asset.type === 'msx2enemy')?.data as any)?.render?.spriteId || '').trim()
          : '';
        const spriteId = directSpriteId || enemySpriteId;
        if (!spriteId) return undefined;
        return allAssets.find(asset => asset.id === spriteId && asset.type === 'msx2sprite')?.data as Msx2Sprite | undefined;
      };
      const drawMsx2Sprite = (sprite: Msx2Sprite, pixelX: number, pixelY: number): boolean => {
        const frame = sprite.frames?.[sprite.currentFrameIndex ?? 0] || sprite.frames?.[0];
        if (!frame?.data?.length) return false;
        const bg = sprite.backgroundColor;
        const px = pixelX * zoom;
        const py = pixelY * zoom;
        frame.data.forEach((row, y) => row.forEach((color, x) => {
          if (!color || color === bg || color === 'rgba(0,0,0,0)' || color === 'transparent') return;
          ctx.fillStyle = color;
          ctx.fillRect(px + x * zoom, py + y * zoom, zoom, zoom);
        }));
        return true;
      };
      const drawAtlasEntry = (entryId: string, pixelX: number, pixelY: number): boolean => {
        const entry = atlasEntries.find(item => item.id === entryId);
        if (!entry) return false;
        const width = Math.min(GRID, Math.max(0, Number(entry.w) || 0));
        const height = Math.min(GRID, Math.max(0, Number(entry.h) || 0));
        if (!width || !height) return false;
        const sx = Math.max(0, Math.trunc(Number(entry.sx) || 0));
        const sy = Math.max(0, Math.trunc(Number(entry.sy) || 0));
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const slot = atlasPixels[sy + y]?.[sx + x] ?? 0;
            const hex = slot === 0 ? backdropHex : (slots[slot]?.hex || FALLBACK_HEX);
            ctx.fillStyle = hex === 'rgba(0,0,0,0)' ? FALLBACK_HEX : hex;
            ctx.fillRect((pixelX + x) * zoom, (pixelY + y) * zoom, zoom, zoom);
          }
        }
        return true;
      };
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
        if (selectedPlacedId === entity.id) {
          const movement = getEntityMovementMode(entity).replace(/[\s_-]+/g, '').toLowerCase();
          const hasStoredBounds = ['minX', 'maxX', 'minY', 'maxY'].some(key =>
            entity.params?.[key] !== undefined || entity.components?.msx2_movement?.[key] !== undefined
          );
          if (hasStoredBounds || movement.includes('patrol') || movement.includes('flyer') || movement.includes('walker') || movement.includes('chase') || movement.includes('ball')) {
            const bounds = getPatrolPixelBounds(entity);
            const startX = bounds.minX * zoom;
            const startY = bounds.minY * zoom;
            const endX = bounds.maxX * zoom;
            const endY = bounds.maxY * zoom;
            ctx.save();
            ctx.strokeStyle = '#00E0FF';
            ctx.fillStyle = '#00E0FF';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(startX + cell / 2, startY + cell / 2);
            ctx.lineTo(endX + cell / 2, endY + cell / 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillRect(startX + cell / 2 - 3, startY + cell / 2 - 3, 6, 6);
            ctx.fillRect(endX + cell / 2 - 3, endY + cell / 2 - 3, 6, 6);
            ctx.restore();
          }
        }
        const isEnemy = entity.kind === 'enemy';
        const isBoss = entity.kind === 'boss';
        const isPlatform = entity.kind === 'platform';
        const isShaft = entity.kind === 'platform_shaft';
        const isJumper = isJumperEntity(entity);
        const isWallJumper = isWallJumperEntity(entity);
        const isWorldExit = isWorldExitEntity(entity);
        const wallJumperDir = isWallJumper ? normalizeWallJumperConfig(entity.params?.wallJumper || entity.components?.msx2_wall_jumper).direction : 'right';
        const fill = isEnemy ? 'rgba(255,96,96,0.45)' : isBoss ? 'rgba(255,200,0,0.45)' : isWorldExit ? 'rgba(0,255,176,0.5)' : entity.kind === 'collectible' ? 'rgba(96,255,160,0.45)' : entity.kind === 'npc' ? 'rgba(255,180,80,0.45)' : entity.kind === 'hidden_obj' ? 'rgba(180,255,120,0.35)' : entity.kind === 'mushroom' ? 'rgba(160,255,208,0.45)' : isShaft ? 'rgba(255,160,64,0.45)' : isPlatform ? 'rgba(186,120,255,0.45)' : isJumper ? 'rgba(80,255,220,0.45)' : isWallJumper ? 'rgba(255,140,200,0.45)' : 'rgba(64,160,255,0.45)';
        const stroke = isEnemy ? '#FF6060' : isBoss ? '#FFC800' : isWorldExit ? '#00FFB0' : entity.kind === 'npc' ? '#FFB450' : entity.kind === 'hidden_obj' ? '#A0E060' : entity.kind === 'mushroom' ? '#A0FFD0' : isShaft ? '#FFA040' : isPlatform ? '#BA78FF' : isJumper ? '#50FFDC' : isWallJumper ? '#FF8CC8' : '#40A0FF';
        const isHeal = entity.kind === 'collectible' && !entity.params?.keyPickupId && !!entity.params?.healAtlasEntryId;
        const isGem = entity.kind === 'collectible' && !entity.params?.keyPickupId && !isHeal && !!entity.params?.gemAtlasEntryId;
        const label = isEnemy ? 'E' : isBoss ? 'B' : isWorldExit ? 'X' : isHeal ? '♥' : isGem ? 'G' : entity.kind === 'collectible' ? 'C' : entity.kind === 'hazard' ? 'H' : entity.kind === 'door' ? 'D' : entity.kind === 'npc' ? 'N' : entity.kind === 'hidden_obj' ? '?' : entity.kind === 'mushroom' ? '☘' : isShaft ? '↕' : isPlatform ? '=' : isJumper ? 'S' : isWallJumper ? (wallJumperDir === 'right' ? '▶' : '◀') : '◆';
        const sprite = (isEnemy || isPlatform) ? resolveEntitySprite(entity) : undefined;
        const mushroomAtlasEntryId = entity.kind === 'mushroom'
          ? String(entity.params?.glowMushroomAtlasEntryId || '').trim()
          : '';
        const worldExitAtlasEntryId = isWorldExit
          ? String(normalizeWorldExitConfig(entity.params?.worldExit || entity.components?.msx2_world_exit).atlasEntryId || '').trim()
          : '';
        const healAtlasEntryId = isHeal ? String(entity.params?.healAtlasEntryId || '').trim() : '';
        const renderedVisual = (worldExitAtlasEntryId && drawAtlasEntry(worldExitAtlasEntryId, cx * GRID, cy * GRID))
          || (mushroomAtlasEntryId && drawAtlasEntry(mushroomAtlasEntryId, cx * GRID, cy * GRID))
          || (healAtlasEntryId && drawAtlasEntry(healAtlasEntryId, cx * GRID, cy * GRID))
          || (sprite && drawMsx2Sprite(sprite, cx * GRID, cy * GRID));
        if (renderedVisual) {
          if (selectedPlacedId === entity.id) {
            ctx.strokeStyle = '#FFD24A';
            ctx.lineWidth = 2;
            ctx.strokeRect(cx * GRID * zoom + 1, cy * GRID * zoom + 1, cell - 2, cell - 2);
            ctx.lineWidth = 1;
          }
        } else {
          drawMarker(cx, cy, fill, stroke, label, selectedPlacedId === entity.id);
        }
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
  }, [backgroundColor, backdropHex, composedPixels, showGrid, slots, zoom, roomHeight, selectedCell, layerVisible, room.collision, room.collisionShape, room.behavior, room.atlas?.entries, atlasPixels, collisionCols, collisionRows, activeLayer, placedEntities, playerEntries, selectedPlacedId, foregroundTiles, allAssets]);

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
    nextCollisionShape?: number[][],
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
      ...(nextCollisionShape ? { collisionShape: nextCollisionShape } : {}),
    });
  };

  // Ensure room.collisionShape exists; return it or a lazily-allocated empty grid.
  const ensureCollisionShape = (): number[][] => {
    if (room.collisionShape) return room.collisionShape;
    return Array.from({ length: collisionRows }, () => Array.from({ length: collisionCols }, () => 0));
  };

  const getAtlasEntriesUsageCount = (entries: Msx2BitmapRoomAtlasEntry[]): number => {
    const tileValues = new Set(entries
      .map(entry => atlasEntries.findIndex(item => item.id === entry.id))
      .filter(index => index >= 0)
      .map(index => index + 1));
    if (tileValues.size === 0) return 0;
    return tileGrid.reduce((sum, row) => sum + row.filter(value => tileValues.has(value)).length, 0);
  };

  const confirmDeleteAtlasEntries = () => {
    const deleteIds = new Set(pendingDeleteAtlasEntryIds);
    const deleteEntries = atlasEntries.filter(entry => deleteIds.has(entry.id));
    if (deleteEntries.length === 0) {
      setPendingDeleteAtlasEntryIds([]);
      return;
    }

    const firstDeleteIndex = atlasEntries.findIndex(item => deleteIds.has(item.id));
    const nextEntries = atlasEntries.filter(item => !deleteIds.has(item.id));
    const nextValueByEntryId = new Map(nextEntries.map((entry, index) => [entry.id, index + 1]));
    let clearedCells = 0;
    let nextCollision = room.collision;
    let nextBehavior = room.behavior;
    const nextGrid = tileGrid.map((row, y) => row.map((value, x) => {
      const oldEntry = value > 0 ? atlasEntries[value - 1] : null;
      if (!oldEntry) return 0;
      if (deleteIds.has(oldEntry.id)) {
        clearedCells += 1;
        nextCollision = writeCell(nextCollision, x, y, 0, collisionCols, collisionRows);
        nextBehavior = writeCell(nextBehavior, x, y, 0, collisionCols, collisionRows);
        return 0;
      }
      return nextValueByEntryId.get(oldEntry.id) || 0;
    }));
    const nextPixels = atlasPixels.map(row => [...row]);
    for (const entry of deleteEntries) {
      const sx = Math.max(0, Math.trunc(entry.sx || 0));
      const sy = Math.max(0, Math.trunc(entry.sy || 0));
      const w = Math.max(1, Math.trunc(entry.w || GRID));
      const h = Math.max(1, Math.trunc(entry.h || GRID));
      for (let y = sy; y < Math.min(nextPixels.length, sy + h); y++) {
        for (let x = sx; x < Math.min(atlasWidth, sx + w); x++) {
          nextPixels[y][x] = 0;
        }
      }
    }

    const nonCopy = (room.composition?.commands || []).filter(command => command.op !== 'copy');
    const tileCmds = buildCopyCommandsFromGrid(nextGrid, nextEntries);
    const fallbackSelection = nextEntries[firstDeleteIndex]?.id || nextEntries[firstDeleteIndex - 1]?.id || '';
    // Autotile mappings pointing at the deleted entry are dropped (empty terrains removed).
    const nextTerrains = pruneTerrainsForEntries(room.autoTerrains, nextEntries);
    onUpdate({
      ...(nextTerrains !== room.autoTerrains ? { autoTerrains: nextTerrains || [] } : {}),
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
    setPendingDeleteAtlasEntryIds([]);
    if (selectedAtlasEntryId && deleteIds.has(selectedAtlasEntryId)) {
      setSelectedAtlasEntryId(fallbackSelection);
    }
    setMultiTileSelection(current => current.filter(item => !deleteIds.has(item.entryId)));
    setStatusBarMessage?.(deleteEntries.length === 1
      ? `SCREEN 5: tile "${deleteEntries[0].name}" eliminado del atlas (${clearedCells} celdas limpiadas).`
      : `SCREEN 5: ${deleteEntries.length} tiles eliminados del atlas (${clearedCells} celdas limpiadas).`);
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
    setPatrolPointPicker(null);
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
      setStatusBarMessage?.('SCREEN 5: selecciona Player, entidad, enemigo o boss antes de colocar.');
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
    if (placeable.kind === 'boss') {
      const bossAsset = bossLibraryAssets.find(asset => asset.id === placeable.id);
      if (!bossAsset) {
        setStatusBarMessage?.('SCREEN 5: selecciona un boss de la biblioteca primero.');
        return;
      }
      const bossEntity = buildMsx2BossEntityFromAsset(bossAsset, cellX, cellY);
      onUpdate({ entities: [...placedEntities, bossEntity] });
      setSelectedPlacedId(bossEntity.id);
      setStatusBarMessage?.(`SCREEN 5: boss "${bossEntity.name}" colocado en (${cellX}, ${cellY}).`);
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

  const addKeyItemDefinition = () => {
    const usedIds = new Set(keyItems.map(item => item.id));
    const ordinal = keyItems.length + 1;
    let id = sanitizeKeyItemId(`key_${ordinal}`);
    let suffix = ordinal;
    while (usedIds.has(id)) {
      suffix += 1;
      id = sanitizeKeyItemId(`key_${suffix}`);
    }
    const usedBits = new Set(keyItems.map(item => clampInt(Number(item.bitIndex), 0, 7, 0)));
    const bitIndex = Array.from({ length: 8 }, (_unused, i) => i).find(i => !usedBits.has(i)) ?? 0;
    const next: Msx2KeyItemDefinition = {
      id,
      name: `Key ${ordinal}`,
      bitIndex,
      color: 14,
      persistent: true,
    };
    onUpdate({ keyItems: [...keyItems, next] });
    setStatusBarMessage?.(`SCREEN 5: llave "${next.name}" creada en bit ${bitIndex}.`);
  };

  const updateKeyItemDefinition = (id: string, patch: Partial<Msx2KeyItemDefinition>) => {
    onUpdate({
      keyItems: keyItems.map(item => item.id === id
        ? {
            ...item,
            ...patch,
            bitIndex: patch.bitIndex !== undefined ? clampInt(Number(patch.bitIndex), 0, 7, item.bitIndex) : item.bitIndex,
            color: patch.color !== undefined ? clampInt(Number(patch.color), 0, 15, item.color ?? 14) : item.color,
          }
        : item),
    });
  };

  const deleteKeyItemDefinition = (id: string) => {
    const nextEntities = placedEntities.map(entity => {
      const params = { ...(entity.params || {}) };
      if (params.keyPickupId === id) {
        delete params.keyPickupId;
      }
      const door = normalizeLockedDoorConfig(params.lockedDoor);
      if (door.requiredKeyId === id) {
        params.lockedDoor = { ...door, requiredKeyId: '' };
      }
      return { ...entity, params };
    });
    onUpdate({
      keyItems: keyItems.filter(item => item.id !== id),
      entities: nextEntities,
    });
    setStatusBarMessage?.('SCREEN 5: llave eliminada y referencias limpiadas.');
  };

  const updatePlacedEntityHardwareSprite = (id: string, spriteAssetId: string) => {
    onUpdate({
      entities: placedEntities.map(entity =>
        entity.id === id
          ? {
              ...entity,
              components: {
                ...(entity.components || {}),
                msx2_hardware_sprite: {
                  ...(entity.components?.msx2_hardware_sprite || {}),
                  msx2SpriteAssetId: spriteAssetId,
                },
              },
            }
          : entity
      ),
    });
  };

  const updatePlacedEntityCarryableVisual = (
    id: string,
    renderMode: 'hardware_sprite' | 'bitmap_sprite',
    patch: { spriteAssetId?: string; bitmapAtlasEntryId?: string } = {},
  ) => {
    onUpdate({
      entities: placedEntities.map(entity => {
        if (entity.id !== id) return entity;
        const nextParams = {
          ...(entity.params || {}),
          carryableRenderMode: renderMode,
          ...(patch.bitmapAtlasEntryId !== undefined
            ? { carryableBitmapAtlasEntryId: patch.bitmapAtlasEntryId }
            : {}),
        };
        const nextComponents = patch.spriteAssetId === undefined
          ? entity.components
          : {
              ...(entity.components || {}),
              msx2_hardware_sprite: {
                ...(entity.components?.msx2_hardware_sprite || {}),
                msx2SpriteAssetId: patch.spriteAssetId,
              },
            };
        return { ...entity, params: nextParams, components: nextComponents };
      }),
    });
  };

  const updatePlacedEntityParams = (id: string, patch: Record<string, unknown>) => {
    onUpdate({
      entities: placedEntities.map(entity =>
        entity.id === id
          ? { ...entity, params: { ...(entity.params || {}), ...patch } }
          : entity
      ),
    });
  };

  // Multi-screen shaft: everything lives in msx2_platform_shaft. The cabin is a
  // single object spanning several rooms, so its travel is authored as
  // (screen slot, Y in that screen) pairs -- see msx2BitmapShaftGenerator for why
  // a global 16-bit Y is not what reaches the ROM.
  const updatePlacedEntityShaft = (id: string, patch: Record<string, unknown>) => {
    onUpdate({
      entities: placedEntities.map(entity =>
        entity.id === id
          ? {
              ...entity,
              components: {
                ...(entity.components || {}),
                msx2_platform_shaft: {
                  ...(entity.components?.msx2_platform_shaft || {}),
                  ...patch,
                },
              },
            }
          : entity
      ),
    });
  };

  const updatePlacedEntityMovement = (id: string, patch: Record<string, unknown>) => {
    const movementPatch: Record<string, unknown> = {};
    if (patch.movement !== undefined) movementPatch.mode = patch.movement;
    ['boundsUnit', 'minX', 'maxX', 'minY', 'maxY', 'direction', 'speed', 'travelPx', 'respawnSeconds', 'turnPx'].forEach(key => {
      if (patch[key] !== undefined) movementPatch[key] = patch[key];
    });

    onUpdate({
      entities: placedEntities.map(entity =>
        entity.id === id
          ? {
              ...entity,
              params: { ...(entity.params || {}), ...patch },
              components: {
                ...(entity.components || {}),
                msx2_movement: {
                  ...(entity.components?.msx2_movement || {}),
                  ...movementPatch,
                },
              },
            }
          : entity
      ),
    });
  };

  const updatePlacedEntityPatrolPoint = (id: string, point: PatrolPointKey, pixelX: number, pixelY: number) => {
    const entity = placedEntities.find(item => item.id === id);
    if (!entity) return;
    const bounds = getPatrolPixelBounds(entity);
    updatePlacedEntityMovement(id, {
      boundsUnit: 'px',
      minX: point === 'start' ? clampScreenPixelX(pixelX) : bounds.minX,
      minY: point === 'start' ? clampScreenPixelY(pixelY, roomHeight) : bounds.minY,
      maxX: point === 'end' ? clampScreenPixelX(pixelX) : bounds.maxX,
      maxY: point === 'end' ? clampScreenPixelY(pixelY, roomHeight) : bounds.maxY,
    });
  };

  const updateLockedDoorConfig = (id: string, patch: Partial<Msx2LockedDoorConfig>) => {
    const entity = placedEntities.find(item => item.id === id);
    const current = normalizeLockedDoorConfig(entity?.params?.lockedDoor);
    updatePlacedEntityParams(id, { lockedDoor: { ...current, ...patch } });
  };

  const updateWorldExitConfig = (id: string, patch: Partial<Msx2WorldExitConfig>) => {
    const entity = placedEntities.find(item => item.id === id);
    const current = normalizeWorldExitConfig(entity?.params?.worldExit || entity?.components?.msx2_world_exit);
    updatePlacedEntityParams(id, { worldExit: { ...current, ...patch } });
  };

  const updatePressureButtonConfig = (id: string, patch: Partial<Msx2PressureButtonConfig>) => {
    const entity = placedEntities.find(item => item.id === id);
    const current = normalizePressureButtonConfig(entity?.params?.pressureButton || entity?.components?.msx2_pressure_button);
    const next = { ...current, ...patch };
    onUpdate({
      entities: placedEntities.map(item =>
        item.id === id
          ? {
              ...item,
              params: { ...(item.params || {}), engine: item.params?.engine || 'pressureButton', pressureButton: next },
              components: { ...(item.components || {}), msx2_pressure_button: next },
            }
          : item
      ),
    });
  };

  const updateJumperConfig = (id: string, patch: Partial<Msx2JumperConfig>) => {
    const entity = placedEntities.find(item => item.id === id);
    const current = normalizeJumperConfig(entity?.params?.jumper || entity?.components?.msx2_jumper);
    const next = { ...current, ...patch };
    onUpdate({
      entities: placedEntities.map(item =>
        item.id === id
          ? {
              ...item,
              params: { ...(item.params || {}), engine: item.params?.engine || 'jumper', jumper: next },
              components: { ...(item.components || {}), msx2_jumper: next },
            }
          : item
      ),
    });
  };

  const updateWallJumperConfig = (id: string, patch: Partial<Msx2WallJumperConfig>) => {
    const entity = placedEntities.find(item => item.id === id);
    const current = normalizeWallJumperConfig(entity?.params?.wallJumper || entity?.components?.msx2_wall_jumper);
    const next = { ...current, ...patch };
    onUpdate({
      entities: placedEntities.map(item =>
        item.id === id
          ? {
              ...item,
              params: { ...(item.params || {}), engine: item.params?.engine || 'wallJumper', wallJumper: next },
              components: { ...(item.components || {}), msx2_wall_jumper: next },
            }
          : item
      ),
    });
  };

  const buildDoorStampAtlasEntry = (
    stampEntry: Msx2BitmapStampLibraryEntry,
    existingEntryId?: string,
  ): { atlas: NonNullable<Msx2Screen5BitmapRoom['atlas']>; entry: Msx2BitmapRoomAtlasEntry } => {
    const stampPixels = bitmapStampToPixelGrid(stampEntry.stamp);
    const stampHeight = Math.max(1, stampPixels.length);
    const stampWidth = Math.max(1, stampPixels[0]?.length || stampEntry.stamp.columns * stampEntry.stamp.tileWidth || GRID);
    const existingEntries = atlasEntries.map(entry => ({ ...entry }));
    const existingIndex = existingEntryId ? existingEntries.findIndex(entry => entry.id === existingEntryId) : -1;
    const reusableIndex = existingIndex >= 0
      && existingEntries[existingIndex].w === stampWidth
      && existingEntries[existingIndex].h === stampHeight
      ? existingIndex
      : -1;
    const sx = reusableIndex >= 0 ? Math.max(0, existingEntries[reusableIndex].sx || 0) : 0;
    const width = Math.min(SCREEN_W, Math.max(GRID, atlasWidth, sx + stampWidth));
    const baseHeight = Math.max(atlasHeight, atlasPixels.length);
    const sy = reusableIndex >= 0
      ? Math.max(0, existingEntries[reusableIndex].sy || 0)
      : Math.ceil(existingEntries.reduce((max, entry) => Math.max(max, (entry.sy || 0) + (entry.h || 0)), 0) / GRID) * GRID;
    const height = Math.max(baseHeight, sy + stampHeight);
    const pixels = Array.from({ length: height }, (_row, y) =>
      Array.from({ length: width }, (_col, x) => clampByte(atlasPixels[y]?.[x] ?? 0, 0) & 0x0f)
    );
    for (let y = 0; y < stampHeight; y++) {
      for (let x = 0; x < Math.min(stampWidth, width - sx); x++) {
        pixels[sy + y][sx + x] = clampByte(stampPixels[y]?.[x] ?? 0, 0) & 0x0f;
      }
    }
    const entry: Msx2BitmapRoomAtlasEntry = {
      id: reusableIndex >= 0
        ? existingEntries[reusableIndex].id
        : `door_metatile_${slugifyIdPart(stampEntry.id)}_${Date.now()}`,
      name: `Door ${stampEntry.name}`,
      sx,
      sy,
      w: Math.min(stampWidth, width - sx),
      h: stampHeight,
    };
    const entries = reusableIndex >= 0
      ? existingEntries.map((item, index) => index === reusableIndex ? entry : item)
      : [...existingEntries, entry];
    return {
      atlas: {
        width,
        height,
        offscreenBaseY: room.atlas?.offscreenBaseY || 320,
        pixels,
        entries,
      },
      entry,
    };
  };

  const selectDoorMetatile = (
    entityId: string,
    field: 'closedAtlasEntryId' | 'openAtlasEntryId',
    value: string,
  ) => {
    if (!value) {
      updateLockedDoorConfig(entityId, { [field]: '' });
      return;
    }
    if (value.startsWith('atlas:')) {
      updateLockedDoorConfig(entityId, { [field]: value.slice('atlas:'.length) });
      return;
    }
    if (!value.startsWith('stamp:')) return;
    const stampId = value.slice('stamp:'.length);
    const stampEntry = stampEntries.find(entry => entry.id === stampId);
    const entity = placedEntities.find(item => item.id === entityId);
    if (!stampEntry || !entity) return;
    const currentDoor = normalizeLockedDoorConfig(entity.params?.lockedDoor);
    const shouldAdaptPalette = !areScreen5PalettesEquivalent(slots, stampEntry.palette);
    const sourceStamp = shouldAdaptPalette ? adaptStampEntryToPalette(stampEntry, slots) : stampEntry;
    const currentEntryId = field === 'closedAtlasEntryId' ? currentDoor.closedAtlasEntryId : currentDoor.openAtlasEntryId;
    const { atlas, entry } = buildDoorStampAtlasEntry(sourceStamp, currentEntryId);
    const nextDoor = { ...currentDoor, [field]: entry.id };
    onUpdate({
      atlas,
      entities: placedEntities.map(item =>
        item.id === entityId
          ? { ...item, params: { ...(item.params || {}), lockedDoor: nextDoor } }
          : item
      ),
    });
    setSelectedAtlasEntryId(entry.id);
    setStatusBarMessage?.(`Metatile "${stampEntry.name}" asignado a la puerta (${field === 'closedAtlasEntryId' ? 'cerrado' : 'abierto'}).`);
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
      setSelectedTerrainId('');
      setMultiTileSelection([]);
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
    setSelectedTerrainId('');
    setMultiTileSelection([]);
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
    setSelectedTerrainId('');
    setMultiTileSelection([]);
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

  // Immutable update of one terrain inside room.autoTerrains.
  const updateTerrain = (terrainId: string, mutate: (terrain: Msx2BitmapAutoTerrain) => Msx2BitmapAutoTerrain) => {
    onUpdate({ autoTerrains: autoTerrains.map(terrain => terrain.id === terrainId ? mutate(terrain) : terrain) });
  };

  // --- Random-mix multi-selection (Ctrl+click on atlas thumbs) ---
  const equalSplit = (count: number): number => Math.max(1, Math.floor(100 / Math.max(1, count)));

  // Ctrl/Cmd+click toggles the tile in the mix (percents reset to an equal split);
  // a plain click clears the mix and selects the single tile as usual.
  const handleAtlasThumbSelect = (entry: Msx2BitmapRoomAtlasEntry, event: React.MouseEvent) => {
    setSelectedAtlasEntryId(entry.id);
    setSelectedTerrainId('');
    setConfigTarget('tile');
    if (event.ctrlKey || event.metaKey) {
      setPreparedStamp(null);
      // Compute outside the state updater: updaters must stay pure (no parent setState inside).
      const without = multiTileSelection.filter(item => item.entryId !== entry.id);
      const next = without.length === multiTileSelection.length
        ? [...multiTileSelection, { entryId: entry.id, percent: 0 }]
        : without;
      const percent = equalSplit(next.length);
      setMultiTileSelection(next.map(item => ({ ...item, percent })));
      setStatusBarMessage?.(next.length > 1
        ? `SCREEN 5: mezcla aleatoria con ${next.length} tiles (~${percent}% cada uno); pinta en el grid.`
        : 'SCREEN 5: mezcla aleatoria necesita al menos 2 tiles (Ctrl+click para añadir más).');
      return;
    }
    if (multiTileSelection.length > 0) {
      setMultiTileSelection([]);
      setStatusBarMessage?.('SCREEN 5: mezcla aleatoria deshecha; pincel con tile único.');
    }
  };

  // Weighted roll over the mix (entries deleted from the atlas are skipped). Returns null
  // when fewer than 2 valid tiles remain, so the caller falls back to single-tile painting.
  const pickFromMultiSelection = (): Msx2BitmapRoomAtlasEntry | null => {
    const valid = multiTileSelection
      .map(item => ({ item, entry: atlasEntries.find(candidate => candidate.id === item.entryId) }))
      .filter((pair): pair is { item: { entryId: string; percent: number }; entry: Msx2BitmapRoomAtlasEntry } => Boolean(pair.entry));
    if (valid.length < 2) return null;
    const total = valid.reduce((sum, pair) => sum + Math.max(0, Number(pair.item.percent) || 0), 0);
    if (total <= 0) return valid[Math.floor(Math.random() * valid.length)].entry;
    let roll = Math.random() * total;
    for (const pair of valid) {
      roll -= Math.max(0, Number(pair.item.percent) || 0);
      if (roll < 0) return pair.entry;
    }
    return valid[valid.length - 1].entry;
  };

  const multiSelectionActive = multiTileSelection.filter(item => atlasEntries.some(entry => entry.id === item.entryId)).length >= 2;

  // Places one rolled mix tile at the cell. Skips the roll when the cell already holds a
  // mix tile (drag-stability: no reshuffling while the mouse moves inside painted cells).
  const paintRandomMixAt = (cx: number, cy: number) => {
    const currentValue = tileGrid[cy]?.[cx] ?? 0;
    const currentId = currentValue > 0 ? atlasEntries[currentValue - 1]?.id : undefined;
    if (currentId && multiTileSelection.some(item => item.entryId === currentId)) return;
    const entry = pickFromMultiSelection();
    if (!entry) return;
    const index = atlasEntries.indexOf(entry);
    if (index < 0) return;
    const next = tileGrid.map(row => [...row]);
    next[cy][cx] = index + 1;
    const nextCollision = writeCell(room.collision, cx, cy, entryPaintFlags(entry), collisionCols, collisionRows);
    const nextBehavior = writeCell(room.behavior, cx, cy, clampByte(entry.behaviorCode, 0), collisionCols, collisionRows);
    let nextShape: number[][] | undefined = undefined;
    if (entry.collisionShape) {
      nextShape = ensureCollisionShape().map(row => [...row]);
      nextShape = writeCell(nextShape, cx, cy, entry.collisionShape, collisionCols, collisionRows);
    }
    applyTileGrid(next, undefined, nextCollision, nextBehavior, nextShape);
  };

  // --- Autotile (terrain) painting ---
  // Paints/erases terrain membership on `cells` and re-resolves the blob tile of every
  // affected cell + neighbours, writing collision/behavior flags from each chosen entry.
  const paintTerrainCells = (terrain: Msx2BitmapAutoTerrain, cells: Array<{ x: number; y: number }>, erase: boolean) => {
    const { grid, changed } = applyTerrainToGrid({
      grid: tileGrid,
      entries: atlasEntries,
      terrain,
      cells,
      erase,
      edgesAreTerrain: terrainEdgesAsTerrain,
    });
    if (changed.length === 0) return;
    let nextCollision = room.collision;
    let nextBehavior = room.behavior;
    let nextShape: number[][] | undefined = undefined;
    changed.forEach(({ x, y, entry }) => {
      nextCollision = writeCell(nextCollision, x, y, entryPaintFlags(entry), collisionCols, collisionRows);
      nextBehavior = writeCell(nextBehavior, x, y, clampByte(entry?.behaviorCode, 0), collisionCols, collisionRows);
      if (entry?.collisionShape) {
        if (!nextShape) nextShape = ensureCollisionShape().map(row => [...row]);
        nextShape = writeCell(nextShape, x, y, entry.collisionShape, collisionCols, collisionRows);
      }
    });
    applyTileGrid(grid, undefined, nextCollision, nextBehavior, nextShape);
  };

  // --- Visual-layer painting on the 8px grid ---
  // px/py are pixel coords; painting snaps to the GRID (16px, matching 16x16 tiles).
  const paintVisualAt = (px: number, py: number) => {
    const snapX = Math.max(0, Math.min(SCREEN_W - GRID, Math.floor(px / GRID) * GRID));
    const snapY = Math.max(0, Math.min(roomHeight - GRID, Math.floor(py / GRID) * GRID));
    const id = `cmd_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    if (tool === 'eraser') {
      // Erasing a cell that belongs to an autotile terrain heals its neighbours' borders.
      const ecx = Math.max(0, Math.min(gridWidth - 1, Math.floor(px / GRID)));
      const ecy = Math.max(0, Math.min(gridHeight - 1, Math.floor(py / GRID)));
      const owner = findTerrainForGridValue(autoTerrains, atlasEntries, tileGrid[ecy]?.[ecx] ?? 0);
      if (owner) {
        paintTerrainCells(owner, [{ x: ecx, y: ecy }], true);
        return;
      }
    }
    // Terrain brush/fill: with a terrain selected, the visual layer paints terrain membership.
    if (selectedTerrain && tool !== 'eraser') {
      const cx = Math.max(0, Math.min(gridWidth - 1, Math.floor(px / GRID)));
      const cy = Math.max(0, Math.min(gridHeight - 1, Math.floor(py / GRID)));
      if (tool === 'brush') {
        paintTerrainCells(selectedTerrain, [{ x: cx, y: cy }], false);
        return;
      }
      if (tool === 'fill') {
        // Flood the contiguous EMPTY region from the clicked cell with terrain.
        if ((tileGrid[cy]?.[cx] ?? 0) !== 0) {
          setStatusBarMessage?.('SCREEN 5: el relleno de terreno solo actúa sobre celdas vacías.');
          return;
        }
        const region: Array<{ x: number; y: number }> = [];
        const seen = new Set<number>();
        const stack: Array<[number, number]> = [[cx, cy]];
        while (stack.length) {
          const [x, y] = stack.pop() as [number, number];
          if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) continue;
          const k = y * gridWidth + x;
          if (seen.has(k) || (tileGrid[y]?.[x] ?? 0) !== 0) continue;
          seen.add(k);
          region.push({ x, y });
          stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
        if (region.length > 0) paintTerrainCells(selectedTerrain, region, false);
        return;
      }
    }
    // Random-mix brush/fill: with 2+ tiles Ctrl-selected, each painted cell rolls one of them.
    if (multiSelectionActive && tool !== 'eraser' && !preparedStamp) {
      const cx = Math.max(0, Math.min(gridWidth - 1, Math.floor(px / GRID)));
      const cy = Math.max(0, Math.min(gridHeight - 1, Math.floor(py / GRID)));
      if (tool === 'brush') {
        paintRandomMixAt(cx, cy);
        return;
      }
      if (tool === 'fill') {
        // Flood the contiguous same-tile region (like the single-tile fill) but roll a mix
        // tile per cell, so plains come out varied in one click.
        const target = tileGrid[cy]?.[cx] ?? 0;
        const region: Array<{ x: number; y: number }> = [];
        const seen = new Set<number>();
        const stack: Array<[number, number]> = [[cx, cy]];
        while (stack.length) {
          const [x, y] = stack.pop() as [number, number];
          if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) continue;
          const k = y * gridWidth + x;
          if (seen.has(k) || (tileGrid[y]?.[x] ?? 0) !== target) continue;
          seen.add(k);
          region.push({ x, y });
          stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
        if (region.length === 0) return;
        const next = tileGrid.map(row => [...row]);
        let nextCollision = room.collision;
        let nextBehavior = room.behavior;
        region.forEach(cell => {
          const entry = pickFromMultiSelection();
          if (!entry) return;
          const index = atlasEntries.indexOf(entry);
          if (index < 0) return;
          next[cell.y][cell.x] = index + 1;
          nextCollision = writeCell(nextCollision, cell.x, cell.y, entryPaintFlags(entry), collisionCols, collisionRows);
          nextBehavior = writeCell(nextBehavior, cell.x, cell.y, clampByte(entry.behaviorCode, 0), collisionCols, collisionRows);
        });
        applyTileGrid(next, undefined, nextCollision, nextBehavior);
        return;
      }
    }
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
        let nextShape: number[][] | undefined = undefined;
        paintedCells.forEach(cell => {
          nextCollision = writeCell(nextCollision, cell.x, cell.y, selectedAtlasEntryFlags, collisionCols, collisionRows);
          nextBehavior = writeCell(nextBehavior, cell.x, cell.y, selectedAtlasEntryBehaviorCode, collisionCols, collisionRows);
          if (selectedAtlasEntryShape !== 0) {
            if (!nextShape) nextShape = ensureCollisionShape().map(row => [...row]);
            nextShape = writeCell(nextShape, cell.x, cell.y, selectedAtlasEntryShape, collisionCols, collisionRows);
          }
        });
        applyTileGrid(next, undefined, nextCollision, nextBehavior, nextShape);
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
        let nextShape: number[][] | undefined = undefined;
        if (selectedAtlasEntryShape !== 0) {
          nextShape = ensureCollisionShape().map(row => [...row]);
          nextShape = writeCell(nextShape, cx, cy, selectedAtlasEntryShape, collisionCols, collisionRows);
        }
        applyTileGrid(next, undefined, nextCollision, nextBehavior, nextShape);
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
      if (patrolPointPicker) {
        const snapX = cellX * GRID;
        const snapY = cellY * GRID;
        updatePlacedEntityPatrolPoint(patrolPointPicker.entityId, patrolPointPicker.point, snapX, snapY);
        setSelectedPlacedId(patrolPointPicker.entityId);
        setPatrolPointPicker(null);
        setStatusBarMessage?.(`SCREEN 5: waypoint ${patrolPointPicker.point === 'start' ? 'W1' : 'W2'} fijado en px (${snapX}, ${snapY}).`);
        return;
      }
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
      if (tool === 'select') {
        setStatusBarMessage?.(`SCREEN 5: tile seleccionado en celda (${cellX}, ${cellY}).`);
      } else {
        paintVisualAt(px, py);
        setStatusBarMessage?.(`SCREEN 5: ${tool} en celda (${cellX}, ${cellY}).`);
      }
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
    if (tool === 'fill' || tool === 'select') return;
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
      // Autotile cells heal their neighbours' borders, same as the Borrador tool.
      const owner = findTerrainForGridValue(autoTerrains, atlasEntries, tileGrid[cellY]?.[cellX] ?? 0);
      if (owner) {
        paintTerrainCells(owner, [{ x: cellX, y: cellY }], true);
        setStatusBarMessage?.(`SCREEN 5: terreno borrado en celda (${cellX}, ${cellY}); bordes vecinos recalculados.`);
        return;
      }
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

  // --- Autotile terrain import: template tiles -> atlas entries + mask mapping ---
  // The modal delivers tiles with a parallel `masks` list (masks[i] = canonical neighbour
  // mask of tiles[i]), for both blob16 (16 tiles) and wang47 (47 tiles). The mapping stores
  // atlas entry IDs (stable across entry deletes).
  const handleImportAutotileTemplate = ({ name, template, tiles, masks, markSolid }: {
    name: string;
    template: Msx2BitmapAutoTerrain['template'];
    tiles: Msx2Screen4Tile[];
    masks: number[];
    markSolid: boolean;
  }) => {
    const prepared = tiles.map((tile, index) => ({
      ...tile,
      name: `${name}_m${masks[index]}`,
      ...(markSolid ? { collisionFlags: PROP_BIT.solid } : {}),
    }));
    const { atlas, addedEntries } = importTilesIntoAtlas(
      {
        width: atlasWidth,
        height: atlasHeight,
        offscreenBaseY: room.atlas?.offscreenBaseY || 320,
        pixels: room.atlas?.pixels,
        entries: atlasEntries,
      },
      prepared,
    );
    const mapping: Record<number, string> = {};
    masks.forEach((mask, index) => {
      const entry = addedEntries[index];
      if (entry) mapping[mask] = entry.id;
    });
    const terrain: Msx2BitmapAutoTerrain = {
      id: `terrain_${Date.now()}`,
      name,
      template,
      mapping,
    };
    onUpdate({ atlas, autoTerrains: [...autoTerrains, terrain] });
    setIsAutotileImportOpen(false);
    setSelectedTerrainId(terrain.id);
    setActiveLayer('visual');
    setTool('brush');
    setStatusBarMessage?.(`SCREEN 5: terreno autotile "${name}" (${template === 'wang47' ? '47 tiles wang' : '16 tiles blob'}) importado; pinta en el grid con el pincel.`);
  };

  // Project palette assets, for the "Cargar paleta" picker.
  const paletteAssets = useMemo(() => allAssets.filter(asset => asset.type === 'palette'), [allAssets]);

  const serializeTerrainPixels = (pixels: number[][]): string => pixels.map(row => row.join(',')).join(';');

  const getAtlasEntryPixelsFrom = (pixelsSource: number[][], entry: Msx2BitmapRoomAtlasEntry): number[][] => {
    const w = Math.max(1, entry.w || GRID);
    const h = Math.max(1, entry.h || GRID);
    return Array.from({ length: h }, (_r, yy) =>
      Array.from({ length: w }, (_c, xx) => pixelsSource[entry.sy + yy]?.[entry.sx + xx] ?? 0),
    );
  };

  const getAtlasEntryPixels = (entry: Msx2BitmapRoomAtlasEntry): number[][] => {
    return getAtlasEntryPixelsFrom(atlasPixels, entry);
  };

  const getTerrainReferencedEntryIds = (terrain: Msx2BitmapAutoTerrain): string[] => {
    const ids = new Set<string>();
    Object.values(terrain.mapping || {}).forEach(id => ids.add(id));
    Object.values(terrain.variants || {}).forEach(list => {
      (list || []).forEach(variant => ids.add(variant.entryId));
    });
    return Array.from(ids);
  };

  const findMatchingCurrentAtlasEntry = (
    sourceEntry: Msx2BitmapRoomAtlasEntry,
    sourcePixels: number[][],
    exactByNameAndPixels: Map<string, Msx2BitmapRoomAtlasEntry[]>,
    exactByPixels: Map<string, Msx2BitmapRoomAtlasEntry[]>,
    usedIds: Set<string>,
  ): Msx2BitmapRoomAtlasEntry | null => {
    const width = Math.max(1, sourceEntry.w || GRID);
    const height = Math.max(1, sourceEntry.h || GRID);
    const pixelKey = `${width}x${height}:${serializeTerrainPixels(sourcePixels)}`;
    const nameKey = `${sourceEntry.name.toLowerCase()}|${pixelKey}`;
    const candidates = exactByNameAndPixels.get(nameKey) || exactByPixels.get(pixelKey) || [];
    return candidates.find(entry => !usedIds.has(entry.id)) || candidates[0] || null;
  };

  const buildTerrainFromExistingAtlas = (
    sourceTerrain: Msx2BitmapAutoTerrain,
    sourceRoom: Msx2Screen5BitmapRoom,
  ): Msx2BitmapAutoTerrain | null => {
    const sourceEntries = sourceRoom.atlas?.entries || [];
    if (sourceEntries.length === 0) return null;
    const sourceWidth = Math.max(1, Number(sourceRoom.atlas?.width) || 256);
    const sourceHeight = Math.max(1, Number(sourceRoom.atlas?.height) || 128);
    const sourcePixels = normalizePixels(sourceRoom.atlas?.pixels, sourceWidth, sourceHeight);
    const currentByNameAndPixels = new Map<string, Msx2BitmapRoomAtlasEntry[]>();
    const currentByPixels = new Map<string, Msx2BitmapRoomAtlasEntry[]>();
    atlasEntries.forEach(entry => {
      const width = Math.max(1, entry.w || GRID);
      const height = Math.max(1, entry.h || GRID);
      const pixelKey = `${width}x${height}:${serializeTerrainPixels(getAtlasEntryPixels(entry))}`;
      const nameKey = `${entry.name.toLowerCase()}|${pixelKey}`;
      currentByPixels.set(pixelKey, [...(currentByPixels.get(pixelKey) || []), entry]);
      currentByNameAndPixels.set(nameKey, [...(currentByNameAndPixels.get(nameKey) || []), entry]);
    });

    const usedIds = new Set<string>();
    const sourceToCurrent = new Map<string, string>();
    const remapEntryId = (sourceEntryId: string): string | null => {
      if (sourceToCurrent.has(sourceEntryId)) return sourceToCurrent.get(sourceEntryId)!;
      const sourceEntry = sourceEntries.find(entry => entry.id === sourceEntryId);
      if (!sourceEntry) return null;
      const match = findMatchingCurrentAtlasEntry(
        sourceEntry,
        getAtlasEntryPixelsFrom(sourcePixels, sourceEntry),
        currentByNameAndPixels,
        currentByPixels,
        usedIds,
      );
      if (!match) return null;
      usedIds.add(match.id);
      sourceToCurrent.set(sourceEntryId, match.id);
      return match.id;
    };

    const mapping: Record<number, string> = {};
    for (const [mask, sourceEntryId] of Object.entries(sourceTerrain.mapping || {})) {
      const currentEntryId = remapEntryId(sourceEntryId);
      if (!currentEntryId) return null;
      mapping[Number(mask)] = currentEntryId;
    }
    const variants: Record<number, Msx2BitmapAutoTerrainVariant[]> = {};
    Object.entries(sourceTerrain.variants || {}).forEach(([mask, list]) => {
      const remapped = (list || [])
        .map(variant => {
          const entryId = remapEntryId(variant.entryId);
          return entryId ? { entryId, percent: variant.percent } : null;
        })
        .filter((variant): variant is Msx2BitmapAutoTerrainVariant => Boolean(variant));
      if (remapped.length > 0) variants[Number(mask)] = remapped;
    });
    return {
      id: `terrain_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: sourceTerrain.name,
      template: sourceTerrain.template,
      mapping,
      ...(Object.keys(variants).length > 0 ? { variants } : {}),
    };
  };

  const worldTerrainCandidates = useMemo(() => {
    if (!currentWorldGraph) return [];
    const roomIdsInWorld = new Set(currentWorldGraph.nodes.map(node => node.screenAssetId));
    return bitmapRooms
      .filter(asset => asset.id !== room.id && roomIdsInWorld.has(asset.id))
      .flatMap(asset => {
        const sourceRoom = asset.data as Msx2Screen5BitmapRoom;
        return (sourceRoom.autoTerrains || []).map(terrain => {
          const rebuilt = buildTerrainFromExistingAtlas(terrain, sourceRoom);
          return rebuilt ? { sourceRoomName: asset.name, terrain, rebuilt } : null;
        }).filter((item): item is { sourceRoomName: string; terrain: Msx2BitmapAutoTerrain; rebuilt: Msx2BitmapAutoTerrain } => Boolean(item));
      });
  }, [atlasEntries, atlasPixels, bitmapRooms, currentWorldGraph, room.id]);

  const restoreWorldTerrainsFromExistingAtlas = () => {
    if (worldTerrainCandidates.length === 0) {
      setStatusBarMessage?.('SCREEN 5: no hay terrains del mundo recuperables con tiles ya presentes en este atlas.');
      return;
    }
    const seenKeys = new Set(autoTerrains.map(terrain => `${terrain.template}|${terrain.name}`));
    const restored: Msx2BitmapAutoTerrain[] = [];
    worldTerrainCandidates.forEach(candidate => {
      const key = `${candidate.rebuilt.template}|${candidate.rebuilt.name}`;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);
      restored.push(candidate.rebuilt);
    });
    if (restored.length === 0) {
      setStatusBarMessage?.('SCREEN 5: los terrains recuperables del mundo ya estan asignados en esta pantalla.');
      return;
    }
    onUpdate({ autoTerrains: [...autoTerrains, ...restored] });
    setSelectedTerrainId(restored[0].id);
    setActiveLayer('visual');
    setTool('brush');
    setStatusBarMessage?.(`SCREEN 5: ${restored.length} terrain(s) recuperados del mundo sin duplicar tiles del atlas.`);
  };

  useEffect(() => {
    if (autoTerrains.length > 0 || worldTerrainCandidates.length === 0) return;
    if (autoTerrainRestoreRoomRef.current === room.id) return;
    autoTerrainRestoreRoomRef.current = room.id;
    restoreWorldTerrainsFromExistingAtlas();
  }, [autoTerrains.length, room.id, worldTerrainCandidates.length]);

  const saveTerrainAsAsset = (terrain: Msx2BitmapAutoTerrain) => {
    const referencedIds = getTerrainReferencedEntryIds(terrain);
    const referencedEntries = referencedIds
      .map(id => atlasEntries.find(entry => entry.id === id))
      .filter((entry): entry is Msx2BitmapRoomAtlasEntry => Boolean(entry));
    if (referencedEntries.length === 0) {
      setStatusBarMessage?.(`SCREEN 5: terreno "${terrain.name}" no tiene tiles validos para guardar.`);
      return;
    }
    const usedNames = new Set(allAssets.map(asset => asset.name));
    const baseName = terrain.name.trim() || 'Autotile Terrain';
    let assetName = baseName;
    let suffix = 2;
    while (usedNames.has(assetName)) assetName = `${baseName} ${suffix++}`;
    const assetId = `bitmap_terrain_${Date.now()}`;
    const data: Msx2BitmapTerrainAsset = {
      id: assetId,
      name: assetName,
      savedAt: Date.now(),
      terrain: {
        name: terrain.name,
        template: terrain.template,
        mapping: { ...(terrain.mapping || {}) },
        ...(terrain.variants ? { variants: JSON.parse(JSON.stringify(terrain.variants)) as Record<number, Msx2BitmapAutoTerrainVariant[]> } : {}),
      },
      tiles: referencedEntries.map(entry => ({
        id: entry.id,
        name: entry.name,
        width: Math.max(1, entry.w || GRID),
        height: Math.max(1, entry.h || GRID),
        pixels: getAtlasEntryPixels(entry),
        ...(entry.collisionFlags !== undefined ? { collisionFlags: entry.collisionFlags } : {}),
        ...(entry.behaviorCode !== undefined ? { behaviorCode: entry.behaviorCode } : {}),
      })),
      palette: slots.map(slot => ({ ...slot })),
    };
    addTerrainToMsx2BitmapTerrainLibrary(data);
    onUpdate({}, [{ id: assetId, name: assetName, type: 'msx2bitmapterrain', data }]);
    setSelectedTerrainAssetId(assetId);
    setStatusBarMessage?.(`SCREEN 5: terreno "${terrain.name}" guardado como asset reutilizable y en Libraries > Terrains (${referencedEntries.length} tiles).`);
  };

  const importTerrainAssetIntoRoom = (asset: ProjectAsset & { data: Msx2BitmapTerrainAsset }) => {
    const terrainAsset = asset.data;
    const tiles: Msx2Screen4Tile[] = (terrainAsset.tiles || []).map(tile => ({
      id: tile.id,
      name: tile.name,
      width: tile.width || GRID,
      height: tile.height || GRID,
      pixels: tile.pixels,
      ...(tile.collisionFlags !== undefined ? { collisionFlags: tile.collisionFlags } : {}),
      ...(tile.behaviorCode !== undefined ? { behaviorCode: tile.behaviorCode } : {}),
    }));
    if (tiles.length === 0) {
      setStatusBarMessage?.(`SCREEN 5: asset "${asset.name}" no contiene tiles de terreno.`);
      return;
    }
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
    const idMap = new Map<string, string>();
    terrainAsset.tiles.forEach((tile, index) => {
      const entry = addedEntries[index];
      if (entry) idMap.set(tile.id, entry.id);
    });
    const mapping: Record<number, string> = {};
    Object.entries(terrainAsset.terrain.mapping || {}).forEach(([mask, oldId]) => {
      const nextId = idMap.get(oldId);
      if (nextId) mapping[Number(mask)] = nextId;
    });
    if (Object.keys(mapping).length === 0) {
      setStatusBarMessage?.(`SCREEN 5: asset "${asset.name}" no pudo reconstruir el mapping de autotile.`);
      return;
    }
    const variants: Record<number, Msx2BitmapAutoTerrainVariant[]> = {};
    Object.entries(terrainAsset.terrain.variants || {}).forEach(([mask, list]) => {
      const remapped = (list || [])
        .map(variant => {
          const nextId = idMap.get(variant.entryId);
          return nextId ? { entryId: nextId, percent: variant.percent } : null;
        })
        .filter((variant): variant is Msx2BitmapAutoTerrainVariant => Boolean(variant));
      if (remapped.length > 0) variants[Number(mask)] = remapped;
    });
    const terrain: Msx2BitmapAutoTerrain = {
      id: `terrain_${Date.now()}`,
      name: terrainAsset.terrain.name || asset.name,
      template: terrainAsset.terrain.template || 'blob16',
      mapping,
      ...(Object.keys(variants).length > 0 ? { variants } : {}),
    };
    onUpdate({ atlas, autoTerrains: [...autoTerrains, terrain] });
    setSelectedTerrainId(terrain.id);
    setSelectedTerrainAssetId(asset.id);
    setActiveLayer('visual');
    setTool('brush');
    setStatusBarMessage?.(`SCREEN 5: terreno "${terrain.name}" importado desde asset "${asset.name}" (${addedEntries.length} tiles al atlas).`);
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

  // Append the tile-editor draft as a NEW atlas entry (the edited entry stays untouched),
  // inheriting the source's collision/behavior flags. One-step path for autotile variants.
  const saveBitmapTileEditorAsAtlasCopy = (name: string, pixels: number[][]) => {
    const source = editingAtlasEntry;
    if (!source) return;
    const usedNames = new Set(atlasEntries.map(item => item.name));
    let copyName = name.trim() || `${source.name}_var`;
    let suffix = 2;
    while (usedNames.has(copyName)) copyName = `${name.trim() || `${source.name}_var`} ${suffix++}`;
    const { atlas, addedEntries } = importTilesIntoAtlas(
      {
        width: atlasWidth,
        height: atlasHeight,
        offscreenBaseY: room.atlas?.offscreenBaseY || 320,
        pixels: room.atlas?.pixels,
        entries: atlasEntries,
      },
      [{
        id: `copy_${source.id}_${Date.now()}`,
        name: copyName,
        width: Math.max(1, source.w || GRID),
        height: Math.max(1, source.h || GRID),
        pixels,
        collisionFlags: source.collisionFlags,
        behaviorCode: source.behaviorCode,
      }],
    );
    onUpdate({ atlas });
    setEditingAtlasEntryId(null);
    revealAtlasEntry(addedEntries[0]);
    setStatusBarMessage?.(`SCREEN 5: tile "${copyName}" creado como copia en el atlas; añádelo como variante en el panel Autotile.`);
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

  // Painting a "Destructible" atlas tile stamps the per-cell destructible bit (0x80)
  // into the cell's collision byte, so the dug-mask default follows the atlas checkbox
  // while the Select tool can still toggle individual cells (secret paths). "Se desmorona"
  // (0x04) works the same way for crumbling floors.
  const selectedAtlasEntryFlags = selectedAtlasEntry
    ? clampByte(selectedAtlasEntry.collisionFlags, 0)
      | (selectedAtlasEntry.destructible === true ? PROP_BIT.destructible : 0)
      | (selectedAtlasEntry.crumbling === true ? PROP_BIT.crumbling : 0)
    : 0;
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
  const selectedAtlasEntryDestructible = selectedAtlasEntry?.destructible === true;
  const selectedAtlasEntryCrumbling = selectedAtlasEntry?.crumbling === true;
  const selectedAtlasEntryCrumbleFrames = clampInt(selectedAtlasEntry?.crumbleFramesPerStage, CRUMBLE_FRAMES_MIN, CRUMBLE_FRAMES_MAX, CRUMBLE_FRAMES_DEFAULT);
  const selectedAtlasEntryShape = selectedAtlasEntry ? (clampByte(selectedAtlasEntry.collisionShape, 0) & SHAPE_FULL) : 0;
  const selectedAtlasEntryShapeQuadrants = expandCellShape(selectedAtlasEntryShape);

  const updateAtlasEntryShape = (shape: number) => {
    if (!selectedAtlasEntry || !onUpdateProjectAsset) return;
    const normalized = (shape & SHAPE_FULL) === SHAPE_FULL ? 0 : (shape & SHAPE_FULL);
    const updatedEntry = { ...selectedAtlasEntry, collisionShape: normalized || undefined };
    const entries = atlasEntries.map(e => e.id === selectedAtlasEntry.id ? updatedEntry : e);
    onUpdate({ atlas: { ...room.atlas, entries } });
    setStatusBarMessage?.(`Forma 8x8 del tile: ${describeCellShape(normalized)}`);
  };

  const toggleAtlasEntryShapeQuadrant = (bit: number) => {
    const next = expandCellShape(selectedAtlasEntryShape) ^ bit;
    if ((next & SHAPE_FULL) === 0) {
      setStatusBarMessage?.('La forma del tile necesita al menos un cuadrante.');
      return;
    }
    updateAtlasEntryShape(next);
  };

  const applyAtlasEntryShapePreset = (value: number) => {
    updateAtlasEntryShape(value);
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
  const formatBehaviorCode = (value: number) => {
    if (value === BEHAVIOR_CODE.ice) return `${value} (Ice)`;
    if (value === BEHAVIOR_CODE.exitEnemy) return `${value} (Exit enemy)`;
    return `${value}`;
  };

  // Reflect the selected tile/cell stored collision flags into the checkbox state.
  useEffect(() => {
    if (configTarget === 'cell' && !selectedCollisionCell) {
      setCellProps({});
      return;
    }
    const next: Record<string, boolean> = {};
    PROPERTY_FLAGS.forEach(flag => { next[flag.key] = (configFlags & PROP_BIT[flag.key]) !== 0; });
    next.ice = configBehaviorCode === BEHAVIOR_CODE.ice;
    next.exitEnemy = configBehaviorCode === BEHAVIOR_CODE.exitEnemy;
    // Destructible reads the per-cell 0x80 bit for a cell, or the atlas tile flag for a tile.
    next.destructible = configTarget === 'cell'
      ? (configFlags & PROP_BIT.destructible) !== 0
      : selectedAtlasEntryDestructible;
    // Crumbling reads the per-cell 0x04 bit for a cell, or the atlas tile flag for a tile.
    next.crumbling = configTarget === 'cell'
      ? (configFlags & PROP_BIT.crumbling) !== 0
      : selectedAtlasEntryCrumbling;
    setCellProps(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configTarget, selectedCollisionCell?.x, selectedCollisionCell?.y, room.collision, room.behavior, selectedAtlasEntry?.id, selectedAtlasEntryFlags, selectedAtlasEntryBehaviorCode, selectedAtlasEntryDestructible, selectedAtlasEntryCrumbling]);

  // --- 8x8 sub-cell shape of the selected collision cell ---
  const selectedCellShape = selectedCollisionCell
    ? readCell(room.collisionShape, selectedCollisionCell.x, selectedCollisionCell.y) & SHAPE_FULL
    : 0;
  const selectedCellShapeQuadrants = expandCellShape(selectedCellShape);
  // The mask only does something on cells the runtime probes: solid ones (walls,
  // ledges) and deadly ones (spikes). On anything else it is inert data.
  const selectedCellShapeApplies = ((configFlags & PROP_BIT.solid) | (configFlags & PROP_BIT.deadly)) !== 0;

  const writeCellShape = (value: number) => {
    if (!selectedCollisionCell) return;
    const normalized = (value & SHAPE_FULL) === SHAPE_FULL ? 0 : (value & SHAPE_FULL);
    const grown = writeCell(
      room.collisionShape,
      selectedCollisionCell.x,
      selectedCollisionCell.y,
      normalized,
      collisionCols,
      collisionRows,
    );
    onUpdate({ collisionShape: grown });
    return normalized;
  };

  const toggleShapeQuadrant = (bit: number) => {
    if (configTarget !== 'cell' || !selectedCollisionCell) {
      setStatusBarMessage?.('SCREEN 5: la forma 8x8 se define por celda; pulsa "Usar celda".');
      return;
    }
    const next = expandCellShape(selectedCellShape) ^ bit;
    if ((next & SHAPE_FULL) === 0) {
      // All four quadrants off would be indistinguishable from "full cell" in the
      // exported nibble; clearing collision is the Solid checkbox's job.
      setStatusBarMessage?.('SCREEN 5: una celda con forma necesita al menos un cuadrante. Desmarca Solid para quitar la colision.');
      return;
    }
    const stored = writeCellShape(next);
    setStatusBarMessage?.(
      stored === 0
        ? `SCREEN 5: celda (${selectedCollisionCell.x}, ${selectedCollisionCell.y}) solida entera.`
        : `SCREEN 5: forma 8x8 = ${stored} en celda (${selectedCollisionCell.x}, ${selectedCollisionCell.y}).`
    );
  };

  const applyShapePreset = (value: number) => {
    if (configTarget !== 'cell' || !selectedCollisionCell) {
      setStatusBarMessage?.('SCREEN 5: la forma 8x8 se define por celda; pulsa "Usar celda".');
      return;
    }
    writeCellShape(value);
    setStatusBarMessage?.(
      value === 0
        ? `SCREEN 5: celda (${selectedCollisionCell.x}, ${selectedCollisionCell.y}) solida entera.`
        : `SCREEN 5: forma 8x8 = ${value & SHAPE_FULL} en celda (${selectedCollisionCell.x}, ${selectedCollisionCell.y}).`
    );
  };

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

  const toggleExitEnemySurface = () => {
    const nextValue = configBehaviorCode === BEHAVIOR_CODE.exitEnemy ? BEHAVIOR_CODE.none : BEHAVIOR_CODE.exitEnemy;
    if (configTarget === 'cell' && selectedCollisionCell) {
      const grown = writeCell(room.behavior, selectedCollisionCell.x, selectedCollisionCell.y, nextValue, collisionCols, collisionRows);
      onUpdate({ behavior: grown });
      setStatusBarMessage?.(`SCREEN 5: exit_enemy ${nextValue === BEHAVIOR_CODE.exitEnemy ? 'ON' : 'OFF'} en celda (${selectedCollisionCell.x}, ${selectedCollisionCell.y}).`);
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
      `SCREEN 5: exit_enemy ${nextValue === BEHAVIOR_CODE.exitEnemy ? 'ON' : 'OFF'} en ${targetLabel}` +
      (syncedCells > 0 ? `; ${syncedCells} celda(s) sincronizada(s)` : '') +
      (persistedStamp ? '; metatile actualizado.' : '.')
    );
  };

  // destroy_tile skill: "diggable" mark. Two scopes:
  //  - CELL: toggles the per-cell 0x80 bit in the collision grid (source of truth for
  //    the generator's dug-mask). Lets the same visual tile be diggable in one cell and
  //    only-solid in another → secret paths.
  //  - TILE: toggles the atlas entry's `destructible` flag, which becomes the painting
  //    default (paint stamps the 0x80 bit) for every cell drawn with that tile.
  const toggleDestructible = () => {
    if (configTarget === 'cell') {
      if (!selectedCollisionCell) {
        setStatusBarMessage?.('Selecciona una celda del lienzo primero (herramienta Select).');
        return;
      }
      const bit = PROP_BIT.destructible;
      const current = readCell(room.collision, selectedCollisionCell.x, selectedCollisionCell.y);
      const nextValue = (current & bit) ? (current & ~bit) : (current | bit);
      const grown = writeCell(room.collision, selectedCollisionCell.x, selectedCollisionCell.y, nextValue, collisionCols, collisionRows);
      onUpdate({ collision: grown });
      setStatusBarMessage?.(`SCREEN 5: Destructible ${(nextValue & bit) ? 'ON' : 'OFF'} en celda (${selectedCollisionCell.x}, ${selectedCollisionCell.y}) (skill destroy_tile).`);
      return;
    }
    const targetEntryIds = getConfigAtlasEntryIds();
    if (targetEntryIds.length === 0) {
      setStatusBarMessage?.('Selecciona un tile del atlas primero.');
      return;
    }
    const targetSet = new Set(targetEntryIds);
    const current = selectedAtlasEntry && targetSet.has(selectedAtlasEntry.id)
      ? selectedAtlasEntry.destructible === true
      : atlasEntries.find(entry => targetSet.has(entry.id))?.destructible === true;
    const turnOn = !current;
    const entries = atlasEntries.map(entry => targetSet.has(entry.id)
      ? { ...entry, destructible: turnOn || undefined }
      : entry);
    // Sync the per-cell 0x80 bit into every cell already using this tile (mirrors the Ice
    // sync), so the atlas checkbox reliably stamps the source-of-truth bit even for cells
    // painted before the toggle. Individual cells can still be overridden with Select.
    const bit = PROP_BIT.destructible;
    let syncedCells = 0;
    let nextCollision = room.collision;
    atlasEntries.forEach((entry, index) => {
      if (!targetSet.has(entry.id)) return;
      const tileIndexToSync = index + 1;
      tileGrid.forEach((row, y) => {
        row.forEach((tileIndex, x) => {
          if (tileIndex !== tileIndexToSync) return;
          const before = readCell(nextCollision, x, y);
          const after = turnOn ? (before | bit) : (before & ~bit);
          if (after === before) return;
          nextCollision = writeCell(nextCollision, x, y, after, collisionCols, collisionRows);
          syncedCells++;
        });
      });
    });
    onUpdate({
      atlas: { ...room.atlas, entries },
      ...(syncedCells > 0 ? { collision: nextCollision } : {}),
    });
    const targetLabel = targetEntryIds.length > 1
      ? `${targetEntryIds.length} tiles del metatile`
      : `tile "${selectedAtlasEntry?.name || atlasEntries.find(entry => targetSet.has(entry.id))?.name || 'atlas'}"`;
    setStatusBarMessage?.(
      `SCREEN 5: Destructible ${turnOn ? 'ON' : 'OFF'} en ${targetLabel}` +
      (syncedCells > 0 ? `; ${syncedCells} celda(s) sincronizada(s)` : '') +
      ' (skill destroy_tile).'
    );
  };

  // Crumbling floor (Manic Miner). Same two scopes as Destructible:
  //  - CELL: toggles the per-cell 0x04 bit in the collision grid (source of truth for the
  //    generator's crumble record list), so one tile can crumble here and be firm there.
  //  - TILE: toggles the atlas entry's `crumbling` flag = the painting default, synced into
  //    the cells already painted with that tile.
  // The bit is authoring-only: buildCollisionTableBytes masks bits 2..1 away (Effects layer),
  // so it never reaches the ROM collision byte.
  const toggleCrumbling = () => {
    if (configTarget === 'cell') {
      if (!selectedCollisionCell) {
        setStatusBarMessage?.('Selecciona una celda del lienzo primero (herramienta Select).');
        return;
      }
      const bit = PROP_BIT.crumbling;
      const current = readCell(room.collision, selectedCollisionCell.x, selectedCollisionCell.y);
      const nextValue = (current & bit) ? (current & ~bit) : (current | bit);
      const grown = writeCell(room.collision, selectedCollisionCell.x, selectedCollisionCell.y, nextValue, collisionCols, collisionRows);
      onUpdate({ collision: grown });
      const on = (nextValue & bit) !== 0;
      setStatusBarMessage?.(
        `SCREEN 5: Se desmorona ${on ? 'ON' : 'OFF'} en celda (${selectedCollisionCell.x}, ${selectedCollisionCell.y})` +
        (on && (nextValue & PROP_BIT.solid) === 0 ? ' — ojo: la celda no es Solid, el player no puede pisarla.' : '.')
      );
      return;
    }
    const targetEntryIds = getConfigAtlasEntryIds();
    if (targetEntryIds.length === 0) {
      setStatusBarMessage?.('Selecciona un tile del atlas primero.');
      return;
    }
    const targetSet = new Set(targetEntryIds);
    const current = selectedAtlasEntry && targetSet.has(selectedAtlasEntry.id)
      ? selectedAtlasEntry.crumbling === true
      : atlasEntries.find(entry => targetSet.has(entry.id))?.crumbling === true;
    const turnOn = !current;
    const entries = atlasEntries.map(entry => targetSet.has(entry.id)
      ? { ...entry, crumbling: turnOn || undefined }
      : entry);
    const bit = PROP_BIT.crumbling;
    let syncedCells = 0;
    let nextCollision = room.collision;
    atlasEntries.forEach((entry, index) => {
      if (!targetSet.has(entry.id)) return;
      const tileIndexToSync = index + 1;
      tileGrid.forEach((row, y) => {
        row.forEach((tileIndex, x) => {
          if (tileIndex !== tileIndexToSync) return;
          const before = readCell(nextCollision, x, y);
          const after = turnOn ? (before | bit) : (before & ~bit);
          if (after === before) return;
          nextCollision = writeCell(nextCollision, x, y, after, collisionCols, collisionRows);
          syncedCells++;
        });
      });
    });
    onUpdate({
      atlas: { ...room.atlas, entries },
      ...(syncedCells > 0 ? { collision: nextCollision } : {}),
    });
    const targetLabel = targetEntryIds.length > 1
      ? `${targetEntryIds.length} tiles del metatile`
      : `tile "${selectedAtlasEntry?.name || atlasEntries.find(entry => targetSet.has(entry.id))?.name || 'atlas'}"`;
    setStatusBarMessage?.(
      `SCREEN 5: Se desmorona ${turnOn ? 'ON' : 'OFF'} en ${targetLabel}` +
      (syncedCells > 0 ? `; ${syncedCells} celda(s) sincronizada(s)` : '') +
      ` (${CRUMBLE_STAGES} etapas de 2px, se regenera al volver a la sala).`
    );
  };

  const updateAtlasEntryCrumbleFrames = (value: number) => {
    if (!selectedAtlasEntry) {
      setStatusBarMessage?.('Selecciona un tile del atlas primero.');
      return;
    }
    const frames = clampInt(value, CRUMBLE_FRAMES_MIN, CRUMBLE_FRAMES_MAX, CRUMBLE_FRAMES_DEFAULT);
    const entries = atlasEntries.map(entry => entry.id === selectedAtlasEntry.id
      ? { ...entry, crumbleFramesPerStage: frames === CRUMBLE_FRAMES_DEFAULT ? undefined : frames }
      : entry);
    onUpdate({ atlas: { ...room.atlas, entries } });
    setStatusBarMessage?.(
      `SCREEN 5: ${frames} frame(s) por etapa; el tile aguanta ${frames * CRUMBLE_STAGES} frames de pisada.`
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
        {multiSelectionActive && (
          <Button
            size="sm"
            variant="primary"
            icon={<GridIcon />}
            onClick={() => setIsRandomMixOpen(true)}
            title="Editar los porcentajes de la mezcla aleatoria de tiles (Ctrl+click en el atlas para añadir/quitar)"
          >
            Mezcla aleatoria ({multiTileSelection.length})
          </Button>
        )}
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
              {toolBtn('select', 'Select', <SelectionIcon />)}
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
                      multiIndex={(() => {
                        const index = multiTileSelection.findIndex(item => item.entryId === entry.id);
                        return index >= 0 ? index + 1 : null;
                      })()}
                      onSelect={(event) => handleAtlasThumbSelect(entry, event)}
                      onDoubleClick={() => {
                        setSelectedAtlasEntryId(entry.id);
                        setConfigTarget('tile');
                        setEditingAtlasEntryId(entry.id);
                      }}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        setSelectedAtlasEntryId(entry.id);
                        setConfigTarget('tile');
                        const validMultiIds = multiTileSelection
                          .map(item => item.entryId)
                          .filter(entryId => atlasEntries.some(atlasEntry => atlasEntry.id === entryId));
                        setPendingDeleteAtlasEntryIds(
                          validMultiIds.length > 1 && validMultiIds.includes(entry.id)
                            ? validMultiIds
                            : [entry.id]
                        );
                      }}
                    />
                  ))}
                </div>
                {visibleAtlasEntries.length === 0 && (
                  <div className="mt-1 text-[0.6rem] text-msx-textsecondary">Sin tiles en la categoría "{statusCategoryLabel}".</div>
                )}
              </div>
            )}
          </CollapsiblePanel>

          <CollapsiblePanel title="Autotile (terrenos)" isOpen={openAutotile} onToggle={() => setOpenAutotile(v => !v)}>
            <div className="space-y-2">
              <Button size="sm" variant="secondary" onClick={() => setIsAutotileImportOpen(true)}>
                Importar plantilla PNG (4x4)…
              </Button>
              {selectedTerrain && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => saveTerrainAsAsset(selectedTerrain)}
                  title="Exportar el terreno/autotile seleccionado como asset reutilizable del proyecto"
                >
                  Exportar terrain_asset
                </Button>
              )}
              {terrainAssets.length > 0 && (
                <div className="rounded border border-msx-border bg-msx-bgcolor p-2 space-y-1">
                  <div className="text-[0.65rem] font-semibold text-msx-highlight">Assets de terreno</div>
                  <select
                    value={selectedTerrainAssetId}
                    onChange={event => setSelectedTerrainAssetId(event.target.value)}
                    className="w-full rounded border border-msx-border bg-msx-panelbg px-1 py-0.5 text-[0.65rem] text-msx-textprimary"
                  >
                    <option value="">Selecciona asset...</option>
                    {terrainAssets.map(asset => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} ({asset.data.terrain.template === 'wang47' ? '47 wang' : '16 blob'})
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!selectedTerrainAssetId}
                    onClick={() => {
                      const asset = terrainAssets.find(item => item.id === selectedTerrainAssetId);
                      if (asset) importTerrainAssetIntoRoom(asset);
                    }}
                  >
                    Importar asset guardado
                  </Button>
                </div>
              )}
              {worldTerrainCandidates.length > 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={restoreWorldTerrainsFromExistingAtlas}
                  title="Recupera la asignacion autotile desde otra pantalla del mismo mundo usando los tiles que ya existen en este atlas."
                >
                  Recuperar terrain del mundo ({worldTerrainCandidates.length})
                </Button>
              )}
              <label className="flex items-center gap-2 text-[0.65rem] text-msx-textsecondary">
                <input
                  type="checkbox"
                  checked={terrainEdgesAsTerrain}
                  onChange={event => setTerrainEdgesAsTerrain(event.target.checked)}
                />
                <span>Bordes de pantalla cuentan como terreno</span>
              </label>
              {autoTerrains.length === 0 ? (
                <div className="rounded border border-msx-border bg-msx-bgcolor p-2 text-xs text-msx-textsecondary">
                  Sin terrenos. Importa una plantilla blob de 16 tiles (PNG 64x64) y pinta suelos y paredes
                  con esquinas y bordes automáticos.
                </div>
              ) : (
                <div className="space-y-1">
                  {autoTerrains.map(terrain => {
                    const centerEntry = atlasEntries.find(entry => entry.id === terrain.mapping?.[15]);
                    const isSelected = terrain.id === selectedTerrainId;
                    return (
                      <div key={terrain.id} className={`flex items-center gap-2 rounded border p-1 ${isSelected ? 'border-msx-highlight ring-1 ring-msx-highlight' : 'border-msx-border'}`}>
                        <button
                          type="button"
                          className="flex flex-1 items-center gap-2 text-left"
                          title={`Terreno "${terrain.name}" (${terrain.template}) — pinta con el pincel; el borde/esquina se elige solo`}
                          onClick={() => {
                            setSelectedTerrainId(isSelected ? '' : terrain.id);
                            setPreparedStamp(null);
                            setMultiTileSelection([]);
                            setActiveLayer('visual');
                            if (tool === 'eraser') setTool('brush');
                            setStatusBarMessage?.(isSelected
                              ? 'SCREEN 5: terreno deseleccionado; el pincel vuelve a pintar el tile del atlas.'
                              : `SCREEN 5: terreno "${terrain.name}" activo; pincel/relleno autotile en capa Visual.`);
                          }}
                        >
                          <div className="h-8 w-8 shrink-0 overflow-hidden border border-black/70 bg-black">
                            {centerEntry
                              ? <AtlasTilePreview entry={centerEntry} atlasPixels={atlasPixels} slots={slots} />
                              : <div className="h-full w-full" />}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-[0.65rem] text-msx-textprimary">{terrain.name}</div>
                            <div className="text-[0.55rem] text-msx-textsecondary">
                              {terrain.template === 'blob16' ? '16 tiles (blob)' : '47 tiles (wang)'}
                            </div>
                          </div>
                        </button>
                        <button
                          type="button"
                          className="shrink-0 rounded border border-msx-border px-1 text-[0.65rem] text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight"
                          title="Guardar este terreno como asset reutilizable"
                          onClick={() => saveTerrainAsAsset(terrain)}
                        >
                          Exportar
                        </button>
                        <button
                          type="button"
                          className="shrink-0 rounded border border-msx-border px-1 text-[0.65rem] text-msx-textsecondary hover:border-red-400 hover:text-red-300"
                          title="Eliminar terreno (los tiles del atlas y lo ya pintado se conservan)"
                          onClick={() => setPendingDeleteTerrainId(terrain.id)}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                  {pendingDeleteTerrainId && (
                    <div className="rounded border border-red-500/60 bg-msx-bgcolor p-2 text-[0.65rem] text-msx-textsecondary">
                      <div className="font-semibold text-red-300">¿Eliminar terreno?</div>
                      <div className="mt-1 truncate text-msx-textprimary">
                        {autoTerrains.find(terrain => terrain.id === pendingDeleteTerrainId)?.name || pendingDeleteTerrainId}
                      </div>
                      <div className="mt-1">Se borra solo la definición autotile; los tiles del atlas y las celdas pintadas se conservan.</div>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          className="rounded bg-red-600 px-2 py-1 text-white hover:bg-red-500"
                          onClick={() => {
                            onUpdate({ autoTerrains: autoTerrains.filter(terrain => terrain.id !== pendingDeleteTerrainId) });
                            if (selectedTerrainId === pendingDeleteTerrainId) setSelectedTerrainId('');
                            setPendingDeleteTerrainId(null);
                          }}
                        >
                          Eliminar
                        </button>
                        <button
                          type="button"
                          className="rounded border border-msx-border px-2 py-1 text-msx-textprimary hover:border-msx-highlight"
                          onClick={() => setPendingDeleteTerrainId(null)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {selectedTerrain && (() => {
                // Variants editor for the selected terrain: per-mask random substitutions.
                const centreMask = selectedTerrain.template === 'wang47' ? 255 : 15;
                const mappedMasks = Object.keys(selectedTerrain.mapping || {}).map(Number).sort((a, b) => a - b);
                if (mappedMasks.length === 0) return null;
                const activeMask = variantMask !== null && mappedMasks.includes(variantMask)
                  ? variantMask
                  : (mappedMasks.includes(centreMask) ? centreMask : mappedMasks[0]);
                const baseEntry = atlasEntries.find(entry => entry.id === selectedTerrain.mapping[activeMask]);
                const maskVariants = selectedTerrain.variants?.[activeMask] || [];
                const totalPercent = maskVariants.reduce((sum, variant) => sum + Math.max(0, Number(variant.percent) || 0), 0);
                const usedIds = new Set([selectedTerrain.mapping[activeMask], ...maskVariants.map(variant => variant.entryId)]);
                const pickerEntries = atlasEntries.filter(entry => !usedIds.has(entry.id));
                const setMaskVariants = (nextList: Msx2BitmapAutoTerrainVariant[]) => {
                  updateTerrain(selectedTerrain.id, terrain => {
                    const nextVariants = { ...(terrain.variants || {}) };
                    if (nextList.length > 0) nextVariants[activeMask] = nextList;
                    else delete nextVariants[activeMask];
                    return { ...terrain, variants: Object.keys(nextVariants).length > 0 ? nextVariants : undefined };
                  });
                };
                return (
                  <div className="rounded border border-msx-border bg-msx-bgcolor p-2 space-y-1.5">
                    <div className="text-[0.65rem] font-semibold text-msx-highlight">Variantes aleatorias</div>
                    <select
                      value={activeMask}
                      onChange={event => { setVariantMask(Number(event.target.value)); setIsVariantPickerOpen(false); }}
                      className="w-full rounded border border-msx-border bg-msx-panelbg px-1 py-0.5 text-[0.65rem] text-msx-textprimary"
                    >
                      {mappedMasks.map(mask => (
                        <option key={mask} value={mask}>
                          {describeAutotileMask(mask, selectedTerrain.template)} — m{mask}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2 text-[0.6rem] text-msx-textsecondary">
                      <div className="h-6 w-6 shrink-0 overflow-hidden border border-black/70 bg-black">
                        {baseEntry && <AtlasTilePreview entry={baseEntry} atlasPixels={atlasPixels} slots={slots} />}
                      </div>
                      <span>Base: {Math.max(0, 100 - totalPercent)}%</span>
                      {totalPercent > 100 && <span className="text-red-300">¡suma {totalPercent}%!</span>}
                    </div>
                    {maskVariants.map((variant, index) => {
                      const entry = atlasEntries.find(item => item.id === variant.entryId);
                      return (
                        <div key={`${variant.entryId}_${index}`} className="flex items-center gap-2">
                          <div className="h-6 w-6 shrink-0 overflow-hidden border border-black/70 bg-black">
                            {entry && <AtlasTilePreview entry={entry} atlasPixels={atlasPixels} slots={slots} />}
                          </div>
                          <span className="min-w-0 flex-1 truncate text-[0.6rem] text-msx-textprimary">{entry?.name || variant.entryId}</span>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={variant.percent}
                            onChange={event => {
                              const percent = clampInt(event.target.value, 1, 100, variant.percent);
                              setMaskVariants(maskVariants.map((item, itemIndex) => itemIndex === index ? { ...item, percent } : item));
                            }}
                            className="w-12 rounded border border-msx-border bg-msx-panelbg px-1 py-0.5 text-right text-[0.65rem] text-msx-textprimary"
                          />
                          <span className="text-[0.6rem] text-msx-textsecondary">%</span>
                          <button
                            type="button"
                            className="shrink-0 rounded border border-msx-border px-1 text-[0.65rem] text-msx-textsecondary hover:border-red-400 hover:text-red-300"
                            title="Quitar variante"
                            onClick={() => setMaskVariants(maskVariants.filter((_item, itemIndex) => itemIndex !== index))}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                    <Button size="sm" variant="ghost" onClick={() => setIsVariantPickerOpen(open => !open)}>
                      {isVariantPickerOpen ? 'Cerrar selector' : '+ Añadir variante…'}
                    </Button>
                    {isVariantPickerOpen && (
                      pickerEntries.length === 0 ? (
                        <div className="text-[0.6rem] text-msx-textsecondary">No quedan tiles del atlas disponibles; importa o dibuja el tile variante primero.</div>
                      ) : (
                        <div className="max-h-32 overflow-y-auto pr-1">
                          <div className="grid grid-cols-4 gap-1">
                            {pickerEntries.map(entry => (
                              <button
                                key={entry.id}
                                type="button"
                                className="rounded border border-msx-border bg-black p-0.5 hover:border-msx-highlight"
                                title={`Añadir "${entry.name}" como variante (20%)`}
                                onClick={() => {
                                  setMaskVariants([...maskVariants, { entryId: entry.id, percent: 20 }]);
                                  setIsVariantPickerOpen(false);
                                }}
                              >
                                <div className="h-8 w-full overflow-hidden">
                                  <AtlasTilePreview entry={entry} atlasPixels={atlasPixels} slots={slots} />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                    <div className="text-[0.55rem] text-msx-textsecondary">
                      Se sortea al pintar una celda nueva; curar bordes no re-sortea. Borra y repinta para variar.
                    </div>
                  </div>
                );
              })()}
            </div>
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

              <div>
                <div className="text-[0.7rem] text-msx-highlight mb-1">Boss (biblioteca)</div>
                {bossLibraryAssets.length === 0 ? (
                  <div className="text-[0.6rem] text-msx-textsecondary">No hay assets msx2boss en el proyecto.</div>
                ) : (
                  <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                    {bossLibraryAssets.map(asset => (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => { setPlaceable({ kind: 'boss', id: asset.id }); setActiveLayer('objects'); }}
                        className={`w-full text-left text-xs rounded px-2 py-1 border ${placeable.kind === 'boss' && placeable.id === asset.id ? 'border-msx-highlight bg-msx-panelbg text-msx-highlight' : 'border-msx-border text-msx-textsecondary hover:border-msx-highlight'}`}
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

              <div className="border-t border-msx-border pt-2">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="text-[0.7rem] text-msx-highlight">Llaves / items ({keyItems.length})</div>
                  <button
                    type="button"
                    onClick={addKeyItemDefinition}
                    className="rounded border border-msx-border px-2 py-0.5 text-[0.65rem] text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight"
                    title="Crear una llave/item para pickups y puertas"
                  >
                    + Key
                  </button>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {keyItems.map(item => (
                    <div key={item.id} className="rounded border border-msx-border bg-msx-bgcolor/40 p-2 space-y-1">
                      <div className="flex items-center gap-1">
                        <input
                          value={item.name}
                          onChange={event => updateKeyItemDefinition(item.id, { name: event.target.value })}
                          className="min-w-0 flex-1 rounded border border-msx-border bg-msx-bgcolor px-1 py-0.5 text-xs text-msx-textprimary"
                          title={item.id}
                        />
                        <button
                          type="button"
                          onClick={() => deleteKeyItemDefinition(item.id)}
                          className="text-msx-danger hover:text-msx-highlight"
                          title="Borrar llave/item"
                        >
                          x
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[0.65rem] text-msx-textsecondary">
                        <label className="flex items-center gap-1">
                          Bit
                          <select
                            value={clampInt(Number(item.bitIndex), 0, 7, 0)}
                            onChange={event => updateKeyItemDefinition(item.id, { bitIndex: Number(event.target.value) })}
                            className="min-w-0 flex-1 rounded border border-msx-border bg-msx-bgcolor px-1 py-0.5 text-msx-textprimary"
                          >
                            {Array.from({ length: 8 }, (_unused, i) => <option key={i} value={i}>{i}</option>)}
                          </select>
                        </label>
                        <label className="flex items-center gap-1">
                          Color
                          <select
                            value={clampInt(Number(item.color ?? 14), 0, 15, 14)}
                            onChange={event => updateKeyItemDefinition(item.id, { color: Number(event.target.value) })}
                            className="min-w-0 flex-1 rounded border border-msx-border bg-msx-bgcolor px-1 py-0.5 text-msx-textprimary"
                          >
                            {Array.from({ length: 16 }, (_unused, i) => <option key={i} value={i}>{i}</option>)}
                          </select>
                        </label>
                        <label className="flex items-center justify-end gap-1">
                          <input
                            type="checkbox"
                            checked={item.persistent !== false}
                            onChange={event => updateKeyItemDefinition(item.id, { persistent: event.target.checked })}
                          />
                          Persist
                        </label>
                      </div>
                      <div className="truncate text-[0.6rem] text-msx-textsecondary">id: {item.id}</div>
                    </div>
                  ))}
                  {keyItems.length === 0 && (
                    <div className="rounded border border-msx-border px-2 py-1 text-[0.6rem] text-msx-textsecondary">
                      Crea llaves/items aqui y asignales collectibles o puertas.
                    </div>
                  )}
                </div>
              </div>

              {selectedPlacedEntity && (
                <div className="border-t border-msx-border pt-2 space-y-2">
                  <div className="text-[0.7rem] text-msx-highlight">Objeto seleccionado</div>
                  <div className="rounded border border-msx-border bg-msx-bgcolor/40 p-2 text-[0.65rem] text-msx-textsecondary">
                    <div className="truncate text-xs text-msx-textprimary">{selectedPlacedEntity.name}</div>
                    <div>{selectedPlacedEntity.kind} @ {selectedPlacedEntity.position?.x},{selectedPlacedEntity.position?.y}</div>
                  </div>

                  {selectedPlacedEntity.kind === 'mushroom' && (
                    <div className="rounded border border-msx-border bg-msx-bgcolor/40 p-2 space-y-2">
                      <div className="text-[0.7rem] text-msx-highlight">Seta fosforescente</div>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Tile del atlas
                        <select
                          value={selectedMushroomBitmapEntryId}
                          onChange={event => updatePlacedEntityParams(selectedPlacedEntity.id, {
                            glowMushroomAtlasEntryId: event.target.value || undefined,
                          })}
                          disabled={mushroomBitmapOptions.length === 0}
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary disabled:opacity-60"
                          aria-label="Tile del atlas de la seta fosforescente"
                        >
                          <option value="">(sin tile; solo marcador del editor)</option>
                          {mushroomBitmapOptions.map(entry => (
                            <option key={entry.id} value={entry.id}>{entry.name} ({entry.w}x{entry.h})</option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        disabled={!selectedAtlasEntry || Number(selectedAtlasEntry.w) < GRID || Number(selectedAtlasEntry.h) < GRID}
                        onClick={() => selectedAtlasEntry && updatePlacedEntityParams(selectedPlacedEntity.id, {
                          glowMushroomAtlasEntryId: selectedAtlasEntry.id,
                        })}
                        className="w-full rounded border border-msx-border px-2 py-1 text-[0.65rem] text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Usar tile seleccionado del atlas
                      </button>
                      <div className="text-[0.6rem] text-msx-textsecondary leading-tight">
                        Se dibujan los primeros 16×16 px. La recogida siempre usa la celda 16×16 de la entidad, independientemente del tile.
                      </div>
                    </div>
                  )}

                  {(selectedPlacedEntity.kind === 'enemy' || selectedPlacedEntity.kind === 'hazard') && (
                    <div className="rounded border border-msx-border bg-msx-bgcolor/40 p-2 space-y-2">
                      <div className="text-[0.7rem] text-msx-highlight">Solo los ojos en la oscuridad</div>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Color de los ojos
                        <select
                          value={String(Number(selectedPlacedEntity.params?.darkEyesColor) || 0)}
                          onChange={event => updatePlacedEntityParams(selectedPlacedEntity.id, {
                            darkEyesColor: Number(event.target.value) || undefined,
                          })}
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                          aria-label="Color de los ojos visibles en la oscuridad"
                        >
                          <option value="0">(desactivado: se ve entero siempre)</option>
                          {Array.from({ length: 15 }, (_unused, index) => index + 1).map(colorIndex => (
                            <option key={colorIndex} value={colorIndex}>Color {colorIndex}</option>
                          ))}
                        </select>
                      </label>
                      <div className="text-[0.6rem] text-msx-textsecondary leading-tight">
                        En salas oscuras solo se dibujan las lineas del sprite pintadas con ese color;
                        el resto del cuerpo aparece cuando le llega la luz del jugador o la de una bala
                        con farol. El color de un sprite en modo 2 es por LINEA, asi que esas filas no
                        pueden llevar ningun otro pixel del bicho.
                      </div>
                    </div>
                  )}

                  {isSelectedCarryable && (
                    <div className="rounded border border-msx-border bg-msx-bgcolor/40 p-2 space-y-2">
                      <div className="text-[0.7rem] text-msx-highlight">Render del carryable</div>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Tipo de render
                        <select
                          value={selectedCarryableRenderMode}
                          onChange={event => {
                            const nextMode = event.target.value === 'bitmap_sprite' ? 'bitmap_sprite' : 'hardware_sprite';
                            updatePlacedEntityCarryableVisual(
                              selectedPlacedEntity.id,
                              nextMode,
                              nextMode === 'hardware_sprite'
                                ? { bitmapAtlasEntryId: '' }
                                : undefined,
                            );
                          }}
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                          aria-label="Tipo de render del carryable"
                        >
                          <option value="hardware_sprite">Hardware sprite (4 colores)</option>
                          <option value="bitmap_sprite">Bitmap atlas (16 colores)</option>
                        </select>
                      </label>

                      {selectedCarryableRenderMode === 'hardware_sprite' ? (
                        <label className="block text-[0.65rem] text-msx-textsecondary">
                          Sprite hardware
                          <select
                            value={String(selectedPlacedEntity.components?.msx2_hardware_sprite?.msx2SpriteAssetId || '')}
                            onChange={event => updatePlacedEntityCarryableVisual(
                              selectedPlacedEntity.id,
                              'hardware_sprite',
                              { spriteAssetId: event.target.value, bitmapAtlasEntryId: '' },
                            )}
                            className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                            aria-label="Sprite hardware del carryable"
                          >
                            <option value="">(placeholder / tile de mapa)</option>
                            {spriteLibraryAssets.map(asset => (
                              <option key={asset.id} value={asset.id}>{asset.name}</option>
                            ))}
                          </select>
                        </label>
                      ) : (
                        <label className="block text-[0.65rem] text-msx-textsecondary">
                          Bitmap de l’atlas
                          <select
                            value={selectedCarryableBitmapEntryId}
                            onChange={event => {
                              const entryId = event.target.value;
                              if (!entryId) return;
                              updatePlacedEntityCarryableVisual(
                                selectedPlacedEntity.id,
                                'bitmap_sprite',
                                { bitmapAtlasEntryId: entryId },
                              );
                            }}
                            disabled={carryableBitmapOptions.length === 0}
                            className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary disabled:opacity-60"
                            aria-label="Bitmap atlas del carryable"
                          >
                            {carryableBitmapOptions.length === 0 ? (
                              <option value="">(cap entrada 16x16 a l’atlas)</option>
                            ) : (
                              <>
                                <option value="">Selecciona una entrada...</option>
                                {carryableBitmapOptions.map(entry => (
                                  <option key={entry.id} value={entry.id}>{entry.name} ({entry.w}x{entry.h})</option>
                                ))}
                              </>
                            )}
                          </select>
                        </label>
                      )}
                      <div className="text-[0.6rem] text-msx-textsecondary leading-tight">
                        Bitmap atlas: 16 colors i moviment píxel a píxel. Hardware sprite: més ràpid però limitat a la paleta del sprite.
                      </div>
                    </div>
                  )}

                  {['enemy', 'hazard', 'custom', 'platform'].includes(selectedPlacedEntity.kind) && selectedPatrolBounds && (
                    <div className="rounded border border-msx-border bg-msx-bgcolor/40 p-2 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[0.7rem] text-msx-highlight">Ruta de patrulla</div>
                        {patrolPointPicker?.entityId === selectedPlacedEntity.id && (
                          <span className="text-[0.6rem] text-msx-highlight">
                            Click mapa: {patrolPointPicker.point === 'start' ? 'W1' : 'W2'}
                          </span>
                        )}
                      </div>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Movimiento
                        <select
                          value={selectedMovementMode}
                          onChange={event => updatePlacedEntityMovement(selectedPlacedEntity.id, { movement: event.target.value, boundsUnit: 'px' })}
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                        >
                          <option value="static">Static</option>
                          <option value="patrolX">Patrol X</option>
                          {selectedPlacedEntity.kind !== 'platform' && <option value="patrolChaseX">Patrol chase X</option>}
                          {selectedPlacedEntity.kind !== 'platform' && <option value="walkerGravity">Walker gravity</option>}
                          {selectedPlacedEntity.kind !== 'platform' && <option value="slimeCeiling">Slime ceiling (suelo↔techo)</option>}
                          {selectedPlacedEntity.kind !== 'platform' && <option value="gearWheel">GearWheel (emisor)</option>}
                          {selectedPlacedEntity.kind !== 'platform' && <option value="flyBounce8">Vuelo 8 dir (murciélago)</option>}
                          <option value="patrolY">Patrol Y</option>
                          {selectedPlacedEntity.kind !== 'platform' && <option value="walkerEdge">Walker edge</option>}
                          {selectedPlacedEntity.kind !== 'platform' && <option value="flyerSine">Flyer sine</option>}
                          {selectedPlacedEntity.kind !== 'platform' && <option value="ballBounce">Ball bounce</option>}
                          {selectedPlacedEntity.kind !== 'platform' && <option value="chaseH">Chase H</option>}
                        </select>
                      </label>
                      <div className="grid grid-cols-[auto_1fr_1fr_auto] items-end gap-1 text-[0.65rem] text-msx-textsecondary">
                        <span className="pb-1 text-msx-highlight">W1</span>
                        <label>
                          X
                          <input
                            type="number"
                            min={0}
                            max={SCREEN_W - 1}
                            value={selectedPatrolBounds.minX}
                            onChange={event => updatePlacedEntityMovement(selectedPlacedEntity.id, { boundsUnit: 'px', minX: clampScreenPixelX(event.target.value) })}
                            className="mt-0.5 w-full rounded border border-msx-border bg-msx-bgcolor px-1 py-0.5 text-xs text-msx-textprimary"
                          />
                        </label>
                        <label>
                          Y
                          <input
                            type="number"
                            min={0}
                            max={roomHeight - 1}
                            value={selectedPatrolBounds.minY}
                            onChange={event => updatePlacedEntityMovement(selectedPlacedEntity.id, { boundsUnit: 'px', minY: clampScreenPixelY(event.target.value, roomHeight) })}
                            className="mt-0.5 w-full rounded border border-msx-border bg-msx-bgcolor px-1 py-0.5 text-xs text-msx-textprimary"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => { setActiveLayer('objects'); setPatrolPointPicker({ entityId: selectedPlacedEntity.id, point: 'start' }); }}
                          className="rounded border border-msx-border px-1.5 py-1 text-[0.6rem] text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight"
                          title="Pincha en el mapa para fijar W1"
                        >
                          Pick
                        </button>
                        <span className="pb-1 text-msx-highlight">W2</span>
                        <label>
                          X
                          <input
                            type="number"
                            min={0}
                            max={SCREEN_W - 1}
                            value={selectedPatrolBounds.maxX}
                            onChange={event => updatePlacedEntityMovement(selectedPlacedEntity.id, { boundsUnit: 'px', maxX: clampScreenPixelX(event.target.value) })}
                            className="mt-0.5 w-full rounded border border-msx-border bg-msx-bgcolor px-1 py-0.5 text-xs text-msx-textprimary"
                          />
                        </label>
                        <label>
                          Y
                          <input
                            type="number"
                            min={0}
                            max={roomHeight - 1}
                            value={selectedPatrolBounds.maxY}
                            onChange={event => updatePlacedEntityMovement(selectedPlacedEntity.id, { boundsUnit: 'px', maxY: clampScreenPixelY(event.target.value, roomHeight) })}
                            className="mt-0.5 w-full rounded border border-msx-border bg-msx-bgcolor px-1 py-0.5 text-xs text-msx-textprimary"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => { setActiveLayer('objects'); setPatrolPointPicker({ entityId: selectedPlacedEntity.id, point: 'end' }); }}
                          className="rounded border border-msx-border px-1.5 py-1 text-[0.6rem] text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight"
                          title="Pincha en el mapa para fijar W2"
                        >
                          Pick
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[0.65rem] text-msx-textsecondary">
                        <label>
                          Dir
                          <select
                            value={Number(selectedPlacedEntity.components?.msx2_movement?.direction ?? selectedPlacedEntity.params?.direction ?? 1) < 0 ? -1 : 1}
                            onChange={event => updatePlacedEntityMovement(selectedPlacedEntity.id, { direction: Number(event.target.value) })}
                            className="mt-0.5 w-full rounded border border-msx-border bg-msx-bgcolor px-1 py-0.5 text-xs text-msx-textprimary"
                          >
                            <option value={1}>+</option>
                            <option value={-1}>-</option>
                          </select>
                        </label>
                        <label>
                          Velocidad
                          <input
                            type="number"
                            min={1}
                            max={15}
                            value={clampInt(selectedPlacedEntity.components?.msx2_movement?.speed ?? selectedPlacedEntity.params?.speed, 1, 15, 2)}
                            onChange={event => updatePlacedEntityMovement(selectedPlacedEntity.id, { speed: clampInt(event.target.value, 1, 15, 2) })}
                            className="mt-0.5 w-full rounded border border-msx-border bg-msx-bgcolor px-1 py-0.5 text-xs text-msx-textprimary"
                          />
                        </label>
                      </div>
                      {selectedMovementMode === 'slimeCeiling' && (
                        <label className="block text-[0.65rem] text-msx-textsecondary">
                          Distancia antes de saltar (px)
                          <input
                            type="number"
                            min={4}
                            max={255}
                            value={clampInt(selectedPlacedEntity.components?.msx2_movement?.travelPx ?? selectedPlacedEntity.params?.travelPx, 4, 255, 48)}
                            onChange={event => updatePlacedEntityMovement(selectedPlacedEntity.id, { travelPx: clampInt(event.target.value, 4, 255, 48) })}
                            className="mt-0.5 w-full rounded border border-msx-border bg-msx-bgcolor px-1 py-0.5 text-xs text-msx-textprimary"
                          />
                        </label>
                      )}
                      {selectedMovementMode === 'flyBounce8' && (
                        <label className="block text-[0.65rem] text-msx-textsecondary">
                          Cambio de rumbo cada (px)
                          <input
                            type="number"
                            min={1}
                            max={255}
                            value={clampInt(selectedPlacedEntity.components?.msx2_movement?.turnPx ?? selectedPlacedEntity.params?.turnPx, 1, 255, 100)}
                            onChange={event => updatePlacedEntityMovement(selectedPlacedEntity.id, { turnPx: clampInt(event.target.value, 1, 255, 100) })}
                            className="mt-0.5 w-full rounded border border-msx-border bg-msx-bgcolor px-1 py-0.5 text-xs text-msx-textprimary"
                          />
                        </label>
                      )}
                      {selectedMovementMode === 'gearWheel' && (
                        <label className="block text-[0.65rem] text-msx-textsecondary">
                          Respawn tras desaparecer (segundos)
                          <input
                            type="number"
                            min={1}
                            max={255}
                            value={clampInt(selectedPlacedEntity.components?.msx2_movement?.respawnSeconds ?? selectedPlacedEntity.params?.respawnSeconds, 1, 255, 3)}
                            onChange={event => updatePlacedEntityMovement(selectedPlacedEntity.id, { respawnSeconds: clampInt(event.target.value, 1, 255, 3) })}
                            className="mt-0.5 w-full rounded border border-msx-border bg-msx-bgcolor px-1 py-0.5 text-xs text-msx-textprimary"
                          />
                        </label>
                      )}
                      <div className="text-[0.6rem] text-msx-textsecondary">
                        {selectedMovementMode === 'slimeCeiling'
                          ? 'Slime ceiling: se arrastra por el suelo, cada N px salta al techo y se pega boca abajo (flip automático), se arrastra de nuevo y cae al suelo. Gira en paredes y en W1.X/W2.X.'
                          : selectedMovementMode === 'gearWheel'
                            ? 'GearWheel: cae desde el emisor, rueda al tocar suelo, invierte en paredes y desaparece al tocar una celda Exit enemy (behavior=4). Si no hay salida, queda detenida y reaparece tras el tiempo indicado.'
                            : selectedMovementMode === 'flyBounce8'
                              ? 'Vuelo 8 dir: revolotea en una de las 8 direcciones sin mirar los tiles, solo rebota en los bordes de la sala y cada N px sortea un rumbo nuevo. Ignora W1/W2: sus limites son la pantalla entera.'
                            : 'Coordenadas en pixeles. Patrol chase X detecta al player dentro de W1.X/W2.X, corre a 2 px/frame y no sale de ese tramo.'}
                      </div>
                    </div>
                  )}

                  {selectedPlacedEntity.kind === 'boss' && (() => {
                    const boundId = String(selectedPlacedEntity.params?.bossId || selectedPlacedEntity.params?.bossDefinitionId || '');
                    const boundAsset = bossLibraryAssets.find(asset => asset.id === boundId);
                    const inlineStamp = String(selectedPlacedEntity.params?.bossStampAssetId || '').trim();
                    const definitionStamp = String((boundAsset?.data as any)?.bossStampAssetId || '').trim();
                    const bodyStamp = inlineStamp || definitionStamp;
                    return (
                      <div className="rounded border border-msx-border bg-msx-bgcolor/40 p-2 space-y-2">
                        <div className="text-[0.7rem] text-msx-highlight">Boss</div>
                        <label className="block text-[0.65rem] text-msx-textsecondary">
                          Definición (asset msx2boss)
                          <select
                            value={boundId}
                            onChange={event => updatePlacedEntityParams(selectedPlacedEntity.id, { bossId: event.target.value || undefined })}
                            className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                          >
                            <option value="">(sin vincular)</option>
                            {bossLibraryAssets.map(asset => (
                              <option key={asset.id} value={asset.id}>{asset.name}</option>
                            ))}
                          </select>
                        </label>
                        {bodyStamp ? (
                          <div className="text-[0.6rem] text-msx-textsecondary leading-tight">
                            Cuerpo: stamp <span className="text-msx-highlight">{bodyStamp}</span>
                            {inlineStamp ? ' (override en esta room)' : ' (de la definición)'}.
                          </div>
                        ) : (
                          <div className="text-[0.6rem] text-msx-danger leading-tight">
                            Sin cuerpo: elige una definición con `bossStampAssetId`, o el boss no se dibujará
                            (el generador lo desactiva en esta room).
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {selectedPlacedEntity.kind === 'platform_shaft' && (() => {
                    const shaft = (selectedPlacedEntity.components?.msx2_platform_shaft || {}) as Record<string, any>;
                    const path: string[] = Array.isArray(shaft.path) ? shaft.path : [];
                    const lastSlot = Math.max(0, path.length - 1);
                    const roomName = (id: string) => bitmapRooms.find(r => r.id === id)?.name || '(sala borrada)';
                    const clampSlot = (v: any) => clampInt(v, 0, lastSlot, 0);
                    const clampY = (v: any) => clampInt(v, 0, 191, 0);
                    const bottomSlot = clampSlot(shaft.bottomSlot);
                    const topSlot = clampSlot(shaft.topSlot);
                    const bottomY = clampY(shaft.bottomY ?? 176);
                    const topY = clampY(shaft.topY ?? 16);
                    // Read-out only: height above the very bottom of the shaft, so the
                    // author can sanity-check a long travel at a glance. The ROM gets
                    // the (slot, Y) pairs, never this number.
                    const globalUp = (slot: number, y: number) => slot * 192 + (191 - y);
                    const setPath = (next: string[]) => {
                      const cap = Math.max(0, next.length - 1);
                      updatePlacedEntityShaft(selectedPlacedEntity.id, {
                        path: next,
                        bottomSlot: Math.min(bottomSlot, cap),
                        topSlot: Math.min(topSlot, cap),
                        startSlot: Math.min(clampSlot(shaft.startSlot), cap),
                      });
                    };
                    const move = (index: number, delta: number) => {
                      const next = [...path];
                      const target = index + delta;
                      if (target < 0 || target >= next.length) return;
                      [next[index], next[target]] = [next[target], next[index]];
                      setPath(next);
                    };
                    const slotSelect = (label: string, slotVal: number, yVal: number, slotKey: string, yKey: string) => (
                      <div className="space-y-0.5">
                        <div className="text-[0.6rem] text-msx-textsecondary">{label}</div>
                        <div className="flex gap-1">
                          <select
                            value={slotVal}
                            onChange={e => updatePlacedEntityShaft(selectedPlacedEntity.id, { [slotKey]: clampSlot(e.target.value) })}
                            className="flex-1 rounded border border-msx-border bg-msx-bgcolor px-1 py-0.5 text-[0.65rem] text-msx-textprimary"
                            disabled={!path.length}
                          >
                            {path.map((id, i) => <option key={id + i} value={i}>{i} · {roomName(id)}</option>)}
                          </select>
                          <input
                            type="number"
                            min={0}
                            max={191}
                            value={yVal}
                            onChange={e => updatePlacedEntityShaft(selectedPlacedEntity.id, { [yKey]: clampY(e.target.value) })}
                            className="w-16 rounded border border-msx-border bg-msx-bgcolor px-1 py-0.5 text-[0.65rem] text-msx-textprimary"
                            title="Y dentro de esa pantalla (0 = arriba, 191 = abajo)"
                          />
                        </div>
                      </div>
                    );
                    return (
                      <div className="rounded border border-msx-border bg-msx-bgcolor/40 p-2 space-y-2">
                        <div className="text-[0.7rem] text-msx-highlight">Pozo multi-pantalla</div>
                        <div className="text-[0.6rem] text-msx-textsecondary leading-tight">
                          Una sola cabina recorre todas las pantallas del trayecto. Se coloca UNA vez:
                          no hace falta poner una plataforma en cada sala. Sigue moviéndose aunque el
                          jugador esté en otra pantalla.
                        </div>

                        <label className="block text-[0.65rem] text-msx-textsecondary">
                          Sprite de la cabina (16x16 o 32x16)
                          <select
                            value={String(selectedPlacedEntity.components?.msx2_hardware_sprite?.msx2SpriteAssetId || '')}
                            onChange={event => updatePlacedEntityHardwareSprite(selectedPlacedEntity.id, event.target.value)}
                            className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                          >
                            <option value="">(placeholder)</option>
                            {spriteLibraryAssets.map(asset => (
                              <option key={asset.id} value={asset.id}>{asset.name}</option>
                            ))}
                          </select>
                        </label>
                        <div className="text-[0.6rem] text-msx-textsecondary leading-tight">
                          La anchura de la cabina (16 o 32 px) sale del sprite elegido. Sin sprite se
                          exporta un placeholder.
                        </div>

                        <div className="space-y-1">
                          <div className="text-[0.65rem] text-msx-textprimary">Trayecto (slot 0 = abajo)</div>
                          {!path.length && (
                            <div className="text-[0.6rem] text-msx-danger leading-tight">
                              Sin salas: un pozo necesita al menos 2. El generador lo descarta.
                            </div>
                          )}
                          {path.map((id, index) => (
                            <div key={id + index} className="flex items-center gap-1">
                              <span className="w-10 shrink-0 text-[0.6rem] text-msx-textsecondary">
                                slot {index}
                              </span>
                              <span className="flex-1 truncate text-[0.65rem] text-msx-textprimary" title={roomName(id)}>
                                {roomName(id)}
                              </span>
                              <button
                                type="button"
                                onClick={() => move(index, 1)}
                                disabled={index === path.length - 1}
                                className="rounded border border-msx-border px-1 text-[0.6rem] text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight disabled:opacity-30"
                                title="Subir en el pozo"
                              >↑</button>
                              <button
                                type="button"
                                onClick={() => move(index, -1)}
                                disabled={index === 0}
                                className="rounded border border-msx-border px-1 text-[0.6rem] text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight disabled:opacity-30"
                                title="Bajar en el pozo"
                              >↓</button>
                              <button
                                type="button"
                                onClick={() => setPath(path.filter((_, i) => i !== index))}
                                className="rounded border border-msx-border px-1 text-[0.6rem] text-msx-danger hover:border-msx-danger"
                                title="Quitar del trayecto"
                              >×</button>
                            </div>
                          ))}
                          <select
                            value=""
                            onChange={e => { if (e.target.value) setPath([...path, e.target.value]); }}
                            className="w-full rounded border border-msx-border bg-msx-bgcolor px-1 py-0.5 text-[0.65rem] text-msx-textprimary"
                          >
                            <option value="">+ Añadir sala al trayecto…</option>
                            {bitmapRooms.map(room => (
                              <option key={room.id} value={room.id}>{room.name}</option>
                            ))}
                          </select>
                        </div>

                        {path.length > 1 && (
                          <>
                            <div className="space-y-1">
                              {slotSelect('Extremo inferior (pantalla · Y)', bottomSlot, bottomY, 'bottomSlot', 'bottomY')}
                              {slotSelect('Extremo superior (pantalla · Y)', topSlot, topY, 'topSlot', 'topY')}
                              {slotSelect('Arranque (pantalla · Y)', clampSlot(shaft.startSlot), clampY(shaft.startY ?? 176), 'startSlot', 'startY')}
                            </div>
                            <div className="text-[0.6rem] text-msx-textsecondary leading-tight">
                              Recorrido: {Math.abs(globalUp(topSlot, topY) - globalUp(bottomSlot, bottomY))} px
                              sobre {path.length} pantallas ({path.length * 192} px de pozo).
                            </div>
                            {globalUp(topSlot, topY) <= globalUp(bottomSlot, bottomY) && (
                              <div className="text-[0.6rem] text-msx-danger leading-tight">
                                El extremo superior no está por encima del inferior: la cabina no se moverá.
                                Recuerda que dentro de una pantalla, Y menor = más arriba.
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-1">
                              <label className="block text-[0.6rem] text-msx-textsecondary">
                                Velocidad (px/frame)
                                <input
                                  type="number"
                                  min={1}
                                  max={4}
                                  value={clampInt(shaft.speed, 1, 4, 1)}
                                  onChange={e => updatePlacedEntityShaft(selectedPlacedEntity.id, { speed: clampInt(e.target.value, 1, 4, 1) })}
                                  className="mt-0.5 w-full rounded border border-msx-border bg-msx-bgcolor px-1 py-0.5 text-xs text-msx-textprimary"
                                />
                              </label>
                              <label className="block text-[0.6rem] text-msx-textsecondary">
                                Sentido inicial
                                <select
                                  value={Number(shaft.startDir) === 1 ? 1 : 0}
                                  onChange={e => updatePlacedEntityShaft(selectedPlacedEntity.id, { startDir: Number(e.target.value) === 1 ? 1 : 0 })}
                                  className="mt-0.5 w-full rounded border border-msx-border bg-msx-bgcolor px-1 py-0.5 text-xs text-msx-textprimary"
                                >
                                  <option value={0}>Subiendo</option>
                                  <option value={1}>Bajando</option>
                                </select>
                              </label>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}

                  {selectedPlacedEntity.kind === 'platform' && (
                    <div className="rounded border border-msx-border bg-msx-bgcolor/40 p-2 space-y-2">
                      <div className="text-[0.7rem] text-msx-highlight">Plataforma móvil</div>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Sprite (16x16 o 32x16)
                        <select
                          value={String(selectedPlacedEntity.components?.msx2_hardware_sprite?.msx2SpriteAssetId || '')}
                          onChange={event => updatePlacedEntityHardwareSprite(selectedPlacedEntity.id, event.target.value)}
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                        >
                          <option value="">(placeholder)</option>
                          {spriteLibraryAssets.map(asset => (
                            <option key={asset.id} value={asset.id}>{asset.name}</option>
                          ))}
                        </select>
                      </label>
                      <div className="text-[0.6rem] text-msx-textsecondary leading-tight">
                        One-way: el player la atraviesa desde abajo y aterriza encima; al posarse es transportado
                        con la plataforma (1 px/frame entre W1 y W2). La anchura (16 o 32 px) sale del sprite elegido.
                      </div>
                    </div>
                  )}

                  {selectedPlacedEntity.kind === 'collectible' && (
                    <div className="rounded border border-msx-border bg-msx-bgcolor/40 p-2 space-y-2">
                      <div className="text-[0.7rem] text-msx-highlight">Pickup de llave/item</div>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Item que entrega
                        <select
                          value={String(selectedPlacedEntity.params?.keyPickupId || '')}
                          onChange={event => updatePlacedEntityParams(selectedPlacedEntity.id, { keyPickupId: event.target.value || undefined })}
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                        >
                          <option value="">None</option>
                          {keyItems.map(item => (
                            <option key={item.id} value={item.id}>{item.name} (bit {clampInt(Number(item.bitIndex), 0, 7, 0)})</option>
                          ))}
                        </select>
                      </label>
                      {keyItems.length === 0 && (
                        <button
                          type="button"
                          onClick={addKeyItemDefinition}
                          className="w-full rounded border border-msx-border px-2 py-1 text-[0.65rem] text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight"
                        >
                          Crear primera llave/item
                        </button>
                      )}
                      {selectedPlacedEntity.params?.keyPickupId && (
                        <>
                          <label className="block text-[0.65rem] text-msx-textsecondary">
                            Precio (gemas)
                            <input
                              type="number"
                              min={0}
                              max={255}
                              value={clampInt(Number(selectedPlacedEntity.params?.keyPickupPrice), 0, 255, 0)}
                              onChange={event => updatePlacedEntityParams(selectedPlacedEntity.id, { keyPickupPrice: clampInt(Number(event.target.value), 0, 255, 0) || undefined })}
                              className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                            />
                          </label>
                          <div className="text-[0.6rem] text-msx-textsecondary">
                            0 = gratis (se recoge por contacto). Con precio, es un item de tienda: se compra pulsando ARRIBA encima si llevas suficientes gemas (contador HUD collectibles).
                          </div>
                          <div className="border-t border-msx-border pt-2 text-[0.7rem] text-msx-highlight">Tile de llave (atlas)</div>
                          <label className="block text-[0.65rem] text-msx-textsecondary">
                            Metatile de la llave
                            <select
                              value={String(selectedPlacedEntity.params?.keyPickupAtlasEntryId || '')}
                              onChange={event => updatePlacedEntityParams(selectedPlacedEntity.id, { keyPickupAtlasEntryId: event.target.value || undefined })}
                              className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                            >
                              <option value="">None (invisible)</option>
                              {atlasEntries.map(entry => (
                                <option key={entry.id} value={entry.id}>{entry.name} ({entry.w}x{entry.h})</option>
                              ))}
                            </select>
                          </label>
                          <button
                            type="button"
                            disabled={!selectedAtlasEntry}
                            onClick={() => selectedAtlasEntry && updatePlacedEntityParams(selectedPlacedEntity.id, { keyPickupAtlasEntryId: selectedAtlasEntry.id })}
                            className="w-full rounded border border-msx-border px-2 py-1 text-[0.65rem] text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight disabled:opacity-40"
                          >
                            Usar tile seleccionado
                          </button>
                          <div className="text-[0.6rem] text-msx-textsecondary">
                            Con tile asignado, la llave se dibuja al cargar la sala y se borra al recogerla (restaurando el fondo de la celda).
                          </div>
                        </>
                      )}
                      {!selectedPlacedEntity.params?.keyPickupId && !selectedPlacedEntity.params?.healAtlasEntryId && (
                        <>
                          <div className="border-t border-msx-border pt-2 text-[0.7rem] text-msx-highlight">Gema (skill collector_gems)</div>
                          <label className="block text-[0.65rem] text-msx-textsecondary">
                            Tile de gema (atlas)
                            <select
                              value={String(selectedPlacedEntity.params?.gemAtlasEntryId || '')}
                              onChange={event => updatePlacedEntityParams(selectedPlacedEntity.id, { gemAtlasEntryId: event.target.value || undefined })}
                              className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                            >
                              <option value="">None</option>
                              {atlasEntries.map(entry => (
                                <option key={entry.id} value={entry.id}>{entry.name} ({entry.w}x{entry.h})</option>
                              ))}
                            </select>
                          </label>
                          <button
                            type="button"
                            disabled={!selectedAtlasEntry}
                            onClick={() => selectedAtlasEntry && updatePlacedEntityParams(selectedPlacedEntity.id, { gemAtlasEntryId: selectedAtlasEntry.id })}
                            className="w-full rounded border border-msx-border px-2 py-1 text-[0.65rem] text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight disabled:opacity-40"
                          >
                            Usar tile seleccionado
                          </button>
                          <div className="text-[0.6rem] text-msx-textsecondary">
                            Con tile asignado (y sin llave) esta entidad es una gema: se dibuja al cargar la sala y el player la recoge si tiene la skill collector_gems.
                          </div>
                        </>
                      )}
                      {!selectedPlacedEntity.params?.keyPickupId && !selectedPlacedEntity.params?.gemAtlasEntryId && (
                        <>
                          <div className="border-t border-msx-border pt-2 text-[0.7rem] text-msx-highlight">Item de vida (+1 corazón)</div>
                          <label className="block text-[0.65rem] text-msx-textsecondary">
                            Tile del item (atlas)
                            <select
                              value={String(selectedPlacedEntity.params?.healAtlasEntryId || '')}
                              onChange={event => updatePlacedEntityParams(selectedPlacedEntity.id, { healAtlasEntryId: event.target.value || undefined })}
                              className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                            >
                              <option value="">None</option>
                              {atlasEntries.map(entry => (
                                <option key={entry.id} value={entry.id}>{entry.name} ({entry.w}x{entry.h})</option>
                              ))}
                            </select>
                          </label>
                          <button
                            type="button"
                            disabled={!selectedAtlasEntry}
                            onClick={() => selectedAtlasEntry && updatePlacedEntityParams(selectedPlacedEntity.id, { healAtlasEntryId: selectedAtlasEntry.id })}
                            className="w-full rounded border border-msx-border px-2 py-1 text-[0.65rem] text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight disabled:opacity-40"
                          >
                            Usar tile seleccionado
                          </button>
                          <div className="text-[0.6rem] text-msx-textsecondary">
                            Con tile asignado, tocarlo rellena 1 corazón (nunca por encima del Initial Health del Player Config) y borra la celda restaurando el fondo.
                            Con la vida llena NO se recoge: se queda en el suelo para volver a por él. No reaparece una vez cogido. No necesita ninguna skill.
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {selectedPlacedEntity.kind === 'door' && selectedDoorConfig && (
                    <div className="rounded border border-msx-border bg-msx-bgcolor/40 p-2 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[0.7rem] text-msx-highlight">Puerta bloqueada</div>
                        <label className="flex items-center gap-1 text-[0.65rem] text-msx-textsecondary">
                          <input
                            type="checkbox"
                            checked={selectedDoorConfig.enabled}
                            onChange={event => updateLockedDoorConfig(selectedPlacedEntity.id, {
                              enabled: event.target.checked,
                              requiredKeyId: selectedDoorConfig.requiredKeyId || keyItems[0]?.id || '',
                            })}
                          />
                          Activa
                        </label>
                      </div>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Requiere
                        <select
                          value={selectedDoorConfig.requiredKeyId || ''}
                          onChange={event => updateLockedDoorConfig(selectedPlacedEntity.id, { requiredKeyId: event.target.value })}
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                        >
                          <option value="">None</option>
                          {keyItems.map(item => (
                            <option key={item.id} value={item.id}>{item.name} (bit {clampInt(Number(item.bitIndex), 0, 7, 0)})</option>
                          ))}
                        </select>
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-[0.65rem] text-msx-textsecondary">
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={selectedDoorConfig.consumeKey}
                            onChange={event => updateLockedDoorConfig(selectedPlacedEntity.id, { consumeKey: event.target.checked })}
                          />
                          Consume
                        </label>
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={selectedDoorConfig.openOnce}
                            onChange={event => updateLockedDoorConfig(selectedPlacedEntity.id, { openOnce: event.target.checked })}
                          />
                          Open once
                        </label>
                        <label className="col-span-2 flex items-center gap-1" title="La puerta con Sala destino solo transporta al pulsar ARRIBA encima (estilo tienda); sin esto, transporta por contacto.">
                          <input
                            type="checkbox"
                            checked={Boolean(selectedDoorConfig.requireUpKey)}
                            onChange={event => updateLockedDoorConfig(selectedPlacedEntity.id, { requireUpKey: event.target.checked })}
                          />
                          Entrar con ARRIBA
                        </label>
                      </div>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Sala destino
                        <select
                          value={selectedDoorConfig.targetRoomId || ''}
                          onChange={event => updateLockedDoorConfig(selectedPlacedEntity.id, { targetRoomId: event.target.value, targetEntryId: '' })}
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                        >
                          <option value="">None</option>
                          {bitmapRooms.map(asset => (
                            <option key={asset.id} value={asset.id}>{asset.name}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Entry destino
                        <select
                          value={selectedDoorConfig.targetEntryId || ''}
                          onChange={event => updateLockedDoorConfig(selectedPlacedEntity.id, { targetEntryId: event.target.value })}
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                          disabled={!selectedDoorConfig.targetRoomId}
                        >
                          <option value="">Default</option>
                          {selectedDoorTargetEntries.map(entry => (
                            <option key={entry.id} value={entry.id}>{entry.id} ({entry.x},{entry.y})</option>
                          ))}
                        </select>
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        <label className="block text-[0.65rem] text-msx-textsecondary">
                          Metatile cerrado
                          <select
                            value={selectedDoorConfig.closedAtlasEntryId ? `atlas:${selectedDoorConfig.closedAtlasEntryId}` : ''}
                            onChange={event => selectDoorMetatile(selectedPlacedEntity.id, 'closedAtlasEntryId', event.target.value)}
                            className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                          >
                            <option value="">None</option>
                            {stampEntries.length > 0 && (
                              <optgroup label="Stamps bitmap">
                                {stampEntries.map(entry => (
                                  <option key={`closed-stamp-${entry.id}`} value={`stamp:${entry.id}`}>
                                    {entry.name} ({entry.stamp.columns * entry.stamp.tileWidth}x{entry.stamp.rows * entry.stamp.tileHeight})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            <optgroup label="Room atlas">
                            {atlasEntries.map(entry => (
                              <option key={entry.id} value={`atlas:${entry.id}`}>{entry.name} ({entry.w}x{entry.h})</option>
                            ))}
                            </optgroup>
                          </select>
                        </label>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={!selectedAtlasEntry}
                            onClick={() => selectedAtlasEntry && updateLockedDoorConfig(selectedPlacedEntity.id, { closedAtlasEntryId: selectedAtlasEntry.id })}
                            className="flex-1 rounded border border-msx-border px-2 py-1 text-[0.65rem] text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight disabled:opacity-40"
                          >
                            Usar tile seleccionado
                          </button>
                        </div>
                        <label className="block text-[0.65rem] text-msx-textsecondary">
                          Metatile abierto
                          <select
                            value={selectedDoorConfig.openAtlasEntryId ? `atlas:${selectedDoorConfig.openAtlasEntryId}` : ''}
                            onChange={event => selectDoorMetatile(selectedPlacedEntity.id, 'openAtlasEntryId', event.target.value)}
                            className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                          >
                            <option value="">None</option>
                            {stampEntries.length > 0 && (
                              <optgroup label="Stamps bitmap">
                                {stampEntries.map(entry => (
                                  <option key={`open-stamp-${entry.id}`} value={`stamp:${entry.id}`}>
                                    {entry.name} ({entry.stamp.columns * entry.stamp.tileWidth}x{entry.stamp.rows * entry.stamp.tileHeight})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            <optgroup label="Room atlas">
                            {atlasEntries.map(entry => (
                              <option key={entry.id} value={`atlas:${entry.id}`}>{entry.name} ({entry.w}x{entry.h})</option>
                            ))}
                            </optgroup>
                          </select>
                        </label>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={!selectedAtlasEntry}
                            onClick={() => selectedAtlasEntry && updateLockedDoorConfig(selectedPlacedEntity.id, { openAtlasEntryId: selectedAtlasEntry.id })}
                            className="flex-1 rounded border border-msx-border px-2 py-1 text-[0.65rem] text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight disabled:opacity-40"
                          >
                            Usar tile seleccionado
                          </button>
                        </div>
                      </div>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Mensaje si falta llave
                        <input
                          value={selectedDoorConfig.lockedMessage || ''}
                          onChange={event => updateLockedDoorConfig(selectedPlacedEntity.id, { lockedMessage: event.target.value })}
                          placeholder="LOCKED"
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                        />
                      </label>
                    </div>
                  )}

                  {selectedPlacedEntity.kind === 'door' && selectedWorldExitConfig && (
                    <div className="rounded border border-emerald-500/60 bg-emerald-950/20 p-2 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[0.7rem] text-emerald-300">Exit World (GameFlow)</div>
                        <label className="flex items-center gap-1 text-[0.65rem] text-msx-textsecondary">
                          <input
                            type="checkbox"
                            checked={selectedWorldExitConfig.enabled}
                            onChange={event => updateWorldExitConfig(selectedPlacedEntity.id, { enabled: event.target.checked })}
                          />
                          Activa
                        </label>
                      </div>
                      <div className="text-[0.6rem] text-msx-textsecondary leading-tight">
                        Al tocar su hitbox, el player sale del WorldLink actual y el GameFlow continua por su conexion por defecto.
                      </div>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Tile visual / puerta (atlas)
                        <select
                          value={selectedWorldExitConfig.atlasEntryId || ''}
                          onChange={event => updateWorldExitConfig(selectedPlacedEntity.id, { atlasEntryId: event.target.value || undefined })}
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                        >
                          <option value="">None (marcador X / pintado a mano)</option>
                          {atlasEntries.map(entry => (
                            <option key={entry.id} value={entry.id}>{entry.name} ({entry.w}x{entry.h})</option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        disabled={!selectedAtlasEntry}
                        onClick={() => selectedAtlasEntry && updateWorldExitConfig(selectedPlacedEntity.id, { atlasEntryId: selectedAtlasEntry.id })}
                        className="w-full rounded border border-msx-border px-2 py-1 text-[0.65rem] text-msx-textsecondary hover:border-emerald-400 hover:text-emerald-300 disabled:opacity-40"
                      >
                        Usar tile seleccionado
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="block text-[0.6rem] text-msx-textsecondary">
                          Offset X
                          <input type="number" min={0} max={31} value={selectedWorldExitConfig.offsetX ?? 0}
                            onChange={event => updateWorldExitConfig(selectedPlacedEntity.id, { offsetX: Math.max(0, Math.min(31, Math.floor(Number(event.target.value) || 0))) })}
                            className="mt-0.5 w-full rounded border border-msx-border bg-msx-bgcolor px-1 py-0.5 text-xs text-msx-textprimary" />
                        </label>
                        <label className="block text-[0.6rem] text-msx-textsecondary">
                          Offset Y
                          <input type="number" min={0} max={31} value={selectedWorldExitConfig.offsetY ?? 0}
                            onChange={event => updateWorldExitConfig(selectedPlacedEntity.id, { offsetY: Math.max(0, Math.min(31, Math.floor(Number(event.target.value) || 0))) })}
                            className="mt-0.5 w-full rounded border border-msx-border bg-msx-bgcolor px-1 py-0.5 text-xs text-msx-textprimary" />
                        </label>
                        <label className="block text-[0.6rem] text-msx-textsecondary">
                          Ancho hitbox
                          <input type="number" min={1} max={32} value={selectedWorldExitConfig.hitboxW ?? 16}
                            onChange={event => updateWorldExitConfig(selectedPlacedEntity.id, { hitboxW: Math.max(1, Math.min(32, Math.floor(Number(event.target.value) || 16))) })}
                            className="mt-0.5 w-full rounded border border-msx-border bg-msx-bgcolor px-1 py-0.5 text-xs text-msx-textprimary" />
                        </label>
                        <label className="block text-[0.6rem] text-msx-textsecondary">
                          Alto hitbox
                          <input type="number" min={1} max={32} value={selectedWorldExitConfig.hitboxH ?? 16}
                            onChange={event => updateWorldExitConfig(selectedPlacedEntity.id, { hitboxH: Math.max(1, Math.min(32, Math.floor(Number(event.target.value) || 16))) })}
                            className="mt-0.5 w-full rounded border border-msx-border bg-msx-bgcolor px-1 py-0.5 text-xs text-msx-textprimary" />
                        </label>
                      </div>
                    </div>
                  )}

                  {selectedPlacedEntity
                    && selectedPressureButtonConfig
                    && (
                      selectedPlacedEntity.params?.engine === 'pressureButton'
                      || selectedPlacedEntity.params?.pressureButton
                      || selectedPlacedEntity.components?.msx2_pressure_button
                    ) && (
                    <div className="rounded border border-msx-border bg-msx-bgcolor/40 p-2 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[0.7rem] text-msx-highlight">Polsador de pressió</div>
                        <label className="flex items-center gap-1 text-[0.65rem] text-msx-textsecondary">
                          <input
                            type="checkbox"
                            checked={selectedPressureButtonConfig.enabled}
                            onChange={event => updatePressureButtonConfig(selectedPlacedEntity.id, { enabled: event.target.checked })}
                          />
                          Actiu
                        </label>
                      </div>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Comporta / porta objectiu
                        <select
                          value={selectedPressureButtonConfig.targetDoorId || ''}
                          onChange={event => updatePressureButtonConfig(selectedPlacedEntity.id, { targetDoorId: event.target.value })}
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                        >
                          <option value="">None</option>
                          {pressureButtonTargetDoors.map(door => (
                            <option key={door.id} value={door.id}>
                              {door.name || door.id} ({door.position?.x ?? 0},{door.position?.y ?? 0})
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Qui el pot trepitjar
                        <select
                          value={selectedPressureButtonConfig.actors || 'playerAndEnemies'}
                          onChange={event => updatePressureButtonConfig(selectedPlacedEntity.id, { actors: event.target.value as Msx2PressureButtonConfig['actors'] })}
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                        >
                          <option value="playerAndEnemies">Player + enemics</option>
                          <option value="player">Només player</option>
                          <option value="enemies">Només enemics</option>
                        </select>
                      </label>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Tile sense prémer
                        <select
                          value={selectedPressureButtonConfig.atlasEntryId || ''}
                          onChange={event => updatePressureButtonConfig(selectedPlacedEntity.id, { atlasEntryId: event.target.value || undefined })}
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                        >
                          <option value="">None</option>
                          {atlasEntries.map(entry => (
                            <option key={entry.id} value={entry.id}>{entry.name} ({entry.w}x{entry.h})</option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        disabled={!selectedAtlasEntry}
                        onClick={() => selectedAtlasEntry && updatePressureButtonConfig(selectedPlacedEntity.id, { atlasEntryId: selectedAtlasEntry.id })}
                        className="w-full rounded border border-msx-border px-2 py-1 text-[0.65rem] text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight disabled:opacity-40"
                      >
                        Usar tile seleccionado como suelto
                      </button>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Tile premut
                        <select
                          value={selectedPressureButtonConfig.pressedAtlasEntryId || ''}
                          onChange={event => updatePressureButtonConfig(selectedPlacedEntity.id, { pressedAtlasEntryId: event.target.value || undefined })}
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                        >
                          <option value="">None</option>
                          {atlasEntries.map(entry => (
                            <option key={entry.id} value={entry.id}>{entry.name} ({entry.w}x{entry.h})</option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        disabled={!selectedAtlasEntry}
                        onClick={() => selectedAtlasEntry && updatePressureButtonConfig(selectedPlacedEntity.id, { pressedAtlasEntryId: selectedAtlasEntry.id })}
                        className="w-full rounded border border-msx-border px-2 py-1 text-[0.65rem] text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight disabled:opacity-40"
                      >
                        Usar tile seleccionado como premut
                      </button>
                      <label className="flex items-center gap-1 text-[0.65rem] text-msx-textsecondary">
                        <input
                          type="checkbox"
                          checked={selectedPressureButtonConfig.latch}
                          onChange={event => updatePressureButtonConfig(selectedPlacedEntity.id, { latch: event.target.checked })}
                        />
                        Queda obert després de prémer
                      </label>
                      {!selectedPressureButtonConfig.targetDoorId && (
                        <div className="text-[0.6rem] text-msx-warning">Sense porta objectiu: el polsador no tindrà efecte al ROM.</div>
                      )}
                    </div>
                  )}

                  {selectedPlacedEntity && selectedJumperConfig && (
                    <div className="rounded border border-msx-border bg-msx-bgcolor/40 p-2 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[0.7rem] text-msx-highlight">Saltador (muelle)</div>
                        <label className="flex items-center gap-1 text-[0.65rem] text-msx-textsecondary">
                          <input
                            type="checkbox"
                            checked={selectedJumperConfig.enabled}
                            onChange={event => updateJumperConfig(selectedPlacedEntity.id, { enabled: event.target.checked })}
                          />
                          Activo
                        </label>
                      </div>
                      <div className="text-[0.6rem] text-msx-textsecondary">
                        La celda es sólida: el player aterriza encima y sale disparado hacia arriba.
                      </div>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Tile normal (reposo)
                        <select
                          value={selectedJumperConfig.atlasEntryId || ''}
                          onChange={event => updateJumperConfig(selectedPlacedEntity.id, { atlasEntryId: event.target.value || undefined })}
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                        >
                          <option value="">None (tile pintado a mano)</option>
                          {atlasEntries.map(entry => (
                            <option key={entry.id} value={entry.id}>{entry.name} ({entry.w}x{entry.h})</option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        disabled={!selectedAtlasEntry}
                        onClick={() => selectedAtlasEntry && updateJumperConfig(selectedPlacedEntity.id, { atlasEntryId: selectedAtlasEntry.id })}
                        className="w-full rounded border border-msx-border px-2 py-1 text-[0.65rem] text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight disabled:opacity-40"
                      >
                        Usar tile seleccionado como reposo
                      </button>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Tile disparado
                        <select
                          value={selectedJumperConfig.triggeredAtlasEntryId || ''}
                          onChange={event => updateJumperConfig(selectedPlacedEntity.id, { triggeredAtlasEntryId: event.target.value || undefined })}
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                        >
                          <option value="">None (sin cambio visual)</option>
                          {atlasEntries.map(entry => (
                            <option key={entry.id} value={entry.id}>{entry.name} ({entry.w}x{entry.h})</option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        disabled={!selectedAtlasEntry}
                        onClick={() => selectedAtlasEntry && updateJumperConfig(selectedPlacedEntity.id, { triggeredAtlasEntryId: selectedAtlasEntry.id })}
                        className="w-full rounded border border-msx-border px-2 py-1 text-[0.65rem] text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight disabled:opacity-40"
                      >
                        Usar tile seleccionado como disparado
                      </button>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Impulso (px/frame, 2-15)
                        <input
                          type="number"
                          min={2}
                          max={15}
                          value={selectedJumperConfig.impulsePx ?? 8}
                          onChange={event => {
                            const value = Math.round(Number(event.target.value));
                            updateJumperConfig(selectedPlacedEntity.id, { impulsePx: Number.isFinite(value) ? Math.max(2, Math.min(15, value)) : 8 });
                          }}
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                        />
                      </label>
                      <div className="text-[0.6rem] text-msx-textsecondary">
                        El salto normal suele ser 5-6 px/frame; usa 8+ para un muelle potente.
                      </div>
                    </div>
                  )}

                  {selectedPlacedEntity && selectedWallJumperConfig && (
                    <div className="rounded border border-msx-border bg-msx-bgcolor/40 p-2 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[0.7rem] text-msx-highlight">Muelle de pared</div>
                        <label className="flex items-center gap-1 text-[0.65rem] text-msx-textsecondary">
                          <input
                            type="checkbox"
                            checked={selectedWallJumperConfig.enabled}
                            onChange={event => updateWallJumperConfig(selectedPlacedEntity.id, { enabled: event.target.checked })}
                          />
                          Activo
                        </label>
                      </div>
                      <div className="text-[0.6rem] text-msx-textsecondary">
                        Se coloca a la derecha o izquierda de una pared sólida. Al tocarlo, el player sale
                        disparado en horizontal y la gravedad lo hace caer en arco.
                      </div>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Dirección de lanzamiento
                        <select
                          value={selectedWallJumperConfig.direction || 'right'}
                          onChange={event => updateWallJumperConfig(selectedPlacedEntity.id, { direction: event.target.value === 'left' ? 'left' : 'right' })}
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                        >
                          <option value="right">Derecha (muelle a la izquierda de la pared)</option>
                          <option value="left">Izquierda (muelle a la derecha de la pared)</option>
                        </select>
                      </label>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Tile normal (reposo)
                        <select
                          value={selectedWallJumperConfig.atlasEntryId || ''}
                          onChange={event => updateWallJumperConfig(selectedPlacedEntity.id, { atlasEntryId: event.target.value || undefined })}
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                        >
                          <option value="">None (tile pintado a mano)</option>
                          {atlasEntries.map(entry => (
                            <option key={entry.id} value={entry.id}>{entry.name} ({entry.w}x{entry.h})</option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        disabled={!selectedAtlasEntry}
                        onClick={() => selectedAtlasEntry && updateWallJumperConfig(selectedPlacedEntity.id, { atlasEntryId: selectedAtlasEntry.id })}
                        className="w-full rounded border border-msx-border px-2 py-1 text-[0.65rem] text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight disabled:opacity-40"
                      >
                        Usar tile seleccionado como reposo
                      </button>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Tile disparado
                        <select
                          value={selectedWallJumperConfig.triggeredAtlasEntryId || ''}
                          onChange={event => updateWallJumperConfig(selectedPlacedEntity.id, { triggeredAtlasEntryId: event.target.value || undefined })}
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                        >
                          <option value="">None (sin cambio visual)</option>
                          {atlasEntries.map(entry => (
                            <option key={entry.id} value={entry.id}>{entry.name} ({entry.w}x{entry.h})</option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        disabled={!selectedAtlasEntry}
                        onClick={() => selectedAtlasEntry && updateWallJumperConfig(selectedPlacedEntity.id, { triggeredAtlasEntryId: selectedAtlasEntry.id })}
                        className="w-full rounded border border-msx-border px-2 py-1 text-[0.65rem] text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight disabled:opacity-40"
                      >
                        Usar tile seleccionado como disparado
                      </button>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Impulso (px/frame, 2-15)
                        <input
                          type="number"
                          min={2}
                          max={15}
                          value={selectedWallJumperConfig.impulsePx ?? 8}
                          onChange={event => {
                            const value = Math.round(Number(event.target.value));
                            updateWallJumperConfig(selectedPlacedEntity.id, { impulsePx: Number.isFinite(value) ? Math.max(2, Math.min(15, value)) : 8 });
                          }}
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                        />
                      </label>
                      <div className="text-[0.6rem] text-msx-textsecondary">
                        El impulso decae 1 px/frame por fricción; con 8 recorre ~36 px antes de detenerse.
                      </div>
                    </div>
                  )}

                  {selectedPlacedEntity.kind === 'npc' && (
                    <div className="rounded border border-msx-border bg-msx-bgcolor/40 p-2 space-y-2">
                      <div className="text-[0.7rem] text-msx-highlight">NPC hablador</div>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Diálogo (msx2dialogue)
                        <select
                          value={String((selectedPlacedEntity.params?.npcDialogue as any)?.dialogueAssetId || '')}
                          onChange={event => updatePlacedEntityParams(selectedPlacedEntity.id, {
                            npcDialogue: { ...((selectedPlacedEntity.params?.npcDialogue as any) || {}), dialogueAssetId: event.target.value },
                          })}
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                        >
                          <option value="">None</option>
                          {allAssets.filter(asset => asset.type === 'msx2dialogue').map(asset => (
                            <option key={asset.id} value={asset.id}>{asset.name}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Tecla para hablar
                        <select
                          value={String((selectedPlacedEntity.params?.npcDialogue as any)?.talkKey || 'up')}
                          onChange={event => updatePlacedEntityParams(selectedPlacedEntity.id, {
                            npcDialogue: { ...((selectedPlacedEntity.params?.npcDialogue as any) || {}), talkKey: event.target.value === 'space' ? 'space' : 'up' },
                          })}
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                        >
                          <option value="up">UP (cursor arriba)</option>
                          <option value="space">SPACE</option>
                        </select>
                      </label>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Tile visual (atlas)
                        <select
                          value={String((selectedPlacedEntity.params?.npcDialogue as any)?.atlasEntryId || '')}
                          onChange={event => updatePlacedEntityParams(selectedPlacedEntity.id, {
                            npcDialogue: { ...((selectedPlacedEntity.params?.npcDialogue as any) || {}), atlasEntryId: event.target.value || undefined },
                          })}
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                        >
                          <option value="">None (invisible / pintado a mano)</option>
                          {atlasEntries.map(entry => (
                            <option key={entry.id} value={entry.id}>{entry.name} ({entry.w}x{entry.h})</option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        disabled={!selectedAtlasEntry}
                        onClick={() => selectedAtlasEntry && updatePlacedEntityParams(selectedPlacedEntity.id, {
                          npcDialogue: { ...((selectedPlacedEntity.params?.npcDialogue as any) || {}), atlasEntryId: selectedAtlasEntry.id },
                        })}
                        className="w-full rounded border border-msx-border px-2 py-1 text-[0.65rem] text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight disabled:opacity-40"
                      >
                        Usar tile seleccionado
                      </button>
                      {!(selectedPlacedEntity.params?.npcDialogue as any)?.dialogueAssetId && (
                        <div className="text-[0.6rem] text-msx-warning">Sin diálogo asignado: el NPC no se exporta al ROM.</div>
                      )}
                    </div>
                  )}

                  {selectedPlacedEntity.kind === 'hidden_obj' && (
                    <div className="rounded border border-msx-border bg-msx-bgcolor/40 p-2 space-y-2">
                      <div className="text-[0.7rem] text-msx-highlight">Objeto oculto (Perception)</div>
                      <div className="text-[0.6rem] text-msx-textsecondary leading-tight">
                        Marcador invisible. Con la skill Perception activa, al entrar en su radio se activa
                        flag_near y el estado "perceiving"; al pisar su celda se recoge.
                      </div>
                      <label className="block text-[0.65rem] text-msx-textsecondary">
                        Reward al recoger
                        <select
                          value={String((selectedPlacedEntity.params?.hiddenReward as any)?.type || 'shipPart')}
                          onChange={event => updatePlacedEntityParams(selectedPlacedEntity.id, {
                            hiddenReward: { ...((selectedPlacedEntity.params?.hiddenReward as any) || {}), type: event.target.value },
                          })}
                          className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                        >
                          <option value="shipPart">Ship part (counter + ventana I)</option>
                          <option value="collectible">Collectible (counter gemas HUD)</option>
                          <option value="keyItem">Key item (bitmap_key_count)</option>
                        </select>
                      </label>
                      {String((selectedPlacedEntity.params?.hiddenReward as any)?.type || 'shipPart') === 'shipPart' && (
                        <>
                          <label className="block text-[0.65rem] text-msx-textsecondary">
                            Bitmap de la pieza (atlas) — se muestra en la ventana de inventario (tecla I)
                            <select
                              value={String((selectedPlacedEntity.params?.hiddenReward as any)?.atlasEntryId || '')}
                              onChange={event => updatePlacedEntityParams(selectedPlacedEntity.id, {
                                hiddenReward: { ...((selectedPlacedEntity.params?.hiddenReward as any) || {}), type: 'shipPart', atlasEntryId: event.target.value || undefined },
                              })}
                              className="mt-1 w-full rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-xs text-msx-textprimary"
                            >
                              <option value="">None (slot blanco al recoger)</option>
                              {atlasEntries.map(entry => (
                                <option key={entry.id} value={entry.id}>{entry.name} ({entry.w}x{entry.h})</option>
                              ))}
                            </select>
                          </label>
                          <button
                            type="button"
                            disabled={!selectedAtlasEntry}
                            onClick={() => selectedAtlasEntry && updatePlacedEntityParams(selectedPlacedEntity.id, {
                              hiddenReward: { ...((selectedPlacedEntity.params?.hiddenReward as any) || {}), type: 'shipPart', atlasEntryId: selectedAtlasEntry.id },
                            })}
                            className="w-full rounded border border-msx-border px-2 py-1 text-[0.65rem] text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight disabled:opacity-40"
                          >
                            Usar tile seleccionado
                          </button>
                        </>
                      )}
                      {String((selectedPlacedEntity.params?.hiddenReward as any)?.type) === 'keyItem' && (
                        <div className="text-[0.6rem] text-msx-warning">
                          Suma a bitmap_key_count: necesita puertas con llave o un widget HUD keyItem en el proyecto.
                        </div>
                      )}
                    </div>
                  )}

                  {selectedPlacedEntity.kind !== 'collectible' && selectedPlacedEntity.kind !== 'door' && selectedPlacedEntity.kind !== 'npc' && selectedPlacedEntity.kind !== 'hidden_obj' && (
                    <div className="rounded border border-msx-border px-2 py-1 text-[0.6rem] text-msx-textsecondary">
                      Las llaves se asignan a collectibles; las cerraduras se asignan a puertas.
                    </div>
                  )}
                </div>
              )}
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
                    return <RoomMinimapThumb asset={neighbour} isCurrent={false} paletteSlots={slots} onOpen={onOpenRoom ? () => onOpenRoom(neighbour.id) : undefined} onRequestDelete={onDeleteRoom ? () => requestDeleteRoom(neighbour) : undefined} isStart={neighbour.id === worldStart.startRoomId} />;
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
                  return <RoomMinimapThumb asset={neighbour} isCurrent={false} paletteSlots={slots} onOpen={onOpenRoom ? () => onOpenRoom(neighbour.id) : undefined} onRequestDelete={onDeleteRoom ? () => requestDeleteRoom(neighbour) : undefined} isStart={neighbour.id === worldStart.startRoomId} />;
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

              {/* 8x8 sub-cell shape for the selected atlas tile */}
              {selectedAtlasEntry && (
                <div className="mt-2 rounded border border-msx-border bg-msx-bgcolor-dark p-2">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[0.7rem] text-msx-highlight">Forma 8x8 (default)</span>
                    <span className="text-[0.6rem] text-msx-textsecondary">
                      {selectedAtlasEntryShape} {describeCellShape(selectedAtlasEntryShape)}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="grid h-14 w-14 shrink-0 grid-cols-2 grid-rows-2">
                      {SHAPE_QUADRANTS.map(quadrant => {
                        const on = (selectedAtlasEntryShapeQuadrants & SHAPE_BIT[quadrant.key]) !== 0;
                        return (
                          <button
                            key={quadrant.key}
                            type="button"
                            title={`${quadrant.label} (8x8 px) — ${on ? 'solido' : 'hueco'}`}
                            onClick={() => toggleAtlasEntryShapeQuadrant(SHAPE_BIT[quadrant.key])}
                            style={{
                              backgroundColor: on ? SHAPE_ON_COLOR : 'transparent',
                              border: `1px solid ${on ? SHAPE_ON_BORDER : 'rgba(255,255,255,0.22)'}`,
                            }}
                          />
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {SHAPE_PRESETS.map(preset => (
                        <button
                          key={preset.label}
                          type="button"
                          title={preset.title}
                          onClick={() => applyAtlasEntryShapePreset(preset.value)}
                          className={`rounded border px-1 py-0.5 text-[0.6rem] ${
                            (selectedAtlasEntryShape & SHAPE_FULL) === (preset.value & SHAPE_FULL)
                              ? 'border-msx-highlight text-msx-highlight'
                              : 'border-msx-border text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-1 text-[0.6rem] text-msx-textsecondary">
                    Se estampa en todas las celdas donde pintas este tile.
                  </div>
                </div>
              )}
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
              <label className="flex items-center gap-1 text-xs text-msx-textsecondary">
                <input type="checkbox" checked={!!cellProps.exitEnemy} onChange={toggleExitEnemySurface} />
                Exit enemy (behavior=4)
              </label>
              <label
                className="flex items-center gap-1 text-xs text-msx-textsecondary"
                title={configTarget === 'cell'
                  ? 'Skill destroy_tile: SOLO esta celda se puede picar. Usa el mismo tile solido en otra celda para caminos secretos.'
                  : 'Skill destroy_tile: al pintar este tile, las celdas quedan picables por defecto (puedes desmarcar celdas sueltas con Select).'}
              >
                <input
                  type="checkbox"
                  checked={!!cellProps.destructible}
                  onChange={toggleDestructible}
                />
                Destructible (pico)
              </label>
              <label
                className="flex items-center gap-1 text-xs text-msx-textsecondary"
                title={configTarget === 'cell'
                  ? `Suelo que se desmorona (Manic Miner): SOLO esta celda se erosiona mientras el player la pisa (${CRUMBLE_STAGES} etapas de 2px) y luego se abre. Se regenera al salir y volver a entrar en la sala.`
                  : `Suelo que se desmorona (Manic Miner): al pintar este tile, las celdas se erosionan bajo los pies del player (${CRUMBLE_STAGES} etapas de 2px). Se regenera al volver a la sala; puedes desmarcar celdas sueltas con Select.`}
              >
                <input
                  type="checkbox"
                  checked={!!cellProps.crumbling}
                  onChange={toggleCrumbling}
                />
                Se desmorona
              </label>
            </div>

            {/* Crumbling-floor speed. Authored per ATLAS TILE (not per cell): the record list
                the generator emits carries one frames-per-stage byte per crumbling cell, read
                from the tile painted there. */}
            {(cellProps.crumbling || selectedAtlasEntryCrumbling) && (
              <div className="mt-2 rounded border border-msx-border bg-msx-bgcolor p-2">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[0.7rem] text-msx-highlight">Se desmorona</span>
                  <span className="text-[0.6rem] text-msx-textsecondary">{CRUMBLE_STAGES} etapas de 2px</span>
                </div>
                {selectedAtlasEntry ? (
                  <>
                    <label className="flex items-center gap-2 text-xs text-msx-textsecondary">
                      Frames por etapa
                      <input
                        type="number"
                        min={CRUMBLE_FRAMES_MIN}
                        max={CRUMBLE_FRAMES_MAX}
                        value={selectedAtlasEntryCrumbleFrames}
                        onChange={e => updateAtlasEntryCrumbleFrames(Number(e.target.value))}
                        className="w-16 rounded border border-msx-border bg-msx-panelbg px-1 py-0.5 text-msx-textprimary"
                      />
                    </label>
                    <p className="mt-1 text-[0.6rem] text-msx-textsecondary">
                      Aguanta {selectedAtlasEntryCrumbleFrames * CRUMBLE_STAGES} frames de pisada
                      (~{(selectedAtlasEntryCrumbleFrames * CRUMBLE_STAGES / 60).toFixed(1)}s a 60fps).
                      La velocidad es del tile del atlas; la marca de "se desmorona" es por celda.
                    </p>
                  </>
                ) : (
                  <p className="text-[0.6rem] text-msx-textsecondary">
                    Selecciona el tile del atlas para ajustar los frames por etapa.
                  </p>
                )}
              </div>
            )}

            {/* 8x8 sub-cell solidity: 2x2 quadrant mini-grid + shape presets, per collision cell. */}
            <div className="mt-2 rounded border border-msx-border bg-msx-bgcolor p-2">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[0.7rem] text-msx-highlight">Forma 8x8 (sub-celda)</span>
                <span className="text-[0.6rem] text-msx-textsecondary">
                  {configTarget === 'cell' && selectedCollisionCell ? `mask ${selectedCellShape}` : 'por celda'}
                </span>
              </div>
              {configTarget === 'cell' && selectedCollisionCell ? (
                <div className="flex items-start gap-2">
                  {/* Inline colours on purpose: the msx-* palette is made of CSS vars, so
                      Tailwind opacity modifiers (bg-msx-highlight/70) resolve to nothing. */}
                  <div className="grid h-14 w-14 shrink-0 grid-cols-2 grid-rows-2">
                    {SHAPE_QUADRANTS.map(quadrant => {
                      const on = (selectedCellShapeQuadrants & SHAPE_BIT[quadrant.key]) !== 0;
                      return (
                        <button
                          key={quadrant.key}
                          type="button"
                          title={`${quadrant.label} (8x8 px) — ${on ? 'solido, click para vaciar' : 'hueco, click para hacerlo solido'}`}
                          onClick={() => toggleShapeQuadrant(SHAPE_BIT[quadrant.key])}
                          style={{
                            backgroundColor: on ? SHAPE_ON_COLOR : 'transparent',
                            border: `1px solid ${on ? SHAPE_ON_BORDER : 'rgba(255,255,255,0.22)'}`,
                          }}
                        />
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {SHAPE_PRESETS.map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        title={preset.title}
                        onClick={() => applyShapePreset(preset.value)}
                        className={`rounded border px-1 py-0.5 text-[0.6rem] ${
                          (selectedCellShape & SHAPE_FULL) === (preset.value & SHAPE_FULL)
                            ? 'border-msx-highlight text-msx-highlight'
                            : 'border-msx-border text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-[0.65rem] text-msx-textsecondary">
                  Selecciona una celda del lienzo y pulsa "Usar celda" para dibujar su forma 8x8.
                </div>
              )}
              {configTarget === 'cell' && selectedCollisionCell && (
                <div className="mt-1 flex items-center gap-3 text-[0.6rem] text-msx-textsecondary">
                  <span className="flex items-center gap-1">
                    <span
                      className="inline-block h-3 w-3"
                      style={{ backgroundColor: SHAPE_ON_COLOR, border: `1px solid ${SHAPE_ON_BORDER}` }}
                    />
                    solido (choca)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-3 w-3" style={{ border: '1px solid rgba(255,255,255,0.22)' }} />
                    hueco (pasa)
                  </span>
                  <span className="text-msx-textprimary">{describeCellShape(selectedCellShape)}</span>
                </div>
              )}
              <div className="mt-1 text-[0.6rem] text-msx-textsecondary">
                {configTarget === 'cell' && selectedCollisionCell && !selectedCellShapeApplies ? (
                  <span className="flex flex-wrap items-center gap-1">
                    <span>Sin efecto: la forma solo se aplica a celdas Solid o Deadly.</span>
                    <button
                      type="button"
                      onClick={() => toggleProp('solid')}
                      className="rounded border border-msx-border px-1 py-0.5 text-msx-textsecondary hover:border-msx-highlight hover:text-msx-highlight"
                    >
                      Marcar Solid
                    </button>
                  </span>
                ) : (
                  'Cada cuadrante son 8x8 px. Apagar uno abre un hueco por el que el jugador pasa.'
                )}
              </div>
            </div>

            <div className="mt-2 rounded border border-msx-border bg-msx-bgcolor px-2 py-1 text-[0.65rem] text-msx-textsecondary">
              {configTarget === 'cell' && selectedCollisionCell
                ? 'Editas solo la celda seleccionada; marca Ice o Exit enemy para escribir behavior=3 o behavior=4 en esa celda.'
                : 'Editas el tile del atlas; marca Ice o Exit enemy para que ese tile pinte behavior=3 o behavior=4 y sincronice sus celdas ya colocadas.'}
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

          <CollapsiblePanel title="Iluminación" isOpen={openLighting} onToggle={() => setOpenLighting(v => !v)}>
            <label className="flex items-center gap-2 text-xs text-msx-textsecondary">
              <input type="checkbox" checked={isDarkRoom} onChange={handleToggleDarkRoom} />
              Sala oscura (la luz sale del jugador)
            </label>
            <div className="mt-2 text-[0.65rem] text-msx-textsecondary leading-tight">
              La sala se pinta con los colores apagados y solo se recorta un halo alrededor del
              jugador. Requiere una <span className="text-msx-textprimary">paleta emparejada 8x2</span>:
              los slots 8..15 deben ser la versión oscura de los slots 0..7, y el arte de fondo no
              debe usar 8..15.
            </div>
            {isDarkRoom && (
              <div className="mt-2 rounded border border-msx-border bg-msx-bgcolor p-2 text-[0.65rem] text-msx-textsecondary leading-tight">
                Con la skill <span className="text-msx-textprimary">Glowing tail</span> activa en el
                Player, el halo pasa a ser la cola del alien: se enciende al comerse una{' '}
                <span className="text-msx-textprimary">MSX2 Seta Fosforescente</span> colocada en la
                sala y va menguando hasta apagarse. Las setas brillan solas para que las veas de
                lejos. Mientras la cola está encendida, el sprite del Player usa los colores
                intensos 0..7 de la paleta emparejada. Al agotarse el tiempo, recupera sus colores
                normales y las setas comidas regeneran su tile y vuelven a brillar. Sin la skill,
                el jugador lleva una lámpara siempre encendida.
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

      <Msx2AutotileImportModal
        isOpen={isAutotileImportOpen}
        onClose={() => setIsAutotileImportOpen(false)}
        slots={slots}
        onImport={handleImportAutotileTemplate}
      />

      <ConfirmationModal
        isOpen={pendingDeleteAtlasEntries.length > 0}
        title={pendingDeleteAtlasEntries.length > 1 ? 'Eliminar tiles del atlas' : 'Eliminar tile del atlas'}
        message={pendingDeleteAtlasEntries.length > 0 ? (
          <div className="space-y-2">
            <div>
              {pendingDeleteAtlasEntries.length > 1 ? 'Tiles' : 'Tile'}:{' '}
              <span className="text-msx-highlight">
                {pendingDeleteAtlasEntries.length > 1
                  ? `${pendingDeleteAtlasEntries.length} seleccionados`
                  : pendingDeleteAtlasEntries[0].name}
              </span>
            </div>
            {pendingDeleteAtlasEntries.length > 1 && (
              <div className="max-h-24 overflow-y-auto rounded border border-msx-border bg-msx-bgcolor/50 p-2 text-[0.7rem]">
                {pendingDeleteAtlasEntries.map(entry => (
                  <div key={entry.id} className="truncate">{entry.name}</div>
                ))}
              </div>
            )}
            <div>
              Se {pendingDeleteAtlasEntries.length > 1 ? 'quitaran' : 'quitara'} del atlas y se vaciaran {getAtlasEntriesUsageCount(pendingDeleteAtlasEntries)} celdas que {pendingDeleteAtlasEntries.length > 1 ? 'los usan' : 'lo usan'}.
            </div>
          </div>
        ) : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmButtonVariant="danger"
        onConfirm={confirmDeleteAtlasEntries}
        onCancel={() => setPendingDeleteAtlasEntryIds([])}
      />

      {/* Random-mix percent editor: weights of the Ctrl+click multi-selection brush. */}
      {isRandomMixOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setIsRandomMixOpen(false)}>
          <div className="w-80 max-h-[70vh] overflow-y-auto rounded border border-msx-border bg-msx-panelbg p-3 space-y-2" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h4 className="text-sm pixel-font text-msx-highlight">Mezcla aleatoria de tiles</h4>
              <button type="button" className="text-msx-textsecondary hover:text-msx-highlight" onClick={() => setIsRandomMixOpen(false)}>✕</button>
            </div>
            <div className="text-[0.65rem] text-msx-textsecondary">
              Cada celda pintada sortea un tile según estos pesos. Ctrl+click en el atlas añade o quita tiles de la lista.
            </div>
            {multiTileSelection.map((item, index) => {
              const entry = atlasEntries.find(candidate => candidate.id === item.entryId);
              return (
                <div key={item.entryId} className="flex items-center gap-2">
                  <span className="w-4 text-right text-[0.6rem] text-msx-cyan">{index + 1}</span>
                  <div className="h-7 w-7 shrink-0 overflow-hidden border border-black/70 bg-black">
                    {entry && <AtlasTilePreview entry={entry} atlasPixels={atlasPixels} slots={slots} />}
                  </div>
                  <span className={`min-w-0 flex-1 truncate text-[0.65rem] ${entry ? 'text-msx-textprimary' : 'text-red-300 line-through'}`}>
                    {entry?.name || item.entryId}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={item.percent}
                    onChange={event => {
                      const percent = clampInt(event.target.value, 0, 100, item.percent);
                      setMultiTileSelection(current => current.map((candidate, candidateIndex) =>
                        candidateIndex === index ? { ...candidate, percent } : candidate));
                    }}
                    className="w-12 rounded border border-msx-border bg-msx-bgcolor px-1 py-0.5 text-right text-[0.7rem] text-msx-textprimary"
                  />
                  <span className="text-[0.65rem] text-msx-textsecondary">%</span>
                  <button
                    type="button"
                    className="shrink-0 rounded border border-msx-border px-1 text-[0.7rem] text-msx-textsecondary hover:border-red-400 hover:text-red-300"
                    title="Quitar de la mezcla"
                    onClick={() => setMultiTileSelection(current => current.filter((_candidate, candidateIndex) => candidateIndex !== index))}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
            <div className="flex items-center justify-between text-[0.65rem] text-msx-textsecondary">
              <span>
                Total: {multiTileSelection.reduce((sum, item) => sum + Math.max(0, Number(item.percent) || 0), 0)}%
                {' '}(los pesos se normalizan al sortear)
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMultiTileSelection(current => current.map(item => ({ ...item, percent: equalSplit(current.length) })))}
              >
                Partes iguales
              </Button>
            </div>
            {multiTileSelection.length < 2 && (
              <div className="rounded border border-yellow-600/60 bg-msx-bgcolor p-2 text-[0.65rem] text-yellow-300">
                La mezcla necesita al menos 2 tiles; con menos, el pincel vuelve al tile único seleccionado.
              </div>
            )}
          </div>
        </div>
      )}

      <BitmapTileEditorModal
        entry={editingAtlasEntry}
        pixels={editingAtlasEntry ? getAtlasEntryPixels(editingAtlasEntry) : []}
        slots={slots}
        onClose={() => setEditingAtlasEntryId(null)}
        onSaveAtlas={saveBitmapTileEditorToAtlas}
        onSaveAsset={saveBitmapTileEditorAsAsset}
        onSaveAtlasCopy={saveBitmapTileEditorAsAtlasCopy}
        allAssets={allAssets}
        worldPaletteAsset={worldPaletteAsset}
        onAddAssets={assets => onUpdate({}, assets)}
        setStatusBarMessage={setStatusBarMessage}
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

      {/* Delete-neighbour confirm: right-click from the minimap opens this modal. */}
      {pendingDeleteRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPendingDeleteRoom(null)}>
          <div className="w-96 max-w-[calc(100vw-2rem)] rounded border border-msx-danger bg-msx-panelbg p-4 space-y-3 shadow-xl" onClick={event => event.stopPropagation()}>
            <div className="text-sm text-msx-danger text-center font-semibold">
              Borrar pantalla &quot;{pendingDeleteRoom.name}&quot;?
            </div>
            <div className="text-xs text-msx-textprimary space-y-2">
              <p>Se borrará la pantalla y su nodo del World Map.</p>
              <p>
                {pendingDeleteRoom.connectionCount > 0
                  ? `Se romperán ${pendingDeleteRoom.connectionCount} conexión(es) con otras pantallas.`
                  : 'Esta pantalla no tiene conexiones registradas.'}
              </p>
              <p className="rounded border border-msx-warning/60 bg-msx-warning/10 p-2 text-msx-warning">
                Las pantallas vecinas no se reconectarán automáticamente. Después tendrás que reparar manualmente los nodos de conexión desde World Map.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const roomId = pendingDeleteRoom.assetId;
                  setPendingDeleteRoom(null);
                  onDeleteRoom?.(roomId);
                }}
                className="flex-1 rounded px-2 py-1 text-sm border border-msx-danger bg-msx-danger/15 text-msx-danger hover:bg-msx-danger/25"
              >
                Borrar pantalla
              </button>
              <button
                type="button"
                onClick={() => setPendingDeleteRoom(null)}
                className="flex-1 rounded px-2 py-1 text-sm border border-msx-border text-msx-textsecondary hover:border-msx-highlight"
              >
                Cancelar
              </button>
            </div>
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
