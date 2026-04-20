

import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Z80SyntaxHighlighter } from '../common/Z80SyntaxHighlighter';
import { LayoutASMExportData } from '../../types';
import { generateScreenLayoutExportASMCode, generateScreenLayoutExportBinary } from '../utils/screenUtils'; 

/**
 * Props for the ExportLayoutASMModal component.
 */
interface ExportLayoutASMModalProps extends LayoutASMExportData {
  /** Whether the modal is currently open. */
  isOpen: boolean;
  /** Callback function to close the modal. */
  onClose: () => void;
}

const MODAL_DEFAULT_FONT_SIZE = 13; 
const MODAL_LINE_HEIGHT_MULTIPLIER = 1.5;


// Moved generateASMCode to screenUtils.ts for reuse

/**
 * A modal dialog for exporting a screen map layout as Z80 assembly code or a binary file.
 */
export const ExportLayoutASMModal: React.FC<ExportLayoutASMModalProps> = (props) => {
  const {
    isOpen,
    onClose,
    mapName,
    mapWidth,
    mapHeight,
    mapIndices,
    referenceComments,
    dataFormat,
  } = props;
  const [asmCode, setAsmCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAsmCode(generateScreenLayoutExportASMCode({
        mapName,
        mapWidth,
        mapHeight,
        mapIndices,
        referenceComments,
        dataFormat,
        exportMode: props.exportMode,
        blockData: props.blockData,
      }));
    }
  }, [isOpen, mapName, mapWidth, mapHeight, mapIndices, referenceComments, dataFormat, props.exportMode, props.blockData]);

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
    const filename = props.exportMode && props.exportMode !== 'raw'
      ? `${safeMapName}_${props.exportMode}.asm`
      : `${safeMapName}_layout.asm`;
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
    const filename = props.exportMode && props.exportMode !== 'raw'
      ? `${safeMapName}_${props.exportMode}.bin`
      : `${safeMapName}_layout.bin`;
    const byteArray = generateScreenLayoutExportBinary({
      mapName,
      mapWidth,
      mapHeight,
      mapIndices,
      referenceComments,
      dataFormat,
      exportMode: props.exportMode,
      blockData: props.blockData,
    });
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
  const isBlockExport = props.exportMode === 'blocks2x2' || props.exportMode === 'blocks4x4';
  const packedSizeBytes = props.blockData?.optimizedLengthBytes ?? mapIndices.length;
  const modalTitle = isBlockExport
    ? `Export Map Layout (${props.blockData?.blockWidth}x${props.blockData?.blockHeight} Block Map): ${mapName}`
    : `Export Map Layout: ${mapName}`;

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
        <h2 id="exportLayoutAsmModalTitle" className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4">{modalTitle}</h2>

        <div className="text-xs text-msx-textsecondary mb-2">
          <p>Mode: {isBlockExport ? props.exportMode : 'raw'} | Size: {mapWidth}x{mapHeight}</p>
          <p>Raw: {mapIndices.length} bytes | Exported: {packedSizeBytes} bytes{isBlockExport ? ' (+4B header in BIN)' : ''}</p>
        </div>

        <div className="flex-grow overflow-auto mb-3 sm:mb-4">
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
