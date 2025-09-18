
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Panel } from '../common/Panel';
import { Button } from '../common/Button';
import { Z80SyntaxHighlighter } from '../common/Z80SyntaxHighlighter';
import { Z80_SNIPPETS } from '../../constants';
import { ZoomInIcon, ZoomOutIcon, FolderOpenIcon, SaveFloppyIcon } from '../icons/MsxIcons';

/**
 * Props for the CodeEditor component.
 */
interface CodeEditorProps {
  /** The code content to be displayed and edited. */
  code: string;
  /** Callback function to update the code content. */
  onUpdate: (code: string) => void;
  /** The programming language for syntax highlighting. */
  language: 'z80';
  /** The name of the asset being edited, used for context. */
  assetName?: string;
  /** A snippet of code to be inserted into the editor. */
  snippetToInsert: { code: string; timestamp: number } | null;
}

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 32;
const FONT_SIZE_STEP = 1;
const DEFAULT_FONT_SIZE = 14;
const LINE_HEIGHT_MULTIPLIER = 1.625;

/**
 * A code editor component with syntax highlighting for Z80 assembly.
 * It features a textarea for input layered under a `pre` tag for highlighting,
 * providing a seamless editing experience.
 */
export const CodeEditor: React.FC<CodeEditorProps> = ({ code: initialCode, onUpdate, language, assetName, snippetToInsert: propsSnippetToInsert }): JSX.Element => {
  const [code, setCode] = useState(initialCode);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlighterRef = useRef<HTMLPreElement>(null);
  const desiredCursorPosRef = useRef<number | null>(null);
  const setCursorAfterUpdateRef = useRef<boolean>(false);
  const [editorFontSize, setEditorFontSize] = useState(DEFAULT_FONT_SIZE);
  const lastInsertedSnippetTimestampRef = useRef<number | null>(null);

  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const [saveAsFilename, setSaveAsFilename] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // OpenMSX integration states
  const [isCompiling, setIsCompiling] = useState(false);
  const [isRunningOpenMSX, setIsRunningOpenMSX] = useState(false);
  const [isGeneratingScreenshot, setIsGeneratingScreenshot] = useState(false);
  const [compiledRomFile, setCompiledRomFile] = useState<string | null>(null);
  const [compilationMessage, setCompilationMessage] = useState<string>('');
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  useEffect(() => {
    // Sync local code with prop if it changes externally,
    // but only if it's truly different from what's in the textarea to avoid cursor jumps.
    if (textareaRef.current && initialCode !== textareaRef.current.value) {
        setCode(initialCode);
        // If initialCode changes, we might want to reset cursor or move to end.
        // For now, just updating content.
        if (desiredCursorPosRef.current === null) { // Avoid overriding cursor if it's being set by snippet
          const newPos = initialCode.length;
          textareaRef.current.selectionStart = newPos;
          textareaRef.current.selectionEnd = newPos;
        }
    } else if (!textareaRef.current && initialCode !== code) { // Initial mount or if ref not yet available
        setCode(initialCode);
    }
  }, [initialCode, code]);


  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = event.target.value;
    setCode(newCode);
    onUpdate(newCode);
  };

  const handleScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
    if (highlighterRef.current) {
      highlighterRef.current.scrollTop = event.currentTarget.scrollTop;
      highlighterRef.current.scrollLeft = event.currentTarget.scrollLeft;
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      const target = event.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const currentCodeValue = target.value;
      const indent = '    '; 

      if (start !== end) { 
        let firstLineStart = currentCodeValue.lastIndexOf('\n', start - 1) + 1;
        if (start === 0 && firstLineStart === -1) firstLineStart = 0;

        const linesToModify = currentCodeValue.substring(firstLineStart, end).split('\n');
        let newStartOffset = 0;
        let newEndOffset = 0;

        const processedLines = linesToModify.map((line, idx) => {
          if (event.shiftKey) { 
            if (line.startsWith(indent)) {
              if (idx === 0 && start > firstLineStart) newStartOffset -= indent.length;
              newEndOffset -= indent.length;
              return line.substring(indent.length);
            } else if (line.startsWith(" ") || line.startsWith("\t")) {
              const originalLength = line.length;
              const unindentedLine = line.trimStart();
              const removedLength = originalLength - unindentedLine.length;
              if (idx === 0 && start > firstLineStart) newStartOffset -= removedLength;
              newEndOffset -= removedLength;
              return unindentedLine;
            }
          } else { 
            if (idx === 0 && start > firstLineStart ) newStartOffset += indent.length;
            newEndOffset += indent.length;
            return indent + line;
          }
          return line;
        });

        const newCode = currentCodeValue.substring(0, firstLineStart) +
                        processedLines.join('\n') +
                        currentCodeValue.substring(end);
        
        setCode(newCode);
        onUpdate(newCode);

        const finalNewStart = Math.max(firstLineStart, start + newStartOffset);
        const finalNewEnd = Math.max(finalNewStart, end + newEndOffset);
        
        desiredCursorPosRef.current = finalNewEnd;
        setTimeout(() => {
          target.focus();
          target.selectionStart = finalNewStart;
          target.selectionEnd = finalNewEnd;
        },0);

      } else { 
          const currentLineStart = currentCodeValue.lastIndexOf('\n', start - 1) + 1;
          let newCode;
          let newCursorPos;

          if (event.shiftKey) {
            const lineContentBeforeCursor = currentCodeValue.substring(currentLineStart, start);
            if (lineContentBeforeCursor.startsWith(indent)) {
              newCode = currentCodeValue.substring(0, currentLineStart) +
                        lineContentBeforeCursor.substring(indent.length) +
                        currentCodeValue.substring(start);
              newCursorPos = start - indent.length;
            } else if (lineContentBeforeCursor.trim().length === 0 && lineContentBeforeCursor.length > 0) { 
              newCode = currentCodeValue.substring(0, currentLineStart) + currentCodeValue.substring(start);
              newCursorPos = currentLineStart;
            } else {
              return; 
            }
          } else {
            newCode = currentCodeValue.substring(0, start) + indent + currentCodeValue.substring(end);
            newCursorPos = start + indent.length;
          }

          setCode(newCode);
          onUpdate(newCode);

          setTimeout(() => {
            target.focus();
            target.selectionStart = target.selectionEnd = newCursorPos;
          }, 0);
      }
    }
  };

  const insertSnippet = useCallback((snippetCodeToInsert: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const currentCodeValue = textarea.value;
      const selectionStart = textarea.selectionStart;
      
      // Find the end of the line where the cursor (selectionStart) is
      let endOfCurrentLine = currentCodeValue.indexOf('\n', selectionStart);
      if (endOfCurrentLine === -1) { // Cursor is on the last line or in empty editor
        endOfCurrentLine = currentCodeValue.length;
      }
      
      const partBeforeInsertionPoint = currentCodeValue.substring(0, endOfCurrentLine);
      const partAfterInsertionPoint = currentCodeValue.substring(endOfCurrentLine);

      // Ensure the snippet starts on a new line relative to the current line's end
      const prefixNewline = (endOfCurrentLine > 0 && currentCodeValue[endOfCurrentLine - 1] !== '\n' && currentCodeValue.length > 0) ? '\n' : '';
      
      let snippetContent = snippetCodeToInsert;
      // If we're adding a prefix newline and the snippet itself starts with one, remove snippet's leading newline
      if (prefixNewline === '\n' && snippetContent.startsWith('\n')) {
        snippetContent = snippetContent.substring(1);
      }
      
      // Ensure there's a newline after the snippet if content follows and snippet doesn't end with one
      const suffixNewline = (partAfterInsertionPoint.length > 0 && !snippetContent.endsWith('\n') && !partAfterInsertionPoint.startsWith('\n')) ? '\n' : '';

      const finalSnippetToInsert = prefixNewline + snippetContent + suffixNewline;
      const newCode = partBeforeInsertionPoint + finalSnippetToInsert + partAfterInsertionPoint;
      
      const newCursorPos = partBeforeInsertionPoint.length + prefixNewline.length + snippetContent.length; // Cursor after snippet content, before suffixNewline

      desiredCursorPosRef.current = newCursorPos;
      setCursorAfterUpdateRef.current = true;

      setCode(newCode); // Update local state
      onUpdate(newCode); // Update parent state
    }
  }, [onUpdate]); 


  useEffect(() => {
    if (propsSnippetToInsert && textareaRef.current && propsSnippetToInsert.timestamp !== lastInsertedSnippetTimestampRef.current) {
      insertSnippet(propsSnippetToInsert.code);
      lastInsertedSnippetTimestampRef.current = propsSnippetToInsert.timestamp;
    }
  }, [propsSnippetToInsert, insertSnippet]);

  useEffect(() => {
    if (setCursorAfterUpdateRef.current && textareaRef.current && desiredCursorPosRef.current !== null) {
      textareaRef.current.selectionStart = desiredCursorPosRef.current;
      textareaRef.current.selectionEnd = desiredCursorPosRef.current;
      
      setCursorAfterUpdateRef.current = false;
      desiredCursorPosRef.current = null;
    }
  }, [code]); // Depends on local 'code' state

  const increaseFontSize = () => setEditorFontSize(prev => Math.min(MAX_FONT_SIZE, prev + FONT_SIZE_STEP));
  const decreaseFontSize = () => setEditorFontSize(prev => Math.max(MIN_FONT_SIZE, prev - FONT_SIZE_STEP));

  const handleLoadFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileContent = e.target?.result as string;
        setCode(fileContent);
        onUpdate(fileContent);
        alert(`File ${file.name} loaded successfully!`);
      } catch (error) {
        console.error("Error reading file:", error);
        alert("Failed to read file.");
      }
    };
    reader.onerror = () => {
      alert("Error reading file.");
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };

  const handleOpenSaveAsModal = () => {
    setSaveAsFilename(assetName || 'custom_code.asm');
    setIsSaveAsModalOpen(true);
  };

  const handleConfirmSaveAs = () => {
    if (!saveAsFilename.trim()) {
      alert("Filename cannot be empty.");
      return;
    }
    const filenameToSave = saveAsFilename.endsWith('.asm') ? saveAsFilename : `${saveAsFilename}.asm`;

    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filenameToSave;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsSaveAsModalOpen(false);
  };

  // OpenMSX integration functions
  const compileCode = async () => {
    if (!code.trim()) {
      alert("No code to compile!");
      return;
    }

    setIsCompiling(true);
    setCompilationMessage('');

    try {
      const response = await fetch('http://localhost:3001/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setCompiledRomFile(result.romFile);
        setCompilationMessage(`✅ ROM compiled successfully: ${result.romFile}`);
        alert(`ROM compiled successfully!\nFile: ${result.romFile}\nSize: ${result.romSizeInfo.paddedSize} bytes (${result.romSizeInfo.sizeIn8KB}×8KB)`);
      } else {
        setCompilationMessage(`❌ Compilation failed: ${result.details || result.error}`);
        alert(`Compilation failed:\n${result.details || result.error}`);
      }
    } catch (error) {
      console.error('Compilation error:', error);
      setCompilationMessage(`❌ Network error during compilation`);
      alert('Failed to connect to compilation server');
    } finally {
      setIsCompiling(false);
    }
  };

  const runOpenMSX = async () => {
    if (!compiledRomFile) {
      await compileCode();
      if (!compiledRomFile) return; // If compilation failed
    }

    setIsRunningOpenMSX(true);

    try {
      const response = await fetch('http://localhost:3001/run-openmsx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ romFile: compiledRomFile })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(`OpenMSX started successfully!\n${result.note}`);
      } else {
        alert(`Failed to start OpenMSX:\n${result.details || result.error}`);
      }
    } catch (error) {
      console.error('OpenMSX launch error:', error);
      alert('Failed to connect to OpenMSX service');
    } finally {
      setIsRunningOpenMSX(false);
    }
  };

  const generateScreenshot = async () => {
    if (!compiledRomFile) {
      await compileCode();
      if (!compiledRomFile) return; // If compilation failed
    }

    setIsGeneratingScreenshot(true);

    try {
      const response = await fetch('http://localhost:3001/generate-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          romFile: compiledRomFile,
          waitSeconds: 10
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const screenshotPath = `/screenshot/${result.screenshot.filename}`;
        setScreenshotUrl(`http://localhost:3001${screenshotPath}`);
        alert(`Screenshot generated successfully!\nFile: ${result.screenshot.filename}\nSize: ${result.screenshot.size} bytes`);
      } else {
        alert(`Screenshot generation failed:\n${result.details || result.error}`);
      }
    } catch (error) {
      console.error('Screenshot generation error:', error);
      alert('Failed to generate screenshot');
    } finally {
      setIsGeneratingScreenshot(false);
    }
  };

  const editorLineHeight = editorFontSize * LINE_HEIGHT_MULTIPLIER;

  return (
    <Panel title="Z80 Assembly Editor" className="flex-grow flex flex-col bg-msx-bgcolor overflow-hidden h-full">
      <input type="file" accept=".asm,.z80,.s" ref={fileInputRef} onChange={handleFileSelected} className="hidden" />
      <div className="p-1 border-b border-msx-border flex items-center space-x-2">
        <Button onClick={handleLoadFileClick} size="sm" variant="ghost" title="Load ASM File" icon={<FolderOpenIcon className="w-4 h-4"/>}><span className="hidden sm:inline">Load</span></Button>
        <Button onClick={handleOpenSaveAsModal} size="sm" variant="ghost" title="Save ASM File As..." icon={<SaveFloppyIcon className="w-4 h-4"/>}><span className="hidden sm:inline">Save As...</span></Button>

        {/* OpenMSX Integration Buttons */}
        <div className="border-l border-msx-border pl-2 ml-2 flex items-center space-x-1">
          <Button
            onClick={compileCode}
            size="sm"
            variant="primary"
            disabled={isCompiling}
            title="Compile Z80 code to ROM"
          >
            {isCompiling ? '⏳ Compiling...' : '🔧 Compile'}
          </Button>
          <Button
            onClick={runOpenMSX}
            size="sm"
            variant="secondary"
            disabled={isRunningOpenMSX || isCompiling}
            title="Run ROM in OpenMSX for testing"
          >
            {isRunningOpenMSX ? '⏳ Opening...' : '🎮 RUN OPENMSX'}
          </Button>
          <Button
            onClick={generateScreenshot}
            size="sm"
            variant="secondary"
            disabled={isGeneratingScreenshot || isCompiling}
            title="Generate screenshot of ROM execution"
          >
            {isGeneratingScreenshot ? '⏳ Capturing...' : '📷 Generate Screenshot'}
          </Button>
        </div>

        <span className="text-xs font-sans text-msx-textsecondary ml-auto mr-2">Z80 (MSX)</span>
        <div className="flex items-center space-x-1">
          <Button onClick={decreaseFontSize} size="sm" variant="ghost" title="Decrease font size (Zoom Out)" icon={<ZoomOutIcon className="w-4 h-4"/>} disabled={editorFontSize <= MIN_FONT_SIZE}>{null}</Button>
          <span className="text-xs text-msx-textsecondary w-10 text-center tabular-nums">{editorFontSize}px</span>
          <Button onClick={increaseFontSize} size="sm" variant="ghost" title="Increase font size (Zoom In)" icon={<ZoomInIcon className="w-4 h-4"/>} disabled={editorFontSize >= MAX_FONT_SIZE}>{null}</Button>
        </div>
      </div>
      <div className="flex-grow relative overflow-hidden"> {/* Removed md:w-3/4 */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          spellCheck="false"
          className="absolute inset-0 w-full h-full resize-none bg-transparent text-transparent caret-msx-textprimary font-mono p-2 pl-12 border-none outline-none z-10 overflow-auto"
          style={{ fontSize: `${editorFontSize}px`, lineHeight: `${editorLineHeight}px` }}
          aria-label="Z80 Assembly Code Editor"
          autoCapitalize="off"
          autoCorrect="off"
        />
        <Z80SyntaxHighlighter
          ref={highlighterRef}
          code={code}
          editorFontSize={editorFontSize}
          editorLineHeight={editorLineHeight}
        />
      </div>
      <div className="p-1 border-t border-msx-border text-xs text-msx-textsecondary font-sans">
        <div className="flex items-center justify-between">
          <div>
            Lines: {code.split('\n').length} | Chars: {code.length}
          </div>
          <div className="flex items-center space-x-2">
            {compilationMessage && (
              <span className={`text-xs ${compilationMessage.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
                {compilationMessage}
              </span>
            )}
            {compiledRomFile && (
              <span className="text-xs text-blue-400">
                ROM: {compiledRomFile}
              </span>
            )}
          </div>
        </div>
      </div>

      {isSaveAsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn" onClick={() => setIsSaveAsModalOpen(false)}>
          <div className="bg-msx-panelbg p-6 rounded-lg shadow-xl max-w-md w-full animate-slideIn pixel-font" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg text-msx-highlight mb-4">Save ASM File As</h2>
            <input
              type="text"
              value={saveAsFilename}
              onChange={(e) => setSaveAsFilename(e.target.value)}
              placeholder="Enter filename (e.g., my_code.asm)"
              className="w-full p-2 mb-4 bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary focus:ring-msx-accent focus:border-msx-accent"
            />
            <div className="flex justify-end space-x-2">
              <Button onClick={() => setIsSaveAsModalOpen(false)} variant="ghost" size="md">Cancel</Button>
              <Button onClick={handleConfirmSaveAs} variant="primary" size="md">Save</Button>
            </div>
          </div>
        </div>
      )}

      {screenshotUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn" onClick={() => setScreenshotUrl(null)}>
          <div className="bg-msx-panelbg p-6 rounded-lg shadow-xl max-w-2xl w-full animate-slideIn pixel-font" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg text-msx-highlight mb-4">📷 ROM Screenshot</h2>
            <div className="bg-msx-bgcolor p-4 rounded border border-msx-border mb-4">
              <img
                src={screenshotUrl}
                alt="MSX ROM Screenshot"
                className="w-full h-auto border border-msx-border"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="flex justify-between">
              <a
                href={screenshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-msx-accent hover:text-msx-highlight text-sm underline"
              >
                Open in new tab
              </a>
              <Button onClick={() => setScreenshotUrl(null)} variant="primary" size="md">Close</Button>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
};
