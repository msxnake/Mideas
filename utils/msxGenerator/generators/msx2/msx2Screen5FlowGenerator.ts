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
import { isMsx2Screen5OrUnsetPurpose } from '../../../msx2GameFlowPurpose';
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
import {
  SCREEN5_BITMAP_BYTE_COUNT,
  SCREEN5_DEFAULT_CHUNK_LINES,
  SCREEN5_VISIBLE_HEIGHT,
  buildScreen5BitmapBytes,
  buildScreen5PaletteBytes,
  chunkScreen5BitmapBytes,
  normalizeScreen5Presentation,
  resolveScreen5BrightestPaletteIndex,
} from './screen5PresentationData';
import { SCREEN5_TRANSITION_EFFECTS } from './screen5TransitionEffects';
import { resolveScreen5MenuLayout } from '../../../msx2Screen5MenuLayout';
import {
  extractScreen5MenuTitleImage,
  resolveScreen5MenuTitleImageColumn,
  type Screen5MenuTitleImage,
} from '../../../msx2Screen5MenuTitleImage';
import {
  generateSmoothScrollRuntime,
  smoothScrollNodeData,
  smoothScrollRamEquates,
  smoothScrollStripTexts,
  marqueeNodeData,
  marqueeRamEquates,
  SMOOTH_SCROLL_LINE_STEP,
  type Screen5SmoothScrollHost,
} from './screen5SmoothScroll';
import {
  emitScreen5TfxCall,
  generateScreen5TfxRuntime,
  Screen5TfxDataPool,
} from './screen5TransitionEngine';
import {
  resolveScreen5TransitionSpec,
  screen5TransitionUsesEngine,
  SCREEN5_TRANSITIONS_NEEDING_NEXT_SCENE,
} from '../../../msx2TransitionPatterns';

export interface Msx2Screen5FlowGeneratorConfig {
  screenMode: string;
  romMode: MSXRomMode;
  targetFormat: MSXMapperFormat;
  autoMegaROM?: boolean;
}

const BYTES_PER_LINE = GF_LINE_BYTES;
const VISIBLE_HEIGHT = SCREEN5_VISIBLE_HEIGHT;
const BITMAP_BYTE_COUNT = SCREEN5_BITMAP_BYTE_COUNT;
const DEFAULT_CHUNK_LINES = SCREEN5_DEFAULT_CHUNK_LINES;

const GF_RAM_BASE = 0xc800;
const GF_TEXTBUF_BASE = 0xca00; // 1024 bytes, below the #D000 ZX0 staging buffer

const EXTENDED_NODE_TYPES = new Set(['SubMenu', 'TextScroll', 'TextScrollColor', 'Music']);

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

/**
 * True when the flow needs the generic walker instead of the strict-shape backend:
 * extended node types, or a Transition that the shared SCREEN 5 transition
 * engine has to play (advanced effects / legacy effects with new parameters).
 */
export function screen5FlowNeedsGenericBackend(flow: Msx2GameFlowGraph | undefined): boolean {
  if (!flow || !Array.isArray(flow.nodes)) return false;
  return flow.nodes.some(node => EXTENDED_NODE_TYPES.has(node.type)
    || (node.type === 'Transition' && screen5TransitionUsesEngine(node as Msx2GameFlowTransitionNode)));
}

export function findScreen5FlowGraph(analysis: ProjectAnalysis): Msx2GameFlowGraph | undefined {
  const flows = (((analysis as any).msx2GameFlows || []) as Msx2GameFlowGraph[])
    .filter(candidate => isMsx2Screen5OrUnsetPurpose(candidate?.purpose));
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

/** SubMenu bitmap title: the cropped picture and the palette it is shown with. */
interface TitleImageEntry {
  index: number;
  image: Screen5MenuTitleImage;
  paletteBytes: number[];
  /** Legible text colour in the title palette, used when the menu sets none. */
  brightestIndex: number;
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
    const presentation = normalizeScreen5Presentation(source);
    const chunkLines = Math.max(1, Math.min(DEFAULT_CHUNK_LINES, Math.trunc(Number(presentation.compression?.chunkLines) || DEFAULT_CHUNK_LINES)));
    const entry: PresentationEntry = {
      index: presentationEntries.size,
      presentation,
      paletteBytes: buildScreen5PaletteBytes(presentation.palette),
      chunks: chunkScreen5BitmapBytes(buildScreen5BitmapBytes(presentation), chunkLines),
      chunkLines,
      vramPage: presentation.runtime.vramPage === 1 ? 1 : 0,
    };
    presentationEntries.set(key, entry);
    return entry;
  };

  // Pre-resolve so palette/page defaults are known before emitting node code.
  for (const node of nodes) {
    if (node.type === 'Screen5Presentation') {
      resolvePresentationEntry(node as Msx2GameFlowScreen5PresentationNode);
      if (String((node as Msx2GameFlowScreen5PresentationNode).fxAssetId || '').trim()) {
        console.warn(`⚠️ Transition FX: the presentation node "${node.id}" has an entry effect, which this GameFlow backend does not play; the static picture is exported. Effects need the SCREEN 5 bitmap-room backend.`);
      }
      if ((node as Msx2GameFlowScreen5PresentationNode).orbitTetrahedron?.enabled) {
        console.warn(`⚠️ Orbiting tetrahedron: the presentation node "${node.id}" has one, which this GameFlow backend does not play; the static picture is exported. It needs the SCREEN 5 bitmap-room backend.`);
      }
    }
  }
  const firstPresentation = presentationEntries.values().next().value as PresentationEntry | undefined;
  const vramPage = firstPresentation?.vramPage ?? 0;
  const vramBase = vramPage === 1 ? 0x8000 : 0x0000;
  const pageYOffset = vramPage === 1 ? 256 : 0;
  const defaultTextColor = resolveScreen5BrightestPaletteIndex(firstPresentation?.presentation.palette);

  // SubMenu bitmap titles. They are cropped boxes with their own palette, kept apart from
  // `presentationEntries` so they do not pull a whole 256x212 upload into the ROM.
  const titleImageEntries = new Map<string, TitleImageEntry>();
  const resolveTitleImageEntry = (node: Msx2GameFlowSubMenuNode): TitleImageEntry | undefined => {
    const assetId = String(node.titleImageAssetId || '').trim();
    if (!assetId) return undefined;
    const cached = titleImageEntries.get(assetId);
    if (cached) return cached;
    const source = presentations.find(item => (item as any).id === assetId);
    if (!source) {
      throw new Error(`MSX2 GameFlow SubMenu node "${node.id}" references missing msx2presentation asset "${assetId}" as its title image.`);
    }
    const { image, error } = extractScreen5MenuTitleImage(source);
    if (!image) throw new Error(`MSX2 GameFlow SubMenu node "${node.id}" title image: ${error}`);
    const presentation = normalizeScreen5Presentation(source);
    const entry: TitleImageEntry = {
      index: titleImageEntries.size,
      image,
      paletteBytes: buildScreen5PaletteBytes(presentation.palette),
      brightestIndex: resolveScreen5BrightestPaletteIndex(presentation.palette),
    };
    titleImageEntries.set(assetId, entry);
    return entry;
  };

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
    // Only matters when no text engine is emitted (presentation + transition
    // flows handed over for the transition engine): key/frame waits.
    waits: true,
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

  // Shared SCREEN 5 transition engine (advanced effects + legacy overrides).
  const tfxPool = new Screen5TfxDataPool('gf_tfx');
  // GF_TFX_MODE is only needed when a transition hands work to the next
  // Screen5Presentation node (fade in / crossfade); otherwise the presentation
  // routine stays byte-identical.
  let tfxUsesSceneHook = false;

  /** Next Screen5Presentation reached through passthrough nodes, if any. */
  const nextPresentationAfter = (nodeId: string): Msx2GameFlowScreen5PresentationNode | undefined => {
    let next = graph.next(nodeId);
    const visited = new Set<string>();
    while (next && (next.type === 'Waypoint' || next.type === 'Globals' || next.type === 'Music') && !visited.has(next.id)) {
      visited.add(next.id);
      next = graph.next(next.id);
    }
    return next?.type === 'Screen5Presentation' ? next as Msx2GameFlowScreen5PresentationNode : undefined;
  };

  const copyToPaletteRam = (sourceLabel: string): string => `    ld hl, ${sourceLabel}
    ld de, GF_PALETTE_RAM
    ld bc, 32
    ldir
`;

  const engineTransitionAsm = (node: Msx2GameFlowTransitionNode): string => {
    const spec = resolveScreen5TransitionSpec(node);
    let nextPaletteLabel: string | undefined;
    if (SCREEN5_TRANSITIONS_NEEDING_NEXT_SCENE.has(spec.effect)) {
      const nextPresentation = nextPresentationAfter(node.id);
      if (!nextPresentation) {
        throw new Error(`MSX2 SCREEN 5 GameFlow transition "${node.effect}" (node "${node.id}") must be followed by a SCREEN 5 Presentation node.`);
      }
      nextPaletteLabel = `gf_palette_${resolvePresentationEntry(nextPresentation).index}_data`;
    }
    const ctx = {
      prefix: 'gf_tfx',
      pool: tfxPool,
      loadPageOffsetAsm: '    ld de, GF_PAGE_Y',
      loadCurrentPaletteAsm: '    ld hl, GF_PALETTE_RAM',
      nextScenePaletteLabel: nextPaletteLabel,
    };
    if (spec.kind === 'fill') return emitScreen5TfxCall(node, ctx);
    const solid = tfxPool.solidPaletteLabel(spec.color);
    switch (spec.effect) {
      case 'palette_fade_out':
        // Same end state as the legacy fade: the live palette RAM holds the
        // faded colours, so later Text nodes draw with them.
        return `${emitScreen5TfxCall(node, ctx)}${copyToPaletteRam(solid)}`;
      case 'palette_flash':
        return emitScreen5TfxCall(node, ctx);
      case 'palette_crossfade':
        // The next presentation keeps the interpolated palette and uploads its
        // bitmap with the screen on (GF_TFX_MODE = 2).
        tfxUsesSceneHook = true;
        return `${emitScreen5TfxCall(node, ctx)}${copyToPaletteRam(nextPaletteLabel!)}    ld a, 2
    ld (GF_TFX_MODE), a
`;
      case 'palette_fade_in':
      case 'palette_fade_out_in': {
        tfxUsesSceneHook = true;
        const out = spec.effect === 'palette_fade_out_in'
          ? `    ld hl, GF_PALETTE_RAM
    ld de, ${solid}
    ld a, ${spec.framesPerStep}
    call gf_tfx_pal_lerp
`
          : `    ld hl, ${solid}
    call gf_tfx_pal_set
`;
        return `${out}${copyToPaletteRam(solid)}    ld hl, ${solid}
    ld (GF_TFX_FADE_PTR), hl
    ld a, ${spec.framesPerStep}
    ld (GF_TFX_FADE_FPS), a
    ld a, 1
    ld (GF_TFX_MODE), a
`;
      }
      default:
        return emitScreen5TfxCall(node, ctx);
    }
  };

  const transitionAsm = (node: Msx2GameFlowTransitionNode): string => {
    if (!SCREEN5_TRANSITION_EFFECTS.has(node.effect)) {
      throw new Error(`MSX2 SCREEN 5 GameFlow transition "${node.effect}" is not supported; use a SCREEN 5 transition effect.`);
    }
    if (screen5TransitionUsesEngine(node)) return engineTransitionAsm(node);
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

  // Pixel-smooth TextScroll (raster split on the other VRAM page).
  let usesSmoothScroll = false;
  let usesMarquee = false;
  const smoothScrollHost: Screen5SmoothScrollHost = {
    prefix: 'gf_vs',
    ramBase: GF_RAM_BASE + 0x40,
    interrupts: true,
    vblankKind: 'jiffy',
    mainPage: vramPage,
    ringPage: vramPage === 1 ? 0 : 1,
    windowTop: GF_SCROLL_TOP,
    windowHeight: GF_SCROLL_HEIGHT,
    bgVar: 'GF_BG_PIX',
    cmdSx: 'GF_CMD_SX',
    cmdSy: 'GF_CMD_SY',
    cmdDx: 'GF_CMD_DX',
    cmdDy: 'GF_CMD_DY',
    cmdNx: 'GF_CMD_NX',
    cmdNy: 'GF_CMD_NY',
    setFillColorCall: 'call gf_set_fill_color',
    runFillAsm: '    call gf_fill_rect',
    runCopyAsm: '    call gf_copy_rect',
    displayOffAsm: '    call DISSCR',
    displayOnAsm: '    call ENASCR',
  };
  const smoothScrollNodeAsm = (scrollNode: Msx2GameFlowTextScrollNode | Msx2GameFlowTextScrollColorNode): string => {
    const marquee = scrollNode.scrollMode === 'marquee';
    if (marquee) usesMarquee = true; else usesSmoothScroll = true;
    const foreground = clampPaletteIndex((scrollNode as any).textColorIndex, defaultTextColor);
    const background = clampPaletteIndex((scrollNode as any).backgroundColorIndex, 0);
    const stepFrames = Math.max(SMOOTH_SCROLL_LINE_STEP, clampByte((scrollNode as any).scrollStepFrames, 18) || 18);
    const lines = wrapScreen5FlowText(scrollNode.text || '', GF_MAX_COLUMNS - 2, 32);
    const data = marquee
      ? (() => {
          const text = marqueeNodeData(`gf_vsm_${sanitizeLabel(scrollNode.id)}`, lines);
          return { tableLabel: text.textLabel, dataAsm: text.dataAsm, totalPixels: text.totalPixels - GF_SCROLL_HEIGHT };
        })()
      : smoothScrollNodeData(`gf_vs_${sanitizeLabel(scrollNode.id)}`, lines, GF_MAX_COLUMNS);
    const titleAsm = scrollNode.title
      ? printCall(sanitizeScreen5FlowText(scrollNode.title, GF_MAX_COLUMNS), GF_SCROLL_TOP - 20, foreground, background)
      : '';
    const strip = smoothScrollStripTexts();
    const stripY = strip.firstRowY(GF_SCROLL_TOP);
    const stripAsm = strip.rows
      .map((row, index) => printCall(row, stripY + index * 8, foreground, background, { column: 0, spanCharacters: GF_MAX_COLUMNS }))
      .join('');
    return `${titleAsm}    call DISSCR
${stripAsm}    ld a, ${hexByte(background)}
    ld (GF_BG_PIX), a
    ld hl, ${data.tableLabel}
    ld de, ${data.totalPixels + GF_SCROLL_HEIGHT}
    ld a, ${stepFrames}
    call ${marquee ? 'gf_vsm_run' : 'gf_vs_run'}
${waitCall(scrollNode.waitForKey, scrollNode.waitFrames)}    jp ${nextLabel(scrollNode.id)}
${data.dataAsm}`;
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
  const presentationRoutines: Array<() => string> = [];

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
        // The scene hook (fade in / crossfade) is resolved after every node has
        // been emitted, so the routine is built lazily.
        const safeId = sanitizeLabel(node.id);
        const waitAsm = `${waitCall(waitForKey, waitFrames)}    jp ${nextLabel(node.id)}
`;
        presentationRoutines.push(() => (tfxUsesSceneHook
          ? `${header}    ld a, (GF_TFX_MODE)
    or a
    jp nz, gf_scene_tfx_${safeId}
    call DISSCR
    call gf_load_palette_${entry.index}
    call gf_upload_bitmap_${entry.index}
    call ENASCR
gf_scene_shown_${safeId}:
${waitAsm}gf_scene_tfx_${safeId}:
    ; A = GF_TFX_MODE: 1 = fade in from GF_TFX_FADE_PTR, 2 = palette already set
    ld b, a
    xor a
    ld (GF_TFX_MODE), a
    ld a, b
    cp 2
    jp z, gf_scene_keep_${safeId}
    call DISSCR
    call gf_upload_bitmap_${entry.index}
    call ENASCR
    ld hl, (GF_TFX_FADE_PTR)
    ld de, gf_palette_${entry.index}_data
    ld a, (GF_TFX_FADE_FPS)
    call gf_tfx_pal_lerp
    call gf_load_palette_${entry.index}
    jp gf_scene_shown_${safeId}
gf_scene_keep_${safeId}:
    call gf_load_palette_${entry.index}
    call gf_upload_bitmap_${entry.index}
    jp gf_scene_shown_${safeId}
`
          : `${header}    call DISSCR
    call gf_load_palette_${entry.index}
    call gf_upload_bitmap_${entry.index}
    call ENASCR
${waitAsm}`));
        nodeRoutines.push(`__GF_PRESENTATION_ROUTINE_${presentationRoutines.length - 1}__`);
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
        const scrollNode = node as Msx2GameFlowTextScrollNode | Msx2GameFlowTextScrollColorNode;
        if (scrollNode.scrollMode === 'smooth' || scrollNode.scrollMode === 'marquee') {
          nodeRoutines.push(`${header}${smoothScrollNodeAsm(scrollNode)}`);
          break;
        }
        features.scroll = true;
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
        // A bitmap title replaces the text title and brings its own palette, so the menu
        // colours default to that palette's brightest slot instead of the first presentation's.
        const titleEntry = resolveTitleImageEntry(menuNode);
        if (titleEntry) features.titleImage = true;
        const foreground = clampPaletteIndex((menuNode as any).textColorIndex, titleEntry ? titleEntry.brightestIndex : defaultTextColor);
        const background = clampPaletteIndex((menuNode as any).backgroundColorIndex, 0);
        const highlightForeground = clampPaletteIndex((menuNode as any).highlightColorIndex, background);
        const highlightBackground = clampPaletteIndex((menuNode as any).highlightBackgroundIndex, foreground);
        const title = titleEntry ? '' : sanitizeScreen5FlowText(menuNode.title || '', GF_MAX_COLUMNS);
        const layout = resolveScreen5MenuLayout(menuNode, options.map(option => option.text || ''), titleEntry?.image.height);
        if (layout.error) throw new Error(`MSX2 GameFlow SubMenu node "${node.id}": ${layout.error}`);
        // Screen off while the palette changes so the old picture never shows in the new colours.
        const titleImageAsm = titleEntry
          ? `    call DISSCR
    call gf_load_palette_title_${titleEntry.index}
    ld hl, gf_title_image_${titleEntry.index}
    ld de, ${hexWord(vramAddressOf(layout.titleY, resolveScreen5MenuTitleImageColumn(titleEntry.image.widthBytes, layout.titleColumn)))}
    ld b, ${titleEntry.image.height}
    ld c, ${titleEntry.image.widthBytes}
    call gf_blit_rect
    call ENASCR
`
          : '';
        const selectedForeground = layout.useBar ? highlightForeground : foreground;
        const selectedBackground = layout.useBar ? highlightBackground : background;

        const drawRoutine = `gf_menu_draw_${safeId}:
${layout.items.map((item, index) => `    ld a, (GF_MENU_INDEX)
    cp ${index}
    jp z, gf_menu_sel_${safeId}_${index}
${printCall(item.idleText, item.y, foreground, background, { spanCharacters: item.spanCharacters, column: item.column })}    jp gf_menu_done_${safeId}_${index}
gf_menu_sel_${safeId}_${index}:
${printCall(item.selectedText, item.y, selectedForeground, selectedBackground, { spanCharacters: item.spanCharacters, column: item.column })}gf_menu_done_${safeId}_${index}:
`).join('')}    ret
`;

        const dispatch = options.map((option, index) => `    cp ${index}
    jp z, ${nextLabel(node.id, option.id)}
`).join('');

        // Vertical menus answer to up/down (the classic behaviour); horizontal
        // menus to left/right and also accept up/down as previous/next.
        const directionAsm = layout.horizontal
          ? `    cp 7
    jp z, gf_menu_up_${safeId}
    cp 1
    jp z, gf_menu_up_${safeId}
    cp 3
    jp z, gf_menu_down_${safeId}
    cp 5
    jp z, gf_menu_down_${safeId}
`
          : `    cp 1
    jp z, gf_menu_up_${safeId}
    cp 5
    jp z, gf_menu_down_${safeId}
`;

        nodeRoutines.push(`${header}    xor a
    ld (GF_MENU_INDEX), a
${titleImageAsm}${title ? printCall(title, layout.titleY, foreground, background, layout.titleColumn === undefined ? {} : { column: layout.titleColumn }) : ''}    call gf_menu_wait_release
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
${directionAsm}    jp gf_menu_trigger_${safeId}
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

  const resolvedNodeRoutines = nodeRoutines.map(routine => {
    const match = routine.match(/^__GF_PRESENTATION_ROUTINE_(\d+)__$/);
    return match ? presentationRoutines[Number(match[1])]() : routine;
  });

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

  // SubMenu bitmap titles: palette loader + data. Both are empty strings when no menu has one.
  const titleImageList = Array.from(titleImageEntries.values());
  const titleImageRoutines = titleImageList.map(entry => `gf_load_palette_title_${entry.index}:
    ld hl, gf_title_palette_${entry.index}
    ld de, GF_PALETTE_RAM
    ld bc, 32
    ldir
    jp gf_upload_palette_ram
`).join('\n');
  const titleImageData = titleImageList.map(entry => `gf_title_palette_${entry.index}:   ; (R<<4)|B, G
${chunkedDb(entry.paletteBytes)}
gf_title_image_${entry.index}:   ; ${entry.image.widthBytes} bytes x ${entry.image.height} rows
${chunkedDb(entry.image.bytes)}
`).join('\n');

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
; Backend: screen5 (gameflow walker)
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
${generateScreen5FlowRamEquates(GF_RAM_BASE, GF_TEXTBUF_BASE, tfxUsesSceneHook)}${usesSmoothScroll || usesMarquee ? smoothScrollRamEquates(smoothScrollHost) : ''}${usesMarquee ? marqueeRamEquates(smoothScrollHost) : ''}
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
${tfxUsesSceneHook ? '    xor a\n    ld (GF_TFX_MODE), a      ; no scene fade pending at boot\n' : ''}    call ENASCR
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
${resolvedNodeRoutines.join('\n')}
; ==================================================================
; SCREEN 5 presentation data routines
; ==================================================================
${paletteRoutines}
${uploadRoutines}${titleImageRoutines ? `\n${titleImageRoutines}` : ''}
; ==================================================================
; Shared runtime
; ==================================================================
${generateScreen5FlowRuntime(features, fontBytes)}${tfxPool.usesFill || tfxPool.usesPalette ? generateScreen5TfxRuntime({
    prefix: 'gf_tfx',
    interrupts: true,
    frameWaitAsm: '    halt',
    fill: tfxPool.usesFill,
    palette: tfxPool.usesPalette,
  }) : ''}
${usesSmoothScroll || usesMarquee ? generateSmoothScrollRuntime(smoothScrollHost, { vertical: usesSmoothScroll, marquee: usesMarquee }) : ''}${usesCompare ? generateCompareRoutine() : ''}
; ==================================================================
; Data
; ==================================================================
${strings.emit()}

${paletteData}${titleImageData ? `\n${titleImageData}` : ''}${tfxPool.usesFill || tfxPool.usesPalette ? `\n${tfxPool.emitData()}` : ''}

${chunkData}

    ds #C000 - $, #FF
    end
`;
}
