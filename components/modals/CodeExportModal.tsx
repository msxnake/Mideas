import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Panel } from '../common/Panel';
import { ProjectAsset } from '../../types';
import { 
  generateCompleteGameAssembly, 
  generateTileAssembly, 
  generateSpriteAssembly, 
  generateScreenMapAssembly,
  generateEntityAssembly,
  CodeGenerationOptions,
  DEFAULT_CODE_OPTIONS
} from '../../utils/z80CodeGenerator';
import { CodeIcon, SaveIcon, CompilerIcon } from '../icons/MsxIcons';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: ProjectAsset[];
}

type ExportType = 'complete' | 'tiles' | 'sprites' | 'screens' | 'entities';

export const CodeExportModal: React.FC<CodeExportModalProps> = ({
  isOpen,
  onClose,
  assets
}) => {
  const [exportType, setExportType] = useState<ExportType>('complete');
  const [options, setOptions] = useState<CodeGenerationOptions>(DEFAULT_CODE_OPTIONS);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationResult, setCompilationResult] = useState<{ success: boolean; message: string; data?: string } | null>(null);

  const handleGenerateCode = () => {
    setIsGenerating(true);
    
    try {
      let code = '';
      
      switch (exportType) {
        case 'complete':
          code = generateCompleteGameAssembly(assets, options);
          break;
          
        case 'tiles':
          const tiles = assets.filter(a => a.type === 'tile').map(a => a.data as any);
          code = generateTileAssembly(tiles, options);
          break;
          
        case 'sprites':
          const sprites = assets.filter(a => a.type === 'sprite').map(a => a.data as any);
          code = generateSpriteAssembly(sprites, options);
          break;
          
        case 'screens':
          const screenMaps = assets.filter(a => a.type === 'screenmap').map(a => a.data as any);
          const tilesForScreens = assets.filter(a => a.type === 'tile').map(a => a.data as any);
          code = screenMaps.map(screen => 
            generateScreenMapAssembly(screen, tilesForScreens, options)
          ).join('\n');
          break;
          
        case 'entities':
          const mainScreen = assets.filter(a => a.type === 'screenmap').map(a => a.data as any)
            .find(s => s.layers.entities.length > 0);
          const components = assets.filter(a => a.type === 'componentdefinition').map(a => a.data as any);
          const templates = assets.filter(a => a.type === 'entitytemplate').map(a => a.data as any);
          
          if (mainScreen && components.length > 0 && templates.length > 0) {
            code = generateEntityAssembly(mainScreen.layers.entities, components, templates, options);
          } else {
            code = '; No entities found or missing component definitions/templates';
          }
          break;
      }
      
      setGeneratedCode(code);
    } catch (error) {
      setGeneratedCode(`; Error generating code: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCompileCode = async () => {
    if (!generatedCode.trim()) {
      alert('Generate code first before compiling');
      return;
    }

    setIsCompiling(true);
    setCompilationResult(null);

    try {
      const response = await fetch('http://localhost:3001/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: generatedCode
        }),
      });

      const result = await response.json();
      setCompilationResult(result);
    } catch (error) {
      setCompilationResult({
        success: false,
        message: `Compilation failed: ${error}`
      });
    } finally {
      setIsCompiling(false);
    }
  };

  const handleSaveCode = () => {
    if (!generatedCode.trim()) {
      alert('No code to save');
      return;
    }

    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportType}_code_${new Date().toISOString().split('T')[0]}.asm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getAssetCount = (type: string) => {
    return assets.filter(a => a.type === type).length;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="codeExportModalTitle"
    >
      <div
        className="bg-msx-panelbg p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-7xl animate-slideIn pixel-font flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="codeExportModalTitle" className="text-md sm:text-lg text-msx-highlight mb-3 sm:mb-4">
          Export Z80 Assembly Code
        </h2>

        <div className="flex space-x-4 flex-grow overflow-hidden">
        {/* Left Panel - Configuration */}
        <div className="w-1/3 space-y-4">
          <Panel title="Export Configuration" icon={<CodeIcon className="w-4 h-4" />}>
            <div className="space-y-3 p-3">
              <div>
                <label className="block text-sm font-medium text-msx-textsecondary mb-2">
                  Export Type:
                </label>
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value as ExportType)}
                  className="w-full p-2 text-sm bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary"
                >
                  <option value="complete">Complete Game ({assets.length} assets)</option>
                  <option value="tiles">Tiles Only ({getAssetCount('tile')} tiles)</option>
                  <option value="sprites">Sprites Only ({getAssetCount('sprite')} sprites)</option>
                  <option value="screens">Screen Maps ({getAssetCount('screenmap')} screens)</option>
                  <option value="entities">Entities ({getAssetCount('entitytemplate')} templates)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-msx-textsecondary mb-2">
                  Data Format:
                </label>
                <select
                  value={options.dataFormat}
                  onChange={(e) => setOptions({...options, dataFormat: e.target.value as 'hex' | 'binary' | 'decimal'})}
                  className="w-full p-2 text-sm bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary"
                >
                  <option value="hex">Hexadecimal (#FF)</option>
                  <option value="binary">Binary (%11111111)</option>
                  <option value="decimal">Decimal (255)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-msx-textsecondary mb-2">
                  MSX Model:
                </label>
                <select
                  value={options.msxModel}
                  onChange={(e) => setOptions({...options, msxModel: e.target.value as 'MSX1' | 'MSX2' | 'MSX2+'})}
                  className="w-full p-2 text-sm bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary"
                >
                  <option value="MSX1">MSX1</option>
                  <option value="MSX2">MSX2</option>
                  <option value="MSX2+">MSX2+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-msx-textsecondary mb-2">
                  Base Address:
                </label>
                <input
                  type="text"
                  value={`#${(options.baseAddress || 0x8000).toString(16).toUpperCase()}`}
                  onChange={(e) => {
                    const hex = e.target.value.replace('#', '');
                    const addr = parseInt(hex, 16);
                    if (!isNaN(addr)) {
                      setOptions({...options, baseAddress: addr});
                    }
                  }}
                  className="w-full p-2 text-sm bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary font-mono"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeComments"
                  checked={options.includeComments}
                  onChange={(e) => setOptions({...options, includeComments: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="includeComments" className="text-sm text-msx-textsecondary">
                  Include Comments
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="optimize"
                  checked={options.optimize}
                  onChange={(e) => setOptions({...options, optimize: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="optimize" className="text-sm text-msx-textsecondary">
                  Optimize Code
                </label>
              </div>
            </div>
          </Panel>

          <Panel title="Actions">
            <div className="p-3 space-y-2">
              <Button
                onClick={handleGenerateCode}
                disabled={isGenerating}
                variant="primary"
                icon={<CodeIcon />}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate Code'}
              </Button>

              <Button
                onClick={handleCompileCode}
                disabled={isCompiling || !generatedCode.trim()}
                variant="secondary"
                icon={<CompilerIcon />}
                className="w-full"
              >
                {isCompiling ? 'Compiling...' : 'Compile with Glass'}
              </Button>

              <Button
                onClick={handleSaveCode}
                disabled={!generatedCode.trim()}
                variant="ghost"
                icon={<SaveIcon />}
                className="w-full"
              >
                Save Assembly File
              </Button>
            </div>
          </Panel>

          {compilationResult && (
            <Panel title="Compilation Result" className={compilationResult.success ? "border-green-500" : "border-red-500"}>
              <div className="p-3">
                <div className={`text-sm ${compilationResult.success ? 'text-green-400' : 'text-red-400'}`}>
                  {compilationResult.success ? '✓ Compilation successful!' : '✗ Compilation failed'}
                </div>
                <div className="text-xs text-msx-textsecondary mt-1 font-mono">
                  {compilationResult.message}
                </div>
                {compilationResult.success && compilationResult.data && (
                  <div className="text-xs text-msx-textsecondary mt-2">
                    Binary size: {compilationResult.data.length / 2} bytes
                  </div>
                )}
              </div>
            </Panel>
          )}
        </div>

        {/* Right Panel - Code Output */}
        <div className="w-2/3 flex flex-col">
          <Panel title="Generated Assembly Code" className="flex-1 flex flex-col">
            <div className="flex-1 p-3 min-h-0">
              <textarea
                value={generatedCode}
                onChange={(e) => setGeneratedCode(e.target.value)}
                className="w-full h-full text-xs font-mono bg-msx-bgcolor border border-msx-border rounded p-2 text-msx-textprimary resize-none"
                placeholder="Generated Z80 assembly code will appear here..."
                style={{ minHeight: '500px' }}
              />
            </div>
          </Panel>
        </div>
        </div>

        <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-msx-border">
          <Button onClick={onClose} variant="ghost">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};