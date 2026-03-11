import React, { startTransition, useState } from 'react';
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
  onEditFile?: (filename: string, content: string) => void;
}

type ExportType = 'complete' | 'complete_with_statemachine' | 'statemachine_only' | 'dynamic_project_asm' | 'msx_main_asm' | 'msx_full_project' | 'asm_all_in_one' | 'tiles' | 'sprites' | 'screens' | 'entities';
type RomMode = 'auto' | 'simple32k' | 'megarom';
type MapperFormat = 'konami' | 'ascii8' | 'ascii16';
type EngineExecutionMode = 'gameLoopHalt' | 'interruptTaskManager';
type RomBuildConfig = {
  romMode: RomMode;
  targetFormat: MapperFormat;
  autoMegaROM: boolean;
  executionMode: EngineExecutionMode;
};

interface Zx0CompressionOptions {
  screens: boolean;
  behaviorMaps: boolean;
  tilePatterns: boolean;
  tileColors: boolean;
  fontPatterns: boolean;
  fontColors: boolean;
  spritePatterns: boolean;
}

const DEFAULT_ZX0_OPTIONS: Zx0CompressionOptions = {
  screens: true,
  behaviorMaps: true,
  tilePatterns: true,
  tileColors: true,
  fontPatterns: true,
  fontColors: true,
  spritePatterns: true,
};

interface GeneratedFile {
  name: string;
  content: string;
}

interface Zx0CompressionJobProgress {
  message?: string;
  current?: number;
  total?: number;
  phase?: string;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({
  isOpen,
  onClose,
  assets,
  currentProjectName,
  projectData,
  onEditFile,
}) => {
  const [exportType, setExportType] = useState<ExportType>('asm_all_in_one');
  const [options, setOptions] = useState<CodeGenerationOptions>(DEFAULT_CODE_OPTIONS);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isCompressingAsm, setIsCompressingAsm] = useState(false);
  const [compilationResult, setCompilationResult] = useState<{ success: boolean; message: string; data?: string } | null>(null);
  const [asmCompressionResult, setAsmCompressionResult] = useState<any>(null);
  const [projectAnalysis, setProjectAnalysis] = useState<any>(null);
  const [romMode, setRomMode] = useState<RomMode>('simple32k');
  const [mapperFormat, setMapperFormat] = useState<MapperFormat>('konami');
  const [executionMode, setExecutionMode] = useState<EngineExecutionMode>('interruptTaskManager');
  const [lastGeneratedRomConfig, setLastGeneratedRomConfig] = useState<RomBuildConfig | null>(null);
  const [isQuickValidating, setIsQuickValidating] = useState(false);
  const [quickValidationSummary, setQuickValidationSummary] = useState<string | null>(null);
  const [isBuildingAndRunning, setIsBuildingAndRunning] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [pipelineStatus, setPipelineStatus] = useState('Ready');
  const [zx0Options, setZx0Options] = useState<Zx0CompressionOptions>(DEFAULT_ZX0_OPTIONS);

  const isPipelineBusy = isGenerating || isCompiling || isCompressingAsm || isQuickValidating || isBuildingAndRunning;
  const backendBaseUrl = (() => {
    const env = import.meta.env as Record<string, string | undefined>;
    const configuredBaseUrl = env.VITE_BACKEND_URL?.trim() || env.VITE_API_BASE_URL?.trim();
    if (configuredBaseUrl) {
      return configuredBaseUrl.replace(/\/+$/, '');
    }

    if (typeof window !== 'undefined' && window.location.hostname) {
      return `http://${window.location.hostname}:3001`;
    }

    return 'http://localhost:3001';
  })();

  const buildBackendUrl = (pathname: string) =>
    `${backendBaseUrl}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;

  const yieldToBrowser = () =>
    new Promise<void>(resolve => {
      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => resolve());
        return;
      }
      setTimeout(resolve, 0);
    });

  const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

  const buildBackendFetchError = (action: string, error: unknown) => {
    const details = error instanceof Error ? error.message : String(error);
    const mixedContentHint = typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? ' The app is currently running over HTTPS, so direct HTTP calls to the backend may be blocked by the browser.'
      : '';

    return `${action} could not reach the backend at ${backendBaseUrl}. Check that server/server.js is running on port 3001.${mixedContentHint} Original error: ${details}`;
  };

  // Function to download ZIP with all modular files
  const downloadModularZip = async (modularFiles: Record<string, string>, projectName: string) => {
    try {
      const zip = new JSZip();

      // Add all modular files to the ZIP
      Object.entries(modularFiles).forEach(([filename, content]) => {
        zip.file(filename, content);
      });

      // Generate the ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Download the ZIP
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.toLowerCase()}_modular_project.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Error generating ZIP:', error);
      return false;
    }
  };

  const handleFileTabChange = (index: number) => {
    setActiveFileIndex(index);
    if (generatedFiles[index]) {
      setGeneratedCode(generatedFiles[index].content);
    }
  };

  const buildCurrentRomConfig = (): RomBuildConfig => ({
    romMode,
    targetFormat: mapperFormat,
    autoMegaROM: romMode === 'auto',
    executionMode
  });

  const isRomConfigDifferent = (generatedConfig: RomBuildConfig | null, currentConfig: RomBuildConfig) => {
    if (!generatedConfig) return false;
    return generatedConfig.romMode !== currentConfig.romMode ||
      generatedConfig.targetFormat !== currentConfig.targetFormat ||
      generatedConfig.autoMegaROM !== currentConfig.autoMegaROM ||
      generatedConfig.executionMode !== currentConfig.executionMode;
  };

  const formatRomConfig = (config: RomBuildConfig | null) => {
    if (!config) return 'N/A';
    return `mode=${config.romMode}, mapper=${config.targetFormat}, autoMegaROM=${config.autoMegaROM}, engine=${config.executionMode}`;
  };

  const getEnhancedAssets = () => {
    const enhancedAssets = [...assets];

    if (projectData?.entityTemplates && Array.isArray(projectData.entityTemplates)) {
      projectData.entityTemplates.forEach((template: any) => {
        enhancedAssets.push({
          id: template.id,
          type: 'entitytemplate',
          name: template.name || template.id,
          data: template
        } as ProjectAsset);
      });
    }

    if (projectData?.componentDefinitions && Array.isArray(projectData.componentDefinitions)) {
      projectData.componentDefinitions.forEach((compDef: any) => {
        if (!enhancedAssets.find(a => a.id === compDef.id && a.type === 'componentdefinition')) {
          enhancedAssets.push({
            id: compDef.id,
            type: 'componentdefinition',
            name: compDef.name || compDef.id,
            data: compDef
          } as ProjectAsset);
        }
      });
    }

    return enhancedAssets;
  };

  const getModularFileOrder = () => [
    'unitedFiles.asm',
    'main.asm',
    'bios.asm',
    'constants.asm',
    'variables.asm',
    'mapper.asm',
    'interrupt.asm',
    'header.asm',
    'patterns.asm',
    'colors.asm',
    'sprites.asm',
    'components.asm',
    'entities.asm',
    'worlds.asm',
    'screens.asm',
    'font.asm',
    'hud.asm',
    'menus.asm',
    'statemachine.asm',
    'gameflow.asm'
  ];

  const generateMapperReadyBundle = async (projectNameInput?: string, romConfigInput?: RomBuildConfig) => {
    const projectName = projectNameInput || currentProjectName || 'MSX_Game';
    const romConfig = romConfigInput || buildCurrentRomConfig();
    const { generateModularASM } = await import('../../utils/msxGenerator');

    const modularFiles = generateModularASM(projectName, getEnhancedAssets(), {
      generateUnified: true,
      ...romConfig
    });

    const files = getModularFileOrder()
      .filter(fileName => modularFiles[fileName])
      .map(fileName => ({
        name: fileName,
        content: modularFiles[fileName]
      }));

    const mainCode = modularFiles['unitedFiles.asm'] || modularFiles['main.asm'] || 'Error generating main file';
    const preferredIndex = files.findIndex(f => f.name === 'unitedFiles.asm');

    return {
      projectName,
      romConfig,
      modularFiles,
      files,
      mainCode,
      activeIndex: preferredIndex >= 0 ? preferredIndex : 0
    };
  };

  const runCompileRequest = async (sourceCode: string, romConfig: RomBuildConfig, projectNameInput?: string) => {
    try {
      const response = await fetch(buildBackendUrl('/compile'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: sourceCode,
          generateSymbols: options.generateSymbols || false,
          projectName: projectNameInput || currentProjectName || 'MSX_Game',
          romMode: romConfig.romMode,
          targetFormat: romConfig.targetFormat,
          autoMegaROM: romConfig.autoMegaROM
        }),
      });

      const responseText = await response.text();
      let result: any;

      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        console.error('Raw response:', responseText);
        return {
          success: false,
          message: `Server response error: ${responseText}`,
          fullDetails: { jsonError, responseText, status: response.status }
        };
      }

      if (!response.ok || !result.success) {
        console.error('Glass compilation failed:', result);
        return {
          success: false,
          message: result.details || result.error || 'Unknown compilation error',
          fullDetails: result,
          requestedRomConfig: result.requestedRomConfig,
          sourceRomConfig: result.sourceRomConfig,
          sourceConfigMismatchWarning: result.sourceConfigMismatchWarning,
          resolvedRomConfig: result.resolvedRomConfig,
          romModeConflictWarning: result.romModeConflictWarning,
          romSizeInfo: result.romSizeInfo
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: buildBackendFetchError('Compilation', error),
        fullDetails: { backendBaseUrl, error: String(error) }
      };
    }
  };

  const runOpenMSXRequest = async (romFile: string) => {
    try {
      const response = await fetch(buildBackendUrl('/run-openmsx'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ romFile }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          message: result.details || result.error || 'Failed to start OpenMSX'
        };
      }

      return {
        success: true,
        message: result.message || 'OpenMSX started successfully',
        note: result.note || ''
      };
    } catch (error) {
      return {
        success: false,
        message: buildBackendFetchError('OpenMSX launch', error)
      };
    }
  };

  const runCompressRequest = async (
    sourceCode: string,
    projectNameInput?: string,
    zx0Opts?: Zx0CompressionOptions,
    onProgress?: (progress: Zx0CompressionJobProgress) => void
  ) => {
    try {
      const response = await fetch(buildBackendUrl('/compress-unified-asm-job'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: sourceCode,
          projectName: projectNameInput || currentProjectName || 'MSX_Game',
          zx0Options: zx0Opts ?? zx0Options
        }),
      });

      const responseText = await response.text();
      let result: any;

      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        console.error('Raw response:', responseText);
        return {
          success: false,
          message: `Compression response error: ${responseText}`,
          fullDetails: { jsonError, responseText, status: response.status }
        };
      }

      if (!response.ok || !result.success) {
        return {
          success: false,
          message: result.details || result.error || 'Unknown compression error',
          ...result
        };
      }

      const jobId = result.jobId;
      if (!jobId) {
        return {
          success: false,
          message: 'Compression job did not return a job ID',
          ...result
        };
      }

      for (;;) {
        await sleep(180);

        const statusResponse = await fetch(buildBackendUrl(`/compress-unified-asm-job/${encodeURIComponent(jobId)}`));
        const statusText = await statusResponse.text();
        let statusResult: any;

        try {
          statusResult = JSON.parse(statusText);
        } catch (jsonError) {
          return {
            success: false,
            message: `Compression status response error: ${statusText}`,
            fullDetails: { jsonError, statusText, status: statusResponse.status }
          };
        }

        const job = statusResult?.job;
        if (job?.progress && onProgress) {
          onProgress(job.progress);
        }

        if (!statusResponse.ok || statusResult?.success === false) {
          return {
            success: false,
            message: statusResult?.details || statusResult?.error || 'Unknown compression status error',
            ...statusResult
          };
        }

        if (job?.status === 'completed') {
          return job.result;
        }

        if (job?.status === 'failed') {
          return {
            success: false,
            message: job.error || 'Compression job failed'
          };
        }
      }
    } catch (error) {
      return {
        success: false,
        message: buildBackendFetchError('Compression', error),
        fullDetails: { backendBaseUrl, error: String(error) }
      };
    }
  };

  const buildMapperSummary = (compileResult: any, projectNameInput?: string) => {
    const projectName = projectNameInput || currentProjectName || 'MSX_Game';
    const requested = compileResult?.requestedRomConfig || {};
    const resolved = compileResult?.resolvedRomConfig || {};
    const sizeInfo = compileResult?.romSizeInfo || {};
    const sourceWarning = compileResult?.sourceConfigMismatchWarning;

    const lines: string[] = [];
    lines.push(`Project: ${projectName}`);
    lines.push(`Compile status: ${compileResult?.success ? 'OK' : 'FAILED'}`);
    lines.push(`Requested: mode=${requested.romMode ?? 'unknown'}, mapper=${requested.targetFormat ?? 'unknown'}, autoMegaROM=${requested.autoMegaROM ?? 'unknown'}`);
    lines.push(`Resolved: mode=${resolved.resolvedRomMode ?? 'unknown'}, mapper=${resolved.targetFormat ?? 'unknown'}, mapperActive=${resolved.mapperActive ?? 'unknown'}`);
    if (resolved.mapperTargetFormat) {
      lines.push(`Mapper target: ${resolved.mapperTargetFormat}`);
    }

    if (resolved.reason) {
      lines.push(`Reason: ${resolved.reason}`);
    }

    if (sizeInfo.paddedSize) {
      lines.push(`ROM size: ${sizeInfo.paddedSize} bytes (${sizeInfo.banks8KB ?? '?'} x 8KB)`);
    }

    if (compileResult?.romModeConflictWarning) {
      lines.push(`ROM mode warning: ${compileResult.romModeConflictWarning}`);
    }

    if (sourceWarning) {
      lines.push(`Source mismatch warning: ${sourceWarning}`);
    }

    if (!compileResult?.success && compileResult?.message) {
      lines.push(`Error: ${compileResult.message}`);
    }

    return lines.join('\n');
  };

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    setAsmCompressionResult(null);

    try {
      let code = '';
      let files: GeneratedFile[] = [];
      let generatedRomConfig: RomBuildConfig | null = null;
      let nextActiveFileIndex = 0;

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
          const requestedRomConfig = buildCurrentRomConfig();
          let asmBundle = await generateMapperReadyBundle(projectName, requestedRomConfig);
          generatedRomConfig = asmBundle.romConfig;
          files = asmBundle.files;
          code = asmBundle.mainCode;
          nextActiveFileIndex = asmBundle.activeIndex;

          // Auto-clean generated ASM when auto mode resolves to simple32k.
          if (requestedRomConfig.romMode === 'auto') {
            try {
              const probeResult = await runCompileRequest(code, asmBundle.romConfig, projectName);
              if (probeResult?.success && probeResult?.resolvedRomConfig?.resolvedRomMode === 'simple32k') {
                const cleanRomConfig: RomBuildConfig = {
                  romMode: 'simple32k',
                  targetFormat: asmBundle.romConfig.targetFormat,
                  autoMegaROM: false
                };
                asmBundle = await generateMapperReadyBundle(projectName, cleanRomConfig);
                generatedRomConfig = asmBundle.romConfig;
                files = asmBundle.files;
                code = asmBundle.mainCode;
                nextActiveFileIndex = asmBundle.activeIndex;
                setRomMode('simple32k');
              }
            } catch (probeError) {
              console.warn('Auto-clean probe skipped (compile probe failed):', probeError);
            }
          }
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
      setActiveFileIndex(nextActiveFileIndex);
      setLastGeneratedRomConfig(generatedRomConfig);
    } catch (error) {
      const errorCode = `; Error generating code: ${error}`;
      setGeneratedCode(errorCode);
      setGeneratedFiles([{ name: 'error.asm', content: errorCode }]);
      setActiveFileIndex(0);
      setLastGeneratedRomConfig(null);
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
    setQuickValidationSummary(null);

    try {
      const currentRomConfig = buildCurrentRomConfig();
      if (exportType === 'asm_all_in_one' && isRomConfigDifferent(lastGeneratedRomConfig, currentRomConfig)) {
        const proceed = window.confirm(
          `Current compile config (${formatRomConfig(currentRomConfig)}) differs from the last generated ASM config (${formatRomConfig(lastGeneratedRomConfig)}).\n\n` +
          'Regenerate ASM to avoid mismatch. Compile anyway?'
        );
        if (!proceed) {
          setIsCompiling(false);
          return;
        }
      }

      const result = await runCompileRequest(generatedCode, currentRomConfig);
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

  const runMapperPipeline = async (launchAfterBuild: boolean) => {
    if (exportType !== 'asm_all_in_one') {
      alert(`${launchAfterBuild ? 'Build and Run' : 'Generate + Compress + Compile + Mapper'} is only available for ASM (all in one).`);
      return;
    }

    setIsQuickValidating(!launchAfterBuild);
    setIsBuildingAndRunning(launchAfterBuild);
    setIsGenerating(true);
    setIsCompiling(true);
    setIsCompressingAsm(true);
    setCompilationResult(null);
    setAsmCompressionResult(null);
    setQuickValidationSummary(null);
    setPipelineProgress(5);
    setPipelineStatus('Generating ASM...');

    try {
      const romConfig = buildCurrentRomConfig();
      const bundle = await generateMapperReadyBundle(currentProjectName || 'MSX_Game', romConfig);

      setGeneratedCode(bundle.mainCode);
      setGeneratedFiles(bundle.files);
      setActiveFileIndex(bundle.activeIndex);
      setLastGeneratedRomConfig(bundle.romConfig);
      setPipelineProgress(28);
      setPipelineStatus('ASM generated');

      let sourceCodeForCompile = bundle.mainCode;
      let compressionSummary = 'Compression: skipped';

      try {
        setPipelineProgress(42);
        setPipelineStatus('Preparing ZX0 compression...');
        const compressionResult = await runCompressRequest(
          bundle.mainCode,
          bundle.projectName,
          zx0Options,
          (progress) => {
            const total = Math.max(1, Number(progress?.total) || 1);
            const current = Math.max(0, Math.min(total, Number(progress?.current) || 0));
            const ratio = current / total;
            setPipelineProgress(42 + (ratio * 18));
            setPipelineStatus(progress?.message || 'Compressing ZX0 blocks...');
          }
        );
        setAsmCompressionResult(compressionResult);

        if (compressionResult.success && compressionResult.applied && compressionResult.compressedCode) {
          const compressedFileName = compressionResult.unitedCompressedAsmFile || 'unitedCompressedFiles.asm';
          const compressedContent = compressionResult.compressedCode as string;
          const filesWithoutCompressed = bundle.files.filter(
            f => f.name !== compressedFileName && f.name !== (compressionResult.compressedAsmFile || '')
          );
          const unifiedIndex = filesWithoutCompressed.findIndex(f => f.name === 'unitedFiles.asm');
          const compressedFileEntry: GeneratedFile = { name: compressedFileName, content: compressedContent };

          const nextFiles = unifiedIndex >= 0
            ? [
                ...filesWithoutCompressed.slice(0, unifiedIndex + 1),
                compressedFileEntry,
                ...filesWithoutCompressed.slice(unifiedIndex + 1)
              ]
            : [compressedFileEntry, ...filesWithoutCompressed];

          const compressedIndex = nextFiles.findIndex(f => f.name === compressedFileName);
          sourceCodeForCompile = compressedContent;

          const netSaved = compressionResult?.compressionInfo?.netSavedBytes ?? 0;
          compressionSummary = `Compression: applied (net saved ${netSaved} bytes)`;
          setPipelineProgress(60);
          setPipelineStatus('Compression applied');
          await yieldToBrowser();
          startTransition(() => {
            setGeneratedFiles(nextFiles);
            setActiveFileIndex(compressedIndex >= 0 ? compressedIndex : 0);
            setGeneratedCode(compressedContent);
          });
        } else if (compressionResult.success) {
          compressionSummary = `Compression: ${compressionResult.message || 'skipped (no net gain)'}`;
          setPipelineProgress(60);
          setPipelineStatus('Compression skipped');
        } else {
          compressionSummary = `Compression warning: ${compressionResult.message || 'failed'}`;
          setPipelineProgress(60);
          setPipelineStatus('Compression warning');
        }
      } catch (compressionError) {
        compressionSummary = `Compression warning: ${compressionError}`;
        setPipelineProgress(60);
        setPipelineStatus('Compression warning');
      } finally {
        setIsCompressingAsm(false);
      }

      setPipelineProgress(72);
      setPipelineStatus('Compiling ROM...');
      const compileResult = await runCompileRequest(sourceCodeForCompile, bundle.romConfig, bundle.projectName);
      setCompilationResult(compileResult);

      let summary = `${compressionSummary}\n${buildMapperSummary(compileResult, bundle.projectName)}`;

      // Auto-clean generated ASM when auto mode resolved to simple32k.
      // This keeps downloadable/generated code free of mapper-heavy scaffolding.
      if (
        compileResult?.success &&
        bundle.romConfig.romMode === 'auto' &&
        compileResult?.resolvedRomConfig?.resolvedRomMode === 'simple32k'
      ) {
        const cleanRomConfig: RomBuildConfig = {
          romMode: 'simple32k',
          targetFormat: bundle.romConfig.targetFormat,
          autoMegaROM: false
        };
        const cleanBundle = await generateMapperReadyBundle(bundle.projectName, cleanRomConfig);
        setGeneratedCode(cleanBundle.mainCode);
        setGeneratedFiles(cleanBundle.files);
        setActiveFileIndex(cleanBundle.activeIndex);
        setLastGeneratedRomConfig(cleanBundle.romConfig);
        setRomMode('simple32k');
        summary += '\nAuto-clean: regenerated ASM in simple32k mode (minimal mapper stubs).';
      }

      if (compileResult?.success) {
        setPipelineProgress(88);
        setPipelineStatus('ROM ready');
      } else {
        setPipelineProgress(100);
        setPipelineStatus('Build failed');
      }

      if (launchAfterBuild) {
        if (compileResult?.success && (compileResult as any).romFile) {
          setPipelineProgress(94);
          setPipelineStatus('Launching OpenMSX...');
          const openMsxResult = await runOpenMSXRequest((compileResult as any).romFile);
          if (openMsxResult.success) {
            summary += `\nRun: OpenMSX launched (${(compileResult as any).romFile})`;
            if (openMsxResult.note) {
              summary += `\n${openMsxResult.note}`;
            }
            setPipelineProgress(100);
            setPipelineStatus('Build completed and running');
          } else {
            summary += `\nRun warning: ${openMsxResult.message}`;
            setPipelineProgress(100);
            setPipelineStatus('Build completed, launch failed');
          }
        } else {
          summary += '\nRun skipped: no ROM was produced.';
          setPipelineProgress(100);
          setPipelineStatus('Build completed, run skipped');
        }
      } else if (compileResult?.success) {
        setPipelineProgress(100);
        setPipelineStatus('Pipeline completed');
      }

      setQuickValidationSummary(summary);
    } catch (error) {
      const failure = {
        success: false,
        message: `${launchAfterBuild ? 'Build and Run' : 'Generate + Compress + Compile + Mapper'} failed: ${error}`
      };
      setCompilationResult(failure);
      setQuickValidationSummary(buildMapperSummary(failure, currentProjectName || 'MSX_Game'));
      setPipelineProgress(100);
      setPipelineStatus('Pipeline failed');
    } finally {
      setIsCompressingAsm(false);
      setIsCompiling(false);
      setIsGenerating(false);
      setIsQuickValidating(false);
      setIsBuildingAndRunning(false);
    }
  };

  const handleGenerateCompressCompileMapper = async () => {
    await runMapperPipeline(false);
  };

  const handleBuildAndRun = async () => {
    await runMapperPipeline(true);
  };

  const handleCompressUnifiedAsm = async () => {
    const unifiedFile = generatedFiles.find(f => f.name === 'unitedFiles.asm');
    const sourceCode = unifiedFile?.content || generatedCode;

    if (!sourceCode.trim()) {
      alert('Generate code first before compressing');
      return;
    }

    setIsCompressingAsm(true);
    setAsmCompressionResult(null);

    try {
      const result = await runCompressRequest(sourceCode, currentProjectName || 'MSX_Game', zx0Options);
      if (!result.success) {
        alert(`Compression failed: ${result.message || 'Unknown error'}`);
        return;
      }

      setAsmCompressionResult(result);

      if (!result.applied || !result.compressedCode) {
        alert(result.message || 'Compression skipped (no net gain)');
        return;
      }

      const compressedFileName = result.unitedCompressedAsmFile || 'unitedCompressedFiles.asm';
      const compressedContent = result.compressedCode as string;

      const existingWithoutCompressed = generatedFiles.filter(
        f => f.name !== compressedFileName && f.name !== (result.compressedAsmFile || '')
      );

      const unifiedIndex = existingWithoutCompressed.findIndex(f => f.name === 'unitedFiles.asm');
      const compressedFileEntry: GeneratedFile = { name: compressedFileName, content: compressedContent };

      const nextFiles = unifiedIndex >= 0
        ? [
            ...existingWithoutCompressed.slice(0, unifiedIndex + 1),
            compressedFileEntry,
            ...existingWithoutCompressed.slice(unifiedIndex + 1)
          ]
        : [compressedFileEntry, ...existingWithoutCompressed];

      const compressedIndex = nextFiles.findIndex(f => f.name === compressedFileName);
      startTransition(() => {
        setGeneratedFiles(nextFiles);
        setActiveFileIndex(compressedIndex >= 0 ? compressedIndex : 0);
        setGeneratedCode(compressedContent);
      });

      const info = result.compressionInfo || {};
      alert(
        `ZX0 compression applied.\n\n` +
        `Screens: ${info.compressedScreens || 0}/${info.candidateScreens || 0}\n` +
        `Behavior maps: ${info.compressedBehaviorMaps || 0}/${info.candidateBehaviorMaps || 0}\n` +
        `Tile patterns: ${info.compressedTilePatterns || 0}/${info.candidateTilePatterns || 0}\n` +
        `Tile colors: ${info.compressedTileColors || 0}/${info.candidateTileColors || 0}\n` +
        `Font patterns: ${info.compressedFontPatterns || 0}/${info.candidateFontPatterns || 0}\n` +
        `Font colors: ${info.compressedFontColors || 0}/${info.candidateFontColors || 0}\n` +
        `Sprite patterns: ${info.compressedSpritePatterns || 0}/${info.candidateSpritePatterns || 0}\n` +
        `${info.warning ? `Warning: ${info.warning}\n` : ''}` +
        `Saved bytes (net): ${info.netSavedBytes || 0}`
      );
    } catch (error) {
      alert(`Compression failed: ${error}`);
    } finally {
      setIsCompressingAsm(false);
    }
  };

  const handleSaveCode = () => {
    if (!generatedCode.trim()) {
      alert('No code to save');
      return;
    }

    const currentFile = generatedFiles[activeFileIndex];
    const filename = currentFile ? currentFile.name : `${exportType}_code_${new Date().toISOString().split('T')[0]}.asm`;

    // Save the ASM file
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // If generateSymbols is enabled, handle .sym file download
    if (options.generateSymbols) {
      if (compilationResult?.success && (compilationResult as any).symbolFile) {
        // Download the .sym file too
        setTimeout(() => {
          const downloadUrl = buildBackendUrl((compilationResult as any).symbolDownloadUrl);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = (compilationResult as any).symbolFile;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, 100); // Small delay to avoid browser blocking multiple downloads
      } else {
        // Warn user that they need to compile first to get .sym
        alert('ASM file saved.\n\nNote: To also download the .sym file, you need to click "Compile with Glass" first.');
      }
    }
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

  const currentRomConfig = buildCurrentRomConfig();
  const hasRomConfigDrift = isRomConfigDifferent(lastGeneratedRomConfig, currentRomConfig);

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
                    <option value="asm_all_in_one">🔧 ASM (all in one) - Mapper-ready ROM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-msx-textsecondary mb-2">
                    Data Format:
                  </label>
                  <select
                    value={options.dataFormat}
                    onChange={(e) => setOptions({ ...options, dataFormat: e.target.value as 'hex' | 'binary' | 'decimal' })}
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
                    onChange={(e) => setOptions({ ...options, msxModel: e.target.value as 'MSX1' | 'MSX2' | 'MSX2+' })}
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
                        setOptions({ ...options, baseAddress: addr });
                      }
                    }}
                    onBlur={(e) => {
                      // Ensure we have a valid address on blur
                      const value = e.target.value.replace('#', '');
                      if (value === '' || isNaN(parseInt(value, 16))) {
                        setOptions({ ...options, baseAddress: 0x4000 });
                      }
                    }}
                    placeholder="#4000"
                    className="w-full p-2 text-sm bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-msx-textsecondary mb-2">
                    Engine Mode:
                  </label>
                  <select
                    value={executionMode}
                    onChange={(e) => setExecutionMode(e.target.value as EngineExecutionMode)}
                    className="w-full p-2 text-sm bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary"
                  >
                    <option value="gameLoopHalt">Game Loop + HALT</option>
                    <option value="interruptTaskManager">Task Manager IRQ (Camino 1)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-msx-textsecondary mb-2">
                    ROM Mode:
                  </label>
                  <select
                    value={romMode}
                    onChange={(e) => setRomMode(e.target.value as RomMode)}
                    className="w-full p-2 text-sm bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary"
                  >
                    <option value="auto">Auto (32KB -&gt; MegaROM)</option>
                    <option value="simple32k">Force Simple 32KB</option>
                    <option value="megarom">Force MegaROM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-msx-textsecondary mb-2">
                    Mapper Target:
                  </label>
                  <select
                    value={mapperFormat}
                    onChange={(e) => setMapperFormat(e.target.value as MapperFormat)}
                    className="w-full p-2 text-sm bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary"
                  >
                    <option value="konami">Konami 8KB</option>
                    <option value="ascii8">ASCII 8KB</option>
                    <option value="ascii16">ASCII 16KB</option>
                  </select>
                </div>

                <div className="bg-msx-bgcolor bg-opacity-40 border border-msx-border rounded p-2 text-xs text-msx-textsecondary">
                  Active ROM config: mode=<strong>{romMode}</strong>, mapper=<strong>{mapperFormat}</strong>, engine=<strong>{executionMode}</strong>
                  <div className="mt-1">
                    Last generated ASM config: <strong>{formatRomConfig(lastGeneratedRomConfig)}</strong>
                  </div>
                  {hasRomConfigDrift && (
                    <div className="mt-1 text-yellow-300">
                      Warning: current ROM config differs from the last generated ASM. Regenerate before compiling.
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeComments"
                    checked={options.includeComments}
                    onChange={(e) => setOptions({ ...options, includeComments: e.target.checked })}
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
                    onChange={(e) => setOptions({ ...options, optimize: e.target.checked })}
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
                    onChange={(e) => setOptions({ ...options, includeStateMachine: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="includeStateMachine" className="text-sm text-msx-textsecondary">
                    Include State Machine
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="generateSymbols"
                    checked={options.generateSymbols || false}
                    onChange={(e) => setOptions({ ...options, generateSymbols: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="generateSymbols" className="text-sm text-msx-textsecondary">
                    Generate .sym (symbols file)
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
                      <li>• ROM mode selected: <strong>{romMode}</strong></li>
                      <li>• Mapper selected: <strong>{mapperFormat}</strong></li>
                      <li>• Engine selected: <strong>{executionMode}</strong></li>
                    </ul>
                    {romMode === 'simple32k' && (
                      <p className="mt-2 text-yellow-300">
                        ⚠️ Force Simple 32KB is active. If the compiled ROM exceeds 32KB, a mapper conflict warning will appear.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Panel>

            <Panel title="ZX0 Compression">
              <div className="p-3 space-y-2">
                <p className="text-xs text-msx-textsecondary mb-1">
                  Data blocks to compress with ZX0:
                </p>
                {([
                  { key: 'screens',      label: 'Screens (layout maps)' },
                  { key: 'behaviorMaps', label: 'Behavior maps' },
                  { key: 'tilePatterns', label: 'Tile patterns' },
                  { key: 'tileColors',   label: 'Tile colors' },
                  { key: 'fontPatterns', label: 'Font patterns' },
                  { key: 'fontColors',   label: 'Font colors' },
                  { key: 'spritePatterns', label: 'Sprite patterns' },
                ] as { key: keyof Zx0CompressionOptions; label: string }[]).map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`zx0_${key}`}
                      checked={zx0Options[key]}
                      onChange={(e) => setZx0Options({ ...zx0Options, [key]: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor={`zx0_${key}`} className="text-sm text-msx-textsecondary">
                      {label}
                    </label>
                  </div>
                ))}
                <div className="mt-2 flex space-x-2">
                  <button
                    className="text-xs text-msx-highlight underline"
                    onClick={() => setZx0Options(DEFAULT_ZX0_OPTIONS)}
                  >
                    All
                  </button>
                  <button
                    className="text-xs text-msx-textsecondary underline"
                    onClick={() => setZx0Options({ screens: false, behaviorMaps: false, tilePatterns: false, tileColors: false, fontPatterns: false, fontColors: false, spritePatterns: false })}
                  >
                    None
                  </button>
                </div>
              </div>
            </Panel>

            <Panel title="Actions">
              <div className="p-3 space-y-2">
                <Button
                  onClick={handleGenerateCode}
                  disabled={isGenerating || isQuickValidating || isBuildingAndRunning}
                  variant="primary"
                  icon={<CodeIcon />}
                  className="w-full"
                >
                  {isGenerating ? 'Generating...' : 'Generate Code'}
                </Button>

                <Button
                  onClick={handleCompressUnifiedAsm}
                  disabled={
                    isCompressingAsm ||
                    isGenerating ||
                    isCompiling ||
                    isQuickValidating ||
                    isBuildingAndRunning ||
                    !generatedCode.trim() ||
                    exportType !== 'asm_all_in_one'
                  }
                  variant="secondary"
                  className="w-full"
                >
                  {isCompressingAsm ? 'Compressing...' : 'Compress Screen + Behavior + Tiles + Font (ZX0)'}
                </Button>

                <Button
                  onClick={handleCompileCode}
                  disabled={isCompiling || isQuickValidating || isBuildingAndRunning || !generatedCode.trim()}
                  variant="secondary"
                  icon={<CompilerIcon />}
                  className="w-full"
                >
                  {isCompiling ? 'Compiling...' : 'Compile with Glass'}
                </Button>

                {exportType === 'asm_all_in_one' && (
                  <Button
                    onClick={handleGenerateCompressCompileMapper}
                    disabled={isPipelineBusy}
                    variant="secondary"
                    className="w-full"
                  >
                    {isQuickValidating ? 'Running generate + compress + compile + mapper...' : 'Generate + Compress + Compile + Mapper'}
                  </Button>
                )}

                <Button
                  onClick={handleSaveCode}
                  disabled={isQuickValidating || isBuildingAndRunning || !generatedCode.trim()}
                  variant="ghost"
                  icon={<SaveIcon />}
                  className="w-full"
                >
                  Save Assembly File
                </Button>

                {quickValidationSummary && (
                  <div className="p-2 rounded text-xs bg-blue-900 bg-opacity-30 border border-blue-600 text-msx-textsecondary whitespace-pre-wrap">
                    <div className="font-semibold text-blue-300 mb-1">Mapper Pipeline Summary</div>
                    {quickValidationSummary}
                  </div>
                )}

                {asmCompressionResult?.applied && (
                  <div className="p-2 rounded text-xs bg-green-900 bg-opacity-30 border border-green-600 text-msx-textsecondary">
                    <div className="font-semibold text-green-400">ZX0 Compression Applied</div>
                    <div>
                      Screens: {asmCompressionResult?.compressionInfo?.compressedScreens ?? 0}/{asmCompressionResult?.compressionInfo?.candidateScreens ?? 0}
                    </div>
                    <div>
                      Behavior: {asmCompressionResult?.compressionInfo?.compressedBehaviorMaps ?? 0}/{asmCompressionResult?.compressionInfo?.candidateBehaviorMaps ?? 0}
                    </div>
                    <div>
                      Tile patterns: {asmCompressionResult?.compressionInfo?.compressedTilePatterns ?? 0}/{asmCompressionResult?.compressionInfo?.candidateTilePatterns ?? 0}
                    </div>
                    <div>
                      Tile colors: {asmCompressionResult?.compressionInfo?.compressedTileColors ?? 0}/{asmCompressionResult?.compressionInfo?.candidateTileColors ?? 0}
                    </div>
                    <div>
                      Font patterns: {asmCompressionResult?.compressionInfo?.compressedFontPatterns ?? 0}/{asmCompressionResult?.compressionInfo?.candidateFontPatterns ?? 0}
                    </div>
                    <div>
                      Font colors: {asmCompressionResult?.compressionInfo?.compressedFontColors ?? 0}/{asmCompressionResult?.compressionInfo?.candidateFontColors ?? 0}
                    </div>
                    <div>
                      Sprite patterns: {asmCompressionResult?.compressionInfo?.compressedSpritePatterns ?? 0}/{asmCompressionResult?.compressionInfo?.candidateSpritePatterns ?? 0}
                    </div>
                    {asmCompressionResult?.compressionInfo?.warning && (
                      <div className="text-yellow-300">
                        Warning: {asmCompressionResult.compressionInfo.warning}
                      </div>
                    )}
                    <div>
                      Net saved: {asmCompressionResult?.compressionInfo?.netSavedBytes ?? 0} bytes
                    </div>
                    {asmCompressionResult?.unitedCompressedAsmDownloadUrl && (
                      <button
                        onClick={() => {
                          const downloadUrl = buildBackendUrl(asmCompressionResult.unitedCompressedAsmDownloadUrl);
                          const link = document.createElement('a');
                          link.href = downloadUrl;
                          link.download = asmCompressionResult.unitedCompressedAsmFile || 'unitedCompressedFiles.asm';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="mt-2 px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors"
                      >
                        Download unitedCompressedFiles.asm
                      </button>
                    )}
                  </div>
                )}

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
                      setIsGenerating(true);
                      try {
                        const bundle = await generateMapperReadyBundle(currentProjectName || 'MSX_Game', buildCurrentRomConfig());

                        setGeneratedCode(bundle.mainCode);
                        setGeneratedFiles(bundle.files);
                        setActiveFileIndex(bundle.activeIndex);
                        setLastGeneratedRomConfig(bundle.romConfig);

                        const blob = new Blob([bundle.mainCode], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = bundle.modularFiles['unitedFiles.asm'] ? 'unitedFiles.asm' : 'main.asm';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);

                        const zipSuccess = await downloadModularZip(bundle.modularFiles, bundle.projectName);
                        const mainFileName = bundle.modularFiles['unitedFiles.asm'] ? 'unitedFiles.asm' : 'main.asm';

                        alert(
                          zipSuccess
                            ? `Modular ASM project generated.\n\nMain file: ${mainFileName}\nZIP: ${bundle.projectName.toLowerCase()}_modular_project.zip\n\nReady for glass.jar compile.`
                            : `ASM generated as ${mainFileName}, but ZIP generation failed.`
                        );
                      } catch (error) {
                        alert(`Error generating ASM: ${error instanceof Error ? error.message : 'Unknown error'}`);
                      } finally {
                        setIsGenerating(false);
                      }
                    }}
                    disabled={isGenerating || isQuickValidating || isBuildingAndRunning}
                    variant="primary"
                    className="w-full"
                  >
                    Generate & Download Project ZIP
                  </Button>
                )}

                {/* Optional: Download ZIP only button (if files already generated) */}
                {generatedFiles.length > 0 && exportType === 'asm_all_in_one' && (
                  <Button
                    onClick={async () => {
                      // Reconstruct modularFiles from generatedFiles for ZIP download
                      const modularFiles: Record<string, string> = {};
                      generatedFiles.forEach(file => {
                        modularFiles[file.name] = file.content;
                      });

                      const projectNameForZip = currentProjectName || 'MSX_Game';
                      const zipSuccess = await downloadModularZip(modularFiles, projectNameForZip);
                      alert(zipSuccess
                        ? `ZIP downloaded: ${projectNameForZip.toLowerCase()}_modular_project.zip`
                        : 'ZIP generation failed - check console'
                      );
                    }}
                    disabled={isQuickValidating || isBuildingAndRunning}
                    variant="secondary"
                    className="w-full mt-2"
                  >
                    Download ZIP Only
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

                  {((compilationResult as any).requestedRomConfig ||
                    (compilationResult as any).sourceRomConfig ||
                    (compilationResult as any).resolvedRomConfig) && (
                      <div className="mt-2 p-2 bg-msx-bgcolor bg-opacity-30 rounded text-xs text-msx-textsecondary space-y-1">
                        {(compilationResult as any).requestedRomConfig && (
                          <div>
                            Requested config: mode=<strong>{(compilationResult as any).requestedRomConfig.romMode}</strong>, mapper=<strong>{(compilationResult as any).requestedRomConfig.targetFormat}</strong>, autoMegaROM=<strong>{String((compilationResult as any).requestedRomConfig.autoMegaROM)}</strong>
                          </div>
                        )}
                        {(compilationResult as any).sourceRomConfig && (
                          <div>
                            Source ASM config: mode=<strong>{(compilationResult as any).sourceRomConfig.romMode ?? 'unknown'}</strong>, mapper=<strong>{(compilationResult as any).sourceRomConfig.targetFormat ?? 'unknown'}</strong>, autoMegaROM=<strong>{(compilationResult as any).sourceRomConfig.autoMegaROM === null ? 'unknown' : String((compilationResult as any).sourceRomConfig.autoMegaROM)}</strong>
                          </div>
                        )}
                        {(compilationResult as any).resolvedRomConfig && (
                          <>
                            <div>
                              Resolved config: mode=<strong>{(compilationResult as any).resolvedRomConfig.resolvedRomMode}</strong>, mapper=<strong>{(compilationResult as any).resolvedRomConfig.targetFormat}</strong>, mapperActive=<strong>{String((compilationResult as any).resolvedRomConfig.mapperActive)}</strong>
                            </div>
                            {(compilationResult as any).resolvedRomConfig.mapperTargetFormat && (
                              <div>
                                Mapper target: <strong>{(compilationResult as any).resolvedRomConfig.mapperTargetFormat}</strong>
                              </div>
                            )}
                            <div>
                              Reason: {(compilationResult as any).resolvedRomConfig.reason}
                            </div>
                          </>
                        )}
                        {(compilationResult as any).sourceConfigMismatchWarning && (
                          <div className="text-yellow-300">
                            Warning: {(compilationResult as any).sourceConfigMismatchWarning}
                          </div>
                        )}
                      </div>
                    )}

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
                      {(compilationResult as any).romSizeInfo && (
                        <div className="mt-1 text-xs">
                          ROM size: {(compilationResult as any).romSizeInfo.paddedSize} bytes
                          ({(compilationResult as any).romSizeInfo.sizeIn8KB}×8KB)
                          {(compilationResult as any).romSizeInfo.paddingAdded > 0 && (
                            <span className="text-yellow-400">
                              {' '}(+{(compilationResult as any).romSizeInfo.paddingAdded} padding)
                            </span>
                          )}
                          <div className="mt-1">
                            Banks (8KB): {(compilationResult as any).romSizeInfo.banks8KB}
                          </div>
                          <div>
                            End address: #{Number((compilationResult as any).romSizeInfo.endAddress).toString(16).toUpperCase()}
                          </div>
                          {(compilationResult as any).romSizeInfo.exceedsSimpleRomLimit && (
                            <div className="mt-1 text-yellow-300">
                              ⚠️ ROM exceeds simple 32KB limit.
                              {(compilationResult as any).romSizeInfo.mapperHint && (
                                <span> {(compilationResult as any).romSizeInfo.mapperHint}</span>
                              )}
                            </div>
                          )}
                          {(compilationResult as any).romModeConflictWarning && (
                            <div className="mt-1 text-red-300">
                              ⚠️ {(compilationResult as any).romModeConflictWarning}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ROM Download Button */}
                  {compilationResult.success && (compilationResult as any).romFile && (
                    <div className="mt-3 p-2 bg-green-900 bg-opacity-30 rounded border border-green-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-green-400 font-semibold">🎮 ROM Ready!</div>
                          <div className="text-xs text-msx-textsecondary">
                            File: {(compilationResult as any).romFile}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const downloadUrl = buildBackendUrl((compilationResult as any).downloadUrl);
                              const link = document.createElement('a');
                              link.href = downloadUrl;
                              link.download = (compilationResult as any).romFile;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors"
                          >
                            📥 Download ROM
                          </button>
                          <button
                            onClick={() => {
                              window.open(buildBackendUrl('/roms'), '_blank');
                            }}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                          >
                            📂 View All ROMs
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Symbol File Download Button */}
                  {compilationResult.success && (compilationResult as any).symbolFile && (
                    <div className="mt-2 p-2 bg-blue-900 bg-opacity-30 rounded border border-blue-500">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-blue-400 font-semibold">📋 Symbols Files Generated!</div>
                            <div className="text-xs text-msx-textsecondary">
                              Glass format: {(compilationResult as any).symbolFile}
                            </div>
                            <div className="text-xs text-msx-textsecondary">
                              Size: {(compilationResult as any).symbolSize} bytes
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const downloadUrl = buildBackendUrl((compilationResult as any).symbolDownloadUrl);
                              const link = document.createElement('a');
                              link.href = downloadUrl;
                              link.download = (compilationResult as any).symbolFile;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                          >
                            📥 Download Glass .sym
                          </button>
                        </div>
                        {(compilationResult as any).openmsxSymbolFile && (
                          <div className="flex items-center justify-between pt-2 border-t border-blue-700">
                            <div>
                              <div className="text-xs text-blue-300">OpenMSX format: {(compilationResult as any).openmsxSymbolFile}</div>
                              <div className="text-xs text-msx-textsecondary">Ready for OpenMSX debugger</div>
                            </div>
                            <button
                              onClick={() => {
                                const downloadUrl = buildBackendUrl((compilationResult as any).openmsxSymbolDownloadUrl);
                                const link = document.createElement('a');
                                link.href = downloadUrl;
                                link.download = (compilationResult as any).openmsxSymbolFile;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded transition-colors"
                            >
                              📥 Download OpenMSX .sym
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Alternative: Show ROM management even when no recent compilation */}
                  {!compilationResult && (
                    <div className="mt-3">
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(buildBackendUrl('/roms'));
                            const data = await response.json();
                            if (data.roms && data.roms.length > 0) {
                              const romList = data.roms.map((rom: any) =>
                                `${rom.filename} (${rom.size} bytes, ${new Date(rom.created).toLocaleString()})`
                              ).join('\n');
                              alert(`📂 Available ROMs:\n\n${romList}\n\nTip: Click "View All ROMs" to access them via browser.`);
                            } else {
                              alert('📂 No ROMs available.\n\nCompile a project first to generate ROM files.');
                            }
                          } catch (error) {
                            alert(`❌ Could not connect to ROM server.\n\n${buildBackendFetchError('ROM list', 'Connection failed')}`);
                          }
                        }}
                        className="px-3 py-1 bg-msx-highlight hover:bg-opacity-80 text-msx-bgcolor text-xs rounded transition-colors"
                      >
                        📂 Check Available ROMs
                      </button>
                    </div>
                  )}
                </div>
              </Panel>
            )}
          </div>

          {/* Right Panel - Code Output */}
          <div className="w-2/3 flex flex-col">
            <Panel title="Generated Assembly Code" className="flex-1 flex flex-col overflow-hidden">
              {exportType === 'asm_all_in_one' && (
                <div className="p-3 border-b border-msx-border bg-msx-bgcolor bg-opacity-40">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <Button
                      onClick={handleBuildAndRun}
                      disabled={isPipelineBusy}
                      className="bg-yellow-300 text-black hover:bg-yellow-200 font-bold whitespace-nowrap"
                    >
                      {isBuildingAndRunning ? 'Building and Running...' : 'Build and Run'}
                    </Button>

                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs text-msx-textsecondary">
                        <span>{pipelineStatus}</span>
                        <span>{Math.round(pipelineProgress)}%</span>
                      </div>
                      <div className="mt-1 h-3 overflow-hidden rounded border border-msx-border bg-msx-panelbg">
                        <div
                          className="h-full bg-yellow-300 transition-all duration-300 ease-out"
                          style={{ width: `${Math.max(0, Math.min(100, pipelineProgress))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* File Tabs — single click selects, double click opens in Code Editor */}
              {generatedFiles.length > 1 && (
                <div className="flex flex-wrap gap-1 p-2 border-b border-msx-border bg-msx-bgcolor bg-opacity-50">
                  {generatedFiles.map((file, index) => (
                    <button
                      key={index}
                      onClick={() => handleFileTabChange(index)}
                      onDoubleClick={() => onEditFile && onEditFile(file.name, file.content)}
                      title="Double-click to open in Code Editor"
                      className={`px-3 py-1 text-xs font-mono rounded transition-colors ${activeFileIndex === index
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
