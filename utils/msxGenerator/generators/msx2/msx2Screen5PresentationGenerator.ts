import { Msx2GameFlowGlobalsNode, Msx2GameFlowGraph, Msx2GameFlowIfThenElseNode, Msx2GameFlowNode, Msx2GameFlowScreen5PresentationNode, Msx2GameFlowTextNode, Msx2GameFlowTransitionNode, Msx2Screen5PresentationConfig, Screen5PaletteSlot } from '../../../../types';
import { ProjectAnalysis } from '../../../asmTemplateGenerator';
import { GeneratedASMFiles } from '../../types/asmTypes';
import type { MSXMapperFormat, MSXRomMode } from '../../index';
import { generateMsx2Screen4UnitedFiles, type Msx2Screen4Config } from './msx2Screen4Generator';

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
const hexWord = (value: number): string => `#${(value & 0xffff).toString(16).toUpperCase().padStart(4, '0')}`;

function selectScreen5DisplayPageAsm(vramPage: number): string {
  // CHGMOD may reset VDP R#2. Keep the display page aligned with the VRAM
  // destination used by the presentation upload routine.
  const r2Value = vramPage === 1 ? 0x3f : 0x1f;
  return `    ; Re-select SCREEN 5 display page ${vramPage} through VDP R#2
    ld bc, ${hexWord((r2Value << 8) | 0x02)}
    call WRTVDP
`;
}

interface ResolvedPresentationFlow {
  presentation?: Msx2Screen5PresentationConfig;
  flow?: Msx2GameFlowGraph;
  node?: Msx2GameFlowScreen5PresentationNode;
  initialGlobals: Msx2GameFlowGlobalsNode[];
  afterPresentationGlobals: Msx2GameFlowGlobalsNode[];
  afterPreTextTransitionGlobals: Msx2GameFlowGlobalsNode[];
  afterTransitionGlobals: Msx2GameFlowGlobalsNode[];
  ifThenElse?: ResolvedIfThenElseStep;
  text?: Msx2GameFlowTextNode;
  preTextTransition?: Msx2GameFlowTransitionNode;
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
  text?: Msx2GameFlowTextNode;
  preTextTransition?: Msx2GameFlowTransitionNode;
  transition?: Msx2GameFlowTransitionNode;
  terminalAction: 'loop' | 'restart';
  globalsBeforeText: Msx2GameFlowGlobalsNode[];
  globalsAfterPreTextTransition: Msx2GameFlowGlobalsNode[];
  globals: Msx2GameFlowGlobalsNode[];
}

interface ResolvedIfThenElseStep {
  node: Msx2GameFlowIfThenElseNode;
  thenStep: ResolvedTerminalStep;
  elseStep: ResolvedTerminalStep;
}

interface ResolvedPresentationChainScene {
  node: Msx2GameFlowScreen5PresentationNode;
  presentation: Msx2Screen5PresentationConfig;
  transitionToNext?: Msx2GameFlowTransitionNode;
  terminalAction?: 'loop' | 'restart';
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

function resolveTerminalStep(
  flow: Msx2GameFlowGraph,
  node: Msx2GameFlowNode,
  sourceId?: string,
  visited: Set<string> = new Set()
): ResolvedTerminalStep {
  const visitKey = `${node.id}:${sourceId || 'next'}`;
  if (visited.has(visitKey)) {
    throw new Error(`MSX2 GameFlow branch from "${node.id}" contains a cycle before reaching End, Restart, or terminal Transition.`);
  }
  visited.add(visitKey);
  const step = collectNextExportStep(flow, node, sourceId);
  const nextNode = step.node;
  if (!nextNode) {
    throw new Error(`MSX2 GameFlow branch from "${node.id}" must continue to End, Restart, or terminal Transition.`);
  }
  if (nextNode.type === 'Text') {
    const afterTextStep = resolveTerminalStep(flow, nextNode, undefined, new Set(visited));
    return {
      ...afterTextStep,
      text: nextNode as Msx2GameFlowTextNode,
      globalsBeforeText: step.globals,
    };
  }
  if (nextNode.type === 'End') return { terminalAction: 'loop', globalsBeforeText: [], globalsAfterPreTextTransition: [], globals: step.globals };
  if (nextNode.type === 'Restart') return { terminalAction: 'restart', globalsBeforeText: [], globalsAfterPreTextTransition: [], globals: step.globals };
  if (nextNode.type !== 'Transition') {
    throw new Error(`MSX2 GameFlow branch from "${node.id}" cannot continue to "${nextNode.type}" in the SCREEN 5 backend.`);
  }
  const afterTransitionStep = collectNextExportStep(flow, nextNode);
  const nodeAfterTransition = afterTransitionStep.node;
  if (nodeAfterTransition?.type === 'Text') {
    const afterTextStep = resolveTerminalStep(flow, nodeAfterTransition, undefined, new Set(visited));
    return {
      ...afterTextStep,
      text: nodeAfterTransition as Msx2GameFlowTextNode,
      preTextTransition: nextNode as Msx2GameFlowTransitionNode,
      globalsBeforeText: step.globals,
      globalsAfterPreTextTransition: afterTransitionStep.globals,
    };
  }
  if (nodeAfterTransition && nodeAfterTransition.type !== 'End' && nodeAfterTransition.type !== 'Restart') {
    throw new Error(`MSX2 GameFlow Transition node "${nextNode.id}" cannot continue to "${nodeAfterTransition.type}" in the SCREEN 5 backend; use Text, End, or Restart after a SCREEN 5 transition.`);
  }
  return {
    transition: nextNode as Msx2GameFlowTransitionNode,
    terminalAction: nodeAfterTransition?.type === 'Restart' ? 'restart' : 'loop',
    globalsBeforeText: [],
    globalsAfterPreTextTransition: [],
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

function getScreen4RuntimeGameFlow(analysis: ProjectAnalysis): Msx2GameFlowGraph | undefined {
  return (((analysis as any).msx2GameFlows || []) as Msx2GameFlowGraph[])
    .find(candidate => candidate?.purpose === 'screen4-runtime');
}

function resolvePresentationChain(analysis: ProjectAnalysis, minimumScenes = 2): { flow: Msx2GameFlowGraph; scenes: ResolvedPresentationChainScene[] } | undefined {
  const presentations = (((analysis as any).msx2Presentations || []) as Array<Msx2Screen5PresentationConfig & { id?: string }>);
  const flows = (((analysis as any).msx2GameFlows || []) as Msx2GameFlowGraph[]);
  const flow = flows.filter(candidate => candidate?.purpose !== 'screen4-runtime')
    .find(candidate => candidate?.name === 'Main MSX2') || flows.find(candidate => candidate?.purpose !== 'screen4-runtime');
  const firstNode = resolveMsx2GameFlowPresentationNode(flow);
  if (!flow || !firstNode) return undefined;

  const scenes: ResolvedPresentationChainScene[] = [];
  let current: Msx2GameFlowScreen5PresentationNode | undefined = firstNode;
  const visited = new Set<string>();
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    const requestedPresentationAssetId = current.presentationAssetId;
    const presentation = requestedPresentationAssetId
      ? presentations.find(item => (item as any).id === requestedPresentationAssetId)
      : presentations[0];
    if (!presentation) {
      throw new Error(`MSX2 GameFlow Screen5Presentation node "${current.id}" references missing msx2presentation asset "${requestedPresentationAssetId || 'auto-first'}".`);
    }

    const scene: ResolvedPresentationChainScene = {
      node: current,
      presentation: normalizePresentation(applyGameFlowRuntimeOverrides(presentation, current)),
    };
    const nextNode = getNextExportNode(flow, current);
    if (!nextNode || nextNode.type === 'End') {
      scene.terminalAction = 'loop';
      scenes.push(scene);
      break;
    }
    if (nextNode.type === 'Restart') {
      scene.terminalAction = 'restart';
      scenes.push(scene);
      break;
    }
    if (nextNode.type !== 'Transition') return undefined;
    const afterTransition = getNextExportNode(flow, nextNode);
    if (afterTransition?.type !== 'Screen5Presentation') return undefined;
    scene.transitionToNext = nextNode as Msx2GameFlowTransitionNode;
    scenes.push(scene);
    current = afterTransition as Msx2GameFlowScreen5PresentationNode;
  }

  if (scenes.length < minimumScenes) return undefined;
  return { flow, scenes };
}

function resolveNextExportStep(
  flow: Msx2GameFlowGraph | undefined,
  node: Msx2GameFlowScreen5PresentationNode | undefined
): {
  transition?: Msx2GameFlowTransitionNode;
  terminalAction: 'loop' | 'restart';
  afterPresentationGlobals: Msx2GameFlowGlobalsNode[];
  afterPreTextTransitionGlobals: Msx2GameFlowGlobalsNode[];
  afterTransitionGlobals: Msx2GameFlowGlobalsNode[];
  text?: Msx2GameFlowTextNode;
  preTextTransition?: Msx2GameFlowTransitionNode;
  ifThenElse?: ResolvedIfThenElseStep;
} {
  if (!flow || !node || !Array.isArray(flow.nodes)) {
    return { terminalAction: 'loop', afterPresentationGlobals: [], afterPreTextTransitionGlobals: [], afterTransitionGlobals: [] };
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
      afterPreTextTransitionGlobals: [],
      afterTransitionGlobals: [],
    };
  }
  if (nextNode.type === 'Restart') {
    return {
      terminalAction: 'restart',
      afterPresentationGlobals: afterPresentationStep.globals,
      afterPreTextTransitionGlobals: [],
      afterTransitionGlobals: [],
    };
  }
  if (nextNode.type === 'Text') {
    const textStep = resolveTerminalStep(flow, nextNode);
    return {
      transition: textStep.transition,
      terminalAction: textStep.terminalAction,
      afterPresentationGlobals: afterPresentationStep.globals,
      afterPreTextTransitionGlobals: textStep.globalsAfterPreTextTransition,
      afterTransitionGlobals: textStep.globals,
      text: nextNode as Msx2GameFlowTextNode,
      preTextTransition: textStep.preTextTransition,
    };
  }
  if (nextNode.type === 'IfThenElse') {
    return {
      terminalAction: 'loop',
      afterPresentationGlobals: afterPresentationStep.globals,
      afterPreTextTransitionGlobals: [],
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
  if (nodeAfterTransition?.type === 'Text') {
    const textStep = resolveTerminalStep(flow, nodeAfterTransition);
    return {
      preTextTransition: nextNode as Msx2GameFlowTransitionNode,
      transition: textStep.transition,
      terminalAction: textStep.terminalAction,
      afterPresentationGlobals: afterPresentationStep.globals,
      afterPreTextTransitionGlobals: afterTransitionStep.globals,
      afterTransitionGlobals: textStep.globals,
      text: nodeAfterTransition as Msx2GameFlowTextNode,
    };
  }
  if (nodeAfterTransition && nodeAfterTransition.type !== 'End' && nodeAfterTransition.type !== 'Restart') {
    throw new Error(`MSX2 GameFlow Transition node "${nextNode.id}" cannot continue to "${nodeAfterTransition.type}" in the SCREEN 5 backend; use Text, End, or Restart after a SCREEN 5 transition.`);
  }
  return {
    transition: nextNode as Msx2GameFlowTransitionNode,
    terminalAction: nodeAfterTransition?.type === 'Restart' ? 'restart' : 'loop',
    afterPresentationGlobals: afterPresentationStep.globals,
    afterPreTextTransitionGlobals: [],
    afterTransitionGlobals: afterTransitionStep.globals,
  };
}

function resolvePresentationFlow(analysis: ProjectAnalysis): ResolvedPresentationFlow {
  const presentations = (((analysis as any).msx2Presentations || []) as Array<Msx2Screen5PresentationConfig & { id?: string }>);
  const flows = (((analysis as any).msx2GameFlows || []) as Msx2GameFlowGraph[]);
  const screen5Flows = flows.filter(candidate => candidate?.purpose !== 'screen4-runtime');
  const flow = screen5Flows.find(candidate => candidate?.name === 'Main MSX2') || screen5Flows[0];
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
    afterPreTextTransitionGlobals: nextStep.afterPreTextTransitionGlobals,
    afterTransitionGlobals: nextStep.afterTransitionGlobals,
    text: nextStep.text,
    ifThenElse: nextStep.ifThenElse,
    preTextTransition: nextStep.preTextTransition,
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

function resolveTextPaletteIndex(palette: Screen5PaletteSlot[] | undefined): number {
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

function sanitizeScreen5TextLine(value: unknown, maxLength: number): string {
  return String(value || '')
    .toUpperCase()
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/"/g, "'")
    .slice(0, maxLength);
}

function wrapScreen5Text(value: unknown, maxLineLength = 28, maxLines = 8): string[] {
  const rawLines = String(value || '').replace(/\r/g, '').split('\n');
  const lines: string[] = [];
  rawLines.forEach(rawLine => {
    const words = sanitizeScreen5TextLine(rawLine, 160).split(/\s+/).filter(Boolean);
    let current = '';
    words.forEach(word => {
      const next = current ? `${current} ${word}` : word;
      if (next.length > maxLineLength && current) {
        lines.push(current);
        current = word.slice(0, maxLineLength);
      } else {
        current = next.slice(0, maxLineLength);
      }
    });
    if (current || rawLine.trim().length === 0) lines.push(current);
  });
  return lines.filter((line, index) => line.length > 0 || index < rawLines.length - 1).slice(0, maxLines);
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

function generateSceneWaitStep(label: string, presentation: Msx2Screen5PresentationConfig, nextLabel: string): string {
  const runtime = presentation.runtime;
  if (runtime.waitForKey !== false) {
    return `.${label}_wait_key:
    call CHGET
    jp ${nextLabel}`;
  }
  const waitForFrames = Math.max(0, Math.min(255, Math.trunc(Number(runtime.waitForFrames) || 0)));
  if (waitForFrames > 0) {
    return `    ld b, ${hexByte(waitForFrames)}
.${label}_frame_wait:
    halt
    djnz .${label}_frame_wait
    jp ${nextLabel}`;
  }
  return `    jp ${nextLabel}`;
}

const SCREEN5_TEXT_FONT: Record<string, string[]> = {
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  '6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '01100', '01000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
};

function renderScreen5TextBlock(text: string, colorIndex: number, width = 160, height = 9): number[] {
  const bytes = new Array((width / 2) * height).fill(0);
  const chars = text.toUpperCase().slice(0, Math.floor((width - 4) / 6));
  const colorNibble = Math.max(1, Math.min(15, Math.trunc(colorIndex) || 15));
  for (let charIndex = 0; charIndex < chars.length; charIndex++) {
    const glyph = SCREEN5_TEXT_FONT[chars[charIndex]] || SCREEN5_TEXT_FONT['?'];
    const x0 = 2 + charIndex * 6;
    for (let gy = 0; gy < glyph.length; gy++) {
      for (let gx = 0; gx < 5; gx++) {
        if (glyph[gy][gx] !== '1') continue;
        const x = x0 + gx;
        const byteIndex = gy * (width / 2) + Math.floor(x / 2);
        bytes[byteIndex] |= x % 2 === 0 ? colorNibble << 4 : colorNibble;
      }
    }
  }
  return bytes;
}

function screen5TextBlockDb(label: string, text: string, colorIndex: number): string {
  const bytes = renderScreen5TextBlock(text, colorIndex);
  return `${formatBytes(label, bytes, `SCREEN 5 text block: ${text}`)}${label}_SIZE EQU ${bytes.length}`;
}

function screen5TextBlockCall(label: string, x: number, y: number, vramBase: number, width = 160, height = 9): string {
  const rowBytes = width / 2;
  return Array.from({ length: height }, (_item, row) => {
    const destination = vramBase + (y + row) * BYTES_PER_LINE + Math.floor(x / 2);
    return `    ld hl, ${label} + ${row * rowBytes}
    ld de, #${destination.toString(16).toUpperCase().padStart(4, '0')}
    ld bc, ${rowBytes}
    call LDIRVM`;
  }).join('\n');
}

function generateScreen5TextRoutine(label: string, node: Msx2GameFlowTextNode | undefined, nextActionAsm: string, vramBase: number, textColorIndex: number): string {
  if (!node) return '';
  const safeLabel = label.replace(/[^A-Za-z0-9_]/g, '_');
  const title = sanitizeScreen5TextLine(node.title || 'TEXT', 26);
  const messageLines = wrapScreen5Text(node.message || '', 28, 8);
  const prompt = node.waitForKey === false ? '' : 'PRESS KEY';
  const titleLabel = `${safeLabel}_title`;
  const lineLabels = messageLines.map((_line, index) => `${safeLabel}_line_${index}`);
  const promptLabel = `${safeLabel}_prompt`;
  const lineCalls = messageLines.map((_line, index) => screen5TextBlockCall(lineLabels[index], 16, 48 + index * 10, vramBase)).join('\n');
  const waitBlock = node.waitForKey === false
    ? (() => {
        const frames = Math.max(0, Math.min(255, Math.trunc(Number(node.waitFrames) || 0)));
        return frames > 0
          ? `    ld b, ${hexByte(frames)}
.${safeLabel}_frame_wait:
    halt
    djnz .${safeLabel}_frame_wait
`
          : '';
      })()
    : `${screen5TextBlockCall(promptLabel, 88, 168, vramBase)}
.${safeLabel}_wait_key:
    call CHGET
`;
  return `
${label}:
    ; MSX2_GAMEFLOW_TEXT_NODE: ${node.id}
${screen5TextBlockCall(titleLabel, 16, 24, vramBase)}
${lineCalls}
${waitBlock}${nextActionAsm}

${screen5TextBlockDb(titleLabel, title, textColorIndex)}
${messageLines.map((line, index) => screen5TextBlockDb(lineLabels[index], line, textColorIndex)).join('\n')}
${prompt ? screen5TextBlockDb(promptLabel, prompt, textColorIndex) : ''}
`;
}

function generateScreen5TextHelpers(needed: boolean): string {
  if (!needed) return '';
  return '';
}

function generateTransitionRuntime(
  label: string,
  transition: Msx2GameFlowTransitionNode,
  vramBase: string,
  afterTransitionAction: 'loop' | 'restart',
  beforeActionAsm = ''
): string {
  const effectBlock = getScreen5TransitionEffectBlock(transition, vramBase);
  const durationFrames = Math.max(0, Math.min(255, Math.trunc(Number(transition.durationFrames) || 0)));
  const waitBlock = durationFrames > 0
    ? `    ld b, ${hexByte(durationFrames)}
${label}_transition_wait:
    halt
    djnz ${label}_transition_wait
`
    : '';

  return `
${label}:
${beforeActionAsm}${effectBlock}
${waitBlock}${afterTransitionAction === 'restart' ? `    jp init_rom
` : `.gameflow_end_loop_${label}:
    halt
    jp .gameflow_end_loop_${label}
`}`;
}

function getScreen5TransitionEffectBlock(transition: Msx2GameFlowTransitionNode, _vramBase: string): string {
  const screen5TransitionEffects = new Set([
    'cls',
    'fade_to_black',
    'screen5_vertical_pixel_wipe',
    'screen5_horizontal_pixel_wipe',
    'screen5_diagonal_pixel_wipe',
    'screen5_mirror_pixel_wipe',
  ]);
  if (!screen5TransitionEffects.has(transition.effect)) {
    throw new Error(`MSX2 SCREEN 5 GameFlow transition "${transition.effect}" is not supported; use a SCREEN 5 transition effect.`);
  }
  return transition.effect === 'fade_to_black'
    ? `    call load_screen5_black_palette`
    : transition.effect === 'screen5_vertical_pixel_wipe'
      ? `    call clear_screen5_vertical_pixel_wipe`
      : transition.effect === 'screen5_horizontal_pixel_wipe'
        ? `    call clear_screen5_horizontal_pixel_wipe`
        : transition.effect === 'screen5_diagonal_pixel_wipe'
          ? `    call clear_screen5_diagonal_pixel_wipe`
          : transition.effect === 'screen5_mirror_pixel_wipe'
            ? `    call clear_screen5_mirror_pixel_wipe`
            : `    call DISSCR
    call clear_screen5_visible_vram`;
}

function generatePreTextTransitionRuntime(
  label: string,
  transition: Msx2GameFlowTransitionNode,
  vramBase: string,
  textLabel: string,
  beforeActionAsm = '',
  afterActionAsm = ''
): string {
  const effectBlock = getScreen5TransitionEffectBlock(transition, vramBase);
  const durationFrames = Math.max(0, Math.min(255, Math.trunc(Number(transition.durationFrames) || 0)));
  const waitBlock = durationFrames > 0
    ? `    ld b, ${hexByte(durationFrames)}
${label}_transition_wait:
    halt
    djnz ${label}_transition_wait
`
    : '';

  return `
${label}:
${beforeActionAsm}${effectBlock}
${waitBlock}${afterActionAsm}    jp ${textLabel}
`;
}

function generateTransitionToLabelRuntime(
  label: string,
  transition: Msx2GameFlowTransitionNode,
  vramBase: string,
  nextLabel: string
): string {
  const effectBlock = getScreen5TransitionEffectBlock(transition, vramBase);
  const durationFrames = Math.max(0, Math.min(255, Math.trunc(Number(transition.durationFrames) || 0)));
  const waitBlock = durationFrames > 0
    ? `    ld b, ${hexByte(durationFrames)}
${label}_transition_wait:
    halt
    djnz ${label}_transition_wait
`
    : '';
  return `
${label}:
${effectBlock}
${waitBlock}    jp ${nextLabel}
`;
}

function generateTerminalActionRoutine(
  label: string,
  step: ResolvedTerminalStep | undefined,
  globalsLabel: string,
  globalsBeforeTextLabel: string,
  vramBase: string,
  textColorIndex: number
): string {
  if (!step) return '';
  const globalsCall = step.globals.length > 0 ? `    call ${globalsLabel}\n` : '';
  if (step.text) {
    const preTextGlobalsCall = step.globalsBeforeText.length > 0 ? `    call ${globalsBeforeTextLabel}\n` : '';
    const afterPreTextTransitionGlobalsCall = step.globalsAfterPreTextTransition.length > 0 ? `    call ${globalsBeforeTextLabel}_after_transition\n` : '';
    const textLabel = step.globalsBeforeText.length > 0 || step.preTextTransition ? `${label}_text` : label;
    const textAction = step.transition
      ? `${globalsCall}    jp ${label}_transition\n`
      : step.terminalAction === 'restart'
        ? `${globalsCall}    jp init_rom\n`
        : `${globalsCall}.${label}_end_loop:\n    halt\n    jp .${label}_end_loop\n`;
    const preTextRoutine = step.preTextTransition
      ? generatePreTextTransitionRuntime(label, step.preTextTransition, vramBase, textLabel, preTextGlobalsCall, afterPreTextTransitionGlobalsCall)
      : step.globalsBeforeText.length > 0
        ? `
${label}:
${preTextGlobalsCall}    jp ${textLabel}
`
        : '';
    const vramBaseAddress = vramBase === '#8000' ? 0x8000 : 0;
    return `${preTextRoutine}${generateScreen5TextRoutine(textLabel, step.text, textAction, vramBaseAddress, textColorIndex)}${
      step.transition
        ? generateTransitionRuntime(`${label}_transition`, step.transition, vramBase, step.terminalAction)
        : ''
    }`;
  }
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

function generateScreen5DiagonalPixelWipeTable(): string {
  const entries: string[] = [];
  const rowBlockHeight = 8;
  const columnBlockWidth = 4;
  const rowBlocks = Math.ceil(VISIBLE_HEIGHT / rowBlockHeight);
  const columnBlocks = Math.ceil(BYTES_PER_LINE / columnBlockWidth);
  for (let diagonal = 0; diagonal <= rowBlocks + columnBlocks - 2; diagonal++) {
    for (let rowBlock = 0; rowBlock < rowBlocks; rowBlock++) {
      const columnBlock = diagonal - rowBlock;
      if (columnBlock < 0 || columnBlock >= columnBlocks) continue;
      const row = rowBlock * rowBlockHeight;
      const column = columnBlock * columnBlockWidth;
      const height = Math.min(rowBlockHeight, VISIBLE_HEIGHT - row);
      const width = Math.min(columnBlockWidth, BYTES_PER_LINE - column);
      const offset = (row * BYTES_PER_LINE) + column;
      entries.push(`    DW ${hexWord(offset)}\n    DB ${hexByte(height)},${hexByte(width)}`);
    }
    entries.push('    DW #FFFE');
  }
  entries.push('    DW #FFFF');
  return entries.join('\n');
}

function generateTransitionHelpers(needed: boolean, vramBase: string, effects?: Set<string>): string {
  if (!needed) return '';
  const wants = (effect: string) => !effects || effects.has(effect);
  const needsClearVisible = wants('cls');
  const needsBlackPalette = wants('fade_to_black');
  const needsVerticalColumn = wants('screen5_vertical_pixel_wipe') || wants('screen5_mirror_pixel_wipe');
  const needsRect = wants('screen5_diagonal_pixel_wipe');
  return `
${needsClearVisible ? `clear_screen5_visible_vram:
    ; Terminal clear helper. Clobbers AF, BC, HL.
    xor a
    ld hl, ${vramBase}
    ld bc, SCREEN5_PRESENTATION_BITMAP_SIZE
    call FILVRM
    ret
` : ''}

${needsBlackPalette ? `load_screen5_black_palette:
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
` : ''}

${wants('screen5_vertical_pixel_wipe') ? `clear_screen5_vertical_pixel_wipe:
    ; Wipes SCREEN 5 bitmap in 4-pixel vertical steps. Clobbers AF, BC, DE, HL.
    ld e, 0
.vertical_column_loop:
    call clear_screen5_vertical_pixel_column
    inc e
    ld a, e
    cp SCREEN5_PRESENTATION_BYTES_PER_LINE
    jp nc, .vertical_wipe_done
    call clear_screen5_vertical_pixel_column
    inc e
    halt
    ld a, e
    cp SCREEN5_PRESENTATION_BYTES_PER_LINE
    jp c, .vertical_column_loop
.vertical_wipe_done:
    ret
` : ''}

${needsVerticalColumn ? `clear_screen5_vertical_pixel_column:
    ; E=byte column. Clears one 2-pixel SCREEN 5 column. Clobbers AF, BC, D, HL.
    ld hl, ${vramBase}
    ld d, 0
    add hl, de
    ld b, SCREEN5_PRESENTATION_VISIBLE_LINES
.vertical_row_loop:
    xor a
    push bc
    push de
    push hl
    ld bc, 1
    call FILVRM
    pop hl
    ld bc, SCREEN5_PRESENTATION_BYTES_PER_LINE
    add hl, bc
    pop de
    pop bc
    djnz .vertical_row_loop
    ret
` : ''}

${wants('screen5_mirror_pixel_wipe') ? `clear_screen5_mirror_pixel_wipe:
    ; Wipes SCREEN 5 from both vertical edges inward. Clobbers AF, BC, DE, HL.
    ld e, 0
.mirror_column_loop:
    call clear_screen5_vertical_pixel_column
    ld a, SCREEN5_PRESENTATION_LAST_BYTE_COLUMN
    sub e
    ld e, a
    call clear_screen5_vertical_pixel_column
    ld a, SCREEN5_PRESENTATION_LAST_BYTE_COLUMN
    sub e
    inc a
    ld e, a
    halt
    cp SCREEN5_PRESENTATION_HALF_BYTES_PER_LINE
    jp c, .mirror_column_loop
    ret
` : ''}

${wants('screen5_horizontal_pixel_wipe') ? `clear_screen5_horizontal_pixel_wipe:
    ; Wipes SCREEN 5 in two horizontal scanlines per frame. Clobbers AF, BC, DE, HL.
    ld hl, ${vramBase}
    ld d, SCREEN5_PRESENTATION_VISIBLE_LINES
.horizontal_row_loop:
    xor a
    push de
    push hl
    ld bc, SCREEN5_PRESENTATION_BYTES_PER_LINE
    call FILVRM
    pop hl
    ld bc, SCREEN5_PRESENTATION_BYTES_PER_LINE
    add hl, bc
    pop de
    dec d
    jp z, .horizontal_wipe_done
    xor a
    push de
    push hl
    ld bc, SCREEN5_PRESENTATION_BYTES_PER_LINE
    call FILVRM
    pop hl
    ld bc, SCREEN5_PRESENTATION_BYTES_PER_LINE
    add hl, bc
    pop de
    dec d
    halt
    jp nz, .horizontal_row_loop
.horizontal_wipe_done:
    ret
` : ''}

${needsRect ? `clear_screen5_rect:
    ; HL=top-left VRAM byte, B=height, C=width. Clobbers AF, BC, DE, HL.
    ld a, b
    or a
    ret z
    ld a, c
    or a
    ret z
.rect_loop:
    push bc
    push hl
    ld b, 0
    xor a
    call FILVRM
    pop hl
    ld de, SCREEN5_PRESENTATION_BYTES_PER_LINE
    add hl, de
    pop bc
    djnz .rect_loop
    ret
` : ''}

${wants('screen5_diagonal_pixel_wipe') ? `clear_screen5_diagonal_pixel_wipe:
    ; Wipes SCREEN 5 in diagonal 8-line by 8-pixel bands. Clobbers AF, BC, DE, HL.
    ld hl, screen5_diagonal_pixel_wipe_table
.diagonal_table_loop:
    ld e, (hl)
    inc hl
    ld d, (hl)
    inc hl
    ld a, d
    cp #FF
    jp nz, .diagonal_rect_entry
    ld a, e
    cp #FE
    jp z, .diagonal_wait
    ret
.diagonal_wait:
    halt
    jp .diagonal_table_loop
.diagonal_rect_entry:
    push hl
    ld hl, ${vramBase}
    add hl, de
    pop de
    ld a, (de)
    inc de
    ld b, a
    ld a, (de)
    inc de
    ld c, a
    push de
    call clear_screen5_rect
    pop hl
    jp .diagonal_table_loop

screen5_diagonal_pixel_wipe_table:
${generateScreen5DiagonalPixelWipeTable()}
` : ''}
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

function generatePresentationChainUnitedFiles(
  projectName: string,
  flow: Msx2GameFlowGraph,
  scenes: ResolvedPresentationChainScene[],
  config: Msx2Screen5PresentationGeneratorConfig,
  options: {
    entryLabel?: string;
    finalJumpLabel?: string;
    includeCartridgeScaffold?: boolean;
    extraHeaderMarkers?: string;
    bankedChunkStartBank?: number;
  } = {}
): string {
  const entryLabel = options.entryLabel || 'init_rom';
  const includeCartridgeScaffold = options.includeCartridgeScaffold !== false;
  const usesKonamiMegaRom = config.romMode === 'megarom' && config.targetFormat === 'konami';
  const hasExplicitChunkBankStart = typeof options.bankedChunkStartBank === 'number';
  const bankedChunkStartBank = typeof options.bankedChunkStartBank === 'number'
    ? Math.max(0, Math.trunc(options.bankedChunkStartBank))
    : usesKonamiMegaRom
      ? 3
      : undefined;
  const preparedScenes = scenes.map((scene, sceneIndex) => {
    const presentation = scene.presentation;
    const paletteBytes = buildPaletteBytes(presentation.palette);
    const bitmapBytes = buildBitmapBytes(presentation);
    const chunkLines = Math.max(1, Math.min(DEFAULT_CHUNK_LINES, Math.trunc(Number(presentation.compression?.chunkLines) || DEFAULT_CHUNK_LINES)));
    const bitmapChunks = chunkBitmapBytes(bitmapBytes, chunkLines);
    const vramBase = presentation.runtime.vramPage === 1 ? '#8000' : '#0000';
    const label = `msx2_gameflow_screen5_scene_${sceneIndex}`;
    return { ...scene, presentation, paletteBytes, bitmapChunks, chunkLines, vramBase, label, sceneIndex };
  });
  const chunkBankByLabel = new Map<string, number>();
  if (typeof bankedChunkStartBank === 'number') {
    let nextBank = bankedChunkStartBank;
    preparedScenes.forEach(scene => {
      scene.bitmapChunks.forEach((_chunk, index) => {
        chunkBankByLabel.set(`SCREEN5_SCENE_${scene.sceneIndex}_BITMAP_CHUNK_${index}`, nextBank++);
      });
    });
  }
  const bankedChunkVramWindow = chunkBankByLabel.size > 0 && usesKonamiMegaRom && !hasExplicitChunkBankStart ? '#A000' : '#8000';
  const bankedChunkWindowEnd = bankedChunkVramWindow === '#A000' ? '#C000' : '#A000';
  const bankedChunkMapperCall = bankedChunkVramWindow === '#A000' ? 'mapper_set_bank_p3' : 'mapper_set_bank_p2';
  const bankedChunkRestoreBank = bankedChunkVramWindow === '#A000' ? 3 : 2;
  const anyTransition = preparedScenes.some(scene => Boolean(scene.transitionToNext));
  const usedTransitionEffects = new Set(preparedScenes
    .map(scene => scene.transitionToNext?.effect)
    .filter(Boolean)
    .map(effect => String(effect)));
  const firstScene = preparedScenes[0];

  const paletteRoutines = preparedScenes.map(scene => `load_screen5_palette_scene_${scene.sceneIndex}:
    ld bc, #0010
    call WRTVDP
    ld hl, screen5_palette_scene_${scene.sceneIndex}_data
    ld b, 32
palette_loop_scene_${scene.sceneIndex}:
    ld a, (hl)
    out (VDP_PALETTE_PORT), a
    inc hl
    djnz palette_loop_scene_${scene.sceneIndex}
    ret`).join('\n\n');

  const uploadRoutines = preparedScenes.map(scene => {
    const uploadChunks = scene.bitmapChunks.map((_chunk, index) => {
      const label = `SCREEN5_SCENE_${scene.sceneIndex}_BITMAP_CHUNK_${index}`;
      const vramOffset = index * scene.chunkLines * BYTES_PER_LINE;
      const destination = scene.presentation.runtime.vramPage === 1
        ? `#${(0x8000 + vramOffset).toString(16).toUpperCase().padStart(4, '0')}`
        : `#${vramOffset.toString(16).toUpperCase().padStart(4, '0')}`;
      const bank = chunkBankByLabel.get(label);
      const bankSwitch = bank === undefined
        ? ''
        : `    ld a, ${label}_BANK
    call ${bankedChunkMapperCall}
`;
      return `${bankSwitch}    ; @mideas:screen5-presentation-chunk ${label}
    ld hl, ${label}
    ld de, ${destination}
    ld bc, ${label}_SIZE
    call LDIRVM`;
    }).join('\n');
    return `upload_screen5_scene_${scene.sceneIndex}_bitmap:
${uploadChunks}
${chunkBankByLabel.size > 0 ? `    ld a, ${bankedChunkRestoreBank}\n    call ${bankedChunkMapperCall}\n` : ''}
    ret`;
  }).join('\n\n');

  const sceneRoutines = preparedScenes.map((scene, index) => {
    const nextScene = preparedScenes[index + 1];
    const nextLabel = scene.transitionToNext && nextScene
      ? `${scene.label}_transition`
      : options.finalJumpLabel
        ? options.finalJumpLabel
        : scene.terminalAction === 'restart'
          ? entryLabel
          : `${scene.label}_end_loop`;
    const terminalLoop = !scene.transitionToNext && !options.finalJumpLabel && scene.terminalAction !== 'restart'
      ? `
${scene.label}_end_loop:
    halt
    jp ${scene.label}_end_loop`
      : '';
    const transitionRoutine = scene.transitionToNext && nextScene
      ? generateTransitionToLabelRuntime(`${scene.label}_transition`, scene.transitionToNext, scene.vramBase, nextScene.label)
      : '';
    return `${scene.label}:
    call DISSCR
${selectScreen5DisplayPageAsm(scene.presentation.runtime.vramPage)}    call load_screen5_palette_scene_${scene.sceneIndex}
    call upload_screen5_scene_${scene.sceneIndex}_bitmap
    call ENASCR
${generateSceneWaitStep(scene.label, scene.presentation, nextLabel)}
${terminalLoop}
${transitionRoutine}`;
  }).join('\n\n');

  const paletteData = preparedScenes.map(scene => formatBytes(`screen5_palette_scene_${scene.sceneIndex}_data`, scene.paletteBytes, `SCREEN 5 palette for scene ${scene.sceneIndex}`)).join('\n');
  const chunkData = preparedScenes.map(scene => scene.bitmapChunks.map((chunk, index) => {
    const label = `SCREEN5_SCENE_${scene.sceneIndex}_BITMAP_CHUNK_${index}`;
    const bank = chunkBankByLabel.get(label);
    const bankHeader = bank === undefined
      ? ''
      : `${label}_BANK EQU ${bank}
    org ${bankedChunkVramWindow}
`;
    const bankPad = bank === undefined ? '' : `    ds ${bankedChunkWindowEnd} - $, #FF\n`;
    return `${label}_SIZE EQU ${chunk.length}

${bankHeader}${formatBytes(label, chunk, `SCREEN 5 scene ${scene.sceneIndex} bitmap chunk ${index}, ${chunk.length} bytes`)}${bankPad}`;
  }).join('\n')).join('\n');

  const body = `${includeCartridgeScaffold ? `; File: unitedFiles.asm
; ==================================================================
; Mideas MSX2 SCREEN 5 presentation chain backend
; Project: ${projectName}
; Presentation scenes: ${preparedScenes.length}
; Screen mode: ${config.screenMode}
; Backend: msx2-screen5-presentation-chain
; MSX2_GAMEFLOW_PRESENT: yes
; MSX2_GAMEFLOW_ASSET: ${flow.name || 'Main MSX2'}
; MSX2_GAMEFLOW_SCREEN5_CHAIN: ${preparedScenes.length}
${options.extraHeaderMarkers || ''}
; ROM mode requested: ${config.romMode}
; ROM Mode: ${config.romMode}
; Mapper Target: ${config.targetFormat}
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

` : `; Mideas MSX2 SCREEN 5 presentation chain backend
; Backend: msx2-screen5-presentation-chain
; MSX2_GAMEFLOW_SCREEN5_CHAIN: ${preparedScenes.length}
${options.extraHeaderMarkers || ''}
SCREEN5_PRESENTATION_ZX0_BUFFER EQU #D000

`}${entryLabel}:
    di
    call map_page2_to_cart_primary
${usesKonamiMegaRom ? '    call init_konami8k_fixed_bank0_banks\n' : ''}    call DISSCR
    ld a, 5
    call CHGMOD
${selectScreen5DisplayPageAsm(firstScene.presentation.runtime.vramPage)}    ld bc, #0007
    call WRTVDP
    ei
    jp ${firstScene.label}

${includeCartridgeScaffold ? `
map_page2_to_cart_primary:
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
` : ''}
${sceneRoutines}
${paletteRoutines}
${uploadRoutines}
${generateTransitionHelpers(anyTransition, firstScene.vramBase, usedTransitionEffects)}
SCREEN5_PRESENTATION_BITMAP_SIZE EQU ${BITMAP_BYTE_COUNT}
SCREEN5_PRESENTATION_VISIBLE_LINES EQU ${VISIBLE_HEIGHT}
SCREEN5_PRESENTATION_BYTES_PER_LINE EQU ${BYTES_PER_LINE}
SCREEN5_PRESENTATION_LAST_BYTE_COLUMN EQU ${BYTES_PER_LINE - 1}
SCREEN5_PRESENTATION_HALF_BYTES_PER_LINE EQU ${BYTES_PER_LINE / 2}
SCREEN5_PRESENTATION_BITMAP_VRAM_BASE EQU ${firstScene.vramBase}

${paletteData}
${anyTransition ? formatBytes('screen5_black_palette_data', Array.from({ length: 32 }, () => 0), 'All-black palette used by MSX2 GameFlow transitions') : ''}
${chunkBankByLabel.size > 0 ? `    IF ($ < ${bankedChunkVramWindow})
    ds ${bankedChunkVramWindow} - $, #FF
    ENDIF
` : ''}
; __MIDEAS_SCREEN5_CHAIN_CHUNK_DATA_START__
${chunkData}
; __MIDEAS_SCREEN5_CHAIN_CHUNK_DATA_END__
`;
  return body;
}

function renameScreen4EntryForMixedAsm(screen4Asm: string): string {
  let transformed = screen4Asm.replace(/\bdw\s+init_rom\b/i, 'dw __MIDEAS_MIXED_ENTRY__');
  transformed = transformed.replace(/\binit_rom\b/g, 'screen4_runtime_init_rom');
  transformed = transformed.replace('dw __MIDEAS_MIXED_ENTRY__', 'dw init_rom');
  return transformed;
}

function generateMixedScreen5ToScreen4UnitedFiles(
  projectName: string,
  flow: Msx2GameFlowGraph,
  scenes: ResolvedPresentationChainScene[],
  analysis: ProjectAnalysis,
  config: Msx2Screen5PresentationGeneratorConfig
): string {
  const screen4Asm = renameScreen4EntryForMixedAsm(generateMsx2Screen4UnitedFiles(projectName, analysis, {
    ...(config as unknown as Msx2Screen4Config),
    screenMode: 'SCREEN 4 (Graphics II)',
  }));
  const introAsm = generatePresentationChainUnitedFiles(projectName, flow, scenes, config, {
    entryLabel: 'mixed_screen5_intro_entry',
    finalJumpLabel: 'screen4_runtime_init_rom',
    includeCartridgeScaffold: false,
    extraHeaderMarkers: '; MSX2_GAMEFLOW_SCREEN5_TO_SCREEN4_MIXED: yes',
    bankedChunkStartBank: 6,
  });
  const chunkDataMatch = introAsm.match(/; __MIDEAS_SCREEN5_CHAIN_CHUNK_DATA_START__[\s\S]*?; __MIDEAS_SCREEN5_CHAIN_CHUNK_DATA_END__\n?/);
  const introCodeAsm = chunkDataMatch
    ? introAsm.replace(chunkDataMatch[0], '')
    : introAsm;
  const bankedIntroCodeAsm = introCodeAsm.replace(
    /    call map_page2_to_cart_primary\n    call init_konami8k_fixed_bank0_banks\n/,
    ''
  );
  const introChunkDataAsm = chunkDataMatch ? chunkDataMatch[0] : '';
  const insertionPoint = /^screen4_runtime_init_rom:\s*$/m;
  if (!insertionPoint.test(screen4Asm)) {
    throw new Error('MSX2 mixed SCREEN 5 -> SCREEN 4 backend could not locate the SCREEN 4 runtime entry label.');
  }
  const residentStub = `init_rom:
    di
    call map_page2_to_cart_primary
    call init_konami8k_fixed_bank0_banks
    ld a, MIXED_SCREEN5_INTRO_BANK
    call mapper_set_bank_p1
    jp mixed_screen5_intro_entry

`;
  const bankedIntroAsm = `MIXED_SCREEN5_INTRO_BANK EQU 5
    org #6000

${bankedIntroCodeAsm}
    ds #8000 - $, #FF
`;
  const withIntro = screen4Asm
    .replace('; Mideas MSX2 SCREEN 4 tile backend', '; Mideas MSX2 mixed SCREEN 5 presentation + SCREEN 4 runtime backend')
    .replace('; MSX2 MegaROM Path:', '; Backend: msx2-screen5-presentation-chain-screen4-runtime\n; Mideas MSX2 SCREEN 5 presentation chain backend\n; MSX2 MegaROM Path:')
    .replace(insertionPoint, `${residentStub}$&`);
  return introChunkDataAsm
    ? withIntro.replace(/\n\s*end\s*$/i, `\n${bankedIntroAsm}\n${introChunkDataAsm}\n    end\n`)
    : withIntro.replace(/\n\s*end\s*$/i, `\n${bankedIntroAsm}\n    end\n`);
}

function generateUnitedFiles(projectName: string, analysis: ProjectAnalysis, config: Msx2Screen5PresentationGeneratorConfig): string {
  const screen4RuntimeFlow = getScreen4RuntimeGameFlow(analysis);
  if (screen4RuntimeFlow) {
    const presentationSequence = resolvePresentationChain(analysis, 1);
    if (presentationSequence) {
      return generateMixedScreen5ToScreen4UnitedFiles(projectName, presentationSequence.flow, presentationSequence.scenes, analysis, config);
    }
  }
  const presentationChain = resolvePresentationChain(analysis);
  if (presentationChain) {
    return generatePresentationChainUnitedFiles(projectName, presentationChain.flow, presentationChain.scenes, config);
  }
  const resolvedFlow = resolvePresentationFlow(analysis);
  const presentation = normalizePresentation(applyGameFlowRuntimeOverrides(resolvedFlow.presentation, resolvedFlow.node));
  const paletteBytes = buildPaletteBytes(presentation.palette);
  const textColorIndex = resolveTextPaletteIndex(presentation.palette);
  const bitmapBytes = buildBitmapBytes(presentation);
  const chunkLines = Math.max(1, Math.min(DEFAULT_CHUNK_LINES, Math.trunc(Number(presentation.compression?.chunkLines) || DEFAULT_CHUNK_LINES)));
  const bitmapChunks = chunkBitmapBytes(bitmapBytes, chunkLines);
  const vramBase = presentation.runtime.vramPage === 1 ? '#8000' : '#0000';
  const usesKonamiMegaRom = config.romMode === 'megarom' && config.targetFormat === 'konami';
  const terminalTransition = resolvedFlow.transition;
  const preTextTransition = resolvedFlow.preTextTransition;
  const terminalAction = resolvedFlow.terminalAction;
  const initialGlobalAssignments = resolveInitialGlobalAssignments(resolvedFlow.initialGlobals, analysis);
  const afterPresentationGlobalAssignments = resolveInitialGlobalAssignments(resolvedFlow.afterPresentationGlobals, analysis);
  const afterPreTextTransitionGlobalAssignments = resolveInitialGlobalAssignments(resolvedFlow.afterPreTextTransitionGlobals, analysis);
  const afterTransitionGlobalAssignments = resolveInitialGlobalAssignments(resolvedFlow.afterTransitionGlobals, analysis);
  const ifThenElseCondition = resolveConditionAsGlobalAssignment(resolvedFlow.ifThenElse?.node, analysis);
  if (resolvedFlow.ifThenElse && !ifThenElseCondition) {
    throw new Error(`MSX2 GameFlow IfThenElse node "${resolvedFlow.ifThenElse.node.id}" must select a global variable.`);
  }
  const thenPreTextGlobalAssignments = resolveInitialGlobalAssignments(resolvedFlow.ifThenElse?.thenStep.globalsBeforeText || [], analysis);
  const thenAfterPreTextTransitionGlobalAssignments = resolveInitialGlobalAssignments(resolvedFlow.ifThenElse?.thenStep.globalsAfterPreTextTransition || [], analysis);
  const thenGlobalAssignments = resolveInitialGlobalAssignments(resolvedFlow.ifThenElse?.thenStep.globals || [], analysis);
  const elsePreTextGlobalAssignments = resolveInitialGlobalAssignments(resolvedFlow.ifThenElse?.elseStep.globalsBeforeText || [], analysis);
  const elseAfterPreTextTransitionGlobalAssignments = resolveInitialGlobalAssignments(resolvedFlow.ifThenElse?.elseStep.globalsAfterPreTextTransition || [], analysis);
  const elseGlobalAssignments = resolveInitialGlobalAssignments(resolvedFlow.ifThenElse?.elseStep.globals || [], analysis);
  const allGlobalAssignments = [
    ...initialGlobalAssignments,
    ...afterPresentationGlobalAssignments,
    ...afterPreTextTransitionGlobalAssignments,
    ...afterTransitionGlobalAssignments,
    ...thenPreTextGlobalAssignments,
    ...thenAfterPreTextTransitionGlobalAssignments,
    ...thenGlobalAssignments,
    ...elsePreTextGlobalAssignments,
    ...elseAfterPreTextTransitionGlobalAssignments,
    ...elseGlobalAssignments,
    ...(ifThenElseCondition ? [ifThenElseCondition] : []),
  ];
  const globalEquates = generateGlobalVariableEquates(allGlobalAssignments);
  const ifThenElseLabel = resolvedFlow.ifThenElse ? `msx2_gameflow_ifthenelse_${resolvedFlow.ifThenElse.node.id.replace(/[^A-Za-z0-9_]/g, '_')}` : null;
  const textLabel = resolvedFlow.text ? `msx2_gameflow_text_${resolvedFlow.text.id.replace(/[^A-Za-z0-9_]/g, '_')}` : null;
  const preTextTransitionLabel = preTextTransition ? 'msx2_gameflow_run_pre_text_transition' : null;
  const terminalRuntimeLabel = ifThenElseLabel || preTextTransitionLabel || textLabel || (terminalTransition ? 'msx2_gameflow_run_transition' : terminalAction === 'restart' ? 'init_rom' : null);
  const nextRuntimeLabel = (afterPresentationGlobalAssignments.length > 0 || ifThenElseLabel || textLabel) ? 'msx2_gameflow_after_presentation' : terminalRuntimeLabel;
  const anyTransition = Boolean(preTextTransition || terminalTransition || resolvedFlow.ifThenElse?.thenStep.preTextTransition || resolvedFlow.ifThenElse?.thenStep.transition || resolvedFlow.ifThenElse?.elseStep.preTextTransition || resolvedFlow.ifThenElse?.elseStep.transition);
  const anyText = Boolean(resolvedFlow.text || resolvedFlow.ifThenElse?.thenStep.text || resolvedFlow.ifThenElse?.elseStep.text);
  const afterPreTextTransitionGlobalsCall = afterPreTextTransitionGlobalAssignments.length > 0 ? '    call msx2_gameflow_apply_after_pre_text_transition_globals\n' : '';
  const mainTextGlobalsCall = afterTransitionGlobalAssignments.length > 0 ? '    call msx2_gameflow_apply_after_transition_globals\n' : '';
  const mainTextAction = terminalTransition
    ? '    jp msx2_gameflow_run_transition\n'
    : terminalAction === 'restart'
      ? `${mainTextGlobalsCall}    jp init_rom\n`
      : `${mainTextGlobalsCall}.gameflow_end_loop_after_text:\n    halt\n    jp .gameflow_end_loop_after_text\n`;
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
; MSX2_GAMEFLOW_AFTER_PRE_TEXT_TRANSITION_GLOBALS: ${afterPreTextTransitionGlobalAssignments.length}
; MSX2_GAMEFLOW_AFTER_TRANSITION_GLOBALS: ${afterTransitionGlobalAssignments.length}
; MSX2_GAMEFLOW_TEXT: ${resolvedFlow.text?.id || 'none'}
; MSX2_GAMEFLOW_IFTHENELSE: ${resolvedFlow.ifThenElse?.node.id || 'none'}
; MSX2_GAMEFLOW_PRE_TEXT_TRANSITION: ${preTextTransition?.id || 'none'}
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
POSIT   EQU #00C6
GRPPRT  EQU #0089
WRTVDP  EQU #0047
RSLREG  EQU #0138
ENASLT  EQU #0024
FORCLR  EQU #F3E8
BAKCLR  EQU #F3E9
BDRCLR  EQU #F3EA
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
${selectScreen5DisplayPageAsm(presentation.runtime.vramPage)}    ld bc, #0007
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

${generateAfterPresentationRoutine(terminalRuntimeLabel, afterPresentationGlobalAssignments.length > 0, afterPresentationGlobalAssignments.length > 0 || Boolean(ifThenElseLabel || textLabel))}
${preTextTransition && textLabel ? generatePreTextTransitionRuntime('msx2_gameflow_run_pre_text_transition', preTextTransition, vramBase, textLabel, '', afterPreTextTransitionGlobalsCall) : ''}
${generateScreen5TextRoutine(textLabel || '', resolvedFlow.text, mainTextAction, presentation.runtime.vramPage === 1 ? 0x8000 : 0, textColorIndex)}
${generateIfThenElseRoutine(resolvedFlow.ifThenElse?.node, ifThenElseCondition)}
${generateTerminalActionRoutine('msx2_gameflow_branch_then', resolvedFlow.ifThenElse?.thenStep, 'msx2_gameflow_apply_then_globals', 'msx2_gameflow_apply_then_pre_text_globals', vramBase, textColorIndex)}
${generateTerminalActionRoutine('msx2_gameflow_branch_else', resolvedFlow.ifThenElse?.elseStep, 'msx2_gameflow_apply_else_globals', 'msx2_gameflow_apply_else_pre_text_globals', vramBase, textColorIndex)}
${generateTerminalTransitionRoutine(terminalTransition, vramBase, terminalAction, afterTransitionGlobalAssignments.length > 0)}
${generateTransitionHelpers(anyTransition, vramBase)}
${generateScreen5TextHelpers(anyText)}
${generateCompareRoutine(Boolean(resolvedFlow.ifThenElse))}
${generateGlobalsRoutine('msx2_gameflow_apply_initial_globals', initialGlobalAssignments, 'Initial Globals nodes')}
${generateGlobalsRoutine('msx2_gameflow_apply_after_presentation_globals', afterPresentationGlobalAssignments, 'Post-presentation Globals nodes')}
${generateGlobalsRoutine('msx2_gameflow_apply_after_pre_text_transition_globals', afterPreTextTransitionGlobalAssignments, 'Post-pre-text-transition Globals nodes')}
${generateGlobalsRoutine('msx2_gameflow_apply_after_transition_globals', afterTransitionGlobalAssignments, 'Post-transition Globals nodes')}
${generateGlobalsRoutine('msx2_gameflow_apply_then_pre_text_globals', thenPreTextGlobalAssignments, 'THEN branch pre-text Globals nodes')}
${generateGlobalsRoutine('msx2_gameflow_apply_then_pre_text_globals_after_transition', thenAfterPreTextTransitionGlobalAssignments, 'THEN branch post-pre-text-transition Globals nodes')}
${generateGlobalsRoutine('msx2_gameflow_apply_then_globals', thenGlobalAssignments, 'THEN branch Globals nodes')}
${generateGlobalsRoutine('msx2_gameflow_apply_else_pre_text_globals', elsePreTextGlobalAssignments, 'ELSE branch pre-text Globals nodes')}
${generateGlobalsRoutine('msx2_gameflow_apply_else_pre_text_globals_after_transition', elseAfterPreTextTransitionGlobalAssignments, 'ELSE branch post-pre-text-transition Globals nodes')}
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
SCREEN5_PRESENTATION_VISIBLE_LINES EQU ${VISIBLE_HEIGHT}
SCREEN5_PRESENTATION_BYTES_PER_LINE EQU ${BYTES_PER_LINE}
SCREEN5_PRESENTATION_LAST_BYTE_COLUMN EQU ${BYTES_PER_LINE - 1}
SCREEN5_PRESENTATION_HALF_BYTES_PER_LINE EQU ${BYTES_PER_LINE / 2}
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
