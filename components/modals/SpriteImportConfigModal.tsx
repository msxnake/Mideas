
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../common/Button';
import { MSXColorValue, SpriteFrame, PixelData, Sprite } from '../../types'; 
import { MSX_SCREEN5_PALETTE } from '../../constants'; // Corrected import path

export interface SpriteImportConfig {
  frameWidth: number;
  frameHeight: number;
  selectedPalette: MSXColorValue[];
  transparentColor: MSXColorValue;
}

interface SpriteImportConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageData: ImageData | null;
  onImportConfirm: (newSpriteData: Omit<Sprite, 'id' | 'name'>) => void;
}

// Helper to convert RGB to Hex
const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

// Simple Euclidean distance for color comparison
const colorDistance = (r1:number,g1:number,b1:number, r2:number,g2:number,b2:number) => {
    return Math.sqrt(Math.pow(r1-r2,2) + Math.pow(g1-g2,2) + Math.pow(b1-b2,2));
};

export const SpriteImportConfigModal: React.FC<SpriteImportConfigModalProps> = ({
  isOpen,
  onClose,
  imageData,
  onImportConfirm,
}) => {
  const [frameWidth, setFrameWidth] = useState<number>(16);
  const [frameHeight, setFrameHeight] = useState<number>(16);
  const [detectedColors, setDetectedColors] = useState<string[]>([]);
  const [selectedPalette, setSelectedPalette] = useState<MSXColorValue[]>([]);
  const [transparentColor, setTransparentColor] = useState<MSXColorValue | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && imageData) {
      // Reset state on open
      setFrameWidth(16);
      setFrameHeight(16);
      setSelectedPalette([]);
      setTransparentColor(null);
      setErrorMessage(null);

      // Extract unique colors
      const uniqueColors = new Set<string>();
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const a = imageData.data[i + 3];
        if (a > 200) { // Consider only opaque pixels for palette
          uniqueColors.add(rgbToHex(r, g, b));
        }
      }
      const colorsArray = Array.from(uniqueColors);
      setDetectedColors(colorsArray);

      // Auto-select if <= 4 colors
      if (colorsArray.length <= 4) {
        const initialPalette = [...colorsArray];
        while (initialPalette.length < 4) {
          // Pad with default MSX colors if less than 4, avoid duplicates
          const defaultColorToAdd = MSX_SCREEN5_PALETTE.find(
            (msxColor, index) => index > 0 && !initialPalette.includes(msxColor.hex) // Skip transparent
          )?.hex || '#000000'; // Fallback to black
          if (!initialPalette.includes(defaultColorToAdd)) {
            initialPalette.push(defaultColorToAdd);
          } else { // If even default is duplicate, find next available
            for(let k=1; k < MSX_SCREEN5_PALETTE.length; k++){
                if(!initialPalette.includes(MSX_SCREEN5_PALETTE[k].hex)){
                    initialPalette.push(MSX_SCREEN5_PALETTE[k].hex);
                    break;
                }
            }
            if(initialPalette.length < 4) initialPalette.push('#111111'); // Last resort
          }
        }
        setSelectedPalette(initialPalette.slice(0,4) as MSXColorValue[]);
        if(initialPalette.length > 0) setTransparentColor(initialPalette[0]);
      }

      // Draw image preview
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.putImageData(imageData, 0, 0);
        }
      }
    }
  }, [isOpen, imageData]);

  const handlePaletteColorSelect = (color: MSXColorValue) => {
    setSelectedPalette(prev => {
      if (prev.includes(color)) {
        return prev.filter(c => c !== color);
      }
      if (prev.length < 4) {
        return [...prev, color];
      }
      return prev; // Max 4 colors
    });
    if (transparentColor === color && !selectedPalette.includes(color)) {
      setTransparentColor(null); // If deselecting the transparent color, clear it
    }
  };

  const handleTransparentColorSelect = (color: MSXColorValue) => {
    if (selectedPalette.includes(color)) {
      setTransparentColor(color);
    }
  };

  const handleSubmit = () => {
    setErrorMessage(null);
    if (frameWidth <= 0 || frameHeight <= 0) {
      setErrorMessage("Frame width and height must be positive.");
      return;
    }
    if (!imageData || imageData.width % frameWidth !== 0 || imageData.height !== frameHeight) {
      setErrorMessage("Image dimensions are not compatible with frame size. Image height must match frame height, and image width must be a multiple of frame width.");
      return;
    }
    if (selectedPalette.length !== 4) {
      setErrorMessage("Please select exactly 4 colors for the sprite palette.");
      return;
    }
    if (!transparentColor || !selectedPalette.includes(transparentColor)) {
      setErrorMessage("Please select one of the chosen palette colors to be transparent.");
      return;
    }
    
    // Process image data into frames
    const numFrames = imageData.width / frameWidth;
    const newFrames: SpriteFrame[] = [];
    
    const paletteRgb = selectedPalette.map(hex => ({
        hex,
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16),
    }));

    for (let i = 0; i < numFrames; i++) {
        const framePixelData: PixelData = [];
        const frameStartX = i * frameWidth;

        for (let y = 0; y < frameHeight; y++) {
            const row: MSXColorValue[] = [];
            for (let x = 0; x < frameWidth; x++) {
                const imgX = frameStartX + x;
                const imgY = y;
                const pixelIndex = (imgY * imageData.width + imgX) * 4;
                const r = imageData.data[pixelIndex];
                const g = imageData.data[pixelIndex + 1];
                const b = imageData.data[pixelIndex + 2];
                const a = imageData.data[pixelIndex + 3];

                let finalColor = transparentColor; // Default to transparent
                
                if (a > 128) { // Consider non-transparent pixels
                    // Find the closest color in the user-selected palette
                    let minDistance = Infinity;
                    paletteRgb.forEach(pColor => {
                        const dist = colorDistance(r,g,b, pColor.r, pColor.g, pColor.b);
                        if (dist < minDistance) {
                            minDistance = dist;
                            finalColor = pColor.hex;
                        }
                    });
                }
                row.push(finalColor);
            }
            framePixelData.push(row);
        }
        newFrames.push({ id: `imported_frame_${Date.now()}_${i}`, data: framePixelData });
    }

    onImportConfirm({
      size: { width: frameWidth, height: frameHeight },
      spritePalette: selectedPalette as [MSXColorValue,MSXColorValue,MSXColorValue,MSXColorValue],
      backgroundColor: transparentColor,
      frames: newFrames,
      currentFrameIndex: 0,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4">
      <div
        className="bg-msx-panelbg p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-xl animate-slideIn font-sans flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg text-msx-highlight mb-4">Import Sprite from PNG</h2>
        
        <div className="flex-grow overflow-y-auto pr-2 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="frameWidth" className="block text-msx-textsecondary mb-1">Frame Width (px):</label>
              <input type="number" id="frameWidth" value={frameWidth} onChange={e => setFrameWidth(parseInt(e.target.value, 10) || 0)} className="w-full p-2 bg-msx-bgcolor border border-msx-border rounded" min="8" step="8"/>
            </div>
            <div>
              <label htmlFor="frameHeight" className="block text-msx-textsecondary mb-1">Frame Height (px):</label>
              <input type="number" id="frameHeight" value={frameHeight} onChange={e => setFrameHeight(parseInt(e.target.value, 10) || 0)} className="w-full p-2 bg-msx-bgcolor border border-msx-border rounded" min="8" step="8"/>
            </div>
          </div>

          {imageData && (
            <div>
              <p className="text-xs text-msx-textsecondary mb-1">Image Preview ({imageData.width}x{imageData.height}):</p>
              <canvas ref={canvasRef} className="border border-msx-border max-w-full h-auto max-h-32 object-contain mx-auto" style={{ imageRendering: 'pixelated' }}/>
            </div>
          )}

          <div>
            <p className="text-xs text-msx-textsecondary mb-1">Detected Colors ({detectedColors.length} unique):</p>
            {detectedColors.length > 20 && <p className="text-xs text-msx-warning mb-1">Showing first 20 of {detectedColors.length} colors. Please select 4 for the palette.</p>}
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 border border-msx-border rounded bg-msx-bgcolor">
              {detectedColors.slice(0, detectedColors.length > 20 && selectedPalette.length < 4 ? 100 : 20).map(color => ( // Show more if too many unique colors
                <button
                  key={color}
                  onClick={() => handlePaletteColorSelect(color)}
                  className={`w-6 h-6 rounded border-2 ${selectedPalette.includes(color) ? 'border-msx-highlight ring-1 ring-msx-highlight' : 'border-msx-border hover:border-msx-accent'}`}
                  style={{ backgroundColor: color }}
                  title={`Select ${color}`}
                />
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-xs text-msx-textsecondary mb-1">Sprite Palette (Selected {selectedPalette.length}/4):</p>
            <div className="flex flex-wrap gap-2 p-1 border border-msx-border rounded bg-msx-bgcolor min-h-[36px]">
              {selectedPalette.map(color => (
                <div key={`sel-${color}`} className="flex flex-col items-center">
                    <button
                        className={`w-7 h-7 rounded border-2 ${transparentColor === color ? 'border-msx-danger ring-1 ring-msx-danger' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => handleTransparentColorSelect(color)}
                        title={transparentColor === color ? `Selected as Transparent: ${color}` : `Make ${color} Transparent Background`}
                    />
                    {transparentColor === color && <span className="text-[0.6rem] text-msx-danger leading-tight">BG</span>}
                </div>
              ))}
              {selectedPalette.length < 4 && Array(4 - selectedPalette.length).fill(0).map((_,i) => 
                <div key={`empty-${i}`} className="w-7 h-7 rounded border border-dashed border-msx-border bg-msx-panelbg/50"></div>
              )}
            </div>
             {selectedPalette.length === 4 && !transparentColor && <p className="text-xs text-msx-warning mt-1">Please click one of the 4 palette colors above to mark it as the transparent background.</p>}
          </div>


          {errorMessage && <p className="text-xs text-msx-danger">{errorMessage}</p>}
        </div>

        <div className="mt-6 pt-4 border-t border-msx-border flex justify-end space-x-2">
          <Button onClick={onClose} variant="ghost" size="md">Cancel</Button>
          <Button onClick={handleSubmit} variant="primary" size="md" disabled={selectedPalette.length !== 4 || !transparentColor}>
            Import Sprite
          </Button>
        </div>
      </div>
    </div>
  );
};
