import { Msx2Screen5PresentationConfig, Screen5PaletteSlot } from '../../../../types';
import { ProjectAnalysis } from '../../../asmTemplateGenerator';
import { GeneratedASMFiles } from '../../types/asmTypes';
import type { MSXMapperFormat, MSXRomMode } from '../../index';

interface Msx2Screen5PresentationGeneratorConfig {
  screenMode: 'SCREEN 5 (Graphics III)';
  romMode: MSXRomMode;
  targetFormat: MSXMapperFormat;
  autoMegaROM?: boolean;
}

const SCREEN_WIDTH = 256;
const VISIBLE_HEIGHT = 212;
const BYTES_PER_LINE = SCREEN_WIDTH / 2;
const BITMAP_BYTE_COUNT = VISIBLE_HEIGHT * BYTES_PER_LINE;

const clampByte = (value: unknown, fallback = 0): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(255, Math.trunc(numeric)));
};

const clampLevel = (value: unknown, fallback = 0): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(7, Math.trunc(numeric)));
};

const hexByte = (value: number): string => `#${(value & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;

function firstPresentation(analysis: ProjectAnalysis): Msx2Screen5PresentationConfig | undefined {
  return ((analysis as any).msx2Presentations || [])[0] as Msx2Screen5PresentationConfig | undefined;
}

function parseHexColor(hex: unknown): [number, number, number] | null {
  if (typeof hex !== 'string') return null;
  const match = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!match) return null;
  const value = parseInt(match[1], 16);
  return [
    Math.round(((value >> 16) & 0xff) * 7 / 255),
    Math.round(((value >> 8) & 0xff) * 7 / 255),
    Math.round((value & 0xff) * 7 / 255),
  ];
}

function resolvePaletteSlot(slot: Screen5PaletteSlot | undefined): [number, number, number] {
  const masterIndex = Number(slot?.masterIndex);
  if (Number.isFinite(masterIndex) && masterIndex >= 0) {
    const index = Math.max(0, Math.min(511, Math.trunc(masterIndex)));
    return [(index >> 6) & 0x07, (index >> 3) & 0x07, index & 0x07];
  }
  const fromHex = parseHexColor((slot as any)?.hex);
  if (fromHex) return fromHex.map(value => clampLevel(value)) as [number, number, number];
  return [0, 0, 0];
}

function buildPaletteBytes(palette: Screen5PaletteSlot[] | undefined): number[] {
  const source = Array.isArray(palette) ? palette : [];
  return Array.from({ length: 16 }, (_unused, slotIndex) => {
    const slot = source.find(item => item?.slotIndex === slotIndex) || source[slotIndex];
    const [r, g, b] = resolvePaletteSlot(slot);
    return [(r << 4) | b, g];
  }).flat();
}

function buildBitmapBytes(presentation: Msx2Screen5PresentationConfig): number[] {
  const source = Array.isArray(presentation.packedBitmap) ? presentation.packedBitmap : [];
  const imageHeight = presentation.height === 212 ? 212 : 192;
  const imageBytes = Math.min(imageHeight * BYTES_PER_LINE, source.length);
  const bytes = Array.from({ length: BITMAP_BYTE_COUNT }, () => 0);
  for (let index = 0; index < imageBytes; index++) {
    bytes[index] = clampByte(source[index], 0);
  }
  return bytes;
}

function formatBytes(label: string, bytes: number[], comment?: string): string {
  const lines: string[] = [];
  if (comment) lines.push(`; ${comment}`);
  lines.push(`${label}:`);
  for (let offset = 0; offset < bytes.length; offset += 16) {
    lines.push(`    DB ${bytes.slice(offset, offset + 16).map(hexByte).join(',')}`);
  }
  return `${lines.join('\n')}\n`;
}

function generateWaitLoop(presentation: Msx2Screen5PresentationConfig): string {
  const runtime = presentation.runtime;
  if (runtime.waitForKey !== false) {
    return `.main_loop:
    call CHGET
    jp .main_loop`;
  }
  const waitForFrames = Math.max(0, Math.min(255, Math.trunc(Number(runtime.waitForFrames) || 0)));
  if (waitForFrames > 0) {
    return `    ld b, ${hexByte(waitForFrames)}
.frame_wait:
    halt
    djnz .frame_wait
.main_loop:
    halt
    jp .main_loop`;
  }
  return `.main_loop:
    halt
    jp .main_loop`;
}

function normalizePresentation(presentation: Msx2Screen5PresentationConfig | undefined): Msx2Screen5PresentationConfig {
  return {
    enabled: presentation?.enabled !== false,
    name: presentation?.name || 'MSX2 SCREEN 5 Presentation',
    target: 'MSX2',
    screenMode: 'SCREEN 5',
    sourceFileName: presentation?.sourceFileName || null,
    sourceImageWidth: Number(presentation?.sourceImageWidth) || 0,
    sourceImageHeight: Number(presentation?.sourceImageHeight) || 0,
    width: 256,
    height: presentation?.height === 212 ? 212 : 192,
    fitMode: presentation?.fitMode || 'cover',
    palette: Array.isArray(presentation?.palette) ? presentation!.palette : [],
    pixels: Array.isArray(presentation?.pixels) ? presentation!.pixels : [],
    packedBitmap: Array.isArray(presentation?.packedBitmap) ? presentation!.packedBitmap : [],
    compression: presentation?.compression || { codec: 'ZX0', enabled: false, chunkLines: 32 },
    runtime: {
      showAtBoot: presentation?.runtime?.showAtBoot !== false,
      clearSpritesBeforeShow: presentation?.runtime?.clearSpritesBeforeShow !== false,
      waitForKey: presentation?.runtime?.waitForKey !== false,
      waitForFrames: Number(presentation?.runtime?.waitForFrames) || 0,
      vramPage: presentation?.runtime?.vramPage === 1 ? 1 : 0,
      romDataGroup: presentation?.runtime?.romDataGroup || 'auto',
    },
  };
}

function generateUnitedFiles(projectName: string, analysis: ProjectAnalysis, config: Msx2Screen5PresentationGeneratorConfig): string {
  const presentation = normalizePresentation(firstPresentation(analysis));
  const paletteBytes = buildPaletteBytes(presentation.palette);
  const bitmapBytes = buildBitmapBytes(presentation);
  const vramBase = presentation.runtime.vramPage === 1 ? '#8000' : '#0000';

  return `; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 5 presentation backend
; Project: ${projectName}
; Presentation: ${presentation.name}
; Screen mode: ${config.screenMode}
; Backend: msx2-screen5-presentation
; ==================================================================

CHGMOD  EQU #005F
DISSCR  EQU #0041
ENASCR  EQU #0044
LDIRVM  EQU #005C
CHGET   EQU #009F
WRTVDP  EQU #0047
RSLREG  EQU #0138
ENASLT  EQU #0024
VDP_PALETTE_PORT EQU #9A

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
    call map_page2_to_cart_primary
    call DISSCR
    ld a, 5
    call CHGMOD
    ld bc, #0007
    call WRTVDP
    call load_screen5_palette
    ld hl, screen5_presentation_bitmap_data
    ld de, ${vramBase}
    ld bc, SCREEN5_PRESENTATION_BITMAP_SIZE
    call LDIRVM
    call ENASCR
    ei
${generateWaitLoop(presentation)}

map_page2_to_cart_primary:
    ; Map #8000-#BFFF to the same primary/expanded slot as cart page #4000.
    call RSLREG
    rrca
    rrca
    call get_cart_slot_value
    ld h, #80
    jp ENASLT

get_cart_slot_value:
    and #03
    ld c, a
    ld b, 0
    ld hl, #FCC1
    add hl, bc
    ld a, (hl)
    and #80
    jr z, .slot_ready
    or c
    ld c, a
    inc hl
    inc hl
    inc hl
    inc hl
    ld a, (hl)
    and #0C
.slot_ready:
    or c
    ret

load_screen5_palette:
    ; R#16 selects palette slot 0; then 32 bytes go to port #9A.
    ld bc, #0010
    call WRTVDP
    ld hl, screen5_presentation_palette_data
    ld b, 32
.palette_loop:
    ld a, (hl)
    out (VDP_PALETTE_PORT), a
    inc hl
    djnz .palette_loop
    ret

SCREEN5_PRESENTATION_BITMAP_SIZE EQU ${BITMAP_BYTE_COUNT}

${formatBytes('screen5_presentation_palette_data', paletteBytes, 'VDP palette bytes: byte1=(R<<4)|B, byte2=G')}
${formatBytes('screen5_presentation_bitmap_data', bitmapBytes, 'SCREEN 5 4bpp bitmap, 256x212, two pixels per byte')}

    ds #C000 - $, #FF
    end
`;
}

export function generateMsx2Screen5PresentationFiles(
  projectName: string,
  analysis: ProjectAnalysis,
  config: Msx2Screen5PresentationGeneratorConfig
): GeneratedASMFiles {
  const unitedFiles = generateUnitedFiles(projectName, analysis, config);
  return {
    'page0.asm': '; MSX2 SCREEN 5 presentation backend: page0 not used in MVP.\n',
    'bios.asm': '; BIOS equates emitted in unitedFiles.asm.\n',
    'constants.asm': '; Constants emitted in unitedFiles.asm.\n',
    'variables.asm': '; No runtime RAM variables in SCREEN 5 presentation MVP.\n',
    'mapper.asm': '; Mapper support is out of scope for SCREEN 5 presentation MVP.\n',
    'resource_ids.asm': '; Resource IDs not used by SCREEN 5 presentation MVP.\n',
    'resource_table.asm': '; Resource table not used by SCREEN 5 presentation MVP.\n',
    'resource_manager.asm': '; Resource manager not used by SCREEN 5 presentation MVP.\n',
    'interrupt.asm': '; Interrupt runtime not used by SCREEN 5 presentation MVP.\n',
    'header.asm': '; Header emitted in unitedFiles.asm.\n',
    'patterns.asm': '; SCREEN 2/4 pattern tables are intentionally not used by SCREEN 5 presentation backend.\n',
    'colors.asm': '; SCREEN 2/4 color tables are intentionally not used by SCREEN 5 presentation backend.\n',
    'sprites.asm': '; Sprites are not emitted by SCREEN 5 presentation MVP yet.\n',
    'worlds.asm': '; Worlds are not emitted by SCREEN 5 presentation MVP yet.\n',
    'screens.asm': '; SCREEN 5 bitmap data is emitted in unitedFiles.asm.\n',
    'components.asm': '; Components are not emitted by SCREEN 5 presentation MVP yet.\n',
    'entities.asm': '; Entities are not emitted by SCREEN 5 presentation MVP yet.\n',
    'sound.asm': '; Sound is not emitted by SCREEN 5 presentation MVP yet.\n',
    'scroll.asm': '; Scroll is not emitted by SCREEN 5 presentation MVP yet.\n',
    'animtiles.asm': '; Animated tiles are not emitted by SCREEN 5 presentation MVP yet.\n',
    'bosses.asm': '; Bosses are not emitted by SCREEN 5 presentation MVP yet.\n',
    'gameflow.asm': '; GameFlow is not emitted by SCREEN 5 presentation MVP yet.\n',
    'menus.asm': '; Menus are not emitted by SCREEN 5 presentation MVP yet.\n',
    'statemachine.asm': '; State machines are not emitted by SCREEN 5 presentation MVP yet.\n',
    'font.asm': '; Bitmap HUD font is not emitted by SCREEN 5 presentation MVP yet.\n',
    'hud.asm': '; Bitmap HUD is not emitted by SCREEN 5 presentation MVP yet.\n',
    'main.asm': unitedFiles,
    'unitedFiles.asm': unitedFiles,
  };
}
