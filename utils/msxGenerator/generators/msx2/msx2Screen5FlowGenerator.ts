// Generic MSX2 SCREEN 5 GameFlow backend.
//
// The legacy SCREEN 5 presentation backend only understands one hard-coded node
// shape (Start -> Screen5Presentation -> [Text] -> [Transition] -> End). This
// module walks the graph instead and emits one routine per node, so SubMenu,
// Text, TextScroll, TextScrollColor, Transition, IfThenElse, Globals, Music and
// Restart all work, in any order, including menus that loop back on themselves.
//
// It is selected only when the flow actually uses a node the legacy resolver
// cannot express, so existing SCREEN 5 projects keep producing byte-identical
// ROMs.

import type {
  Msx2GameFlowConnection,
  Msx2GameFlowGlobalsNode,
  Msx2GameFlowGraph,
  Msx2GameFlowIfThenElseNode,
  Msx2GameFlowNode,
  Msx2GameFlowScreen5PresentationNode,
  Msx2GameFlowSubMenuNode,
  Msx2GameFlowTextNode,
  Msx2GameFlowTextScrollColorNode,
  Msx2GameFlowTextScrollNode,
  Msx2GameFlowTransitionNode,
  Msx2Screen5PresentationConfig,
  Screen5PaletteSlot,
} from '../../../../types';
import { ProjectAnalysis } from '../../../asmTemplateGenerator';
import type { MSXMapperFormat, MSXRomMode } from '../../index';
import {
  buildScreen5FlowFontBytes,
  sanitizeScreen5FlowText,
  wrapScreen5FlowText,
} from './msx2Screen5FlowFont';
import {
  chunkedDb,
  generateScreen5FlowConstants,
  generateScreen5FlowRamEquates,
  generateScreen5FlowRuntime,
  GF_CHAR_WIDTH_BYTES,
  GF_LINE_BYTES,
  GF_MAX_COLUMNS,
  GF_MENU_FIRST_OPTION_Y,
  GF_MENU_MAX_OPTIONS,
  GF_MENU_OPTION_STEP,
  GF_MENU_TITLE_Y,
  GF_SCROLL_HEIGHT,
  GF_SCROLL_STEP,
  GF_SCROLL_TOP,
  GF_TEXT_FIRST_LINE_Y,
  GF_TEXT_LINE_STEP,
  GF_TEXT_MAX_LINES,
  GF_TEXT_PROMPT_Y,
  GF_TEXT_TITLE_Y,
  type Screen5FlowRuntimeFeatures,
} from './msx2Screen5FlowRuntime';

export interface Msx2Screen5FlowGeneratorConfig {
  screenMode: string;
  romMode: MSXRomMode;
  targetFormat: MSXMapperFormat;
  autoMegaROM?: boolean;
}

const BYTES_PER_LINE = GF_LINE_BYTES;
const VISIBLE_HEIGHT = 212;
const BITMAP_BYTE_COUNT = VISIBLE_HEIGHT * BYTES_PER_LINE;
const DEFAULT_CHUNK_LINES = 32;

const GF_RAM_BASE = 0xc800;
const GF_TEXTBUF_BASE = 0xca00; // 1024 bytes, below the #D000 ZX0 staging buffer

const EXTENDED_NODE_TYPES = new Set(['SubMenu', 'TextScroll', 'TextScrollColor', 'Music']);

const SCREEN5_TRANSITION_EFFECTS = new Set([
  'cls',
  'fade_to_black',
  'screen5_vertical_pixel_wipe',
  'screen5_horizontal_pixel_wipe',
  'screen5_diagonal_pixel_wipe',
  'screen5_mirror_pixel_wipe',
]);

const hexByte = (value: number): string => `#${(value & 0xff).toString(16).toUpperCase().padStart(2, '0')}`;
const hexWord = (value: number): string => `#${(value & 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;

const clampByte = (value: unknown, fallback = 0): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(255, Math.trunc(numeric)));
};

const clampPaletteIndex = (value: unknown, fallback: number): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(15, Math.trunc(numeric)));
};

const sanitizeLabel = (value: string): string => value.replace(/[^A-Za-z0-9_]/g, '_');

// ---------------------------------------------------------------------------
// Presentation asset helpers (mirrors of the legacy backend's own converters)
// ---------------------------------------------------------------------------

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
  if (fromHex) return fromHex as [number, number, number];
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

function resolveBrightestPaletteIndex(palette: Screen5PaletteSlot[] | undefined): number {
  const source = Array.isArray(palette) ? palette : [];
  let bestSlot = 15;
  let bestBrightness = -1;
  for (let slotIndex = 1; slotIndex < 16; slotIndex++) {
    const slot = source.find(item => item?.slotIndex === slotIndex) || source[slotIndex];
    const [r, g, b] = resolvePaletteSlot(slot);
    const brightness = r + g + b;
    if (brightness > bestBrightness) {
      bestBrightness = brightness;
      bestSlot = slotIndex;
    }
  }
  return bestSlot;
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

// ---------------------------------------------------------------------------
// Global variables
// ---------------------------------------------------------------------------

interface ResolvedGlobalAssignment {
  nodeId: string;
  variableName: string;
  asmName: string;
  value: number;
  isWord: boolean;
}

function buildGlobalAsmName(variableName: string): string {
  return `global_var_${variableName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '').replace(/[^a-z0-9_]/g, '_')}`;
}

function resolveGlobalVariableInfo(variableName: string, analysis: ProjectAnalysis): { asmName: string; isWord: boolean; values?: any[] } {
  const normalizedName = String(variableName || '').trim();
  const variables = Array.isArray((analysis as any).globalVariables) ? (analysis as any).globalVariables : [];
  const found = variables.find((variable: any) => String(variable?.name || '').toLowerCase() === normalizedName.toLowerCase());
  const type = String(found?.type || '').toLowerCase();
  return {
    asmName: found?.asmName || buildGlobalAsmName(normalizedName),
    isWord: type === 'word' || type === '16bit',
    values: Array.isArray(found?.values) ? found.values : undefined,
  };
}

function parseGlobalAssignmentValue(rawValue: unknown, values: any[] | undefined, isWord: boolean): number {
  if (typeof rawValue === 'boolean') return rawValue ? 1 : 0;
  const text = String(rawValue ?? '').trim();
  const matchedValue = values?.find(option => String(option?.label).toLowerCase() === text.toLowerCase() || String(option?.value) === text)?.value;
  const source = matchedValue ?? text;
  if (typeof source === 'boolean') return source ? 1 : 0;
  if (typeof source === 'string') {
    if (source.toLowerCase() === 'true') return 1;
    if (source.toLowerCase() === 'false') return 0;
  }
  const numeric = Number(source);
  if (!Number.isFinite(numeric)) return 0;
  return isWord
    ? Math.max(0, Math.min(65535, Math.trunc(numeric)))
    : Math.max(0, Math.min(255, Math.trunc(numeric)));
}

function resolveGlobalsNodeAssignments(node: Msx2GameFlowGlobalsNode, analysis: ProjectAnalysis): ResolvedGlobalAssignment[] {
  return (Array.isArray(node.variables) ? node.variables : [])
    .map(variable => {
      const variableName = String(variable.name || '').trim();
      if (!variableName) return null;
      const info = resolveGlobalVariableInfo(variableName, analysis);
      return {
        nodeId: node.id,
        variableName,
        asmName: info.asmName,
        value: parseGlobalAssignmentValue(variable.value, info.values, info.isWord),
        isWord: info.isWord,
      };
    })
    .filter(Boolean) as ResolvedGlobalAssignment[];
}

function getIfThenElseOperatorId(operator: unknown): number {
  switch (operator) {
    case '!=': return 1;
    case '>': return 2;
    case '<': return 3;
    case '>=': return 4;
    case '<=': return 5;
    default: return 0;
  }
}

function generateCompareRoutine(): string {
  return `
; ------------------------------------------------------------------
; gf_compare_hl_de: HL=current, DE=compare, A=operator id.
; Returns A=1 when the condition holds, A=0 otherwise.
; ------------------------------------------------------------------
gf_compare_hl_de:
    ld c, a
    or a
    sbc hl, de
    ld a, c
    cp 0
    jp z, gf_compare_equals
    cp 1
    jp z, gf_compare_not_equals
    cp 2
    jp z, gf_compare_greater
    cp 3
    jp z, gf_compare_less
    cp 4
    jp z, gf_compare_greater_equal
    cp 5
    jp z, gf_compare_less_equal
    xor a
    ret
gf_compare_equals:
    ld a, h
    or l
    jp z, gf_compare_true
    xor a
    ret
gf_compare_not_equals:
    ld a, h
    or l
    jp nz, gf_compare_true
    xor a
    ret
gf_compare_greater:
    jp c, gf_compare_false
    ld a, h
    or l
    jp nz, gf_compare_true
    xor a
    ret
gf_compare_less:
    jp c, gf_compare_true
    xor a
    ret
gf_compare_greater_equal:
    jp nc, gf_compare_true
    xor a
    ret
gf_compare_less_equal:
    jp c, gf_compare_true
    ld a, h
    or l
    jp z, gf_compare_true
gf_compare_false:
    xor a
    ret
gf_compare_true:
    ld a, 1
    ret
`;
}

// ---------------------------------------------------------------------------
// Flow graph walking
// ---------------------------------------------------------------------------

/** True when the flow needs the generic walker instead of the strict-shape backend. */
export function screen5FlowNeedsGenericBackend(flow: Msx2GameFlowGraph | undefined): boolean {
  if (!flow || !Array.isArray(flow.nodes)) return false;
  return flow.nodes.some(node => EXTENDED_NODE_TYPES.has(node.type));
}

export function findScreen5FlowGraph(analysis: ProjectAnalysis): Msx2GameFlowGraph | undefined {
  const flows = (((analysis as any).msx2GameFlows || []) as Msx2GameFlowGraph[])
    .filter(candidate => candidate?.purpose !== 'screen4-runtime');
  return flows.find(candidate => candidate?.name === 'Main MSX2') || flows[0];
}

class FlowGraph {
  readonly nodeById = new Map<string, Msx2GameFlowNode>();
  readonly connections: Msx2GameFlowConnection[];

  constructor(private readonly flow: Msx2GameFlowGraph) {
    for (const node of flow.nodes || []) this.nodeById.set(node.id, node);
    this.connections = flow.connections || [];
  }

  get startNode(): Msx2GameFlowNode | undefined {
    const startId = this.flow.startNodeId;
    return (startId ? this.nodeById.get(startId) : undefined)
      || (this.flow.nodes || []).find(node => node.type === 'Start');
  }

  next(nodeId: string, sourceId?: string): Msx2GameFlowNode | undefined {
    const connection = this.connections.find(candidate => (
      candidate.from.nodeId === nodeId
      && (sourceId ? candidate.from.sourceId === sourceId : !candidate.from.sourceId)
    ));
    return connection ? this.nodeById.get(connection.to.nodeId) : undefined;
  }

  /** Every node reachable from Start, in breadth-first order. */
  reachable(): Msx2GameFlowNode[] {
    const start = this.startNode;
    if (!start) return [];
    const order: Msx2GameFlowNode[] = [];
    const seen = new Set<string>([start.id]);
    const queue: Msx2GameFlowNode[] = [start];
    while (queue.length) {
      const node = queue.shift()!;
      order.push(node);
      for (const connection of this.connections.filter(candidate => candidate.from.nodeId === node.id)) {
        const target = this.nodeById.get(connection.to.nodeId);
        if (target && !seen.has(target.id)) {
          seen.add(target.id);
          queue.push(target);
        }
      }
    }
    return order;
  }
}

// ---------------------------------------------------------------------------
// Emission
// ---------------------------------------------------------------------------

interface StringPool {
  labelFor(text: string): string;
  emit(): string;
}

function createStringPool(): StringPool {
  const byText = new Map<string, string>();
  return {
    labelFor(text: string): string {
      const existing = byText.get(text);
      if (existing) return existing;
      const label = `gf_str_${byText.size}`;
      byText.set(text, label);
      return label;
    },
    emit(): string {
      return Array.from(byText.entries())
        .map(([text, label]) => {
          const bytes = [...text].map(character => character.charCodeAt(0) & 0xff);
          bytes.push(0);
          return `${label}:   ; "${text}"\n${chunkedDb(bytes)}`;
        })
        .join('\n');
    },
  };
}

interface PresentationEntry {
  index: number;
  presentation: Msx2Screen5PresentationConfig;
  paletteBytes: number[];
  chunks: number[][];
  chunkLines: number;
  vramPage: number;
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

export function generateMsx2Screen5FlowUnitedFiles(
  projectName: string,
  analysis: ProjectAnalysis,
  config: Msx2Screen5FlowGeneratorConfig
): string {
  const flow = findScreen5FlowGraph(analysis);
  if (!flow) throw new Error('MSX2 SCREEN 5 GameFlow backend requires an msx2gameflow asset.');
  const graph = new FlowGraph(flow);
  const start = graph.startNode;
  if (!start) throw new Error('MSX2 SCREEN 5 GameFlow must contain a Start node.');

  const nodes = graph.reachable();
  const presentations = (((analysis as any).msx2Presentations || []) as Array<Msx2Screen5PresentationConfig & { id?: string }>);

  // Every presentation node in this flow must render from the same VRAM page,
  // otherwise text drawn by later nodes would land on the hidden page.
  const presentationEntries = new Map<string, PresentationEntry>();
  const resolvePresentationEntry = (node: Msx2GameFlowScreen5PresentationNode): PresentationEntry => {
    const key = node.presentationAssetId || '__first__';
    const cached = presentationEntries.get(key);
    if (cached) return cached;
    const source = node.presentationAssetId
      ? presentations.find(item => (item as any).id === node.presentationAssetId)
      : presentations[0];
    if (!source) {
      throw new Error(
        `MSX2 GameFlow Screen5Presentation node "${node.id}" references missing msx2presentation asset "${node.presentationAssetId || 'auto-first'}".`
      );
    }
    const presentation = normalizePresentation(source);
    const chunkLines = Math.max(1, Math.min(DEFAULT_CHUNK_LINES, Math.trunc(Number(presentation.compression?.chunkLines) || DEFAULT_CHUNK_LINES)));
    const entry: PresentationEntry = {
      index: presentationEntries.size,
      presentation,
      paletteBytes: buildPaletteBytes(presentation.palette),
      chunks: chunkBitmapBytes(buildBitmapBytes(presentation), chunkLines),
      chunkLines,
      vramPage: presentation.runtime.vramPage === 1 ? 1 : 0,
    };
    presentationEntries.set(key, entry);
    return entry;
  };

  // Pre-resolve so palette/page defaults are known before emitting node code.
  for (const node of nodes) {
    if (node.type === 'Screen5Presentation') resolvePresentationEntry(node as Msx2GameFlowScreen5PresentationNode);
  }
  const firstPresentation = presentationEntries.values().next().value as PresentationEntry | undefined;
  const vramPage = firstPresentation?.vramPage ?? 0;
  const vramBase = vramPage === 1 ? 0x8000 : 0x0000;
  const pageYOffset = vramPage === 1 ? 256 : 0;
  const defaultTextColor = resolveBrightestPaletteIndex(firstPresentation?.presentation.palette);

  const strings = createStringPool();
  const labelOf = (node: Msx2GameFlowNode): string => `gf_node_${sanitizeLabel(node.id)}`;
  const nextLabel = (nodeId: string, sourceId?: string): string => {
    const target = graph.next(nodeId, sourceId);
    return target ? labelOf(target) : 'gf_halt';
  };

  const features: Screen5FlowRuntimeFeatures = {
    text: false,
    menu: false,
    scroll: false,
    fade: false,
    wipeVertical: false,
    wipeHorizontal: false,
    wipeMirror: false,
    wipeDiagonal: false,
    psgSilence: false,
  };
  let usesCompare = false;

  const vramAddressOf = (y: number, xByte: number): number => vramBase + (y * BYTES_PER_LINE) + xByte;
  const centeredColumn = (characters: number): number =>
    Math.max(0, Math.floor((GF_MAX_COLUMNS - Math.min(characters, GF_MAX_COLUMNS)) / 2)) * GF_CHAR_WIDTH_BYTES;

  /** One `gf_print` call: colours, string pointer, destination, span width. */
  const printCall = (
    text: string,
    y: number,
    foreground: number,
    background: number,
    options: { column?: number; spanCharacters?: number } = {}
  ): string => {
    const sanitized = sanitizeScreen5FlowText(text, GF_MAX_COLUMNS);
    const spanCharacters = Math.min(GF_MAX_COLUMNS, Math.max(options.spanCharacters ?? sanitized.length, sanitized.length, 1));
    const column = options.column ?? centeredColumn(spanCharacters);
    const padded = sanitized.padEnd(spanCharacters, ' ');
    return `    ld a, ${hexByte(foreground)}
    ld (GF_FG_PIX), a
    ld a, ${hexByte(background)}
    ld (GF_BG_PIX), a
    ld hl, ${strings.labelFor(padded)}
    ld de, ${hexWord(vramAddressOf(y, column))}
    ld b, ${spanCharacters * GF_CHAR_WIDTH_BYTES}
    call gf_print
`;
  };

  const fillRectCall = (x: number, y: number, width: number, height: number, colorIndex: number): string => `    ld hl, ${x}
    ld (GF_CMD_DX), hl
    ld hl, ${pageYOffset + y}
    ld (GF_CMD_DY), hl
    ld hl, ${width}
    ld (GF_CMD_NX), hl
    ld hl, ${height}
    ld (GF_CMD_NY), hl
    ld a, ${hexByte(colorIndex)}
    call gf_set_fill_color
    call gf_fill_rect
`;

  const waitCall = (waitForKey: boolean | undefined, waitFrames: number | undefined): string => {
    if (waitForKey !== false) return '    call gf_wait_key\n';
    const frames = clampByte(waitFrames, 0);
    return frames > 0 ? `    ld b, ${hexByte(frames)}\n    call gf_wait_frames\n` : '';
  };

  const globalsAsm = (node: Msx2GameFlowGlobalsNode): string => {
    const assignments = resolveGlobalsNodeAssignments(node, analysis);
    return assignments.map(assignment => (assignment.isWord
      ? `    ld hl, ${hexWord(assignment.value)}\n    ld (${assignment.asmName}), hl\n`
      : `    ld a, ${hexByte(assignment.value)}\n    ld (${assignment.asmName}), a\n`)).join('');
  };

  const transitionAsm = (node: Msx2GameFlowTransitionNode): string => {
    if (!SCREEN5_TRANSITION_EFFECTS.has(node.effect)) {
      throw new Error(`MSX2 SCREEN 5 GameFlow transition "${node.effect}" is not supported; use a SCREEN 5 transition effect.`);
    }
    switch (node.effect) {
      case 'fade_to_black':
        features.fade = true;
        return '    call gf_fade_out\n';
      case 'screen5_vertical_pixel_wipe':
        features.wipeVertical = true;
        return '    call gf_wipe_vertical\n';
      case 'screen5_horizontal_pixel_wipe':
        features.wipeHorizontal = true;
        return '    call gf_wipe_horizontal\n';
      case 'screen5_mirror_pixel_wipe':
        features.wipeMirror = true;
        return '    call gf_wipe_mirror\n';
      case 'screen5_diagonal_pixel_wipe':
        features.wipeDiagonal = true;
        return '    call gf_wipe_diagonal\n';
      case 'cls':
      default:
        return '    call gf_clear_page\n';
    }
  };

  const allGlobalAssignments: ResolvedGlobalAssignment[] = [];
  for (const node of nodes) {
    if (node.type === 'Globals') allGlobalAssignments.push(...resolveGlobalsNodeAssignments(node as Msx2GameFlowGlobalsNode, analysis));
    if (node.type === 'IfThenElse') {
      const conditionNode = node as Msx2GameFlowIfThenElseNode;
      const variableName = String(conditionNode.variableName || '').trim();
      if (!variableName) throw new Error(`MSX2 GameFlow IfThenElse node "${node.id}" must select a global variable.`);
      const info = resolveGlobalVariableInfo(variableName, analysis);
      allGlobalAssignments.push({
        nodeId: node.id,
        variableName,
        asmName: info.asmName,
        value: parseGlobalAssignmentValue(conditionNode.compareValue, info.values, info.isWord),
        isWord: info.isWord,
      });
    }
  }
  const globalEquates = (() => {
    const seen = new Map<string, ResolvedGlobalAssignment>();
    for (const assignment of allGlobalAssignments) {
      if (!seen.has(assignment.asmName)) seen.set(assignment.asmName, assignment);
    }
    let address = 0xc000;
    return Array.from(seen.values()).map(assignment => {
      const line = `${assignment.asmName} EQU ${hexWord(address)}    ; MSX2 GameFlow global: ${assignment.variableName}`;
      address += assignment.isWord ? 2 : 1;
      return line;
    }).join('\n');
  })();

  // -------------------------------------------------------------------------
  // Node routines
  // -------------------------------------------------------------------------
  const nodeRoutines: string[] = [];

  for (const node of nodes) {
    const label = labelOf(node);
    const header = `${label}:\n    ; MSX2_GAMEFLOW_NODE ${node.type} ${node.id}\n`;

    switch (node.type) {
      case 'Start':
      case 'Waypoint': {
        nodeRoutines.push(`${header}    jp ${nextLabel(node.id)}\n`);
        break;
      }
      case 'Globals': {
        nodeRoutines.push(`${header}${globalsAsm(node as Msx2GameFlowGlobalsNode)}    jp ${nextLabel(node.id)}\n`);
        break;
      }
      case 'Screen5Presentation': {
        const entry = resolvePresentationEntry(node as Msx2GameFlowScreen5PresentationNode);
        const presentationNode = node as Msx2GameFlowScreen5PresentationNode;
        const waitForKey = presentationNode.waitForKey ?? entry.presentation.runtime.waitForKey;
        const waitFrames = presentationNode.waitFrames ?? entry.presentation.runtime.waitForFrames;
        nodeRoutines.push(`${header}    call DISSCR
    call gf_load_palette_${entry.index}
    call gf_upload_bitmap_${entry.index}
    call ENASCR
${waitCall(waitForKey, waitFrames)}    jp ${nextLabel(node.id)}
`);
        break;
      }
      case 'Text': {
        features.text = true;
        const textNode = node as Msx2GameFlowTextNode;
        const foreground = clampPaletteIndex((textNode as any).textColorIndex, defaultTextColor);
        const background = clampPaletteIndex((textNode as any).backgroundColorIndex, 0);
        const title = sanitizeScreen5FlowText(textNode.title || '', GF_MAX_COLUMNS);
        const lines = wrapScreen5FlowText(textNode.message || '', GF_MAX_COLUMNS - 2, GF_TEXT_MAX_LINES);
        const body = lines
          .map((line, index) => (line
            ? printCall(line, GF_TEXT_FIRST_LINE_Y + index * GF_TEXT_LINE_STEP, foreground, background)
            : ''))
          .join('');
        const prompt = textNode.waitForKey === false
          ? ''
          : printCall('PRESS ANY KEY', GF_TEXT_PROMPT_Y, foreground, background);
        nodeRoutines.push(`${header}${title ? printCall(title, GF_TEXT_TITLE_Y, foreground, background) : ''}${body}${prompt}${waitCall(textNode.waitForKey, textNode.waitFrames)}    jp ${nextLabel(node.id)}
`);
        break;
      }
      case 'TextScroll':
      case 'TextScrollColor': {
        features.text = true;
        features.scroll = true;
        const scrollNode = node as Msx2GameFlowTextScrollNode | Msx2GameFlowTextScrollColorNode;
        const isColored = node.type === 'TextScrollColor';
        const foreground = clampPaletteIndex(
          isColored ? (scrollNode as Msx2GameFlowTextScrollColorNode).textColorIndex : (scrollNode as any).textColorIndex,
          defaultTextColor
        );
        const background = clampPaletteIndex(
          isColored ? (scrollNode as Msx2GameFlowTextScrollColorNode).backgroundColorIndex : (scrollNode as any).backgroundColorIndex,
          0
        );
        const stepFrames = clampByte((scrollNode as any).scrollStepFrames, 18) || 18;
        const lines = wrapScreen5FlowText(scrollNode.text || '', GF_MAX_COLUMNS - 2, 32);
        const bottomTextY = GF_SCROLL_TOP + GF_SCROLL_HEIGHT - GF_SCROLL_STEP + 2;
        const trailingScrolls = Math.ceil(GF_SCROLL_HEIGHT / GF_SCROLL_STEP);
        const scrollStep = (printAsm: string): string => `    call gf_scroll_window
${printAsm}    ld b, ${hexByte(stepFrames)}
    call gf_wait_frames
`;
        const bodyAsm = lines
          .map(line => scrollStep(line ? printCall(line, bottomTextY, foreground, background) : ''))
          .join('');
        const tailAsm = `    ld b, ${trailingScrolls}
gf_scroll_tail_${sanitizeLabel(node.id)}:
    push bc
    call gf_scroll_window
    ld b, ${hexByte(stepFrames)}
    call gf_wait_frames
    pop bc
    djnz gf_scroll_tail_${sanitizeLabel(node.id)}
`;
        const titleAsm = scrollNode.title
          ? printCall(sanitizeScreen5FlowText(scrollNode.title, GF_MAX_COLUMNS), GF_SCROLL_TOP - 20, foreground, background)
          : '';
        nodeRoutines.push(`${header}    ld a, ${hexByte(background)}
    ld (GF_SCROLL_BG), a
    call gf_scroll_clear_window
${titleAsm}${bodyAsm}${tailAsm}${waitCall(scrollNode.waitForKey, scrollNode.waitFrames)}    jp ${nextLabel(node.id)}
`);
        break;
      }
      case 'SubMenu': {
        features.text = true;
        features.menu = true;
        const menuNode = node as Msx2GameFlowSubMenuNode;
        const options = (menuNode.options || []).slice(0, GF_MENU_MAX_OPTIONS);
        if (options.length === 0) throw new Error(`MSX2 GameFlow SubMenu node "${node.id}" must include at least one option.`);
        const safeId = sanitizeLabel(node.id);
        const foreground = clampPaletteIndex((menuNode as any).textColorIndex, defaultTextColor);
        const background = clampPaletteIndex((menuNode as any).backgroundColorIndex, 0);
        const highlightForeground = clampPaletteIndex((menuNode as any).highlightColorIndex, background);
        const highlightBackground = clampPaletteIndex((menuNode as any).highlightBackgroundIndex, foreground);
        const optionTexts = options.map(option => sanitizeScreen5FlowText(option.text || '', GF_MAX_COLUMNS - 4));
        const spanCharacters = Math.max(...optionTexts.map(text => text.length)) + 4;
        const title = sanitizeScreen5FlowText(menuNode.title || '', GF_MAX_COLUMNS);

        // Every option is padded to the same span so the highlight bar lines up.
        const centerInSpan = (text: string): string => {
          const padding = Math.max(0, spanCharacters - text.length);
          const left = Math.floor(padding / 2);
          return `${' '.repeat(left)}${text}${' '.repeat(padding - left)}`;
        };

        const drawRoutine = `gf_menu_draw_${safeId}:
${options.map((_option, index) => {
          const optionY = GF_MENU_FIRST_OPTION_Y + index * GF_MENU_OPTION_STEP;
          const text = centerInSpan(optionTexts[index]);
          return `    ld a, (GF_MENU_INDEX)
    cp ${index}
    jp z, gf_menu_sel_${safeId}_${index}
${printCall(text, optionY, foreground, background, { spanCharacters })}    jp gf_menu_done_${safeId}_${index}
gf_menu_sel_${safeId}_${index}:
${printCall(text, optionY, highlightForeground, highlightBackground, { spanCharacters })}gf_menu_done_${safeId}_${index}:
`;
        }).join('')}    ret
`;

        const dispatch = options.map((option, index) => `    cp ${index}
    jp z, ${nextLabel(node.id, option.id)}
`).join('');

        nodeRoutines.push(`${header}    xor a
    ld (GF_MENU_INDEX), a
${title ? printCall(title, GF_MENU_TITLE_Y, foreground, background) : ''}    call gf_menu_wait_release
    call gf_menu_draw_${safeId}
gf_menu_loop_${safeId}:
    halt
    call gf_menu_read_stick
    ld c, a
    ld a, (GF_MENU_PREV)
    cp c
    jp z, gf_menu_trigger_${safeId}
    ld a, c
    ld (GF_MENU_PREV), a
    cp 1
    jp z, gf_menu_up_${safeId}
    cp 5
    jp z, gf_menu_down_${safeId}
    jp gf_menu_trigger_${safeId}
gf_menu_up_${safeId}:
    ld a, (GF_MENU_INDEX)
    or a
    jp z, gf_menu_wrap_${safeId}
    dec a
    jp gf_menu_apply_${safeId}
gf_menu_wrap_${safeId}:
    ld a, ${options.length - 1}
    jp gf_menu_apply_${safeId}
gf_menu_down_${safeId}:
    ld a, (GF_MENU_INDEX)
    inc a
    cp ${options.length}
    jp c, gf_menu_apply_${safeId}
    xor a
gf_menu_apply_${safeId}:
    ld (GF_MENU_INDEX), a
    call gf_menu_draw_${safeId}
gf_menu_trigger_${safeId}:
    call gf_menu_read_trigger
    or a
    jp z, gf_menu_loop_${safeId}
    ld a, (GF_MENU_INDEX)
${dispatch}    jp gf_menu_loop_${safeId}

${drawRoutine}`);
        break;
      }
      case 'IfThenElse': {
        usesCompare = true;
        const conditionNode = node as Msx2GameFlowIfThenElseNode;
        const info = resolveGlobalVariableInfo(String(conditionNode.variableName || '').trim(), analysis);
        const compareValue = parseGlobalAssignmentValue(conditionNode.compareValue, info.values, info.isWord);
        nodeRoutines.push(`${header}    ld hl, (${info.asmName})
${info.isWord ? '' : '    ld h, 0\n'}    ld de, ${hexWord(compareValue)}
    ld a, ${getIfThenElseOperatorId(conditionNode.operator)}
    call gf_compare_hl_de
    or a
    jp nz, ${nextLabel(node.id, 'then')}
    jp ${nextLabel(node.id, 'else')}
`);
        break;
      }
      case 'Transition': {
        nodeRoutines.push(`${header}${transitionAsm(node as Msx2GameFlowTransitionNode)}${(() => {
          const frames = clampByte((node as Msx2GameFlowTransitionNode).durationFrames, 0);
          return frames > 0 ? `    ld b, ${hexByte(frames)}\n    call gf_wait_frames\n` : '';
        })()}    jp ${nextLabel(node.id)}
`);
        break;
      }
      case 'Music': {
        features.psgSilence = true;
        nodeRoutines.push(`${header}    call gf_psg_silence
    jp ${nextLabel(node.id)}
`);
        break;
      }
      case 'Restart': {
        nodeRoutines.push(`${header}    jp init_rom\n`);
        break;
      }
      case 'End': {
        const endNode = node as { message?: string; waitForKey?: boolean; waitFrames?: number };
        const message = sanitizeScreen5FlowText(endNode.message || '', GF_MAX_COLUMNS);
        if (message) features.text = true;
        nodeRoutines.push(`${header}${message ? printCall(message, 96, defaultTextColor, 0) : ''}    jp gf_halt\n`);
        break;
      }
      default: {
        throw new Error(`MSX2 SCREEN 5 GameFlow backend does not support node type "${(node as Msx2GameFlowNode).type}".`);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Presentation data routines
  // -------------------------------------------------------------------------
  const presentationList = Array.from(presentationEntries.values());
  const paletteRoutines = presentationList.map(entry => `gf_load_palette_${entry.index}:
    ld hl, gf_palette_${entry.index}_data
    ld de, GF_PALETTE_RAM
    ld bc, 32
    ldir
    jp gf_upload_palette_ram
`).join('\n');

  const uploadRoutines = presentationList.map(entry => {
    const chunkCalls = entry.chunks.map((_chunk, index) => {
      const chunkLabel = `SCREEN5_FLOW_${entry.index}_BITMAP_CHUNK_${index}`;
      const vramOffset = index * entry.chunkLines * BYTES_PER_LINE;
      return `    ; @mideas:screen5-presentation-chunk ${chunkLabel}
    ld hl, ${chunkLabel}
    ld de, ${hexWord(vramBase + vramOffset)}
    ld bc, ${chunkLabel}_SIZE
    call LDIRVM`;
    }).join('\n');
    return `gf_upload_bitmap_${entry.index}:
${chunkCalls}
    ret
`;
  }).join('\n');

  const paletteData = presentationList
    .map(entry => `gf_palette_${entry.index}_data:   ; (R<<4)|B, G\n${chunkedDb(entry.paletteBytes)}`)
    .join('\n');

  const chunkData = presentationList.map(entry => entry.chunks.map((chunk, index) => {
    const chunkLabel = `SCREEN5_FLOW_${entry.index}_BITMAP_CHUNK_${index}`;
    return `${chunkLabel}_SIZE EQU ${chunk.length}

${chunkLabel}:
${chunkedDb(chunk)}`;
  }).join('\n')).join('\n');

  const usesKonamiMegaRom = config.romMode === 'megarom' && config.targetFormat === 'konami';
  const r2Value = vramPage === 1 ? 0x3f : 0x1f;
  const fontBytes = buildScreen5FlowFontBytes();

  const nodeTypeSummary = Array.from(new Set(nodes.map(node => node.type))).join(',');

  return `; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 5 GameFlow backend (generic node walker)
; Project: ${projectName}
; Screen mode: ${config.screenMode}
; Backend: msx2-screen5-gameflow
; MSX2_GAMEFLOW_PRESENT: yes
; MSX2_GAMEFLOW_ASSET: ${flow.name || 'Main MSX2'}
; MSX2_GAMEFLOW_START_NODE: ${start.id}
; MSX2_GAMEFLOW_NODE_COUNT: ${nodes.length}
; MSX2_GAMEFLOW_NODE_TYPES: ${nodeTypeSummary}
; MSX2_GAMEFLOW_VRAM_PAGE: ${vramPage}
; ROM mode requested: ${config.romMode}
; ROM Mode: ${config.romMode}
; Mapper Target: ${config.targetFormat}
; SCREEN5_PRESENTATION_COMPRESSION: ${firstPresentation?.presentation.compression?.enabled ? 'ZX0' : 'raw'}
; SCREEN5_PRESENTATION_CHUNK_LINES: ${firstPresentation?.chunkLines ?? DEFAULT_CHUNK_LINES}
; ==================================================================

CHGMOD  EQU #005F
DISSCR  EQU #0041
ENASCR  EQU #0044
LDIRVM  EQU #005C
FILVRM  EQU #0056
CHGET   EQU #009F
CHSNS   EQU #009C
KILBUF  EQU #0156
GTSTCK  EQU #00D5
GTTRIG  EQU #00D8
WRTPSG  EQU #0093
WRTVDP  EQU #0047
RSLREG  EQU #0138
ENASLT  EQU #0024
VDP_PALETTE_PORT EQU #9A
SCREEN5_PRESENTATION_ZX0_BUFFER EQU #D000
SCREEN5_PRESENTATION_BITMAP_SIZE EQU ${BITMAP_BYTE_COUNT}
SCREEN5_PRESENTATION_VISIBLE_LINES EQU ${VISIBLE_HEIGHT}
SCREEN5_PRESENTATION_BYTES_PER_LINE EQU ${BYTES_PER_LINE}

${generateScreen5FlowConstants(pageYOffset, vramBase)}
${generateScreen5FlowRamEquates(GF_RAM_BASE, GF_TEXTBUF_BASE)}
${globalEquates ? `${globalEquates}\n` : ''}
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
    ; CHGMOD resets R#2; re-select the SCREEN 5 display page used by the flow.
    ld bc, ${hexWord((r2Value << 8) | 0x02)}
    call WRTVDP
    ld bc, #0007
    call WRTVDP
    call gf_clear_page
    call ENASCR
    ei
    jp ${labelOf(start)}

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
    jr z, gf_slot_ready
    or c
    ld c, a
    inc hl
    inc hl
    inc hl
    inc hl
    ld a, (hl)
    and #0C
gf_slot_ready:
    or c
    ret

gf_halt:
    halt
    jp gf_halt

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

` : ''}; ==================================================================
; GameFlow node routines
; ==================================================================
${nodeRoutines.join('\n')}
; ==================================================================
; SCREEN 5 presentation data routines
; ==================================================================
${paletteRoutines}
${uploadRoutines}
; ==================================================================
; Shared runtime
; ==================================================================
${generateScreen5FlowRuntime(features, fontBytes)}
${usesCompare ? generateCompareRoutine() : ''}
; ==================================================================
; Data
; ==================================================================
${strings.emit()}

${paletteData}

${chunkData}

    ds #C000 - $, #FF
    end
`;
}
