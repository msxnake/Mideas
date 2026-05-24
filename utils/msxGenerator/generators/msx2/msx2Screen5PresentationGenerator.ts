import { Msx2GameFlowGraph, Msx2GameFlowScreen5PresentationNode, Msx2GameFlowTransitionNode, Msx2Screen5PresentationConfig, Screen5PaletteSlot } from '../../../../types';
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
const DEFAULT_CHUNK_LINES = 32;
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

interface ResolvedPresentationFlow {
  presentation?: Msx2Screen5PresentationConfig;
  flow?: Msx2GameFlowGraph;
  node?: Msx2GameFlowScreen5PresentationNode;
  transition?: Msx2GameFlowTransitionNode;
  requestedPresentationAssetId?: string;
}

function resolveMsx2GameFlowPresentationNode(flow: Msx2GameFlowGraph | undefined): Msx2GameFlowScreen5PresentationNode | undefined {
  if (!flow || !Array.isArray(flow.nodes)) return undefined;
  const nodesById = new Map(flow.nodes.map(node => [node.id, node]));
  const startId = flow.startNodeId || flow.nodes.find(node => node.type === 'Start')?.id;
  const startNode = startId ? nodesById.get(startId) : undefined;
  const nextConnection = startNode
    ? (flow.connections || []).find(connection => connection.from.nodeId === startNode.id)
    : undefined;
  const nextNode = nextConnection ? nodesById.get(nextConnection.to.nodeId) : undefined;
  return nextNode?.type === 'Screen5Presentation' ? nextNode as Msx2GameFlowScreen5PresentationNode : undefined;
}

function resolveNextTransition(flow: Msx2GameFlowGraph | undefined, node: Msx2GameFlowScreen5PresentationNode | undefined): Msx2GameFlowTransitionNode | undefined {
  if (!flow || !node || !Array.isArray(flow.nodes)) return undefined;
  const nextConnection = (flow.connections || []).find(connection => connection.from.nodeId === node.id);
  const nextNode = nextConnection ? flow.nodes.find(candidate => candidate.id === nextConnection.to.nodeId) : undefined;
  if (!nextNode) {
    throw new Error(`MSX2 GameFlow Screen5Presentation node "${node.id}" must continue to End or terminal Transition.`);
  }
  if (nextNode.type === 'End') return undefined;
  if (nextNode.type !== 'Transition') {
    throw new Error(`MSX2 GameFlow Screen5Presentation node "${node.id}" cannot continue to "${nextNode.type}" in the SCREEN 5 backend.`);
  }
  const transitionNextConnection = (flow.connections || []).find(connection => connection.from.nodeId === nextNode.id);
  const nodeAfterTransition = transitionNextConnection ? flow.nodes.find(candidate => candidate.id === transitionNextConnection.to.nodeId) : undefined;
  if (nodeAfterTransition?.type !== 'End') {
    throw new Error(`MSX2 GameFlow terminal Transition node "${nextNode.id}" must continue to End.`);
  }
  return nextNode as Msx2GameFlowTransitionNode;
}

function resolvePresentationFlow(analysis: ProjectAnalysis): ResolvedPresentationFlow {
  const presentations = (((analysis as any).msx2Presentations || []) as Array<Msx2Screen5PresentationConfig & { id?: string }>);
  const flows = (((analysis as any).msx2GameFlows || []) as Msx2GameFlowGraph[]);
  const flow = flows.find(candidate => candidate?.name === 'Main MSX2') || flows[0];
  const node = resolveMsx2GameFlowPresentationNode(flow);
  const requestedPresentationAssetId = node?.presentationAssetId;
  const presentation = requestedPresentationAssetId
    ? presentations.find(item => (item as any).id === requestedPresentationAssetId)
    : undefined;

  if (flow && !node) {
    throw new Error('MSX2 GameFlow must start with Start -> Screen5Presentation for the SCREEN 5 backend.');
  }

  if (requestedPresentationAssetId && !presentation) {
    throw new Error(
      `MSX2 GameFlow Screen5Presentation node "${node?.id || 'unknown'}" references missing msx2presentation asset "${requestedPresentationAssetId}".`
    );
  }

  return {
    presentation: presentation || presentations[0],
    flow,
    node,
    transition: resolveNextTransition(flow, node),
    requestedPresentationAssetId,
  };
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

function chunkBitmapBytes(bytes: number[], chunkLines: number): number[][] {
  const normalizedChunkLines = Math.max(1, Math.min(DEFAULT_CHUNK_LINES, Math.trunc(chunkLines) || DEFAULT_CHUNK_LINES));
  const chunkSize = normalizedChunkLines * BYTES_PER_LINE;
  const chunks: number[][] = [];
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    chunks.push(bytes.slice(offset, offset + chunkSize));
  }
  return chunks;
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

function generateWaitStep(presentation: Msx2Screen5PresentationConfig, nextLabel: string): string {
  const runtime = presentation.runtime;
  if (runtime.waitForKey !== false) {
    return `.main_loop:
    call CHGET
    jp ${nextLabel}`;
  }
  const waitForFrames = Math.max(0, Math.min(255, Math.trunc(Number(runtime.waitForFrames) || 0)));
  if (waitForFrames > 0) {
    return `    ld b, ${hexByte(waitForFrames)}
.frame_wait:
    halt
    djnz .frame_wait
    jp ${nextLabel}`;
  }
  return `    jp ${nextLabel}`;
}

function generateWaitLoop(presentation: Msx2Screen5PresentationConfig, hasNextTransition: boolean): string {
  if (hasNextTransition) {
    return generateWaitStep(presentation, 'msx2_gameflow_run_transition');
  }
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

function generateTerminalTransitionRoutine(transition: Msx2GameFlowTransitionNode | undefined, vramBase: string): string {
  if (!transition) return '';
  const durationFrames = Math.max(0, Math.min(255, Math.trunc(Number(transition.durationFrames) || 0)));
  const waitBlock = durationFrames > 0
    ? `    ld b, ${hexByte(durationFrames)}
.transition_wait:
    halt
    djnz .transition_wait
`
    : '';
  const effectBlock = transition.effect === 'fade_to_black'
    ? `    call load_screen5_black_palette`
    : `    call DISSCR
    call clear_screen5_visible_vram`;

  return `
msx2_gameflow_run_transition:
${effectBlock}
${waitBlock}.gameflow_end_loop:
    halt
    jp .gameflow_end_loop

clear_screen5_visible_vram:
    ; Terminal clear helper. Clobbers AF, BC, HL.
    xor a
    ld hl, ${vramBase}
    ld bc, SCREEN5_PRESENTATION_BITMAP_SIZE
    call FILVRM
    ret

load_screen5_black_palette:
    ; Terminal transition helper. Clobbers AF, BC, HL.
    ld bc, #0010
    call WRTVDP
    ld hl, screen5_black_palette_data
    ld b, 32
.black_palette_loop:
    ld a, (hl)
    out (VDP_PALETTE_PORT), a
    inc hl
    djnz .black_palette_loop
    ret
`;
}

function applyGameFlowRuntimeOverrides(
  presentation: Msx2Screen5PresentationConfig | undefined,
  node: Msx2GameFlowScreen5PresentationNode | undefined
): Msx2Screen5PresentationConfig | undefined {
  if (!node) return presentation;
  return {
    ...presentation,
    runtime: {
      ...presentation.runtime,
      waitForKey: node.waitForKey ?? presentation.runtime?.waitForKey,
      waitForFrames: node.waitFrames ?? presentation.runtime?.waitForFrames,
    },
  };
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
  const resolvedFlow = resolvePresentationFlow(analysis);
  const presentation = normalizePresentation(applyGameFlowRuntimeOverrides(resolvedFlow.presentation, resolvedFlow.node));
  const paletteBytes = buildPaletteBytes(presentation.palette);
  const bitmapBytes = buildBitmapBytes(presentation);
  const chunkLines = Math.max(1, Math.min(DEFAULT_CHUNK_LINES, Math.trunc(Number(presentation.compression?.chunkLines) || DEFAULT_CHUNK_LINES)));
  const bitmapChunks = chunkBitmapBytes(bitmapBytes, chunkLines);
  const vramBase = presentation.runtime.vramPage === 1 ? '#8000' : '#0000';
  const usesKonamiMegaRom = config.romMode === 'megarom' && config.targetFormat === 'konami';
  const terminalTransition = resolvedFlow.transition;
  const transitionDurationFrames = Math.max(0, Math.min(255, Math.trunc(Number(terminalTransition?.durationFrames) || 0)));
  const uploadChunks = bitmapChunks.map((_chunk, index) => {
    const label = `SCREEN5_PRESENTATION_BITMAP_CHUNK_${index}`;
    const vramOffset = index * chunkLines * BYTES_PER_LINE;
    const destination = presentation.runtime.vramPage === 1 ? `#${(0x8000 + vramOffset).toString(16).toUpperCase().padStart(4, '0')}` : `#${vramOffset.toString(16).toUpperCase().padStart(4, '0')}`;
    return `    ; @mideas:screen5-presentation-chunk ${label}
    ld hl, ${label}
    ld de, ${destination}
    ld bc, ${label}_SIZE
    call LDIRVM`;
  }).join('\n');
  const chunkData = bitmapChunks.map((chunk, index) => {
    const label = `SCREEN5_PRESENTATION_BITMAP_CHUNK_${index}`;
    return `${label}_SIZE EQU ${chunk.length}

${formatBytes(label, chunk, `SCREEN 5 4bpp bitmap chunk ${index}, ${chunk.length} bytes`)}`;
  }).join('\n');

  return `; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 5 presentation backend
; Project: ${projectName}
; Presentation: ${presentation.name}
; Screen mode: ${config.screenMode}
; Backend: msx2-screen5-presentation
; MSX2_GAMEFLOW_PRESENT: ${resolvedFlow.flow ? 'yes' : 'no'}
; MSX2_GAMEFLOW_ASSET: ${resolvedFlow.flow?.name || 'none'}
; MSX2_GAMEFLOW_START_NODE: ${resolvedFlow.flow?.startNodeId || 'none'}
; MSX2_GAMEFLOW_SCREEN5_NODE: ${resolvedFlow.node?.id || 'none'}
; MSX2_GAMEFLOW_PRESENTATION_ASSET_ID: ${resolvedFlow.requestedPresentationAssetId || 'auto-first'}
; MSX2_GAMEFLOW_NEXT_TRANSITION: ${terminalTransition?.id || 'none'}
; MSX2_GAMEFLOW_TRANSITION_EFFECT: ${terminalTransition?.effect || 'none'}
; MSX2_GAMEFLOW_TRANSITION_DURATION_FRAMES: ${terminalTransition ? transitionDurationFrames : 0}
; ROM mode requested: ${config.romMode}
; ROM Mode: ${config.romMode}
; Mapper Target: ${config.targetFormat}
${usesKonamiMegaRom ? '; MSX2 SCREEN 5 MegaROM Path: Konami 8K fixed-bank0 compatibility\n' : ''}; SCREEN5_PRESENTATION_COMPRESSION: ${presentation.compression?.enabled ? 'ZX0' : 'raw'}
; SCREEN5_PRESENTATION_CHUNK_LINES: ${chunkLines}
; ==================================================================

CHGMOD  EQU #005F
DISSCR  EQU #0041
ENASCR  EQU #0044
LDIRVM  EQU #005C
FILVRM  EQU #0056
CHGET   EQU #009F
WRTVDP  EQU #0047
RSLREG  EQU #0138
ENASLT  EQU #0024
VDP_PALETTE_PORT EQU #9A
SCREEN5_PRESENTATION_ZX0_BUFFER EQU #D000

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
${usesKonamiMegaRom ? '    call init_konami8k_fixed_bank0_banks\n' : ''}    call DISSCR
    ld a, 5
    call CHGMOD
    ld bc, #0007
    call WRTVDP
    call load_screen5_palette
    call upload_screen5_presentation_bitmap
    call ENASCR
    ei
${generateWaitLoop(presentation, !!terminalTransition)}

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

${generateTerminalTransitionRoutine(terminalTransition, vramBase)}
${usesKonamiMegaRom ? `init_konami8k_fixed_bank0_banks:
    ld a, 1
    call mapper_set_bank_p1
    ld a, 2
    call mapper_set_bank_p2
    ld a, 3
    call mapper_set_bank_p3
    ret

mapper_set_bank_p1:
    ld (#6000), a
    ret

mapper_set_bank_p2:
    ld (#8000), a
    ret

mapper_set_bank_p3:
    ld (#A000), a
    ret

` : ''}
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

upload_screen5_presentation_bitmap:
${uploadChunks}
    ret

SCREEN5_PRESENTATION_BITMAP_SIZE EQU ${BITMAP_BYTE_COUNT}
SCREEN5_PRESENTATION_BITMAP_VRAM_BASE EQU ${vramBase}

${formatBytes('screen5_presentation_palette_data', paletteBytes, 'VDP palette bytes: byte1=(R<<4)|B, byte2=G')}
${terminalTransition ? formatBytes('screen5_black_palette_data', Array.from({ length: 32 }, () => 0), 'All-black palette used by terminal MSX2 GameFlow transitions') : ''}
${chunkData}

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
    'gameflow.asm': '; MSX2 SCREEN 5 presentation GameFlow is emitted inline in unitedFiles.asm.\n',
    'menus.asm': '; Menus are not emitted by SCREEN 5 presentation MVP yet.\n',
    'statemachine.asm': '; State machines are not emitted by SCREEN 5 presentation MVP yet.\n',
    'font.asm': '; Bitmap HUD font is not emitted by SCREEN 5 presentation MVP yet.\n',
    'hud.asm': '; Bitmap HUD is not emitted by SCREEN 5 presentation MVP yet.\n',
    'main.asm': unitedFiles,
    'unitedFiles.asm': unitedFiles,
  };
}
