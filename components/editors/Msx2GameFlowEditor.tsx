import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  Msx2GameFlowConnection,
  Msx2GameFlowControlsNode,
  Msx2GameFlowEndNode,
  Msx2GameFlowGraph,
  Msx2GameFlowGlobalsNode,
  Msx2GameFlowIfThenElseNode,
  Msx2GameFlowMusicNode,
  Msx2GameFlowNode,
  Msx2GameFlowPurpose,
  Msx2GameFlowScreen4ScreenNode,
  Msx2GameFlowScreen5PresentationNode,
  Msx2GameFlowTextScrollColorNode,
  Msx2GameFlowTextScrollNode,
  Msx2GameFlowSubMenuNode,
  Msx2GameFlowTextNode,
  Msx2GameFlowTransitionNode,
  Msx2GameFlowWorldLinkNode,
  Msx2Screen5PresentationConfig,
  ProjectAsset,
} from '../../types';
import type { MideasGlobalVariable } from '../../constants';
import { Button } from '../common/Button';
import { Panel } from '../common/Panel';
import { AssetPickerModal } from '../modals/AssetPickerModal';
import { ArrowsPointingOutIcon, PlusCircleIcon } from '../icons/MsxIcons';
import {
  drawMsx2Screen5PresentationPreview,
  unpackScreen5PresentationPixels,
  type Msx2Screen5PresentationHeight,
} from '../utils/msx2Screen5PresentationUtils';

const NODE_WIDTH = 168;
const NODE_HEIGHT = 76;

const MSX2_SCREEN5_TRANSITION_OPTIONS: Array<{ value: Msx2GameFlowTransitionNode['effect']; label: string }> = [
  { value: 'cls', label: 'CLS' },
  { value: 'fade_to_black', label: 'Fade to black' },
];

const MSX2_SCREEN4_TRANSITION_OPTIONS: Array<{ value: Msx2GameFlowTransitionNode['effect']; label: string }> = [
  ...MSX2_SCREEN5_TRANSITION_OPTIONS,
  { value: 'dissolve_pixels', label: 'Dissolve pixels' },
  { value: 'dissolve_chars', label: 'Dissolve chars' },
  { value: 'horizontal_lines', label: 'Horizontal lines' },
  { value: 'vertical_lines', label: 'Vertical lines' },
  { value: 'spiral', label: 'Spiral' },
  { value: 'diagonal_clear', label: 'Diagonal clear' },
  { value: 'diagonal_inverse', label: 'Diagonal inverse' },
  { value: 'checkerboard', label: 'Checkerboard' },
  { value: 'doors', label: 'Doors' },
  { value: 'center_curtain', label: 'Center curtain' },
  { value: 'venetian_blinds', label: 'Venetian blinds' },
  { value: 'radial_wipe', label: 'Radial wipe' },
  { value: 'fill_white_squares', label: '2x2 blocks' },
  { value: 'block4_shuffle', label: '4x4 block shuffle' },
  { value: 'zoom_box', label: 'Zoom box' },
  { value: 'raster_bars', label: 'Raster bars' },
  { value: 'raster_split_wipe', label: 'Raster split wipe' },
  { value: 'raster_scanlines', label: 'Raster scanlines' },
  { value: 'raster_palette_fade', label: 'Raster palette fade' },
  { value: 'raster_bands_down', label: 'Raster bands down' },
  { value: 'raster_bands_up', label: 'Raster bands up' },
  { value: 'raster_center_bands', label: 'Raster center bands' },
  { value: 'raster_wave_bands', label: 'Raster wave bands' },
];

const isScreen5PresentationHeight = (value: unknown): value is Msx2Screen5PresentationHeight =>
  value === 192 || value === 212;

const resolveScreen5PresentationPreviewData = (
  config: Msx2Screen5PresentationConfig | undefined
): { pixels: number[][]; palette: Msx2Screen5PresentationConfig['palette'] } | null => {
  if (!config) return null;
  const nested = config.data as (
    | (Msx2Screen5PresentationConfig['data'] & {
        height?: unknown;
        palette?: Msx2Screen5PresentationConfig['palette'];
      })
    | undefined
  );
  const height = isScreen5PresentationHeight(config.height)
    ? config.height
    : isScreen5PresentationHeight(nested?.height)
      ? nested.height
      : 212;
  const palette = config.palette || nested?.palette;
  if (!palette) return null;
  const pixels = config.pixels || nested?.pixels;
  if (pixels) return { pixels, palette };
  const packedBitmap = config.packedBitmap || nested?.packedBitmap || nested?.packedPixels;
  if (packedBitmap) {
    return { pixels: unpackScreen5PresentationPixels(packedBitmap, height), palette };
  }
  return null;
};

const MSX2_SCREEN5_TRANSITION_EFFECTS = new Set<Msx2GameFlowTransitionNode['effect']>(
  MSX2_SCREEN5_TRANSITION_OPTIONS.map(option => option.value)
);

const MSX2_SCREEN4_TRANSITION_EFFECTS = new Set<Msx2GameFlowTransitionNode['effect']>(
  MSX2_SCREEN4_TRANSITION_OPTIONS.map(option => option.value)
);

interface Msx2GameFlowEditorProps {
  gameFlowGraph: Msx2GameFlowGraph;
  onUpdate: (data: Partial<Msx2GameFlowGraph>) => void;
  allAssets: ProjectAsset[];
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
}

const getNodeLabel = (node: Msx2GameFlowNode, allAssets: ProjectAsset[]): string => {
  if (node.type === 'Start') return 'Start MSX2';
  if (node.type === 'End') return node.title || 'End';
  if (node.type === 'Waypoint') return 'Waypoint';
  if (node.type === 'Restart') return 'Restart ROM';
  if (node.type === 'Globals') return node.title || `${node.variables?.length || 0} global set`;
  if (node.type === 'Screen4Screen') {
    const asset = allAssets.find(a => a.id === node.screenAssetId && a.type === 'msx2screen');
    return asset?.name || 'SCREEN 4 Screen';
  }
  if (node.type === 'SubMenu') return node.title || 'SubMenu';
  if (node.type === 'Controls') return node.title || 'Controls';
  if (node.type === 'Text') return node.title || 'Text';
  if (node.type === 'TextScroll') return node.title || 'Text Scroll';
  if (node.type === 'TextScrollColor') return node.title || 'Text Scroll Color';
  if (node.type === 'WorldLink') {
    const asset = allAssets.find(a => a.id === node.worldAssetId && a.type === 'worldmap');
    return asset?.name || 'World Link';
  }
  if (node.type === 'IfThenElse') return `${node.variableName || 'var'} ${node.operator || '=='} ${node.compareValue || '0'}`;
  if (node.type === 'Music') {
    if (node.stop || node.autoPlay === false) return 'Stop Music';
    const asset = allAssets.find(a => a.id === node.trackAssetId && a.type === 'track');
    return asset?.name || 'Music';
  }
  if (node.type === 'Transition') {
    return MSX2_SCREEN4_TRANSITION_OPTIONS.find(option => option.value === node.effect)?.label || 'Transition';
  }
  const asset = allAssets.find(a => a.id === node.presentationAssetId && a.type === 'msx2presentation');
  return asset?.name || 'SCREEN 5 Presentation';
};

const getNodeColor = (node: Msx2GameFlowNode): string => {
  if (node.type === 'Start') return 'hsl(185, 62%, 32%)';
  if (node.type === 'Globals') return 'hsl(265, 42%, 36%)';
  if (node.type === 'Screen5Presentation') return 'hsl(168, 58%, 30%)';
  if (node.type === 'Screen4Screen') return 'hsl(198, 52%, 32%)';
  if (node.type === 'SubMenu') return 'hsl(215, 52%, 34%)';
  if (node.type === 'Controls') return 'hsl(185, 45%, 34%)';
  if (node.type === 'Text') return 'hsl(188, 46%, 34%)';
  if (node.type === 'TextScroll') return 'hsl(172, 46%, 31%)';
  if (node.type === 'TextScrollColor') return 'hsl(166, 52%, 30%)';
  if (node.type === 'WorldLink') return 'hsl(150, 48%, 30%)';
  if (node.type === 'Waypoint') return 'hsl(215, 34%, 35%)';
  if (node.type === 'IfThenElse') return 'hsl(28, 58%, 36%)';
  if (node.type === 'Music') return 'hsl(300, 38%, 36%)';
  if (node.type === 'Transition') return 'hsl(42, 58%, 35%)';
  if (node.type === 'Restart') return 'hsl(8, 58%, 36%)';
  return 'hsl(330, 42%, 34%)';
};

const makeConnection = (fromNodeId: string, toNodeId: string, sourceId?: string): Msx2GameFlowConnection => ({
  id: `msx2_gfc_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
  from: { nodeId: fromNodeId, sourceId },
  to: { nodeId: toNodeId },
});

const getNextNode = (
  node: Msx2GameFlowNode | undefined,
  nodes: Msx2GameFlowNode[],
  connections: Msx2GameFlowConnection[]
): Msx2GameFlowNode | undefined => {
  if (!node) return undefined;
  const nextConnection = connections.find(connection => connection.from.nodeId === node.id);
  return nextConnection ? nodes.find(candidate => candidate.id === nextConnection.to.nodeId) : undefined;
};

const getNextExportNode = (
  node: Msx2GameFlowNode | undefined,
  nodes: Msx2GameFlowNode[],
  connections: Msx2GameFlowConnection[]
): Msx2GameFlowNode | undefined => {
  let current = getNextNode(node, nodes, connections);
  const visited = new Set<string>();
  while ((current?.type === 'Waypoint' || current?.type === 'Globals') && !visited.has(current.id)) {
    visited.add(current.id);
    current = getNextNode(current, nodes, connections);
  }
  return current;
};

const getBranchExportNode = (
  node: Msx2GameFlowIfThenElseNode | undefined,
  sourceId: 'then' | 'else',
  nodes: Msx2GameFlowNode[],
  connections: Msx2GameFlowConnection[]
): Msx2GameFlowNode | undefined => {
  if (!node) return undefined;
  const branchConnection = connections.find(connection => connection.from.nodeId === node.id && connection.from.sourceId === sourceId);
  let current = branchConnection ? nodes.find(candidate => candidate.id === branchConnection.to.nodeId) : undefined;
  const visited = new Set<string>();
  while ((current?.type === 'Waypoint' || current?.type === 'Globals') && !visited.has(current.id)) {
    visited.add(current.id);
    current = getNextNode(current, nodes, connections);
  }
  return current;
};

const flowHasAnyCycle = (nodes: Msx2GameFlowNode[], connections: Msx2GameFlowConnection[]): boolean => {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const nodeIds = new Set(nodes.map(node => node.id));

  const visit = (nodeId: string): boolean => {
    if (visiting.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    visiting.add(nodeId);
    for (const connection of connections.filter(candidate => candidate.from.nodeId === nodeId)) {
      const nextId = connection.to.nodeId;
      if (nodeIds.has(nextId) && visit(nextId)) return true;
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
  };

  return nodes.some(node => visit(node.id));
};

export const Msx2GameFlowEditor: React.FC<Msx2GameFlowEditorProps> = ({
  gameFlowGraph,
  onUpdate,
  allAssets,
  selectedNodeId,
  setSelectedNodeId,
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [linkingState, setLinkingState] = useState<{ fromNodeId: string; sourceId?: string } | null>(null);
  const [isCutMode, setIsCutMode] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [draggingState, setDraggingState] = useState<{ nodeId: string; offset: { x: number; y: number } } | null>(null);
  const [draggingWaypoint, setDraggingWaypoint] = useState<{ connectionId: string; waypointIndex: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [viewBox, setViewBox] = useState('0 0 1200 520');
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const nodes = gameFlowGraph.nodes || [];
  const connections = gameFlowGraph.connections || [];
  const flowPurpose = gameFlowGraph.purpose || 'screen5-presentation';
  const isScreen5PresentationFlow = flowPurpose === 'screen5-presentation';
  const selectedNode = nodes.find(node => node.id === selectedNodeId) || null;
  const selectedPresentationNode = selectedNode?.type === 'Screen5Presentation'
    ? selectedNode as Msx2GameFlowScreen5PresentationNode
    : null;
  const selectedScreen4ScreenNode = selectedNode?.type === 'Screen4Screen'
    ? selectedNode as Msx2GameFlowScreen4ScreenNode
    : null;
  const selectedGlobalsNode = selectedNode?.type === 'Globals'
    ? selectedNode as Msx2GameFlowGlobalsNode
    : null;
  const selectedSubMenuNode = selectedNode?.type === 'SubMenu'
    ? selectedNode as Msx2GameFlowSubMenuNode
    : null;
  const selectedControlsNode = selectedNode?.type === 'Controls'
    ? selectedNode as Msx2GameFlowControlsNode
    : null;
  const selectedTextNode = selectedNode?.type === 'Text'
    ? selectedNode as Msx2GameFlowTextNode
    : null;
  const selectedTextScrollNode = selectedNode?.type === 'TextScroll'
    ? selectedNode as Msx2GameFlowTextScrollNode
    : null;
  const selectedTextScrollColorNode = selectedNode?.type === 'TextScrollColor'
    ? selectedNode as Msx2GameFlowTextScrollColorNode
    : null;
  const selectedEndNode = selectedNode?.type === 'End'
    ? selectedNode as Msx2GameFlowEndNode
    : null;
  const selectedWorldLinkNode = selectedNode?.type === 'WorldLink'
    ? selectedNode as Msx2GameFlowWorldLinkNode
    : null;
  const selectedIfThenElseNode = selectedNode?.type === 'IfThenElse'
    ? selectedNode as Msx2GameFlowIfThenElseNode
    : null;
  const selectedMusicNode = selectedNode?.type === 'Music'
    ? selectedNode as Msx2GameFlowMusicNode
    : null;
  const transitionOptions = isScreen5PresentationFlow
    ? MSX2_SCREEN5_TRANSITION_OPTIONS
    : MSX2_SCREEN4_TRANSITION_OPTIONS;
  const firstPresentationNode = nodes.find(node => node.type === 'Screen5Presentation') as Msx2GameFlowScreen5PresentationNode | undefined;
  const previewPresentationNode = selectedPresentationNode || firstPresentationNode || null;

  const presentationAssets = useMemo(
    () => allAssets.filter(asset => asset.type === 'msx2presentation'),
    [allAssets]
  );
  const globalVariablesAssets = useMemo(
    () => allAssets.filter(asset => asset.type === 'globalvariables'),
    [allAssets]
  );
  const screen4Assets = useMemo(
    () => allAssets.filter(asset => asset.type === 'msx2screen'),
    [allAssets]
  );
  const worldAssets = useMemo(
    () => allAssets.filter(asset => asset.type === 'worldmap'),
    [allAssets]
  );
  const trackAssets = useMemo(
    () => allAssets.filter(asset => asset.type === 'track'),
    [allAssets]
  );
  const selectedGlobalsAssetVariables = useMemo(() => {
    const selectedAssetId = selectedGlobalsNode?.globalVariablesAssetId || globalVariablesAssets[0]?.id;
    const selectedAsset = selectedAssetId
      ? globalVariablesAssets.find(asset => asset.id === selectedAssetId)
      : undefined;
    return (((selectedAsset?.data as any)?.customVariables || []) as MideasGlobalVariable[]);
  }, [globalVariablesAssets, selectedGlobalsNode?.globalVariablesAssetId]);

  const activePresentationAsset = useMemo(() => {
    const selectedAssetId = previewPresentationNode?.presentationAssetId;
    const selectedAsset = selectedAssetId
      ? allAssets.find(asset => asset.id === selectedAssetId && asset.type === 'msx2presentation')
      : undefined;
    return selectedAssetId ? selectedAsset : presentationAssets[0];
  }, [allAssets, presentationAssets, previewPresentationNode?.presentationAssetId]);
  const hasAssignedPresentation = !!previewPresentationNode?.presentationAssetId;
  const previewLabel = hasAssignedPresentation
    ? `Assigned SCREEN 5: ${activePresentationAsset?.name || 'Missing asset'}`
    : activePresentationAsset
      ? `Previewing first available SCREEN 5: ${activePresentationAsset.name}`
      : 'No SCREEN 5 asset assigned';
  const flowPath = useMemo(() => {
    const startNode = nodes.find(node => node.id === gameFlowGraph.startNodeId) || nodes.find(node => node.type === 'Start');
    if (!startNode) return [];
    const path: string[] = [];
    const visited = new Set<string>();
    let current: Msx2GameFlowNode | undefined = startNode;
    while (current && !visited.has(current.id) && path.length <= nodes.length) {
      visited.add(current.id);
      path.push(`${current.type}: ${getNodeLabel(current, allAssets)}`);
      current = getNextNode(current, nodes, connections);
    }
    if (current && visited.has(current.id)) {
      path.push(`Cycle: ${current.type}`);
    }
    return path;
  }, [allAssets, connections, gameFlowGraph.startNodeId, nodes]);
  const flowIssues = useMemo(() => {
    const issues: string[] = [];
    const nodeIds = new Set(nodes.map(node => node.id));
    const startNode = nodes.find(node => node.id === gameFlowGraph.startNodeId) || nodes.find(node => node.type === 'Start');
    if (!isScreen5PresentationFlow) {
      if (nodes.some(node => node.type === 'Screen5Presentation')) {
        issues.push('SCREEN 4 runtime flows should not include SCREEN 5 Presentation nodes.');
      }
      for (const node of nodes) {
        if (node.type === 'Screen4Screen') {
          if (!node.screenAssetId || !screen4Assets.some(asset => asset.id === node.screenAssetId)) {
            issues.push('Screen4Screen node must select a valid SCREEN 4 room.');
          }
        } else if (node.type === 'SubMenu') {
          if (!node.title?.trim()) issues.push('SubMenu node must include a title.');
          if (!Array.isArray(node.options) || node.options.length === 0) {
            issues.push('SubMenu node must include at least one option.');
          }
          const optionIds = new Set((node.options || []).map(option => option.id));
          for (const option of node.options || []) {
            if (!option.text?.trim()) issues.push('SubMenu options must include text.');
            const optionConnections = connections.filter(connection => connection.from.nodeId === node.id && connection.from.sourceId === option.id);
            if (optionConnections.length === 0) {
              issues.push(`SubMenu option "${option.text || option.id}" needs an outgoing connection.`);
            } else if (optionConnections.length > 1) {
              issues.push(`SubMenu option "${option.text || option.id}" has more than one outgoing connection.`);
            }
          }
          for (const connection of connections.filter(connection => connection.from.nodeId === node.id)) {
            if (!connection.from.sourceId || !optionIds.has(connection.from.sourceId)) {
              issues.push(`SubMenu has an outgoing connection for an unknown option "${connection.from.sourceId || 'default'}".`);
            }
          }
        } else if (node.type === 'Controls') {
          if (!node.title?.trim()) issues.push('Controls node must include a title.');
        } else if (node.type === 'Text') {
          if (!node.message?.trim()) issues.push('Text node must include a message.');
        } else if (node.type === 'TextScroll' || node.type === 'TextScrollColor') {
          if (!node.text?.trim()) issues.push(`${node.type} node must include text.`);
        } else if (node.type === 'WorldLink') {
          if (!node.worldAssetId || !worldAssets.some(asset => asset.id === node.worldAssetId)) {
            issues.push('WorldLink node must select a valid World Map asset.');
          }
        } else if (node.type === 'IfThenElse') {
          const hasThen = connections.some(connection => connection.from.nodeId === node.id && connection.from.sourceId === 'then');
          const hasElse = connections.some(connection => connection.from.nodeId === node.id && connection.from.sourceId === 'else');
          if (!node.variableName?.trim()) issues.push('IfThenElse must select a global variable.');
          if (!hasThen || !hasElse) issues.push('IfThenElse needs both THEN and ELSE outgoing connections.');
        } else if (node.type === 'Transition') {
          if (!MSX2_SCREEN4_TRANSITION_EFFECTS.has(node.effect)) {
            issues.push(`Transition effect "${node.effect}" is not supported by SCREEN 4 runtime.`);
          }
        } else if (node.type === 'Music') {
          if (node.stop !== true && node.autoPlay !== false) {
            issues.push('Music track playback is not wired for MSX2 SCREEN 4 export yet; use Stop PSG on entry.');
          }
        } else if (node.type !== 'Start' && node.type !== 'Waypoint' && node.type !== 'Globals' && node.type !== 'Transition' && node.type !== 'Restart' && node.type !== 'End') {
          issues.push(`${node.type} is not supported by the SCREEN 4 runtime purpose yet.`);
        }
      }
      if (!nodes.some(node => node.type === 'SubMenu')) {
        issues.push('SCREEN 4 runtime GameFlow is ready for SubMenu nodes.');
      }
    } else {
      const firstScreen5 = nodes.find(node => node.type === 'Screen5Presentation') as Msx2GameFlowScreen5PresentationNode | undefined;
      const presentationNode = startNode ? getNextExportNode(startNode, nodes, connections) : undefined;
      const screen5Node = presentationNode?.type === 'Screen5Presentation'
        ? presentationNode as Msx2GameFlowScreen5PresentationNode
        : firstScreen5;
      const afterScreen5 = getNextExportNode(screen5Node, nodes, connections);
      const afterText = afterScreen5?.type === 'Text'
        ? getNextExportNode(afterScreen5, nodes, connections)
        : undefined;
      const terminalNode = afterScreen5?.type === 'Text' ? afterText : afterScreen5;
      const afterTransition = terminalNode?.type === 'Transition'
        ? getNextExportNode(terminalNode, nodes, connections)
        : undefined;
      const thenNode = afterScreen5?.type === 'IfThenElse'
        ? getBranchExportNode(afterScreen5 as Msx2GameFlowIfThenElseNode, 'then', nodes, connections)
        : undefined;
      const elseNode = afterScreen5?.type === 'IfThenElse'
        ? getBranchExportNode(afterScreen5 as Msx2GameFlowIfThenElseNode, 'else', nodes, connections)
        : undefined;

      if (!startNode) {
        issues.push('Missing Start node.');
      } else if (presentationNode?.type !== 'Screen5Presentation') {
        issues.push('Start should reach a SCREEN 5 Presentation node through optional Waypoint/Globals nodes.');
      }
      if (!screen5Node) {
        issues.push('Missing SCREEN 5 Presentation node.');
      } else if (!screen5Node.presentationAssetId || !presentationAssets.some(asset => asset.id === screen5Node.presentationAssetId)) {
        issues.push('SCREEN 5 node has no valid presentation asset.');
      }
      if (screen5Node && !afterScreen5) {
        issues.push('SCREEN 5 node should continue to Text, Transition, Restart, or End.');
      }
      if (afterScreen5 && afterScreen5.type !== 'Text' && afterScreen5.type !== 'IfThenElse' && afterScreen5.type !== 'Transition' && afterScreen5.type !== 'Restart' && afterScreen5.type !== 'End') {
        issues.push('SCREEN 5 node can only continue to Text, IfThenElse, Transition, Restart, or End in this backend.');
      }
      if (afterScreen5?.type === 'Text') {
        if (!afterScreen5.message?.trim()) issues.push('Text node must include a message.');
        if (afterText?.type !== 'Transition' && afterText?.type !== 'Restart' && afterText?.type !== 'End') {
          issues.push('Text node should continue to Transition, Restart, or End.');
        }
      }
      if (terminalNode?.type === 'Transition' && afterTransition?.type !== 'End' && afterTransition?.type !== 'Restart') {
        issues.push('Terminal Transition should continue to Restart or End.');
      }
      if (terminalNode?.type === 'Transition' && !MSX2_SCREEN5_TRANSITION_EFFECTS.has(terminalNode.effect)) {
        issues.push(`SCREEN 5 terminal Transition only supports CLS or Fade to black; "${terminalNode.effect}" is SCREEN 4-only.`);
      }
      if (afterScreen5?.type === 'IfThenElse') {
        if (!afterScreen5.variableName?.trim()) {
          issues.push('IfThenElse must select a global variable.');
        }
        if (!thenNode || !elseNode) {
          issues.push('IfThenElse must have THEN and ELSE branches.');
        }
        for (const [label, branchNode] of [['THEN', thenNode], ['ELSE', elseNode]] as const) {
          const afterBranchText = branchNode?.type === 'Text'
            ? getNextExportNode(branchNode, nodes, connections)
            : undefined;
          const branchTerminalNode = branchNode?.type === 'Text' ? afterBranchText : branchNode;
          if (branchNode?.type === 'Text' && !branchNode.message?.trim()) {
            issues.push(`IfThenElse ${label} Text node must include a message.`);
          }
          if (branchNode?.type === 'Text' && afterBranchText?.type !== 'Transition' && afterBranchText?.type !== 'Restart' && afterBranchText?.type !== 'End') {
            issues.push(`IfThenElse ${label} Text node should continue to Transition, Restart, or End.`);
          }
          if (branchNode && branchNode.type !== 'Text' && branchNode.type !== 'Transition' && branchNode.type !== 'Restart' && branchNode.type !== 'End') {
            issues.push(`IfThenElse ${label} branch can only continue to Text, Transition, Restart, or End.`);
          }
          const afterBranchTransition = branchTerminalNode?.type === 'Transition'
            ? getNextExportNode(branchTerminalNode, nodes, connections)
            : undefined;
          if (branchTerminalNode?.type === 'Transition' && afterBranchTransition?.type !== 'End' && afterBranchTransition?.type !== 'Restart') {
            issues.push(`IfThenElse ${label} terminal Transition should continue to Restart or End.`);
          }
          if (branchTerminalNode?.type === 'Transition' && !MSX2_SCREEN5_TRANSITION_EFFECTS.has(branchTerminalNode.effect)) {
            issues.push(`IfThenElse ${label} terminal Transition uses "${branchTerminalNode.effect}", which is SCREEN 4-only.`);
          }
        }
      }
    }
    if (!startNode) {
      issues.push('Missing Start node.');
    }
    const visited = new Set<string>();
    let current = startNode;
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      current = getNextNode(current, nodes, connections);
    }
    if (current && visited.has(current.id)) {
      issues.push('Export path contains a cycle.');
    }
    if (flowHasAnyCycle(nodes, connections)) {
      issues.push('Flow contains a cycle.');
    }
    for (const connection of connections) {
      if (!nodeIds.has(connection.from.nodeId) || !nodeIds.has(connection.to.nodeId)) {
        issues.push('Flow contains a connection to a missing node.');
        break;
      }
    }
    for (const node of nodes) {
      const outgoingCount = connections.filter(connection => connection.from.nodeId === node.id).length;
      const incomingCount = connections.filter(connection => connection.to.nodeId === node.id).length;
      if ((node.type === 'End' || node.type === 'Restart') && outgoingCount > 0) {
        issues.push(`${node.type} nodes do not support outgoing connections.`);
      }
      if (node.type !== 'Start' && incomingCount === 0 && outgoingCount === 0) {
        issues.push(`Orphaned node: ${node.type}.`);
      }
      if (node.type === 'End' || node.type === 'Restart') continue;
      if (node.type === 'SubMenu') continue;
      if (node.type === 'IfThenElse') {
        const hasThen = connections.some(connection => connection.from.nodeId === node.id && connection.from.sourceId === 'then');
        const hasElse = connections.some(connection => connection.from.nodeId === node.id && connection.from.sourceId === 'else');
        if (!node.variableName?.trim()) issues.push('IfThenElse must select a global variable.');
        if (!hasThen || !hasElse) issues.push('IfThenElse needs both THEN and ELSE outgoing connections.');
        if (outgoingCount > 2) issues.push('IfThenElse has more than two outgoing connections.');
        continue;
      }
      if (node.type === 'Text' && !node.message?.trim()) {
        issues.push('Text node must include a message.');
      }
      if ((node.type === 'TextScroll' || node.type === 'TextScrollColor') && !node.text?.trim()) {
        issues.push(`${node.type} node must include text.`);
      }
      if (outgoingCount > 1) {
        issues.push(`${node.type} has more than one outgoing connection.`);
      }
    }

    return Array.from(new Set(issues));
  }, [connections, gameFlowGraph.startNodeId, isScreen5PresentationFlow, nodes, presentationAssets, screen4Assets, worldAssets]);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    const config = activePresentationAsset?.data as Msx2Screen5PresentationConfig | undefined;
    if (!canvas) return;
    const preview = resolveScreen5PresentationPreviewData(config);
    if (!preview) {
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    drawMsx2Screen5PresentationPreview(canvas, preview.pixels, preview.palette, 1);
  }, [activePresentationAsset]);

  const updateNodes = (nextNodes: Msx2GameFlowNode[]) => onUpdate({ nodes: nextNodes });

  const updateFlowPurpose = (purpose: Msx2GameFlowPurpose) => {
    const nextNodes = purpose === 'screen5-presentation'
      ? nodes.map(node =>
          node.type === 'Transition' && !MSX2_SCREEN5_TRANSITION_EFFECTS.has(node.effect)
            ? { ...node, effect: 'fade_to_black' as const }
            : node
        )
      : nodes;
    onUpdate({ purpose, nodes: nextNodes });
  };

  const addNode = (type: 'Globals' | 'Screen5Presentation' | 'Screen4Screen' | 'SubMenu' | 'Controls' | 'Text' | 'TextScroll' | 'TextScrollColor' | 'WorldLink' | 'Waypoint' | 'IfThenElse' | 'Music' | 'Transition' | 'Restart' | 'End') => {
    const previousNode = selectedNode || nodes[nodes.length - 1];
    const x = previousNode ? previousNode.position.x + 230 : 60;
    const y = previousNode ? previousNode.position.y : 80;
    const id = `msx2_gf_${type.toLowerCase()}_${Date.now()}`;
    const newNode: Msx2GameFlowNode =
      type === 'Globals'
        ? {
            id,
            type,
            position: { x, y },
            title: 'Set globals',
            globalVariablesAssetId: globalVariablesAssets[0]?.id,
            variables: [],
          }
        : type === 'IfThenElse'
          ? {
              id,
              type,
              position: { x, y },
              variableName: selectedGlobalsAssetVariables[0]?.name || 'Goal',
              compareValue: '0',
              operator: '==',
            }
        : type === 'Text'
          ? {
              id,
              type,
              position: { x, y },
              title: 'Text',
              message: 'PRESS KEY TO CONTINUE',
              waitForKey: true,
              waitFrames: 0,
            }
        : type === 'TextScroll'
          ? {
              id,
              type,
              position: { x, y },
              title: 'Story',
              text: 'THE INVASION HAS BEGUN. PREPARE YOUR SHIP AND DEFEND THE COLONY.',
              backgroundScreenAssetId: screen4Assets[0]?.id,
              waitForKey: true,
              waitFrames: 0,
            }
        : type === 'TextScrollColor'
          ? {
              id,
              type,
              position: { x, y },
              title: 'Color Story',
              text: 'SELECT YOUR WEAPON AND PREPARE FOR THE INVASION.',
              backgroundScreenAssetId: screen4Assets[0]?.id,
              textColorIndex: 15,
              backgroundColorIndex: 1,
              waitForKey: true,
              waitFrames: 0,
            }
        : type === 'Music'
          ? {
              id,
              type,
              stop: true,
              trackAssetId: undefined,
              loop: true,
              autoPlay: false,
              position: { x, y },
            }
        : type === 'Screen4Screen'
          ? {
              id,
              type,
              position: { x, y },
              screenAssetId: screen4Assets[0]?.id,
              waitForKey: true,
              waitFrames: 0,
            }
        : type === 'SubMenu'
          ? {
              id,
              type,
              position: { x, y },
              title: 'Main Menu',
              options: [
                { id: `option_start_${Date.now()}`, text: 'START' },
                { id: `option_options_${Date.now()}`, text: 'OPTIONS' },
              ],
              backgroundScreenAssetId: screen4Assets[0]?.id,
            }
        : type === 'WorldLink'
          ? {
              id,
              type,
              position: { x, y },
              worldAssetId: worldAssets[0]?.id || '',
            }
        : type === 'Controls'
          ? {
              id,
              type,
              position: { x, y },
              title: 'Controls',
              keyboardButton1: 'SPC',
              keyboardButton2: 'N',
              jumpActionLabel: 'JUMP',
              jumpActionButton: 'button1',
              actionLabel: 'FIRE',
              actionButton: 'button2',
              backgroundScreenAssetId: screen4Assets[0]?.id,
              waitForKey: true,
              waitFrames: 0,
            }
        : type === 'Screen5Presentation'
        ? {
            id,
            type,
            position: { x, y },
            presentationAssetId: presentationAssets[0]?.id,
            waitForKey: true,
            waitFrames: 0,
          }
        : type === 'Transition'
          ? { id, type, position: { x, y }, effect: 'cls', durationFrames: 30 }
          : type === 'Restart'
            ? { id, type, position: { x, y }, title: 'Restart', message: '' }
          : type === 'End'
            ? { id, type, position: { x, y }, title: 'End', message: 'THANKS FOR PLAYING', waitForKey: true, waitFrames: 0 }
          : { id, type, position: { x, y } };

    const nextConnections = previousNode && previousNode.type !== 'End' && previousNode.type !== 'Restart' && previousNode.type !== 'IfThenElse'
      ? [...connections.filter(conn => conn.from.nodeId !== previousNode.id), makeConnection(previousNode.id, id)]
      : connections;
    onUpdate({ nodes: [...nodes, newNode], connections: nextConnections });
    setSelectedNodeId(id);
  };

  const applyIntroTemplate = () => {
    const startNode = nodes.find(node => node.type === 'Start') || nodes[0];
    if (!startNode) return;
    const presentationNodeId = `msx2_gf_screen5_${Date.now()}`;
    const transitionNodeId = `msx2_gf_transition_${Date.now()}`;
    const endNodeId = `msx2_gf_end_${Date.now()}`;
    const presentationNode: Msx2GameFlowScreen5PresentationNode = {
      id: presentationNodeId,
      type: 'Screen5Presentation',
      position: { x: startNode.position.x + 230, y: startNode.position.y },
      presentationAssetId: presentationAssets[0]?.id,
      waitForKey: true,
      waitFrames: 0,
    };
    const transitionNode: Msx2GameFlowNode = {
      id: transitionNodeId,
      type: 'Transition',
      position: { x: startNode.position.x + 460, y: startNode.position.y },
      effect: 'fade_to_black',
      durationFrames: 30,
    };
    const endNode: Msx2GameFlowNode = {
      id: endNodeId,
      type: 'End',
      position: { x: startNode.position.x + 690, y: startNode.position.y },
    };
    onUpdate({
      nodes: [startNode, presentationNode, transitionNode, endNode],
      connections: [
        makeConnection(startNode.id, presentationNodeId),
        makeConnection(presentationNodeId, transitionNodeId),
        makeConnection(transitionNodeId, endNodeId),
      ],
      startNodeId: startNode.id,
      purpose: 'screen5-presentation',
    });
    setSelectedNodeId(presentationNodeId);
  };

  const applyScreen4RuntimeTemplate = () => {
    const startNode = nodes.find(node => node.type === 'Start') || nodes[0];
    if (!startNode) return;
    const subMenuNodeId = `msx2_gf_screen4_submenu_${Date.now()}`;
    const worldNodeId = `msx2_gf_screen4_world_${Date.now()}`;
    const endNodeId = `msx2_gf_screen4_end_${Date.now()}`;
    const startOptionId = `option_start_${Date.now()}`;
    const quitOptionId = `option_quit_${Date.now()}`;
    const subMenuNode: Msx2GameFlowNode = {
      id: subMenuNodeId,
      type: 'SubMenu',
      position: { x: startNode.position.x + 230, y: startNode.position.y },
      title: 'Main Menu',
      options: [
        { id: startOptionId, text: 'START' },
        { id: quitOptionId, text: 'QUIT' },
      ],
      backgroundScreenAssetId: screen4Assets[0]?.id,
    };
    const worldNode: Msx2GameFlowNode = {
      id: worldNodeId,
      type: 'WorldLink',
      position: { x: startNode.position.x + 460, y: startNode.position.y },
      worldAssetId: worldAssets[0]?.id || '',
    };
    const endNode: Msx2GameFlowNode = {
      id: endNodeId,
      type: 'End',
      position: { x: startNode.position.x + 690, y: startNode.position.y + 100 },
    };
    onUpdate({
      purpose: 'screen4-runtime',
      nodes: [startNode, subMenuNode, worldNode, endNode],
      connections: [
        makeConnection(startNode.id, subMenuNodeId),
        makeConnection(subMenuNodeId, worldNodeId, startOptionId),
        makeConnection(subMenuNodeId, endNodeId, quitOptionId),
      ],
      startNodeId: startNode.id,
    });
    setSelectedNodeId(subMenuNodeId);
  };

  const selectPreviewNode = () => {
    if (previewPresentationNode) {
      setSelectedNodeId(previewPresentationNode.id);
      return;
    }
    applyIntroTemplate();
  };

  const updateSelectedPresentation = (presentationAssetId: string) => {
    if (!selectedPresentationNode) return;
    const selectedAsset = allAssets.find(asset => asset.id === presentationAssetId && asset.type === 'msx2presentation');
    if (!selectedAsset) return;
    updateNodes(nodes.map(node =>
      node.id === selectedPresentationNode.id
        ? { ...node, presentationAssetId: selectedAsset.id }
        : node
    ));
  };

  const updateSelectedPresentationRuntime = (updates: Partial<Pick<Msx2GameFlowScreen5PresentationNode, 'waitForKey' | 'waitFrames'>>) => {
    if (!selectedPresentationNode) return;
    updateNodes(nodes.map(node =>
      node.id === selectedPresentationNode.id && node.type === 'Screen5Presentation'
        ? {
            ...node,
            ...updates,
            waitFrames: updates.waitFrames !== undefined
              ? Math.max(0, Math.min(255, Math.trunc(updates.waitFrames) || 0))
              : node.waitFrames,
          }
        : node
    ));
  };

  const updateSelectedScreen4Screen = (updates: Partial<Msx2GameFlowScreen4ScreenNode>) => {
    if (!selectedScreen4ScreenNode) return;
    updateNodes(nodes.map(node =>
      node.id === selectedScreen4ScreenNode.id && node.type === 'Screen4Screen'
        ? {
            ...node,
            ...updates,
            waitFrames: updates.waitFrames !== undefined
              ? Math.max(0, Math.min(255, Math.trunc(updates.waitFrames) || 0))
              : node.waitFrames,
          }
        : node
    ));
  };

  const updateSelectedTransition = (effect: Msx2GameFlowTransitionNode['effect']) => {
    if (selectedNode?.type !== 'Transition') return;
    updateNodes(nodes.map(node =>
      node.id === selectedNode.id && node.type === 'Transition'
        ? { ...node, effect }
        : node
    ));
  };

  const updateSelectedTransitionDuration = (durationFrames: number) => {
    if (selectedNode?.type !== 'Transition') return;
    updateNodes(nodes.map(node =>
      node.id === selectedNode.id && node.type === 'Transition'
        ? { ...node, durationFrames: Math.max(0, Math.min(255, Math.trunc(durationFrames) || 0)) }
        : node
    ));
  };

  const updateSelectedGlobals = (updates: Partial<Msx2GameFlowGlobalsNode>) => {
    if (!selectedGlobalsNode) return;
    updateNodes(nodes.map(node =>
      node.id === selectedGlobalsNode.id && node.type === 'Globals'
        ? { ...node, ...updates }
        : node
    ));
  };

  const getDefaultGlobalValue = (variable?: MideasGlobalVariable): string => {
    if (!variable) return '0';
    if (variable.type === 'boolean') return 'false';
    const firstValue = variable.values?.[0]?.value;
    return firstValue !== undefined && firstValue !== 'number' ? `${firstValue}` : '0';
  };

  const addGlobalAssignment = () => {
    if (!selectedGlobalsNode) return;
    const defaultVariable = selectedGlobalsAssetVariables[0];
    updateSelectedGlobals({
      variables: [
        ...(selectedGlobalsNode.variables || []),
        {
          id: `msx2_gf_var_${Date.now()}`,
          name: defaultVariable?.name || 'NewVar',
          value: getDefaultGlobalValue(defaultVariable),
        },
      ],
    });
  };

  const updateGlobalAssignment = (id: string, updates: { name?: string; value?: string }) => {
    if (!selectedGlobalsNode) return;
    updateSelectedGlobals({
      variables: (selectedGlobalsNode.variables || []).map(variable =>
        variable.id === id
          ? { ...variable, ...updates }
          : variable
      ),
    });
  };

  const deleteGlobalAssignment = (id: string) => {
    if (!selectedGlobalsNode) return;
    updateSelectedGlobals({
      variables: (selectedGlobalsNode.variables || []).filter(variable => variable.id !== id),
    });
  };

  const updateSelectedIfThenElse = (updates: Partial<Msx2GameFlowIfThenElseNode>) => {
    if (!selectedIfThenElseNode) return;
    updateNodes(nodes.map(node =>
      node.id === selectedIfThenElseNode.id && node.type === 'IfThenElse'
        ? { ...node, ...updates }
        : node
    ));
  };

  const updateSelectedMusic = (updates: Partial<Msx2GameFlowMusicNode>) => {
    if (!selectedMusicNode) return;
    updateNodes(nodes.map(node =>
      node.id === selectedMusicNode.id && node.type === 'Music'
        ? { ...node, ...updates }
        : node
    ));
  };

  const updateSelectedText = (updates: Partial<Msx2GameFlowTextNode>) => {
    if (!selectedTextNode) return;
    updateNodes(nodes.map(node =>
      node.id === selectedTextNode.id && node.type === 'Text'
        ? {
            ...node,
            ...updates,
            waitFrames: updates.waitFrames !== undefined
              ? Math.max(0, Math.min(255, Math.trunc(updates.waitFrames) || 0))
              : node.waitFrames,
          }
        : node
    ));
  };

  const updateSelectedTextScroll = (updates: Partial<Msx2GameFlowTextScrollNode>) => {
    if (!selectedTextScrollNode) return;
    updateNodes(nodes.map(node =>
      node.id === selectedTextScrollNode.id && node.type === 'TextScroll'
        ? {
            ...node,
            ...updates,
            waitFrames: updates.waitFrames !== undefined
              ? Math.max(0, Math.min(255, Math.trunc(updates.waitFrames) || 0))
              : node.waitFrames,
          }
        : node
    ));
  };

  const updateSelectedTextScrollColor = (updates: Partial<Msx2GameFlowTextScrollColorNode>) => {
    if (!selectedTextScrollColorNode) return;
    updateNodes(nodes.map(node =>
      node.id === selectedTextScrollColorNode.id && node.type === 'TextScrollColor'
        ? {
            ...node,
            ...updates,
            textColorIndex: updates.textColorIndex !== undefined
              ? Math.max(1, Math.min(15, Math.trunc(updates.textColorIndex) || 15))
              : node.textColorIndex,
            backgroundColorIndex: updates.backgroundColorIndex !== undefined
              ? Math.max(0, Math.min(15, Math.trunc(updates.backgroundColorIndex) || 0))
              : node.backgroundColorIndex,
            waitFrames: updates.waitFrames !== undefined
              ? Math.max(0, Math.min(255, Math.trunc(updates.waitFrames) || 0))
              : node.waitFrames,
          }
        : node
    ));
  };

  const updateSelectedControls = (updates: Partial<Msx2GameFlowControlsNode>) => {
    if (!selectedControlsNode) return;
    updateNodes(nodes.map(node =>
      node.id === selectedControlsNode.id && node.type === 'Controls'
        ? {
            ...node,
            ...updates,
            waitFrames: updates.waitFrames !== undefined
              ? Math.max(0, Math.min(255, Math.trunc(updates.waitFrames) || 0))
              : node.waitFrames,
          }
        : node
    ));
  };

  const updateSelectedEnd = (updates: Partial<Msx2GameFlowEndNode>) => {
    if (!selectedEndNode) return;
    updateNodes(nodes.map(node =>
      node.id === selectedEndNode.id && node.type === 'End'
        ? {
            ...node,
            ...updates,
            waitFrames: updates.waitFrames !== undefined
              ? Math.max(0, Math.min(255, Math.trunc(updates.waitFrames) || 0))
              : node.waitFrames,
          }
        : node
    ));
  };

  const updateSelectedWorldLink = (updates: Partial<Msx2GameFlowWorldLinkNode>) => {
    if (!selectedWorldLinkNode) return;
    updateNodes(nodes.map(node =>
      node.id === selectedWorldLinkNode.id && node.type === 'WorldLink'
        ? { ...node, ...updates }
        : node
    ));
  };

  const updateSelectedSubMenu = (updates: Partial<Msx2GameFlowSubMenuNode>) => {
    if (!selectedSubMenuNode) return;
    updateNodes(nodes.map(node =>
      node.id === selectedSubMenuNode.id && node.type === 'SubMenu'
        ? { ...node, ...updates }
        : node
    ));
  };

  const addSubMenuOption = () => {
    if (!selectedSubMenuNode) return;
    const optionId = `option_${Date.now()}`;
    updateSelectedSubMenu({
      options: [
        ...(selectedSubMenuNode.options || []),
        { id: optionId, text: `OPTION ${(selectedSubMenuNode.options || []).length + 1}` },
      ].slice(0, 6),
    });
  };

  const updateSubMenuOption = (id: string, text: string) => {
    if (!selectedSubMenuNode) return;
    updateSelectedSubMenu({
      options: (selectedSubMenuNode.options || []).map(option => (
        option.id === id ? { ...option, text } : option
      )),
    });
  };

  const deleteSubMenuOption = (id: string) => {
    if (!selectedSubMenuNode) return;
    onUpdate({
      nodes: nodes.map(node =>
        node.id === selectedSubMenuNode.id && node.type === 'SubMenu'
          ? { ...node, options: (node.options || []).filter(option => option.id !== id) }
          : node
      ),
      connections: connections.filter(connection => !(connection.from.nodeId === selectedSubMenuNode.id && connection.from.sourceId === id)),
    });
  };

  const selectedOutgoingConnection = selectedNode
    ? connections.find(connection => connection.from.nodeId === selectedNode.id)
    : undefined;
  const selectedThenConnection = selectedIfThenElseNode
    ? connections.find(connection => connection.from.nodeId === selectedIfThenElseNode.id && connection.from.sourceId === 'then')
    : undefined;
  const selectedElseConnection = selectedIfThenElseNode
    ? connections.find(connection => connection.from.nodeId === selectedIfThenElseNode.id && connection.from.sourceId === 'else')
    : undefined;
  const selectedSubMenuOptionConnections = selectedSubMenuNode
    ? new Map((selectedSubMenuNode.options || []).map(option => [
        option.id,
        connections.find(connection => connection.from.nodeId === selectedSubMenuNode.id && connection.from.sourceId === option.id),
      ]))
    : new Map<string, Msx2GameFlowConnection | undefined>();

  const connectSelectedNodeTo = (toNodeId: string, sourceId?: string) => {
    if (!selectedNode || selectedNode.type === 'End' || selectedNode.type === 'Restart' || selectedNode.id === toNodeId) return;
    const targetNode = nodes.find(node => node.id === toNodeId);
    if (!targetNode) return;
    if (selectedNode.type === 'IfThenElse' && sourceId) {
      onUpdate({
        connections: [
          ...connections.filter(connection => !(connection.from.nodeId === selectedNode.id && connection.from.sourceId === sourceId)),
          makeConnection(selectedNode.id, targetNode.id, sourceId),
        ],
      });
      return;
    }
    if (selectedNode.type === 'SubMenu' && sourceId) {
      onUpdate({
        connections: [
          ...connections.filter(connection => !(connection.from.nodeId === selectedNode.id && connection.from.sourceId === sourceId)),
          makeConnection(selectedNode.id, targetNode.id, sourceId),
        ],
      });
      return;
    }
    onUpdate({
      connections: [
        ...connections.filter(connection => connection.from.nodeId !== selectedNode.id),
        makeConnection(selectedNode.id, targetNode.id),
      ],
    });
  };

  const clearSelectedOutgoingConnection = () => {
    if (!selectedNode) return;
    onUpdate({
      connections: connections.filter(connection => connection.from.nodeId !== selectedNode.id),
    });
  };

  const clearSelectedOutgoingConnectionPort = (sourceId?: string) => {
    if (!selectedNode) return;
    onUpdate({
      connections: connections.filter(connection => !(
        connection.from.nodeId === selectedNode.id
        && (sourceId ? connection.from.sourceId === sourceId : !connection.from.sourceId)
      )),
    });
  };

  const deleteSelectedNode = () => {
    if (!selectedNode || selectedNode.type === 'Start') return;
    onUpdate({
      nodes: nodes.filter(node => node.id !== selectedNode.id),
      connections: connections.filter(conn => conn.from.nodeId !== selectedNode.id && conn.to.nodeId !== selectedNode.id),
    });
    setSelectedNodeId(null);
  };

  const deleteNodeById = (nodeId: string) => {
    const node = nodes.find(candidate => candidate.id === nodeId);
    if (!node || node.type === 'Start') return;
    onUpdate({
      nodes: nodes.filter(candidate => candidate.id !== nodeId),
      connections: connections.filter(connection => connection.from.nodeId !== nodeId && connection.to.nodeId !== nodeId),
    });
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
    setContextMenu(null);
    setLinkingState(null);
  };

  const deleteConnectionById = (connectionId: string) => {
    onUpdate({ connections: connections.filter(connection => connection.id !== connectionId) });
  };

  const updateConnectionWaypoints = (connectionId: string, waypoints: Array<{ x: number; y: number }>) => {
    onUpdate({
      connections: connections.map(connection => (
        connection.id === connectionId ? { ...connection, waypoints } : connection
      )),
    });
  };

  const getSvgPoint = (event: React.MouseEvent<Element> | React.WheelEvent<Element>): { x: number; y: number } => {
    const svg = svgRef.current;
    if (!svg) return { x: event.clientX, y: event.clientY };
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svg.getScreenCTM()?.inverse();
    if (!matrix) return { x: event.clientX, y: event.clientY };
    const transformed = point.matrixTransform(matrix);
    return { x: transformed.x, y: transformed.y };
  };

  const startNodeDrag = (event: React.MouseEvent<SVGGElement>, nodeId: string) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    const node = nodes.find(candidate => candidate.id === nodeId);
    if (!node) return;
    const point = getSvgPoint(event);
    setSelectedNodeId(nodeId);
    setContextMenu(null);
    setLinkingState(null);
    setDraggingState({ nodeId, offset: { x: node.position.x - point.x, y: node.position.y - point.y } });
  };

  const handleSvgWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const point = getSvgPoint(event);
    const [x, y, width, height] = viewBox.split(' ').map(Number);
    const factor = event.deltaY > 0 ? 1.12 : 0.88;
    const nextWidth = Math.max(300, Math.min(3000, width * factor));
    const nextHeight = Math.max(180, Math.min(1800, height * factor));
    const nextX = point.x - ((point.x - x) * nextWidth / width);
    const nextY = point.y - ((point.y - y) * nextHeight / height);
    setViewBox(`${nextX} ${nextY} ${nextWidth} ${nextHeight}`);
  };

  const handleSvgMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    if (event.button === 1 || (event.button === 0 && (event.ctrlKey || event.metaKey))) {
      event.preventDefault();
      setIsPanning(true);
      setPanStart({ x: event.clientX, y: event.clientY });
      setContextMenu(null);
      return;
    }
    if (event.button !== 0) return;
    if (linkingState) setLinkingState(null);
    if (contextMenu) setContextMenu(null);
  };

  const handleSvgMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const point = getSvgPoint(event);
    setMousePosition(point);
    if (isPanning && panStart && svgRef.current) {
      const [x, y, width, height] = viewBox.split(' ').map(Number);
      const scaleX = width / Math.max(svgRef.current.clientWidth, 1);
      const scaleY = height / Math.max(svgRef.current.clientHeight, 1);
      const dx = event.clientX - panStart.x;
      const dy = event.clientY - panStart.y;
      setViewBox(`${x - (dx * scaleX)} ${y - (dy * scaleY)} ${width} ${height}`);
      setPanStart({ x: event.clientX, y: event.clientY });
      return;
    }
    if (draggingWaypoint) {
      onUpdate({
        connections: connections.map(connection => {
          if (connection.id !== draggingWaypoint.connectionId) return connection;
          const waypoints = [...(connection.waypoints || [])];
          waypoints[draggingWaypoint.waypointIndex] = point;
          return { ...connection, waypoints };
        }),
      });
      return;
    }
    if (!draggingState) return;
    onUpdate({
      nodes: nodes.map(node =>
        node.id === draggingState.nodeId
          ? { ...node, position: { x: point.x + draggingState.offset.x, y: point.y + draggingState.offset.y } }
          : node
      ),
    });
  };

  const handleSvgMouseUp = () => {
    if (draggingState) {
      onUpdate({
        nodes: nodes.map(node =>
          node.id === draggingState.nodeId
            ? { ...node, position: { x: Math.round(node.position.x / 10) * 10, y: Math.round(node.position.y / 10) * 10 } }
            : node
        ),
      });
    }
    setDraggingState(null);
    if (draggingWaypoint) {
      onUpdate({
        connections: connections.map(connection => {
          if (connection.id !== draggingWaypoint.connectionId) return connection;
          return {
            ...connection,
            waypoints: (connection.waypoints || []).map((waypoint, index) => (
              index === draggingWaypoint.waypointIndex
                ? { x: Math.round(waypoint.x / 10) * 10, y: Math.round(waypoint.y / 10) * 10 }
                : waypoint
            )),
          };
        }),
      });
    }
    setDraggingWaypoint(null);
    setIsPanning(false);
    setPanStart(null);
  };

  const connectNodeTo = (fromNodeId: string, toNodeId: string, sourceId?: string) => {
    if (fromNodeId === toNodeId) {
      setLinkingState(null);
      return;
    }
    const fromNode = nodes.find(node => node.id === fromNodeId);
    const targetNode = nodes.find(node => node.id === toNodeId);
    if (!fromNode || !targetNode || fromNode.type === 'End' || fromNode.type === 'Restart') return;
    if ((fromNode.type === 'IfThenElse' || fromNode.type === 'SubMenu') && sourceId) {
      onUpdate({
        connections: [
          ...connections.filter(connection => !(connection.from.nodeId === fromNode.id && connection.from.sourceId === sourceId)),
          makeConnection(fromNode.id, targetNode.id, sourceId),
        ],
      });
    } else {
      onUpdate({
        connections: [
          ...connections.filter(connection => connection.from.nodeId !== fromNode.id),
          makeConnection(fromNode.id, targetNode.id),
        ],
      });
    }
    setLinkingState(null);
  };

  const handleInputPortClick = (event: React.MouseEvent<SVGCircleElement>, nodeId: string) => {
    event.stopPropagation();
    setSelectedNodeId(nodeId);
    if (linkingState) connectNodeTo(linkingState.fromNodeId, nodeId, linkingState.sourceId);
  };

  const handleOutputPortClick = (event: React.MouseEvent<SVGCircleElement>, nodeId: string, sourceId?: string) => {
    event.stopPropagation();
    setSelectedNodeId(nodeId);
    setContextMenu(null);
    setLinkingState({ fromNodeId: nodeId, sourceId });
    setMousePosition(getSvgPoint(event));
  };

  const outputPortsForNode = (node: Msx2GameFlowNode): Array<{ sourceId?: string; y: number; label?: string }> => {
    if (node.type === 'End' || node.type === 'Restart') return [];
    if (node.type === 'IfThenElse') return [
      { sourceId: 'then', y: 26, label: 'T' },
      { sourceId: 'else', y: 50, label: 'E' },
    ];
    if (node.type === 'SubMenu') {
      const options = (node.options || []).slice(0, 6);
      return options.map((option, index) => ({ sourceId: option.id, y: 12 + (index * 10), label: String(index + 1) }));
    }
    return [{ y: NODE_HEIGHT / 2 }];
  };

  const resetGraphView = () => {
    if (!nodes.length) {
      setViewBox('0 0 1200 520');
      return;
    }
    const padding = 80;
    const minX = Math.min(...nodes.map(node => node.position.x)) - padding;
    const minY = Math.min(...nodes.map(node => node.position.y)) - padding;
    const maxX = Math.max(...nodes.map(node => node.position.x + NODE_WIDTH)) + padding;
    const maxY = Math.max(...nodes.map(node => node.position.y + NODE_HEIGHT)) + padding;
    const width = Math.max(700, maxX - minX);
    const height = Math.max(360, maxY - minY);
    setViewBox(`${minX} ${minY} ${width} ${height}`);
  };

  const makeConnectionPath = (
    start: { x: number; y: number },
    end: { x: number; y: number },
    waypoints: Array<{ x: number; y: number }> = []
  ) => {
    if (waypoints.length) {
      return [start, ...waypoints, end].map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    }
    const mid = Math.max(60, (end.x - start.x) / 2);
    return `M ${start.x} ${start.y} C ${start.x + mid} ${start.y}, ${end.x - mid} ${end.y}, ${end.x} ${end.y}`;
  };

  const autoLayout = () => {
    onUpdate({
      nodes: nodes.map((node, index) => ({
        ...node,
        position: { x: 70 + (index * 230), y: 110 },
      })),
      panOffset: { x: 0, y: 0 },
      zoomLevel: 1,
    });
  };

  return (
    <Panel title="MSX2 Game Flow" className="min-h-0 flex-grow flex flex-col">
      <div className="shrink-0 flex flex-wrap items-center gap-2 p-2 border-b border-msx-border bg-msx-panelbg">
        <div className="flex items-center gap-1 mr-2">
          <Button
            onClick={() => updateFlowPurpose('screen5-presentation')}
            size="sm"
            variant={isScreen5PresentationFlow ? 'primary' : 'ghost'}
          >
            SCREEN 5 Presentation
          </Button>
          <Button
            onClick={() => updateFlowPurpose('screen4-runtime')}
            size="sm"
            variant={!isScreen5PresentationFlow ? 'primary' : 'ghost'}
          >
            SCREEN 4 Runtime
          </Button>
        </div>
        <Button onClick={() => addNode('Screen5Presentation')} size="sm" icon={<PlusCircleIcon className="w-4 h-4" />} disabled={!isScreen5PresentationFlow}>
          Add SCREEN 5
        </Button>
        <Button onClick={() => addNode('Globals')} size="sm" icon={<PlusCircleIcon className="w-4 h-4" />}>
          Add Globals
        </Button>
        <Button onClick={() => addNode('SubMenu')} size="sm" icon={<PlusCircleIcon className="w-4 h-4" />} disabled={isScreen5PresentationFlow}>
          Add SubMenu
        </Button>
        <Button onClick={() => addNode('Screen4Screen')} size="sm" icon={<PlusCircleIcon className="w-4 h-4" />} disabled={isScreen5PresentationFlow}>
          Add SCREEN 4
        </Button>
        <Button onClick={() => addNode('Controls')} size="sm" icon={<PlusCircleIcon className="w-4 h-4" />} disabled={isScreen5PresentationFlow}>
          Add Controls
        </Button>
        <Button onClick={() => addNode('WorldLink')} size="sm" icon={<PlusCircleIcon className="w-4 h-4" />} disabled={isScreen5PresentationFlow}>
          Add World
        </Button>
        <Button onClick={() => addNode('Text')} size="sm" icon={<PlusCircleIcon className="w-4 h-4" />}>
          Add Text
        </Button>
        <Button onClick={() => addNode('TextScroll')} size="sm" icon={<PlusCircleIcon className="w-4 h-4" />} disabled={isScreen5PresentationFlow}>
          Add Text Scroll
        </Button>
        <Button onClick={() => addNode('TextScrollColor')} size="sm" icon={<PlusCircleIcon className="w-4 h-4" />} disabled={isScreen5PresentationFlow}>
          Add Text Color
        </Button>
        <Button onClick={() => addNode('IfThenElse')} size="sm" icon={<PlusCircleIcon className="w-4 h-4" />}>
          If/Then/Else
        </Button>
        <Button onClick={() => addNode('Music')} size="sm" icon={<PlusCircleIcon className="w-4 h-4" />} disabled={isScreen5PresentationFlow}>
          Add Music
        </Button>
        <Button onClick={() => addNode('Waypoint')} size="sm" icon={<PlusCircleIcon className="w-4 h-4" />}>
          Waypoint
        </Button>
        <Button onClick={() => addNode('Transition')} size="sm" icon={<PlusCircleIcon className="w-4 h-4" />}>
          Add Transition
        </Button>
        <Button onClick={() => addNode('Restart')} size="sm" icon={<PlusCircleIcon className="w-4 h-4" />}>
          Add Restart
        </Button>
        <Button onClick={() => addNode('End')} size="sm" icon={<PlusCircleIcon className="w-4 h-4" />}>
          Add End
        </Button>
        <Button onClick={autoLayout} size="sm" variant="primary" icon={<ArrowsPointingOutIcon className="w-4 h-4" />}>
          Auto Layout
        </Button>
        <Button onClick={resetGraphView} size="sm" variant="ghost">
          Reset View
        </Button>
        <Button onClick={() => setIsCutMode(value => !value)} size="sm" variant={isCutMode ? 'primary' : 'ghost'}>
          Cut Connections
        </Button>
        <Button onClick={applyIntroTemplate} size="sm" variant="secondary">
          SCREEN 5 Intro
        </Button>
        <Button onClick={applyScreen4RuntimeTemplate} size="sm" variant="secondary">
          SCREEN 4 Runtime
        </Button>
        <Button onClick={selectPreviewNode} size="sm" variant="ghost">
          Preview
        </Button>
        <div className="flex-grow" />
      </div>

      <div className="min-h-0 flex-grow overflow-hidden grid grid-cols-[1fr_300px]">
        <div className="relative min-h-0 overflow-hidden bg-[#101018]" onClick={() => setContextMenu(null)}>
          {contextMenu && (
            <div
              className="fixed z-50 min-w-36 rounded border border-msx-border bg-msx-panelbg shadow-lg"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={event => event.stopPropagation()}
            >
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-xs text-red-200 hover:bg-red-900/40 disabled:opacity-50"
                disabled={nodes.find(node => node.id === contextMenu.nodeId)?.type === 'Start'}
                onClick={() => deleteNodeById(contextMenu.nodeId)}
              >
                Delete Node
              </button>
            </div>
          )}
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={viewBox}
            className="block min-h-[520px]"
            onWheel={handleSvgWheel}
            onMouseDown={handleSvgMouseDown}
            onMouseMove={handleSvgMouseMove}
            onMouseUp={handleSvgMouseUp}
            onMouseLeave={handleSvgMouseUp}
            onClick={() => {
              if (linkingState) setLinkingState(null);
              if (contextMenu) setContextMenu(null);
            }}
            style={{ cursor: isCutMode ? 'crosshair' : ((draggingState || isPanning) ? 'grabbing' : 'grab') }}
          >
            <defs>
              <pattern id="msx2FlowGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
              </pattern>
              <marker id="msx2FlowArrow" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="hsl(150, 60%, 60%)" />
              </marker>
            </defs>
            <rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#msx2FlowGrid)" />
            {connections.map(conn => {
              const from = nodes.find(node => node.id === conn.from.nodeId);
              const to = nodes.find(node => node.id === conn.to.nodeId);
              if (!from || !to) return null;
              const x1 = from.position.x + NODE_WIDTH;
              const fromPort = outputPortsForNode(from).find(port => port.sourceId === conn.from.sourceId) || outputPortsForNode(from)[0];
              const y1 = from.position.y + (fromPort?.y || NODE_HEIGHT / 2);
              const x2 = to.position.x;
              const y2 = to.position.y + NODE_HEIGHT / 2;
              const pathD = makeConnectionPath({ x: x1, y: y1 }, { x: x2, y: y2 }, conn.waypoints || []);
              return (
                <g key={conn.id}>
                  <path
                    d={pathD}
                    stroke="hsl(150, 60%, 60%)"
                    strokeWidth="2"
                    fill="none"
                    markerEnd="url(#msx2FlowArrow)"
                    pointerEvents="none"
                  />
                  <path
                    d={pathD}
                    stroke="transparent"
                    strokeWidth="12"
                    fill="none"
                    pointerEvents="stroke"
                    onMouseDown={event => {
                      event.preventDefault();
                      event.stopPropagation();
                      if (event.ctrlKey || event.metaKey) {
                        const point = getSvgPoint(event);
                        updateConnectionWaypoints(conn.id, [...(conn.waypoints || []), {
                          x: Math.round(point.x / 10) * 10,
                          y: Math.round(point.y / 10) * 10,
                        }]);
                        return;
                      }
                      if (isCutMode) deleteConnectionById(conn.id);
                    }}
                    onContextMenu={event => {
                      event.preventDefault();
                      event.stopPropagation();
                      deleteConnectionById(conn.id);
                    }}
                    style={{ cursor: isCutMode ? 'crosshair' : 'pointer' }}
                  />
                  {(conn.waypoints || []).map((waypoint, index) => (
                    <circle
                      key={`${conn.id}-wp-${index}`}
                      cx={waypoint.x}
                      cy={waypoint.y}
                      r="6"
                      fill="hsl(50, 100%, 70%)"
                      stroke="hsl(30, 90%, 35%)"
                      strokeWidth="1.5"
                      onMouseDown={event => {
                        event.preventDefault();
                        event.stopPropagation();
                        setDraggingWaypoint({ connectionId: conn.id, waypointIndex: index });
                      }}
                      onDoubleClick={event => {
                        event.preventDefault();
                        event.stopPropagation();
                        updateConnectionWaypoints(conn.id, (conn.waypoints || []).filter((_, waypointIndex) => waypointIndex !== index));
                      }}
                      style={{ cursor: 'move' }}
                    />
                  ))}
                </g>
              );
            })}
            {linkingState && mousePosition && (() => {
              const from = nodes.find(node => node.id === linkingState.fromNodeId);
              if (!from) return null;
              const sourcePort = outputPortsForNode(from).find(port => port.sourceId === linkingState.sourceId) || outputPortsForNode(from)[0];
              if (!sourcePort) return null;
              const x1 = from.position.x + NODE_WIDTH;
              const y1 = from.position.y + sourcePort.y;
              return (
                <line
                  x1={x1}
                  y1={y1}
                  x2={mousePosition.x}
                  y2={mousePosition.y}
                  stroke="hsl(50, 100%, 70%)"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  pointerEvents="none"
                />
              );
            })()}
            {nodes.map(node => {
              const isSelected = selectedNodeId === node.id;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.position.x}, ${node.position.y})`}
                  onMouseDown={event => startNodeDrag(event, node.id)}
                  onClick={event => {
                    event.stopPropagation();
                    setSelectedNodeId(node.id);
                  }}
                  onContextMenu={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    setSelectedNodeId(node.id);
                    setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
                  }}
                  style={{ cursor: draggingState?.nodeId === node.id ? 'grabbing' : 'grab' }}
                >
                  <rect
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx="6"
                    fill={getNodeColor(node)}
                    stroke={isSelected ? 'hsl(50, 100%, 70%)' : 'hsl(190, 40%, 65%)'}
                    strokeWidth={isSelected ? 3 : 1.5}
                  />
                  <text x={NODE_WIDTH / 2} y="30" textAnchor="middle" fill="white" fontSize="12" fontWeight="700">
                    {node.type}
                  </text>
                  <text x={NODE_WIDTH / 2} y="52" textAnchor="middle" fill="hsl(210, 30%, 86%)" fontSize="10">
                    {getNodeLabel(node, allAssets).slice(0, 24)}
                  </text>
                  <circle
                    cx="0"
                    cy={NODE_HEIGHT / 2}
                    r="7"
                    fill={linkingState ? 'hsl(50, 100%, 70%)' : 'hsl(210, 30%, 20%)'}
                    stroke="white"
                    strokeWidth="1.5"
                    onMouseDown={event => event.stopPropagation()}
                    onClick={event => handleInputPortClick(event, node.id)}
                    style={{ cursor: linkingState ? 'crosshair' : 'pointer' }}
                  />
                  {outputPortsForNode(node).map(port => (
                    <g key={port.sourceId || 'default'}>
                      <circle
                        cx={NODE_WIDTH}
                        cy={port.y}
                        r="7"
                        fill="hsl(150, 70%, 45%)"
                        stroke="white"
                        strokeWidth="1.5"
                        onMouseDown={event => event.stopPropagation()}
                        onClick={event => handleOutputPortClick(event, node.id, port.sourceId)}
                        style={{ cursor: 'crosshair' }}
                      />
                      {port.label && (
                        <text x={NODE_WIDTH} y={port.y + 3} textAnchor="middle" fill="white" fontSize="8" pointerEvents="none">
                          {port.label}
                        </text>
                      )}
                    </g>
                  ))}
                </g>
              );
            })}
          </svg>
        </div>

        <aside className="h-full min-h-0 overflow-y-auto overflow-x-hidden border-l border-msx-border bg-msx-bgcolor p-3 space-y-3">
          <div>
            <h3 className="text-sm font-semibold mb-2">Node</h3>
            <p className="text-xs text-msx-textsecondary">{selectedNode ? selectedNode.type : 'Select a node'}</p>
          </div>

          {selectedPresentationNode && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">SCREEN 5 Presentation</h3>
              <Button onClick={() => setIsPickerOpen(true)} size="sm" variant="secondary" className="w-full">
                Select SCREEN 5 Asset
              </Button>
              <p className="text-xs text-msx-textsecondary">
                {previewLabel}
              </p>
              <canvas ref={previewCanvasRef} className="w-full border border-msx-border bg-black" style={{ imageRendering: 'pixelated' }} />
              <h3 className="text-sm font-semibold">GameFlow runtime override</h3>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={selectedPresentationNode.waitForKey !== false}
                  onChange={event => updateSelectedPresentationRuntime({ waitForKey: event.target.checked })}
                />
                Wait for key
              </label>
              <label className="block text-xs">
                Wait frames
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={selectedPresentationNode.waitFrames || 0}
                  onChange={event => updateSelectedPresentationRuntime({ waitFrames: Number(event.target.value) })}
                  disabled={selectedPresentationNode.waitForKey !== false}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1 disabled:opacity-50"
                />
              </label>
            </div>
          )}

          {selectedNode?.type === 'Transition' && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Transition</h3>
              <label className="block text-xs">
                Effect
                <select
                  value={selectedNode.effect}
                  onChange={event => updateSelectedTransition(event.target.value as Msx2GameFlowTransitionNode['effect'])}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                >
                  {transitionOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs">
                Duration frames
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={selectedNode.durationFrames ?? 30}
                  onChange={event => updateSelectedTransitionDuration(Number(event.target.value))}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                />
              </label>
            </div>
          )}

          {selectedTextNode && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Text</h3>
              <label className="block text-xs">
                Title
                <input
                  type="text"
                  value={selectedTextNode.title}
                  onChange={event => updateSelectedText({ title: event.target.value })}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                />
              </label>
              <label className="block text-xs">
                Message
                <textarea
                  value={selectedTextNode.message}
                  onChange={event => updateSelectedText({ message: event.target.value })}
                  rows={4}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                />
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={selectedTextNode.waitForKey !== false}
                  onChange={event => updateSelectedText({ waitForKey: event.target.checked })}
                />
                Wait for key
              </label>
              <label className="block text-xs">
                Wait frames
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={selectedTextNode.waitFrames || 0}
                  onChange={event => updateSelectedText({ waitFrames: Number(event.target.value) })}
                  disabled={selectedTextNode.waitForKey !== false}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1 disabled:opacity-50"
                />
              </label>
            </div>
          )}

          {selectedTextScrollNode && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Text Scroll</h3>
              <label className="block text-xs">
                Title
                <input
                  type="text"
                  value={selectedTextScrollNode.title}
                  onChange={event => updateSelectedTextScroll({ title: event.target.value })}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                />
              </label>
              <label className="block text-xs">
                Background SCREEN 4
                <select
                  value={selectedTextScrollNode.backgroundScreenAssetId || ''}
                  onChange={event => updateSelectedTextScroll({ backgroundScreenAssetId: event.target.value || undefined })}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                >
                  <option value="">Use first exported room</option>
                  {screen4Assets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs">
                Text
                <textarea
                  value={selectedTextScrollNode.text}
                  onChange={event => updateSelectedTextScroll({ text: event.target.value })}
                  className="mt-1 w-full min-h-24 bg-msx-panelbg border border-msx-border rounded p-1"
                />
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={selectedTextScrollNode.waitForKey !== false}
                  onChange={event => updateSelectedTextScroll({ waitForKey: event.target.checked })}
                />
                Wait for key
              </label>
              <label className="block text-xs">
                Wait frames
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={selectedTextScrollNode.waitFrames || 0}
                  onChange={event => updateSelectedTextScroll({ waitFrames: Number(event.target.value) })}
                  disabled={selectedTextScrollNode.waitForKey !== false}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                />
              </label>
              <p className="text-xs text-msx-textsecondary">
                SCREEN 4 export renders this as a story panel now; smooth pixel scrolling remains a later runtime step.
              </p>
            </div>
          )}

          {selectedTextScrollColorNode && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Text Scroll Color</h3>
              <label className="block text-xs">
                Title
                <input
                  type="text"
                  value={selectedTextScrollColorNode.title}
                  onChange={event => updateSelectedTextScrollColor({ title: event.target.value })}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                />
              </label>
              <label className="block text-xs">
                Background SCREEN 4
                <select
                  value={selectedTextScrollColorNode.backgroundScreenAssetId || ''}
                  onChange={event => updateSelectedTextScrollColor({ backgroundScreenAssetId: event.target.value || undefined })}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                >
                  <option value="">Use first exported room</option>
                  {screen4Assets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs">
                Text
                <textarea
                  value={selectedTextScrollColorNode.text}
                  onChange={event => updateSelectedTextScrollColor({ text: event.target.value })}
                  className="mt-1 w-full min-h-24 bg-msx-panelbg border border-msx-border rounded p-1"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs">
                  Text color
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={selectedTextScrollColorNode.textColorIndex ?? 15}
                    onChange={event => updateSelectedTextScrollColor({ textColorIndex: Number(event.target.value) })}
                    className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                  />
                </label>
                <label className="block text-xs">
                  Back color
                  <input
                    type="number"
                    min={0}
                    max={15}
                    value={selectedTextScrollColorNode.backgroundColorIndex ?? 1}
                    onChange={event => updateSelectedTextScrollColor({ backgroundColorIndex: Number(event.target.value) })}
                    className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={selectedTextScrollColorNode.waitForKey !== false}
                  onChange={event => updateSelectedTextScrollColor({ waitForKey: event.target.checked })}
                />
                Wait for key
              </label>
              <label className="block text-xs">
                Wait frames
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={selectedTextScrollColorNode.waitFrames || 0}
                  onChange={event => updateSelectedTextScrollColor({ waitFrames: Number(event.target.value) })}
                  disabled={selectedTextScrollColorNode.waitForKey !== false}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                />
              </label>
              <p className="text-xs text-msx-textsecondary">
                SCREEN 4 export renders this as a colored story panel; smooth pixel scrolling remains a later runtime step.
              </p>
            </div>
          )}

          {selectedScreen4ScreenNode && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">SCREEN 4 Screen</h3>
              <label className="block text-xs">
                SCREEN 4 room
                <select
                  value={selectedScreen4ScreenNode.screenAssetId || ''}
                  onChange={event => updateSelectedScreen4Screen({ screenAssetId: event.target.value || undefined })}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                  disabled={screen4Assets.length === 0}
                >
                  <option value="">Select SCREEN 4 room</option>
                  {screen4Assets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={selectedScreen4ScreenNode.waitForKey !== false}
                  onChange={event => updateSelectedScreen4Screen({ waitForKey: event.target.checked })}
                />
                Wait for key
              </label>
              <label className="block text-xs">
                Wait frames
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={selectedScreen4ScreenNode.waitFrames || 0}
                  onChange={event => updateSelectedScreen4Screen({ waitFrames: Number(event.target.value) })}
                  disabled={selectedScreen4ScreenNode.waitForKey !== false}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1 disabled:opacity-50"
                />
              </label>
              <p className="text-xs text-msx-textsecondary">
                SCREEN 4 export loads this room as a visual panel and then continues to the next node.
              </p>
            </div>
          )}

          {selectedEndNode && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">End</h3>
              <label className="block text-xs">
                Title
                <input
                  type="text"
                  value={selectedEndNode.title || ''}
                  onChange={event => updateSelectedEnd({ title: event.target.value })}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                />
              </label>
              <label className="block text-xs">
                Message
                <textarea
                  value={selectedEndNode.message || ''}
                  onChange={event => updateSelectedEnd({ message: event.target.value })}
                  rows={3}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                />
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={selectedEndNode.waitForKey !== false}
                  onChange={event => updateSelectedEnd({ waitForKey: event.target.checked })}
                />
                Wait for key
              </label>
              <label className="block text-xs">
                Wait frames
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={selectedEndNode.waitFrames || 0}
                  onChange={event => updateSelectedEnd({ waitFrames: Number(event.target.value) })}
                  disabled={selectedEndNode.waitForKey !== false}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1 disabled:opacity-50"
                />
              </label>
              <p className="text-xs text-msx-textsecondary">
                SCREEN 4 export draws this final message and then returns to the runtime loop.
              </p>
            </div>
          )}

          {selectedControlsNode && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Controls</h3>
              <label className="block text-xs">
                Title
                <input
                  type="text"
                  value={selectedControlsNode.title}
                  onChange={event => updateSelectedControls({ title: event.target.value })}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                />
              </label>
              <label className="block text-xs">
                SCREEN 4 background
                <select
                  value={selectedControlsNode.backgroundScreenAssetId || ''}
                  onChange={event => updateSelectedControls({ backgroundScreenAssetId: event.target.value || undefined })}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                  disabled={screen4Assets.length === 0}
                >
                  <option value="">Fallback first SCREEN 4 room</option>
                  {screen4Assets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs">
                  B1 key
                  <select
                    value={selectedControlsNode.keyboardButton1 || 'SPC'}
                    onChange={event => updateSelectedControls({ keyboardButton1: event.target.value as Msx2GameFlowControlsNode['keyboardButton1'] })}
                    className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                  >
                    <option value="SPC">SPC</option>
                    <option value="CTRL">CTRL</option>
                  </select>
                </label>
                <label className="block text-xs">
                  B2 key
                  <select
                    value={selectedControlsNode.keyboardButton2 || 'N'}
                    onChange={event => updateSelectedControls({ keyboardButton2: event.target.value as Msx2GameFlowControlsNode['keyboardButton2'] })}
                    className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                  >
                    <option value="N">N</option>
                    <option value="CTRL">CTRL</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-[1fr_82px] gap-2">
                <label className="block text-xs">
                  Action 1
                  <input
                    type="text"
                    value={selectedControlsNode.jumpActionLabel || ''}
                    onChange={event => updateSelectedControls({ jumpActionLabel: event.target.value })}
                    className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                  />
                </label>
                <label className="block text-xs">
                  Uses
                  <select
                    value={selectedControlsNode.jumpActionButton || 'button1'}
                    onChange={event => updateSelectedControls({ jumpActionButton: event.target.value as Msx2GameFlowControlsNode['jumpActionButton'] })}
                    className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                  >
                    <option value="button1">B1</option>
                    <option value="button2">B2</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-[1fr_82px] gap-2">
                <label className="block text-xs">
                  Action 2
                  <input
                    type="text"
                    value={selectedControlsNode.actionLabel || ''}
                    onChange={event => updateSelectedControls({ actionLabel: event.target.value })}
                    className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                  />
                </label>
                <label className="block text-xs">
                  Uses
                  <select
                    value={selectedControlsNode.actionButton || 'button2'}
                    onChange={event => updateSelectedControls({ actionButton: event.target.value as Msx2GameFlowControlsNode['actionButton'] })}
                    className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                  >
                    <option value="button1">B1</option>
                    <option value="button2">B2</option>
                  </select>
                </label>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={selectedControlsNode.waitForKey !== false}
                  onChange={event => updateSelectedControls({ waitForKey: event.target.checked })}
                />
                Wait for key
              </label>
              <label className="block text-xs">
                Wait frames
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={selectedControlsNode.waitFrames || 0}
                  onChange={event => updateSelectedControls({ waitFrames: Number(event.target.value) })}
                  disabled={selectedControlsNode.waitForKey !== false}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1 disabled:opacity-50"
                />
              </label>
              <p className="text-xs text-msx-textsecondary">
                SCREEN 4 export draws this as a controls reference screen; it does not rewrite runtime input bindings yet.
              </p>
            </div>
          )}

          {selectedWorldLinkNode && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">World Link</h3>
              <label className="block text-xs">
                World Map
                <select
                  value={selectedWorldLinkNode.worldAssetId || ''}
                  onChange={event => updateSelectedWorldLink({ worldAssetId: event.target.value })}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                  disabled={worldAssets.length === 0}
                >
                  <option value="">Select World Map</option>
                  {worldAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                  ))}
                </select>
              </label>
              <p className="text-xs text-msx-textsecondary">
                SCREEN 4 export loads the start screen from this world and enters the runtime loop.
              </p>
            </div>
          )}

          {selectedSubMenuNode && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">SubMenu</h3>
              <label className="block text-xs">
                Title
                <input
                  type="text"
                  value={selectedSubMenuNode.title}
                  onChange={event => updateSelectedSubMenu({ title: event.target.value })}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                />
              </label>
              <label className="block text-xs">
                SCREEN 4 background
                <select
                  value={selectedSubMenuNode.backgroundScreenAssetId || ''}
                  onChange={event => updateSelectedSubMenu({ backgroundScreenAssetId: event.target.value || undefined })}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                  disabled={screen4Assets.length === 0}
                >
                  <option value="">Fallback first SCREEN 4 room</option>
                  {screen4Assets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                  ))}
                </select>
              </label>
              <Button onClick={addSubMenuOption} size="sm" variant="secondary" className="w-full" disabled={(selectedSubMenuNode.options || []).length >= 6}>
                Add Option
              </Button>
              {(selectedSubMenuNode.options || []).map(option => (
                <div key={option.id} className="grid grid-cols-[1fr_auto] gap-1 items-center">
                  <input
                    type="text"
                    value={option.text}
                    onChange={event => updateSubMenuOption(option.id, event.target.value)}
                    className="min-w-0 bg-msx-panelbg border border-msx-border rounded p-1 text-xs"
                  />
                  <Button onClick={() => deleteSubMenuOption(option.id)} size="sm" variant="ghost">
                    Del
                  </Button>
                </div>
              ))}
              <p className="text-xs text-msx-textsecondary">
                SCREEN 4 export loads the background, draws the menu, and branches by option.
              </p>
            </div>
          )}

          {selectedGlobalsNode && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Globals</h3>
              <label className="block text-xs">
                Title
                <input
                  type="text"
                  value={selectedGlobalsNode.title || ''}
                  onChange={event => updateSelectedGlobals({ title: event.target.value })}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                />
              </label>
              <label className="block text-xs">
                Source asset
                <select
                  value={selectedGlobalsNode.globalVariablesAssetId || globalVariablesAssets[0]?.id || ''}
                  onChange={event => updateSelectedGlobals({ globalVariablesAssetId: event.target.value })}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                  disabled={globalVariablesAssets.length === 0}
                >
                  {globalVariablesAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                  ))}
                </select>
              </label>
              <Button onClick={addGlobalAssignment} size="sm" variant="secondary" className="w-full">
                Add Assignment
              </Button>
              {(selectedGlobalsNode.variables || []).map(variable => {
                const selectedVariable = selectedGlobalsAssetVariables.find(item => item.name === variable.name);
                return (
                  <div key={variable.id} className="grid grid-cols-[1fr_82px_auto] gap-1 items-center">
                    {selectedGlobalsAssetVariables.length > 0 ? (
                      <select
                        value={variable.name}
                        onChange={event => {
                          const nextVariable = selectedGlobalsAssetVariables.find(item => item.name === event.target.value);
                          updateGlobalAssignment(variable.id, {
                            name: event.target.value,
                            value: getDefaultGlobalValue(nextVariable),
                          });
                        }}
                        className="min-w-0 bg-msx-panelbg border border-msx-border rounded p-1 text-xs"
                      >
                        {selectedGlobalsAssetVariables.map(item => (
                          <option key={item.name} value={item.name}>{item.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={variable.name}
                        onChange={event => updateGlobalAssignment(variable.id, { name: event.target.value })}
                        className="min-w-0 bg-msx-panelbg border border-msx-border rounded p-1 text-xs"
                      />
                    )}
                    {selectedVariable?.type === 'boolean' ? (
                      <select
                        value={variable.value}
                        onChange={event => updateGlobalAssignment(variable.id, { value: event.target.value })}
                        className="bg-msx-panelbg border border-msx-border rounded p-1 text-xs"
                      >
                        <option value="false">false</option>
                        <option value="true">true</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={variable.value}
                        onChange={event => updateGlobalAssignment(variable.id, { value: event.target.value })}
                        className="min-w-0 bg-msx-panelbg border border-msx-border rounded p-1 text-xs"
                      />
                    )}
                    <Button onClick={() => deleteGlobalAssignment(variable.id)} size="sm" variant="ghost">
                      Del
                    </Button>
                  </div>
                );
              })}
              {selectedGlobalsNode.variables.length === 0 && (
                <p className="text-xs text-msx-textsecondary">No assignments.</p>
              )}
            </div>
          )}

          {selectedIfThenElseNode && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">If/Then/Else</h3>
              <label className="block text-xs">
                Variable
                {selectedGlobalsAssetVariables.length > 0 ? (
                  <select
                    value={selectedIfThenElseNode.variableName}
                    onChange={event => updateSelectedIfThenElse({ variableName: event.target.value })}
                    className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                  >
                    {selectedGlobalsAssetVariables.map(variable => (
                      <option key={variable.name} value={variable.name}>{variable.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={selectedIfThenElseNode.variableName}
                    onChange={event => updateSelectedIfThenElse({ variableName: event.target.value })}
                    className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                  />
                )}
              </label>
              <label className="block text-xs">
                Operator
                <select
                  value={selectedIfThenElseNode.operator || '=='}
                  onChange={event => updateSelectedIfThenElse({ operator: event.target.value as Msx2GameFlowIfThenElseNode['operator'] })}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                >
                  <option value="==">==</option>
                  <option value="!=">!=</option>
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value=">=">&gt;=</option>
                  <option value="<=">&lt;=</option>
                </select>
              </label>
              <label className="block text-xs">
                Compare value
                <input
                  type="text"
                  value={selectedIfThenElseNode.compareValue}
                  onChange={event => updateSelectedIfThenElse({ compareValue: event.target.value })}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                />
              </label>
            </div>
          )}

          {selectedMusicNode && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Music</h3>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={selectedMusicNode.stop === true || selectedMusicNode.autoPlay === false}
                  onChange={event => updateSelectedMusic({
                    stop: event.target.checked,
                    autoPlay: event.target.checked ? false : true,
                  })}
                />
                Stop PSG on entry
              </label>
              <label className="block text-xs">
                Track
                <select
                  value={selectedMusicNode.trackAssetId || ''}
                  onChange={event => updateSelectedMusic({ trackAssetId: event.target.value || undefined })}
                  disabled={selectedMusicNode.stop === true || selectedMusicNode.autoPlay === false}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                >
                  <option value="">No track selected</option>
                  {trackAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={selectedMusicNode.loop !== false}
                  onChange={event => updateSelectedMusic({ loop: event.target.checked })}
                  disabled={selectedMusicNode.stop === true || selectedMusicNode.autoPlay === false}
                />
                Loop track
              </label>
              <p className="text-xs text-msx-textsecondary">
                SCREEN 4 export currently supports stop/mute immediately; active track playback is blocked until the MSX2 tracker runtime is connected.
              </p>
            </div>
          )}

          <div className="space-y-2 border-t border-msx-border pt-3">
            <h3 className="text-sm font-semibold">Flow status</h3>
            {flowPath.length > 0 && (
              <div className="space-y-1 text-xs text-msx-textsecondary">
                <p>Export path: {flowPath.map(item => item.split(':')[0]).join(' -> ')}</p>
                <ol className="space-y-1">
                  {flowPath.map((item, index) => (
                    <li key={`${item}_${index}`}>{index + 1}. {item}</li>
                  ))}
                </ol>
              </div>
            )}
            <p className="text-xs text-msx-textsecondary">
              Purpose: {isScreen5PresentationFlow ? 'SCREEN 5 presentation/export' : 'SCREEN 4 menu/game runtime'}
            </p>
            {flowIssues.length === 0 ? (
              <p className="text-xs text-green-300">
                {isScreen5PresentationFlow ? 'Export path ready for SCREEN 5.' : 'SCREEN 4 runtime scaffold is clean.'}
              </p>
            ) : (
              <ul className="space-y-1 text-xs text-yellow-200">
                {flowIssues.map(issue => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            )}
          </div>

          {!selectedPresentationNode && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Preview</h3>
              <p className="text-xs text-msx-textsecondary">
                {previewLabel}
              </p>
              {activePresentationAsset ? (
                <canvas ref={previewCanvasRef} className="w-full border border-msx-border bg-black" style={{ imageRendering: 'pixelated' }} />
              ) : (
                <div className="h-24 border border-dashed border-msx-border bg-black" />
              )}
            </div>
          )}

          {selectedNode && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Connection</h3>
              {selectedNode.type === 'End' || selectedNode.type === 'Restart' ? (
                <p className="text-xs text-msx-textsecondary">{selectedNode.type} nodes do not have outgoing connections.</p>
              ) : selectedIfThenElseNode ? (
                <>
                  <label className="block text-xs">
                    THEN node
                    <select
                      value={selectedThenConnection?.to.nodeId || ''}
                      onChange={event => {
                        if (event.target.value) connectSelectedNodeTo(event.target.value, 'then');
                        else clearSelectedOutgoingConnectionPort('then');
                      }}
                      className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                    >
                      <option value="">None</option>
                      {nodes.filter(node => node.id !== selectedNode.id).map(node => (
                        <option key={node.id} value={node.id}>{node.type}: {getNodeLabel(node, allAssets).slice(0, 24)}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs">
                    ELSE node
                    <select
                      value={selectedElseConnection?.to.nodeId || ''}
                      onChange={event => {
                        if (event.target.value) connectSelectedNodeTo(event.target.value, 'else');
                        else clearSelectedOutgoingConnectionPort('else');
                      }}
                      className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                    >
                      <option value="">None</option>
                      {nodes.filter(node => node.id !== selectedNode.id).map(node => (
                        <option key={node.id} value={node.id}>{node.type}: {getNodeLabel(node, allAssets).slice(0, 24)}</option>
                      ))}
                    </select>
                  </label>
                  <Button
                    onClick={clearSelectedOutgoingConnection}
                    size="sm"
                    variant="ghost"
                    disabled={!selectedThenConnection && !selectedElseConnection}
                    className="w-full"
                  >
                    Clear Branches
                  </Button>
                </>
              ) : selectedSubMenuNode ? (
                <>
                  {(selectedSubMenuNode.options || []).map(option => {
                    const connection = selectedSubMenuOptionConnections.get(option.id);
                    return (
                      <label key={option.id} className="block text-xs">
                        {option.text || option.id}
                        <select
                          value={connection?.to.nodeId || ''}
                          onChange={event => {
                            if (event.target.value) connectSelectedNodeTo(event.target.value, option.id);
                            else clearSelectedOutgoingConnectionPort(option.id);
                          }}
                          className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                        >
                          <option value="">None</option>
                          {nodes.filter(node => node.id !== selectedNode.id).map(node => (
                            <option key={node.id} value={node.id}>{node.type}: {getNodeLabel(node, allAssets).slice(0, 24)}</option>
                          ))}
                        </select>
                      </label>
                    );
                  })}
                  <Button
                    onClick={clearSelectedOutgoingConnection}
                    size="sm"
                    variant="ghost"
                    disabled={!connections.some(connection => connection.from.nodeId === selectedSubMenuNode.id)}
                    className="w-full"
                  >
                    Clear Options
                  </Button>
                </>
              ) : (
                <>
                  <label className="block text-xs">
                    Next node
                    <select
                      value={selectedOutgoingConnection?.to.nodeId || ''}
                      onChange={event => {
                        if (event.target.value) connectSelectedNodeTo(event.target.value);
                        else clearSelectedOutgoingConnectionPort();
                      }}
                      className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                    >
                      <option value="">None</option>
                      {nodes
                        .filter(node => node.id !== selectedNode.id)
                        .map(node => (
                          <option key={node.id} value={node.id}>
                            {node.type}: {getNodeLabel(node, allAssets).slice(0, 24)}
                          </option>
                        ))}
                    </select>
                  </label>
                  <Button
                    onClick={clearSelectedOutgoingConnection}
                    size="sm"
                    variant="ghost"
                    disabled={!selectedOutgoingConnection}
                    className="w-full"
                  >
                    Clear Connection
                  </Button>
                </>
              )}
            </div>
          )}

          <Button onClick={deleteSelectedNode} size="sm" variant="danger" disabled={!selectedNode || selectedNode.type === 'Start'} className="w-full">
            Delete Node
          </Button>
        </aside>
      </div>

      {isPickerOpen && selectedPresentationNode && (
        <AssetPickerModal
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSelectAsset={updateSelectedPresentation}
          assetTypeToPick="msx2presentation"
          allAssets={allAssets}
          currentSelectedId={selectedPresentationNode.presentationAssetId || null}
        />
      )}
    </Panel>
  );
};
