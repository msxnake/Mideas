import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  Msx2GameFlowConnection,
  Msx2GameFlowGraph,
  Msx2GameFlowNode,
  Msx2GameFlowScreen5PresentationNode,
  Msx2Screen5PresentationConfig,
  ProjectAsset,
} from '../../types';
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
  if (node.type === 'Transition') return node.effect === 'fade_to_black' ? 'Fade to Black' : 'CLS';
  const asset = allAssets.find(a => a.id === node.presentationAssetId && a.type === 'msx2presentation');
  return asset?.name || 'SCREEN 5 Presentation';
};

const getNodeColor = (node: Msx2GameFlowNode): string => {
  if (node.type === 'Start') return 'hsl(185, 62%, 32%)';
  if (node.type === 'Screen5Presentation') return 'hsl(168, 58%, 30%)';
  if (node.type === 'Transition') return 'hsl(42, 58%, 35%)';
  return 'hsl(330, 42%, 34%)';
};

const makeConnection = (fromNodeId: string, toNodeId: string): Msx2GameFlowConnection => ({
  id: `msx2_gfc_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
  from: { nodeId: fromNodeId },
  to: { nodeId: toNodeId },
});

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
  const selectedNode = nodes.find(node => node.id === selectedNodeId) || null;
  const selectedPresentationNode = selectedNode?.type === 'Screen5Presentation'
    ? selectedNode as Msx2GameFlowScreen5PresentationNode
    : null;
  const firstPresentationNode = nodes.find(node => node.type === 'Screen5Presentation') as Msx2GameFlowScreen5PresentationNode | undefined;
  const previewPresentationNode = selectedPresentationNode || firstPresentationNode || null;

  const presentationAssets = useMemo(
    () => allAssets.filter(asset => asset.type === 'msx2presentation'),
    [allAssets]
  );

  const activePresentationAsset = useMemo(() => {
    const selectedAssetId = previewPresentationNode?.presentationAssetId;
    const selectedAsset = selectedAssetId
      ? allAssets.find(asset => asset.id === selectedAssetId && asset.type === 'msx2presentation')
      : undefined;
    return selectedAsset || presentationAssets[0];
  }, [allAssets, presentationAssets, previewPresentationNode?.presentationAssetId]);
  const hasAssignedPresentation = !!previewPresentationNode?.presentationAssetId;
  const previewLabel = hasAssignedPresentation
    ? `Assigned SCREEN 5: ${activePresentationAsset?.name || 'Missing asset'}`
    : activePresentationAsset
      ? `Previewing first available SCREEN 5: ${activePresentationAsset.name}`
      : 'No SCREEN 5 asset assigned';

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    const config = activePresentationAsset?.data as Msx2Screen5PresentationConfig | undefined;
    if (!canvas || !config?.pixels || !config?.palette) return;
    drawMsx2Screen5PresentationPreview(canvas, config.pixels, config.palette, 1);
  }, [activePresentationAsset]);

  const updateNodes = (nextNodes: Msx2GameFlowNode[]) => onUpdate({ nodes: nextNodes });

  const addNode = (type: 'Screen5Presentation' | 'Transition' | 'End') => {
    const previousNode = selectedNode || nodes[nodes.length - 1];
    const x = previousNode ? previousNode.position.x + 230 : 60;
    const y = previousNode ? previousNode.position.y : 80;
    const id = `msx2_gf_${type.toLowerCase()}_${Date.now()}`;
    const newNode: Msx2GameFlowNode =
      type === 'Screen5Presentation'
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
          : { id, type, position: { x, y } };

    const nextConnections = previousNode && previousNode.type !== 'End'
      ? [...connections.filter(conn => conn.from.nodeId !== previousNode.id), makeConnection(previousNode.id, id)]
      : connections;
    onUpdate({ nodes: [...nodes, newNode], connections: nextConnections });
    setSelectedNodeId(id);
  };

  const applyIntroTemplate = () => {
    const startNode = nodes.find(node => node.type === 'Start') || nodes[0];
    if (!startNode) return;
    const presentationNodeId = `msx2_gf_screen5_${Date.now()}`;
    const endNodeId = `msx2_gf_end_${Date.now()}`;
    const presentationNode: Msx2GameFlowScreen5PresentationNode = {
      id: presentationNodeId,
      type: 'Screen5Presentation',
      position: { x: startNode.position.x + 230, y: startNode.position.y },
      presentationAssetId: presentationAssets[0]?.id,
      waitForKey: true,
      waitFrames: 0,
    };
    const endNode: Msx2GameFlowNode = {
      id: endNodeId,
      type: 'End',
      position: { x: startNode.position.x + 460, y: startNode.position.y },
    };
    onUpdate({
      nodes: [startNode, presentationNode, endNode],
      connections: [
        makeConnection(startNode.id, presentationNodeId),
        makeConnection(presentationNodeId, endNodeId),
      ],
      startNodeId: startNode.id,
    });
    setSelectedNodeId(presentationNodeId);
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

  const selectedOutgoingConnection = selectedNode
    ? connections.find(connection => connection.from.nodeId === selectedNode.id)
    : undefined;

  const connectSelectedNodeTo = (toNodeId: string) => {
    if (!selectedNode || selectedNode.type === 'End' || selectedNode.id === toNodeId) return;
    const targetNode = nodes.find(node => node.id === toNodeId);
    if (!targetNode) return;
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
        <Button onClick={() => addNode('Screen5Presentation')} size="sm" icon={<PlusCircleIcon className="w-4 h-4" />}>
          Add SCREEN 5
        </Button>
        <Button onClick={() => addNode('Transition')} size="sm" icon={<PlusCircleIcon className="w-4 h-4" />}>
          Add Transition
        </Button>
        <Button onClick={() => addNode('End')} size="sm" icon={<PlusCircleIcon className="w-4 h-4" />}>
          Add End
        </Button>
        <Button onClick={autoLayout} size="sm" variant="primary" icon={<ArrowsPointingOutIcon className="w-4 h-4" />}>
          Auto Layout
        </Button>
        <Button onClick={applyIntroTemplate} size="sm" variant="secondary">
          Intro Template
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

          {selectedNode && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Connection</h3>
              {selectedNode.type === 'End' ? (
                <p className="text-xs text-msx-textsecondary">End nodes do not have outgoing connections.</p>
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
