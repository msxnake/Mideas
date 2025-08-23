import React, { useState, useEffect, useRef } from 'react';
import { ProjectAsset, ScreenMap, Tile, Sprite, EntityInstance, EntityTemplate, AssetType } from '../../types';
import { Button } from '../common/Button';
import { renderScreenToCanvas, createSpriteDataURL } from '../utils/screenUtils';

const PREVIEW_WIDTH = 256;
const PREVIEW_HEIGHT = 192;
const TILE_SIZE = 8;

interface ScreenPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenMap: ScreenMap;
  allAssets: ProjectAsset[];
  currentScreenMode: string;
  entityTemplates: EntityTemplate[];
}

// State for animating entities
interface AnimatedEntity {
  instance: EntityInstance;
  template: EntityTemplate;
  sprite: Sprite;
  x: number;
  y: number;
  vx: number;
  vy: number;
  image: HTMLImageElement;
}

export const ScreenPreviewModal: React.FC<ScreenPreviewModalProps> = ({
  isOpen,
  onClose,
  screenMap,
  allAssets,
  currentScreenMode,
  entityTemplates,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number>();
  const entitiesRef = useRef<AnimatedEntity[]>([]);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();

      const getAsset = <T extends AssetType>(assetId: string | null | undefined, assetType: T): ProjectAsset | undefined => {
        if (!assetId) return undefined;
        return allAssets.find(a => a.id === assetId && a.type === assetType);
      };

      const entitiesToAnimate: AnimatedEntity[] = [];

      screenMap.layers.entities.forEach(instance => {
        const template = entityTemplates.find(t => t.id === instance.entityTemplateId);
        if (!template) return;

        const spriteAssetId = instance.componentOverrides?.comp_render?.spriteAssetId || template.spriteAssetId;
        const spriteAsset = getAsset(spriteAssetId, 'sprite');
        if (!spriteAsset) return;
        const sprite = spriteAsset.data as Sprite;

        const image = new Image();
        image.src = createSpriteDataURL(sprite.frames[0].data, sprite.size.width, sprite.size.height);

        const patrolComp = instance.componentOverrides?.comp_patrol;
        let vx = 0, vy = 0;
        let startX = instance.position.x * TILE_SIZE;
        let startY = instance.position.y * TILE_SIZE;
        let endX = startX;
        let endY = startY;

        if (patrolComp && patrolComp.waypoint1_x !== undefined && patrolComp.waypoint1_y !== undefined) {
            startX = patrolComp.waypoint1_x;
            startY = patrolComp.waypoint1_y;
            endX = patrolComp.waypoint2_x ?? startX;
            endY = patrolComp.waypoint2_y ?? startY;

            const dx = endX - startX;
            const dy = endY - startY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > 0) {
                vx = (dx / dist);
                vy = (dy / dist);
            }
        }

        entitiesToAnimate.push({
          instance,
          template,
          sprite,
          x: startX,
          y: startY,
          vx,
          vy,
          image,
        });
      });
      entitiesRef.current = entitiesToAnimate;
    }
  }, [isOpen, screenMap, allAssets, entityTemplates]);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const tileset = allAssets.filter(a => a.type === 'tile').map(a => a.data as Tile);

    const animate = () => {
        // 1. Clear and Draw Background
        ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
        renderScreenToCanvas(canvas, screenMap, tileset, currentScreenMode, TILE_SIZE);

        // 2. Update and Draw Entities
        const updatedEntities = entitiesRef.current.map(entity => {
            let { x, y, vx, vy } = entity;

            x += vx;
            y += vy;

            const patrolComp = entity.instance.componentOverrides?.comp_patrol;
            let startPixelX = entity.instance.position.x * TILE_SIZE;
            let startPixelY = entity.instance.position.y * TILE_SIZE;
            let endPixelX = startPixelX;
            let endPixelY = startPixelY;

            if (patrolComp && patrolComp.waypoint1_x !== undefined && patrolComp.waypoint1_y !== undefined) {
                startPixelX = patrolComp.waypoint1_x;
                startPixelY = patrolComp.waypoint1_y;
                endPixelX = patrolComp.waypoint2_x ?? startPixelX;
                endPixelY = patrolComp.waypoint2_y ?? startPixelY;
            }

            // More robust bounce logic
            if (vx > 0 && x >= Math.max(startPixelX, endPixelX)) { vx = -vx; x = Math.max(startPixelX, endPixelX); }
            if (vx < 0 && x <= Math.min(startPixelX, endPixelX)) { vx = -vx; x = Math.min(startPixelX, endPixelX); }
            if (vy > 0 && y >= Math.max(startPixelY, endPixelY)) { vy = -vy; y = Math.max(startPixelY, endPixelY); }
            if (vy < 0 && y <= Math.min(startPixelY, endPixelY)) { vy = -vy; y = Math.min(startPixelY, endPixelY); }

            ctx.drawImage(entity.image, x, y);

            return { ...entity, x, y, vx, vy };
        });

        entitiesRef.current = updatedEntities;
        animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isOpen, allAssets, currentScreenMode, screenMap]);

  if (!isOpen) return null;

  return (
    <div
        ref={modalRef}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4 outline-none"
        onClick={onClose}
        tabIndex={-1}
    >
      <div
        className="bg-msx-panelbg p-4 sm:p-6 rounded-lg shadow-xl animate-slideIn font-sans flex flex-col items-center"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4 pixel-font">Screen Preview</h2>
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
