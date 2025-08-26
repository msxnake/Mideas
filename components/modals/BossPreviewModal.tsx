import React, { useEffect, useRef } from 'react';
import { Boss, BossPhase, Tile } from '../../types';
import { Button } from '../common/Button';
import { createTileDataURL } from '../utils/screenUtils';

const PREVIEW_WIDTH = 256;
const PREVIEW_HEIGHT = 192;
const TILE_SIZE = 8; // Tiles are 8x8 in this context

interface BossPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  boss: Boss;
  tileset: Tile[];
}

export const BossPreviewModal: React.FC<BossPreviewModalProps> = ({
  isOpen,
  onClose,
  boss,
  tileset,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();
  const bossStateRef = useRef({ x: 0, y: 0, vx: 1, vy: 0.5 });
  const tileImageCache = useRef(new Map<string, HTMLImageElement>());

  useEffect(() => {
    if (!isOpen) {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
        return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const phase = boss.phases[0];
    if (!phase || phase.buildType !== 'tile' || !phase.tileMatrix) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px "MSX-Gothic"';
        ctx.fillText("No tile-based phase to preview.", 10, 20);
        return;
    }

    const bossWidth = (phase.dimensions?.width || 0) * TILE_SIZE;
    const bossHeight = (phase.dimensions?.height || 0) * TILE_SIZE;

    // Initialize boss state
    bossStateRef.current = {
        x: Math.floor((PREVIEW_WIDTH - bossWidth) / 2),
        y: Math.floor((PREVIEW_HEIGHT - bossHeight) / 2),
        vx: 1,
        vy: 0.5,
    };

    const uniqueTileIds = new Set(phase.tileMatrix.flat().filter(Boolean));
    let tilesToLoad = uniqueTileIds.size;

    const startAnimation = () => {
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);

        const animate = () => {
            let { x, y, vx, vy } = bossStateRef.current;
            x += vx;
            y += vy;

            if (x <= 0 || x + bossWidth >= PREVIEW_WIDTH) vx = -vx;
            if (y <= 0 || y + bossHeight >= PREVIEW_HEIGHT) vy = -vy;

            bossStateRef.current = { x, y, vx, vy };

            renderBoss(x, y);
            animationFrameId.current = requestAnimationFrame(animate);
        };
        animationFrameId.current = requestAnimationFrame(animate);
    };

    const renderBoss = (x: number, y: number) => {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
        for (let row = 0; row < (phase.dimensions?.height || 0); row++) {
            for (let col = 0; col < (phase.dimensions?.width || 0); col++) {
                const tileId = phase.tileMatrix?.[row]?.[col];
                if (tileId) {
                    const tileImage = tileImageCache.current.get(tileId);
                    if (tileImage) {
                        ctx.drawImage(tileImage, x + col * TILE_SIZE, y + row * TILE_SIZE);
                    }
                }
            }
        }
    };

    if (uniqueTileIds.size === 0) {
        startAnimation();
        return;
    }

    uniqueTileIds.forEach(tileId => {
        if (tileImageCache.current.has(tileId)) {
            tilesToLoad--;
        } else {
            const tile = tileset.find(t => t.id === tileId);
            if (tile) {
                const img = new Image();
                img.src = createTileDataURL(tile, 0, 0, TILE_SIZE, TILE_SIZE, tile.width, "SCREEN 2 (Graphics I)");
                img.onload = () => {
                    tileImageCache.current.set(tileId, img);
                    tilesToLoad--;
                    if (tilesToLoad === 0) startAnimation();
                };
                img.onerror = () => {
                    tilesToLoad--;
                    if (tilesToLoad === 0) startAnimation();
                };
            } else {
                tilesToLoad--;
            }
        }
    });

    if (tilesToLoad === 0) {
        startAnimation();
    }

    return () => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
    };
  }, [isOpen, boss, tileset]);

  if (!isOpen) return null;

  return (
    <div
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4"
        onClick={onClose}
    >
      <div
        className="bg-msx-panelbg p-4 sm:p-6 rounded-lg shadow-xl animate-slideIn flex flex-col items-center"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4 pixel-font">Boss Preview</h2>
        <canvas
            ref={canvasRef}
            width={PREVIEW_WIDTH}
            height={PREVIEW_HEIGHT}
            className="border-2 border-msx-border"
            style={{
                width: PREVIEW_WIDTH * 2,
                height: PREVIEW_HEIGHT * 2,
                imageRendering: 'pixelated'
            }}
        />
        <Button onClick={onClose} variant="primary" size="md" className="mt-4">Close</Button>
      </div>
    </div>
  );
};
