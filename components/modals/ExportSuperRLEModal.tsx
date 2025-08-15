

import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Z80SyntaxHighlighter } from '../common/Z80SyntaxHighlighter';
import { SuperRLEExportData } from '../../types';

interface ExportSuperRLEModalProps extends SuperRLEExportData {
  isOpen: boolean;
  onClose: () => void;
}

const ASM_BYTES_PER_LINE = 16;
const MODAL_DEFAULT_FONT_SIZE = 13;
const MODAL_LINE_HEIGHT_MULTIPLIER = 1.5;
const RLE_MARKER_PLETTER_CONST = 0xC9; // Pletter's RLE marker

const SUPER_RLE_DECOMPRESSION_ROUTINE_ASM = `
  include "asm/rle_decompress.asm"
`;


const generateSuperRLE_ASMCode = (
  exportData: SuperRLEExportData
): string => {
  const { mapName, mapWidth, mapHeight, originalSize, compressedSize, superRLEDataBytes, tilePartReferences } = exportData;
  const safeMapName = mapName.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
  
  let asmString = `;; MAP: ${mapName} (${mapWidth}x${mapHeight} tiles)\n`;
  asmString += `;; COMPRESSION: SuperRLE (Literal + RLE + LZ Pattern Copy)\n`;
  asmString += `;; Original Size: ${originalSize} bytes\n`;
  asmString += `;; Compressed Size: ${compressedSize} bytes\n`;
  const ratio = originalSize > 0 ? (1 - compressedSize / originalSize) * 100 : 0;
  asmString += `;; Compression Ratio: ${ratio.toFixed(1)}%\n\n`;
  
  if (tilePartReferences && tilePartReferences.length > 0) {
    asmString += `;; --- TILE PART BYTE REFERENCES (for uncompressed data) ---\n`;
    tilePartReferences.forEach(ref => {
      // For SuperRLE, we generally list all byte values from the reference.
      // The Pletter-specific marker skip is not relevant here.
      const decVal = ref.byteValue;
      const hexVal = ref.byteValue.toString(16).padStart(2, '0').toUpperCase();
      asmString += `;; Byte ${decVal} (Dec: ${decVal}, Hex: #${hexVal}) = Tile '${ref.name}' (ID: ${ref.tileId}${ref.subTileX !== undefined ? `, Part: ${ref.subTileX},${ref.subTileY}` : (ref.tileId === null ? "" : ", Full Tile")})\n`;
    });
    asmString += '\n';
  }

  asmString += `${safeMapName}_SUPER_RLE_DATA:\n`;

  for (let i = 0; i < superRLEDataBytes.length; i += ASM_BYTES_PER_LINE) {
    const chunk = superRLEDataBytes.slice(i, i + ASM_BYTES_PER_LINE);
    // SuperRLE example output is decimal, so we'll use decimal here.
    const formattedChunk = chunk.map(idx => idx.toString());
    asmString += `    DB ${formattedChunk.join(',')}\n`;
  }
  asmString += `\n${SUPER_RLE_DECOMPRESSION_ROUTINE_ASM}\n`;
  asmString += `;; End of SuperRLE Data for ${mapName}\n`;
  return asmString;
};

export const ExportSuperRLEModal: React.FC<ExportSuperRLEModalProps> = (props) => {
  const { isOpen, onClose, mapName, superRLEDataBytes, tilePartReferences } = props; // Added tilePartReferences
  const [asmCode, setAsmCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAsmCode(generateSuperRLE_ASMCode(props));
    }
  }, [isOpen, props]);

  if (!isOpen) {
    return null;
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(asmCode)
      .then(() => alert('SuperRLE ASM code copied to clipboard!'))
      .catch(err => console.error('Failed to copy SuperRLE ASM code: ', err));
  };

  const handleDownloadASM = () => {
    const safeMapName = mapName.replace(/[^a-zA-Z0-9_]/g, '_');
    const filename = `${safeMapName}_superRLE.asm`;
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
    const filename = `${safeMapName}_superRLE.bin`;
    const byteArray = new Uint8Array(superRLEDataBytes);
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
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4" 
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exportSuperRLEModalTitle"
    >
      <div 
        className="bg-msx-panelbg p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-3xl animate-slideIn font-sans flex flex-col max-h-[90vh]" 
        onClick={e => e.stopPropagation()}
      >
        <h2 id="exportSuperRLEModalTitle" className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4">Export Map Layout (SuperRLE): {mapName}</h2>
        
        <div className="text-xs text-msx-textsecondary mb-2">
          <p>Original Size: {props.originalSize} bytes | Compressed Size: {props.compressedSize} bytes</p>
          <p>Ratio: {(props.originalSize > 0 ? (1 - props.compressedSize / props.originalSize) * 100 : 0).toFixed(1)}% compression</p>
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