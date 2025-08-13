import React, { useState, useEffect, useRef } from 'react';
import { MainMenuConfig, ProjectAsset, ScreenMap, Tile, MSXFont, MSXFontColorAttributes, Sprite } from '../../types';
import { Button } from '../common/Button';
import { renderScreenToCanvas } from '../utils/screenUtils';
import { renderMSX1TextToDataURL, getTextDimensionsMSX1 } from '../utils/msxFontRenderer';
import { createSpriteDataURL } from '../utils/screenUtils';

interface MainMenuPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MainMenuConfig;
  allAssets: ProjectAsset[];
  globalFont: MSXFont;
  globalFontColorAttributes: MSXFontColorAttributes;
  currentScreenMode: string;
}

const PREVIEW_WIDTH = 256;
const PREVIEW_HEIGHT = 192;

export const MainMenuPreviewModal: React.FC<MainMenuPreviewModalProps> = ({
  isOpen,
  onClose,
  config,
  allAssets,
  globalFont,
  globalFontColorAttributes,
  currentScreenMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);

  useEffect(() => {
    if (isOpen && modalRef.current) {
        modalRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.imageSmoothingEnabled = false;

        // 1. Draw Background
        const bgScreenAsset = allAssets.find(a => a.id === config.menuScreenAssetId && a.type === 'screenmap');
        if (bgScreenAsset) {
            const screenMap = bgScreenAsset.data as ScreenMap;
            const tileset = allAssets.filter(a => a.type === 'tile').map(a => a.data as Tile);
            renderScreenToCanvas(canvas, screenMap, tileset, currentScreenMode, 8);
        } else {
            ctx.fillStyle = config.menuColors.background;
            ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
        }

        // 2. Draw Border
        if (config.menuColors.border && config.menuColors.border !== 'transparent') {
            ctx.strokeStyle = config.menuColors.border;
            ctx.lineWidth = 2; // Example border width
            ctx.strokeRect(1, 1, PREVIEW_WIDTH - 2, PREVIEW_HEIGHT - 2);
        }
        
        // 3. Draw Menu Options
        const visibleOptions = config.options.filter(opt => opt.enabled);
        const totalHeight = visibleOptions.length * 12; // 8 for char height + 4 for spacing
        let startY = Math.round((PREVIEW_HEIGHT - totalHeight) / 2);

        visibleOptions.forEach((option, index) => {
            const isSelected = index === selectedOptionIndex;
            const text = option.label;
            
            const tempColorAttrs: MSXFontColorAttributes = {};

            if (isSelected) {
                // For selected items, OVERRIDE colors completely with highlight colors
                const fg = config.menuColors.highlightText;
                const bg = config.menuColors.highlightBackground;
                const rowColors = Array(8).fill({ fg, bg });
                for(let i=0; i<text.length; i++){
                    tempColorAttrs[text.charCodeAt(i)] = rowColors;
                }
            } else {
                // For non-selected items, use the font's FG color but the menu's BG color
                const menuTextColor = config.menuColors.text;
                const menuBgColor = config.menuColors.background;
                for(let i=0; i<text.length; i++){
                    const charCode = text.charCodeAt(i);
                    const originalRowColors = globalFontColorAttributes[charCode];
                    
                    const newRowColors = Array(8).fill(null).map((_, rowIndex) => {
                        const originalFg = originalRowColors?.[rowIndex]?.fg;
                        const fg = (originalFg && originalFg !== 'transparent' && !originalFg.startsWith('rgba(0,0,0,0)')) 
                            ? originalFg 
                            : menuTextColor;
                        return { fg, bg: menuBgColor };
                    });
                    tempColorAttrs[charCode] = newRowColors;
                }
            }

            const textImg = new Image();
            textImg.onload = () => {
                const textDims = getTextDimensionsMSX1(text, 1);
                const textX = Math.round((PREVIEW_WIDTH - textDims.width) / 2);
                const currentY = startY + (index * 12);
                ctx.drawImage(textImg, textX, currentY);
            };
            textImg.src = renderMSX1TextToDataURL(text, globalFont, tempColorAttrs, 1, 1);
        });

        // 4. Draw Cursor
        const cursorSpriteAsset = allAssets.find(a => a.id === config.cursorSpriteAssetId && a.type === 'sprite');
        if (cursorSpriteAsset) {
            const sprite = cursorSpriteAsset.data as Sprite;
            const frame = sprite.frames[0];
            if (frame) {
                const cursorImg = new Image();
                cursorImg.onload = () => {
                    const selectedOption = visibleOptions[selectedOptionIndex];
                    if (selectedOption) {
                        const textDims = getTextDimensionsMSX1(selectedOption.label, 1);
                        const textX = Math.round((PREVIEW_WIDTH - textDims.width) / 2);
                        const cursorX = textX - sprite.size.width - 4; // 4px padding
                        const cursorY = startY + (selectedOptionIndex * 12) + (8 / 2) - (sprite.size.height / 2);
                        ctx.drawImage(cursorImg, cursorX, cursorY);
                    }
                };
                cursorImg.src = createSpriteDataURL(frame.data, sprite.size.width, sprite.size.height);
            }
        }
    }
  }, [isOpen, config, allAssets, globalFont, globalFontColorAttributes, currentScreenMode, selectedOptionIndex]);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
      e.preventDefault();
      const visibleOptionsCount = config.options.filter(o => o.enabled).length;
      if (visibleOptionsCount === 0) return;
      
      if (e.key === 'ArrowDown') {
          setSelectedOptionIndex(prev => (prev + 1) % visibleOptionsCount);
      } else if (e.key === 'ArrowUp') {
          setSelectedOptionIndex(prev => (prev - 1 + visibleOptionsCount) % visibleOptionsCount);
      }
  };

  if (!isOpen) return null;

  return (
    <div 
        ref={modalRef}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4 outline-none" 
        onClick={onClose}
        onKeyDown={handleKeyDown}
        tabIndex={-1} // Make div focusable
    >
      <div 
        className="bg-msx-panelbg p-4 sm:p-6 rounded-lg shadow-xl animate-slideIn font-sans flex flex-col items-center" 
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4 pixel-font">Main Menu Preview</h2>
        <p className="text-xs text-msx-textsecondary mb-2">Use Arrow Up/Down to cycle selection.</p>
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
