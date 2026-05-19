import { DEFAULT_SCREEN5_CUSTOM_PALETTE } from '../../../../constants';
import { GameFlowConnection, GameFlowNode, Msx2Sprite, PaletteAsset, Screen5PaletteSlot, ScreenMap, Tile } from '../../../../types';
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
const SCREEN5_SPRATR_VRAM = '#7600';
const SCREEN5_SPRCOL_VRAM = '#7400';
const SCREEN5_SPRPAT_VRAM = '#7800';

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

function getHardwareSpriteSource(analysis: ProjectAnalysis): Msx2Sprite | undefined {
  return analysis.msx2Sprites?.[0];
}

function getHardwareSpriteSettings(sprite: Msx2Sprite): { x: number; y: number; color: number; patternIndex: number } {
  const hardware = sprite.hardware || {};
  return {
    x: Number.isFinite(Number(hardware.x)) ? Number(hardware.x) : 56,
    y: Number.isFinite(Number(hardware.y)) ? Number(hardware.y) : 120,
    color: Number.isFinite(Number(hardware.color)) ? Number(hardware.color) : 5,
    patternIndex: Number.isFinite(Number(hardware.patternIndex)) ? Number(hardware.patternIndex) : 0,
  };
}

function isTransparentSpritePixel(color: string | undefined, sprite: Msx2Sprite): boolean {
  const normalized = normalizeColor(color);
  if (!normalized || normalized === TRANSPARENT_HEX) return true;
  return normalized === normalizeColor(sprite.backgroundColor);
}

function spritePatternByte(sprite: Msx2Sprite, x0: number, y: number): number {
  const frame = sprite.frames?.[sprite.currentFrameIndex || 0] || sprite.frames?.[0];
  let value = 0;
  for (let bit = 0; bit < 8; bit++) {
    const x = x0 + bit;
    const color = frame?.data?.[y]?.[x];
    if (!isTransparentSpritePixel(color, sprite)) {
      value |= 0x80 >> bit;
    }
  }
  return value;
}

function buildHardwareSpritePattern(sprite: Msx2Sprite | undefined): number[] {
  if (!sprite) return [];
  const bytes: number[] = [];
  // V9938 16x16 sprites use four consecutive 8x8 patterns:
  // top-left, top-right, bottom-left, bottom-right.
  for (let y = 0; y < 8; y++) bytes.push(spritePatternByte(sprite, 0, y));
  for (let y = 0; y < 8; y++) bytes.push(spritePatternByte(sprite, 8, y));
  for (let y = 8; y < 16; y++) bytes.push(spritePatternByte(sprite, 0, y));
  for (let y = 8; y < 16; y++) bytes.push(spritePatternByte(sprite, 8, y));
  return bytes;
}

function paletteSlotForSpriteColor(sprite: Msx2Sprite, color: string | undefined): number | undefined {
  const normalized = normalizeColor(color);
  if (!normalized || isTransparentSpritePixel(color, sprite)) return undefined;
  const slotIndex = sprite.palette?.find(slot => normalizeColor(slot.hex) === normalized)?.slotIndex;
  if (typeof slotIndex === 'number' && slotIndex > 0 && slotIndex < 16) return slotIndex;
  return undefined;
}

function buildHardwareSpriteLineColors(sprite: Msx2Sprite, fallbackColor: number): number[] {
  const frame = sprite.frames?.[sprite.currentFrameIndex || 0] || sprite.frames?.[0];
  return Array.from({ length: 16 }, (_, y) => {
    const row = frame?.data?.[y] || [];
    for (let x = 0; x < 16; x++) {
      const slot = paletteSlotForSpriteColor(sprite, row[x]);
      if (slot !== undefined) return slot;
    }
    return 0;
  }).map(color => color === 0 ? 0 : Math.max(1, Math.min(15, color || fallbackColor)));
}

function hasHardwareSprite(analysis: ProjectAnalysis): boolean {
  const sprite = getHardwareSpriteSource(analysis);
  return Boolean(sprite?.frames?.[0]?.data);
}

function buildHardwareSpriteInitAsm(analysis: ProjectAnalysis): string {
  const sprite = getHardwareSpriteSource(analysis);
  if (!sprite) return '';
  return `init_hardware_sprites:
    ; SCREEN 5 hardware sprite MVP. Clobbers AF/BC/DE/HL.
    ; R#1 = #E2 selects 16x16 sprites and keeps display/IRQ bits compatible with BIOS use.
    ld bc, #E201
    call WRTVDP
    ld a, #E2
    ld (#F3E0), a

    ; Sprite attribute/color/pattern tables live above the SCREEN 5 bitmap.
    ; R#5 selects SAT #7600. R#11 remains 0 because the table is below 64KB.
    ld bc, #EC05
    call WRTVDP
    ld bc, #000B
    call WRTVDP
    ld bc, #0F06
    call WRTVDP

    ld hl, msx2_hw_sprite_pattern_0
    ld de, ${SCREEN5_SPRPAT_VRAM}
    ld bc, 32
    call copy_to_vram_ext

    ld hl, msx2_hw_sprite_colors_0
    ld de, ${SCREEN5_SPRCOL_VRAM}
    ld bc, 16
    call copy_to_vram_ext

    ld hl, msx2_hw_sprite_attrs
    ld de, ${SCREEN5_SPRATR_VRAM}
    ld bc, 128
    call copy_to_vram_ext

    xor a
    ld bc, #000E
    call WRTVDP
    ret

copy_to_vram_ext:
    ; HL=RAM/ROM source, DE=absolute VRAM destination, BC=length. Clobbers AF/BC/DE/HL.
    ld a, d
    and #C0
    rlca
    rlca
    out (VDP_CTRL_PORT), a
    ld a, #8E
    out (VDP_CTRL_PORT), a
    ld a, e
    out (VDP_CTRL_PORT), a
    ld a, d
    and #3F
    or #40
    out (VDP_CTRL_PORT), a
.copy_loop:
    ld a, (hl)
    out (VDP_DATA_PORT), a
    inc hl
    dec bc
    ld a, b
    or c
    jr nz, .copy_loop
    ret

`;
}

function buildHardwareSpriteDataAsm(analysis: ProjectAnalysis): string {
  const sprite = getHardwareSpriteSource(analysis);
  if (!sprite) return '';
  const settings = getHardwareSpriteSettings(sprite);
  const y = Math.max(0, Math.min(211, settings.y));
  const x = Math.max(0, Math.min(255, settings.x));
  const color = Math.max(1, Math.min(15, settings.color));
  const patternIndex = Math.max(0, Math.min(252, settings.patternIndex));
  const pattern = buildHardwareSpritePattern(sprite);
  const attributes = [y, x, patternIndex, 0, 216, 0, 0, 0, ...Array(120).fill(0)];
  const colors = buildHardwareSpriteLineColors(sprite, color);

  return `
${formatBytes('msx2_hw_sprite_pattern_0', pattern, `Hardware sprite pattern: ${sprite.name || 'sprite 0'}`)}
${formatBytes('msx2_hw_sprite_colors_0', colors, 'Hardware sprite line colors for V9938 sprite mode 2')}
${formatBytes('msx2_hw_sprite_attrs', attributes, 'Sprite 0 visible; sprite 1 Y=216 terminates the SAT')}
`;
}

function defaultTargetNodeId(connections: GameFlowConnection[] | undefined, nodeId: string): string | undefined {
  return (connections || []).find(connection =>
    connection.from?.nodeId === nodeId && !connection.from?.sourceId
  )?.to?.nodeId;
}

function resolveScreenByAssetId(analysis: ProjectAnalysis, assetId: string | undefined): ScreenMap | undefined {
  if (!assetId) return undefined;
  const assets = (analysis as any).assets as Array<{ id?: string; type?: string; data?: unknown }> | undefined;
  const asset = assets?.find(item => item.id === assetId && item.type === 'screenmap');
  if (asset?.data) return asset.data as ScreenMap;
  return (analysis.screenMaps || []).find(screen => screen.id === assetId);
}

function collectReferencedScreens(analysis: ProjectAnalysis): ScreenMap[] {
  const screens = new Map<string, ScreenMap>();
  const addScreen = (screen: ScreenMap | undefined) => {
    if (!screen) return;
    screens.set(screen.id || screen.name || `screen_${screens.size}`, screen);
  };

  addScreen(analysis.screenMaps?.[0]);

  for (const node of analysis.gameFlow?.nodes || []) {
    if (node.type === 'Text') {
      addScreen(resolveScreenByAssetId(analysis, node.appearance?.backgroundScreenAssetId));
    } else if (node.type === 'SubMenu') {
      addScreen(resolveScreenByAssetId(analysis, node.appearance?.backgroundScreenAssetId));
    } else if (node.type === 'Restart') {
      addScreen(resolveScreenByAssetId(analysis, node.appearance?.backgroundScreenAssetId));
    }
  }

  return Array.from(screens.values());
}

function buildMsx2GameFlowProgram(analysis: ProjectAnalysis, screenLabels: Map<string, string>): string {
  const graph = analysis.gameFlow;
  const fallbackLabel = screenLabels.values().next().value;
  if (!graph?.nodes?.length) {
    return fallbackLabel ? `    call load_${fallbackLabel}_bitmap\n` : '';
  }

  const nodeById = new Map(graph.nodes.map(node => [node.id, node]));
  const startNodeId = graph.startNodeId || graph.nodes.find(node => node.type === 'Start')?.id;
  const lines: string[] = [
    '    ; MSX2 minimal GameFlow: Start/Text(background)/Transition(cls)/End.',
  ];
  const unsupported = new Set<string>();
  const visited = new Set<string>();
  let terminated = false;
  let current: GameFlowNode | undefined = startNodeId ? nodeById.get(startNodeId) : undefined;

  while (current && !visited.has(current.id)) {
    visited.add(current.id);

    switch (current.type) {
      case 'Start':
      case 'Waypoint':
      case 'Globals':
      case 'Music':
        break;
      case 'Text': {
        const screen = resolveScreenByAssetId(analysis, current.appearance?.backgroundScreenAssetId) || analysis.screenMaps?.[0];
        const label = screen ? screenLabels.get(screen.id || screen.name) : undefined;
        if (label) lines.push(`    call load_${label}_bitmap`);
        lines.push('    call wait_key');
        break;
      }
      case 'SubMenu': {
        const screen = resolveScreenByAssetId(analysis, current.appearance?.backgroundScreenAssetId) || analysis.screenMaps?.[0];
        const label = screen ? screenLabels.get(screen.id || screen.name) : undefined;
        if (label) lines.push(`    call load_${label}_bitmap`);
        lines.push('    call wait_key');
        break;
      }
      case 'Transition':
        if (current.effect === 'cls') {
          lines.push('    call clear_screen5_bitmap');
        } else {
          unsupported.add(`Transition:${current.effect}`);
        }
        break;
      case 'End':
        lines.push('    jp .main_loop');
        terminated = true;
        current = undefined;
        continue;
      case 'Restart':
        lines.push('    jp init_rom');
        terminated = true;
        current = undefined;
        continue;
      default:
        unsupported.add(current.type);
        break;
    }

    const nextNodeId = defaultTargetNodeId(graph.connections, current.id);
    current = nextNodeId ? nodeById.get(nextNodeId) : undefined;
  }

  if (unsupported.size > 0) {
    lines.push(`    ; Unsupported MSX2 GameFlow nodes skipped in MVP: ${Array.from(unsupported).join(', ')}`);
  }

  if (!terminated) {
    lines.push('    jp .main_loop');
  }
  return `${lines.join('\n')}\n`;
}

function generateUnitedFiles(projectName: string, analysis: ProjectAnalysis, config: Msx2Screen5Config): string {
  const screens = collectReferencedScreens(analysis);
  const slots = resolveScreen5Palette(analysis);
  const paletteBytes = buildPaletteBytes(slots);
  const title = projectName.replace(/[^ -~]/g, '');
  const screenLabels = new Map<string, string>();
  const screenBitmapBlocks = screens.map((screen, index) => {
    const label = sanitizeLabel(screen?.name || `screen5_screen_${index}`, `SCREEN5_SCREEN_${index}`);
    screenLabels.set(screen.id || screen.name || `screen_${index}`, label);
    return formatBytes(
      `${label}_BITMAP`,
      buildScreen5BitmapBytes(screen, analysis.tiles || [], slots),
      `${screen?.name || `Screen ${index}`} rasterized as SCREEN 5, 2 pixels per byte`
    );
  });
  const firstScreen = screens[0] || analysis.screenMaps?.[0];
  const firstScreenLabel = firstScreen
    ? screenLabels.get(firstScreen.id || firstScreen.name) || sanitizeLabel(firstScreen.name, 'SCREEN5_SCREEN_0')
    : 'SCREEN5_SCREEN_0';
  const gameFlowProgram = buildMsx2GameFlowProgram(analysis, screenLabels);
  const hardwareSpriteInitAsm = buildHardwareSpriteInitAsm(analysis);
  const hardwareSpriteDataAsm = buildHardwareSpriteDataAsm(analysis);

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
FILVRM  EQU #0056
WRTVDP  EQU #0047
LDIRVM  EQU #005C
CHGCLR  EQU #0062
CHGET   EQU #009F
HKEY    EQU #F3DB
CLIKSW  EQU #F3DC
BAKCLR  EQU #F3E9
BDRCLR  EQU #F3EA

VDP_PALETTE_PORT EQU #9A
VDP_DATA_PORT EQU #98
VDP_CTRL_PORT EQU #99
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
    call load_${firstScreenLabel}_bitmap
${hasHardwareSprite(analysis) ? '    call init_hardware_sprites\n' : ''}
    call ENASCR
    ei

${gameFlowProgram}
.main_loop:
    halt
    jr .main_loop

wait_key:
    call CHGET
    ret

clear_screen5_bitmap:
    xor a
    ld hl, SCREEN5_BITMAP_VRAM
    ld bc, SCREEN5_BITMAP_SIZE
    call FILVRM
    ret

${hardwareSpriteInitAsm}
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

load_${firstScreenLabel}_bitmap:
    ld hl, ${firstScreenLabel}_BITMAP
    ld de, SCREEN5_BITMAP_VRAM
    ld bc, SCREEN5_BITMAP_SIZE
    call LDIRVM
    ret

${screens.slice(1).map(screen => {
  const label = screenLabels.get(screen.id || screen.name);
  return `load_${label}_bitmap:
    ld hl, ${label}_BITMAP
    ld de, SCREEN5_BITMAP_VRAM
    ld bc, SCREEN5_BITMAP_SIZE
    call LDIRVM
    ret
`;
}).join('\n')}
${formatBytes('screen5_palette_data', paletteBytes, 'Palette bytes: byte1=(R<<4)|B, byte2=G')}
${hardwareSpriteDataAsm}
${screenBitmapBlocks.join('\n')}
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
    'interrupt.asm': '; MSX2 SCREEN 5 backend uses BIOS CHGET and HALT loop in MVP.\n',
    'header.asm': '; MSX2 SCREEN 5 backend header is emitted in unitedFiles.asm.\n',
    'patterns.asm': '; SCREEN 2 pattern tables are intentionally not used by MSX2 SCREEN 5.\n',
    'colors.asm': '; SCREEN 2 color tables are intentionally not used by MSX2 SCREEN 5.\n',
    'components.asm': '; Components are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'entities.asm': '; Entities are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'worlds.asm': '; Worlds are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'screens.asm': '; SCREEN 5 bitmap data is emitted in unitedFiles.asm.\n',
    'sprites.asm': hasHardwareSprite(analysis)
      ? '; MSX2 SCREEN 5 hardware sprite MVP is emitted inline in unitedFiles.asm.\n'
      : '; Sprites are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'font.asm': '; Font is out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'hud.asm': '; HUD is out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'menus.asm': '; Menus are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'sound.asm': '; Sound is out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'scroll.asm': '; Scroll is out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'animtiles.asm': '; Animated tiles are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'bosses.asm': '; Bosses are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'statemachine.asm': '; State machines are out of scope for the first MSX2 SCREEN 5 backend slice.\n',
    'gameflow.asm': '; MSX2 SCREEN 5 minimal GameFlow is emitted inline in unitedFiles.asm.\n',
    'main.asm': unitedFiles,
    'unitedFiles.asm': unitedFiles,
  };
}
