

import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Z80SyntaxHighlighter } from '../common/Z80SyntaxHighlighter';
import { DataFormat } from '../../types';
import { generateScreenLayoutASMCode } from '../utils/screenUtils'; 

/**
 * Props for the ExportLayoutASMModal component.
 */
interface ExportLayoutASMModalProps {
  /** Whether the modal is currently open. */
  isOpen: boolean;
  /** Callback function to close the modal. */
  onClose: () => void;
  /** The name of the map. */
  mapName: string;
  /** The width of the map in tiles. */
  mapWidth: number;
  /** The height of the map in tiles. */
  mapHeight: number;
  /** The map layout data, as an array of tile indices. */
  mapIndices: number[];
  /** Optional comments providing context for tile indices. */
  referenceComments: string[];
  /** The data format for exporting to ASM. */
  dataFormat: DataFormat; 
}

const ASM_BYTES_PER_LINE = 16;
const MODAL_DEFAULT_FONT_SIZE = 13; 
const MODAL_LINE_HEIGHT_MULTIPLIER = 1.5;


// Moved generateASMCode to screenUtils.ts for reuse

/**
 * A modal dialog for exporting a screen map layout as Z80 assembly code or a binary file.
 */
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
  const [hasUnassignedTiles, setHasUnassignedTiles] = useState(false);
  const [unassignedCount, setUnassignedCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Check for unassigned tiles (value 255 = 0xFF = EMPTY_CELL_CHAR_CODE)
      const unassigned = mapIndices.filter(idx => idx === 255);
      setHasUnassignedTiles(unassigned.length > 0);
      setUnassignedCount(unassigned.length);

      setAsmCode(generateScreenLayoutASMCode(mapName, mapWidth, mapHeight, mapIndices, referenceComments, dataFormat));
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

        {hasUnassignedTiles && (
          <div className="bg-yellow-900 border-l-4 border-yellow-500 p-3 mb-4 rounded">
            <div className="flex items-start">
              <span className="text-yellow-500 text-xl mr-2">⚠️</span>
              <div className="flex-1">
                <p className="text-yellow-200 font-semibold text-sm">Unassigned Tiles Detected</p>
                <p className="text-yellow-100 text-xs mt-1">
                  <strong>{unassignedCount}</strong> tile{unassignedCount !== 1 ? 's' : ''} in this map {unassignedCount !== 1 ? 'are' : 'is'} using value <code className="bg-yellow-950 px-1 rounded">255 (0xFF)</code>.
                </p>
                <p className="text-yellow-100 text-xs mt-2">
                  <strong>This usually means:</strong>
                </p>
                <ul className="text-yellow-100 text-xs mt-1 ml-4 list-disc space-y-1">
                  <li>Tiles are not assigned to any <strong>TileBank</strong> (in SCREEN 2 mode)</li>
                  <li>The tiles were deleted but are still referenced in the map</li>
                </ul>
                <p className="text-yellow-100 text-xs mt-2">
                  <strong>To fix:</strong> Open <strong>TileBank Editor</strong> and assign all tiles to a bank, or use a different Screen Mode.
                </p>
              </div>
            </div>
          </div>
        )}

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