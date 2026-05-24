import { Msx2GameFlowGlobalsNode, Msx2GameFlowGraph, Msx2GameFlowIfThenElseNode, Msx2GameFlowNode, Msx2GameFlowScreen5PresentationNode, Msx2GameFlowTransitionNode, Msx2Screen5PresentationConfig, Screen5PaletteSlot } from '../../../../types';
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
  initialGlobals: Msx2GameFlowGlobalsNode[];
  afterPresentationGlobals: Msx2GameFlowGlobalsNode[];
  afterTransitionGlobals: Msx2GameFlowGlobalsNode[];
  ifThenElse?: ResolvedIfThenElseStep;
  transition?: Msx2GameFlowTransitionNode;
  terminalAction: 'loop' | 'restart';
  requestedPresentationAssetId?: string;
}

interface ResolvedGlobalAssignment {
  nodeId: string;
  variableName: string;
  asmName: string;
  value: number;
  isWord: boolean;
}

interface ResolvedTerminalStep {
  transition?: Msx2GameFlowTransitionNode;
  terminalAction: 'loop' | 'restart';
  globals: Msx2GameFlowGlobalsNode[];
}

interface ResolvedIfThenElseStep {
  node: Msx2GameFlowIfThenElseNode;
  thenStep: ResolvedTerminalStep;
  elseStep: ResolvedTerminalStep;
}

function getNodeById(flow: Msx2GameFlowGraph, nodeId: string | undefined): Msx2GameFlowNode | undefined {
  return nodeId ? flow.nodes.find(node => node.id === nodeId) : undefined;
}

function getNextFlowNode(flow: Msx2GameFlowGraph, node: Msx2GameFlowNode | undefined, sourceId?: string): Msx2GameFlowNode | undefined {
  if (!node) return undefined;
  const nextConnection = (flow.connections || []).find(connection => (
    connection.from.nodeId === node.id &&
    (sourceId ? connection.from.sourceId === sourceId : !connection.from.sourceId)
  ));
  return getNodeById(flow, nextConnection?.to.nodeId);
}

function getNextExportNode(flow: Msx2GameFlowGraph, node: Msx2GameFlowNode | undefined): Msx2GameFlowNode | undefined {
  let nextNode = getNextFlowNode(flow, node);
  const visited = new Set<string>();
  while ((nextNode?.type === 'Waypoint' || nextNode?.type === 'Globals') && !visited.has(nextNode.id)) {
    visited.add(nextNode.id);
    nextNode = getNextFlowNode(flow, nextNode);
  }
  return nextNode;
}

function collectNextExportStep(
  flow: Msx2GameFlowGraph,
  node: Msx2GameFlowNode | undefined,
  sourceId?: string
): { node?: Msx2GameFlowNode; globals: Msx2GameFlowGlobalsNode[] } {
  let nextNode = getNextFlowNode(flow, node, sourceId);
  const visited = new Set<string>();
  const globals: Msx2GameFlowGlobalsNode[] = [];
  while ((nextNode?.type === 'Waypoint' || nextNode?.type === 'Globals') && !visited.has(nextNode.id)) {
    visited.add(nextNode.id);
    if (nextNode.type === 'Globals') globals.push(nextNode as Msx2GameFlowGlobalsNode);
    nextNode = getNextFlowNode(flow, nextNode);
  }
  return { node: nextNode, globals };
}

function resolveTerminalStep(flow: Msx2GameFlowGraph, node: Msx2GameFlowNode, sourceId?: string): ResolvedTerminalStep {
  const step = collectNextExportStep(flow, node, sourceId);
  const nextNode = step.node;
  if (!nextNode) {
    throw new Error(`MSX2 GameFlow branch from "${node.id}" must continue to End, Restart, or terminal Transition.`);
  }
  if (nextNode.type === 'End') return { terminalAction: 'loop', globals: step.globals };
  if (nextNode.type === 'Restart') return { terminalAction: 'restart', globals: step.globals };
  if (nextNode.type !== 'Transition') {
    throw new Error(`MSX2 GameFlow branch from "${node.id}" cannot continue to "${nextNode.type}" in the SCREEN 5 backend.`);
  }
  const afterTransitionStep = collectNextExportStep(flow, nextNode);
  const nodeAfterTransition = afterTransitionStep.node;
  if (nodeAfterTransition?.type !== 'End' && nodeAfterTransition?.type !== 'Restart') {
    throw new Error(`MSX2 GameFlow terminal Transition node "${nextNode.id}" must continue to End or Restart.`);
  }
  return {
    transition: nextNode as Msx2GameFlowTransitionNode,
    terminalAction: nodeAfterTransition.type === 'Restart' ? 'restart' : 'loop',
    globals: [...step.globals, ...afterTransitionStep.globals],
  };
}

function collectInitialGlobalsNodes(
  flow: Msx2GameFlowGraph | undefined,
  presentationNode: Msx2GameFlowScreen5PresentationNode | undefined
): Msx2GameFlowGlobalsNode[] {
  if (!flow || !presentationNode) return [];
  const startId = flow.startNodeId || flow.nodes.find(node => node.type === 'Start')?.id;
  let current = getNextFlowNode(flow, getNodeById(flow, startId));
  const visited = new Set<string>();
  const globals: Msx2GameFlowGlobalsNode[] = [];
  while (current && current.id !== presentationNode.id && !visited.has(current.id)) {
    visited.add(current.id);
    if (current.type === 'Globals') {
      globals.push(current as Msx2GameFlowGlobalsNode);
    } else if (current.type !== 'Waypoint') {
      break;
    }
    current = getNextFlowNode(flow, current);
  }
  return globals;
}

function resolveMsx2GameFlowPresentationNode(flow: Msx2GameFlowGraph | undefined): Msx2GameFlowScreen5PresentationNode | undefined {
  if (!flow || !Array.isArray(flow.nodes)) return undefined;
  const startId = flow.startNodeId || flow.nodes.find(node => node.type === 'Start')?.id;
  const startNode = getNodeById(flow, startId);
  const nextNode = getNextExportNode(flow, startNode);
  return nextNode?.type === 'Screen5Presentation' ? nextNode as Msx2GameFlowScreen5PresentationNode : undefined;
}

function resolveNextExportStep(
  flow: Msx2GameFlowGraph | undefined,
  node: Msx2GameFlowScreen5PresentationNode | undefined
): {
  transition?: Msx2GameFlowTransitionNode;
  terminalAction: 'loop' | 'restart';
  afterPresentationGlobals: Msx2GameFlowGlobalsNode[];
  afterTransitionGlobals: Msx2GameFlowGlobalsNode[];
  ifThenElse?: ResolvedIfThenElseStep;
} {
  if (!flow || !node || !Array.isArray(flow.nodes)) {
    return { terminalAction: 'loop', afterPresentationGlobals: [], afterTransitionGlobals: [] };
  }
  const afterPresentationStep = collectNextExportStep(flow, node);
  const nextNode = afterPresentationStep.node;
  if (!nextNode) {
    throw new Error(`MSX2 GameFlow Screen5Presentation node "${node.id}" must continue to End, Restart, or terminal Transition.`);
  }
  if (nextNode.type === 'End') {
    return {
      terminalAction: 'loop',
      afterPresentationGlobals: afterPresentationStep.globals,
      afterTransitionGlobals: [],
    };
  }
  if (nextNode.type === 'Restart') {
    return {
      terminalAction: 'restart',
      afterPresentationGlobals: afterPresentationStep.globals,
      afterTransitionGlobals: [],
    };
  }
  if (nextNode.type === 'IfThenElse') {
    return {
      terminalAction: 'loop',
      afterPresentationGlobals: afterPresentationStep.globals,
      afterTransitionGlobals: [],
      ifThenElse: {
        node: nextNode as Msx2GameFlowIfThenElseNode,
        thenStep: resolveTerminalStep(flow, nextNode, 'then'),
        elseStep: resolveTerminalStep(flow, nextNode, 'else'),
      },
    };
  }
  if (nextNode.type !== 'Transition') {
    throw new Error(`MSX2 GameFlow Screen5Presentation node "${node.id}" cannot continue to "${nextNode.type}" in the SCREEN 5 backend.`);
  }
  const afterTransitionStep = collectNextExportStep(flow, nextNode);
  const nodeAfterTransition = afterTransitionStep.node;
  if (nodeAfterTransition?.type !== 'End' && nodeAfterTransition?.type !== 'Restart') {
    throw new Error(`MSX2 GameFlow terminal Transition node "${nextNode.id}" must continue to End or Restart.`);
  }
  return {
    transition: nextNode as Msx2GameFlowTransitionNode,
    terminalAction: nodeAfterTransition.type === 'Restart' ? 'restart' : 'loop',
    afterPresentationGlobals: afterPresentationStep.globals,
    afterTransitionGlobals: afterTransitionStep.globals,
  };
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
    throw new Error('MSX2 GameFlow must reach Screen5Presentation from Start through optional Waypoint nodes for the SCREEN 5 backend.');
  }

  if (requestedPresentationAssetId && !presentation) {
    throw new Error(
      `MSX2 GameFlow Screen5Presentation node "${node?.id || 'unknown'}" references missing msx2presentation asset "${requestedPresentationAssetId}".`
    );
  }

  const nextStep = resolveNextExportStep(flow, node);

  return {
    presentation: presentation || presentations[0],
    flow,
    node,
    initialGlobals: collectInitialGlobalsNodes(flow, node),
    afterPresentationGlobals: nextStep.afterPresentationGlobals,
    afterTransitionGlobals: nextStep.afterTransitionGlobals,
    ifThenElse: nextStep.ifThenElse,
    transition: nextStep.transition,
    terminalAction: nextStep.terminalAction,
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

function normalizeGlobalName(name: unknown): string {
  return typeof name === 'string' ? name.trim() : '';
}

function buildGlobalAsmName(variableName: string): string {
  return `global_var_${variableName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '').replace(/[^a-z0-9_]/g, '_')}`;
}

function resolveGlobalVariableInfo(variableName: string, analysis: ProjectAnalysis): { asmName: string; isWord: boolean; values?: any[] } {
  const normalizedName = normalizeGlobalName(variableName);
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

function getIfThenElseOperatorId(operator: unknown): number {
  switch (operator) {
    case '!=': return 1;
    case '>': return 2;
    case '<': return 3;
    case '>=': return 4;
    case '<=': return 5;
    case '==':
    default:
      return 0;
  }
}

function resolveInitialGlobalAssignments(globalsNodes: Msx2GameFlowGlobalsNode[], analysis: ProjectAnalysis): ResolvedGlobalAssignment[] {
  return globalsNodes.flatMap(node => {
    const variables = Array.isArray(node.variables) ? node.variables : [];
    return variables
      .map(variable => {
        const variableName = normalizeGlobalName(variable.name);
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
  });
}

function resolveConditionAsGlobalAssignment(node: Msx2GameFlowIfThenElseNode | undefined, analysis: ProjectAnalysis): ResolvedGlobalAssignment | undefined {
  if (!node) return undefined;
  const variableName = normalizeGlobalName(node.variableName);
  if (!variableName) return undefined;
  const info = resolveGlobalVariableInfo(variableName, analysis);
  return {
    nodeId: node.id,
    variableName,
    asmName: info.asmName,
    value: parseGlobalAssignmentValue(node.compareValue, info.values, info.isWord),
    isWord: info.isWord,
  };
}

function generateGlobalVariableEquates(assignments: ResolvedGlobalAssignment[]): string {
  const seen = new Map<string, ResolvedGlobalAssignment>();
  assignments.forEach(assignment => {
    if (!seen.has(assignment.asmName)) seen.set(assignment.asmName, assignment);
  });
  let address = 0xC000;
  return Array.from(seen.values()).map(assignment => {
    const line = `${assignment.asmName} EQU #${address.toString(16).toUpperCase().padStart(4, '0')}    ; MSX2 GameFlow global: ${assignment.variableName}`;
    address += assignment.isWord ? 2 : 1;
    return line;
  }).join('\n');
}

function generateGlobalsRoutine(label: string, assignments: ResolvedGlobalAssignment[], comment: string): string {
  const lines: string[] = [
    `${label}:`,
  ];
  if (assignments.length === 0) {
    lines.push('    ret');
    return lines.join('\n');
  }
  lines.push(`    ; ${comment}. Clobbers AF and HL.`);
  assignments.forEach(assignment => {
    lines.push(`    ; ${assignment.nodeId}: ${assignment.variableName} = ${assignment.value}`);
    if (assignment.isWord) {
      lines.push(`    ld hl, #${assignment.value.toString(16).toUpperCase().padStart(4, '0')}`);
      lines.push(`    ld (${assignment.asmName}), hl`);
    } else {
      lines.push(`    ld a, ${hexByte(assignment.value)}`);
      lines.push(`    ld (${assignment.asmName}), a`);
    }
  });
  lines.push('    ret');
  return lines.join('\n');
}

function generateAfterPresentationRoutine(nextLabel: string | null, hasAssignments: boolean, shouldEmit: boolean): string {
  if (!shouldEmit) return '';
  const nextStep = nextLabel
    ? `    jp ${nextLabel}`
    : `.gameflow_end_loop:
    halt
    jp .gameflow_end_loop`;
  return `
msx2_gameflow_after_presentation:
${hasAssignments ? '    call msx2_gameflow_apply_after_presentation_globals\n' : ''}${nextStep}
`;
}

function generateIfThenElseRoutine(node: Msx2GameFlowIfThenElseNode | undefined, condition: ResolvedGlobalAssignment | undefined): string {
  if (!node || !condition) return '';
  const safeId = node.id.replace(/[^A-Za-z0-9_]/g, '_');
  const compare = condition.value;
  return `
msx2_gameflow_ifthenelse_${safeId}:
    ; MSX2_GAMEFLOW_IFTHENELSE_NODE: ${node.id}
    ; ${condition.variableName} ${node.operator || '=='} ${compare}
    ld hl, (${condition.asmName})
${condition.isWord ? '' : '    ld h, 0\n'}    ld de, #${compare.toString(16).toUpperCase().padStart(4, '0')}
    ld a, ${getIfThenElseOperatorId(node.operator)}
    call msx2_gameflow_compare_hl_de
    or a
    jp nz, msx2_gameflow_branch_then
    jp msx2_gameflow_branch_else
`;
}

function generateCompareRoutine(needed: boolean): string {
  if (!needed) return '';
  return `
msx2_gameflow_compare_hl_de:
    ; Input: HL=current, DE=compare, A=operator. Output: A=1 true, A=0 false.
    ld c, a
    or a
    sbc hl, de
    ld a, c
    cp 0
    jp z, .equals
    cp 1
    jp z, .not_equals
    cp 2
    jp z, .greater
    cp 3
    jp z, .less
    cp 4
    jp z, .greater_equal
    cp 5
    jp z, .less_equal
    xor a
    ret
.equals:
    ld a, h
    or l
    jp z, .true
    xor a
    ret
.not_equals:
    ld a, h
    or l
    jp nz, .true
    xor a
    ret
.greater:
    jp c, .false
    ld a, h
    or l
    jp nz, .true
    xor a
    ret
.less:
    jp c, .true
    xor a
    ret
.greater_equal:
    jp nc, .true
    xor a
    ret
.less_equal:
    jp c, .true
    ld a, h
    or l
    jp z, .true
.false:
    xor a
    ret
.true:
    ld a, 1
    ret
`;
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

function generateWaitLoop(presentation: Msx2Screen5PresentationConfig, nextLabel: string | null): string {
  if (nextLabel) {
    return generateWaitStep(presentation, nextLabel);
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

function generateTransitionRuntime(
  label: string,
  transition: Msx2GameFlowTransitionNode,
  vramBase: string,
  afterTransitionAction: 'loop' | 'restart',
  beforeActionAsm = ''
): string {
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
${label}:
${beforeActionAsm}${effectBlock}
${waitBlock}${afterTransitionAction === 'restart' ? `    jp init_rom
` : `.gameflow_end_loop_${label}:
    halt
    jp .gameflow_end_loop_${label}
`}`;
}

function generateTerminalActionRoutine(
  label: string,
  step: ResolvedTerminalStep | undefined,
  globalsLabel: string,
  vramBase: string
): string {
  if (!step) return '';
  const globalsCall = step.globals.length > 0 ? `    call ${globalsLabel}\n` : '';
  if (step.transition) {
    return generateTransitionRuntime(label, step.transition, vramBase, step.terminalAction, globalsCall);
  }
  if (step.terminalAction === 'restart') {
    return `
${label}:
${globalsCall}    jp init_rom
`;
  }
  return `
${label}:
${globalsCall}.gameflow_end_loop_${label}:
    halt
    jp .gameflow_end_loop_${label}
`;
}

function generateTerminalTransitionRoutine(
  transition: Msx2GameFlowTransitionNode | undefined,
  vramBase: string,
  afterTransitionAction: 'loop' | 'restart',
  hasAfterTransitionGlobals: boolean
): string {
  if (!transition) return '';
  return generateTransitionRuntime(
    'msx2_gameflow_run_transition',
    transition,
    vramBase,
    afterTransitionAction,
    hasAfterTransitionGlobals ? '    call msx2_gameflow_apply_after_transition_globals\n' : ''
  );
}

function generateTransitionHelpers(needed: boolean, vramBase: string): string {
  if (!needed) return '';
  return `
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
  const terminalAction = resolvedFlow.terminalAction;
  const initialGlobalAssignments = resolveInitialGlobalAssignments(resolvedFlow.initialGlobals, analysis);
  const afterPresentationGlobalAssignments = resolveInitialGlobalAssignments(resolvedFlow.afterPresentationGlobals, analysis);
  const afterTransitionGlobalAssignments = resolveInitialGlobalAssignments(resolvedFlow.afterTransitionGlobals, analysis);
  const ifThenElseCondition = resolveConditionAsGlobalAssignment(resolvedFlow.ifThenElse?.node, analysis);
  if (resolvedFlow.ifThenElse && !ifThenElseCondition) {
    throw new Error(`MSX2 GameFlow IfThenElse node "${resolvedFlow.ifThenElse.node.id}" must select a global variable.`);
  }
  const thenGlobalAssignments = resolveInitialGlobalAssignments(resolvedFlow.ifThenElse?.thenStep.globals || [], analysis);
  const elseGlobalAssignments = resolveInitialGlobalAssignments(resolvedFlow.ifThenElse?.elseStep.globals || [], analysis);
  const allGlobalAssignments = [
    ...initialGlobalAssignments,
    ...afterPresentationGlobalAssignments,
    ...afterTransitionGlobalAssignments,
    ...thenGlobalAssignments,
    ...elseGlobalAssignments,
    ...(ifThenElseCondition ? [ifThenElseCondition] : []),
  ];
  const globalEquates = generateGlobalVariableEquates(allGlobalAssignments);
  const ifThenElseLabel = resolvedFlow.ifThenElse ? `msx2_gameflow_ifthenelse_${resolvedFlow.ifThenElse.node.id.replace(/[^A-Za-z0-9_]/g, '_')}` : null;
  const terminalRuntimeLabel = ifThenElseLabel || (terminalTransition ? 'msx2_gameflow_run_transition' : terminalAction === 'restart' ? 'init_rom' : null);
  const nextRuntimeLabel = (afterPresentationGlobalAssignments.length > 0 || ifThenElseLabel) ? 'msx2_gameflow_after_presentation' : terminalRuntimeLabel;
  const anyTransition = Boolean(terminalTransition || resolvedFlow.ifThenElse?.thenStep.transition || resolvedFlow.ifThenElse?.elseStep.transition);
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
; MSX2_GAMEFLOW_INITIAL_GLOBALS: ${initialGlobalAssignments.length}
; MSX2_GAMEFLOW_AFTER_PRESENTATION_GLOBALS: ${afterPresentationGlobalAssignments.length}
; MSX2_GAMEFLOW_AFTER_TRANSITION_GLOBALS: ${afterTransitionGlobalAssignments.length}
; MSX2_GAMEFLOW_IFTHENELSE: ${resolvedFlow.ifThenElse?.node.id || 'none'}
; MSX2_GAMEFLOW_NEXT_TRANSITION: ${terminalTransition?.id || 'none'}
; MSX2_GAMEFLOW_TERMINAL_ACTION: ${terminalAction}
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
${usesKonamiMegaRom ? '    call init_konami8k_fixed_bank0_banks\n' : ''}    call msx2_gameflow_apply_initial_globals
    call DISSCR
    ld a, 5
    call CHGMOD
    ld bc, #0007
    call WRTVDP
    call load_screen5_palette
    call upload_screen5_presentation_bitmap
    call ENASCR
    ei
${generateWaitLoop(presentation, nextRuntimeLabel)}

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

${generateAfterPresentationRoutine(terminalRuntimeLabel, afterPresentationGlobalAssignments.length > 0, afterPresentationGlobalAssignments.length > 0 || Boolean(ifThenElseLabel))}
${generateIfThenElseRoutine(resolvedFlow.ifThenElse?.node, ifThenElseCondition)}
${generateTerminalActionRoutine('msx2_gameflow_branch_then', resolvedFlow.ifThenElse?.thenStep, 'msx2_gameflow_apply_then_globals', vramBase)}
${generateTerminalActionRoutine('msx2_gameflow_branch_else', resolvedFlow.ifThenElse?.elseStep, 'msx2_gameflow_apply_else_globals', vramBase)}
${generateTerminalTransitionRoutine(terminalTransition, vramBase, terminalAction, afterTransitionGlobalAssignments.length > 0)}
${generateTransitionHelpers(anyTransition, vramBase)}
${generateCompareRoutine(Boolean(resolvedFlow.ifThenElse))}
${generateGlobalsRoutine('msx2_gameflow_apply_initial_globals', initialGlobalAssignments, 'Initial Globals nodes')}
${generateGlobalsRoutine('msx2_gameflow_apply_after_presentation_globals', afterPresentationGlobalAssignments, 'Post-presentation Globals nodes')}
${generateGlobalsRoutine('msx2_gameflow_apply_after_transition_globals', afterTransitionGlobalAssignments, 'Post-transition Globals nodes')}
${generateGlobalsRoutine('msx2_gameflow_apply_then_globals', thenGlobalAssignments, 'THEN branch Globals nodes')}
${generateGlobalsRoutine('msx2_gameflow_apply_else_globals', elseGlobalAssignments, 'ELSE branch Globals nodes')}
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
${anyTransition ? formatBytes('screen5_black_palette_data', Array.from({ length: 32 }, () => 0), 'All-black palette used by terminal MSX2 GameFlow transitions') : ''}
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
