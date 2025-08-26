import React, { useState, useEffect, useMemo } from 'react';
import { Boss, ProjectAsset, Tile } from '../../types';
import { Button } from '../common/Button';
import { createTileDataURL } from '../utils/screenUtils';

interface BossPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  boss: Boss;
  allAssets: ProjectAsset[];
  currentScreenMode: string;
}

const BossPhaseDisplay: React.FC<{ phase: Boss['phases'][0], tileset: Tile[], currentScreenMode: string }> = ({ phase, tileset, currentScreenMode }) => {
    if (phase.buildType !== 'tile' || !phase.dimensions) {
        return <div className="w-64 h-64 bg-msx-panelbg border border-dashed border-msx-border flex items-center justify-center text-xs text-msx-textsecondary">Sprite-based phase</div>;
    }

    const { width, height } = phase.dimensions;
    const TILE_SIZE = 32;

    return (
        <div className="grid" style={{ gridTemplateColumns: `repeat(${width}, ${TILE_SIZE}px)` }}>
            {Array.from({ length: height * width }).map((_, i) => {
                const x = i % width;
                const y = Math.floor(i / width);
                const tileId = phase.tileMatrix?.[y]?.[x];
                const tile = tileId ? tileset.find(t => t.id === tileId) : null;
                return (
                    <div key={i} className="border border-msx-border/10" style={{ width: `${TILE_SIZE}px`, height: `${TILE_SIZE}px` }}>
                        {tile && (
                            <img src={createTileDataURL(tile, 0, 0, TILE_SIZE, TILE_SIZE, tile.width, currentScreenMode)} alt="" className="w-full h-full" style={{ imageRendering: 'pixelated' }} />
                        )}
                    </div>
                );
            })}
        </div>
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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn" onClick={onClose}>
      <div className="bg-msx-panelbg p-4 rounded-lg shadow-xl w-full max-w-lg animate-slideIn flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg pixel-font text-msx-highlight mb-4">Boss Animation Preview: {boss.name}</h2>

        <div className="bg-msx-bgcolor p-2 border border-msx-border rounded-md mb-4">
            {currentPhase ? (
                <BossPhaseDisplay phase={currentPhase} tileset={tileset} currentScreenMode={currentScreenMode} />
            ) : (
                <div className="w-64 h-64 flex items-center justify-center text-msx-textsecondary">No tile-based phases to preview.</div>
            )}
        </div>

        <div className="text-xs mb-2">
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
