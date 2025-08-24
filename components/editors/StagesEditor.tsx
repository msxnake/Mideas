import React from 'react';
import { MainMenuConfig, ProjectAsset } from '../../types';

interface StagesEditorProps {
    mainMenuConfig: MainMenuConfig;
    onUpdateMainMenuConfig: (updater: MainMenuConfig | ((prev: MainMenuConfig) => MainMenuConfig)) => void;
    allAssets: ProjectAsset[];
}

import React, { useState, useRef, useLayoutEffect } from 'react';
import { MainMenuConfig, ProjectAsset, StageNode } from '../../types';
import { Button } from '../common/Button';
import { PlusCircleIcon } from '../icons/MsxIcons';

interface StagesEditorProps {
    mainMenuConfig: MainMenuConfig;
    onUpdateMainMenuConfig: (updater: MainMenuConfig | ((prev: MainMenuConfig) => MainMenuConfig)) => void;
    allAssets: ProjectAsset[];
}

export const StagesEditor: React.FC<StagesEditorProps> = ({ mainMenuConfig, onUpdateMainMenuConfig, allAssets }) => {
    const [draggingNode, setDraggingNode] = useState<{ id: string; offset: { x: number; y: number } } | null>(null);
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
    }, [mainMenuConfig.stagesGraph.nodes, mainMenuConfig.options]);

    if (!mainMenuConfig.stagesGraph) {
        setTimeout(() => {
            onUpdateMainMenuConfig(prev => ({
                ...prev,
                stagesGraph: {
                    nodes: [],
                    connections: [],
                    panOffset: { x: 0, y: 0 },
                    zoomLevel: 1,
                }
            }));
        }, 0);
        return <div>Loading Stages...</div>;
    }

    const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
        const node = mainMenuConfig.stagesGraph.nodes.find(n => n.id === nodeId);
        if (!node) return;
        e.stopPropagation();
        setDraggingNode({
            id: nodeId,
            offset: {
                x: e.clientX - node.position.x,
                y: e.clientY - node.position.y,
            },
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggingNode) return;
        const newX = e.clientX - draggingNode.offset.x;
        const newY = e.clientY - draggingNode.offset.y;

        onUpdateMainMenuConfig(prev => {
            const newNodes = prev.stagesGraph.nodes.map(n =>
                n.id === draggingNode.id ? { ...n, position: { x: newX, y: newY } } : n
            );
            return { ...prev, stagesGraph: { ...prev.stagesGraph, nodes: newNodes } };
        });
    };

    const handleMouseUp = () => {
        setDraggingNode(null);
    };

    const handleAddNode = () => {
        const newNode: StageNode = {
            id: `node_${Date.now()}`,
            type: 'SubMenu',
            name: 'New Submenu',
            position: { x: 350, y: 150 },
            options: [],
        };
        onUpdateMainMenuConfig(prev => ({
            ...prev,
            stagesGraph: {
                ...prev.stagesGraph,
                nodes: [...prev.stagesGraph.nodes, newNode],
            },
        }));
    };

    const handleAddConnection = () => {
        if (mainMenuConfig.options.length === 0 || mainMenuConfig.stagesGraph.nodes.length === 0) return;
        const fromOptionId = mainMenuConfig.options[0].id;
        const toNodeId = mainMenuConfig.stagesGraph.nodes[0].id;

        // Avoid duplicate connections
        if (mainMenuConfig.stagesGraph.connections.some(c => c.fromOptionId === fromOptionId && c.toNodeId === toNodeId)) return;

        const newConnection = { id: `conn_${Date.now()}`, fromOptionId, toNodeId };
        onUpdateMainMenuConfig(prev => ({
            ...prev,
            stagesGraph: {
                ...prev.stagesGraph,
                connections: [...prev.stagesGraph.connections, newConnection],
            },
        }));
    };

    const mainMenuNode = {
        id: 'main_menu_root',
        position: { x: 50, y: 50 },
    };

    return (
        <div
            className="w-full h-full bg-msx-panelbg-dark border border-msx-border rounded-lg relative overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            {/* Main Menu Node */}
            <div
                className="absolute bg-msx-panelbg border-2 border-msx-cyan rounded-md shadow-lg"
                style={{ left: mainMenuNode.position.x, top: mainMenuNode.position.y, width: '250px' }}
            >
                <div className="p-2 bg-msx-bgcolor-dark font-bold text-msx-textprimary rounded-t-md">
                    Main Menu
                </div>
                <div className="p-2 space-y-2">
                    {mainMenuConfig.options.map(option => (
                        <div key={option.id} className="flex items-center justify-between p-1 bg-msx-bgcolor rounded">
                            <span className="text-msx-textprimary">{option.label}</span>
                            <div
                                ref={el => elementRefs.current[option.id] = el}
                                className="w-4 h-4 bg-msx-cyan rounded-full cursor-pointer hover:ring-2 hover:ring-white"
                                title="Create Link"
                            ></div>
                        </div>
                    ))}
                    <div className="flex items-center justify-between p-1 mt-2 border-t border-msx-border pt-2">
                        <span className="text-msx-textsecondary italic">Start Game</span>
                        <div className="w-4 h-4 bg-msx-green rounded-full cursor-pointer hover:ring-2 hover:ring-white" title="Game Flow Start"></div>
                    </div>
                </div>
            </div>

            {/* Render other nodes from stagesGraph.nodes */}
            {mainMenuConfig.stagesGraph.nodes.map(node => (
                <div
                    key={node.id}
                    ref={el => elementRefs.current[node.id] = el}
                    className="absolute bg-msx-panelbg border border-msx-border rounded-md shadow-lg"
                    style={{ left: node.position.x, top: node.position.y, width: '220px' }}
                    onMouseDown={e => handleMouseDown(e, node.id)}
                >
                    <div className="p-2 bg-msx-bgcolor-dark font-bold text-msx-textprimary rounded-t-md cursor-move">
                        {node.type === 'SubMenu' ? node.name : 'World Link'}
                    </div>
                    <div className="p-2 text-msx-textprimary">
                        {node.type === 'WorldLink' && `World: ${allAssets.find(a => a.id === node.worldAssetId)?.name || 'None'}`}
                        {node.type === 'SubMenu' && `${node.options?.length || 0} options`}
                    </div>
                </div>
            ))}

            {/* SVG Layer for Connections */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#00a8a8" />
                    </marker>
                </defs>
                {mainMenuConfig.stagesGraph.connections.map(conn => {
                    const fromPos = elementPositions[conn.fromOptionId];
                    const toPos = elementPositions[conn.toNodeId];
                    if (!fromPos || !toPos) return null;
                    return (
                        <line
                            key={conn.id}
                            x1={fromPos.x + 16} y1={fromPos.y + 8}
                            x2={toPos.x} y2={toPos.y + 30}
                            stroke="#00a8a8" strokeWidth="2"
                            markerEnd="url(#arrowhead)"
                        />
                    );
                })}
            </svg>

            {/* UI Buttons */}
            <div className="absolute bottom-4 right-4 z-10 flex space-x-2">
                <Button onClick={handleAddConnection} variant="secondary" size="sm">Add Conn</Button>
                <Button onClick={handleAddNode} icon={<PlusCircleIcon />} variant="primary">Add Node</Button>
            </div>
        </div>
    );
};
