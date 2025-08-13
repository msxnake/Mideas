

import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Z80SyntaxHighlighter } from '../common/Z80SyntaxHighlighter'; 
import { DataFormat } from '../../types'; 

interface ExportLayoutASMModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapName: string;
  mapWidth: number;
  mapHeight: number;
  mapIndices: number[];
  referenceComments: string[];
  dataFormat: DataFormat; 
}

const ASM_BYTES_PER_LINE = 16;
const MODAL_DEFAULT_FONT_SIZE = 13; 
const MODAL_LINE_HEIGHT_MULTIPLIER = 1.5;


const generateASMCode = (
  mapName: string,
  mapWidth: number,
  mapHeight: number,
  mapIndices: number[],
  referenceComments: string[],
  dataFormat: DataFormat 
): string => {
  const safeMapName = mapName.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
  let asmString = `;; MAP: ${mapName} (${mapWidth}x${mapHeight} tiles)\n`;
  asmString += `;; Total size: ${mapIndices.length} bytes\n\n`;
  
  if (referenceComments.length > 0) {
    asmString += `;; --- TILE INDEX REFERENCES for ${safeMapName} ---\n`;
    asmString += referenceComments.join('\n') + '\n\n';
  }

  asmString += `${safeMapName}_LAYOUT_DATA:\n`;

  for (let i = 0; i < mapIndices.length; i += ASM_BYTES_PER_LINE) {
    const chunk = mapIndices.slice(i, i + ASM_BYTES_PER_LINE);
    const formattedChunk = chunk.map(idx => {
        return dataFormat === 'hex' ? `#${idx.toString(16).padStart(2, '0').toUpperCase()}` : idx.toString();
    });
    asmString += `    DB ${formattedChunk.join(',')}\n`;
  }

  return asmString;
};

export const ExportLayoutASMModal: React.FC<ExportLayoutASMModalProps> = ({
  isOpen,
  onClose,
  mapName,
  mapWidth,
  mapHeight,
  mapIndices,
  referenceComments,
  dataFormat, 
}) => {
  const [asmCode, setAsmCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAsmCode(generateASMCode(mapName, mapWidth, mapHeight, mapIndices, referenceComments, dataFormat)); 
    }
  }, [isOpen, mapName, mapWidth, mapHeight, mapIndices, referenceComments, dataFormat]); 

  if (!isOpen) {
    return null;
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(asmCode)
      .then(() => alert('ASM code copied to clipboard!'))
      .catch(err => console.error('Failed to copy ASM code: ', err));
  };

  const handleDownloadASM = () => {
    const safeMapName = mapName.replace(/[^a-zA-Z0-9_]/g, '_');
    const filename = `${safeMapName}_layout.asm`;
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
    const safeMapName = mapName.replace(/[^a-zA-Z0-9_]/g, '_');
    const filename = `${safeMapName}_layout.bin`;
    const byteArray = new Uint8Array(mapIndices); // mapIndices are already 0-255
    const blob = new Blob([byteArray], { type: 'application/octet-stream' });
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
        aria-labelledby="exportLayoutAsmModalTitle"
    >
      <div 
        className="bg-msx-panelbg p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-2xl animate-slideIn font-sans flex flex-col max-h-[90vh]" 
        onClick={e => e.stopPropagation()}
      >
        <h2 id="exportLayoutAsmModalTitle" className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4">Export Map Layout: {mapName}</h2>
        
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