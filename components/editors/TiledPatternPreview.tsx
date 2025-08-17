import React, { useRef, useEffect } from 'react';
import { Tile, MSXColorValue } from '../../types';
import './TiledPatternPreview.css';
import { Panel } from '../common/Panel';

interface TiledPatternPreviewProps {
  activeTileData: Tile;
  palette: readonly { hex: MSXColorValue, [key: string]: any }[];
}

const TiledPatternPreview: React.FC<TiledPatternPreviewProps> = ({ activeTileData, palette }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const GRID_DIMENSION = 8;

  const canvasWidth = activeTileData.width * GRID_DIMENSION;
  const canvasHeight = activeTileData.height * GRID_DIMENSION;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeTileData || !activeTileData.data) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Note: The `palette` prop is not used directly for rendering pixels here.
    // The `activeTileData.data` object already contains the final hex color strings
    // for each pixel, which are managed by the parent `TileEditor`.
    // We keep `palette` in the dependency array because a change in the
    // global palette should trigger a re-render of this preview, assuming
    // the parent component will update the tile data accordingly.

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = activeTileData.width;
    tileCanvas.height = activeTileData.height;
    const tileCtx = tileCanvas.getContext('2d');

    if (!tileCtx) return;

    for (let y = 0; y < activeTileData.height; y++) {
      for (let x = 0; x < activeTileData.width; x++) {
        const color = activeTileData.data[y]?.[x];
        if (color) {
            tileCtx.fillStyle = color;
            tileCtx.fillRect(x, y, 1, 1);
        }
      }
    }

    for (let y = 0; y < GRID_DIMENSION; y++) {
      for (let x = 0; x < GRID_DIMENSION; x++) {
        ctx.drawImage(tileCanvas, x * activeTileData.width, y * activeTileData.height);
      }
    }
  }, [activeTileData, palette, canvasWidth, canvasHeight]);

  return (
    <Panel title="Tiling Preview">
        <div className="tiled-pattern-preview-container">
            <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="tiled-pattern-preview-canvas"
                title={`8x8 preview of the current ${activeTileData.width}x${activeTileData.height} tile`}
            />
        </div>
    </Panel>
  );
};

export default TiledPatternPreview;
