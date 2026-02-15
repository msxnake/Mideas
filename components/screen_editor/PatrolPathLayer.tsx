
import React, { useEffect, useRef, useState } from 'react';
import { EntityInstance } from '../../types';
import { getScreenModeMetrics } from '../../utils/screenModeConfig';

/**
 * Props for the {@link PatrolPathLayer} component.
 * @category ScreenEditor
 */
interface PatrolPathLayerProps {
  /** The currently selected entity instance, or null if none is selected. */
  selectedEntity: EntityInstance | null;
  /** The current zoom level of the grid. */
  gridZoom: number;
  /** The size of a single grid cell in pixels. */
  gridCellSize: { width: number; height: number };
  /** The total size of the grid in cells. */
  gridSize: { width: number; height: number };
  /** Callback function to set or clear the patrol path for the selected entity. */
  onSetPatrolPath: (x: number | null, y: number | null) => void;
  /** The current MSX screen mode. */
  currentScreenMode: string;
}

/**
 * A React component that renders a layer to display and manage the patrol path for a selected entity.
 *
 * @param props The component props.
 * @returns A React component.
 * @category ScreenEditor
 */
export const PatrolPathLayer: React.FC<PatrolPathLayerProps> = ({
  selectedEntity,
  gridZoom,
  gridCellSize,
  gridSize,
  onSetPatrolPath,
  currentScreenMode
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showMultiScreenInfo, setShowMultiScreenInfo] = useState(false);
  const { pixelWidth, pixelHeight } = getScreenModeMetrics(currentScreenMode);
  const pixelScaleX = gridCellSize.width ? gridZoom / gridCellSize.width : 1;
  const pixelScaleY = gridCellSize.height ? gridZoom / gridCellSize.height : 1;

  // Check for patrol component in componentOverrides
  const patrolComp = selectedEntity?.componentOverrides?.comp_patrol;
  const hasPatrolPath =
    patrolComp &&
    patrolComp.waypoint1_x !== undefined &&
    patrolComp.waypoint1_y !== undefined &&
    patrolComp.waypoint2_x !== undefined &&
    patrolComp.waypoint2_y !== undefined;

  // Legacy support: also check old patrolX/patrolY format
  const hasLegacyPatrolPath =
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

    if (!hasPatrolPath && !hasLegacyPatrolPath) {
      return;
    }

    let startX = 0, startY = 0, endX = 0, endY = 0;
    let isMultiScreen = false;

    if (hasPatrolPath) {
      // New format: waypoints in pixels from comp_patrol
      startX = Number(patrolComp.waypoint1_x);
      startY = Number(patrolComp.waypoint1_y);
      endX = Number(patrolComp.waypoint2_x);
      endY = Number(patrolComp.waypoint2_y);
      isMultiScreen = patrolComp.multiScreen === true || patrolComp.multiScreen === 'true';
    } else if (selectedEntity) {
      // Legacy format: patrol in tiles
      const originX = Number((selectedEntity.position?.x ?? 0) || 0);
      const originY = Number((selectedEntity.position?.y ?? 0) || 0);
      startX = originX * gridCellSize.width;
      startY = originY * gridCellSize.height;
      endX = Number(selectedEntity.patrolX) * gridCellSize.width;
      endY = Number(selectedEntity.patrolY) * gridCellSize.height;
    }

    // Check if patrol exceeds screen bounds (indicating multi-screen)
    const exceedsHorizontal = Math.abs(endX - startX) > pixelWidth ||
                              endX > pixelWidth || startX > pixelWidth;
    const exceedsVertical = Math.abs(endY - startY) > pixelHeight ||
                            endY > pixelHeight || startY > pixelHeight;
    const isAutoMultiScreen = exceedsHorizontal || exceedsVertical;

    // Calculate distance and screens crossed
    const distanceX = Math.abs(endX - startX);
    const distanceY = Math.abs(endY - startY);
    const totalDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    const screensX = Math.floor(distanceX / pixelWidth) + 1;
    const screensY = Math.floor(distanceY / pixelHeight) + 1;

    // Convert pixel coordinates to canvas coordinates
    const pixelStartX = startX * pixelScaleX;
    const pixelStartY = startY * pixelScaleY;
    const pixelEndX = endX * pixelScaleX;
    const pixelEndY = endY * pixelScaleY;

    // Choose color based on multi-screen status
    if (isMultiScreen || isAutoMultiScreen) {
      ctx.strokeStyle = '#00FF00'; // Green for multi-screen
      ctx.lineWidth = 1;
    } else {
      ctx.strokeStyle = '#FF00FF'; // Magenta for single-screen
      ctx.lineWidth = 1;
    }
    ctx.setLineDash([5, 3]);

    // Draw patrol line
    ctx.beginPath();
    ctx.moveTo(pixelStartX, pixelStartY);
    ctx.lineTo(pixelEndX, pixelEndY);
    ctx.stroke();

    // Draw waypoint markers
    ctx.fillStyle = ctx.strokeStyle;
    const markerSize = 4;
    ctx.fillRect(pixelStartX - markerSize / 2, pixelStartY - markerSize / 2, markerSize, markerSize);
    ctx.fillRect(pixelEndX - markerSize / 2, pixelEndY - markerSize / 2, markerSize, markerSize);

    // Draw multi-screen indicator arrows
    if (isMultiScreen || isAutoMultiScreen) {
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 2 * gridZoom;
      ctx.setLineDash([]);

      // Draw arrow at the end point
      const angle = Math.atan2(pixelEndY - pixelStartY, pixelEndX - pixelStartX);
      const arrowSize = 15 * gridZoom;

      ctx.beginPath();
      ctx.moveTo(pixelEndX, pixelEndY);
      ctx.lineTo(
        pixelEndX - arrowSize * Math.cos(angle - Math.PI / 6),
        pixelEndY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(pixelEndX, pixelEndY);
      ctx.lineTo(
        pixelEndX - arrowSize * Math.cos(angle + Math.PI / 6),
        pixelEndY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();

      // Draw info text
      ctx.font = `${12 * gridZoom}px monospace`;
      ctx.fillStyle = '#00FF00';
      ctx.fillText(
        `${Math.round(totalDistance)}px`,
        (pixelStartX + pixelEndX) / 2,
        (pixelStartY + pixelEndY) / 2 - 10 * gridZoom
      );
      ctx.fillText(
        `${screensX > 1 ? screensX + ' screens' : ''}${screensX > 1 && screensY > 1 ? ' x ' : ''}${screensY > 1 ? screensY + ' screens' : ''}`,
        (pixelStartX + pixelEndX) / 2,
        (pixelStartY + pixelEndY) / 2 + 10 * gridZoom
      );
    }

  }, [selectedEntity, gridZoom, gridCellSize, hasPatrolPath, hasLegacyPatrolPath, patrolComp, pixelHeight, pixelScaleX, pixelScaleY, pixelWidth]);

  const handleDelete = () => {
    onSetPatrolPath(null, null);
  };

  // Determine if showing multi-screen info badge
  let showMultiScreenBadge = false;
  let badgeText = '';
  if (hasPatrolPath && patrolComp) {
    const startX = Number(patrolComp.waypoint1_x);
    const startY = Number(patrolComp.waypoint1_y);
    const endX = Number(patrolComp.waypoint2_x);
    const endY = Number(patrolComp.waypoint2_y);
    const isMultiScreen = patrolComp.multiScreen === true || patrolComp.multiScreen === 'true';

    const exceedsHorizontal = Math.abs(endX - startX) > pixelWidth ||
                              endX > pixelWidth || startX > pixelWidth;
    const exceedsVertical = Math.abs(endY - startY) > pixelHeight ||
                            endY > pixelHeight || startY > pixelHeight;

    showMultiScreenBadge = isMultiScreen || exceedsHorizontal || exceedsVertical;
    if (showMultiScreenBadge) {
      const distanceX = Math.abs(endX - startX);
      const distanceY = Math.abs(endY - startY);
      const screensX = Math.floor(distanceX / pixelWidth) + 1;
      const screensY = Math.floor(distanceY / pixelHeight) + 1;
      badgeText = `Multi-Screen Patrol: ${screensX > 1 ? screensX + 'x' : ''}${screensY > 1 ? screensY + 'y' : ''}`;
    }
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        width={gridSize.width * gridZoom}
        height={gridSize.height * gridZoom}
        className="absolute top-0 left-0 pointer-events-none"
        style={{ zIndex: 20 }}
      />
      {hasLegacyPatrolPath && (
        <div
          className="absolute"
          style={{
            left: `${(selectedEntity.patrolX + 0.5) * gridZoom}px`,
            top: `${(selectedEntity.patrolY + 0.5) * gridZoom}px`,
            zIndex: 21,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
            title="Delete Patrol Path"
          >
            X
          </button>
        </div>
      )}
      {showMultiScreenBadge && selectedEntity && (
        <div
          className="absolute bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg pointer-events-none"
          style={{
            left: `${selectedEntity.position.x * gridZoom}px`,
            top: `${selectedEntity.position.y * gridZoom - 10 * pixelScaleY}px`,
            zIndex: 22,
            transform: 'translateX(-50%)',
          }}
          title="This entity patrols across multiple screens"
        >
          🌐 {badgeText}
        </div>
      )}
    </>
  );
};
