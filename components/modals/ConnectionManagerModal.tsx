import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { WorldMapScreenNode, WorldMapConnection, ConnectionDirection } from '../../types';

interface ConnectionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: WorldMapScreenNode | null;
  allNodes: WorldMapScreenNode[];
  connections: WorldMapConnection[];
  onUpdateConnections: (connections: WorldMapConnection[]) => void;
}

export const ConnectionManagerModal: React.FC<ConnectionManagerModalProps> = ({
  isOpen,
  onClose,
  node,
  allNodes,
  connections,
  onUpdateConnections,
}) => {
  const [pendingChanges, setPendingChanges] = useState<WorldMapConnection[]>([]);

  useEffect(() => {
    if (isOpen) {
      setPendingChanges([...connections]);
    }
  }, [isOpen, connections]);

  if (!isOpen || !node) return null;

  const handleProceed = () => {
    onUpdateConnections(pendingChanges);
    onClose();
  };

  const getDirectionStatus = (direction: ConnectionDirection) => {
    const gridSize = 40; // Assuming a default grid size, this should ideally be passed in
    const oppositeDirMap: Record<ConnectionDirection, ConnectionDirection> = { north: 'south', south: 'north', east: 'west', west: 'east' };

    let targetX = node.position.x;
    let targetY = node.position.y;

    switch (direction) {
      case 'north': targetY -= gridSize; break;
      case 'south': targetY += gridSize; break;
      case 'west':  targetX -= gridSize; break;
      case 'east':  targetX += gridSize; break;
    }

    const adjacentNode = allNodes.find(n => n.position.x === targetX && n.position.y === targetY);
    if (!adjacentNode) {
      return { adjacentNode: null, connection: null, isConnected: false };
    }

    const connection = pendingChanges.find(c =>
      (c.fromNodeId === node.id && c.toNodeId === adjacentNode.id && c.fromDirection === direction) ||
      (c.toNodeId === node.id && c.fromNodeId === adjacentNode.id && c.toDirection === direction)
    );

    return { adjacentNode, connection, isConnected: !!connection };
  };

  const handleDirectionClick = (direction: ConnectionDirection) => {
    const { adjacentNode, connection, isConnected } = getDirectionStatus(direction);
    if (!adjacentNode) return;

    if (isConnected && connection) {
      setPendingChanges(prev => prev.filter(c => c.id !== connection.id));
    } else {
      const newConnection: WorldMapConnection = {
        id: `wmconn_modal_${Date.now()}`,
        fromNodeId: node.id,
        fromDirection: direction,
        toNodeId: adjacentNode.id,
        toDirection: { north: 'south', south: 'north', east: 'west', west: 'east' }[direction],
      };
      setPendingChanges(prev => [...prev, newConnection]);
    }
  };

  const renderDirectionButton = (direction: ConnectionDirection) => {
    const { adjacentNode, isConnected } = getDirectionStatus(direction);
    const label = direction.charAt(0).toUpperCase() + direction.slice(1);

    if (!adjacentNode) {
      return <Button variant="secondary" disabled>{label}</Button>;
    }

    if (isConnected) {
      return <Button variant="danger" onClick={() => handleDirectionClick(direction)}>Disconnect {label}</Button>;
    }

    return <Button variant="primary" onClick={() => handleDirectionClick(direction)}>Connect {label}</Button>;
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="connectionManagerModalTitle"
    >
      <div
        className="bg-msx-panelbg p-6 rounded-lg shadow-xl w-full max-w-sm animate-slideIn pixel-font"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="connectionManagerModalTitle" className="text-xl text-msx-highlight mb-4 text-center">
          Manage Connections for <br/>"{node.name}"
        </h2>
        <div className="grid grid-cols-3 grid-rows-3 gap-2 w-64 h-48 mx-auto my-4">
          <div className="col-start-2 row-start-1 flex justify-center items-center">
            {renderDirectionButton('north')}
          </div>
          <div className="col-start-1 row-start-2 flex justify-center items-center">
            {renderDirectionButton('west')}
          </div>
          <div className="col-start-3 row-start-2 flex justify-center items-center">
            {renderDirectionButton('east')}
          </div>
          <div className="col-start-2 row-start-3 flex justify-center items-center">
            {renderDirectionButton('south')}
          </div>
        </div>
        <div className="flex justify-end space-x-2 mt-6">
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button onClick={handleProceed} variant="primary">
            Proceed
          </Button>
        </div>
      </div>
    </div>
  );
};
