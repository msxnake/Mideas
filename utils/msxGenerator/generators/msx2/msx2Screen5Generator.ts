import { DEFAULT_SCREEN5_CUSTOM_PALETTE } from '../../../../constants';
import { PaletteAsset, Screen5PaletteSlot, ScreenMap, Tile } from '../../../../types';
import { ProjectAnalysis } from '../../../asmTemplateGenerator';
import { GeneratedASMFiles } from '../../types/asmTypes';
import type { MSXMapperFormat, MSXRomMode } from '../../index';

interface Msx2Screen5Config {
  screenMode: 'SCREEN 5 (Graphics III)';
  romMode: MSXRomMode;
  targetFormat: MSXMapperFormat;
}

const SCREEN5_WIDTH = 256;
const SCREEN5_HEIGHT = 212;
const SCREEN5_BYTES = (SCREEN5_WIDTH * SCREEN5_HEIGHT) / 2;
const CELL_SIZE = 8;
const TRANSPARENT_HEX = 'RGBA(0,0,0,0)';

const sanitizeLabel = (value: string, fallback: string): string =>
  String(value || fallback)
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^([0-9])/, '_$1')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase() || fallback.toUpperCase();

const normalizeColor = (value: string | undefined): string =>
  String(value || '').trim().toUpperCase();

const parseHexColor = (hex: string): { r: number; g: number; b: number } | null => {
  const normalized = normalizeColor(hex);
  if (!/^#[0-9A-F]{6}$/.test(normalized)) return null;
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
};

const colorDistance = (a: string, b: string): number => {
  const ca = parseHexColor(a);
  const cb = parseHexColor(b);
  if (!ca || !cb) return Number.MAX_SAFE_INTEGER;
  const dr = ca.r - cb.r;
  const dg = ca.g - cb.g;
  const db = ca.b - cb.b;
  return dr * dr + dg * dg + db * db;
};

function resolveScreen5Palette(analysis: ProjectAnalysis): Screen5PaletteSlot[] {
  const assets = (analysis as any).assets as Array<{ type?: string; data?: unknown }> | undefined;
  const paletteAsset = assets?.find(asset => asset?.type === 'palette')?.data as PaletteAsset | undefined;
  if (paletteAsset?.mode === 'SCREEN5' && paletteAsset.slots?.length === 16) {
    return paletteAsset.slots.map(slot => ({ ...slot }));
  }

  const tilePalette = (analysis.tiles || []).find(tile => tile.screen5Palette?.length === 16)?.screen5Palette;
  if (tilePalette?.length === 16) {
    return tilePalette.map(slot => ({ ...slot }));
  }

  return DEFAULT_SCREEN5_CUSTOM_PALETTE.map(slot => ({ ...slot }));
}

function paletteIndexForColor(color: string | undefined, slots: Screen5PaletteSlot[]): number {
  const normalized = normalizeColor(color);
  if (!normalized || normalized === TRANSPARENT_HEX) return 0;

  const exactIndex = slots.findIndex(slot => normalizeColor(slot.hex) === normalized);
  if (exactIndex >= 0) return exactIndex & 0x0f;

  let bestIndex = 0;
  let bestDistance = Number.MAX_SAFE_INTEGER;
  for (let i = 1; i < slots.length; i++) {
    const distance = colorDistance(normalized, slots[i].hex);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }
  return bestIndex & 0x0f;
}

function getTilePixel(tile: Tile | undefined, subTileX: number, subTileY: number, x: number, y: number): string | undefined {
  if (!tile) return undefined;
  return tile.data?.[(subTileY * CELL_SIZE) + y]?.[(subTileX * CELL_SIZE) + x];
}

function buildScreen5BitmapBytes(screen: ScreenMap | undefined, tiles: Tile[], slots: Screen5PaletteSlot[]): number[] {
  const bytes: number[] = [];
  const tileById = new Map(tiles.map(tile => [tile.id, tile]));
  const backgroundLayer = screen?.layers?.background || [];

  for (let y = 0; y < SCREEN5_HEIGHT; y++) {
    const cellY = Math.floor(y / CELL_SIZE);
    const pixelY = y % CELL_SIZE;
    for (let byteX = 0; byteX < SCREEN5_WIDTH / 2; byteX++) {
      const x0 = byteX * 2;
      const x1 = x0 + 1;
      const cellX0 = Math.floor(x0 / CELL_SIZE);
      const cellX1 = Math.floor(x1 / CELL_SIZE);
      const screenTile0 = backgroundLayer[cellY]?.[cellX0];
      const screenTile1 = backgroundLayer[cellY]?.[cellX1];
      const tile0 = screenTile0?.tileId ? tileById.get(screenTile0.tileId) : undefined;
      const tile1 = screenTile1?.tileId ? tileById.get(screenTile1.tileId) : undefined;
      const hi = paletteIndexForColor(
        getTilePixel(tile0, screenTile0?.subTileX || 0, screenTile0?.subTileY || 0, x0 % CELL_SIZE, pixelY),
        slots
      );
      const lo = paletteIndexForColor(
        getTilePixel(tile1, screenTile1?.subTileX || 0, screenTile1?.subTileY || 0, x1 % CELL_SIZE, pixelY),
        slots
      );
      bytes.push(((hi & 0x0f) << 4) | (lo & 0x0f));
    }
  }

  return bytes;
}

function buildPaletteBytes(slots: Screen5PaletteSlot[]): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < 16; i++) {
    const slot = slots[i];
    if (!slot || slot.masterIndex < 0) {
      bytes.push(0, 0);
      continue;
    }
    const r = (slot.masterIndex >> 6) & 0x07;
    const g = (slot.masterIndex >> 3) & 0x07;
    const b = slot.masterIndex & 0x07;
    bytes.push((r << 4) | b, g);
  }
  return bytes;
}

function formatBytes(label: string, bytes: number[], comment?: string): string {
  const lines: string[] = [];
  if (comment) lines.push(`; ${comment}`);
  lines.push(`${label}:`);
  for (let offset = 0; offset < bytes.length; offset += 16) {
    lines.push(`    DB ${bytes.slice(offset, offset + 16).map(value => `#${value.toString(16).toUpperCase().padStart(2, '0')}`).join(',')}`);
  }
  return `${lines.join('\n')}\n`;
}

function generateUnitedFiles(projectName: string, analysis: ProjectAnalysis, config: Msx2Screen5Config): string {
  const screen = analysis.screenMaps?.[0];
  const screenLabel = sanitizeLabel(screen?.name || 'screen5_screen_0', 'SCREEN5_SCREEN_0');
  const slots = resolveScreen5Palette(analysis);
  const bitmapBytes = buildScreen5BitmapBytes(screen, analysis.tiles || [], slots);
  const paletteBytes = buildPaletteBytes(slots);
  const title = projectName.replace(/[^ -~]/g, '');

  return `; ==================================================================
; Mideas MSX2 SCREEN 5 bitmap backend
; Project: ${title}
; Screen mode: ${config.screenMode}
; ROM mode requested: ${config.romMode}
; Mapper requested: ${config.targetFormat}
; ==================================================================

CHGMOD  EQU #005F
DISSCR  EQU #0041
ENASCR  EQU #0044
WRTVDP  EQU #0047
LDIRVM  EQU #005C
CHGCLR  EQU #0062
HKEY    EQU #F3DB
CLIKSW  EQU #F3DC
BAKCLR  EQU #F3E9
BDRCLR  EQU #F3EA

VDP_PALETTE_PORT EQU #9A
SCREEN5_BITMAP_VRAM EQU #0000
SCREEN5_BITMAP_SIZE EQU ${SCREEN5_BYTES}

    org #4000

    db "AB"
    dw init_rom
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0
    dw 0

init_rom:
    di
    im 1
    ld sp, #F380

    ld a, #C9
    ld (HKEY), a
    xor a
    ld (CLIKSW), a
    ld (BAKCLR), a
    ld (BDRCLR), a
    call CHGCLR

    call DISSCR
    ld a, 5
    call CHGMOD

    ; Enable 212-line display on V9938/V9958.
    ld bc, #8009
    call WRTVDP

    call load_screen5_palette
    call load_${screenLabel}_bitmap
    call ENASCR
    ei

.main_loop:
    halt
    jr .main_loop

load_screen5_palette:
    ; R#16 selects the first palette register; port #9A receives 2 bytes per slot.
    ld bc, #0010
    call WRTVDP
    ld hl, screen5_palette_data
    ld b, 32
.palette_loop:
    ld a, (hl)
    out (VDP_PALETTE_PORT), a
    inc hl
    djnz .palette_loop
    ret

load_${screenLabel}_bitmap:
    ld hl, ${screenLabel}_BITMAP
    ld de, SCREEN5_BITMAP_VRAM
    ld bc, SCREEN5_BITMAP_SIZE
    call LDIRVM
    ret

${formatBytes('screen5_palette_data', paletteBytes, 'Palette bytes: byte1=(R<<4)|B, byte2=G')}
${formatBytes(`${screenLabel}_BITMAP`, bitmapBytes, `${screen?.name || 'First screen'} rasterized as SCREEN 5, 2 pixels per byte`)}
    ds #C000 - $, #FF
    end
`;
}

export function generateMsx2Screen5Files(
  projectName: string,
  analysis: ProjectAnalysis,
  config: Msx2Screen5Config
): GeneratedASMFiles {
  const unitedFiles = generateUnitedFiles(projectName, analysis, config);
  return {
    'page0.asm': '; MSX2 SCREEN 5 backend: page0 not used in MVP.\n',
    'bios.asm': '; MSX2 SCREEN 5 backend emits BIOS equates in unitedFiles.asm.\n',
    'constants.asm': '; MSX2 SCREEN 5 backend constants are local to unitedFiles.asm.\n',
    'variables.asm': '; MSX2 SCREEN 5 backend has no RAM variables in MVP.\n',
    'mapper.asm': '; MSX2 SCREEN 5 backend MVP is a simple ROM path.\n',
    'resource_ids.asm': '; MSX2 SCREEN 5 backend has no resource table in MVP.\n',
    'resource_table.asm': '; MSX2 SCREEN 5 backend has no resource table in MVP.\n',
    'resource_manager.asm': '; MSX2 SCREEN 5 backend has no resource manager in MVP.\n',
    'interrupt.asm': '; MSX2 SCREEN 5 backend uses HALT loop in MVP.\n',
    'header.asm': '; MSX2 SCREEN 5 backend header is emitted in unitedFiles.asm.\n',
    'patterns.asm': '; SCREEN 2 pattern tables are intentionally not used by MSX2 SCREEN 5.\n',
    'colors.asm': '; SCREEN 2 color tables are intentionally not used by MSX2 SCREEN 5.\n',
    'components.asm': '; Components are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'entities.asm': '; Entities are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'worlds.asm': '; Worlds are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'screens.asm': '; SCREEN 5 bitmap data is emitted in unitedFiles.asm.\n',
    'sprites.asm': '; Sprites are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'font.asm': '; Font is out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'hud.asm': '; HUD is out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'menus.asm': '; Menus are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'sound.asm': '; Sound is out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'scroll.asm': '; Scroll is out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'animtiles.asm': '; Animated tiles are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'bosses.asm': '; Bosses are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'statemachine.asm': '; State machines are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'gameflow.asm': '; GameFlow is out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'main.asm': unitedFiles,
    'unitedFiles.asm': unitedFiles,
  };
}
