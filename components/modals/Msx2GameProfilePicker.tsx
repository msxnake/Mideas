import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../common/Button';
import { Msx2GameProfileId } from '../../types';
import { MSX2_GAME_PROFILE_OPTIONS } from '../../utils/msx2ProjectProfiles';
import platformPreviewImg from '../../src/assets/msx2-project-profiles/platform-preview.png';
import mazePreviewImg from '../../src/assets/msx2-project-profiles/maze-preview.png';
import shooterVerticalPreviewImg from '../../src/assets/msx2-project-profiles/shooter-vertical-preview.png';
import shooterHorizontalPreviewImg from '../../src/assets/msx2-project-profiles/shooter-horizontal-preview.png';
import bitmapPlatformPreviewImg from '../../src/assets/msx2-project-profiles/bitmap-platform-preview.png';

interface Msx2GameProfilePickerProps {
  projectName: string;
  screenMode: string;
  onConfirm: (profileId: Msx2GameProfileId) => void;
  onCancel: () => void;
}

const PROFILE_PREVIEW_IMAGES: Partial<Record<Msx2GameProfileId, string>> = {
  platform: platformPreviewImg,
  maze: mazePreviewImg,
  shooterVertical: shooterVerticalPreviewImg,
  shooterHorizontal: shooterHorizontalPreviewImg,
  bitmapPlatform: bitmapPlatformPreviewImg,
};

const PREVIEW_COLORS = {
  bg: '#0f172a',
  grid: '#1e293b',
  platform: '#22c55e',
  player: '#38bdf8',
  enemy: '#f97316',
  bullet: '#fde047',
  collectible: '#facc15',
  mazeWall: '#6366f1',
  star: '#94a3b8',
};

function drawPlatformPreview(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = PREVIEW_COLORS.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = PREVIEW_COLORS.platform;
  ctx.fillRect(8, height - 18, width - 16, 8);
  ctx.fillRect(44, height - 44, 40, 8);
  ctx.fillStyle = PREVIEW_COLORS.player;
  ctx.fillRect(18, height - 34, 10, 14);
}
function drawMazePreview(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = PREVIEW_COLORS.bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = PREVIEW_COLORS.mazeWall;
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      if ((row + col) % 2 === 0) ctx.fillRect(10 + col * 14, 10 + row * 14, 10, 10);
    }
  }

  ctx.fillStyle = PREVIEW_COLORS.collectible;
  ctx.fillRect(52, 24, 4, 4);
  ctx.fillRect(24, 52, 4, 4);
  ctx.fillRect(80, 52, 4, 4);

  ctx.fillStyle = PREVIEW_COLORS.player;
  ctx.fillRect(38, 38, 10, 10);

  ctx.fillStyle = PREVIEW_COLORS.enemy;
  ctx.fillRect(66, 38, 10, 10);
}

function drawShooterHorizontalPreview(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = PREVIEW_COLORS.bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = PREVIEW_COLORS.star;
  for (let i = 0; i < 12; i += 1) {
    ctx.fillRect(8 + (i * 17) % width, 6 + (i * 11) % 28, 2, 2);
  }

  ctx.fillStyle = PREVIEW_COLORS.enemy;
  for (let col = 0; col < 5; col += 1) {
    ctx.fillRect(16 + col * 18, 18, 12, 8);
  }

  ctx.fillStyle = PREVIEW_COLORS.player;
  ctx.fillRect(width / 2 - 8, height - 24, 16, 8);

  ctx.fillStyle = PREVIEW_COLORS.bullet;
  ctx.fillRect(width / 2 - 1, height - 34, 2, 8);
  ctx.fillRect(34, 40, 2, 6);
}

function drawShooterVerticalPreview(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = PREVIEW_COLORS.bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = PREVIEW_COLORS.grid;
  for (let y = 0; y < height; y += 14) ctx.fillRect(0, y, width, 1);

  ctx.fillStyle = PREVIEW_COLORS.enemy;
  ctx.fillRect(24, 16, 10, 10);
  ctx.fillRect(56, 28, 10, 10);
  ctx.fillRect(40, 44, 10, 10);

  ctx.fillStyle = PREVIEW_COLORS.player;
  ctx.fillRect(width / 2 - 6, height - 22, 12, 10);

  ctx.fillStyle = PREVIEW_COLORS.bullet;
  ctx.fillRect(width / 2 - 1, height - 34, 2, 10);
  ctx.fillRect(29, 30, 2, 8);
}

function drawBitmapPlatformPreview(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // SCREEN 5 bitmap platformer: smooth multicolor sky, layered platforms, player jumping.
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#1e3a8a');
  sky.addColorStop(1, '#0b1220');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // Background stars (bitmap fine detail)
  ctx.fillStyle = '#cbd5e1';
  for (let i = 0; i < 8; i += 1) {
    ctx.fillRect(6 + (i * 23) % width, 4 + (i * 13) % 24, 1, 1);
  }

  // Ground + floating platforms (grass top, dirt body)
  const drawPlatform = (x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = '#92400e';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(x, y, w, 3);
  };
  drawPlatform(0, height - 12, width, 12);
  drawPlatform(14, height - 34, 34, 9);
  drawPlatform(70, height - 48, 34, 9);

  // Collectible coin on the higher platform
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(87, height - 56, 4, 0, Math.PI * 2);
  ctx.fill();

  // Player mid-jump on the lower platform
  ctx.fillStyle = PREVIEW_COLORS.player;
  ctx.fillRect(26, height - 50, 10, 14);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(26, height - 50, 10, 4);
}

function drawProfilePreview(canvas: HTMLCanvasElement, profileId: Msx2GameProfileId) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  switch (profileId) {
    case 'platform':
      drawPlatformPreview(ctx, width, height);
      break;
    case 'maze':
      drawMazePreview(ctx, width, height);
      break;
    case 'shooterHorizontal':
      drawShooterHorizontalPreview(ctx, width, height);
      break;
    case 'shooterVertical':
      drawShooterVerticalPreview(ctx, width, height);
      break;
    case 'bitmapPlatform':
      drawBitmapPlatformPreview(ctx, width, height);
      break;
    default:
      drawPlatformPreview(ctx, width, height);
  }
}

const ProfilePreview: React.FC<{ profileId: Msx2GameProfileId }> = ({ profileId }) => {
  const imageSrc = PROFILE_PREVIEW_IMAGES[profileId];
  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt=""
        className="w-full h-auto max-h-32 rounded border border-msx-border bg-black object-cover object-center"
        style={{ aspectRatio: '16 / 10' }}
      />
    );
  }
  return <ProfilePreviewCanvas profileId={profileId} />;
};

const ProfilePreviewCanvas: React.FC<{ profileId: Msx2GameProfileId }> = ({ profileId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    drawProfilePreview(canvasRef.current, profileId);
  }, [profileId]);

  return (
    <canvas
      ref={canvasRef}
      width={112}
      height={72}
      className="w-full h-auto rounded border border-msx-border bg-black"
      aria-hidden="true"
    />
  );
};

export const Msx2GameProfilePicker: React.FC<Msx2GameProfilePickerProps> = ({
  projectName,
  screenMode,
  onConfirm,
  onCancel,
}) => {
  const [selectedProfileId, setSelectedProfileId] = useState<Msx2GameProfileId>('platform');

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-4">
      <div
        className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg border border-msx-border bg-msx-panelbg p-6 shadow-xl animate-slideIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="msx2GameProfilePickerTitle"
      >
        <div className="mb-4">
          <h2 id="msx2GameProfilePickerTitle" className="text-lg text-msx-highlight">
            Choose MSX2 game type
          </h2>
          <p className="mt-1 text-xs text-msx-textsecondary">
            Project <strong className="text-msx-textprimary">{projectName}</strong> · {screenMode}
          </p>
          <p className="mt-2 text-xs text-msx-textsecondary">
            This choice sets the starter screen, entity palette and asset filters saved in the project JSON.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MSX2_GAME_PROFILE_OPTIONS.map(option => {
            const selected = selectedProfileId === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedProfileId(option.id)}
                className={`rounded border p-3 text-left transition-colors ${
                  selected ? 'border-msx-accent bg-msx-accent/10' : 'border-msx-border hover:border-msx-accent'
                }`}
              >
                <ProfilePreview profileId={option.previewKind} />
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-semibold text-msx-textprimary">{option.label}</span>
                  {option.experimental && (
                    <span className="rounded border border-yellow-500/60 bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-300">
                      Experimental
                    </span>
                  )}
                  {option.notImplemented && (
                    <span className="rounded border border-red-500/60 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-300">
                      Not implemented
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-msx-textsecondary">{option.description}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onCancel} variant="ghost" size="md">Back</Button>
          <Button onClick={() => onConfirm(selectedProfileId)} variant="primary" size="md">
            Create MSX2 Project
          </Button>
        </div>
      </div>
    </div>
  );
};
