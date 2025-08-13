import React from 'react';
import { Button } from '../common/Button';
import { Z80SyntaxHighlighter } from '../common/Z80SyntaxHighlighter';

interface ExportMainMenuASMModalProps {
  isOpen: boolean;
  onClose: () => void;
  asmCode: string;
}

const MODAL_DEFAULT_FONT_SIZE = 13;
const MODAL_LINE_HEIGHT_MULTIPLIER = 1.5;

export const ExportMainMenuASMModal: React.FC<ExportMainMenuASMModalProps> = ({
  isOpen,
  onClose,
  asmCode,
}) => {
  if (!isOpen) {
    return null;
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(asmCode)
      .then(() => alert('Main Menu ASM code copied to clipboard!'))
      .catch(err => console.error('Failed to copy Main Menu ASM code: ', err));
  };

  const handleDownloadASM = () => {
    const filename = `main_menu_config.asm`;
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
  
  const editorLineHeight = MODAL_DEFAULT_FONT_SIZE * MODAL_LINE_HEIGHT_MULTIPLIER;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadeIn p-4" 
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exportMainMenuAsmModalTitle"
    >
      <div 
        className="bg-msx-panelbg p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-2xl animate-slideIn font-sans flex flex-col max-h-[90vh]" 
        onClick={e => e.stopPropagation()}
      >
        <h2 id="exportMainMenuAsmModalTitle" className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4">Export Main Menu Configuration ASM</h2>
        
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
          <Button onClick={onClose} variant="ghost" size="md" className="w-full sm:w-auto">Close</Button>
        </div>
      </div>
    </div>
  );
};