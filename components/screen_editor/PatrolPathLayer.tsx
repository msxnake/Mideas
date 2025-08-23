
import React, { useEffect, useRef } from 'react';
import { EntityInstance } from '../../../types';

interface PatrolPathLayerProps {
  selectedEntity: EntityInstance | null;
  gridZoom: number;
  gridCellSize: { width: number; height: number };
  gridSize: { width: number; height: number };
  onSetPatrolPath: (x: number | null, y: number | null) => void;
}

export const PatrolPathLayer: React.FC<PatrolPathLayerProps> = ({
  selectedEntity,
  gridZoom,
  gridCellSize,
  gridSize,
  onSetPatrolPath
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const hasPatrolPath =
    selectedEntity &&
    selectedEntity.patrolX !== undefined &&
    selectedEntity.patrolY !== undefined &&
    selectedEntity.patrolX !== null &&
    selectedEntity.patrolY !== null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!hasPatrolPath) {
      return;
    }

    const startX = selectedEntity.x;
    const startY = selectedEntity.y;
    const endX = selectedEntity.patrolX;
    const endY = selectedEntity.patrolY;

    const pixelStartX = (startX * gridCellSize.width + gridCellSize.width / 2) * gridZoom;
    const pixelStartY = (startY * gridCellSize.height + gridCellSize.height / 2) * gridZoom;
    const pixelEndX = (endX * gridCellSize.width + gridCellSize.width / 2) * gridZoom;
    const pixelEndY = (endY * gridCellSize.height + gridCellSize.height / 2) * gridZoom;

    ctx.strokeStyle = '#FF00FF';
    ctx.lineWidth = 2 * gridZoom;
    ctx.setLineDash([5, 3]);

    ctx.beginPath();
    ctx.moveTo(pixelStartX, pixelStartY);
    ctx.lineTo(pixelEndX, pixelEndY);
    ctx.stroke();

  }, [selectedEntity, gridZoom, gridCellSize, hasPatrolPath]);

  const handleDelete = () => {
    onSetPatrolPath(null, null);
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        width={gridSize.width * gridCellSize.width * gridZoom}
        height={gridSize.height * gridCellSize.height * gridZoom}
        className="absolute top-0 left-0 pointer-events-none"
        style={{ zIndex: 20 }}
      />
      {hasPatrolPath && (
        <div
          className="absolute"
          style={{
            left: `${(selectedEntity.patrolX * gridCellSize.width + gridCellSize.width / 2) * gridZoom}px`,
            top: `${(selectedEntity.patrolY * gridCellSize.height + gridCellSize.height / 2) * gridZoom}px`,
            zIndex: 21,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
            title="Delete Patrol Path"
          >
            X
          </button>
        </div>
      )}
    </>
  );
};
