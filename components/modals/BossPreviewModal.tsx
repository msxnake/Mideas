import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Boss, ProjectAsset, Tile } from '../../types';
import { Button } from '../common/Button';
import { createTileDataURL } from '../utils/screenUtils';

const PREVIEW_WIDTH = 256;
const PREVIEW_HEIGHT = 192;

interface BossPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  boss: Boss;
  allAssets: ProjectAsset[];
  currentScreenMode: string;
}

const BossPhaseDisplay: React.FC<{ phase: Boss['phases'][0], tileset: Tile[], currentScreenMode: string }> = ({ phase, tileset, currentScreenMode }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!phase || phase.buildType !== 'tile' || !phase.dimensions) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const { width: bossWidth, height: bossHeight } = phase.dimensions;
        const tileW = tileset[0]?.width || 8;
        const tileH = tileset[0]?.height || 8;

        const totalBossWidth = bossWidth * tileW;
        const totalBossHeight = bossHeight * tileH;

        const startX = Math.floor((PREVIEW_WIDTH - totalBossWidth) / 2);
        const startY = Math.floor((PREVIEW_HEIGHT - totalBossHeight) / 2);

        for (let y = 0; y < bossHeight; y++) {
            for (let x = 0; x < bossWidth; x++) {
                const tileId = phase.tileMatrix?.[y]?.[x];
                const tile = tileId ? tileset.find(t => t.id === tileId) : null;
                if (tile) {
                    const img = new Image();
                    img.src = createTileDataURL(tile, 0, 0, tile.width, tile.height, tile.width, currentScreenMode);
                    img.onload = () => {
                        ctx.drawImage(img, startX + x * tileW, startY + y * tileH);
                    }
                }
            }
        }
    }, [phase, tileset, currentScreenMode]);

    if (phase.buildType !== 'tile' || !phase.dimensions) {
        return <div style={{ width: `${PREVIEW_WIDTH * 2}px`, height: `${PREVIEW_HEIGHT * 2}px` }} className="bg-msx-panelbg border-2 border-msx-border flex items-center justify-center text-xs text-msx-textsecondary">Sprite-based phase</div>;
    }

    return (
        <canvas
            ref={canvasRef}
            width={PREVIEW_WIDTH}
            height={PREVIEW_HEIGHT}
            className="border-2 border-msx-border"
            style={{
                width: PREVIEW_WIDTH * 2,
                height: PREVIEW_HEIGHT * 2,
                imageRendering: 'pixelated',
                backgroundColor: '#000'
            }}
        />
    );
};

export const BossPreviewModal: React.FC<BossPreviewModalProps> = ({ isOpen, onClose, boss, allAssets, currentScreenMode }) => {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(500); // ms per frame

  const tileset = useMemo(() => allAssets.filter(a => a.type === 'tile').map(a => a.data as Tile), [allAssets]);
  const tileBasedPhases = useMemo(() => boss.phases.filter(p => p.buildType === 'tile'), [boss.phases]);

  useEffect(() => {
    if (!isOpen || !isPlaying || tileBasedPhases.length === 0) {
      return;
    }
    const timer = setTimeout(() => {
      setCurrentPhaseIndex((prevIndex) => (prevIndex + 1) % tileBasedPhases.length);
    }, animationSpeed);
    return () => clearTimeout(timer);
  }, [isOpen, isPlaying, currentPhaseIndex, tileBasedPhases.length, animationSpeed]);

  if (!isOpen) return null;

  const currentPhase = tileBasedPhases[currentPhaseIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4 outline-none" onClick={onClose}>
      <div className="bg-msx-panelbg p-4 sm:p-6 rounded-lg shadow-xl animate-slideIn font-sans flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4 pixel-font">Boss Animation Preview: {boss.name}</h2>

        <div className="bg-black p-1 inline-block">
            {currentPhase ? (
                <BossPhaseDisplay phase={currentPhase} tileset={tileset} currentScreenMode={currentScreenMode} />
            ) : (
                <div
                    style={{ width: `${PREVIEW_WIDTH * 2}px`, height: `${PREVIEW_HEIGHT * 2}px` }}
                    className="bg-msx-panelbg border-2 border-msx-border flex items-center justify-center text-xs text-msx-textsecondary"
                >
                    No tile-based phases to preview.
                </div>
            )}
        </div>

        <div className="text-xs mt-3 mb-2">
          {currentPhase ? `Phase: ${currentPhase.name} (${currentPhaseIndex + 1} / ${tileBasedPhases.length})` : 'No preview available'}
        </div>

        <div className="flex items-center space-x-4 mb-4">
            <Button onClick={() => setIsPlaying(!isPlaying)} size="sm" variant="secondary">
                {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <div className="flex items-center space-x-2 text-xs">
                <label>Speed:</label>
                <input
                    type="range"
                    min="100"
                    max="2000"
                    step="100"
                    value={animationSpeed}
                    onChange={e => setAnimationSpeed(Number(e.target.value))}
                    className="w-32"
                />
                <span className="w-12 text-center">{animationSpeed}ms</span>
            </div>
        </div>

        <Button onClick={onClose} variant="primary">Close</Button>
      </div>
    </div>
  );
};
