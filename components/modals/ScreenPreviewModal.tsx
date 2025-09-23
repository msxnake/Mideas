import React, { useState, useEffect, useRef } from 'react';
import { ProjectAsset, ScreenMap, Tile, Sprite, EntityInstance, EntityTemplate, AssetType, PixelData, TileBank, MSXFont, MSXFontColorAttributes } from '../../types';
import { Button } from '../common/Button';
import { renderScreenToCanvas, createSpriteDataURL } from '../utils/screenUtils';
import { mirrorPixelDataHorizontally, mirrorPixelDataVertically } from '../utils/spriteUtils';
import { createTileBasedFont, renderMSX1TextToDataURL, DEFAULT_MSX_FONT } from '../utils/msxFontRenderer';

/** The width of the preview canvas in pixels. @constant */
const PREVIEW_WIDTH = 256;
/** The height of the preview canvas in pixels. @constant */
const PREVIEW_HEIGHT = 192;
/** The size of a tile in pixels. @constant */
const TILE_SIZE = 8;

/**
 * Props for the {@link ScreenPreviewModal} component.
 * @category Modal
 */
interface ScreenPreviewModalProps {
  /** Whether the modal is currently open. */
  isOpen: boolean;
  /** Callback function to close the modal. */
  onClose: () => void;
  /** The screen map data to preview. */
  screenMap: ScreenMap;
  /** A list of all project assets. */
  allAssets: ProjectAsset[];
  /** The current screen mode (e.g., 'screen2'). */
  currentScreenMode: string;
  /** A list of all entity templates in the project. */
  entityTemplates: EntityTemplate[];
  /** The tile banks configuration for SCREEN 2 mode. */
  tileBanks?: TileBank[];
  /** The MSX font data for rendering text elements. */
  msxFont?: MSXFont;
  /** The MSX font color attributes for per-row coloring. */
  msxFontColorAttributes?: MSXFontColorAttributes;
}

/**
 * Represents the state for an animating entity in the preview.
 * @internal
 */
interface AnimatedEntity {
  /** The entity instance from the screen map. */
  instance: EntityInstance;
  /** The entity template. */
  template: EntityTemplate;
  /** The sprite associated with the entity. */
  sprite: Sprite;
  /** The current x position in pixels. */
  x: number;
  /** The current y position in pixels. */
  y: number;
  /** The current velocity on the x-axis. */
  vx: number;
  /** The current velocity on the y-axis. */
  vy: number;
  /** The pre-rendered frame images for the animation. */
  frameImages: HTMLImageElement[];
  /** The pre-rendered mirrored frame images for the animation. */
  mirroredFrameImages?: HTMLImageElement[];
  /** The index of the current animation frame. */
  currentFrame: number;
  /** The timestamp of the last frame update. */
  lastFrameUpdateTime: number;
}
/** The speed of the animation in milliseconds per frame. @constant */
const ANIMATION_SPEED_MS = 200;

/**
 * A modal dialog for previewing a screen map with animated entities.
 *
 * @param props The component props.
 * @returns A React component.
 * @category Modal
 */
export const ScreenPreviewModal: React.FC<ScreenPreviewModalProps> = ({
  isOpen,
  onClose,
  screenMap,
  allAssets,
  currentScreenMode,
  entityTemplates,
  tileBanks,
  msxFont,
  msxFontColorAttributes,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number>();
  const entitiesRef = useRef<AnimatedEntity[]>([]);
  const [enableScanlines, setEnableScanlines] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const fullScreenTimerRef = useRef<NodeJS.Timeout>();

  // HUD rendering function (simplified version from ScreenPlayModal)
  const renderHUDElements = (ctx: CanvasRenderingContext2D) => {
    const hudElements = screenMap.hudConfiguration?.elements;
    if (!hudElements || hudElements.length === 0) return;

    hudElements.forEach(hudEl => {
      if (!hudEl.visible) return;

      // Check if it's a text-based HUD element
      const isTextBased = [
        'Score', 'HighScore', 'Lives', 'SceneName', 'CoinCounter',
        'AttackAlert', 'TextBox', 'NumericField', 'CustomCounter'
      ].includes(hudEl.type);

      if (isTextBased && (hudEl.text || hudEl.name)) {
        const textToRender = hudEl.text || hudEl.name || "TEXT";
        const charSpacing = hudEl.details?.charSpacing || 0;

        // Extract colors from HUD element details
        const hudTextColor = hudEl.details?.textColor || undefined;
        const hudBackgroundColor = hudEl.details?.textBackgroundColor || undefined;

        // Try to use tile-based font from Bank 0 first with custom colors
        const tileBasedFont = createTileBasedFont(tileBanks, allAssets, msxFont || DEFAULT_MSX_FONT, msxFontColorAttributes, hudTextColor, hudBackgroundColor);
        const fontToUse = msxFont || DEFAULT_MSX_FONT;
        const fontColorAttrs = msxFontColorAttributes || {};

        if (tileBasedFont) {
          // Render character by character using tiles
          let xOffset = hudEl.position.x;

          for (const char of textToRender) {
            const tileImg = tileBasedFont[char.toUpperCase()] || tileBasedFont[char];

            if (tileImg && tileImg.complete && tileImg.naturalWidth > 0) {
              ctx.drawImage(tileImg, xOffset, hudEl.position.y, 8, 8);
            } else {
              // Fallback with custom colors if provided
              const fallbackBgColor = hudBackgroundColor && hudBackgroundColor !== 'transparent' ? hudBackgroundColor : '#FF0000';
              const fallbackTextColor = hudTextColor || '#FFFFFF';

              if (hudBackgroundColor !== 'transparent') {
                ctx.fillStyle = fallbackBgColor;
                ctx.fillRect(xOffset, hudEl.position.y, 8, 8);
              }
              ctx.fillStyle = fallbackTextColor;
              ctx.font = '6px monospace';
              ctx.fillText(char, xOffset + 1, hudEl.position.y + 6);
            }

            xOffset += 8 + charSpacing;
          }
        } else {
          // Fallback to MSX font rendering
          try {
            const textImageSrc = renderMSX1TextToDataURL(
              textToRender,
              fontToUse,
              fontColorAttrs,
              1,
              charSpacing,
              hudTextColor,
              hudBackgroundColor
            );

            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, hudEl.position.x, hudEl.position.y);
            };
            img.src = textImageSrc;
          } catch (error) {
            // Final fallback: simple text with custom colors
            ctx.fillStyle = hudTextColor || '#FFFFFF';
            ctx.font = '8px monospace';
            ctx.fillText(textToRender, hudEl.position.x, hudEl.position.y + 8);
          }
        }
      }
    });
  };

  // Scanlines rendering function for CRT simulation
  const renderScanlines = (ctx: CanvasRenderingContext2D) => {
    if (!enableScanlines) return;

    // Save current context state
    ctx.save();

    // Set scanlines properties - Subtle CRT scanlines
    ctx.globalAlpha = 0.25; // Subtle but visible transparency
    ctx.fillStyle = '#000000'; // Black scanlines
    ctx.globalCompositeOperation = 'source-over';

    // Draw horizontal scanlines every 2 pixels (authentic CRT spacing)
    for (let y = 1; y < PREVIEW_HEIGHT; y += 2) {
      ctx.fillRect(0, y, PREVIEW_WIDTH, 1); // 1 pixel thick
    }

    // Restore context state
    ctx.restore();
  };

  // Full Screen functionality
  const handleFullScreen = () => {
    setIsFullScreen(true);

    // Auto-close after 5 seconds
    fullScreenTimerRef.current = setTimeout(() => {
      setIsFullScreen(false);
    }, 5000);
  };

  const handleExitFullScreen = () => {
    setIsFullScreen(false);
    if (fullScreenTimerRef.current) {
      clearTimeout(fullScreenTimerRef.current);
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (fullScreenTimerRef.current) {
        clearTimeout(fullScreenTimerRef.current);
      }
    };
  }, []);

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

        // This logic needs to be robust to find the sprite asset ID
        // It might be in componentOverrides or in the base template components
        let spriteAssetId: string | undefined = undefined;
        // Check instance overrides first
        if (instance.componentOverrides) {
            for (const compId in instance.componentOverrides) {
                if (instance.componentOverrides[compId]?.spriteAssetId) {
                    spriteAssetId = instance.componentOverrides[compId].spriteAssetId;
                    break;
                }
            }
        }
        // If not found in overrides, check template's components
        if (!spriteAssetId) {
            for (const comp of template.components) {
                if (comp.defaultValues?.spriteAssetId) {
                    spriteAssetId = comp.defaultValues.spriteAssetId;
                    break;
                }
            }
        }

        const spriteAsset = getAsset(spriteAssetId, 'sprite');
        if (!spriteAsset || !spriteAsset.data) return;
        const sprite = spriteAsset.data as Sprite;

        if (!sprite.frames || sprite.frames.length === 0) return;

        const frameImages = sprite.frames.map(frame => {
          const img = new Image();
          img.src = createSpriteDataURL(frame.data, sprite.size.width, sprite.size.height);
          return img;
        });

        let mirroredFrameImages: HTMLImageElement[] | undefined = undefined;
        if (sprite.facingDirection === 'right' || sprite.facingDirection === 'left') {
            mirroredFrameImages = sprite.frames.map(frame => {
                const mirroredData = mirrorPixelDataHorizontally(frame.data as PixelData);
                const img = new Image();
                img.src = createSpriteDataURL(mirroredData, sprite.size.width, sprite.size.height);
                return img;
            });
        } else if (sprite.facingDirection === 'up' || sprite.facingDirection === 'down') {
            mirroredFrameImages = sprite.frames.map(frame => {
                const mirroredData = mirrorPixelDataVertically(frame.data as PixelData);
                const img = new Image();
                img.src = createSpriteDataURL(mirroredData, sprite.size.width, sprite.size.height);
                return img;
            });
        }


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
          frameImages,
          mirroredFrameImages,
          currentFrame: 0,
          lastFrameUpdateTime: 0,
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
    let lastTimestamp = 0;

    const animate = (timestamp: number) => {
        if (lastTimestamp === 0) {
            lastTimestamp = timestamp;
        }
        const deltaTime = timestamp - lastTimestamp;
        lastTimestamp = timestamp;

        // 1. Clear and Draw Background
        ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
        renderScreenToCanvas(canvas, screenMap, tileset, currentScreenMode, TILE_SIZE);

        // 2. Render HUD elements
        renderHUDElements(ctx);

        // 3. Draw Entities to main canvas
        entitiesRef.current.forEach(entity => {
            const { x, y, currentFrame } = entity;
            let imageToDraw = entity.frameImages[currentFrame];

            if (entity.sprite.facingDirection === 'right' && entity.vx < 0 && entity.mirroredFrameImages) {
                imageToDraw = entity.mirroredFrameImages[currentFrame];
            } else if (entity.sprite.facingDirection === 'left' && entity.vx > 0 && entity.mirroredFrameImages) {
                imageToDraw = entity.mirroredFrameImages[currentFrame];
            } else if (entity.sprite.facingDirection === 'up' && entity.vy > 0 && entity.mirroredFrameImages) {
                imageToDraw = entity.mirroredFrameImages[currentFrame];
            } else if (entity.sprite.facingDirection === 'down' && entity.vy < 0 && entity.mirroredFrameImages) {
                imageToDraw = entity.mirroredFrameImages[currentFrame];
            }

            if (imageToDraw) {
              ctx.drawImage(imageToDraw, x, y);
            }
        });

        // 4. Render scanlines for CRT effect (on top of everything)
        renderScanlines(ctx);

        // 5. Update Entities (do this once, after rendering)
        const updatedEntities = entitiesRef.current.map(entity => {
            let { x, y, vx, vy, currentFrame, lastFrameUpdateTime } = entity;

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

            // Update animation frame
            const now = performance.now();
            if (now - lastFrameUpdateTime > ANIMATION_SPEED_MS) {
              currentFrame = (currentFrame + 1) % entity.frameImages.length;
              lastFrameUpdateTime = now;
            }

            let imageToDraw = entity.frameImages[currentFrame];
            if (entity.sprite.facingDirection === 'right' && vx < 0 && entity.mirroredFrameImages) {
                imageToDraw = entity.mirroredFrameImages[currentFrame];
            } else if (entity.sprite.facingDirection === 'left' && vx > 0 && entity.mirroredFrameImages) {
                imageToDraw = entity.mirroredFrameImages[currentFrame];
            } else if (entity.sprite.facingDirection === 'up' && vy > 0 && entity.mirroredFrameImages) {
                imageToDraw = entity.mirroredFrameImages[currentFrame];
            } else if (entity.sprite.facingDirection === 'down' && vy < 0 && entity.mirroredFrameImages) {
                imageToDraw = entity.mirroredFrameImages[currentFrame];
            }

            return { ...entity, x, y, vx, vy, currentFrame, lastFrameUpdateTime };
        });

        entitiesRef.current = updatedEntities;

        animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isOpen, allAssets, currentScreenMode, screenMap, enableScanlines, isFullScreen, tileBanks, msxFont, msxFontColorAttributes]);

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .crt-effect {
          filter: contrast(1.1) brightness(1.1);
          box-shadow:
            inset 0 0 20px rgba(0, 255, 0, 0.1),
            0 0 20px rgba(0, 255, 0, 0.2);
          border-radius: 4px;
          background: linear-gradient(
            180deg,
            transparent 50%,
            rgba(0, 0, 0, 0.05) 50%
          );
          background-size: 100% 4px;
          animation: crt-flicker 0.15s infinite linear alternate;
        }

        @keyframes crt-flicker {
          0% { opacity: 1; }
          98% { opacity: 1; }
          99% { opacity: 0.98; }
          100% { opacity: 1; }
        }
      `}</style>

      {/* Container that changes based on full screen mode */}
      <div
        ref={modalRef}
        className={`fixed inset-0 flex items-center justify-center z-50 outline-none ${
          isFullScreen
            ? 'bg-black'
            : 'bg-black bg-opacity-75 animate-fadeIn p-4'
        }`}
        onClick={isFullScreen ? handleExitFullScreen : onClose}
        tabIndex={-1}
      >
        {/* Content wrapper - only shows in normal mode */}
        {!isFullScreen && (
          <div
            className="bg-msx-panelbg p-4 sm:p-6 rounded-lg shadow-xl animate-slideIn font-sans flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4 pixel-font">Screen Preview</h2>
          </div>
        )}

        {/* Canvas - always present but with different styles */}
        <canvas
          ref={canvasRef}
          width={PREVIEW_WIDTH}
          height={PREVIEW_HEIGHT}
          className={`${enableScanlines ? 'crt-effect' : ''} ${
            isFullScreen
              ? ''
              : 'border-2 border-msx-border'
          }`}
          style={
            isFullScreen
              ? {
                  width: '90vw',
                  height: '90vh',
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                  objectFit: 'contain',
                  imageRendering: 'pixelated'
                }
              : {
                  width: PREVIEW_WIDTH * 2,
                  height: PREVIEW_HEIGHT * 2,
                  imageRendering: 'pixelated'
                }
          }
        />

        {/* Full Screen indicator */}
        {isFullScreen && (
          <div className="absolute top-4 right-4 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
            Click to exit | Auto-close in 5s
          </div>
        )}

        {/* Controls - only shows in normal mode */}
        {!isFullScreen && (
          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => setEnableScanlines(!enableScanlines)}
              variant={enableScanlines ? "primary" : "secondary"}
              size="md"
            >
              {enableScanlines ? "CRT ON" : "CRT OFF"}
            </Button>
            <Button
              onClick={handleFullScreen}
              variant="secondary"
              size="md"
            >
              Full Screen
            </Button>
            <Button onClick={onClose} variant="primary" size="md">Close</Button>
          </div>
        )}
      </div>
    </>
  );
};
