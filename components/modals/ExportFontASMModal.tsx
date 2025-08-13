

import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Z80SyntaxHighlighter } from '../common/Z80SyntaxHighlighter';
import { MSXFont, MSXFontColorAttributes, MSXCharacterPattern } from '../../types'; // Added MSXFontColorAttributes
import { generateFontPatternBinaryData, generateFontColorBinaryData } from '../utils/msxFontUtils'; // New imports

interface ExportFontASMModalProps {
  isOpen: boolean;
  onClose: () => void;
  fontName: string;
  asmCode: string;
  fontData: MSXFont; 
  fontColorAttributes: MSXFontColorAttributes; 
  filterEditableCharsOnly: boolean; 
  currentScreenMode: string; 
}

const MODAL_DEFAULT_FONT_SIZE = 13;
const MODAL_LINE_HEIGHT_MULTIPLIER = 1.5;


export const ExportFontASMModal: React.FC<ExportFontASMModalProps> = ({
  isOpen,
  onClose,
  fontName,
  asmCode,
  fontData,
  fontColorAttributes,
  filterEditableCharsOnly,
  currentScreenMode,
}) => {

  if (!isOpen) {
    return null;
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(asmCode)
      .then(() => alert('Font ASM code copied to clipboard!'))
      .catch(err => console.error('Failed to copy font ASM code: ', err));
  };

  const handleDownloadASM = () => {
    const safeFontName = fontName.replace(/[^a-zA-Z0-9_]/g, '_') || 'msx_custom_font';
    const filename = `${safeFontName}${filterEditableCharsOnly ? '_subset' : '_full'}.asm`;
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

  const downloadBinaryFile = (data: Uint8Array, baseName: string, suffix: string) => {
    const safeName = baseName.replace(/[^a-zA-Z0-9_]/g, '_');
    const filename = `${safeName}${filterEditableCharsOnly ? '_subset' : '_full'}_${suffix}.bin`;
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPatternBIN = () => {
    const binaryData = generateFontPatternBinaryData(fontData, !filterEditableCharsOnly);
    downloadBinaryFile(binaryData, fontName, "patterns");
  };

  const handleDownloadColorBIN = () => {
    if (currentScreenMode !== "SCREEN 2 (Graphics I)") {
        alert("Font color binary export is only relevant for SCREEN 2.");
        return;
    }
    const binaryData = generateFontColorBinaryData(fontColorAttributes, !filterEditableCharsOnly);
    downloadBinaryFile(binaryData, fontName, "colors");
  };

  const editorLineHeight = MODAL_DEFAULT_FONT_SIZE * MODAL_LINE_HEIGHT_MULTIPLIER;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exportFontAsmModalTitle"
    >
      <div 
        className="bg-msx-panelbg p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-2xl animate-slideIn font-sans flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="exportFontAsmModalTitle" className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4">Export Font Data: {fontName} {filterEditableCharsOnly ? "(Editable Subset)" : "(All 256 Chars)"}</h2>
        
        <div className="flex-grow overflow-hidden mb-3 sm:mb-4">
            <Z80SyntaxHighlighter 
                code={asmCode}
                editorFontSize={MODAL_DEFAULT_FONT_SIZE}
                editorLineHeight={editorLineHeight}
            />
        </div>
        <p className="text-xs text-msx-textsecondary mb-3">
          ASM data represents the 8x8 pixel patterns. BIN data is raw byte sequences.
          {currentScreenMode === "SCREEN 2 (Graphics I)" && " Color BIN contains SCREEN 2 row attributes."}
        </p>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
          <Button onClick={handleCopyToClipboard} variant="secondary" size="md" className="w-full sm:w-auto">Copy ASM</Button>
          <Button onClick={handleDownloadASM} variant="primary" size="md" className="w-full sm:w-auto">DL .ASM</Button>
          <Button onClick={handleDownloadPatternBIN} variant="primary" size="md" className="w-full sm:w-auto">DL Patterns .BIN</Button>
          {currentScreenMode === "SCREEN 2 (Graphics I)" && (
            <Button onClick={handleDownloadColorBIN} variant="primary" size="md" className="w-full sm:w-auto">DL Colors .BIN</Button>
          )}
          <Button onClick={onClose} variant="ghost" size="md" className="w-full sm:w-auto">Close</Button>
        </div>
      </div>
    </div>
  );
};