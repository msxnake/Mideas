

import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';

interface ExportPletterModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapName: string;
  mapWidth: number;
  mapHeight: number;
  pletterDataBytes: number[];
  tilePartReferences: { byteValue: number; tileId: string; subTileX?: number; subTileY?: number, name?: string }[];
}

const BYTES_PER_LINE = 16;
const RLE_MARKER_PLETTER_DISPLAY = 201; // Decimal value for RLE marker (0xC9)

const formatDecimalBytesForDisplay = (bytes: number[]): string => {
  let decimalString = '';
  for (let i = 0; i < bytes.length; i += BYTES_PER_LINE) {
    const chunk = bytes.slice(i, i + BYTES_PER_LINE);
    decimalString += chunk.map(b => b.toString()).join(',') + (i + BYTES_PER_LINE < bytes.length ? ',\n' : '\n');
  }
  return decimalString;
};

const generatePletterASMCode = (
  mapName: string,
  mapWidth: number,
  mapHeight: number,
  pletterDataBytes: number[],
  tilePartReferences: { byteValue: number; tileId: string; subTileX?: number; subTileY?: number, name?: string }[]
): string => {
  const safeMapName = mapName.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
  let asmString = `;; PLETTER COMPRESSED MAP: ${mapName} (${mapWidth}x${mapHeight} tiles)\n`;
  asmString += `;; Total compressed size: ${pletterDataBytes.length} bytes\n`;
  asmString += `;; RLE Marker for Pletter is ${RLE_MARKER_PLETTER_DISPLAY} (Dec: ${RLE_MARKER_PLETTER_DISPLAY}, Hex: #${RLE_MARKER_PLETTER_DISPLAY.toString(16).toUpperCase()})\n\n`;

  if (tilePartReferences.length > 0) {
    asmString += `;; --- TILE PART BYTE REFERENCES for ${safeMapName} ---\n`;
    tilePartReferences.forEach(ref => {
      if (ref.byteValue !== RLE_MARKER_PLETTER_DISPLAY) {
        const decVal = ref.byteValue;
        const hexVal = ref.byteValue.toString(16).padStart(2, '0').toUpperCase();
        asmString += `;; Byte ${decVal} (Dec: ${decVal}, Hex: #${hexVal}) = Tile '${ref.name}' (ID: ${ref.tileId}${ref.subTileX !== undefined ? `, Part: ${ref.subTileX},${ref.subTileY}` : (ref.tileId === "EMPTY" ? "" : ", Full Tile")})\n`;
      }
    });
    asmString += '\n';
  }

  asmString += `${safeMapName}_PLETTER_DATA:\n`;

  for (let i = 0; i < pletterDataBytes.length; i += BYTES_PER_LINE) {
    const chunk = pletterDataBytes.slice(i, i + BYTES_PER_LINE);
    const decimalChunk = chunk.map(idx => idx.toString()); // Output as decimal
    asmString += `    DB ${decimalChunk.join(',')}\n`;
  }

  return asmString;
};


const PletterDataHighlighter: React.FC<{ code: string }> = ({ code }) => {
    const lines = code.split('\n');
    const rleMarkerDecimalString = RLE_MARKER_PLETTER_DISPLAY.toString();
    // Regex to match the RLE marker as a whole word/number
    const rleMarkerRegex = new RegExp(`\\b${rleMarkerDecimalString}\\b`, 'g');

    return (
      <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed p-2 h-full overflow-auto bg-msx-bgcolor text-msx-textprimary border border-msx-border rounded">
        {lines.map((line, index) => {
          // Highlight the RLE marker (decimal value)
          const highlightedLine = line.replace(
            rleMarkerRegex,
            (match) => `<span class="text-msx-accent">${match}</span>`
          );
          return (
            <div key={index} className="flex">
              <code dangerouslySetInnerHTML={{ __html: highlightedLine || ' ' }} />
            </div>
          );
        })}
      </pre>
    );
  };

export const ExportPletterModal: React.FC<ExportPletterModalProps> = ({
  isOpen,
  onClose,
  mapName,
  mapWidth,
  mapHeight,
  pletterDataBytes,
  tilePartReferences,
}) => {
  const [formattedPletterDataForDisplay, setFormattedPletterDataForDisplay] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormattedPletterDataForDisplay(formatDecimalBytesForDisplay(pletterDataBytes));
    }
  }, [isOpen, pletterDataBytes]);

  if (!isOpen) {
    return null;
  }

  const handleCopyToClipboard = () => {
    const rawDecimalNoLineBreaks = pletterDataBytes.map(b => b.toString()).join(',');
    navigator.clipboard.writeText(rawDecimalNoLineBreaks)
      .then(() => alert('Pletter data (comma-separated decimal) copied to clipboard!'))
      .catch(err => console.error('Failed to copy Pletter data: ', err));
  };
  
  const handleDownloadBIN = () => {
    const safeMapName = mapName.replace(/[^a-zA-Z0-9_]/g, '_');
    const filename = `${safeMapName}_pletter.bin`;
    const byteArray = new Uint8Array(pletterDataBytes);
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
  
  const handleDownloadASM = () => {
    const asmCode = generatePletterASMCode(mapName, mapWidth, mapHeight, pletterDataBytes, tilePartReferences);
    const safeMapName = mapName.replace(/[^a-zA-Z0-9_]/g, '_');
    const filename = `${safeMapName}_pletter.asm`;
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


  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exportPletterModalTitle"
    >
      <div 
        className="bg-msx-panelbg p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-3xl animate-slideIn pixel-font flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="exportPletterModalTitle" className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4">Export Map Layout (Pletter): {mapName}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow overflow-hidden mb-3 sm:mb-4">
            <div className="flex flex-col overflow-hidden">
                <h3 className="text-sm text-msx-cyan mb-1.5">Pletter Compressed Data ({pletterDataBytes.length} bytes):</h3>
                <div className="flex-grow overflow-auto border border-msx-border rounded">
                    <PletterDataHighlighter code={formattedPletterDataForDisplay} />
                </div>
                 <p className="text-[0.65rem] text-msx-textsecondary mt-1">
                    RLE Marker: <span className="text-msx-accent">{RLE_MARKER_PLETTER_DISPLAY}</span> (Dec: {RLE_MARKER_PLETTER_DISPLAY}, Hex: $C9). Format: Marker, Count, Value.
                    Literal Marker: Marker, 1, Marker.
                </p>
            </div>
            <div className="flex flex-col overflow-hidden">
                 <h3 className="text-sm text-msx-cyan mb-1.5">Tile Part References ({tilePartReferences.filter(ref => ref.byteValue !== RLE_MARKER_PLETTER_DISPLAY).length} unique parts):</h3>
                 <div className="flex-grow overflow-auto border border-msx-border rounded p-2 space-y-1 text-xs">
                    {tilePartReferences.map(ref => {
                      if (ref.byteValue === RLE_MARKER_PLETTER_DISPLAY) return null; // Don't list the RLE marker itself
                      const decVal = ref.byteValue;
                      const hexVal = ref.byteValue.toString(16).padStart(2,'0').toUpperCase();
                      return (
                        <div key={ref.byteValue}>
                           <span className={'text-msx-lightyellow'}>
                             {decVal} (Dec: {decVal}, Hex: ${hexVal})
                           </span>
                           <span className="text-msx-textprimary"> = {ref.name}</span>
                           {ref.tileId !== "EMPTY" && <span className="text-msx-textsecondary text-[0.7rem]"> (ID: {ref.tileId}, Part: {ref.subTileX ?? 0},{ref.subTileY ?? 0})</span>}
                        </div>
                      );
                    })}
                 </div>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
          <Button onClick={handleCopyToClipboard} variant="secondary" size="sm" className="w-full sm:w-auto">Copy Decimal Data</Button>
          <Button onClick={handleDownloadBIN} variant="primary" size="sm" className="w-full sm:w-auto">Download .BIN</Button>
          <Button onClick={handleDownloadASM} variant="primary" size="sm" className="w-full sm:w-auto">Download .ASM</Button>
          <Button onClick={onClose} variant="ghost" size="sm" className="w-full sm:w-auto">Close</Button>
        </div>
      </div>
    </div>
  );
};