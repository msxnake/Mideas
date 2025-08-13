

import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Sprite, PixelData, MSXColorValue, DataFormat } from '../../types'; 
import { Z80SyntaxHighlighter } from '../common/Z80SyntaxHighlighter';
import { generateSpriteBinaryData } from '../utils/spriteUtils'; // Updated import

interface ExportSpriteASMModalProps {
  isOpen: boolean;
  onClose: () => void;
  spriteToExport: Sprite;
  dataOutputFormat: DataFormat; 
}

const ASM_BYTES_PER_LINE = 16; 
const MODAL_DEFAULT_FONT_SIZE = 13;
const MODAL_LINE_HEIGHT_MULTIPLIER = 1.5;

// Helper function to ensure two-digit uppercase hex representation
const toHexByte = (num: number): string => {
  let hex = num.toString(16).toUpperCase();
  if (hex.length === 1) {
    hex = '0' + hex; // Manual padding
  }
  return hex;
};

const generateSingleFrameASMCode = (
  frameName: string, 
  frameData: PixelData,
  spritePalette: [MSXColorValue, MSXColorValue, MSXColorValue, MSXColorValue],
  backgroundColor: MSXColorValue,
  spriteWidth: number,
  spriteHeight: number,
  dataFormat: DataFormat 
): string => {
  const safeFrameName = frameName.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
  let asmString = `;; ---- Sprite Frame: ${frameName} ----\n`;
  asmString += `;; Size: ${spriteWidth}x${spriteHeight}\n`;
  
  let layersGenerated = 0;

  for (let layerIndex = 0; layerIndex < spritePalette.length; layerIndex++) {
    const layerColor = spritePalette[layerIndex];

    let colorUsed = false;
    if (layerColor !== backgroundColor) {
      for (let y = 0; y < spriteHeight; y++) {
        for (let x = 0; x < spriteWidth; x++) {
          if (frameData[y]?.[x] === layerColor) {
            colorUsed = true;
            break;
          }
        }
        if (colorUsed) break;
      }
    }

    if (!colorUsed) {
      asmString += `;; Layer ${layerIndex} (Color: ${layerColor}) - SKIPPED (color not used or is background)\n`;
      continue;
    }

    layersGenerated++;
    asmString += `${safeFrameName}_LAYER${layerIndex}: ; Brush Color Index ${layerIndex} (Actual Color: ${layerColor})\n`;
    
    const layerBytes: number[] = [];
    if (spriteWidth % 8 !== 0) {
        asmString += `;; WARNING: Sprite width ${spriteWidth} is not a multiple of 8. Bitmask generation might be problematic for standard VDP.\n`;
    }

    for (let y = 0; y < spriteHeight; y++) {
      for (let xByte = 0; xByte < Math.ceil(spriteWidth / 8); xByte++) {
        let byteValue = 0;
        for (let bit = 0; bit < 8; bit++) {
          const px = xByte * 8 + bit;
          if (px < spriteWidth) { 
            const pixelColorValue = frameData[y]?.[px];
            if (pixelColorValue === layerColor) {
              byteValue |= (1 << (7 - bit));
            }
          }
        }
        layerBytes.push(byteValue);
      }
    }

    for (let i = 0; i < layerBytes.length; i += ASM_BYTES_PER_LINE) {
      const chunk = layerBytes.slice(i, i + ASM_BYTES_PER_LINE);
      const formattedChunk = chunk.map(b => {
        return dataFormat === 'hex' ? `#${toHexByte(b)}` : b.toString();
      });
      asmString += `    DB ${formattedChunk.join(',')}\n`;
    }
    asmString += '\n';
  }

  if (layersGenerated === 0) {
    asmString += `;; NO ACTIVE LAYERS EXPORTED for ${frameName} - Frame might be empty or only contain the background color.\n`;
  }
  asmString += `;; ---- End of Frame: ${frameName} ----\n\n`;
  return asmString;
};


export const ExportSpriteASMModal: React.FC<ExportSpriteASMModalProps> = ({
  isOpen,
  onClose,
  spriteToExport,
  dataOutputFormat, 
}) => {
  const [asmCode, setAsmCode] = useState('');

  useEffect(() => {
    if (isOpen && spriteToExport) {
      let fullAsmCode = `;; Sprite: ${spriteToExport.name}\n`;
      fullAsmCode += `;; Total Frames: ${spriteToExport.frames.length}\n`;
      fullAsmCode += `;; Background Color (not exported as a layer): ${spriteToExport.backgroundColor}\n`;
      fullAsmCode += `;; Drawable Palette (Hex): C0=${spriteToExport.spritePalette[0]}, C1=${spriteToExport.spritePalette[1]}, C2=${spriteToExport.spritePalette[2]}, C3=${spriteToExport.spritePalette[3]}\n\n`;

      spriteToExport.frames.forEach((frame, index) => {
        fullAsmCode += generateSingleFrameASMCode(
          `${spriteToExport.name}_F${index}`, 
          frame.data,
          spriteToExport.spritePalette,
          spriteToExport.backgroundColor,
          spriteToExport.size.width,
          spriteToExport.size.height,
          dataOutputFormat 
        );
      });
      setAsmCode(fullAsmCode);
    }
  }, [isOpen, spriteToExport, dataOutputFormat]); 

  if (!isOpen || !spriteToExport) {
    return null;
  }
  const spriteNameForDisplay = spriteToExport.name;

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(asmCode)
      .then(() => alert('Sprite ASM code (all frames) copied to clipboard!'))
      .catch(err => console.error('Failed to copy sprite ASM code: ', err));
  };
  
  const handleDownloadASM = () => {
    const safeSpriteName = spriteNameForDisplay.replace(/[^a-zA-Z0-9_]/g, '_');
    const filename = `${safeSpriteName}_sprite_layers.asm`;
    const blob = new Blob([asmCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadBIN = () => {
    const binaryData = generateSpriteBinaryData(spriteToExport);
    const safeSpriteName = spriteNameForDisplay.replace(/[^a-zA-Z0-9_]/g, '_');
    const filename = `${safeSpriteName}_sprite_data.bin`;
    const blob = new Blob([binaryData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const editorLineHeight = MODAL_DEFAULT_FONT_SIZE * MODAL_LINE_HEIGHT_MULTIPLIER;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn p-4" 
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exportSpriteAsmModalTitle"
    >
      <div 
        className="bg-msx-panelbg p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-2xl animate-slideIn font-sans flex flex-col max-h-[90vh]" 
        onClick={e => e.stopPropagation()}
      >
        <h2 id="exportSpriteAsmModalTitle" className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4">Export Sprite Data: {spriteNameForDisplay}</h2>
        
        <div className="flex-grow overflow-hidden mb-3 sm:mb-4">
             <Z80SyntaxHighlighter 
                code={asmCode} 
                editorFontSize={MODAL_DEFAULT_FONT_SIZE}
                editorLineHeight={editorLineHeight}
            />
        </div>
        <p className="text-xs text-msx-textsecondary mb-3">
          ASM data represents bitmask layers for each frame. BIN data contains raw concatenated bytes of these layers.
          Output format for ASM: {dataOutputFormat.toUpperCase()}
        </p>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
          <Button onClick={handleCopyToClipboard} variant="secondary" size="md" className="w-full sm:w-auto">Copy ASM</Button>
          <Button onClick={handleDownloadASM} variant="primary" size="md" className="w-full sm:w-auto">Download .ASM</Button>
          <Button onClick={handleDownloadBIN} variant="primary" size="md" className="w-full sm:w-auto">Download .BIN</Button>
          <Button onClick={onClose} variant="ghost" size="md" className="w-full sm:w-auto">Close</Button>
        </div>
      </div>
    </div>
  );
};