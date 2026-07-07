import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Msx2HudAsset, Msx2HudLayer, Msx2HudElement, Msx2HudElementKind, Msx2HudIconEntry,
  Msx2HudWidgetBinding, ProjectAsset, PaletteAsset, Screen5PaletteSlot, Msx2PlayerDefinition, Msx2Screen5BitmapRoom, WorldMapGraph,
  Msx2HudFontAsset, BitmapTileScreen5, Msx2BitmapStampAsset, BitmapTileStampScreen5, Msx2HudXpRewardActionType,
} from '../../types';
import { createDefaultScreen5PaletteSlots } from '../../utils/msx2PaletteUtils';
import { addEntryToMsx2HudIconLibrary } from '../../utils/msx2HudIconLibrary';
import { buildScreen5PaletteRemap } from '../../utils/msx2BitmapStampLibrary';
import { Msx2HudIconLibraryModal } from '../modals/Msx2HudIconLibraryModal';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import {
  HudIcon, EyeIcon, EyeOffIcon, LockIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon,
  PencilIcon, EraserIcon, PaintBrushIcon, ContourIcon, ZoomInIcon, ZoomOutIcon, PlusCircleIcon, ImageIcon,
  LoadIcon, SaveIcon,
} from '../icons/MsxIcons';

const HUD_WIDTH = 256;
const HUD_HEIGHT = 20;
// MSX2 SCREEN 5 real resolution (R#9 LN=1): the full screen is 212 rows, split as
// a fixed 20-row HUD band on top + a 192-row playable area below. Kept in sync with
// BITMAP_ROOM_HUD_HEIGHT in msx2Screen5BitmapRoomGenerator.ts.
const FULL_SCREEN_HEIGHT = 212;
const GAME_AREA_HEIGHT = FULL_SCREEN_HEIGHT - HUD_HEIGHT; // 192
const TRANSPARENT = -1;

type PaintTool =
  | 'pencil' | 'line' | 'rect' | 'fill'
  | 'text' | 'iconStamp' | 'numberField' | 'meterBar' | 'heartLife' | 'gemCoin' | 'portraitSlot'
  | 'eraser' | 'select' | 'zoom';

const TOOLS: { id: PaintTool; label: string; icon: React.ReactNode; shortcut: string }[] = [
  { id: 'pencil', label: 'Pencil', icon: <PencilIcon />, shortcut: 'P' },
  { id: 'line', label: 'Line', icon: <span className="inline-block w-4 text-center">／</span>, shortcut: 'L' },
  { id: 'rect', label: 'Rectangle', icon: <ContourIcon />, shortcut: 'R' },
  { id: 'fill', label: 'Fill', icon: <PaintBrushIcon />, shortcut: 'F' },
  { id: 'text', label: 'Text', icon: <span className="inline-block w-4 text-center font-bold">A</span>, shortcut: 'T' },
  { id: 'iconStamp', label: 'Icon Stamp', icon: <ImageIcon />, shortcut: 'I' },
  { id: 'numberField', label: 'Number Field', icon: <span className="inline-block w-4 text-center text-[0.55rem] font-bold">123</span>, shortcut: 'N' },
  { id: 'meterBar', label: 'Meter / Bar', icon: <span className="inline-block w-4 h-2.5 rounded-sm" style={{ background: 'linear-gradient(to right,#e33,#ee3,#3c3)' }} />, shortcut: 'M' },
  { id: 'heartLife', label: 'Heart / Life', icon: <span className="inline-block w-4 text-center">❤️</span>, shortcut: 'H' },
  { id: 'gemCoin', label: 'Gem / Coin', icon: <span className="inline-block w-4 text-center">💎</span>, shortcut: 'G' },
  { id: 'portraitSlot', label: 'Portrait Slot', icon: <span className="inline-block w-4 text-center">👤</span>, shortcut: 'O' },
  { id: 'eraser', label: 'Eraser', icon: <EraserIcon />, shortcut: 'E' },
  { id: 'select', label: 'Select', icon: <span className="inline-block w-4 text-center">▧</span>, shortcut: 'S' },
  { id: 'zoom', label: 'Zoom', icon: <ZoomInIcon />, shortcut: 'Z' },
];

interface WidgetTemplate {
  label: string;
  kind: Msx2HudElementKind;
  overrides?: Partial<Msx2HudElement>;
}

const WIDGET_TEMPLATES: WidgetTemplate[] = [
  { label: 'Bar Meter', kind: 'bar', overrides: { binding: 'playerEnergy' } },
  { label: 'Numeric Counter', kind: 'counter', overrides: { binding: 'score' } },
  { label: 'Icon Slot', kind: 'icon', overrides: { binding: 'custom' } },
  { label: 'Mini Portrait', kind: 'portrait', overrides: { binding: 'custom' } },
  { label: 'Heart Life', kind: 'iconRow', overrides: { binding: 'playerEnergy' } },
  { label: 'Key Item', kind: 'icon', overrides: { binding: 'keyItem', keyBitIndex: 0 } },
  { label: 'Gem Counter', kind: 'iconCounter', overrides: { binding: 'collectibles', format: { digits: 2, base: 'dec', zeroPad: false, prefix: 'x' } } },
  { label: 'Timer (MM:SS)', kind: 'counter', overrides: { binding: 'custom', variableName: 'timer', format: { digits: 4, base: 'dec', zeroPad: true } } },
  { label: 'Coin Counter', kind: 'iconCounter', overrides: { binding: 'collectibles', format: { digits: 2, base: 'dec', zeroPad: false, prefix: 'x' } } },
  { label: 'Ammo Counter', kind: 'iconCounter', overrides: { binding: 'custom', variableName: 'ammo', format: { digits: 2, base: 'dec', zeroPad: false, prefix: 'x' } } },
  { label: 'XP Bar', kind: 'bar', overrides: { binding: 'experience', maxValue: 100, initialValue: 0, colors: { primary: 6, secondary: 4, border: 15, empty: 4 }, xpReward: { enabled: true, carryOverflow: true, actions: [{ type: 'incrementLevel', amount: 1 }] } } },
  { label: 'MP Bar', kind: 'bar', overrides: { binding: 'custom', variableName: 'mp', colors: { primary: 5, secondary: 4, border: 15, empty: 4 } } },
  { label: 'Empty Slot', kind: 'icon', overrides: { binding: 'custom' } },
];

/** Toolbar "stamp" tools: clicking the canvas with one of these active drops a new widget layer at the click point. */
const STAMP_TOOL_TEMPLATES: Partial<Record<PaintTool, WidgetTemplate>> = {
  text: { label: 'Text', kind: 'text' },
  iconStamp: { label: 'Icon Stamp', kind: 'icon', overrides: { binding: 'custom' } },
  numberField: { label: 'Number Field', kind: 'counter', overrides: { binding: 'custom' } },
  meterBar: { label: 'Meter / Bar', kind: 'bar', overrides: { binding: 'custom' } },
  heartLife: { label: 'Heart / Life', kind: 'iconRow', overrides: { binding: 'playerEnergy' } },
  gemCoin: { label: 'Gem / Coin', kind: 'iconCounter', overrides: { binding: 'collectibles', format: { digits: 2, base: 'dec', zeroPad: false, prefix: 'x' } } },
  portraitSlot: { label: 'Portrait Slot', kind: 'portrait', overrides: { binding: 'custom' } },
};

const KIND_LABELS: Record<Msx2HudElementKind, string> = {
  bar: 'Bar',
  counter: 'Number',
  icon: 'Icon',
  iconRow: 'Heart/Life',
  iconCounter: 'Gem/Coin',
  text: 'Text',
  portrait: 'Portrait',
};

const uid = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const blankPixels = (width: number, height: number): number[][] =>
  Array.from({ length: height }, () => new Array(width).fill(TRANSPARENT));

const clonePixels = (pixels: number[][]): number[][] => pixels.map(row => [...row]);

const clampSlot = (value: unknown): number => {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? Math.max(0, Math.min(15, n)) : 0;
};

const bitmapTileToPixelGrid = (tile: BitmapTileScreen5): number[][] => {
  const width = Math.max(1, Math.trunc(Number(tile.width) || 1));
  const height = Math.max(1, Math.trunc(Number(tile.height) || 1));
  return Array.from({ length: height }, (_row, y) =>
    Array.from({ length: width }, (_col, x) => clampSlot(tile.pixelData?.[y * width + x]))
  );
};

const bitmapStampToPixelGrid = (stamp: BitmapTileStampScreen5): number[][] => {
  const columns = Math.max(1, Math.trunc(Number(stamp.columns) || 1));
  const rows = Math.max(1, Math.trunc(Number(stamp.rows) || 1));
  const tileWidth = Math.max(1, Math.trunc(Number(stamp.tileWidth) || 16));
  const tileHeight = Math.max(1, Math.trunc(Number(stamp.tileHeight) || 16));
  const width = columns * tileWidth;
  const height = rows * tileHeight;
  const pixels = Array.from({ length: height }, () => Array.from({ length: width }, () => 0));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const tile = stamp.tiles?.[row * columns + col];
      if (!tile) continue;
      const tilePixels = bitmapTileToPixelGrid(tile);
      for (let y = 0; y < tileHeight; y++) {
        for (let x = 0; x < tileWidth; x++) {
          pixels[row * tileHeight + y][col * tileWidth + x] = clampSlot(tilePixels[y]?.[x]);
        }
      }
    }
  }
  return pixels;
};

const remapGridToHudIconPixels = (grid: number[][], remap: number[]): number[][] => {
  const croppedHeight = Math.min(HUD_HEIGHT, Math.max(1, grid.length));
  const croppedWidth = Math.min(HUD_WIDTH, Math.max(1, grid[0]?.length || 1));
  return Array.from({ length: croppedHeight }, (_row, y) =>
    Array.from({ length: croppedWidth }, (_col, x) => {
      const sourceSlot = clampSlot(grid[y]?.[x]);
      if (sourceSlot === 0) return TRANSPARENT;
      return clampSlot(remap[sourceSlot] ?? sourceSlot);
    })
  );
};

const sourcePaletteForBitmapTile = (tile: BitmapTileScreen5, allAssets: ProjectAsset[], fallback: Screen5PaletteSlot[]): Screen5PaletteSlot[] => {
  const paletteAsset = allAssets.find(asset => asset.id === tile.paletteId && asset.type === 'palette')?.data as PaletteAsset | undefined;
  return paletteAsset?.slots?.length ? paletteAsset.slots : fallback;
};

const buildHudIconFromBitmapAsset = (
  sourceAsset: ProjectAsset,
  allAssets: ProjectAsset[],
  targetSlots: Screen5PaletteSlot[],
): { icon: Msx2HudIconEntry; cropped: boolean } | null => {
  let sourcePixels: number[][];
  let sourceSlots: Screen5PaletteSlot[];

  if (sourceAsset.type === 'msx2bitmaptile') {
    const tile = sourceAsset.data as BitmapTileScreen5 | undefined;
    if (!tile || tile.mode !== 'SCREEN5_BITMAP' || !Array.isArray(tile.pixelData)) return null;
    sourcePixels = bitmapTileToPixelGrid(tile);
    sourceSlots = sourcePaletteForBitmapTile(tile, allAssets, targetSlots);
  } else if (sourceAsset.type === 'msx2bitmapstamp') {
    const stampAsset = sourceAsset.data as Msx2BitmapStampAsset | undefined;
    const stamp = stampAsset?.stamp;
    if (!stamp || stamp.mode !== 'SCREEN5_BITMAP_STAMP' || !Array.isArray(stamp.tiles)) return null;
    sourcePixels = bitmapStampToPixelGrid(stamp);
    sourceSlots = stampAsset.palette?.length ? stampAsset.palette : targetSlots;
  } else {
    return null;
  }

  const remap = buildScreen5PaletteRemap(sourceSlots, targetSlots);
  const pixels = remapGridToHudIconPixels(sourcePixels, remap);
  return {
    icon: {
      id: uid('hud_icon'),
      name: sourceAsset.name || 'Bitmap HUD Icon',
      width: pixels[0]?.length || 1,
      height: pixels.length || 1,
      pixels,
    },
    cropped: sourcePixels.length > HUD_HEIGHT || (sourcePixels[0]?.length || 0) > HUD_WIDTH,
  };
};

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = ((hash * 31) + value.charCodeAt(i)) >>> 0;
  return hash;
};

const bitmapRoomHasPreviewContent = (room: Msx2Screen5BitmapRoom): boolean => {
  if ((room.composition?.commands || []).length > 0) return true;
  if ((room.visibleFramebuffer?.pixels || []).length > 0) return true;
  return (room.tileGrid || []).some(row => row.some(value => value > 0));
};

const selectHudPreviewBitmapRoom = (allAssets: ProjectAsset[], hudAssetId: string): Msx2Screen5BitmapRoom | undefined => {
  const bitmapRooms = allAssets
    .filter(item => item.type === 'msx2bitmaproom')
    .map(item => item.data as Msx2Screen5BitmapRoom);
  const linked = bitmapRooms.find(room => room.runtime?.hudAssetId === hudAssetId);
  if (linked) return linked;
  const withContent = bitmapRooms.filter(bitmapRoomHasPreviewContent);
  const candidates = withContent.length ? withContent : bitmapRooms;
  if (!candidates.length) return undefined;
  return candidates[hashString(hudAssetId || 'hud') % candidates.length];
};

const resolveBitmapRoomPreviewPalette = (
  allAssets: ProjectAsset[],
  room: Msx2Screen5BitmapRoom,
): Screen5PaletteSlot[] => {
  const world = allAssets.find(asset =>
    asset.type === 'worldmap'
    && ((asset.data as WorldMapGraph | undefined)?.nodes || []).some(node => node.screenAssetId === room.id)
  )?.data as WorldMapGraph | undefined;
  const worldPalette = world?.paletteAssetId
    ? allAssets.find(asset => asset.id === world.paletteAssetId && asset.type === 'palette')?.data as PaletteAsset | undefined
    : undefined;
  return worldPalette?.slots?.length
    ? worldPalette.slots
    : room.palette?.length
      ? room.palette
      : createDefaultScreen5PaletteSlots();
};

const drawScreen5BitmapRoomPreview = (
  ctx: CanvasRenderingContext2D,
  room: Msx2Screen5BitmapRoom,
  palette: Screen5PaletteSlot[],
  scale: number,
): void => {
  const colorFor = (index: number): string => palette[index & 0x0f]?.hex || '#000000';
  const originY = HUD_HEIGHT * scale;
  const paintRect = (x: number, y: number, w: number, h: number, color: number) => {
    if (w <= 0 || h <= 0) return;
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(HUD_WIDTH, Math.ceil(x + w));
    const y1 = Math.min(GAME_AREA_HEIGHT, Math.ceil(y + h));
    if (x1 <= x0 || y1 <= y0) return;
    ctx.fillStyle = colorFor(color);
    ctx.fillRect(x0 * scale, originY + y0 * scale, (x1 - x0) * scale, (y1 - y0) * scale);
  };

  ctx.fillStyle = colorFor(room.backgroundColor ?? 0);
  ctx.fillRect(0, originY, HUD_WIDTH * scale, GAME_AREA_HEIGHT * scale);

  const framebuffer = room.visibleFramebuffer?.pixels;
  if (framebuffer?.length) {
    for (let y = 0; y < GAME_AREA_HEIGHT; y++) {
      for (let x = 0; x < HUD_WIDTH; x++) {
        const color = framebuffer[y]?.[x];
        if (color === undefined) continue;
        ctx.fillStyle = colorFor(color);
        ctx.fillRect(x * scale, originY + y * scale, scale, scale);
      }
    }
    return;
  }

  const atlasEntries = new Map((room.atlas?.entries || []).map(entry => [entry.id, entry]));
  const atlasPixels = room.atlas?.pixels || [];
  for (const command of room.composition?.commands || []) {
    if (command.op === 'fill') {
      paintRect(command.x, command.y, command.w, command.h, command.color);
      continue;
    }
    if (command.op === 'lineH') {
      paintRect(command.x, command.y, command.length, 1, command.color);
      continue;
    }
    if (command.op === 'lineV') {
      paintRect(command.x, command.y, 1, command.length, command.color);
      continue;
    }
    if (command.op !== 'copy') continue;
    const entry = atlasEntries.get(command.atlasEntryId);
    if (!entry) continue;
    const w = Math.max(1, Math.min(command.w || entry.w || 16, HUD_WIDTH));
    const h = Math.max(1, Math.min(command.h || entry.h || 16, GAME_AREA_HEIGHT));
    for (let yy = 0; yy < h; yy++) {
      const destY = command.dy + yy;
      if (destY < 0 || destY >= GAME_AREA_HEIGHT) continue;
      for (let xx = 0; xx < w; xx++) {
        const destX = command.dx + xx;
        if (destX < 0 || destX >= HUD_WIDTH) continue;
        const color = atlasPixels[entry.sy + yy]?.[entry.sx + xx];
        if (color === undefined) continue;
        ctx.fillStyle = colorFor(color);
        ctx.fillRect(destX * scale, originY + destY * scale, scale, scale);
      }
    }
  }
};

interface HudRuntimePreviewContext {
  playerEnergyMax?: number;
  playerEnergyInitial?: number;
}

const clampHudRuntimeValue = (value: unknown, fallback: number): number => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) ? Math.max(1, Math.min(255, n)) : fallback;
};

const hudElementMaxValue = (el: Msx2HudElement, runtime?: HudRuntimePreviewContext): number => {
  if (el.binding === 'playerEnergy' && runtime?.playerEnergyMax !== undefined) {
    return clampHudRuntimeValue(runtime.playerEnergyMax, 5);
  }
  return el.maxValue && el.maxValue > 0 ? el.maxValue : 1;
};

const hudElementInitialValue = (el: Msx2HudElement, max: number, runtime?: HudRuntimePreviewContext): number => {
  if (el.binding === 'playerEnergy' && runtime?.playerEnergyInitial !== undefined) {
    return Math.min(max, clampHudRuntimeValue(runtime.playerEnergyInitial, max));
  }
  return clampRatio(el.initialValue ?? 0, 0, max);
};

const createPaintLayer = (name: string): Msx2HudLayer => ({
  id: uid('hud_layer'),
  name,
  kind: 'paint',
  visible: true,
  locked: false,
  pixels: blankPixels(HUD_WIDTH, HUD_HEIGHT),
});

const createHudElement = (kind: Msx2HudElementKind, overrides: Partial<Msx2HudElement> = {}): Msx2HudElement => ({
  id: uid('hud_el'),
  kind,
  x: 8,
  y: 2,
  width: kind === 'bar' ? 64 : kind === 'iconRow' ? 96 : kind === 'portrait' ? 16 : kind === 'text' ? 48 : 24,
  height: kind === 'bar' ? 6 : HUD_HEIGHT - 4,
  binding: 'custom',
  maxValue: kind === 'iconRow' || kind === 'bar' ? 16 : undefined,
  initialValue: kind === 'iconRow' || kind === 'bar' ? 16 : 0,
  spacing: kind === 'iconRow' ? 16 : undefined,
  text: kind === 'text' ? 'TEXT' : undefined,
  format: { digits: kind === 'counter' || kind === 'iconCounter' ? 3 : undefined, base: 'dec', zeroPad: true },
  colors: { text: 15, outline: 0, primary: 10, secondary: 8, border: 15, empty: 4 },
  align: { h: 'left', v: 'top' },
  visible: true,
  blink: 'off',
  ...overrides,
});

const createHudLayerForWidget = (template: WidgetTemplate): Msx2HudLayer => ({
  id: uid('hud_layer'),
  name: template.label,
  kind: 'widget',
  visible: true,
  locked: false,
  element: createHudElement(template.kind, template.overrides),
});

const bresenhamLine = (x0: number, y0: number, x1: number, y1: number): { x: number; y: number }[] => {
  const points: { x: number; y: number }[] = [];
  let cx = x0; let cy = y0;
  const dx = Math.abs(x1 - x0); const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0); const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    points.push({ x: cx, y: cy });
    if (cx === x1 && cy === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; cx += sx; }
    if (e2 <= dx) { err += dx; cy += sy; }
  }
  return points;
};

const rectPoints = (x0: number, y0: number, x1: number, y1: number, filled: boolean): { x: number; y: number }[] => {
  const minX = Math.min(x0, x1); const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1); const maxY = Math.max(y0, y1);
  const points: { x: number; y: number }[] = [];
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (filled || y === minY || y === maxY || x === minX || x === maxX) points.push({ x, y });
    }
  }
  return points;
};

const floodFill = (pixels: number[][], startX: number, startY: number, newColor: number): number[][] => {
  const height = pixels.length; const width = pixels[0]?.length || 0;
  const target = pixels[startY]?.[startX];
  if (target === undefined || target === newColor) return pixels;
  const next = clonePixels(pixels);
  const stack: [number, number][] = [[startX, startY]];
  let guard = 0;
  while (stack.length && guard < 300000) {
    guard++;
    const [x, y] = stack.pop() as [number, number];
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (next[y][x] !== target) continue;
    next[y][x] = newColor;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return next;
};

const formatPreviewValue = (value: number, element: Msx2HudElement): string => {
  const digits = element.format.digits ?? 3;
  const base = element.format.base === 'hex' ? 16 : 10;
  let str = Math.max(0, Math.floor(value)).toString(base).toUpperCase();
  if (element.format.zeroPad) str = str.padStart(digits, '0');
  return `${element.format.prefix || ''}${str}`;
};

// ----------------------------------------------------------------------------
// Phase 2 — widget rendering fidelity.
// Shared per-kind renderer used by BOTH the edit canvas (scale = zoom) and the
// full-screen preview (scale = previewScale), so the editor stays WYSIWYG with
// what the export bakes. No runtime/ROM impact: this only draws to the in-editor
// <canvas>. Mirrors the export's icon/heart fallback policy
// (buildIconRowTilePixels in msx2Screen5BitmapRoomGenerator.ts): playerEnergy-bound
// iconRow with no atlas icon falls back to a heart mask; any other unconfigured
// icon falls back to a plain placeholder so a munition/lives pip never shows a heart.
// ----------------------------------------------------------------------------
const clampRatio = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// 7x6 heart mask (playerEnergy iconRow fallback).
const HEART_MASK: number[][] = [
  [0, 1, 1, 0, 0, 1, 1],
  [1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 0, 0, 0],
];

const slotHex = (slots: Screen5PaletteSlot[], i: number | undefined, fallback = '#fff'): string => {
  if (i === undefined || i < 0) return fallback;
  const hex = slots[i]?.hex;
  return hex && hex !== 'rgba(0,0,0,0)' ? hex : fallback;
};

/** Draws a Msx2HudIconEntry (atlas icon) at logical (ox,oy); 1 icon-pixel = `scale` screen px. */
const drawIconPixels = (
  ctx: CanvasRenderingContext2D,
  icon: Msx2HudIconEntry,
  ox: number, oy: number, scale: number,
  slots: Screen5PaletteSlot[],
) => {
  for (let iy = 0; iy < icon.height; iy++) {
    for (let ix = 0; ix < icon.width; ix++) {
      const c = icon.pixels[iy]?.[ix];
      if (c === undefined || c < 0) continue;
      ctx.fillStyle = slotHex(slots, c);
      ctx.fillRect((ox + ix) * scale, (oy + iy) * scale, scale, scale);
    }
  }
};

const drawHeartMask = (ctx: CanvasRenderingContext2D, ox: number, oy: number, scale: number, color: string) => {
  ctx.fillStyle = color;
  for (let iy = 0; iy < HEART_MASK.length; iy++) {
    for (let ix = 0; ix < HEART_MASK[iy].length; ix++) {
      if (HEART_MASK[iy][ix]) ctx.fillRect((ox + ix) * scale, (oy + iy) * scale, scale, scale);
    }
  }
};

const drawHudBitmapFontText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  scale: number,
  color: string,
  font: Msx2HudFontAsset,
  slots: Screen5PaletteSlot[],
) => {
  const allowed = new Set(Array.from(font.characters || ''));
  const patterns = font.patterns || {};
  ctx.fillStyle = color;
  for (const [charIndex, rawChar] of Array.from(text || '').entries()) {
    const char = rawChar.toUpperCase();
    const key = allowed.size === 0 || allowed.has(char) ? char : ' ';
    const bitmap = font.vdpMode === 'SCREEN5' ? font.bitmapPatterns?.[key] || font.bitmapPatterns?.[' '] : undefined;
    const backgroundSlot = Math.max(0, Math.min(15, Number(font.screen5BackgroundSlot ?? 0) || 0));
    if (Array.isArray(bitmap)) {
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const slot = Number(bitmap[row]?.[col]);
          if (!Number.isFinite(slot) || slot === backgroundSlot) continue;
          ctx.fillStyle = slotHex(slots, slot, '#000');
          ctx.fillRect((x + (charIndex * 8) + col) * scale, (y + row) * scale, scale, scale);
        }
      }
      ctx.fillStyle = color;
      continue;
    }
    const pattern = patterns[key] || patterns[' '];
    if (!pattern) continue;
    for (let row = 0; row < 8; row++) {
      const bits = Number(pattern[row]) || 0;
      for (let col = 0; col < 8; col++) {
        if (bits & (0x80 >> col)) {
          ctx.fillRect((x + (charIndex * 8) + col) * scale, (y + row) * scale, scale, scale);
        }
      }
    }
  }
};

/** Draws HUD text (counters/labels), honouring horizontal alignment. */
const drawHudText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  el: Msx2HudElement,
  scale: number,
  color: string,
  font?: Msx2HudFontAsset,
  slots: Screen5PaletteSlot[] = [],
) => {
  if (!text) return;
  const textWidth = Array.from(text).length * 8;
  let textX = el.x;
  if (el.align.h === 'right') textX = el.x + el.width - textWidth;
  else if (el.align.h === 'center') textX = el.x + Math.floor((el.width - textWidth) / 2);
  if (font) {
    drawHudBitmapFontText(ctx, text, textX, el.y, scale, color, font, slots);
    return;
  }
  ctx.font = `${8 * scale}px monospace`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  const prevAlign = ctx.textAlign;
  if (el.align.h === 'right') {
    ctx.textAlign = 'right';
    ctx.fillText(text, (el.x + el.width) * scale, el.y * scale);
  } else if (el.align.h === 'center') {
    ctx.textAlign = 'center';
    ctx.fillText(text, (el.x + el.width / 2) * scale, el.y * scale);
  } else {
    ctx.textAlign = 'left';
    ctx.fillText(text, el.x * scale, el.y * scale);
  }
  ctx.textAlign = prevAlign;
};

/**
 * Faithful per-kind widget renderer shared by the edit canvas and the preview.
 * editMode draws a bounds/selection outline; the preview omits it.
 */
const renderWidgetLayer = (
  ctx: CanvasRenderingContext2D,
  layer: Msx2HudLayer,
  scale: number,
  slots: Screen5PaletteSlot[],
  icons: Msx2HudIconEntry[],
  options: { editMode: boolean; selected: boolean; runtime?: HudRuntimePreviewContext; font?: Msx2HudFontAsset },
) => {
  if (layer.kind !== 'widget') return;
  const el = layer.element;
  const x = el.x * scale;
  const y = el.y * scale;
  const w = el.width * scale;
  const h = el.height * scale;
  const { editMode, selected, runtime, font } = options;

  if (el.kind === 'bar') {
    // WYSIWYG with the export (buildBitmapHudSeedPixels + buildBitmapHudLinkedBarAsm):
    // even-aligned full box, empty track + primary fill, NO 1px border. SCREEN 5 HMMV
    // needs byte-aligned DX/NX, so a 1px frame cannot survive the dynamic fill.
    const barXlog = el.x & ~1;
    const barWlog = Math.min(254, Math.max(2, el.width & ~1));
    const max = hudElementMaxValue(el, runtime);
    const fillWlog = (Math.floor((barWlog * hudElementInitialValue(el, max, runtime)) / max)) & ~1;
    const bx = barXlog * scale;
    const by = el.y * scale;
    const bw = barWlog * scale;
    const bh = el.height * scale;
    ctx.fillStyle = slotHex(slots, el.colors.empty, '#000');
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = slotHex(slots, el.colors.primary, '#0f0');
    ctx.fillRect(bx, by, fillWlog * scale, bh);
  } else if (el.kind === 'iconRow') {
    const step = el.spacing && el.spacing > 0 ? el.spacing : 16;
    const authoredTotal = Math.max(1, Math.floor(el.width / step));
    const max = hudElementMaxValue(el, runtime);
    const total = el.binding === 'playerEnergy' && runtime?.playerEnergyMax !== undefined
      ? max
      : authoredTotal;
    const fullCount = max > 0 ? Math.round((hudElementInitialValue(el, max, runtime) / max) * total) : 0;
    const fullIcon = icons.find(i => i.id === el.atlasEntryId);
    const emptyIcon = icons.find(i => i.id === el.emptyAtlasEntryId);
    const heartFallback = !fullIcon && !emptyIcon && el.binding === 'playerEnergy';
    for (let i = 0; i < total; i++) {
      const cx = el.x + i * step;
      const isFull = i < fullCount;
      const icon = isFull ? fullIcon : emptyIcon;
      if (icon) {
        drawIconPixels(ctx, icon, cx, el.y, scale, slots);
      } else if (heartFallback) {
        drawHeartMask(
          ctx,
          cx + Math.floor((step - 7) / 2),
          el.y + Math.floor((el.height - 6) / 2),
          scale,
          slotHex(slots, isFull ? el.colors.primary : el.colors.secondary, isFull ? '#e33' : '#888'),
        );
      } else {
        const ps = Math.min(8, step - 2);
        ctx.fillStyle = slotHex(slots, isFull ? el.colors.primary : el.colors.secondary, isFull ? '#0af' : '#555');
        ctx.fillRect(
          (cx + Math.floor((step - ps) / 2)) * scale,
          (el.y + Math.floor((el.height - ps) / 2)) * scale,
          ps * scale,
          ps * scale,
        );
      }
    }
  } else if (el.kind === 'icon' || el.kind === 'portrait') {
    ctx.fillStyle = slotHex(slots, el.colors.border, '#fff');
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = slotHex(slots, el.colors.empty, '#000');
    ctx.fillRect(x + scale, y + scale, w - 2 * scale, h - 2 * scale);
    const icon = icons.find(i => i.id === el.atlasEntryId);
    if (icon) {
      drawIconPixels(ctx, icon, el.x + 1, el.y + 1, scale, slots);
    } else if (editMode) {
      drawHudText(ctx, KIND_LABELS[el.kind], { ...el, align: { ...el.align, h: 'center' } }, scale, slotHex(slots, el.colors.text, '#aaa'), font, slots);
    }
  } else if (el.kind === 'iconCounter') {
    const icon = icons.find(i => i.id === el.atlasEntryId);
    const iconW = Math.min(el.height, 10);
    if (icon) {
      drawIconPixels(ctx, icon, el.x, el.y + Math.max(0, Math.floor((el.height - icon.height) / 2)), scale, slots);
    } else {
      ctx.fillStyle = slotHex(slots, el.colors.primary, '#0af');
      ctx.fillRect(el.x * scale, (el.y + Math.floor((el.height - iconW) / 2)) * scale, iconW * scale, iconW * scale);
    }
    drawHudText(
      ctx,
      formatPreviewValue(el.initialValue ?? 0, el),
      { ...el, x: el.x + iconW + 1, width: Math.max(1, el.width - iconW - 1), align: { ...el.align, h: 'left' } },
      scale,
      slotHex(slots, el.colors.text, '#ff0'),
      font,
      slots,
    );
  } else if (el.kind === 'counter') {
    drawHudText(ctx, formatPreviewValue(el.initialValue ?? 0, el), el, scale, slotHex(slots, el.colors.text, '#ff0'), font, slots);
  } else if (el.kind === 'text') {
    drawHudText(ctx, el.text || '', el, scale, slotHex(slots, el.colors.text, '#fff'), font, slots);
  }

  // Bounds / selection outline (edit mode only).
  if (editMode) {
    ctx.lineWidth = selected ? 2 : 1;
    ctx.strokeStyle = selected ? '#fff' : 'rgba(255,255,255,0.35)';
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
};

const BINDING_OPTIONS: Msx2HudWidgetBinding[] = ['playerEnergy', 'bossEnergy', 'air', 'experience', 'level', 'skillPoints', 'score', 'lives', 'collectibles', 'keyItem', 'custom'];
const XP_REWARD_ACTION_LABELS: Record<Msx2HudXpRewardActionType, string> = {
  incrementLevel: 'Level +',
  incrementSkillPoints: 'Skill points +',
  restoreHealth: 'Restore health',
  callAsmHook: 'Call ASM hook',
};

const ColorSwatchPicker: React.FC<{
  slots: Screen5PaletteSlot[];
  value: number | undefined;
  onChange: (index: number | undefined) => void;
  allowNone?: boolean;
}> = ({ slots, value, onChange, allowNone }) => (
  <div className="grid grid-cols-8 gap-0.5">
    {allowNone && (
      <button
        type="button"
        title="None"
        onClick={() => onChange(undefined)}
        className={`h-4 w-4 border text-[0.5rem] flex items-center justify-center ${value === undefined ? 'border-white' : 'border-msx-border'}`}
      >
        ✕
      </button>
    )}
    {slots.map((slot, index) => (
      <button
        key={index}
        type="button"
        title={`Color ${index}`}
        onClick={() => onChange(index)}
        className={`h-4 w-4 border ${value === index ? 'border-white' : 'border-msx-border'}`}
        style={{ backgroundColor: slot.hex === 'rgba(0,0,0,0)' ? '#000' : slot.hex }}
      />
    ))}
  </div>
);

/** Gallery picker linking a HUD widget slot (atlasEntryId/emptyAtlasEntryId) to one of the asset's icons. */
const IconAssetPicker: React.FC<{
  icons: Msx2HudIconEntry[];
  slots: Screen5PaletteSlot[];
  value: string | undefined;
  onChange: (iconId: string | undefined) => void;
}> = ({ icons, slots, value, onChange }) => (
  <div className="flex flex-wrap gap-1">
    <button
      type="button"
      title="None"
      onClick={() => onChange(undefined)}
      className={`w-8 h-8 flex-shrink-0 flex items-center justify-center text-[0.6rem] border rounded bg-msx-bgcolor ${value === undefined ? 'border-msx-accent' : 'border-msx-border'}`}
    >
      ✕
    </button>
    {icons.map(icon => (
      <button
        key={icon.id}
        type="button"
        title={icon.name}
        onClick={() => onChange(icon.id)}
        className={`w-8 h-8 flex-shrink-0 border rounded p-0.5 bg-msx-bgcolor overflow-hidden ${value === icon.id ? 'border-msx-accent' : 'border-msx-border'}`}
      >
        <div className="grid w-full h-full" style={{ gridTemplateColumns: `repeat(${icon.width}, 1fr)`, gridTemplateRows: `repeat(${icon.height}, 1fr)` }}>
          {icon.pixels.flatMap((row, y) => row.map((c, x) => (
            <div key={`${x}-${y}`} style={{ backgroundColor: c >= 0 ? (slots[c]?.hex || '#fff') : 'transparent' }} />
          )))}
        </div>
      </button>
    ))}
    {icons.length === 0 && <span className="text-[0.6rem] text-msx-textsecondary">No icons yet — create one in the Assets tab.</span>}
  </div>
);

const extractMsx2PlayerData = (asset: ProjectAsset | undefined): Partial<Msx2PlayerDefinition> | undefined => {
  if (!asset || asset.type !== 'msx2player') return undefined;
  const data = asset.data as any;
  return (data?.player || data?.compact || data) as Partial<Msx2PlayerDefinition>;
};

const msx2PlayerIdentityKeys = (asset: ProjectAsset): Set<string> => {
  const player = extractMsx2PlayerData(asset);
  const data = asset.data as any;
  return new Set([
    asset.id,
    asset.name,
    (player as any)?.id,
    data?.player?.identity?.id,
    data?.player?.identity?.name,
    data?.compact?.id,
    data?.compact?.name,
  ].map(value => String(value || '').trim()).filter(Boolean));
};

interface Msx2HudEditorProps {
  asset: Msx2HudAsset;
  onUpdate: (data: Partial<Msx2HudAsset>) => void;
  allAssets?: ProjectAsset[];
  setStatusBarMessage?: (message: string) => void;
}

export const Msx2HudEditor: React.FC<Msx2HudEditorProps> = ({ asset, onUpdate, allAssets = [], setStatusBarMessage }) => {
  const layers = asset.layers || [];
  const icons = asset.icons || [];
  const [selectedLayerId, setSelectedLayerId] = useState<string | undefined>(layers[0]?.id);
  const [activeTool, setActiveTool] = useState<PaintTool>('pencil');
  const [selectedColor, setSelectedColor] = useState(15);
  const [zoom, setZoom] = useState(4);
  const [rightTab, setRightTab] = useState<'inspector' | 'palette' | 'assets'>('inspector');
  const [selectedIconId, setSelectedIconId] = useState<string | undefined>(icons[0]?.id);
  const [bitmapIconSourceAssetId, setBitmapIconSourceAssetId] = useState<string>('');
  const [iconTool, setIconTool] = useState<'paint' | 'fill'>('paint'); // Assets tab: icon pixel editor active tool
  const [isIconLibraryOpen, setIsIconLibraryOpen] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; mode: 'paint' | 'move'; grabDx?: number; grabDy?: number } | null>(null);
  const [previewPoints, setPreviewPoints] = useState<{ x: number; y: number }[] | null>(null);
  // --- Phase 1 editor chrome state ---
  const [previewScale, setPreviewScale] = useState(2); // integer scale for the full-screen preview
  const [showFullPreview, setShowFullPreview] = useState(true); // collapses the large full-screen preview panel
  const [showHudArea, setShowHudArea] = useState(true); // highlight the 20-row HUD band in the preview
  const [showGrid, setShowGrid] = useState(true); // 1px pixel grid on the edit canvas
  const [showMovePattern, setShowMovePattern] = useState(true); // Assets tab: icon "Move pattern" mini-window visibility
  const [snap, setSnap] = useState(true); // pixel snap (canvas is pixel-precise; informational + future use)
  // Rulers + status bar use refs to avoid re-rendering on every mouse move / stroke.
  const rulerXRef = useRef<HTMLCanvasElement>(null);
  const rulerYRef = useRef<HTMLCanvasElement>(null);
  const statusXRef = useRef<HTMLSpanElement>(null);
  const statusYRef = useRef<HTMLSpanElement>(null);
  const statusColorRef = useRef<HTMLSpanElement>(null);
  const autosaveRef = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef({ x: 0, y: 0 });

  const paletteAsset = useMemo(
    () => allAssets.find(a => a.id === asset.paletteAssetId && a.type === 'palette') as ProjectAsset | undefined,
    [allAssets, asset.paletteAssetId],
  );
  const slots = useMemo(
    () => (paletteAsset?.data as PaletteAsset | undefined)?.slots || createDefaultScreen5PaletteSlots(),
    [paletteAsset],
  );
  const runtimePreview = useMemo<HudRuntimePreviewContext>(() => {
    const linkedRoom = allAssets.find(item =>
      item.type === 'msx2bitmaproom'
      && ((item.data as Msx2Screen5BitmapRoom | undefined)?.runtime?.hudAssetId === asset.id)
    )?.data as Msx2Screen5BitmapRoom | undefined;
    const referencedIds = new Set<string>();
    for (const entry of linkedRoom?.playerEntries || []) {
      const playerId = String((entry as any)?.playerId || '').trim();
      if (playerId) referencedIds.add(playerId);
    }
    const playerAssets = allAssets.filter(item => item.type === 'msx2player');
    const playerAsset = referencedIds.size
      ? playerAssets.find(item => {
          const keys = msx2PlayerIdentityKeys(item);
          return [...referencedIds].some(id => keys.has(id));
        }) || playerAssets[0]
      : playerAssets[0];
    const player = extractMsx2PlayerData(playerAsset);
    const maxHealth = clampHudRuntimeValue((player as any)?.health?.maxHealth, 5);
    return { playerEnergyMax: maxHealth, playerEnergyInitial: maxHealth };
  }, [allAssets, asset.id]);
  const previewBitmapRoom = useMemo(
    () => selectHudPreviewBitmapRoom(allAssets, asset.id),
    [allAssets, asset.id],
  );
  const previewBitmapRoomPalette = useMemo(
    () => previewBitmapRoom ? resolveBitmapRoomPreviewPalette(allAssets, previewBitmapRoom) : undefined,
    [allAssets, previewBitmapRoom],
  );
  const paletteAssets = useMemo(() => allAssets.filter(a => a.type === 'palette'), [allAssets]);
  const bitmapIconSourceAssets = useMemo(
    () => allAssets.filter(a => a.type === 'msx2bitmaptile' || a.type === 'msx2bitmapstamp'),
    [allAssets],
  );
  const hudFontAssets = useMemo(() => allAssets.filter(a => a.type === 'msx2hudfont'), [allAssets]);
  const selectedHudFont = useMemo(() => {
    if (!asset.hudFontAssetId) return undefined;
    return hudFontAssets.find(a => a.id === asset.hudFontAssetId)?.data as Msx2HudFontAsset | undefined;
  }, [asset.hudFontAssetId, hudFontAssets]);

  const selectedLayer = layers.find(l => l.id === selectedLayerId);
  const selectedIcon = icons.find(i => i.id === selectedIconId);

  const updateLayers = useCallback((next: Msx2HudLayer[]) => onUpdate({ layers: next }), [onUpdate]);

  const updateLayer = useCallback((id: string, patch: Partial<Msx2HudLayer>) => {
    updateLayers(layers.map(layer => (layer.id === id ? ({ ...layer, ...patch } as Msx2HudLayer) : layer)));
  }, [layers, updateLayers]);

  const updateElement = useCallback((id: string, patch: Partial<Msx2HudElement>) => {
    updateLayers(layers.map(layer => (
      layer.id === id && layer.kind === 'widget'
        ? { ...layer, element: { ...layer.element, ...patch } }
        : layer
    )));
  }, [layers, updateLayers]);

  const updateXpReward = useCallback((id: string, patch: Partial<NonNullable<Msx2HudElement['xpReward']>>) => {
    const layer = layers.find(item => item.id === id);
    if (!layer || layer.kind !== 'widget') return;
    const current = layer.element.xpReward || { enabled: true, carryOverflow: true, actions: [{ type: 'incrementLevel' as const, amount: 1 }] };
    updateElement(id, { xpReward: { ...current, ...patch } });
  }, [layers, updateElement]);

  const moveLayer = (id: string, direction: -1 | 1) => {
    const index = layers.findIndex(l => l.id === id);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= layers.length) return;
    const next = [...layers];
    [next[index], next[target]] = [next[target], next[index]];
    updateLayers(next);
  };

  const addPaintLayer = () => {
    const layer = createPaintLayer(`Paint ${layers.filter(l => l.kind === 'paint').length + 1}`);
    updateLayers([layer, ...layers]);
    setSelectedLayerId(layer.id);
  };

  const addWidgetFromTemplate = (template: WidgetTemplate) => {
    const layer = createHudLayerForWidget(template);
    updateLayers([layer, ...layers]);
    setSelectedLayerId(layer.id);
    setRightTab('inspector');
  };

  const addWidgetAtPosition = (template: WidgetTemplate, x: number, y: number) => {
    const layer = createHudLayerForWidget(template);
    layer.element.x = Math.max(0, Math.min(HUD_WIDTH - layer.element.width, x));
    layer.element.y = Math.max(0, Math.min(HUD_HEIGHT - layer.element.height, y));
    updateLayers([layer, ...layers]);
    setSelectedLayerId(layer.id);
    setRightTab('inspector');
    setActiveTool('select');
  };

  const deleteLayer = (id: string) => {
    updateLayers(layers.filter(l => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(undefined);
  };

  const applyPointsToPaintLayer = useCallback((layer: Msx2HudLayer, points: { x: number; y: number }[], color: number) => {
    if (layer.kind !== 'paint') return;
    const next = clonePixels(layer.pixels);
    points.forEach(({ x, y }) => {
      if (x >= 0 && x < HUD_WIDTH && y >= 0 && y < HUD_HEIGHT) next[y][x] = color;
    });
    updateLayer(layer.id, { pixels: next });
  }, [updateLayer]);

  const cellFromEvent = (event: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / zoom);
    const y = Math.floor((event.clientY - rect.top) / zoom);
    return { x: Math.max(0, Math.min(HUD_WIDTH - 1, x)), y: Math.max(0, Math.min(HUD_HEIGHT - 1, y)) };
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = cellFromEvent(event);

    // Alt+click anywhere = eyedropper (reads the active paint layer's color under the cursor).
    if (event.altKey) {
      if (selectedLayer?.kind === 'paint') {
        const picked = selectedLayer.pixels[y]?.[x];
        if (picked !== undefined && picked >= 0) setSelectedColor(picked);
      }
      return;
    }

    // Icon Stamp drops the icon currently selected in the Assets tab, sized to its
    // real pixel dimensions. With no icon selected, falls back to the generic
    // placeholder template (empty icon slot).
    if (activeTool === 'iconStamp') {
      const template: WidgetTemplate = selectedIcon
        ? { label: 'Icon Stamp', kind: 'icon', overrides: { binding: 'custom', atlasEntryId: selectedIcon.id, width: selectedIcon.width, height: selectedIcon.height } }
        : STAMP_TOOL_TEMPLATES.iconStamp!;
      addWidgetAtPosition(template, x, y);
      return;
    }

    // Stamp tools (Text/Number Field/Meter-Bar/Heart-Life/Gem-Coin/Portrait Slot)
    // drop a new widget layer at the click point, regardless of the currently
    // selected layer.
    const stampTemplate = STAMP_TOOL_TEMPLATES[activeTool];
    if (stampTemplate) {
      addWidgetAtPosition(stampTemplate, x, y);
      return;
    }

    if (activeTool === 'zoom') {
      setZoom(z => Math.max(2, Math.min(16, z + (event.button === 2 ? -1 : 1))));
      return;
    }

    if (!selectedLayer) return;
    if (selectedLayer.kind === 'widget') {
      if (selectedLayer.locked) return;
      dragRef.current = { startX: x, startY: y, mode: 'move', grabDx: x - selectedLayer.element.x, grabDy: y - selectedLayer.element.y };
      return;
    }
    if (selectedLayer.locked) return;
    if (activeTool === 'pencil') {
      applyPointsToPaintLayer(selectedLayer, [{ x, y }], selectedColor);
      dragRef.current = { startX: x, startY: y, mode: 'paint' };
    } else if (activeTool === 'eraser') {
      applyPointsToPaintLayer(selectedLayer, [{ x, y }], TRANSPARENT);
      dragRef.current = { startX: x, startY: y, mode: 'paint' };
    } else if (activeTool === 'fill') {
      updateLayer(selectedLayer.id, { pixels: floodFill(selectedLayer.pixels, x, y, selectedColor) });
    } else if (activeTool === 'line' || activeTool === 'rect' || activeTool === 'select') {
      dragRef.current = { startX: x, startY: y, mode: 'paint' };
      setPreviewPoints([{ x, y }]);
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = cellFromEvent(event);
    // Status bar cursor tracking (direct DOM write, no re-render).
    cursorRef.current = { x, y };
    if (statusXRef.current) statusXRef.current.textContent = String(x);
    if (statusYRef.current) statusYRef.current.textContent = String(y);
    if (!dragRef.current || !selectedLayer) return;
    if (dragRef.current.mode === 'move' && selectedLayer.kind === 'widget') {
      const nextX = Math.max(0, Math.min(HUD_WIDTH - selectedLayer.element.width, x - (dragRef.current.grabDx || 0)));
      const nextY = Math.max(0, Math.min(HUD_HEIGHT - selectedLayer.element.height, y - (dragRef.current.grabDy || 0)));
      updateElement(selectedLayer.id, { x: nextX, y: nextY });
      return;
    }
    if (selectedLayer.kind !== 'paint') return;
    if (activeTool === 'pencil') {
      applyPointsToPaintLayer(selectedLayer, [{ x, y }], selectedColor);
    } else if (activeTool === 'eraser') {
      applyPointsToPaintLayer(selectedLayer, [{ x, y }], TRANSPARENT);
    } else if (activeTool === 'line') {
      setPreviewPoints(bresenhamLine(dragRef.current.startX, dragRef.current.startY, x, y));
    } else if (activeTool === 'rect') {
      setPreviewPoints(rectPoints(dragRef.current.startX, dragRef.current.startY, x, y, false));
    } else if (activeTool === 'select') {
      setPreviewPoints(rectPoints(dragRef.current.startX, dragRef.current.startY, x, y, false));
    }
  };

  const handleCanvasMouseUp = () => {
    if (dragRef.current && selectedLayer?.kind === 'paint' && previewPoints) {
      if (activeTool === 'line' || activeTool === 'rect') {
        applyPointsToPaintLayer(selectedLayer, previewPoints, selectedColor);
      }
    }
    dragRef.current = null;
    setPreviewPoints(null);
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = HUD_WIDTH * zoom;
    canvas.height = HUD_HEIGHT * zoom;
    ctx.imageSmoothingEnabled = false;
    // checkerboard background (transparent indicator) — only when the pixel grid is on.
    if (showGrid) {
      for (let y = 0; y < HUD_HEIGHT; y++) {
        for (let x = 0; x < HUD_WIDTH; x++) {
          ctx.fillStyle = ((x + y) % 2 === 0) ? '#1a1a1a' : '#111111';
          ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
        }
      }
    } else {
      ctx.fillStyle = '#151515';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    [...layers].reverse().forEach(layer => {
      if (!layer.visible) return;
      if (layer.kind === 'paint') {
        for (let y = 0; y < HUD_HEIGHT; y++) {
          for (let x = 0; x < HUD_WIDTH; x++) {
            const colorIndex = layer.pixels[y]?.[x];
            if (colorIndex === undefined || colorIndex < 0) continue;
            ctx.fillStyle = slots[colorIndex]?.hex || '#fff';
            ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
          }
        }
      } else {
        renderWidgetLayer(ctx, layer, zoom, slots, icons, { editMode: true, selected: layer.id === selectedLayerId, runtime: runtimePreview, font: selectedHudFont });
      }
    });
    if (previewPoints && selectedLayer?.kind === 'paint') {
      ctx.fillStyle = slots[selectedColor]?.hex || '#fff';
      previewPoints.forEach(({ x, y }) => {
        if (x >= 0 && x < HUD_WIDTH && y >= 0 && y < HUD_HEIGHT) ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
      });
    }
    // Status bar: current color (direct DOM write, no re-render).
    if (statusColorRef.current) {
      const hex = slots[selectedColor]?.hex || '#fff';
      statusColorRef.current.textContent = `${hex} (${selectedColor})`;
    }
  }, [layers, zoom, slots, selectedLayerId, previewPoints, selectedColor, showGrid, runtimePreview, selectedHudFont]);

  // --- Full screen preview (256x212, MSX2 SCREEN 5: HUD 20 + game 192) ---
  const previewRef = useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const scale = previewScale;
    canvas.width = HUD_WIDTH * scale;
    canvas.height = FULL_SCREEN_HEIGHT * scale;
    ctx.imageSmoothingEnabled = false;
    // Game area backdrop (rows 20..211). Prefer a real SCREEN 5 bitmap room so
    // the HUD can be judged over representative gameplay instead of an empty grid.
    if (previewBitmapRoom && previewBitmapRoomPalette) {
      drawScreen5BitmapRoomPreview(ctx, previewBitmapRoom, previewBitmapRoomPalette, scale);
    } else {
      ctx.fillStyle = '#202038';
      ctx.fillRect(0, HUD_HEIGHT * scale, canvas.width, GAME_AREA_HEIGHT * scale);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      for (let y = HUD_HEIGHT; y < FULL_SCREEN_HEIGHT; y += 16) ctx.fillRect(0, y * scale, canvas.width, 1);
    }
    // HUD area backdrop (rows 0..19).
    ctx.fillStyle = '#101018';
    ctx.fillRect(0, 0, canvas.width, HUD_HEIGHT * scale);
    [...layers].reverse().forEach(layer => {
      if (!layer.visible) return;
      if (layer.kind === 'paint') {
        for (let y = 0; y < HUD_HEIGHT; y++) {
          for (let x = 0; x < HUD_WIDTH; x++) {
            const colorIndex = layer.pixels[y]?.[x];
            if (colorIndex === undefined || colorIndex < 0) continue;
            ctx.fillStyle = slots[colorIndex]?.hex || '#fff';
            ctx.fillRect(x * scale, y * scale, scale, scale);
          }
        }
      } else {
        renderWidgetLayer(ctx, layer, scale, slots, icons, { editMode: false, selected: false, runtime: runtimePreview, font: selectedHudFont });
      }
    });
    // HUD / GAME AREA separator + band highlight.
    if (showHudArea) {
      ctx.fillStyle = 'rgba(80,200,255,0.10)';
      ctx.fillRect(0, 0, canvas.width, HUD_HEIGHT * scale);
      ctx.fillStyle = '#50c8ff';
      ctx.fillRect(0, HUD_HEIGHT * scale - 1, canvas.width, Math.max(1, scale));
      ctx.font = `${7 * scale}px monospace`;
      ctx.fillStyle = '#50c8ff';
      ctx.fillText('HUD 256x20', 2, 8 * scale);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText('GAME 256x192', 2, HUD_HEIGHT * scale + 9 * scale);
    }
  }, [layers, slots, previewScale, showHudArea, runtimePreview, previewBitmapRoom, previewBitmapRoomPalette, selectedHudFont]);

  // --- Rulers (pixel-accurate, scaled with zoom) ---
  React.useEffect(() => {
    const drawXRuler = () => {
      const canvas = rulerXRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = HUD_WIDTH * zoom;
      canvas.height = 16;
      ctx.fillStyle = '#1b1b22';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#888';
      ctx.font = '8px monospace';
      for (let x = 0; x <= HUD_WIDTH; x++) {
        const major = x % 64 === 0 || x === 255;
        const minor = x % 16 === 0;
        if (major) {
          ctx.fillStyle = '#cfcfcf';
          ctx.fillRect(x * zoom, 4, 1, 12);
          ctx.fillText(String(x), x * zoom + 2, 12);
        } else if (minor) {
          ctx.fillStyle = '#777';
          ctx.fillRect(x * zoom, 8, 1, 8);
        }
      }
    };
    const drawYRuler = () => {
      const canvas = rulerYRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = 22;
      canvas.height = HUD_HEIGHT * zoom;
      ctx.fillStyle = '#1b1b22';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '8px monospace';
      for (let y = 0; y <= HUD_HEIGHT; y++) {
        const labeled = y === 0 || y === 10 || y === 19;
        if (labeled) {
          ctx.fillStyle = '#cfcfcf';
          ctx.fillRect(12, y * zoom, 10, 1);
          ctx.fillText(String(y), 0, y * zoom + 7);
        } else {
          ctx.fillStyle = '#666';
          ctx.fillRect(14, y * zoom, 8, 1);
        }
      }
    };
    drawXRuler();
    drawYRuler();
  }, [zoom]);

  // --- Autosave indicator (display-only): timestamp of the last edit. ---
  React.useEffect(() => {
    if (!autosaveRef.current) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    autosaveRef.current.textContent = `${hh}:${mm}:${ss}`;
  }, [layers, icons]);

  const DEFAULT_ICON_SIZE = 8;

  const addIcon = () => {
    const icon: Msx2HudIconEntry = { id: uid('hud_icon'), name: `Icon ${icons.length + 1}`, width: DEFAULT_ICON_SIZE, height: DEFAULT_ICON_SIZE, pixels: blankPixels(DEFAULT_ICON_SIZE, DEFAULT_ICON_SIZE) };
    onUpdate({ icons: [...icons, icon] });
    setSelectedIconId(icon.id);
  };

  const importBitmapAssetAsIcon = () => {
    const sourceAsset = bitmapIconSourceAssets.find(item => item.id === bitmapIconSourceAssetId);
    if (!sourceAsset) {
      setStatusBarMessage?.('MSX2 HUD: selecciona un MSX2 Bitmap Tile o Stamp para importarlo como icono.');
      return;
    }
    const result = buildHudIconFromBitmapAsset(sourceAsset, allAssets, slots);
    if (!result) {
      setStatusBarMessage?.(`MSX2 HUD: no se pudo convertir "${sourceAsset.name}" en icono.`);
      return;
    }
    onUpdate({ icons: [...icons, result.icon] });
    setSelectedIconId(result.icon.id);
    setRightTab('assets');
    setActiveTool('iconStamp');
    setStatusBarMessage?.(
      result.cropped
        ? `MSX2 HUD: "${sourceAsset.name}" importado como icono ${result.icon.width}x${result.icon.height}; recortado al HUD 256x20. Usa Icon Stamp para colocarlo.`
        : `MSX2 HUD: "${sourceAsset.name}" importado como icono ${result.icon.width}x${result.icon.height}. Usa Icon Stamp para colocarlo.`
    );
  };

  /** Saves the selected icon (with the active palette, for portable previews) to the global HUD icon library. */
  const exportSelectedIconToLibrary = () => {
    if (!selectedIcon) return;
    const entry = addEntryToMsx2HudIconLibrary(selectedIcon, slots, selectedIcon.name);
    setStatusBarMessage?.(`Exported "${entry.name}" to the HUD icon library.`);
  };

  /** Imports a library icon into this HUD asset's icon atlas with a fresh id. */
  const importIconFromLibrary = (libraryIcon: Msx2HudIconEntry) => {
    const icon: Msx2HudIconEntry = { ...libraryIcon, id: uid('hud_icon'), pixels: libraryIcon.pixels.map(row => [...row]) };
    onUpdate({ icons: [...icons, icon] });
    setSelectedIconId(icon.id);
    setIsIconLibraryOpen(false);
  };

  const updateIconPixel = (x: number, y: number) => {
    if (!selectedIcon) return;
    const next = clonePixels(selectedIcon.pixels);
    next[y][x] = next[y][x] === selectedColor ? TRANSPARENT : selectedColor;
    onUpdate({ icons: icons.map(icon => (icon.id === selectedIcon.id ? { ...icon, pixels: next } : icon)) });
  };

  // Flood-fills the connected same-colour region under (x,y) with the selected colour.
  const fillIconPixel = (x: number, y: number) => {
    if (!selectedIcon) return;
    const next = floodFill(selectedIcon.pixels, x, y, selectedColor);
    onUpdate({ icons: icons.map(icon => (icon.id === selectedIcon.id ? { ...icon, pixels: next } : icon)) });
  };

  // Auto-contour: stamps the selected colour onto every transparent cell that is
  // 4-directionally adjacent to an already-opaque pixel, tracing a 1px outline
  // around the drawn shape.
  const contourIcon = (id: string) => {
    const icon = icons.find(i => i.id === id);
    if (!icon) return;
    const { width, height, pixels } = icon;
    const isOpaque = (x: number, y: number) => x >= 0 && x < width && y >= 0 && y < height && (pixels[y]?.[x] ?? TRANSPARENT) >= 0;
    const next = clonePixels(pixels);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (isOpaque(x, y)) continue;
        if (isOpaque(x - 1, y) || isOpaque(x + 1, y) || isOpaque(x, y - 1) || isOpaque(x, y + 1)) {
          next[y][x] = selectedColor;
        }
      }
    }
    onUpdate({ icons: icons.map(i => (i.id === id ? { ...i, pixels: next } : i)) });
  };

  // Resizes an icon's grid by 1px per +/- click. Existing pixels are kept anchored
  // to the top-left corner: growing pads new transparent rows/cols on the
  // right/bottom, shrinking crops from the right/bottom.
  const resizeIcon = (id: string, nextWidth: number, nextHeight: number) => {
    const icon = icons.find(i => i.id === id);
    if (!icon) return;
    const width = Math.max(1, Math.min(HUD_WIDTH, nextWidth));
    const height = Math.max(1, Math.min(HUD_HEIGHT, nextHeight));
    if (width === icon.width && height === icon.height) return;
    const pixels = Array.from({ length: height }, (_, y) => (
      Array.from({ length: width }, (_, x) => icon.pixels[y]?.[x] ?? TRANSPARENT)
    ));
    onUpdate({ icons: icons.map(i => (i.id === id ? { ...i, width, height, pixels } : i)) });
  };

  // Shifts an icon's pixels by 1px within its fixed-size grid. The row/column
  // pushed past the edge is discarded; the row/column left behind on the
  // opposite side becomes transparent (classic sprite-editor "nudge").
  const nudgeIcon = (id: string, dx: number, dy: number) => {
    const icon = icons.find(i => i.id === id);
    if (!icon) return;
    const { width, height } = icon;
    const pixels = Array.from({ length: height }, (_, y) => (
      Array.from({ length: width }, (_, x) => icon.pixels[y - dy]?.[x - dx] ?? TRANSPARENT)
    ));
    onUpdate({ icons: icons.map(i => (i.id === id ? { ...i, pixels } : i)) });
  };

  const deleteIcon = (id: string) => {
    onUpdate({ icons: icons.filter(icon => icon.id !== id) });
    if (selectedIconId === id) setSelectedIconId(undefined);
  };

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      // Arrow keys nudge the selected widget: 1px, or 8px with Shift held.
      const arrowDelta: Record<string, { dx: number; dy: number }> = {
        ArrowLeft: { dx: -1, dy: 0 },
        ArrowRight: { dx: 1, dy: 0 },
        ArrowUp: { dx: 0, dy: -1 },
        ArrowDown: { dx: 0, dy: 1 },
      };
      const delta = arrowDelta[event.key];
      if (delta) {
        if (!selectedLayer || selectedLayer.kind !== 'widget' || selectedLayer.locked) return;
        const step = event.shiftKey ? 8 : 1;
        const el = selectedLayer.element;
        const nextX = Math.max(0, Math.min(HUD_WIDTH - el.width, el.x + delta.dx * step));
        const nextY = Math.max(0, Math.min(HUD_HEIGHT - el.height, el.y + delta.dy * step));
        if (nextX !== el.x || nextY !== el.y) updateElement(selectedLayer.id, { x: nextX, y: nextY });
        event.preventDefault();
        return;
      }

      if (event.shiftKey) return;
      const tool = TOOLS.find(t => t.shortcut.toLowerCase() === event.key.toLowerCase());
      if (tool) {
        setActiveTool(tool.id);
        event.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayer, updateElement]);

  return (
    <>
    <Panel title="Mideas HUD Editor" icon={<HudIcon />} className="flex-grow flex flex-col bg-msx-bgcolor min-h-0" bodyClassName="p-0 flex-grow flex flex-col overflow-hidden min-h-0">
      {/* Fixed HUD-area restriction warning */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1 bg-yellow-900/40 border-b border-yellow-700/60 text-yellow-200 text-xs" style={{ userSelect: 'none' }}>
        <span aria-hidden>⚠</span>
        <span className="font-semibold tracking-wide">HUD AREA ONLY: 256×20 pixels (Top 20 rows only)</span>
        <span className="text-yellow-300/70 hidden sm:inline">— This is the only area exported to the game.</span>
      </div>
      <div className="flex flex-grow overflow-auto min-h-0" style={{ userSelect: 'none' }}>
        {/* Tools column */}
        <div className="w-48 border-r border-msx-border flex-shrink-0 p-2 overflow-y-auto space-y-0.5">
          <h4 className="text-xs pixel-font text-msx-highlight mb-1 text-center tracking-wide">TOOLS</h4>
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              type="button"
              title={`${tool.label} (${tool.shortcut})`}
              onClick={() => setActiveTool(tool.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                activeTool === tool.id ? 'bg-msx-accent text-white' : 'text-msx-textsecondary hover:bg-msx-border hover:text-msx-textprimary'
              }`}
            >
              <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">{tool.icon}</span>
              <span className="flex-grow text-left truncate">{tool.label}</span>
              <span
                className={`flex-shrink-0 w-4 h-4 flex items-center justify-center rounded border text-[0.6rem] leading-none ${
                  activeTool === tool.id ? 'border-white/50 bg-black/10' : 'border-msx-border bg-msx-bgcolor'
                }`}
              >
                {tool.shortcut}
              </span>
            </button>
          ))}
          <div className="pt-2 border-t border-msx-border">
            <h5 className="text-[0.65rem] text-msx-textsecondary mb-1">Color</h5>
            <ColorSwatchPicker slots={slots} value={selectedColor} onChange={setSelectedColor} />
          </div>
          <div className="pt-2 border-t border-msx-border flex items-center justify-between">
            <Button size="sm" variant="ghost" onClick={() => setZoom(z => Math.max(2, z - 1))} icon={<ZoomOutIcon />} />
            <span className="text-xs">{zoom}x</span>
            <Button size="sm" variant="ghost" onClick={() => setZoom(z => Math.min(16, z + 1))} icon={<ZoomInIcon />} />
          </div>
        </div>

        {/* Canvas + preview */}
        <div className="flex-shrink-0 p-3 overflow-auto flex flex-col items-center gap-4" style={{ minWidth: 300 }}>
          <div>
            <div className="text-xs text-msx-textsecondary mb-1">HUD Canvas 256×20 (top band exported to the game) — Zoom {zoom}x</div>
            {/* Rulers + canvas */}
            <div className="flex">
              <div style={{ width: 22, height: 16 }} />
              <canvas ref={rulerXRef} style={{ imageRendering: 'pixelated' }} />
            </div>
            <div className="flex">
              <canvas ref={rulerYRef} style={{ imageRendering: 'pixelated' }} />
              <canvas
                ref={canvasRef}
                style={{ imageRendering: 'pixelated', border: '1px solid #444', cursor: activeTool === 'zoom' ? 'zoom-in' : STAMP_TOOL_TEMPLATES[activeTool] ? 'copy' : 'pointer' }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onContextMenu={event => event.preventDefault()}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1 text-xs text-msx-textsecondary">
              <span>Full Screen Preview (256×212 · HUD 20 + game 192)</span>
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={showFullPreview} onChange={e => setShowFullPreview(e.target.checked)} />
                Show Preview
              </label>
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={showHudArea} onChange={e => setShowHudArea(e.target.checked)} />
                Show HUD Area
              </label>
              <label className={`flex items-center gap-1 ${showFullPreview ? '' : 'opacity-50'}`}>
                Scale
                <select value={previewScale} disabled={!showFullPreview} onChange={e => setPreviewScale(Number(e.target.value) || 1)} className="bg-msx-bgcolor border border-msx-border rounded px-1 disabled:opacity-50">
                  <option value={1}>1×</option>
                  <option value={2}>2×</option>
                  <option value={3}>3×</option>
                  <option value={4}>4×</option>
                </select>
              </label>
            </div>
            {showFullPreview && (
              <canvas ref={previewRef} style={{ imageRendering: 'pixelated', border: '1px solid #444' }} />
            )}
          </div>
        </div>

        {/* Right: Inspector/Palette/Assets tabs + Layers/Library */}
        <div className="w-72 border-l border-msx-border flex-shrink-0 flex flex-col overflow-hidden gap-2 p-2">
          <Panel
            title="Inspector"
            collapsible
            className="flex-grow flex flex-col min-h-0"
            bodyClassName="flex-1 flex flex-col overflow-hidden p-0"
          >
          <div className="flex border-b border-msx-border">
            {(['inspector', 'palette', 'assets'] as const).map(tab => (
              <button
                key={tab}
                className={`flex-1 text-xs py-1.5 capitalize ${rightTab === tab ? 'bg-msx-accent text-white' : 'text-msx-textsecondary hover:bg-msx-border'}`}
                onClick={() => setRightTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {rightTab === 'inspector' && (
              selectedLayer ? (
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-msx-textsecondary mb-0.5">Name</label>
                    <input
                      value={selectedLayer.name}
                      onChange={event => updateLayer(selectedLayer.id, { name: event.target.value })}
                      className="w-full bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5"
                    />
                  </div>
                  {selectedLayer.kind === 'widget' && (
                    <>
                      <div className="text-msx-textsecondary">Type: <span className="text-msx-textprimary">{KIND_LABELS[selectedLayer.element.kind]}</span> · ID: {selectedLayer.element.id}</div>
                      <div className="grid grid-cols-4 gap-1">
                        <label>X<input type="number" value={selectedLayer.element.x} onChange={e => updateElement(selectedLayer.id, { x: Math.max(0, Math.min(255, Number(e.target.value) || 0)) })} className="w-full bg-msx-bgcolor border border-msx-border rounded px-1" /></label>
                        <label>Y<input type="number" value={selectedLayer.element.y} onChange={e => updateElement(selectedLayer.id, { y: Math.max(0, Math.min(19, Number(e.target.value) || 0)) })} className="w-full bg-msx-bgcolor border border-msx-border rounded px-1" /></label>
                        <label>W<input type="number" value={selectedLayer.element.width} onChange={e => updateElement(selectedLayer.id, { width: Math.max(1, Math.min(256, Number(e.target.value) || 1)) })} className="w-full bg-msx-bgcolor border border-msx-border rounded px-1" /></label>
                        <label>H<input type="number" value={selectedLayer.element.height} onChange={e => updateElement(selectedLayer.id, { height: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })} className="w-full bg-msx-bgcolor border border-msx-border rounded px-1" /></label>
                      </div>

                      {(['icon', 'portrait', 'iconRow', 'iconCounter'] as Msx2HudElementKind[]).includes(selectedLayer.element.kind) && (
                        <div className="pt-1 border-t border-msx-border">
                          <div className="text-msx-textsecondary mb-1">Icon</div>
                          <IconAssetPicker
                            icons={icons}
                            slots={slots}
                            value={selectedLayer.element.atlasEntryId}
                            onChange={iconId => updateElement(selectedLayer.id, { atlasEntryId: iconId })}
                          />
                        </div>
                      )}
                      {selectedLayer.element.kind === 'iconRow' && (
                        <div className="pt-1 border-t border-msx-border">
                          <div className="text-msx-textsecondary mb-1">Empty Icon (unfilled slots)</div>
                          <IconAssetPicker
                            icons={icons}
                            slots={slots}
                            value={selectedLayer.element.emptyAtlasEntryId}
                            onChange={iconId => updateElement(selectedLayer.id, { emptyAtlasEntryId: iconId })}
                          />
                        </div>
                      )}

                      <div className="pt-1 border-t border-msx-border">
                        <div className="text-msx-textsecondary mb-1">Colors</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-[0.65rem]">Text</div>
                            <ColorSwatchPicker slots={slots} value={selectedLayer.element.colors.text} onChange={v => updateElement(selectedLayer.id, { colors: { ...selectedLayer.element.colors, text: v } })} allowNone />
                          </div>
                          <div>
                            <div className="text-[0.65rem]">Outline</div>
                            <ColorSwatchPicker slots={slots} value={selectedLayer.element.colors.outline} onChange={v => updateElement(selectedLayer.id, { colors: { ...selectedLayer.element.colors, outline: v } })} allowNone />
                          </div>
                          <div>
                            <div className="text-[0.65rem]">Shadow</div>
                            <ColorSwatchPicker slots={slots} value={selectedLayer.element.colors.shadow} onChange={v => updateElement(selectedLayer.id, { colors: { ...selectedLayer.element.colors, shadow: v } })} allowNone />
                          </div>
                          <div>
                            <div className="text-[0.65rem]">Primary</div>
                            <ColorSwatchPicker slots={slots} value={selectedLayer.element.colors.primary} onChange={v => updateElement(selectedLayer.id, { colors: { ...selectedLayer.element.colors, primary: v } })} />
                          </div>
                        </div>
                      </div>

                      <div className="pt-1 border-t border-msx-border">
                        <div className="text-msx-textsecondary mb-1">Variable Binding</div>
                        <select
                          value={selectedLayer.element.binding}
                          onChange={e => updateElement(selectedLayer.id, { binding: e.target.value as Msx2HudWidgetBinding })}
                          className="w-full bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5 mb-1"
                        >
                          {BINDING_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        {selectedLayer.element.binding === 'custom' && (
                          <input
                            placeholder="variableName"
                            value={selectedLayer.element.variableName || ''}
                            onChange={e => updateElement(selectedLayer.id, { variableName: e.target.value })}
                            className="w-full bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5 mb-1"
                          />
                        )}
                        {selectedLayer.element.binding === 'keyItem' && (
                          <label className="block mb-1">
                            <span className="text-[0.65rem] text-msx-textsecondary">Inventory bit (0–7)</span>
                            <select
                              value={String(selectedLayer.element.keyBitIndex ?? 0)}
                              onChange={e => updateElement(selectedLayer.id, { keyBitIndex: Number(e.target.value) || 0 })}
                              className="w-full bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5"
                            >
                              {[0, 1, 2, 3, 4, 5, 6, 7].map(bit => (
                                <option key={bit} value={bit}>bit {bit}</option>
                              ))}
                            </select>
                          </label>
                        )}
                        {selectedLayer.element.kind === 'text' && (
                          <input
                            placeholder="text"
                            value={selectedLayer.element.text || ''}
                            onChange={e => updateElement(selectedLayer.id, { text: e.target.value })}
                            className="w-full bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5 mb-1"
                          />
                        )}
                        {(selectedLayer.element.kind === 'counter' || selectedLayer.element.kind === 'iconCounter') && (
                          <div className="grid grid-cols-4 gap-1 items-center">
                            <label>Digits<input type="number" value={selectedLayer.element.format.digits ?? 3} onChange={e => updateElement(selectedLayer.id, { format: { ...selectedLayer.element.format, digits: Number(e.target.value) || 0 } })} className="w-full bg-msx-bgcolor border border-msx-border rounded px-1" /></label>
                            <label>Base
                              <select value={selectedLayer.element.format.base || 'dec'} onChange={e => updateElement(selectedLayer.id, { format: { ...selectedLayer.element.format, base: e.target.value as 'dec' | 'hex' } })} className="w-full bg-msx-bgcolor border border-msx-border rounded px-1">
                                <option value="dec">dec</option>
                                <option value="hex">hex</option>
                              </select>
                            </label>
                            <label className="flex items-center gap-1 col-span-2">
                              <input type="checkbox" checked={!!selectedLayer.element.format.zeroPad} onChange={e => updateElement(selectedLayer.id, { format: { ...selectedLayer.element.format, zeroPad: e.target.checked } })} />
                              Zero-pad
                            </label>
                            <label className="col-span-2">Prefix<input value={selectedLayer.element.format.prefix || ''} onChange={e => updateElement(selectedLayer.id, { format: { ...selectedLayer.element.format, prefix: e.target.value } })} className="w-full bg-msx-bgcolor border border-msx-border rounded px-1" /></label>
                          </div>
                        )}
                      </div>

                      <div className="pt-1 border-t border-msx-border grid grid-cols-2 gap-2">
                        <label>Max<input type="number" value={selectedLayer.element.maxValue ?? 0} onChange={e => updateElement(selectedLayer.id, { maxValue: Number(e.target.value) || 0 })} className="w-full bg-msx-bgcolor border border-msx-border rounded px-1" /></label>
                        <label>Initial<input type="number" value={selectedLayer.element.initialValue ?? 0} onChange={e => updateElement(selectedLayer.id, { initialValue: Number(e.target.value) || 0 })} className="w-full bg-msx-bgcolor border border-msx-border rounded px-1" /></label>
                      </div>

                      {selectedLayer.element.kind === 'bar' && selectedLayer.element.binding === 'experience' && (
                        <div className="pt-1 border-t border-msx-border space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-msx-textsecondary">XP Reward</div>
                            <label className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={selectedLayer.element.xpReward?.enabled ?? true}
                                onChange={e => updateXpReward(selectedLayer.id, { enabled: e.target.checked })}
                              />
                              Enabled
                            </label>
                          </div>
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={selectedLayer.element.xpReward?.carryOverflow ?? true}
                              onChange={e => updateXpReward(selectedLayer.id, { carryOverflow: e.target.checked })}
                            />
                            Carry overflow XP after reward
                          </label>
                          <div className="space-y-1">
                            {(selectedLayer.element.xpReward?.actions || [{ type: 'incrementLevel' as const, amount: 1 }]).map((action, actionIndex) => (
                              <div key={`xp-reward-${actionIndex}`} className="grid grid-cols-12 gap-1 items-center">
                                <select
                                  value={action.type}
                                  onChange={e => {
                                    const actions = [...(selectedLayer.element.xpReward?.actions || [{ type: 'incrementLevel' as const, amount: 1 }])];
                                    actions[actionIndex] = { ...actions[actionIndex], type: e.target.value as Msx2HudXpRewardActionType };
                                    updateXpReward(selectedLayer.id, { actions });
                                  }}
                                  className="col-span-6 bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5"
                                >
                                  {(Object.keys(XP_REWARD_ACTION_LABELS) as Msx2HudXpRewardActionType[]).map(type => (
                                    <option key={type} value={type}>{XP_REWARD_ACTION_LABELS[type]}</option>
                                  ))}
                                </select>
                                {action.type === 'callAsmHook' ? (
                                  <input
                                    className="col-span-5 bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5"
                                    placeholder="hook_label"
                                    value={action.hookLabel || ''}
                                    onChange={e => {
                                      const actions = [...(selectedLayer.element.xpReward?.actions || [])];
                                      actions[actionIndex] = { ...action, hookLabel: e.target.value };
                                      updateXpReward(selectedLayer.id, { actions });
                                    }}
                                  />
                                ) : (
                                  <input
                                    type="number"
                                    min={0}
                                    max={255}
                                    className="col-span-5 bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5"
                                    value={action.amount ?? 1}
                                    onChange={e => {
                                      const actions = [...(selectedLayer.element.xpReward?.actions || [])];
                                      actions[actionIndex] = { ...action, amount: Math.max(0, Math.min(255, Number(e.target.value) || 0)) };
                                      updateXpReward(selectedLayer.id, { actions });
                                    }}
                                  />
                                )}
                                <button
                                  type="button"
                                  className="col-span-1 text-msx-danger"
                                  onClick={() => {
                                    const actions = (selectedLayer.element.xpReward?.actions || []).filter((_item, index) => index !== actionIndex);
                                    updateXpReward(selectedLayer.id, { actions });
                                  }}
                                >
                                  x
                                </button>
                              </div>
                            ))}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const actions = [...(selectedLayer.element.xpReward?.actions || []), { type: 'incrementSkillPoints' as const, amount: 1 }];
                                updateXpReward(selectedLayer.id, { actions });
                              }}
                            >
                              Add reward action
                            </Button>
                          </div>
                        </div>
                      )}

                      {(['text', 'counter', 'iconCounter'] as Msx2HudElementKind[]).includes(selectedLayer.element.kind) && (
                        <div className="pt-1 border-t border-msx-border">
                          <div className="text-msx-textsecondary mb-1">Text Alignment</div>
                          <div className="flex gap-1">
                            {(['left', 'center', 'right'] as const).map(h => (
                              <Button key={h} size="sm" variant={selectedLayer.element.align.h === h ? 'primary' : 'ghost'} onClick={() => updateElement(selectedLayer.id, { align: { ...selectedLayer.element.align, h } })}>{h}</Button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-1 border-t border-msx-border">
                        <label className="flex items-center gap-1">
                          <input type="checkbox" checked={selectedLayer.element.visible} onChange={e => updateElement(selectedLayer.id, { visible: e.target.checked })} />
                          Visible
                        </label>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-xs text-msx-textsecondary">Select a layer to edit its properties.</div>
              )
            )}

            {rightTab === 'palette' && (
              <div className="space-y-2 text-xs">
                <div className="text-msx-textsecondary">Shared palette asset (optional):</div>
                <select
                  value={asset.paletteAssetId || ''}
                  onChange={e => onUpdate({ paletteAssetId: e.target.value || undefined })}
                  className="w-full bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5"
                >
                  <option value="">Default SCREEN 5 palette</option>
                  {paletteAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <div className="text-msx-textsecondary pt-2">MSX2 Font:</div>
                <select
                  value={asset.hudFontAssetId || ''}
                  onChange={e => {
                    const nextId = e.target.value || null;
                    const nextFont = nextId ? hudFontAssets.find(a => a.id === nextId) : undefined;
                    onUpdate({ hudFontAssetId: nextId });
                    setStatusBarMessage?.(
                      nextFont
                        ? `MSX2 HUD: fuente "${nextFont.name}" seleccionada.`
                        : 'MSX2 HUD: fuente personalizada desactivada (None).'
                    );
                  }}
                  className="w-full bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5"
                >
                  <option value="">None</option>
                  {hudFontAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <div className="grid grid-cols-8 gap-1 pt-2">
                  {slots.map((slot, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="w-6 h-6 border border-msx-border" style={{ backgroundColor: slot.hex === 'rgba(0,0,0,0)' ? '#000' : slot.hex }} />
                      <span className="text-[0.55rem]">{index}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rightTab === 'assets' && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="secondary" icon={<PlusCircleIcon />} onClick={addIcon}>Add blank {DEFAULT_ICON_SIZE}x{DEFAULT_ICON_SIZE} icon</Button>
                  <Button size="sm" variant="ghost" icon={<LoadIcon />} title="Import an icon from the global library" onClick={() => setIsIconLibraryOpen(true)}>Library</Button>
                </div>
                <div className="border border-msx-border rounded p-2 space-y-1">
                  <div className="text-msx-textsecondary">Import MSX2 bitmap asset as HUD icon</div>
                  <select
                    value={bitmapIconSourceAssetId}
                    onChange={event => setBitmapIconSourceAssetId(event.target.value)}
                    className="w-full bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5"
                  >
                    <option value="">Select Bitmap Tile / Stamp...</option>
                    {bitmapIconSourceAssets.map(sourceAsset => (
                      <option key={sourceAsset.id} value={sourceAsset.id}>
                        {sourceAsset.type === 'msx2bitmapstamp' ? 'Stamp' : 'Tile'} - {sourceAsset.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<ImageIcon />}
                    onClick={importBitmapAssetAsIcon}
                    disabled={!bitmapIconSourceAssetId}
                    className="w-full"
                  >
                    Import as HUD icon
                  </Button>
                  <div className="text-[0.6rem] text-msx-textsecondary">Slot 0 imports as transparent. Assets taller than 20px are cropped to the HUD band.</div>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {icons.map(icon => (
                    <button
                      key={icon.id}
                      type="button"
                      onClick={() => setSelectedIconId(icon.id)}
                      className={`border p-0.5 ${selectedIconId === icon.id ? 'border-msx-accent' : 'border-msx-border'}`}
                    >
                      <div className="grid" style={{ gridTemplateColumns: `repeat(${icon.width}, 2px)`, gridTemplateRows: `repeat(${icon.height}, 2px)`, width: icon.width * 2, height: icon.height * 2 }}>
                        {icon.pixels.flatMap((row, y) => row.map((c, x) => (
                          <div key={`${x}-${y}`} style={{ backgroundColor: c >= 0 ? (slots[c]?.hex || '#fff') : 'transparent' }} />
                        )))}
                      </div>
                      <div className="truncate text-[0.55rem]">{icon.name}</div>
                    </button>
                  ))}
                </div>
                {selectedIcon && (
                  <div className="pt-2 border-t border-msx-border">
                    <div className="flex items-center justify-between mb-1">
                      <input value={selectedIcon.name} onChange={e => onUpdate({ icons: icons.map(i => (i.id === selectedIcon.id ? { ...i, name: e.target.value } : i)) })} className="bg-msx-bgcolor border border-msx-border rounded px-1 py-0.5 flex-grow mr-1" />
                      <Button size="sm" variant="ghost" icon={<SaveIcon />} title="Export to Library" onClick={exportSelectedIconToLibrary} />
                      <Button size="sm" variant="danger" icon={<TrashIcon />} onClick={() => deleteIcon(selectedIcon.id)} />
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      <Button size="sm" variant={iconTool === 'paint' ? 'primary' : 'ghost'} title="Pencil" icon={<PencilIcon />} onClick={() => setIconTool('paint')} />
                      <Button size="sm" variant={iconTool === 'fill' ? 'primary' : 'ghost'} title="Fill" icon={<PaintBrushIcon />} onClick={() => setIconTool('fill')} />
                      <Button size="sm" variant="ghost" title="Contour" icon={<ContourIcon />} onClick={() => contourIcon(selectedIcon.id)} />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-1">
                        <span className="text-msx-textsecondary">W</span>
                        <Button size="sm" variant="ghost" onClick={() => resizeIcon(selectedIcon.id, selectedIcon.width - 1, selectedIcon.height)}>-</Button>
                        <span className="w-5 text-center">{selectedIcon.width}</span>
                        <Button size="sm" variant="ghost" onClick={() => resizeIcon(selectedIcon.id, selectedIcon.width + 1, selectedIcon.height)}>+</Button>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-msx-textsecondary">H</span>
                        <Button size="sm" variant="ghost" onClick={() => resizeIcon(selectedIcon.id, selectedIcon.width, selectedIcon.height - 1)}>-</Button>
                        <span className="w-5 text-center">{selectedIcon.height}</span>
                        <Button size="sm" variant="ghost" onClick={() => resizeIcon(selectedIcon.id, selectedIcon.width, selectedIcon.height + 1)}>+</Button>
                      </div>
                    </div>
                    <div
                      className="grid border border-msx-border"
                      style={{ gridTemplateColumns: `repeat(${selectedIcon.width}, 10px)`, gridTemplateRows: `repeat(${selectedIcon.height}, 10px)`, width: selectedIcon.width * 10, imageRendering: 'pixelated' }}
                    >
                      {selectedIcon.pixels.flatMap((row, y) => row.map((c, x) => (
                        <button
                          key={`${x}-${y}`}
                          type="button"
                          onClick={() => (iconTool === 'fill' ? fillIconPixel(x, y) : updateIconPixel(x, y))}
                          style={{ width: 10, height: 10, backgroundColor: c >= 0 ? (slots[c]?.hex || '#fff') : '#222', border: '1px solid rgba(255,255,255,0.05)' }}
                        />
                      )))}
                    </div>

                    {/* Move pattern mini-window: nudges the icon's pixels within its fixed
                        grid. Edge-clip (not wrap): pixels pushed past a border are lost. */}
                    <div className="mt-2 border border-msx-border rounded">
                      <div className="flex items-center justify-between px-2 py-1 border-b border-msx-border">
                        <span className="text-msx-highlight text-[0.65rem] pixel-font">Move pattern</span>
                        <button
                          type="button"
                          onClick={() => setShowMovePattern(v => !v)}
                          className="text-msx-textsecondary hover:text-msx-highlight"
                          title={showMovePattern ? 'Hide move pattern' : 'Show move pattern'}
                          aria-label={showMovePattern ? 'Hide move pattern' : 'Show move pattern'}
                        >
                          {showMovePattern ? <EyeIcon /> : <EyeOffIcon />}
                        </button>
                      </div>
                      {showMovePattern && (
                        <div className="p-2 flex flex-col items-center gap-1">
                          <Button size="sm" variant="ghost" title="Nudge up" icon={<ArrowUpIcon />} onClick={() => nudgeIcon(selectedIcon.id, 0, -1)} />
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" title="Nudge left" icon={<ArrowLeftIcon />} onClick={() => nudgeIcon(selectedIcon.id, -1, 0)} />
                            <Button size="sm" variant="ghost" title="Nudge down" icon={<ArrowDownIcon />} onClick={() => nudgeIcon(selectedIcon.id, 0, 1)} />
                            <Button size="sm" variant="ghost" title="Nudge right" icon={<ArrowRightIcon />} onClick={() => nudgeIcon(selectedIcon.id, 1, 0)} />
                          </div>
                          <span className="text-[0.6rem] text-msx-textsecondary text-center">Pixels pushed past an edge are lost.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          </Panel>

          {/* Layers panel */}
          <Panel
            title="Layers"
            collapsible
            className="flex-shrink-0 flex flex-col max-h-[35%]"
            bodyClassName="overflow-y-auto flex-1 p-0"
            headerButtons={<Button size="sm" variant="ghost" icon={<PlusCircleIcon />} onClick={addPaintLayer}>Paint layer</Button>}
          >
              {layers.map(layer => (
                <div
                  key={layer.id}
                  onClick={() => setSelectedLayerId(layer.id)}
                  className={`flex items-center gap-1 px-2 py-1 text-xs cursor-pointer border-b border-msx-border/50 ${selectedLayerId === layer.id ? 'bg-msx-accent/30' : 'hover:bg-msx-border/40'}`}
                >
                  <button type="button" onClick={e => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }}>
                    {layer.visible ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                  <button type="button" onClick={e => { e.stopPropagation(); updateLayer(layer.id, { locked: !layer.locked }); }} className={layer.locked ? 'text-msx-danger' : 'text-msx-textsecondary'}>
                    <LockIcon />
                  </button>
                  <span className="flex-grow truncate">{layer.name}</span>
                  <button type="button" onClick={e => { e.stopPropagation(); moveLayer(layer.id, -1); }}><ArrowUpIcon /></button>
                  <button type="button" onClick={e => { e.stopPropagation(); moveLayer(layer.id, 1); }}><ArrowDownIcon /></button>
                  <button type="button" onClick={e => { e.stopPropagation(); deleteLayer(layer.id); }} className="text-msx-danger"><TrashIcon /></button>
                </div>
              ))}
          </Panel>

          {/* Widget library */}
          <Panel
            title="Widgets / Library"
            collapsible
            className="flex-shrink-0 flex flex-col max-h-[30%]"
            bodyClassName="p-2 overflow-y-auto"
          >
            <div className="grid grid-cols-3 gap-1">
              {WIDGET_TEMPLATES.map(template => (
                <button
                  key={template.label}
                  type="button"
                  onClick={() => addWidgetFromTemplate(template)}
                  className="border border-msx-border rounded p-1 text-[0.6rem] text-center hover:border-msx-highlight bg-msx-panelbg"
                  title={`Add ${template.label}`}
                >
                  {template.label}
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </div>
      {/* Status bar */}
      <div className="flex-shrink-0 flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-1 border-t border-msx-border text-[0.65rem] text-msx-textsecondary bg-msx-panelbg" style={{ userSelect: 'none' }}>
        <span>Zoom: <span className="text-msx-textprimary">{zoom}x</span></span>
        <span>Screen: <span className="text-msx-textprimary">256×212 (Screen 5)</span></span>
        <span>HUD: <span className="text-msx-textprimary">256×20 (Top 20 rows)</span></span>
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={snap} onChange={e => setSnap(e.target.checked)} /> Snap
        </label>
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} /> Grid (1px)
        </label>
        <span>X: <span ref={statusXRef} className="text-msx-textprimary">0</span></span>
        <span>Y: <span ref={statusYRef} className="text-msx-textprimary">0</span></span>
        <span>Color: <span ref={statusColorRef} className="text-msx-textprimary">#fff (15)</span></span>
        <span>Autosave: <span ref={autosaveRef} className="text-msx-textprimary">--:--:--</span></span>
        <span className="flex items-center gap-1 text-emerald-400">● Saved</span>
      </div>
    </Panel>
    <Msx2HudIconLibraryModal
      isOpen={isIconLibraryOpen}
      onClose={() => setIsIconLibraryOpen(false)}
      onImportIcon={importIconFromLibrary}
      setStatusBarMessage={setStatusBarMessage}
    />
    </>
  );
};
