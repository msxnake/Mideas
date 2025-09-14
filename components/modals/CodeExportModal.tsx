import React, { useState } from 'react';
import JSZip from 'jszip';
import { Button } from '../common/Button';
import { Panel } from '../common/Panel';
import { ProjectAsset } from '../../types';
import { 
  generateCompleteGameAssembly, 
  generateCompleteGameWithStateMachine,
  generateStateMachineAssembly,
  createProjectStateMachineCopy,
  generateTileAssembly, 
  generateSpriteAssembly, 
  generateScreenMapAssembly,
  generateEntityAssembly,
  CodeGenerationOptions,
  DEFAULT_CODE_OPTIONS
} from '../../utils/z80CodeGenerator';
import { 
  generateProjectSpecificASM,
  analyzeProject 
} from '../../utils/asmTemplateGenerator';
import { 
  generateMainASM,
  generateMSXProjectFiles,
  DEFAULT_MSX_CONFIG,
  MSXProjectConfig
} from '../../utils/msxMainGenerator';
import { generateSpriteBinaryData } from '../utils/spriteUtils';
import { generateTilePatternBytes } from '../utils/tileUtils';
import { CodeIcon, SaveIcon, CompilerIcon } from '../icons/MsxIcons';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: ProjectAsset[];
  currentProjectName?: string | null;
  projectData?: any; // Full project data including tileBanks
}

type ExportType = 'complete' | 'complete_with_statemachine' | 'statemachine_only' | 'dynamic_project_asm' | 'msx_main_asm' | 'msx_full_project' | 'asm_all_in_one' | 'tiles' | 'sprites' | 'screens' | 'entities';

interface GeneratedFile {
  name: string;
  content: string;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({
  isOpen,
  onClose,
  assets,
  currentProjectName,
  projectData
}) => {
  const [exportType, setExportType] = useState<ExportType>('complete');
  const [options, setOptions] = useState<CodeGenerationOptions>(DEFAULT_CODE_OPTIONS);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationResult, setCompilationResult] = useState<{ success: boolean; message: string; data?: string } | null>(null);
  const [projectAnalysis, setProjectAnalysis] = useState<any>(null);

  const handleFileTabChange = (index: number) => {
    setActiveFileIndex(index);
    if (generatedFiles[index]) {
      setGeneratedCode(generatedFiles[index].content);
    }
  };

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    
    try {
      let code = '';
      let files: GeneratedFile[] = [];
      
      const projectName = currentProjectName || "MSX_Project";
      
      switch (exportType) {
        case 'complete':
          code = generateCompleteGameAssembly(assets, options);
          files = [{ name: 'main.asm', content: code }];
          break;
          
        case 'complete_with_statemachine':
          code = generateCompleteGameWithStateMachine(projectName, assets, options);
          files = [{ name: 'main_with_statemachine.asm', content: code }];
          break;
          
        case 'statemachine_only':
          code = generateStateMachineAssembly(projectName, assets, options);
          files = [{ name: 'statemachine.asm', content: code }];
          break;
          
        case 'dynamic_project_asm':
          const result = generateProjectSpecificASM(projectName, assets);
          code = result.content;
          files = [{ name: 'dynamic_project.asm', content: code }];
          setProjectAnalysis(result.analysis);
          break;
          
        case 'msx_main_asm':
          const msxConfig: MSXProjectConfig = {
            ...DEFAULT_MSX_CONFIG,
            projectName,
            targetMSX: options.msxModel as any,
            baseAddress: options.baseAddress || 0x4000
          };
          code = generateMainASM(projectName, assets, msxConfig);
          files = [{ name: 'main.asm', content: code }];
          break;
          
        case 'msx_full_project':
          const projectFiles = generateMSXProjectFiles(projectName, assets, {
            ...DEFAULT_MSX_CONFIG,
            projectName,
            targetMSX: options.msxModel as any,
            baseAddress: options.baseAddress || 0x4000
          });
          
          // Generate multiple files from the project structure
          files = Object.entries(projectFiles)
            .filter(([path, content]) => path.endsWith('.asm'))
            .map(([path, content]) => ({
              name: path.replace(/^src\//, '').replace(/\//g, '_'),
              content: content
            }));
          
          // Set the first file content as main display
          code = files.length > 0 ? files[0].content : '; No ASM files generated';
          
          // Show preview if no specific files
          if (files.length === 0) {
            code = `; Professional ECS MSX Project Generated:\n`;
            code += `; \n`;
            code += `; 📁 Project Structure:\n`;
            code += `; ├── src/\n`;
            code += `; │   ├── main.asm (entry point)\n`;
            code += `; │   ├── constants.asm (MSX constants)\n`;
            code += `; │   ├── macros.asm (utility macros)\n`;
            code += `; │   ├── ecs/ (Entity-Component-System)\n`;
            code += `; │   ├── core/ (memory, scheduler)\n`;
            code += `; │   └── screens/ (game screens)\n`;
            code += `; ├── assets/ (sprites, maps)\n`;
            code += `; ├── tools/ (PNG→BIN converters)\n`;
            code += `; ├── docs/ (documentation)\n`;
            code += `; ├── Makefile (build system)\n`;
            code += `; └── README.md (documentation)\n`;
            code += `; \n`;
            code += `; Total files: ${Object.keys(projectFiles).length}\n`;
            code += `; Download ZIP for complete structure\n\n`;
            
            // Show main.asm as preview
            code += `; ===== PREVIEW: src/main.asm =====\n\n`;
            code += projectFiles['src/main.asm'] || '; Error: Could not load main.asm';
            files = [{ name: 'project_preview.asm', content: code }];
          }
          break;
          
        case 'tiles':
          const tiles = assets.filter(a => a.type === 'tile').map(a => a.data as any);
          if (tiles.length > 1) {
            // Generate separate files for each tile
            files = tiles.map((tile, index) => ({
              name: `tile_${index}.asm`,
              content: generateTileAssembly([tile], options)
            }));
            // Also create a combined file
            files.unshift({
              name: 'all_tiles.asm',
              content: generateTileAssembly(tiles, options)
            });
            code = files[0].content;
          } else {
            code = generateTileAssembly(tiles, options);
            files = [{ name: 'tiles.asm', content: code }];
          }
          break;
          
        case 'sprites':
          const sprites = assets.filter(a => a.type === 'sprite').map(a => a.data as any);
          if (sprites.length > 1) {
            // Generate separate files for each sprite
            files = sprites.map((sprite, index) => ({
              name: `sprite_${index}.asm`,
              content: generateSpriteAssembly([sprite], options)
            }));
            // Also create a combined file
            files.unshift({
              name: 'all_sprites.asm',
              content: generateSpriteAssembly(sprites, options)
            });
            code = files[0].content;
          } else {
            code = generateSpriteAssembly(sprites, options);
            files = [{ name: 'sprites.asm', content: code }];
          }
          break;
          
        case 'screens':
          const screenMaps = assets.filter(a => a.type === 'screenmap').map(a => a.data as any);
          const tilesForScreens = assets.filter(a => a.type === 'tile').map(a => a.data as any);
          
          if (screenMaps.length > 1) {
            // Generate separate files for each screen
            files = screenMaps.map((screen, index) => ({
              name: `screen_${index}.asm`,
              content: generateScreenMapAssembly(screen, tilesForScreens, options)
            }));
            // Also create a combined file
            files.unshift({
              name: 'all_screens.asm',
              content: screenMaps.map(screen => 
                generateScreenMapAssembly(screen, tilesForScreens, options)
              ).join('\n\n')
            });
            code = files[0].content;
          } else {
            code = screenMaps.map(screen => 
              generateScreenMapAssembly(screen, tilesForScreens, options)
            ).join('\n');
            files = [{ name: 'screens.asm', content: code }];
          }
          break;

        case 'asm_all_in_one':
          const { generateUnitedFilesASM } = await import('../../utils/msxMainGenerator');
          code = generateUnitedFilesASM(projectName, assets, {
            ...DEFAULT_MSX_CONFIG,
            projectName,
            targetMSX: options.msxModel as any,
            baseAddress: 0x4000  // Konami standard address
          }, projectData); // Pass the full project data including tileBanks
          files = [{ name: 'unitedFiles.asm', content: code }];
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
          files = [{ name: 'entities.asm', content: code }];
          break;
      }
      
      setGeneratedCode(code);
      setGeneratedFiles(files);
      setActiveFileIndex(0);
    } catch (error) {
      const errorCode = `; Error generating code: ${error}`;
      setGeneratedCode(errorCode);
      setGeneratedFiles([{ name: 'error.asm', content: errorCode }]);
      setActiveFileIndex(0);
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

      // Enhanced error logging for Glass compilation issues
      if (!response.ok || !result.success) {
        console.error('Glass compilation failed:', result);

        // Show detailed error information
        setCompilationResult({
          success: false,
          message: result.details || result.error || 'Unknown compilation error',
          fullDetails: result
        });
      } else {
        setCompilationResult(result);
      }
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

    const currentFile = generatedFiles[activeFileIndex];
    const filename = currentFile ? currentFile.name : `${exportType}_code_${new Date().toISOString().split('T')[0]}.asm`;

    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCreateProjectCopy = () => {
    const projectName = currentProjectName || "MSX_Project";
    
    try {
      const result = createProjectStateMachineCopy(projectName, assets, options);
      
      // Create and download the file
      const blob = new Blob([result.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert(`Project-specific state machine saved as ${result.filename}\n\nConfiguration:\n- ECS: ${result.config.useECS ? 'Enabled' : 'Disabled'}\n- Custom States: ${result.config.customStates.length}\n- Menu: ${result.config.includeMenu ? 'Yes' : 'No'}`);
      
    } catch (error) {
      alert(`Error creating project copy: ${error}`);
    }
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
        <div className="w-1/3 space-y-4 overflow-y-auto max-h-full">
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
                  <option value="complete_with_statemachine">Complete Game + State Machine</option>
                  <option value="statemachine_only">State Machine Only</option>
                  <option value="dynamic_project_asm">🔥 Dynamic Project ASM (Recommended)</option>
                  <option value="msx_main_asm">📁 MSX Main.asm with Includes</option>
                  <option value="msx_full_project">🎮 Complete MSX Project Structure</option>
                  <option value="asm_all_in_one">🔧 ASM (all in one) - Konami ROM</option>
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
                  value={`#${(options.baseAddress || 0x4000).toString(16).toUpperCase()}`}
                  onChange={(e) => {
                    let value = e.target.value;
                    
                    // Allow typing # at the beginning
                    if (!value.startsWith('#')) {
                      value = '#' + value;
                    }
                    
                    // Remove # for parsing
                    const hex = value.replace('#', '');
                    
                    // Allow empty input while typing
                    if (hex === '') {
                      return;
                    }
                    
                    // Only allow valid hex characters
                    if (!/^[0-9A-Fa-f]*$/.test(hex)) {
                      return;
                    }
                    
                    const addr = parseInt(hex, 16);
                    if (!isNaN(addr) && addr >= 0 && addr <= 0xFFFF) {
                      setOptions({...options, baseAddress: addr});
                    }
                  }}
                  onBlur={(e) => {
                    // Ensure we have a valid address on blur
                    const value = e.target.value.replace('#', '');
                    if (value === '' || isNaN(parseInt(value, 16))) {
                      setOptions({...options, baseAddress: 0x4000});
                    }
                  }}
                  placeholder="#4000"
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

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeStateMachine"
                  checked={options.includeStateMachine || false}
                  onChange={(e) => setOptions({...options, includeStateMachine: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="includeStateMachine" className="text-sm text-msx-textsecondary">
                  Include State Machine
                </label>
              </div>

              {(exportType === 'complete_with_statemachine' || exportType === 'statemachine_only') && (
                <div className="bg-msx-highlight bg-opacity-10 p-2 rounded text-xs text-msx-textsecondary">
                  <p>💡 State Machine will be automatically analyzed and optimized for your project assets:</p>
                  <ul className="mt-1 ml-4 text-xs">
                    <li>• ECS integration: {getAssetCount('componentdefinition') > 0 ? 'Enabled' : 'Disabled'}</li>
                    <li>• Multiple screens: {getAssetCount('screenmap') > 1 ? 'Yes' : 'No'}</li>
                    <li>• Custom states: Auto-detected</li>
                  </ul>
                </div>
              )}
              
              {exportType === 'dynamic_project_asm' && (
                <div className="bg-green-500 bg-opacity-10 p-2 rounded text-xs text-msx-textsecondary">
                  <p>🔥 <strong>Dynamic Project ASM:</strong> Generates project-specific code with hot spots that adapt to your components!</p>
                  <ul className="mt-1 ml-4 text-xs">
                    <li>• Smart ECS integration based on your components</li>
                    <li>• Custom input handling for your game controls</li>
                    <li>• Optimized collision detection system</li>
                    <li>• Sprite animation system tailored to your assets</li>
                    <li>• Menu system generation (if detected)</li>
                    <li>• Custom state handlers for project-specific logic</li>
                  </ul>
                </div>
              )}
              
              {exportType === 'msx_main_asm' && (
                <div className="bg-blue-500 bg-opacity-10 p-2 rounded text-xs text-msx-textsecondary">
                  <p>📁 <strong>MSX Main.asm:</strong> Generates a structured main assembly file with proper includes</p>
                  <ul className="mt-1 ml-4 text-xs">
                    <li>• Automatic INCLUDE statements for all project assets</li>
                    <li>• ROM header generation for cartridge games</li>
                    <li>• System initialization and memory organization</li>
                    <li>• Asset loading stub functions</li>
                    <li>• Ready for MSX/bin binary asset integration</li>
                  </ul>
                </div>
              )}
              
              {exportType === 'msx_full_project' && (
                <div className="bg-purple-500 bg-opacity-10 p-2 rounded text-xs text-msx-textsecondary">
                  <p>🎮 <strong>Professional ECS MSX Project:</strong> Complete ZIP with organized folder structure</p>
                  <ul className="mt-1 ml-4 text-xs">
                    <li>• 📁 <strong>src/</strong> - ECS architecture (entity manager, systems, components)</li>
                    <li>• 📁 <strong>assets/</strong> - Sprite PNGs, entity CSV definitions</li>
                    <li>• 📁 <strong>tools/</strong> - Python converters (PNG→BIN, CSV→ASM)</li>
                    <li>• 📁 <strong>docs/</strong> - ECS design docs, memory layout</li>
                    <li>• 🔧 <strong>Makefile</strong> - Professional build system with Glass</li>
                    <li>• 📋 <strong>README.md</strong> - Complete documentation & usage guide</li>
                  </ul>
                </div>
              )}

              {projectAnalysis && exportType === 'dynamic_project_asm' && (
                <div className="bg-blue-500 bg-opacity-10 p-2 rounded text-xs text-msx-textsecondary">
                  <p><strong>Project Analysis Results:</strong></p>
                  <ul className="mt-1 ml-4 text-xs">
                    <li>• ECS System: {projectAnalysis.hasECS ? '✅ Detected' : '❌ Not detected'}</li>
                    <li>• Components: {projectAnalysis.components.length}</li>
                    <li>• Entity Templates: {projectAnalysis.templates.length}</li>
                    <li>• Sprites: {projectAnalysis.sprites.length} ({projectAnalysis.hasAnimations ? 'with animations' : 'static'})</li>
                    <li>• Screen Maps: {projectAnalysis.screenMaps.length}</li>
                    <li>• Collisions: {projectAnalysis.hasCollisions ? '✅ Detected' : '❌ Not detected'}</li>
                    <li>• Menu System: {projectAnalysis.hasMenuSystem ? '✅ Detected' : '❌ Not detected'}</li>
                    {projectAnalysis.customStates.length > 0 && (
                      <li>• Custom States: {projectAnalysis.customStates.join(', ')}</li>
                    )}
                  </ul>
                </div>
              )}

              {exportType === 'asm_all_in_one' && (
                <div className="bg-orange-500 bg-opacity-10 p-2 rounded text-xs text-msx-textsecondary">
                  <p>🔧 <strong>ASM (all in one):</strong> Single file Konami cartridge ROM</p>
                  <ul className="mt-1 ml-4 text-xs">
                    <li>• 📄 Single file: <strong>unitedFiles.asm</strong></li>
                    <li>• 🎮 Konami cartridge header (#4000 base address)</li>
                    <li>• 🔗 All assets and systems inline (no includes)</li>
                    <li>• 🎯 Ready to compile with glass.jar</li>
                    <li>• 🚀 Game Flow integration for main menu</li>
                    <li>• 💾 Creates .ROM file for MSX emulators/flash carts</li>
                  </ul>
                </div>
              )}
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

              {(exportType === 'statemachine_only' || exportType === 'complete_with_statemachine') && (
                <Button
                  onClick={handleCreateProjectCopy}
                  disabled={isGenerating}
                  variant="secondary"
                  className="w-full"
                >
                  Create Project Copy
                </Button>
              )}
              
              {exportType === 'dynamic_project_asm' && (
                <Button
                  onClick={() => {
                    const projectName = currentProjectName || "MSX_Project";
                    const result = generateProjectSpecificASM(projectName, assets);
                    
                    const blob = new Blob([result.content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = result.filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    alert(`Dynamic ASM generated and saved as ${result.filename}!\n\nFeatures detected:\n- ECS: ${result.analysis.hasECS}\n- Animations: ${result.analysis.hasAnimations}\n- Collisions: ${result.analysis.hasCollisions}\n- Menu: ${result.analysis.hasMenuSystem}`);
                  }}
                  disabled={isGenerating}
                  variant="primary"
                  className="w-full"
                >
                  🔥 Generate & Download Dynamic ASM
                </Button>
              )}
              
              {exportType === 'msx_full_project' && (
                <Button
                  onClick={async () => {
                    const projectName = currentProjectName || "MSX_Project";
                    const msxConfig: MSXProjectConfig = {
                      ...DEFAULT_MSX_CONFIG,
                      projectName,
                      targetMSX: options.msxModel as any,
                      baseAddress: options.baseAddress || 0x4000
                    };
                    
                    try {
                      const projectFiles = generateMSXProjectFiles(projectName, assets, msxConfig);
                      
                      // Create ZIP with proper folder structure
                      const zip = new JSZip();
                      const projectFolderName = `${projectName.toLowerCase()}_ecs_msx`;
                      const projectFolder = zip.folder(projectFolderName);
                      
                      if (!projectFolder) {
                        throw new Error("Could not create project folder in ZIP");
                      }
                      
                      // Add all files to ZIP with proper folder structure
                      Object.entries(projectFiles).forEach(([filepath, content]) => {
                        if (filepath.includes('/')) {
                          // Handle nested folders (e.g., "src/ecs/entity_manager.asm")
                          const parts = filepath.split('/');
                          const filename = parts.pop()!;
                          const folderPath = parts.join('/');
                          
                          const folder = projectFolder.folder(folderPath);
                          if (folder) {
                            folder.file(filename, content);
                          }
                        } else {
                          // Root level file
                          projectFolder.file(filepath, content);
                        }
                      });

                      // Add binary sprite assets to assets/sprites/
                      const spritesFolder = projectFolder.folder('assets/sprites');
                      if (spritesFolder) {
                        const spriteAssets = assets.filter(a => a.type === 'sprite');
                        
                        if (spriteAssets.length > 0) {
                          // Generate combined sprites binary
                          const allSpriteDataArrays: Uint8Array[] = [];
                          spriteAssets.forEach(asset => {
                            const sprite = asset.data as any;
                            // Use the existing sprite binary generation function from App.tsx
                            try {
                              const spriteBinaryData = generateSpriteBinaryData(sprite);
                              allSpriteDataArrays.push(spriteBinaryData);
                            } catch (error) {
                              console.warn(`Could not generate binary for sprite ${asset.name}`, error);
                            }
                          });
                          
                          if (allSpriteDataArrays.length > 0) {
                            // Create combined sprite binary
                            const totalSpriteDataLength = allSpriteDataArrays.reduce((sum, arr) => sum + arr.length, 0);
                            const combinedSpriteDataBytes = new Uint8Array(totalSpriteDataLength);
                            let offset = 0;
                            allSpriteDataArrays.forEach(arr => {
                              combinedSpriteDataBytes.set(arr, offset);
                              offset += arr.length;
                            });
                            
                            spritesFolder.file('all_sprites.bin', combinedSpriteDataBytes);
                          }
                          
                          // Also create individual sprite binaries for reference
                          spriteAssets.forEach((asset, index) => {
                            try {
                              const sprite = asset.data as any;
                              const spriteBinaryData = generateSpriteBinaryData(sprite);
                              const sanitizedName = asset.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                              spritesFolder.file(`${sanitizedName}.bin`, spriteBinaryData);
                            } catch (error) {
                              console.warn(`Could not generate individual binary for sprite ${asset.name}`, error);
                            }
                          });
                        } else {
                          // Create placeholder file if no sprites
                          spritesFolder.file('README.txt', 'Place your sprite .bin files here\n\nUse tools/png2msx.py to convert PNG files to MSX binary format');
                        }
                      }

                      // Add binary tile assets to assets/tiles/
                      const tilesFolder = projectFolder.folder('assets/tiles');
                      if (tilesFolder) {
                        const tileAssets = assets.filter(a => a.type === 'tile');
                        
                        if (tileAssets.length > 0) {
                          // Generate combined tiles binary
                          const allPatternsBytesArrays: Uint8Array[] = [];
                          tileAssets.forEach(asset => {
                            const tile = asset.data as any;
                            try {
                              const tilePatternBytes = generateTilePatternBytes(tile, options.msxModel === 'MSX1' ? 'SCREEN 2 (Graphics I)' : 'SCREEN 4');
                              allPatternsBytesArrays.push(tilePatternBytes);
                            } catch (error) {
                              console.warn(`Could not generate binary for tile ${asset.name}`, error);
                            }
                          });
                          
                          if (allPatternsBytesArrays.length > 0) {
                            const totalPatternLength = allPatternsBytesArrays.reduce((sum, arr) => sum + arr.length, 0);
                            const combinedPatternBytes = new Uint8Array(totalPatternLength);
                            let offset = 0;
                            allPatternsBytesArrays.forEach(arr => {
                              combinedPatternBytes.set(arr, offset);
                              offset += arr.length;
                            });
                            
                            tilesFolder.file('all_patterns.bin', combinedPatternBytes);
                          }
                        } else {
                          tilesFolder.file('README.txt', 'Place your tile .bin files here\n\nTiles will be generated from your project data');
                        }
                      }
                      
                      // Generate and download ZIP
                      const zipBlob = await zip.generateAsync({ type: "blob" });
                      const url = URL.createObjectURL(zipBlob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${projectFolderName}.zip`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      
                      alert(`✅ Professional ECS MSX Project created!\n\n📦 Downloaded: ${projectFolderName}.zip\n\n🏗️ Structure:\n- src/ (ECS architecture)\n- assets/ (sprites, maps)\n- tools/ (converters)\n- docs/ (documentation)\n- build system (Makefile, Glass config)\n\n🚀 Ready to extract and build!`);
                      
                    } catch (error) {
                      alert(`Error creating MSX project: ${error instanceof Error ? error.message : "Unknown error"}`);
                    }
                  }}
                  disabled={isGenerating}
                  variant="primary"
                  className="w-full"
                >
                  🎮 Download Complete MSX Project ZIP
                </Button>
              )}

              {exportType === 'asm_all_in_one' && (
                <Button
                  onClick={async () => {
                    try {
                      const projectName = currentProjectName || "MSX_Game";
                      const { generateUnitedFilesASM } = await import('../../utils/msxMainGenerator');

                      const code = generateUnitedFilesASM(projectName, assets, {
                        ...DEFAULT_MSX_CONFIG,
                        projectName,
                        targetMSX: options.msxModel as any,
                        baseAddress: 0x4000
                      }, projectData); // Pass the full project data including tileBanks

                      // Show the generated code in the preview first
                      setGeneratedCode(code);
                      setGeneratedFiles([{ name: 'unitedFiles.asm', content: code }]);
                      setActiveFileIndex(0);

                      // Also download the file
                      const blob = new Blob([code], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'unitedFiles.asm';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);

                      alert(`🔧 unitedFiles.asm generated!\n\n📄 File downloaded as: unitedFiles.asm\n📁 Please save to: test/unitedFiles.asm\n🎮 Konami ROM format\n⚡ Ready for glass.jar compilation\n\nCommand: glass unitedFiles.asm ${projectName.toLowerCase()}.rom`);
                    } catch (error) {
                      alert(`Error generating ASM: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                  }}
                  disabled={isGenerating}
                  variant="primary"
                  className="w-full"
                >
                  🔧 Generate unitedFiles.asm
                </Button>
              )}
            </div>
          </Panel>

          {compilationResult && (
            <Panel title="Glass Compilation Result" className={compilationResult.success ? "border-green-500" : "border-red-500"}>
              <div className="p-3">
                <div className={`text-sm ${compilationResult.success ? 'text-green-400' : 'text-red-400'}`}>
                  {compilationResult.success ? '✓ Compilation successful!' : '✗ Glass compilation failed'}
                </div>
                <div className="text-xs text-msx-textsecondary mt-1 font-mono whitespace-pre-wrap">
                  {compilationResult.message}
                </div>

                {/* Enhanced error details for debugging */}
                {!compilationResult.success && (compilationResult as any).fullDetails && (
                  <details className="mt-2">
                    <summary className="text-xs text-msx-highlight cursor-pointer hover:underline">
                      🔍 Show detailed Glass logs (for debugging)
                    </summary>
                    <div className="mt-2 p-2 bg-msx-bgcolor bg-opacity-30 rounded text-xs font-mono">
                      <div className="text-red-400">Command: {(compilationResult as any).fullDetails.command}</div>
                      <div className="text-yellow-400 mt-1">STDERR:</div>
                      <pre className="text-msx-textsecondary whitespace-pre-wrap">{(compilationResult as any).fullDetails.fullStderr || 'No stderr output'}</pre>
                      <div className="text-yellow-400 mt-1">STDOUT:</div>
                      <pre className="text-msx-textsecondary whitespace-pre-wrap">{(compilationResult as any).fullDetails.fullStdout || 'No stdout output'}</pre>
                      {(compilationResult as any).fullDetails.sourceCode && (
                        <>
                          <div className="text-yellow-400 mt-1">Source (first 1000 chars):</div>
                          <pre className="text-msx-textsecondary whitespace-pre-wrap text-xs">{(compilationResult as any).fullDetails.sourceCode}</pre>
                        </>
                      )}
                    </div>
                  </details>
                )}

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
          <Panel title="Generated Assembly Code" className="flex-1 flex flex-col overflow-hidden">
            {/* File Tabs */}
            {generatedFiles.length > 1 && (
              <div className="flex flex-wrap gap-1 p-2 border-b border-msx-border bg-msx-bgcolor bg-opacity-50">
                {generatedFiles.map((file, index) => (
                  <button
                    key={index}
                    onClick={() => handleFileTabChange(index)}
                    className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                      activeFileIndex === index
                        ? 'bg-msx-highlight text-msx-panelbg'
                        : 'bg-msx-panelbg text-msx-textsecondary hover:bg-msx-highlight hover:bg-opacity-20'
                    }`}
                  >
                    {file.name}
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1 p-3 overflow-y-auto">
              <textarea
                value={generatedCode}
                onChange={(e) => setGeneratedCode(e.target.value)}
                className="w-full text-xs font-mono bg-msx-bgcolor border border-msx-border rounded p-2 text-msx-textprimary resize-none"
                placeholder="Generated Z80 assembly code will appear here..."
                style={{ 
                  minHeight: '500px',
                  height: 'auto'
                }}
                rows={30}
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