import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  Msx2GameFlowConnection,
  Msx2GameFlowGraph,
  Msx2GameFlowGlobalsNode,
  Msx2GameFlowIfThenElseNode,
  Msx2GameFlowNode,
  Msx2GameFlowPurpose,
  Msx2GameFlowScreen5PresentationNode,
  Msx2GameFlowSubMenuNode,
  Msx2GameFlowTextNode,
  Msx2Screen5PresentationConfig,
  ProjectAsset,
} from '../../types';
import type { MideasGlobalVariable } from '../../constants';
import { Button } from '../common/Button';
import { Panel } from '../common/Panel';
import { AssetPickerModal } from '../modals/AssetPickerModal';
import { ArrowsPointingOutIcon, PlusCircleIcon } from '../icons/MsxIcons';
import { drawMsx2Screen5PresentationPreview } from '../utils/msx2Screen5PresentationUtils';

const NODE_WIDTH = 168;
const NODE_HEIGHT = 76;

interface Msx2GameFlowEditorProps {
  gameFlowGraph: Msx2GameFlowGraph;
  onUpdate: (data: Partial<Msx2GameFlowGraph>) => void;
  allAssets: ProjectAsset[];
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
}

const getNodeLabel = (node: Msx2GameFlowNode, allAssets: ProjectAsset[]): string => {
  if (node.type === 'Start') return 'Start MSX2';
  if (node.type === 'End') return 'End';
  if (node.type === 'Waypoint') return 'Waypoint';
  if (node.type === 'Restart') return 'Restart ROM';
  if (node.type === 'Globals') return node.title || `${node.variables?.length || 0} global set`;
  if (node.type === 'SubMenu') return node.title || 'SubMenu';
  if (node.type === 'Text') return node.title || 'Text';
  if (node.type === 'IfThenElse') return `${node.variableName || 'var'} ${node.operator || '=='} ${node.compareValue || '0'}`;
  if (node.type === 'Transition') return node.effect === 'fade_to_black' ? 'Fade to Black' : 'CLS';
  const asset = allAssets.find(a => a.id === node.presentationAssetId && a.type === 'msx2presentation');
  return asset?.name || 'SCREEN 5 Presentation';
};

const getNodeColor = (node: Msx2GameFlowNode): string => {
  if (node.type === 'Start') return 'hsl(185, 62%, 32%)';
  if (node.type === 'Globals') return 'hsl(265, 42%, 36%)';
  if (node.type === 'Screen5Presentation') return 'hsl(168, 58%, 30%)';
  if (node.type === 'SubMenu') return 'hsl(215, 52%, 34%)';
  if (node.type === 'Text') return 'hsl(188, 46%, 34%)';
  if (node.type === 'Waypoint') return 'hsl(215, 34%, 35%)';
  if (node.type === 'IfThenElse') return 'hsl(28, 58%, 36%)';
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
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const nodes = gameFlowGraph.nodes || [];
  const connections = gameFlowGraph.connections || [];
  const flowPurpose = gameFlowGraph.purpose || 'screen5-presentation';
  const isScreen5PresentationFlow = flowPurpose === 'screen5-presentation';
  const selectedNode = nodes.find(node => node.id === selectedNodeId) || null;
  const selectedPresentationNode = selectedNode?.type === 'Screen5Presentation'
    ? selectedNode as Msx2GameFlowScreen5PresentationNode
    : null;
  const selectedGlobalsNode = selectedNode?.type === 'Globals'
    ? selectedNode as Msx2GameFlowGlobalsNode
    : null;
  const selectedSubMenuNode = selectedNode?.type === 'SubMenu'
    ? selectedNode as Msx2GameFlowSubMenuNode
    : null;
  const selectedTextNode = selectedNode?.type === 'Text'
    ? selectedNode as Msx2GameFlowTextNode
    : null;
  const selectedIfThenElseNode = selectedNode?.type === 'IfThenElse'
    ? selectedNode as Msx2GameFlowIfThenElseNode
    : null;
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
    if (!isScreen5PresentationFlow) {
      if (nodes.some(node => node.type === 'Screen5Presentation')) {
        issues.push('SCREEN 4 runtime flows should not include SCREEN 5 Presentation nodes.');
      }
      for (const node of nodes) {
        if (node.type === 'SubMenu') {
          if (!node.title?.trim()) issues.push('SubMenu node must include a title.');
          if (!Array.isArray(node.options) || node.options.length === 0) {
            issues.push('SubMenu node must include at least one option.');
          }
          for (const option of node.options || []) {
            if (!option.text?.trim()) issues.push('SubMenu options must include text.');
            if (!connections.some(connection => connection.from.nodeId === node.id && connection.from.sourceId === option.id)) {
              issues.push(`SubMenu option "${option.text || option.id}" needs an outgoing connection.`);
            }
          }
        } else if (node.type !== 'Start' && node.type !== 'Waypoint' && node.type !== 'Globals' && node.type !== 'Transition' && node.type !== 'Restart' && node.type !== 'End') {
          issues.push(`${node.type} is not supported by the SCREEN 4 runtime purpose yet.`);
        }
      }
      if (!nodes.some(node => node.type === 'SubMenu')) {
        issues.push('SCREEN 4 runtime GameFlow is ready for SubMenu nodes.');
      }
      return Array.from(new Set(issues));
    }
    const nodeIds = new Set(nodes.map(node => node.id));
    const startNode = nodes.find(node => node.id === gameFlowGraph.startNodeId) || nodes.find(node => node.type === 'Start');
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
      }
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
      if (outgoingCount > 1) {
        issues.push(`${node.type} has more than one outgoing connection.`);
      }
    }

    return Array.from(new Set(issues));
  }, [connections, gameFlowGraph.startNodeId, isScreen5PresentationFlow, nodes, presentationAssets]);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    const config = activePresentationAsset?.data as Msx2Screen5PresentationConfig | undefined;
    if (!canvas) return;
    if (!config?.pixels || !config?.palette) {
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    drawMsx2Screen5PresentationPreview(canvas, config.pixels, config.palette, 1);
  }, [activePresentationAsset]);

  const updateNodes = (nextNodes: Msx2GameFlowNode[]) => onUpdate({ nodes: nextNodes });

  const updateFlowPurpose = (purpose: Msx2GameFlowPurpose) => {
    onUpdate({ purpose });
  };

  const addNode = (type: 'Globals' | 'Screen5Presentation' | 'SubMenu' | 'Text' | 'Waypoint' | 'IfThenElse' | 'Transition' | 'Restart' | 'End') => {
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
    const endNodeId = `msx2_gf_screen4_end_${Date.now()}`;
    const startOptionId = `option_start_${Date.now()}`;
    const subMenuNode: Msx2GameFlowNode = {
      id: subMenuNodeId,
      type: 'SubMenu',
      position: { x: startNode.position.x + 230, y: startNode.position.y },
      title: 'Main Menu',
      options: [
        { id: startOptionId, text: 'START' },
      ],
      backgroundScreenAssetId: screen4Assets[0]?.id,
    };
    const endNode: Msx2GameFlowNode = {
      id: endNodeId,
      type: 'End',
      position: { x: startNode.position.x + 460, y: startNode.position.y },
    };
    onUpdate({
      purpose: 'screen4-runtime',
      nodes: [startNode, subMenuNode, endNode],
      connections: [
        makeConnection(startNode.id, subMenuNodeId),
        makeConnection(subMenuNodeId, endNodeId, startOptionId),
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

  const updateSelectedTransition = (effect: 'cls' | 'fade_to_black') => {
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

  const deleteSelectedNode = () => {
    if (!selectedNode || selectedNode.type === 'Start') return;
    onUpdate({
      nodes: nodes.filter(node => node.id !== selectedNode.id),
      connections: connections.filter(conn => conn.from.nodeId !== selectedNode.id && conn.to.nodeId !== selectedNode.id),
    });
    setSelectedNodeId(null);
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
    <Panel title="MSX2 Game Flow" className="flex-grow flex flex-col">
      <div className="flex flex-wrap items-center gap-2 p-2 border-b border-msx-border bg-msx-panelbg">
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
        <Button onClick={() => addNode('Text')} size="sm" icon={<PlusCircleIcon className="w-4 h-4" />}>
          Add Text
        </Button>
        <Button onClick={() => addNode('IfThenElse')} size="sm" icon={<PlusCircleIcon className="w-4 h-4" />}>
          If/Then/Else
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

      <div className="min-h-0 flex-grow grid grid-cols-[1fr_300px]">
        <div className="relative overflow-auto bg-[#101018]">
          <svg width="1200" height="520" className="block">
            <defs>
              <marker id="msx2FlowArrow" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="hsl(150, 60%, 60%)" />
              </marker>
            </defs>
            {connections.map(conn => {
              const from = nodes.find(node => node.id === conn.from.nodeId);
              const to = nodes.find(node => node.id === conn.to.nodeId);
              if (!from || !to) return null;
              const x1 = from.position.x + NODE_WIDTH;
              const y1 = from.position.y + NODE_HEIGHT / 2;
              const x2 = to.position.x;
              const y2 = to.position.y + NODE_HEIGHT / 2;
              const mid = Math.max(60, (x2 - x1) / 2);
              return (
                <path
                  key={conn.id}
                  d={`M ${x1} ${y1} C ${x1 + mid} ${y1}, ${x2 - mid} ${y2}, ${x2} ${y2}`}
                  stroke="hsl(150, 60%, 60%)"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#msx2FlowArrow)"
                />
              );
            })}
            {nodes.map(node => {
              const isSelected = selectedNodeId === node.id;
              return (
                <g key={node.id} transform={`translate(${node.position.x}, ${node.position.y})`} onClick={() => setSelectedNodeId(node.id)} style={{ cursor: 'pointer' }}>
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
                </g>
              );
            })}
          </svg>
        </div>

        <aside className="border-l border-msx-border bg-msx-bgcolor p-3 space-y-3 overflow-auto">
          <div>
            <h3 className="text-sm font-semibold mb-2">Node</h3>
            <p className="text-xs text-msx-textsecondary">{selectedNode ? selectedNode.type : 'Select a node'}</p>
          </div>

          <div className="space-y-2">
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

          {selectedPresentationNode && (
            <div className="space-y-2">
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

          {selectedNode?.type === 'Transition' && (
            <div className="space-y-2">
              <label className="block text-xs">
                Effect
                <select
                  value={selectedNode.effect}
                  onChange={event => updateSelectedTransition(event.target.value as 'cls' | 'fade_to_black')}
                  className="mt-1 w-full bg-msx-panelbg border border-msx-border rounded p-1"
                >
                  <option value="cls">CLS</option>
                  <option value="fade_to_black">Fade to black</option>
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
                SCREEN 4 export currently loads the background and waits for a key; option selection/branching is the next runtime slice.
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
