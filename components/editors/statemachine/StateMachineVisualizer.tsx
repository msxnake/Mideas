import React, { useEffect } from 'react';
import { 
  ReactFlow,
  MiniMap, 
  Controls, 
  Background, 
  useNodesState,
  useEdgesState,
  Connection,
  Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { StateMachine, StateMachineState } from '../../../statemachine.types';

interface StateMachineVisualizerProps {
  stateMachine: StateMachine;
  onNodePositionChange: (nodeId: string, position: { x: number, y: number }) => void;
  onConnect: (connection: Connection) => void;
}

const StateMachineVisualizer: React.FC<StateMachineVisualizerProps> = ({ 
  stateMachine, 
  onNodePositionChange,
  onConnect
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const newNodes = stateMachine.states.map((state, index) => ({
      id: state.id,
      type: 'default',
      data: { label: state.name },
      position: state.position || { x: (index % 5) * 150, y: Math.floor(index / 5) * 100 },
    }));
    setNodes(newNodes);

    const newEdges = stateMachine.transitions.map(transition => ({
      id: `e${transition.fromStateId}-${transition.toStateId}`,
      source: transition.fromStateId,
      target: transition.toStateId,
      animated: true,
      label: 'transition' // TODO: Display condition info
    }));
    setEdges(newEdges);
  }, [stateMachine]);

  const handleNodeDragStop = (event: React.MouseEvent, node: Node) => {
    onNodePositionChange(node.id, node.position);
  };

  return (
    <div style={{ height: '100%' }}>
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onConnect={onConnect}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};

export default StateMachineVisualizer;
