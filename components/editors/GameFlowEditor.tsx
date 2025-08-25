import React, { useState } from 'react';
import { GameFlow, ProjectAsset, GameFlowNode, SubMenu, SubMenuOption } from '../../types';
import { AssetPickerModal } from '../modals/AssetPickerModal';

interface GameFlowEditorProps {
    gameFlow: GameFlow;
    onUpdateGameFlow: (updater: GameFlow | ((prev: GameFlow) => GameFlow)) => void;
    allAssets: ProjectAsset[];
}

export const GameFlowEditor: React.FC<GameFlowEditorProps> = ({ gameFlow, onUpdateGameFlow, allAssets }) => {
    const [draggingNode, setDraggingNode] = useState<{ id: string; offset: { x: number; y: number } } | null>(null);
    const [assetPickerState, setAssetPickerState] = useState<{ isOpen: boolean; onSelect: (assetId: string) => void; } | null>(null);
    const [elementPositions, setElementPositions] = useState<Record<string, { x: number; y: number }>>({});
    const elementRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useLayoutEffect(() => {
        const newPositions: Record<string, { x: number; y: number }> = {};
        Object.keys(elementRefs.current).forEach(key => {
            const el = elementRefs.current[key];
            if (el) {
                const rect = el.getBoundingClientRect();
                const parentRect = el.offsetParent?.getBoundingClientRect() || { left: 0, top: 0 };
                newPositions[key] = { x: rect.left - parentRect.left, y: rect.top - parentRect.top };
            }
        });
        setElementPositions(newPositions);
    }, [gameFlow]);

    const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
        const node = gameFlow.nodes.find(n => n.id === nodeId);
        if (!node) return;
        e.stopPropagation();
        setDraggingNode({
            id: nodeId,
            offset: { x: e.clientX - node.position.x, y: e.clientY - node.position.y },
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggingNode) return;
        const newX = e.clientX - draggingNode.offset.x;
        const newY = e.clientY - draggingNode.offset.y;

        onUpdateGameFlow(prev => ({
            ...prev,
            nodes: prev.nodes.map(n =>
                n.id === draggingNode.id ? { ...n, position: { x: newX, y: newY } } : n
            ),
        }));
    };

    const handleMouseUp = () => {
        setDraggingNode(null);
    };

    const handleAddSubMenuOption = (submenuId: string) => {
        onUpdateGameFlow(prev => {
            const parentNode = prev.nodes.find(n => n.link.type === 'SubMenu' && n.link.submenuId === submenuId);
            const nextNodeId = `flownode_${Date.now()}`;
            const newOptionId = `option_${Date.now()}`;

            const newFlowNode: GameFlowNode = {
                id: nextNodeId,
                position: { x: (parentNode?.position.x || 0) + 300, y: parentNode?.position.y || 50 },
                link: { type: 'Unlinked' },
            };

            const newOption: SubMenuOption = {
                id: newOptionId,
                label: "New Option",
                nextNodeId: nextNodeId,
            };

            const newSubmenus = prev.submenus.map(s =>
                s.id === submenuId ? { ...s, options: [...s.options, newOption] } : s
            );

            return {
                ...prev,
                nodes: [...prev.nodes, newFlowNode],
                submenus: newSubmenus,
            };
        });
    };

    const handleLinkToSubMenu = (nodeId: string) => {
        onUpdateGameFlow(prev => {
            const newSubMenuId = `submenu_${Date.now()}`;
            const newSubMenu: SubMenu = {
                id: newSubMenuId,
                name: "New SubMenu",
                options: [],
            };

            const newNodes = prev.nodes.map(n =>
                n.id === nodeId ? { ...n, link: { type: 'SubMenu', submenuId: newSubMenuId } } : n
            );

            return {
                ...prev,
                nodes: newNodes,
                submenus: [...prev.submenus, newSubMenu],
            };
        });
    };

    const handleLinkToWorld = (nodeId: string) => {
        setAssetPickerState({
            isOpen: true,
            onSelect: (worldAssetId) => {
                onUpdateGameFlow(prev => {
                    const parentNode = prev.nodes.find(n => n.id === nodeId);
                    const onCompleteNodeId = `flownode_${Date.now()}`;
                    const newOnCompleteNode: GameFlowNode = {
                        id: onCompleteNodeId,
                        position: { x: (parentNode?.position.x || 0) + 300, y: (parentNode?.position.y || 50) + 50 },
                        link: { type: 'Unlinked' },
                    };

                    const newNodes = prev.nodes.map(n =>
                        n.id === nodeId ? { ...n, link: { type: 'World', worldAssetId, onCompleteNodeId } } : n
                    );

                    return {
                        ...prev,
                        nodes: [...newNodes, newOnCompleteNode],
                    };
                });
                setAssetPickerState(null);
            }
        });
    };

    const getLinkText = (node: GameFlowNode) => {
        switch (node.link.type) {
            case 'Unlinked': return <span className="text-msx-danger">Unlinked</span>;
            case 'World':
                const world = allAssets.find(a => a.id === node.link.worldAssetId);
                return `World: ${world?.name || '???'}`;
            case 'SubMenu':
                const submenu = gameFlow.submenus.find(s => s.id === node.link.submenuId);
                return `SubMenu: ${submenu?.name || '???'}`;
        }
    }

    return (
        <div
            className="w-full h-full bg-msx-panelbg-dark border border-msx-border rounded-lg relative overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            {gameFlow.nodes.map(node => {
                const isRoot = node.id === gameFlow.rootNodeId;
                return (
                    <div
                        key={node.id}
                        className={`absolute bg-msx-panelbg border rounded-md shadow-lg w-64 ${isRoot ? 'border-msx-highlight' : 'border-msx-border'}`}
                        style={{ left: node.position.x, top: node.position.y }}
                        onMouseDown={(e) => handleMouseDown(e, node.id)}
                    >
                        <div className={`p-2 font-bold text-msx-textprimary rounded-t-md cursor-move ${isRoot ? 'bg-msx-highlight/20' : 'bg-msx-bgcolor-dark'}`}>
                            {isRoot ? 'Iniciar Partida' : `Node ${node.id}`}
                        </div>
                        <div className="p-2 text-sm text-msx-textprimary space-y-2">
                            <div>
                                <strong>Link:</strong> {getLinkText(node)}
                            </div>
                            {node.link.type === 'Unlinked' && (
                                <div className="flex space-x-2">
                                    <button onClick={() => handleLinkToWorld(node.id)} className="text-xs bg-msx-accent text-white px-2 py-1 rounded hover:bg-opacity-80">Link World</button>
                                    <button onClick={() => handleLinkToSubMenu(node.id)} className="text-xs bg-msx-accent text-white px-2 py-1 rounded hover:bg-opacity-80">Link SubMenu</button>
                                </div>
                            )}
                        </div>
                        {node.link.type === 'SubMenu' && (() => {
                            const submenu = gameFlow.submenus.find(s => s.id === node.link.submenuId);
                            if (!submenu) return null;
                            return (
                                <div className="border-t border-msx-border p-2 space-y-2">
                                    <h4 className="font-bold text-xs text-msx-textsecondary">SUBMENU OPTIONS</h4>
                                    {submenu.options.map(opt => (
                                        <div key={opt.id} className="text-xs flex justify-between items-center bg-msx-bgcolor p-1 rounded">
                                            <span>{opt.label}</span>
                                            <div ref={el => elementRefs.current[opt.id] = el} className="w-3 h-3 bg-msx-cyan rounded-full cursor-pointer" title="Output" />
                                        </div>
                                    ))}
                                    <button onClick={() => handleAddSubMenuOption(submenu.id)} className="text-xs bg-msx-accent text-white px-2 py-1 rounded hover:bg-opacity-80 w-full mt-1">Add Option</button>
                                </div>
                            )
                        })()}
                        {node.link.type === 'World' && (
                            <div className="border-t border-msx-border p-2">
                                <div className="text-xs flex justify-between items-center">
                                    <span className="text-msx-textsecondary">On Complete</span>
                                    <div ref={el => elementRefs.current[`world_complete_${node.id}`] = el} className="w-3 h-3 bg-msx-green rounded-full cursor-pointer" title="Output on World Completion" />
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <defs>
                    <marker id="flow-arrowhead" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#00a8a8" />
                    </marker>
                </defs>
                {gameFlow.nodes.map(node => {
                    if (node.link.type === 'World') {
                        const fromPos = elementPositions[`world_complete_${node.id}`];
                        const toPos = elementPositions[node.link.onCompleteNodeId];
                        if (!fromPos || !toPos) return null;
                        return <line key={`conn-${node.id}`} x1={fromPos.x + 6} y1={fromPos.y + 6} x2={toPos.x} y2={toPos.y + 20} stroke="#00a8a8" strokeWidth="2" markerEnd="url(#flow-arrowhead)" />
                    }
                    if (node.link.type === 'SubMenu') {
                        const submenu = gameFlow.submenus.find(s => s.id === node.link.submenuId);
                        return submenu?.options.map(opt => {
                            const fromPos = elementPositions[opt.id];
                            const toPos = elementPositions[opt.nextNodeId];
                            if (!fromPos || !toPos) return null;
                            return <line key={`conn-${opt.id}`} x1={fromPos.x + 6} y1={fromPos.y + 6} x2={toPos.x} y2={toPos.y + 20} stroke="#00a8a8" strokeWidth="2" markerEnd="url(#flow-arrowhead)" />
                        })
                    }
                    return null;
                })}
            </svg>

            {assetPickerState?.isOpen && (
                <AssetPickerModal
                    isOpen={assetPickerState.isOpen}
                    onClose={() => setAssetPickerState(null)}
                    onSelectAsset={assetPickerState.onSelect}
                    assetTypeToPick="worldmap"
                    allAssets={allAssets}
                    currentSelectedId={null}
                />
            )}
        </div>
    );
};
