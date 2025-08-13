import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Z80SyntaxHighlighter } from '../common/Z80SyntaxHighlighter';
import { OptimizedRLEExportData } from '../../types';

interface ExportOptimizedRLEModalProps extends OptimizedRLEExportData {
  isOpen: boolean;
  onClose: () => void;
}

const MODAL_DEFAULT_FONT_SIZE = 13;
const MODAL_LINE_HEIGHT_MULTIPLIER = 1.5;

const generateOptimizedRLE_ASMCode = (
  exportData: OptimizedRLEExportData,
  fileName: string
): string => {
  const { mapName, mapWidth, mapHeight, originalSize, compressedSize, optimizedRLEPackets, decompressorAsm } = exportData;
  const safeMapName = mapName.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
  
  let asmString = `;; MAP: ${mapName} (${mapWidth}x${mapHeight} tiles)\n`;
  asmString += `;; COMPRESSION: Optimized RLE (Literal/Repeat Packets)\n`;
  asmString += `;; Original Size: ${originalSize} bytes\n`;
  asmString += `;; Compressed Size: ${compressedSize + 2} bytes (Width+Height+Packets)\n`;
  const ratio = originalSize > 0 ? (1 - (compressedSize + 2) / originalSize) * 100 : 0;
  asmString += `;; Compression Ratio: ${ratio.toFixed(1)}%\n\n`;
  
  asmString += `${safeMapName}_RLE_DATA:\n`;
  asmString += `    INCBIN "${fileName}"\n\n`;
  asmString += decompressorAsm;
  asmString += `\n;; End of Optimized RLE Data for ${mapName}\n`;
  return asmString;
};

export const ExportOptimizedRLEModal: React.FC<ExportOptimizedRLEModalProps> = (props) => {
  const { isOpen, onClose, mapName, optimizedRLEPackets } = props;
  const [asmCode, setAsmCode] = useState('');

  const binFilename = `${mapName.replace(/[^a-zA-Z0-9_]/g, '_')}_optimized_rle.bin`;

  useEffect(() => {
    if (isOpen) {
      setAsmCode(generateOptimizedRLE_ASMCode(props, binFilename));
    }
  }, [isOpen, props, binFilename]);

  if (!isOpen) {
    return null;
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(asmCode)
      .then(() => alert('Optimized RLE ASM code copied to clipboard!'))
      .catch(err => console.error('Failed to copy Optimized RLE ASM code: ', err));
  };

  const handleDownloadASM = () => {
    const safeMapName = mapName.replace(/[^a-zA-Z0-9_]/g, '_');
    const filename = `${safeMapName}_optimized_rle.asm`;
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
    // Binary file format: Width (1 byte), Height (1 byte), Compressed Data...
    const finalByteArray = new Uint8Array(2 + optimizedRLEPackets.length);
    finalByteArray[0] = props.mapWidth;
    finalByteArray[1] = props.mapHeight;
    finalByteArray.set(optimizedRLEPackets, 2);

    const blob = new Blob([finalByteArray], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = binFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const editorLineHeight = MODAL_DEFAULT_FONT_SIZE * MODAL_LINE_HEIGHT_MULTIPLIER;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4" 
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exportOptimizedRLEModalTitle"
    >
      <div 
        className="bg-msx-panelbg p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-3xl animate-slideIn font-sans flex flex-col max-h-[90vh]" 
        onClick={e => e.stopPropagation()}
      >
        <h2 id="exportOptimizedRLEModalTitle" className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4">Export Map Layout (Optimized RLE): {mapName}</h2>
        
        <div className="text-xs text-msx-textsecondary mb-2">
          <p>Original Size: {props.originalSize} bytes | Compressed Size: {props.compressedSize + 2} bytes (incl. W/H)</p>
          <p>Ratio: {(props.originalSize > 0 ? (1 - (props.compressedSize + 2) / props.originalSize) * 100 : 0).toFixed(1)}% compression</p>
        </div>

        <div className="flex-grow overflow-hidden mb-3 sm:mb-4">
            <Z80SyntaxHighlighter 
                code={asmCode} 
                editorFontSize={MODAL_DEFAULT_FONT_SIZE}
                editorLineHeight={editorLineHeight}
            />
        </div>

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
