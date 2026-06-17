import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Msx2BitmapRoomAtlasEntry,
  Msx2BitmapRoomCommand,
  Msx2HudFontAsset,
  Msx2HudWidget,
  Msx2HudWidgetBinding,
  Msx2HudWidgetKind,
  Msx2Screen4BitmapRoom,
  Msx2Screen4Tile,
  ProjectAsset,
  Screen5PaletteSlot,
} from '../../types';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { ensureScreen5PaletteSlots } from '../../utils/msx2PaletteUtils';
import { importTilesIntoAtlas } from '../../utils/msx2BitmapAtlasImport';
import { Msx2TileLibraryModal } from '../modals/Msx2TileLibraryModal';
import { EraserIcon, EyeIcon, EyeOffIcon, FolderOpenIcon, MapIcon, PlusCircleIcon, SaveFloppyIcon, TrashIcon } from '../icons/MsxIcons';

type BitmapRoomTool = 'copy8' | 'copy16' | 'fill' | 'lineH' | 'lineV' | 'erase';

interface Msx2Screen4BitmapRoomEditorProps {
  room: Msx2Screen4BitmapRoom;
  onUpdate: (data: Partial<Msx2Screen4BitmapRoom>) => void;
  allAssets?: ProjectAsset[];
}

const SCREEN_W = 256;
const GAME_H = 192;
const SCREEN5_VISIBLE_H = 212;
const HUD_H = 16;
const GAME_Y_OFFSET = HUD_H;
const GRID = 8;
const TILE_EDITOR_SIZE = 16;
const FALLBACK_HEX = '#05070B';
const DEFAULT_HUD_CHARS = ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ:-/';
const DEFAULT_HUD_PATTERNS: Record<string, number[]> = {
  ' ': [0, 0, 0, 0, 0, 0, 0, 0],
  '0': [0x3C,0x66,0x6E,0x76,0x66,0x66,0x3C,0],
  '1': [0x18,0x38,0x18,0x18,0x18,0x18,0x7E,0],
  '2': [0x3C,0x66,0x06,0x1C,0x30,0x60,0x7E,0],
  '3': [0x3C,0x66,0x06,0x1C,0x06,0x66,0x3C,0],
  '4': [0x0C,0x1C,0x3C,0x6C,0x7E,0x0C,0x0C,0],
  '5': [0x7E,0x60,0x7C,0x06,0x06,0x66,0x3C,0],
  '6': [0x1C,0x30,0x60,0x7C,0x66,0x66,0x3C,0],
  '7': [0x7E,0x06,0x0C,0x18,0x30,0x30,0x30,0],
  '8': [0x3C,0x66,0x66,0x3C,0x66,0x66,0x3C,0],
  '9': [0x3C,0x66,0x66,0x3E,0x06,0x0C,0x38,0],
  A: [0x18,0x3C,0x66,0x66,0x7E,0x66,0x66,0],
  B: [0x7C,0x66,0x66,0x7C,0x66,0x66,0x7C,0],
  C: [0x3C,0x66,0x60,0x60,0x60,0x66,0x3C,0],
  D: [0x78,0x6C,0x66,0x66,0x66,0x6C,0x78,0],
  E: [0x7E,0x60,0x60,0x7C,0x60,0x60,0x7E,0],
  F: [0x7E,0x60,0x60,0x7C,0x60,0x60,0x60,0],
  G: [0x3C,0x66,0x60,0x6E,0x66,0x66,0x3C,0],
  H: [0x66,0x66,0x66,0x7E,0x66,0x66,0x66,0],
  I: [0x7E,0x18,0x18,0x18,0x18,0x18,0x7E,0],
  J: [0x1E,0x0C,0x0C,0x0C,0x0C,0x6C,0x38,0],
  K: [0x66,0x6C,0x78,0x70,0x78,0x6C,0x66,0],
  L: [0x60,0x60,0x60,0x60,0x60,0x60,0x7E,0],
  M: [0x63,0x77,0x7F,0x6B,0x63,0x63,0x63,0],
  N: [0x66,0x76,0x7E,0x7E,0x6E,0x66,0x66,0],
  O: [0x3C,0x66,0x66,0x66,0x66,0x66,0x3C,0],
  P: [0x7C,0x66,0x66,0x7C,0x60,0x60,0x60,0],
  Q: [0x3C,0x66,0x66,0x66,0x6A,0x6C,0x36,0],
  R: [0x7C,0x66,0x66,0x7C,0x78,0x6C,0x66,0],
  S: [0x3C,0x66,0x60,0x3C,0x06,0x66,0x3C,0],
  T: [0x7E,0x18,0x18,0x18,0x18,0x18,0x18,0],
  U: [0x66,0x66,0x66,0x66,0x66,0x66,0x3C,0],
  V: [0x66,0x66,0x66,0x66,0x66,0x3C,0x18,0],
  W: [0x63,0x63,0x63,0x6B,0x7F,0x77,0x63,0],
  X: [0x66,0x66,0x3C,0x18,0x3C,0x66,0x66,0],
  Y: [0x66,0x66,0x66,0x3C,0x18,0x18,0x18,0],
  Z: [0x7E,0x06,0x0C,0x18,0x30,0x60,0x7E,0],
  ':': [0x00,0x18,0x18,0x00,0x00,0x18,0x18,0],
  '-': [0x00,0x00,0x00,0x7E,0x00,0x00,0x00,0],
  '/': [0x06,0x0C,0x0C,0x18,0x30,0x30,0x60,0],
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

const clampNibble = (value: unknown, fallback: number): number => clampInt(value, 0, 15, fallback);
const clampByte = (value: unknown, fallback: number): number => clampInt(value, 0, 255, fallback);

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
    const w = Math.max(1, clampInt(command.w, 1, SCREEN_W, entry.w));
    const h = Math.max(1, clampInt(command.h, 1, height, entry.h));
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

const commandContainsPoint = (command: Msx2BitmapRoomCommand, x: number, y: number): boolean => {
  if (command.op === 'fill') return x >= command.x && x < command.x + command.w && y >= command.y && y < command.y + command.h;
  if (command.op === 'lineH') return y === command.y && x >= command.x && x < command.x + command.length;
  if (command.op === 'lineV') return x === command.x && y >= command.y && y < command.y + command.length;
  return x >= command.dx && x < command.dx + (command.w || 8) && y >= command.dy && y < command.dy + (command.h || 8);
};

const normalizeHudText = (value: string, maxLength: number, allowedCharacters: string): string => {
  const allowed = new Set(Array.from(allowedCharacters || DEFAULT_HUD_CHARS));
  return Array.from(String(value || '').toUpperCase())
    .map(char => allowed.has(char) ? char : ' ')
    .join('')
    .slice(0, Math.max(0, maxLength));
};

const getWidgetText = (widget: Msx2HudWidget, room: Msx2Screen4BitmapRoom, allowedCharacters: string): string => {
  const maxChars = Math.max(1, Math.min(31, Math.floor((Number(widget.width) || 64) / 8)));
  if (widget.kind === 'text') return normalizeHudText(widget.text || widget.name || 'TEXT', maxChars, allowedCharacters);
  if (widget.kind !== 'counter') return '';
  const binding = widget.binding || 'custom';
  const fallbackValue =
    binding === 'air' ? room.runtime?.initialAir ?? 255 :
    binding === 'lives' ? 3 :
    binding === 'collectibles' ? 0 :
    binding === 'playerEnergy' ? room.runtime?.playerEnergyInitial ?? 16 :
    binding === 'bossEnergy' ? room.runtime?.bossEnergyInitial ?? 16 :
    0;
  const value = clampByte(widget.initialValue, fallbackValue);
  return normalizeHudText(String(value).padStart(maxChars, '0'), maxChars, allowedCharacters);
};

const drawGlyphText = (
  pixels: number[][],
  text: string,
  x: number,
  y: number,
  font: Msx2HudFontAsset | undefined,
  color: number,
): void => {
  const patterns = font?.patterns || DEFAULT_HUD_PATTERNS;
  for (const [charIndex, char] of Array.from(text).entries()) {
    const pattern = patterns[char] || patterns[' '] || DEFAULT_HUD_PATTERNS[' '];
    for (let row = 0; row < 8; row++) {
      const bits = Number(pattern[row]) || 0;
      for (let col = 0; col < 8; col++) {
        if (!(bits & (0x80 >> col))) continue;
        const px = x + charIndex * 8 + col;
        const py = y + row;
        if (px >= 0 && px < SCREEN_W && py >= 0 && py < pixels.length) pixels[py][px] = color & 0x0f;
      }
    }
  }
};

const drawAtlasIcon = (
  pixels: number[][],
  room: Msx2Screen4BitmapRoom,
  atlasPixels: number[][],
  widget: Msx2HudWidget,
): void => {
  const entries = room.atlas?.entries || [];
  const entry = entries.find(item => item.id === widget.atlasEntryId) || entries[clampByte(widget.iconTileIndex, 0)];
  const x0 = clampInt(widget.x, 0, SCREEN_W - 1, 0);
  const y0 = clampInt(widget.y, 0, HUD_H - 1, 0);
  const w = Math.max(1, Math.min(widget.width || entry?.w || 8, SCREEN_W - x0));
  const h = Math.max(1, Math.min(widget.height || entry?.h || 8, HUD_H - y0));
  if (!entry) {
    applyFill(pixels, x0, y0, w, h, widget.primaryColor ?? 15);
    return;
  }
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      const color = atlasPixels[entry.sy + yy]?.[entry.sx + xx];
      if (color === undefined) continue;
      pixels[y0 + yy][x0 + xx] = color & 0x0f;
    }
  }
};

const renderHudPixels = (
  room: Msx2Screen4BitmapRoom,
  atlasPixels: number[][],
  font: Msx2HudFontAsset | undefined,
): number[][] => {
  const pixels = createPixels(SCREEN_W, HUD_H, 1);
  applyFill(pixels, 0, HUD_H - 1, SCREEN_W, 1, 15);
  const widgets = room.runtime?.showHud === false || room.runtime?.hideHud === true ? [] : room.runtime?.hudWidgets || [];
  const allowedCharacters = font?.characters || DEFAULT_HUD_CHARS;
  for (const widget of widgets) {
    const x = clampInt(widget.x, 0, SCREEN_W - 1, 0);
    const y = clampInt(widget.y, 0, HUD_H - 1, 0);
    const width = clampInt(widget.width, 1, SCREEN_W - x, widget.kind === 'icon' ? 8 : 64);
    const height = clampInt(widget.height, 1, HUD_H - y, widget.kind === 'bar' ? 6 : 8);
    if (widget.kind === 'bar') {
      const maxValue = Math.max(1, clampByte(widget.maxValue, 16));
      const initialValue = Math.min(maxValue, clampByte(widget.initialValue, maxValue));
      const fillWidth = Math.max(0, Math.min(width - 2, Math.floor(((width - 2) * initialValue) / maxValue)));
      applyFill(pixels, x, y, width, height, widget.borderColor ?? 15);
      applyFill(pixels, x + 1, y + 1, Math.max(0, width - 2), Math.max(0, height - 2), widget.emptyColor ?? 4);
      applyFill(pixels, x + 1, y + 1, fillWidth, Math.max(0, height - 2), widget.primaryColor ?? 10);
    } else if (widget.kind === 'icon') {
      drawAtlasIcon(pixels, room, atlasPixels, { ...widget, width, height });
    } else {
      drawGlyphText(pixels, getWidgetText(widget, room, allowedCharacters), x, y, font, widget.primaryColor ?? ((font?.colorByte ?? 0xF1) >> 4));
    }
  }
  return pixels;
};

const createHudWidget = (
  index: number,
  kind: Msx2HudWidgetKind,
  patch: Partial<Msx2HudWidget> = {},
): Msx2HudWidget => {
  const binding: Msx2HudWidgetBinding =
    patch.binding || (kind === 'bar' ? 'playerEnergy' : kind === 'counter' ? 'score' : kind === 'icon' ? 'collectibles' : 'custom');
  return {
    id: `bitmap_hud_widget_${Date.now()}_${index}`,
    name: patch.name || (kind === 'bar' ? 'Life Bar' : kind === 'counter' ? 'Counter' : kind === 'icon' ? 'Item Icon' : 'Text Field'),
    kind,
    binding,
    x: patch.x ?? (kind === 'bar' ? 8 : kind === 'counter' ? 176 : 8),
    y: patch.y ?? 4,
    width: patch.width ?? (kind === 'bar' ? 64 : kind === 'counter' ? 40 : kind === 'icon' ? 8 : 64),
    height: patch.height ?? (kind === 'bar' ? 6 : 8),
    maxValue: patch.maxValue ?? (binding === 'air' ? 255 : 16),
    initialValue: patch.initialValue ?? (binding === 'air' ? 255 : binding === 'score' || binding === 'collectibles' ? 0 : 16),
    primaryColor: patch.primaryColor ?? (binding === 'bossEnergy' ? 8 : binding === 'air' ? 11 : 10),
    secondaryColor: patch.secondaryColor ?? 8,
    borderColor: patch.borderColor ?? 15,
    emptyColor: patch.emptyColor ?? 4,
    iconTileIndex: patch.iconTileIndex ?? 0,
    atlasEntryId: patch.atlasEntryId,
    text: patch.text ?? (kind === 'text' ? 'STAGE 1' : undefined),
    variableName: patch.variableName ?? (binding === 'air' ? 'time' : binding),
  };
};

const rectsOverlap = (
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

interface MiniWindowProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

const MiniWindow: React.FC<MiniWindowProps> = ({ title, isOpen, onToggle, children, className = '' }) => (
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

interface AtlasTilePreviewProps {
  entry: Msx2BitmapRoomAtlasEntry;
  atlasPixels: number[][];
  slots: Screen5PaletteSlot[];
  isSelected: boolean;
  onSelect: () => void;
}

const AtlasTilePreview: React.FC<AtlasTilePreviewProps> = ({ entry, atlasPixels, slots, isSelected, onSelect }) => {
  const width = Math.max(1, entry.w || 8);
  const height = Math.max(1, entry.h || 8);
  return (
    <button
      type="button"
      className={`rounded border p-1 text-left bg-msx-bgcolor hover:border-msx-highlight ${isSelected ? 'border-msx-highlight' : 'border-msx-border'}`}
      title={`${entry.name} (${entry.w}x${entry.h})`}
      onClick={onSelect}
    >
      <div className="aspect-square w-full bg-black border border-black/70 overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" shapeRendering="crispEdges">
          {Array.from({ length: height }, (_row, y) => (
            Array.from({ length: width }, (_col, x) => (
              <rect
                key={`${x}_${y}`}
                x={x}
                y={y}
                width={1}
                height={1}
                fill={resolveSlotHex(slots, atlasPixels[entry.sy + y]?.[entry.sx + x] ?? 0)}
              />
            ))
          ))}
        </svg>
      </div>
      <div className="mt-1 text-[0.65rem] leading-tight text-msx-textprimary truncate">{entry.name}</div>
      <div className="text-[0.6rem] leading-tight text-msx-textsecondary">{entry.w}x{entry.h}</div>
    </button>
  );
};

export const Msx2Screen4BitmapRoomEditor: React.FC<Msx2Screen4BitmapRoomEditorProps> = ({ room, onUpdate, allAssets = [] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tool, setTool] = useState<BitmapRoomTool>('copy8');
  const [activeColor, setActiveColor] = useState(4);
  const [selectedAtlasEntryId, setSelectedAtlasEntryId] = useState(room.atlas?.entries?.[0]?.id || '');
  const [selectedHudWidgetId, setSelectedHudWidgetId] = useState('');
  const [zoom, setZoom] = useState(3);
  const [showGrid, setShowGrid] = useState(true);
  const [isTileLibraryOpen, setIsTileLibraryOpen] = useState(false);
  const [isAtlasWindowOpen, setIsAtlasWindowOpen] = useState(true);
  const [isHudWindowOpen, setIsHudWindowOpen] = useState(true);
  const [isTilePickerWindowOpen, setIsTilePickerWindowOpen] = useState(true);
  const [isTileEditorWindowOpen, setIsTileEditorWindowOpen] = useState(true);
  const [tileEditorPixels, setTileEditorPixels] = useState<number[][]>(() => createPixels(TILE_EDITOR_SIZE, TILE_EDITOR_SIZE, 0));
  const [tileEditorMessage, setTileEditorMessage] = useState('');
  const { slots, changed } = useMemo(() => ensureScreen5PaletteSlots(room.palette), [room.palette]);
  const atlasWidth = Math.max(1, Number(room.atlas?.width) || 256);
  const atlasHeight = Math.max(1, Number(room.atlas?.height) || 128);
  const atlasPixels = useMemo(() => normalizePixels(room.atlas?.pixels, atlasWidth, atlasHeight), [room.atlas?.pixels, atlasWidth, atlasHeight]);
  const hudFonts = useMemo(() => allAssets.filter((asset): asset is ProjectAsset & { data: Msx2HudFontAsset } => asset.type === 'msx2hudfont' && Boolean(asset.data)), [allAssets]);
  const selectedHudFont = hudFonts.find(asset => asset.id === room.runtime?.hudFontAssetId) || hudFonts[0];
  const gamePixels = useMemo(() => renderComposition(room, atlasPixels, GAME_H), [room, atlasPixels]);
  const hudPixels = useMemo(() => renderHudPixels(room, atlasPixels, selectedHudFont?.data), [room, atlasPixels, selectedHudFont]);
  const commands = room.composition?.commands || [];
  const atlasEntries = room.atlas?.entries || [];
  const selectedAtlasEntry = atlasEntries.find(entry => entry.id === selectedAtlasEntryId) || atlasEntries[0];
  const runtime = room.runtime || {
    screenKind: 'playable' as const,
    screenEngine: 'player' as const,
    activeAreaX: 0,
    activeAreaY: 1,
    activeAreaWidth: 16,
    activeAreaHeight: 12,
    showHud: true,
    statusHud: true,
    hudStyle: 'statusBars' as const,
    hudWidgets: [],
  };
  const hudWidgets = runtime.hudWidgets || [];
  const selectedHudWidget = hudWidgets.find(widget => widget.id === selectedHudWidgetId) || hudWidgets[0];

  useEffect(() => {
    if (changed) onUpdate({ palette: slots.map(slot => ({ ...slot })) });
  }, [changed, onUpdate, slots]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = SCREEN_W * zoom;
    canvas.height = SCREEN5_VISIBLE_H * zoom;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < SCREEN5_VISIBLE_H; y++) {
      for (let x = 0; x < SCREEN_W; x++) {
        const slot = y < HUD_H
          ? hudPixels[y]?.[x] ?? 1
          : y < HUD_H + GAME_H
            ? gamePixels[y - HUD_H]?.[x] ?? 0
            : 1;
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
        ctx.lineTo(x * zoom + 0.5, SCREEN5_VISIBLE_H * zoom);
        ctx.stroke();
      }
      for (let y = 0; y <= SCREEN5_VISIBLE_H; y += GRID) {
        ctx.beginPath();
        ctx.moveTo(0, y * zoom + 0.5);
        ctx.lineTo(SCREEN_W * zoom, y * zoom + 0.5);
        ctx.stroke();
      }
    }
  }, [gamePixels, hudPixels, showGrid, slots, zoom]);

  const updateRuntime = (patch: Partial<NonNullable<Msx2Screen4BitmapRoom['runtime']>>) => {
    onUpdate({ runtime: { ...runtime, ...patch } });
  };

  const updateComposition = (nextCommands: Msx2BitmapRoomCommand[]) => {
    onUpdate({
      composition: {
        source: room.composition?.source || 'authored',
        commands: nextCommands,
      },
    });
  };

  const updateWidget = (id: string, patch: Partial<Msx2HudWidget>) => {
    updateRuntime({ hudWidgets: hudWidgets.map(widget => widget.id === id ? { ...widget, ...patch } : widget) });
  };

  const addHudWidget = (kind: Msx2HudWidgetKind, patch: Partial<Msx2HudWidget> = {}) => {
    const next = createHudWidget(hudWidgets.length, kind, patch);
    updateRuntime({ showHud: true, statusHud: true, hudWidgets: [...hudWidgets, next] });
    setSelectedHudWidgetId(next.id);
  };

  const removeWidget = (id: string) => {
    updateRuntime({ hudWidgets: hudWidgets.filter(widget => widget.id !== id) });
    if (selectedHudWidgetId === id) setSelectedHudWidgetId('');
  };

  const eraseHudAt = (x: number, y: number) => {
    const next = hudWidgets.filter(widget => !(x >= widget.x && x < widget.x + widget.width && y >= widget.y && y < widget.y + widget.height));
    if (next.length !== hudWidgets.length) updateRuntime({ hudWidgets: next });
  };

  const addCommandAt = (x: number, y: number) => {
    const snapX = Math.max(0, Math.min(255, Math.floor(x / GRID) * GRID));
    const snapY = Math.max(0, Math.min(GAME_H - 1, Math.floor(y / GRID) * GRID));
    if (tool === 'erase') {
      updateComposition(commands.filter(command => !commandContainsPoint(command, snapX, snapY)));
      return;
    }
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
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = Math.floor((event.clientX - rect.left) * (SCREEN_W / rect.width));
    const visibleY = Math.floor((event.clientY - rect.top) * (SCREEN5_VISIBLE_H / rect.height));
    if (visibleY < HUD_H) {
      if (tool === 'erase') eraseHudAt(x, visibleY);
      else if (selectedHudWidget) updateWidget(selectedHudWidget.id, { x: Math.floor(x / GRID) * GRID, y: Math.min(visibleY, HUD_H - 1) });
      return;
    }
    if (visibleY >= GAME_Y_OFFSET && visibleY < GAME_Y_OFFSET + GAME_H) addCommandAt(x, visibleY - GAME_Y_OFFSET);
  };

  const updateAtlasPixels = (pixels: number[][]) => {
    onUpdate({ atlas: { ...room.atlas, width: atlasWidth, height: atlasHeight, offscreenBaseY: room.atlas?.offscreenBaseY || 320, entries: atlasEntries, pixels } });
  };

  const paintTileEditorPixel = (x: number, y: number) => {
    setTileEditorPixels(current => current.map((row, rowIndex) =>
      rowIndex === y ? row.map((slot, colIndex) => colIndex === x ? activeColor : slot) : row
    ));
    setTileEditorMessage('');
  };

  const clearTileEditor = () => {
    setTileEditorPixels(createPixels(TILE_EDITOR_SIZE, TILE_EDITOR_SIZE, 0));
    setTileEditorMessage('');
  };

  const loadSelectedEntryToTileEditor = () => {
    if (!selectedAtlasEntry) {
      setTileEditorMessage('No atlas entry selected.');
      return;
    }
    const next = createPixels(TILE_EDITOR_SIZE, TILE_EDITOR_SIZE, 0);
    for (let y = 0; y < TILE_EDITOR_SIZE; y++) {
      for (let x = 0; x < TILE_EDITOR_SIZE; x++) {
        next[y][x] = atlasPixels[selectedAtlasEntry.sy + y]?.[selectedAtlasEntry.sx + x] ?? 0;
      }
    }
    setTileEditorPixels(next);
    setTileEditorMessage(`Loaded ${selectedAtlasEntry.name}.`);
  };

  const findFreeAtlasTileSlot = (): { x: number; y: number } | null => {
    for (let y = 0; y <= atlasHeight - TILE_EDITOR_SIZE; y += TILE_EDITOR_SIZE) {
      for (let x = 0; x <= atlasWidth - TILE_EDITOR_SIZE; x += TILE_EDITOR_SIZE) {
        const occupied = atlasEntries.some(entry => rectsOverlap(x, y, TILE_EDITOR_SIZE, TILE_EDITOR_SIZE, entry.sx, entry.sy, entry.w, entry.h));
        if (!occupied) return { x, y };
      }
    }
    return null;
  };

  const saveTileEditorToAtlas = () => {
    const slot = findFreeAtlasTileSlot();
    if (!slot) {
      setTileEditorMessage('Atlas is full. Import a larger atlas before saving more 16x16 HUD tiles.');
      return;
    }
    const pixels = atlasPixels.map(row => [...row]);
    for (let y = 0; y < TILE_EDITOR_SIZE; y++) {
      for (let x = 0; x < TILE_EDITOR_SIZE; x++) {
        pixels[slot.y + y][slot.x + x] = tileEditorPixels[y]?.[x] ?? 0;
      }
    }
    const entry: Msx2BitmapRoomAtlasEntry = {
      id: `hud_tile_16x16_${Date.now()}`,
      name: `HUD Tile ${atlasEntries.length + 1}`,
      sx: slot.x,
      sy: slot.y,
      w: TILE_EDITOR_SIZE,
      h: TILE_EDITOR_SIZE,
    };
    onUpdate({
      atlas: {
        ...room.atlas,
        width: atlasWidth,
        height: atlasHeight,
        offscreenBaseY: room.atlas?.offscreenBaseY || 320,
        entries: [...atlasEntries, entry],
        pixels,
      },
    });
    setSelectedAtlasEntryId(entry.id);
    setTileEditorMessage(`Saved ${entry.name}.`);
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

  return (
    <Panel title="MSX2 SCREEN 5 Bitmap Room" icon={<MapIcon />} className="flex-grow flex flex-col bg-msx-bgcolor">
      <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg,.webp" onChange={handleImportAtlas} style={{ display: 'none' }} />
      <div className="p-2 border-b border-msx-border flex flex-wrap items-center gap-2">
        <Button size="sm" variant={tool === 'copy8' ? 'primary' : 'secondary'} onClick={() => setTool('copy8')}>Copy 8x8</Button>
        <Button size="sm" variant={tool === 'copy16' ? 'primary' : 'secondary'} onClick={() => setTool('copy16')}>Copy 16x16</Button>
        <Button size="sm" variant={tool === 'fill' ? 'primary' : 'secondary'} onClick={() => setTool('fill')}>Fill</Button>
        <Button size="sm" variant={tool === 'lineH' ? 'primary' : 'secondary'} onClick={() => setTool('lineH')}>Line H</Button>
        <Button size="sm" variant={tool === 'lineV' ? 'primary' : 'secondary'} onClick={() => setTool('lineV')}>Line V</Button>
        <Button size="sm" variant={tool === 'erase' ? 'primary' : 'secondary'} icon={<TrashIcon />} onClick={() => setTool('erase')} title="Erase by position">Erase</Button>
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
          <MiniWindow title="Atlas Entries" isOpen={isAtlasWindowOpen} onToggle={() => setIsAtlasWindowOpen(value => !value)}>
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
            <div className="mt-3 rounded border border-msx-border bg-msx-bgcolor p-2 text-[0.7rem] text-msx-textsecondary space-y-1">
              <div className="font-semibold text-msx-highlight">SCREEN 5 bitmap export contract</div>
              <div>HUD band: 256x16 persistent at VRAM #0000.</div>
              <div>Room load: 256x192 starts at visual Y=16.</div>
              <div>Commands are internal export data; erase works by position.</div>
            </div>
            <div className="mt-2 rounded border border-msx-border bg-msx-bgcolor p-2 text-[0.7rem] text-msx-textsecondary">
              SCREEN 5 has no 2-color row clash. Imported SCREEN 4 tiles are flattened to bitmap pixels.
            </div>
          </MiniWindow>
        </aside>

        <main className="flex-1 overflow-auto p-3 flex justify-center bg-[#080A0F]">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="border border-msx-border"
            style={{
              imageRendering: 'pixelated',
              cursor: tool === 'erase' ? 'not-allowed' : 'crosshair',
              width: `${SCREEN_W * zoom}px`,
              height: `${SCREEN5_VISIBLE_H * zoom}px`,
              flex: '0 0 auto',
              alignSelf: 'flex-start',
            }}
          />
        </main>

        <aside className="w-96 border-l border-msx-border p-2 overflow-y-auto">
          <div className="space-y-2">
            <MiniWindow title="HUD Creator" isOpen={isHudWindowOpen} onToggle={() => setIsHudWindowOpen(value => !value)}>
              <div className="flex items-center justify-end gap-2 mb-2">
                <Button size="sm" variant={runtime.showHud === false || runtime.hideHud ? 'secondary' : 'primary'} onClick={() => updateRuntime({ showHud: runtime.showHud === false, hideHud: runtime.showHud !== false })}>
                  {runtime.showHud === false || runtime.hideHud ? 'Off' : 'On'}
                </Button>
              </div>
          <label className="block text-xs text-msx-textsecondary mb-2">
            Text Font
            <select
              value={room.runtime?.hudFontAssetId || selectedHudFont?.id || ''}
              onChange={(event) => updateRuntime({ hudFontAssetId: event.target.value || undefined })}
              className="mt-1 w-full bg-msx-bgcolor border border-msx-border rounded p-1 text-xs"
            >
              <option value="">Default 8x8 font</option>
              {hudFonts.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-3 gap-1 mb-3">
            <Button size="sm" variant="secondary" onClick={() => addHudWidget('text', { name: 'Stage Text', text: 'STAGE 1', x: 8, y: 4, width: 64 })}>Text</Button>
            <Button size="sm" variant="secondary" onClick={() => addHudWidget('counter', { name: 'Score', binding: 'score', x: 176, y: 4, width: 48, initialValue: 0 })}>Field</Button>
            <Button size="sm" variant="secondary" onClick={() => addHudWidget('icon', { name: 'Icon', binding: 'custom', x: 120, y: 4, atlasEntryId: selectedAtlasEntry?.id, width: 8, height: 8 })}>Icon</Button>
            <Button size="sm" variant="secondary" onClick={() => addHudWidget('bar', { name: 'Life', binding: 'playerEnergy', x: 8, y: 4, width: 64, height: 6, primaryColor: 10 })}>Life</Button>
            <Button size="sm" variant="secondary" onClick={() => addHudWidget('icon', { name: 'Items', binding: 'collectibles', x: 136, y: 4, atlasEntryId: selectedAtlasEntry?.id, width: 8, height: 8 })}>Items</Button>
            <Button size="sm" variant="secondary" onClick={() => addHudWidget('counter', { name: 'Time', binding: 'air', variableName: 'time', x: 208, y: 4, width: 32, initialValue: runtime.initialAir ?? 255 })}>Time</Button>
          </div>
          {hudWidgets.length === 0 ? (
            <div className="rounded border border-msx-border bg-msx-panelbg p-2 text-xs text-msx-textsecondary">No HUD widgets yet.</div>
          ) : (
            <div className="space-y-2">
              {hudWidgets.map(widget => (
                <div key={widget.id} className={`rounded border p-2 text-xs space-y-2 ${selectedHudWidget?.id === widget.id ? 'border-msx-highlight bg-msx-panelbg' : 'border-msx-border bg-msx-panelbg/70'}`}>
                  <div className="flex items-center gap-2">
                    <button type="button" className="flex-1 text-left font-semibold text-msx-textprimary truncate" onClick={() => setSelectedHudWidgetId(widget.id)}>
                      {widget.name}
                    </button>
                    <button type="button" onClick={() => removeWidget(widget.id)} className="text-msx-danger hover:text-white" title="Delete HUD widget">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={widget.name} onChange={event => updateWidget(widget.id, { name: event.target.value })} className="bg-msx-bgcolor border border-msx-border rounded px-2 py-1" />
                    <select value={widget.binding} onChange={event => updateWidget(widget.id, { binding: event.target.value as Msx2HudWidgetBinding })} className="bg-msx-bgcolor border border-msx-border rounded px-2 py-1">
                      {(['playerEnergy', 'bossEnergy', 'air', 'score', 'lives', 'collectibles', 'custom'] as Msx2HudWidgetBinding[]).map(binding => <option key={binding} value={binding}>{binding === 'air' ? 'time' : binding}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(['x', 'y', 'width', 'height'] as const).map(field => (
                      <label key={field} className="space-y-1 text-msx-textsecondary">
                        {field}
                        <input
                          type="number"
                          min={field === 'width' || field === 'height' ? 1 : 0}
                          max={field === 'y' ? HUD_H - 1 : field === 'height' ? HUD_H : 255}
                          value={widget[field]}
                          onChange={event => updateWidget(widget.id, { [field]: clampByte(event.target.value, widget[field]) } as Partial<Msx2HudWidget>)}
                          className="w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1"
                        />
                      </label>
                    ))}
                  </div>
                  {(widget.kind === 'text' || widget.kind === 'counter') && (
                    <input
                      value={widget.kind === 'text' ? widget.text || '' : widget.variableName || ''}
                      onChange={event => updateWidget(widget.id, widget.kind === 'text' ? { text: event.target.value } : { variableName: event.target.value })}
                      className="w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1"
                      placeholder={widget.kind === 'text' ? 'Text' : 'Variable'}
                    />
                  )}
                  {widget.kind === 'icon' && (
                    <select value={widget.atlasEntryId || ''} onChange={event => updateWidget(widget.id, { atlasEntryId: event.target.value || undefined })} className="w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1">
                      <option value="">Atlas entry by index</option>
                      {atlasEntries.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
                    </select>
                  )}
                  <div className="grid grid-cols-4 gap-2">
                    <label className="space-y-1 text-msx-textsecondary">
                      Value
                      <input type="number" min={0} max={255} value={widget.initialValue ?? 0} onChange={event => updateWidget(widget.id, { initialValue: clampByte(event.target.value, widget.initialValue ?? 0) })} className="w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1" />
                    </label>
                    <label className="space-y-1 text-msx-textsecondary">
                      Max
                      <input type="number" min={1} max={255} value={widget.maxValue ?? 16} onChange={event => updateWidget(widget.id, { maxValue: Math.max(1, clampByte(event.target.value, widget.maxValue ?? 16)) })} className="w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1" />
                    </label>
                    <label className="space-y-1 text-msx-textsecondary">
                      Color
                      <input type="number" min={0} max={15} value={widget.primaryColor ?? 15} onChange={event => updateWidget(widget.id, { primaryColor: clampNibble(event.target.value, widget.primaryColor ?? 15) })} className="w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1" />
                    </label>
                    <label className="space-y-1 text-msx-textsecondary">
                      Empty
                      <input type="number" min={0} max={15} value={widget.emptyColor ?? 4} onChange={event => updateWidget(widget.id, { emptyColor: clampNibble(event.target.value, widget.emptyColor ?? 4) })} className="w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1" />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 rounded border border-msx-border bg-msx-panelbg p-2 text-[0.7rem] text-msx-textsecondary">
            Click inside the HUD band to move the selected widget. Use Erase and click a position to delete room paint or HUD widgets.
          </div>
            </MiniWindow>

            <MiniWindow title="Atlas Tiles" isOpen={isTilePickerWindowOpen} onToggle={() => setIsTilePickerWindowOpen(value => !value)}>
              {atlasEntries.length === 0 ? (
                <div className="rounded border border-msx-border bg-msx-bgcolor p-2 text-xs text-msx-textsecondary">No atlas tiles loaded.</div>
              ) : (
                <div className="max-h-56 overflow-y-auto pr-1">
                  <div className="grid grid-cols-3 gap-2">
                    {atlasEntries.map(entry => (
                      <AtlasTilePreview
                        key={entry.id}
                        entry={entry}
                        atlasPixels={atlasPixels}
                        slots={slots}
                        isSelected={entry.id === selectedAtlasEntry?.id}
                        onSelect={() => setSelectedAtlasEntryId(entry.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </MiniWindow>

          <MiniWindow title="16x16 Tile Editor" isOpen={isTileEditorWindowOpen} onToggle={() => setIsTileEditorWindowOpen(value => !value)}>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Button size="sm" variant="secondary" icon={<SaveFloppyIcon />} onClick={saveTileEditorToAtlas}>Add 16x16 to Atlas</Button>
              <Button size="sm" variant="secondary" onClick={loadSelectedEntryToTileEditor}>Load Selected</Button>
              <Button size="sm" variant="secondary" icon={<EraserIcon />} onClick={clearTileEditor}>Clear</Button>
            </div>
            <div className="flex gap-3 items-start">
              <div
                className="grid border border-msx-border bg-msx-bgcolor"
                style={{
                  gridTemplateColumns: `repeat(${TILE_EDITOR_SIZE}, 12px)`,
                  gridTemplateRows: `repeat(${TILE_EDITOR_SIZE}, 12px)`,
                }}
              >
                {tileEditorPixels.flatMap((row, y) => row.map((slot, x) => (
                  <button
                    key={`${x}_${y}`}
                    type="button"
                    title={`x ${x}, y ${y}, color ${slot}`}
                    className="border border-black/50"
                    style={{ width: 12, height: 12, backgroundColor: slots[slot]?.hex === 'rgba(0,0,0,0)' ? '#000' : slots[slot]?.hex || FALLBACK_HEX }}
                    onClick={() => paintTileEditorPixel(x, y)}
                  />
                )))}
              </div>
              <div className="min-w-0 flex-1 space-y-2 text-xs text-msx-textsecondary">
                <div className="grid grid-cols-4 gap-1">
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
                <div className="rounded border border-msx-border bg-msx-bgcolor p-2 text-[0.7rem]">
                  Active color: {activeColor}
                </div>
                {tileEditorMessage && (
                  <div className="rounded border border-msx-border bg-msx-bgcolor p-2 text-[0.7rem] text-msx-highlight">
                    {tileEditorMessage}
                  </div>
                )}
              </div>
            </div>
          </MiniWindow>
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
