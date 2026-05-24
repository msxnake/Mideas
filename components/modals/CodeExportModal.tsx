import React, { startTransition, useState } from 'react';
import JSZip from 'jszip';
import { Button } from '../common/Button';
import { Panel } from '../common/Panel';
import { ExportRomMode, Msx2Screen4TileScreen, ProjectAsset } from '../../types';
import { hasPresentationScreenData } from '../utils/presentationScreenUtils';
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
import { generateSpriteBinaryData } from '../utils/spriteUtils';
import { generateTilePatternBytes } from '../utils/tileUtils';
import { CodeIcon, SaveIcon, CompilerIcon } from '../icons/MsxIcons';
import { buildMsx2BudgetFeedbackFromAsm, summarizeMsx2BudgetPressure } from '../../utils/msx2BudgetFeedback';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: ProjectAsset[];
  currentProjectName?: string | null;
  projectData?: any; // Full project data including tileBanks
  onEditFile?: (filename: string, content: string) => void;
  defaultRomMode?: ExportRomMode;
}

type ExportType = 'complete' | 'complete_with_statemachine' | 'statemachine_only' | 'dynamic_project_asm' | 'asm_all_in_one' | 'tiles' | 'sprites' | 'screens' | 'entities';
type RomMode = ExportRomMode;
type MapperFormat = 'konami' | 'ascii8' | 'ascii16';
type EngineExecutionMode = 'gameLoopHalt' | 'interruptTaskManager';
type RomBuildConfig = {
  romMode: RomMode;
  targetFormat: MapperFormat;
  autoMegaROM: boolean;
  executionMode: EngineExecutionMode;
  romSizeKB?: number;
};

interface Zx0CompressionOptions {
  screens: boolean;
  screenBlockMaps: boolean;
  effects: boolean;
  behaviorMaps: boolean;
  tilePatterns: boolean;
  tileColors: boolean;
  fontPatterns: boolean;
  fontColors: boolean;
  spritePatterns: boolean;
  presentationScreen: boolean;
}

const DEFAULT_ZX0_OPTIONS: Zx0CompressionOptions = {
  screens: true,
  screenBlockMaps: true,
  effects: true,
  behaviorMaps: true,
  tilePatterns: true,
  tileColors: true,
  fontPatterns: true,
  fontColors: true,
  spritePatterns: true,
  presentationScreen: true,
};

const sanitizeAsmLabel = (value: string, fallback: string): string => {
  const label = (value || fallback).toUpperCase().replace(/[^A-Z0-9_]/g, '_').replace(/^([^A-Z_])/, '_$1');
  return label || fallback;
};

const SCREEN4_MODE = 'SCREEN 4 (Graphics II)';
const LEGACY_SCREEN5_MODE = 'SCREEN 5 (Graphics III)';

const normalizeMsx2ExportScreenMode = (screenMode: string): string =>
  screenMode === LEGACY_SCREEN5_MODE ? SCREEN4_MODE : screenMode;

const isMsx2Screen4ExportMode = (screenMode: string): boolean =>
  normalizeMsx2ExportScreenMode(screenMode) === SCREEN4_MODE;

const hasMsx2PresentationAsset = (assets: ProjectAsset[]): boolean =>
  assets.some(asset => asset.type === 'msx2presentation' && (asset.data as any)?.enabled !== false);

const getMsx2Screen5ExportInfo = (assets: ProjectAsset[]) => {
  const presentations = assets.filter(asset => asset.type === 'msx2presentation' && (asset.data as any)?.enabled !== false);
  const flows = assets.filter(asset => asset.type === 'msx2gameflow');
  const flow = flows.find(asset => asset.name === 'Main MSX2') || flows[0];
  const flowData = flow?.data as any;
  const nodes = Array.isArray(flowData?.nodes) ? flowData.nodes : [];
  const connections = Array.isArray(flowData?.connections) ? flowData.connections : [];
  const nodesById = new Map(nodes.map((node: any) => [node.id, node]));
  const getNextNode = (node: any, sourceId?: string): any => {
    const nextConnection = node
      ? connections.find((connection: any) => (
        connection?.from?.nodeId === node.id &&
        (sourceId ? connection?.from?.sourceId === sourceId : !connection?.from?.sourceId)
      ))
      : null;
    return nextConnection?.to?.nodeId ? nodesById.get(nextConnection.to.nodeId) as any : null;
  };
  const getNextExportNode = (node: any, sourceId?: string): any => {
    let nextNode = getNextNode(node, sourceId);
    const waypointIds = new Set<string>();
    while ((nextNode?.type === 'Waypoint' || nextNode?.type === 'Globals') && !waypointIds.has(nextNode.id)) {
      waypointIds.add(nextNode.id);
      nextNode = getNextNode(nextNode);
    }
    return nextNode;
  };
  const isValidTerminalPath = (node: any, visited: Set<string> = new Set()): boolean => {
    if (!node?.id || visited.has(node.id)) return false;
    visited.add(node.id);
    if (node.type === 'End' || node.type === 'Restart') return true;
    if (node.type === 'Text') {
      return isValidTerminalPath(getNextExportNode(node), new Set(visited));
    }
    if (node.type === 'Transition') {
      const afterTransition = getNextExportNode(node);
      return afterTransition?.type === 'End' || afterTransition?.type === 'Restart';
    }
    if (node.type === 'IfThenElse') {
      return isValidTerminalPath(getNextExportNode(node, 'then'), new Set(visited)) &&
        isValidTerminalPath(getNextExportNode(node, 'else'), new Set(visited));
    }
    return false;
  };
  const visited = new Set<string>();
  let currentId = flowData?.startNodeId || nodes.find((node: any) => node.type === 'Start')?.id;
  const startNode = currentId ? nodesById.get(currentId) as any : nodes.find((node: any) => node.type === 'Start');
  const startNextNode = getNextExportNode(startNode);
  let screen5Node: any = null;

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const currentNode = nodesById.get(currentId) as any;
    if (!currentNode) break;
    if (currentNode.type === 'Screen5Presentation') {
      screen5Node = currentNode;
      break;
    }
    const nextConnection = connections.find((connection: any) => connection?.from?.nodeId === currentNode.id);
    currentId = nextConnection?.to?.nodeId;
  }

  if (!screen5Node) {
    screen5Node = nodes.find((node: any) => node.type === 'Screen5Presentation');
  }

  const presentationAssetId = screen5Node?.presentationAssetId;
  const presentation = presentationAssetId
    ? presentations.find(asset => asset.id === presentationAssetId)
    : presentations[0];
  const missingPresentation = Boolean(screen5Node && !presentation);
  const afterScreen5Node = getNextExportNode(screen5Node);
  const terminalNode = afterScreen5Node?.type === 'Text'
    ? getNextExportNode(afterScreen5Node)
    : afterScreen5Node;
  const nodeAfterTransition = terminalNode?.type === 'Transition'
    ? getNextExportNode(terminalNode)
    : null;
  const hasValidTerminalPath = Boolean(
    screen5Node &&
    startNextNode?.id === screen5Node.id &&
    afterScreen5Node &&
    isValidTerminalPath(afterScreen5Node)
  );

  return {
    hasScreen5Presentation: presentations.length > 0,
    hasMsx2GameFlow: Boolean(flow),
    flowName: flow?.name || null,
    hasScreen5Node: Boolean(screen5Node),
    screen5NodeId: screen5Node?.id || null,
    presentationAssetId: presentationAssetId || presentation?.id || null,
    presentationName: presentation?.name || null,
    missingPresentation,
    transitionEffect: terminalNode?.type === 'Transition' ? terminalNode.effect || 'cls' : null,
    transitionDurationFrames: terminalNode?.type === 'Transition' ? Math.max(0, Math.min(255, Math.trunc(Number(terminalNode.durationFrames) || 0))) : null,
    invalidFlowShape: Boolean(flow && (!screen5Node || startNextNode?.type !== 'Screen5Presentation' || !hasValidTerminalPath || missingPresentation)),
  };
};

const formatDbRows = (label: string, rows: number[][], comment: string): string => {
  const body = rows.length > 0
    ? rows.map(row => `    DB ${row.map(value => Math.max(0, Math.min(255, Number(value) || 0))).join(',')}`).join('\n')
    : '    DB 0';
  return `${label}:\n    ; ${comment}\n${body}`;
};

const generateMsx2Screen4ScreenAssembly = (screen: Msx2Screen4TileScreen, index: number): string => {
  const label = sanitizeAsmLabel(screen.name || screen.id, `MSX2_SCREEN4_${index}`);
  const collision = screen.layers?.collision || screen.collisionMap || [];
  const effects = screen.layers?.effects || [];
  const behavior = screen.layers?.behavior || [];
  return [
    `; MSX2 SCREEN 4 native screen: ${screen.name || screen.id}`,
    `${label}_WIDTH_TILES EQU ${screen.widthTiles || 16}`,
    `${label}_HEIGHT_TILES EQU ${screen.heightTiles || 12}`,
    `${label}_TILE_SIZE EQU ${screen.tileSize || 16}`,
    formatDbRows(`${label}_MAP`, screen.map || [], '16x12 visual tile indices'),
    formatDbRows(`${label}_COLLISION`, collision, '16x12 collision codes'),
    formatDbRows(`${label}_EFFECTS`, effects, '16x12 effect codes'),
    formatDbRows(`${label}_BEHAVIOR`, behavior, '16x12 behavior codes')
  ].join('\n');
};

const generateMsx2NativeEntitiesAssembly = (screens: Msx2Screen4TileScreen[]): string => {
  const lines: string[] = ['; MSX2 SCREEN 4 native entity summary'];
  screens.forEach((screen, screenIndex) => {
    const label = sanitizeAsmLabel(screen.name || screen.id, `MSX2_SCREEN4_${screenIndex}`);
    const entities = screen.layers?.entities || [];
    lines.push(`${label}_ENTITY_COUNT EQU ${entities.length}`);
    lines.push(`${label}_ENTITIES:`);
    if (entities.length === 0) {
      lines.push('    DB 0,0,0,0 ; empty');
      return;
    }
    entities.forEach((entity, index) => {
      const kindId = ['player', 'enemy', 'collectible', 'door', 'hazard', 'custom'].indexOf(entity.kind || 'custom');
      lines.push(`    DB ${Math.max(0, kindId)},${entity.position?.x ?? 0},${entity.position?.y ?? 0},0 ; ${index}: ${entity.name || entity.id}`);
    });
  });
  return lines.join('\n');
};

const ZX0_OPTION_ITEMS: { key: keyof Zx0CompressionOptions; label: string }[] = [
  { key: 'screens',            label: 'Screens (layout maps)' },
  { key: 'screenBlockMaps',    label: 'Screen block maps (2x2/4x4)' },
  { key: 'effects',            label: 'Effects (secret layouts)' },
  { key: 'behaviorMaps',       label: 'Behavior maps' },
  { key: 'tilePatterns',       label: 'Tile patterns' },
  { key: 'tileColors',         label: 'Tile colors' },
  { key: 'fontPatterns',       label: 'Font patterns' },
  { key: 'fontColors',         label: 'Font colors' },
  { key: 'spritePatterns',     label: 'Sprite patterns' },
  { key: 'presentationScreen', label: 'Presentation Screen' },
];

const ZX0_NONE_OPTIONS: Zx0CompressionOptions = {
  screens: false,
  screenBlockMaps: false,
  effects: false,
  behaviorMaps: false,
  tilePatterns: false,
  tileColors: false,
  fontPatterns: false,
  fontColors: false,
  spritePatterns: false,
  presentationScreen: false,
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

interface MapperReadyBundle {
  projectName: string;
  romConfig: RomBuildConfig;
  modularFiles: Record<string, string>;
  files: GeneratedFile[];
  mainCode: string;
  activeIndex: number;
}

interface PostAsmAnalysisResult {
  success: boolean;
  applied?: boolean;
  message?: string;
  summary?: {
    findings?: number;
    appliedPatches?: number;
    deadBlockCandidates?: number;
    deadCandidateLines?: number;
    deadCandidateSourceBytes?: number;
    unusedRuntimeLabels?: number;
    inactiveFeatureRuntime?: number;
    unusedScreenLoaders?: number;
    unusedBossAttackRuntime?: number;
    unusedComponentRuntime?: number;
    stateMachineDispatchHandlers?: number;
    originalLineCount?: number;
    outputLineCount?: number;
    removedLines?: number;
    removedSourceBytes?: number;
    selectedRules?: string[];
    ruleMetrics?: Record<string, {
      findings?: number;
      patchable?: number;
      removedLines?: number;
      removedSourceBytes?: number;
    }>;
  };
  report?: {
    findings?: Array<{
      rule_id: string;
      routine: string;
      line_start: number;
      line_end: number;
      summary: string;
      patchable?: boolean;
    }>;
  };
  invariantCheck?: {
    ok?: boolean;
    errors?: Array<{ id?: string; message?: string }>;
  } | null;
  reportJsonFile?: string;
  reportMarkdownFile?: string;
  optimizedAsmFile?: string;
  optimizedAsmDownloadUrl?: string;
  optimizedRomFile?: string | null;
  optimizedRomDownloadUrl?: string | null;
  error?: string;
  details?: string;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({
  isOpen,
  onClose,
  assets,
  currentProjectName,
  projectData,
  onEditFile,
  defaultRomMode = 'simple32k',
}) => {
  const [exportType, setExportType] = useState<ExportType>('asm_all_in_one');
  const [options, setOptions] = useState<CodeGenerationOptions>(DEFAULT_CODE_OPTIONS);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [generatedMsx2BudgetFeedback, setGeneratedMsx2BudgetFeedback] = useState<any | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isCompressingAsm, setIsCompressingAsm] = useState(false);
  const [isPostAsmAnalyzing, setIsPostAsmAnalyzing] = useState(false);
  const [isPostAsmOptimizing, setIsPostAsmOptimizing] = useState(false);
  const [compilationResult, setCompilationResult] = useState<{ success: boolean; message: string; data?: string } | null>(null);
  const [asmCompressionResult, setAsmCompressionResult] = useState<any>(null);
  const [postAsmAnalysisResult, setPostAsmAnalysisResult] = useState<PostAsmAnalysisResult | null>(null);
  const [postAsmOptimizationResult, setPostAsmOptimizationResult] = useState<PostAsmAnalysisResult | null>(null);
  const [projectAnalysis, setProjectAnalysis] = useState<any>(null);
  const [romMode, setRomMode] = useState<RomMode>(defaultRomMode);
  const [mapperFormat, setMapperFormat] = useState<MapperFormat>('konami');
  const [romSizeKB, setRomSizeKB] = useState<number | undefined>(undefined);
  const [executionMode, setExecutionMode] = useState<EngineExecutionMode>('interruptTaskManager');
  const [lastGeneratedRomConfig, setLastGeneratedRomConfig] = useState<RomBuildConfig | null>(null);
  const [isQuickValidating, setIsQuickValidating] = useState(false);
  const [quickValidationSummary, setQuickValidationSummary] = useState<string | null>(null);
  const [isBuildingAndRunning, setIsBuildingAndRunning] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [pipelineStatus, setPipelineStatus] = useState('Ready');
  const [zx0Options, setZx0Options] = useState<Zx0CompressionOptions>(DEFAULT_ZX0_OPTIONS);

  const isPipelineBusy = isGenerating || isCompiling || isCompressingAsm || isPostAsmAnalyzing || isPostAsmOptimizing || isQuickValidating || isBuildingAndRunning;
  const msx2Screen5ExportInfo = getMsx2Screen5ExportInfo(assets);
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

  const updateGeneratedCode = (code: string) => {
    setGeneratedCode(code);
    setGeneratedMsx2BudgetFeedback(buildMsx2BudgetFeedbackFromAsm(code));
  };

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

  const unifiedAsmNeedsRequiredZx0Preprocess = (
    sourceCode: string,
    romConfig: RomBuildConfig | null | undefined
  ) => {
    if (!sourceCode.trim() || !romConfig || romConfig.romMode !== 'plain48k') {
      return false;
    }

    if (!/;\s*File:\s*unitedFiles\.asm/i.test(sourceCode)) {
      return false;
    }

    return (
      /^\s*;\s*Linear48K Page0 Data:\s*Yes\b/im.test(sourceCode) ||
      /^\s*;\s*FONT_DATA_ROM_DATA_GROUP:\s*page0\s*$/im.test(sourceCode) ||
      /^\s*;\s*PRESENTATION_SCREEN_ROM_DATA_GROUP:\s*page0\s*$/im.test(sourceCode)
    );
  };

  const mergeCompressedAsmIntoFiles = (files: GeneratedFile[], result: any) => {
    const compressedFileName = result.unitedCompressedAsmFile || 'unitedCompressedFiles.asm';
    const compressedContent = String(result.compressedCode || '');
    const existingWithoutCompressed = files.filter(
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

    return {
      nextFiles,
      compressedIndex: compressedIndex >= 0 ? compressedIndex : 0,
      compressedFileName,
      compressedContent
    };
  };

  const handleFileTabChange = (index: number) => {
    setActiveFileIndex(index);
    if (generatedFiles[index]) {
      updateGeneratedCode(generatedFiles[index].content);
    }
  };

  const buildCurrentRomConfig = (): RomBuildConfig => ({
    romMode,
    targetFormat: mapperFormat,
    autoMegaROM: romMode === 'auto',
    executionMode,
    romSizeKB
  });

  const isRomConfigDifferent = (generatedConfig: RomBuildConfig | null, currentConfig: RomBuildConfig) => {
    if (!generatedConfig) return false;
    return generatedConfig.romMode !== currentConfig.romMode ||
      generatedConfig.targetFormat !== currentConfig.targetFormat ||
      generatedConfig.autoMegaROM !== currentConfig.autoMegaROM ||
      generatedConfig.executionMode !== currentConfig.executionMode ||
      generatedConfig.romSizeKB !== currentConfig.romSizeKB;
  };

  const formatRomConfig = (config: RomBuildConfig | null) => {
    if (!config) return 'N/A';
    const sizeStr = config.romSizeKB ? `, size=${config.romSizeKB}KB` : '';
    return `mode=${config.romMode}, mapper=${config.targetFormat}, autoMegaROM=${config.autoMegaROM}, engine=${config.executionMode}${sizeStr}`;
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

    if (projectData?.presentationScreen && hasPresentationScreenData(projectData.presentationScreen)) {
      enhancedAssets.push({
        id: 'system_presentation_screen',
        type: 'presentationscreen',
        name: projectData.presentationScreen.name || 'Presentation Screen',
        data: projectData.presentationScreen
      } as ProjectAsset);
    }

    return enhancedAssets;
  };

  const getModularFileOrder = () => [
    'unitedFiles.asm',
    'main.asm',
    'page0.asm',
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

  const generateMapperReadyBundle = async (
    projectNameInput?: string,
    romConfigInput?: RomBuildConfig
  ): Promise<MapperReadyBundle> => {
    const projectName = projectNameInput || currentProjectName || 'MSX_Game';
    const romConfig = romConfigInput || buildCurrentRomConfig();
    const enhancedAssets = getEnhancedAssets();
    const rawScreenMode = projectData?.screenMode || projectData?.currentScreenMode || 'SCREEN 2 (Graphics I)';
    const hasScreen5Presentation = hasMsx2PresentationAsset(enhancedAssets);
    const currentScreenMode = hasScreen5Presentation ? LEGACY_SCREEN5_MODE : normalizeMsx2ExportScreenMode(rawScreenMode);
    const targetGraphicsBackend = hasScreen5Presentation
      ? 'msx2-screen5-presentation'
      : isMsx2Screen4ExportMode(currentScreenMode)
      ? 'msx2-screen4-pattern'
      : 'screen2-tilebank';
    const { generateModularASM } = await import('../../utils/msxGenerator');

    const modularFiles = generateModularASM(projectName, enhancedAssets, {
      generateUnified: true,
      ...romConfig,
      screenMode: currentScreenMode,
      targetGraphicsBackend
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
          autoMegaROM: romConfig.autoMegaROM,
          romSizeKB: romConfig.romSizeKB
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
          plain48kSupportWarning: result.plain48kSupportWarning,
          resolvedRomConfig: result.resolvedRomConfig,
          romModeConflictWarning: result.romModeConflictWarning,
          romSizeInfo: result.romSizeInfo,
          suggestedRomConfig: result.suggestedRomConfig,
          negativeDsOverflowBytes: result.negativeDsOverflowBytes,
          plain48kPage0Info: result.plain48kPage0Info,
          msx2BudgetFeedback: result.msx2BudgetFeedback,
          msx2BudgetResolution: result.msx2BudgetResolution,
          msx2CompileFailure: result.msx2CompileFailure,
          screenCompressionInfo: result.screenCompressionInfo,
          compressedAsmFileInfo: result.compressedAsmFileInfo
        };
      }

      const resolvedRomMode = result?.resolvedRomConfig?.resolvedRomMode;
      if (['megarom_required', 'megarom_failed', 'plain48k_recommended', 'plain48k_pending'].includes(resolvedRomMode)) {
        return {
          ...result,
          success: false,
          message: result.details || result.romModeConflictWarning || result.resolvedRomConfig?.reason || 'ROM does not fit in selected ROM mode'
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

  const runOpenMSXRequest = async (
    romFile: string,
    resolvedRomMode?: string,
    mapperTargetFormat?: string
  ) => {
    try {
      const normalizedMapper = (mapperTargetFormat || '').toLowerCase();
      const romType = resolvedRomMode === 'plain48k'
        ? 'Plain'
        : resolvedRomMode === 'megarom' && normalizedMapper === 'konami'
          ? 'konami'
          : resolvedRomMode === 'megarom' && normalizedMapper === 'ascii8'
            ? 'ASCII8'
            : resolvedRomMode === 'megarom' && normalizedMapper === 'ascii16'
              ? 'ASCII16'
              : undefined;
      const response = await fetch(buildBackendUrl('/run-openmsx'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ romFile, romType }),
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

  const runPostAsmAnalysisRequest = async (
    sourceCode: string,
    projectNameInput?: string
  ): Promise<PostAsmAnalysisResult> => {
    try {
      const response = await fetch(buildBackendUrl('/analyze-post-asm'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: sourceCode,
          projectName: projectNameInput || currentProjectName || 'MSX_Game',
          rules: ['dead-blocks', 'unused-runtime-labels', 'inactive-feature-runtime', 'unused-screen-loaders', 'unused-boss-attack-runtime', 'unused-component-runtime', 'state-machine-dispatch-handlers']
        }),
      });

      const responseText = await response.text();
      let result: PostAsmAnalysisResult;

      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        return {
          success: false,
          message: `Post-ASM analysis response error: ${responseText}`,
          details: String(jsonError)
        };
      }

      if (!response.ok || !result.success) {
        return {
          success: false,
          message: result.details || result.error || 'Unknown post-ASM analysis error',
          ...result
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: buildBackendFetchError('Post-ASM analysis', error),
        details: String(error)
      };
    }
  };

  const runPostAsmOptimizeRequest = async (
    sourceCode: string,
    projectNameInput?: string
  ): Promise<PostAsmAnalysisResult> => {
    try {
      const response = await fetch(buildBackendUrl('/optimize-post-asm'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: sourceCode,
          projectName: projectNameInput || currentProjectName || 'MSX_Game',
          passes: 7,
          validateGlass: true,
          rules: ['dead-blocks', 'unused-screen-loaders', 'inactive-feature-runtime', 'unused-boss-attack-runtime', 'unused-component-runtime', 'state-machine-dispatch-handlers']
        }),
      });

      const responseText = await response.text();
      let result: PostAsmAnalysisResult;

      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        return {
          success: false,
          message: `Post-ASM optimization response error: ${responseText}`,
          details: String(jsonError)
        };
      }

      if (!response.ok || !result.success) {
        return {
          success: false,
          message: result.details || result.error || 'Unknown post-ASM optimization error',
          ...result
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: buildBackendFetchError('Post-ASM optimization', error),
        details: String(error)
      };
    }
  };

  const maybeAutoCompressMapperReadyBundle = async (bundle: MapperReadyBundle) => {
    const sourceCode = bundle.modularFiles['unitedFiles.asm'] || bundle.mainCode;
    if (!unifiedAsmNeedsRequiredZx0Preprocess(sourceCode, bundle.romConfig)) {
      return { bundle, compressionResult: null };
    }

    const result = await runCompressRequest(sourceCode, bundle.projectName, zx0Options);
    if (!result.success) {
      throw new Error(result.message || 'Plain 48KB ASM requires ZX0 preprocessing before export.');
    }

    if (!result.applied || !result.compressedCode) {
      throw new Error(result.message || 'Plain 48KB ASM requires ZX0-compressed page0 data, but compression was skipped.');
    }

    const merged = mergeCompressedAsmIntoFiles(bundle.files, result);

    return {
      compressionResult: result,
      bundle: {
        ...bundle,
        modularFiles: {
          ...bundle.modularFiles,
          [merged.compressedFileName]: merged.compressedContent
        },
        files: merged.nextFiles,
        mainCode: merged.compressedContent,
        activeIndex: merged.compressedIndex
      }
    };
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

    if (compileResult?.msx2BudgetResolution) {
      const resolution = compileResult.msx2BudgetResolution;
      const attempts = Array.isArray(resolution.attempts) ? resolution.attempts.length : 0;
      lines.push(`MSX2 budget resolution: ${resolution.status ?? 'unknown'} (${attempts} attempt${attempts === 1 ? '' : 's'})`);
      const finalAttempt = Array.isArray(resolution.attempts)
        ? [...resolution.attempts].reverse().find((item: any) => item?.action)
        : null;
      if (finalAttempt?.action) {
        lines.push(`MSX2 budget action: ${finalAttempt.action}`);
      }
    }

    if (compileResult?.plain48kPage0Info) {
      const page0 = compileResult.plain48kPage0Info;
      const selected = Array.isArray(page0.selectedGroups) && page0.selectedGroups.length > 0
        ? page0.selectedGroups.map((group: any) => `${group.label} (${group.sizeBytes} bytes)`).join(', ')
        : 'none';
      const skipped = Array.isArray(page0.skippedGroups) && page0.skippedGroups.length > 0
        ? page0.skippedGroups.map((group: any) => `${group.label} (${group.sizeBytes} bytes)`).join(', ')
        : 'none';
      lines.push(`Plain48K page0: used=${page0.usedBytes ?? '?'} bytes, remaining=${page0.remainingBytes ?? '?'} bytes`);
      lines.push(`Plain48K page0 selected: ${selected}`);
      lines.push(`Plain48K page0 skipped: ${skipped}`);
    }

    if (compileResult?.suggestedRomConfig) {
      const suggested = compileResult.suggestedRomConfig;
      const suggestedSize = suggested.romSizeKB ? `, size=${suggested.romSizeKB}KB` : '';
      const suggestedMapper = suggested.mapperActive === false ? 'none' : (suggested.targetFormat ?? 'unknown');
      lines.push(`Suggested path: ${suggested.label || suggested.romMode} (mode=${suggested.romMode}, mapper=${suggestedMapper}${suggestedSize})`);
      if (suggested.validationStatus === 'candidate') {
        lines.push('Suggestion status: candidate only; the regenerated build must compile before it can be used.');
      }
      if (suggested.reason) {
        lines.push(`Suggestion reason: ${suggested.reason}`);
      }
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
    setPostAsmAnalysisResult(null);
    setPostAsmOptimizationResult(null);

    try {
      let code = '';
      let files: GeneratedFile[] = [];
      let generatedRomConfig: RomBuildConfig | null = null;
      let nextActiveFileIndex = 0;

      const projectName = currentProjectName || "MSX_Project";
      const hasScreen5Presentation = hasMsx2PresentationAsset(assets);
      const rawScreenMode = projectData?.currentScreenMode || projectData?.screenMode || 'SCREEN 2 (Graphics I)';
      const activeScreenMode = hasScreen5Presentation ? LEGACY_SCREEN5_MODE : normalizeMsx2ExportScreenMode(rawScreenMode);
      const isScreen4Backend = isMsx2Screen4ExportMode(activeScreenMode);

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
          const msx2Screens = assets.filter(a => a.type === 'msx2screen').map(a => a.data as Msx2Screen4TileScreen);
          const tilesForScreens = assets.filter(a => a.type === 'tile').map(a => a.data as any);

          if (hasScreen5Presentation) {
            const screen5Bundle = await generateMapperReadyBundle(projectName, buildCurrentRomConfig());
            generatedRomConfig = screen5Bundle.romConfig;
            files = screen5Bundle.files;
            code = screen5Bundle.mainCode;
            nextActiveFileIndex = screen5Bundle.activeIndex;
          } else if (isScreen4Backend && msx2Screens.length > 0) {
            files = msx2Screens.map((screen, index) => ({
              name: `screen4_${index}.asm`,
              content: generateMsx2Screen4ScreenAssembly(screen, index)
            }));
            files.unshift({
              name: 'all_screen4_screens.asm',
              content: msx2Screens.map((screen, index) =>
                generateMsx2Screen4ScreenAssembly(screen, index)
              ).join('\n\n')
            });
            code = files[0].content;
          } else if (screenMaps.length > 1) {
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
                  autoMegaROM: false,
                  executionMode: asmBundle.romConfig.executionMode
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

          const autoCompressedBundle = await maybeAutoCompressMapperReadyBundle(asmBundle);
          asmBundle = autoCompressedBundle.bundle;
          if (autoCompressedBundle.compressionResult) {
            setAsmCompressionResult(autoCompressedBundle.compressionResult);
          }
          generatedRomConfig = asmBundle.romConfig;
          files = asmBundle.files;
          code = asmBundle.mainCode;
          nextActiveFileIndex = asmBundle.activeIndex;
          break;

        case 'entities':
          const mainScreen = assets.filter(a => a.type === 'screenmap').map(a => a.data as any)
            .find(s => s.layers.entities.length > 0);
          const nativeMsx2EntityScreens = assets
            .filter(a => a.type === 'msx2screen')
            .map(a => a.data as Msx2Screen4TileScreen)
            .filter(screen => (screen.layers?.entities || []).length > 0);
          const components = assets.filter(a => a.type === 'componentdefinition').map(a => a.data as any);
          const templates = assets.filter(a => a.type === 'entitytemplate').map(a => a.data as any);

          if (isScreen4Backend && nativeMsx2EntityScreens.length > 0) {
            code = generateMsx2NativeEntitiesAssembly(nativeMsx2EntityScreens);
          } else if (mainScreen && components.length > 0 && templates.length > 0) {
            code = generateEntityAssembly(mainScreen.layers.entities, components, templates, options);
          } else {
            code = '; No entities found or missing component definitions/templates';
          }
          files = [{ name: 'entities.asm', content: code }];
          break;
      }

      updateGeneratedCode(code);
      setGeneratedFiles(files);
      setActiveFileIndex(nextActiveFileIndex);
      setLastGeneratedRomConfig(generatedRomConfig);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = `; Error generating code: ${errorMessage}`;
      updateGeneratedCode(errorCode);
      setGeneratedFiles([{ name: 'error.asm', content: errorCode }]);
      setActiveFileIndex(0);
      setLastGeneratedRomConfig(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyzePostAsm = async () => {
    if (!generatedCode.trim()) {
      alert('Generate code first before analyzing ASM');
      return;
    }

    setIsPostAsmAnalyzing(true);
    setPostAsmAnalysisResult(null);

    try {
      const result = await runPostAsmAnalysisRequest(generatedCode, currentProjectName || 'MSX_Game');
      setPostAsmAnalysisResult(result);
      if (!result.success) {
        alert(`Post-ASM analysis failed: ${result.message || 'Unknown error'}`);
      }
    } finally {
      setIsPostAsmAnalyzing(false);
    }
  };

  const handleOptimizePostAsm = async () => {
    if (!generatedCode.trim()) {
      alert('Generate code first before optimizing ASM');
      return;
    }

    setIsPostAsmOptimizing(true);
    setPostAsmOptimizationResult(null);

    try {
      const result = await runPostAsmOptimizeRequest(generatedCode, currentProjectName || 'MSX_Game');
      setPostAsmOptimizationResult(result);
      if (!result.success) {
        alert(`Post-ASM optimization failed: ${result.message || 'Unknown error'}`);
      }
    } finally {
      setIsPostAsmOptimizing(false);
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

  const runMapperPipeline = async (launchAfterBuild: boolean, romConfigOverride?: RomBuildConfig) => {
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
    setPostAsmAnalysisResult(null);
    setPostAsmOptimizationResult(null);
    setQuickValidationSummary(null);
    setPipelineProgress(5);
    setPipelineStatus('Generating ASM...');

    try {
      const romConfig = romConfigOverride || buildCurrentRomConfig();
      const bundle = await generateMapperReadyBundle(currentProjectName || 'MSX_Game', romConfig);

      updateGeneratedCode(bundle.mainCode);
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
            updateGeneratedCode(compressedContent);
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
          autoMegaROM: false,
          executionMode: bundle.romConfig.executionMode
        };
        const cleanBundle = await generateMapperReadyBundle(bundle.projectName, cleanRomConfig);
        updateGeneratedCode(cleanBundle.mainCode);
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
          const openMsxResult = await runOpenMSXRequest(
            (compileResult as any).romFile,
            compileResult?.resolvedRomConfig?.resolvedRomMode,
            compileResult?.resolvedRomConfig?.mapperTargetFormat || bundle.romConfig.targetFormat
          );
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
          summary += compileResult?.success
            ? '\nRun skipped: no ROM was produced.'
            : '\nRun skipped: build failed or ROM mode was blocked before a valid ROM was produced.';
          setPipelineProgress(100);
          setPipelineStatus(compileResult?.success ? 'Build completed, run skipped' : 'Build blocked, run skipped');
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

  const handleSuggestedRomBuild = async (suggested: any) => {
    const nextRomMode = ['auto', 'simple32k', 'plain48k', 'megarom'].includes(suggested?.romMode)
      ? suggested.romMode as RomMode
      : 'plain48k';
    const nextMapperFormat = ['konami', 'ascii8', 'ascii16'].includes(suggested?.targetFormat)
      ? suggested.targetFormat as MapperFormat
      : mapperFormat;
    const nextRomSizeKB = typeof suggested?.romSizeKB === 'number' ? suggested.romSizeKB : undefined;
    const nextConfig: RomBuildConfig = {
      romMode: nextRomMode,
      targetFormat: nextMapperFormat,
      autoMegaROM: typeof suggested?.autoMegaROM === 'boolean' ? suggested.autoMegaROM : nextRomMode === 'auto' || nextRomMode === 'megarom',
      executionMode,
      romSizeKB: nextRomSizeKB
    };

    setRomMode(nextConfig.romMode);
    setMapperFormat(nextConfig.targetFormat);
    setRomSizeKB(nextConfig.romSizeKB);
    await runMapperPipeline(false, nextConfig);
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
    setPostAsmAnalysisResult(null);
    setPostAsmOptimizationResult(null);

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

      const merged = mergeCompressedAsmIntoFiles(generatedFiles, result);
      startTransition(() => {
        setGeneratedFiles(merged.nextFiles);
        setActiveFileIndex(merged.compressedIndex);
        updateGeneratedCode(merged.compressedContent);
      });

      const info = result.compressionInfo || {};
      alert(
        `ZX0 compression applied.\n\n` +
        `Screens: ${info.compressedScreens || 0}/${info.candidateScreens || 0}\n` +
        `Screen block maps: ${info.compressedScreenBlockMaps || 0}/${info.candidateScreenBlockMaps || 0}\n` +
        `Effects: ${info.compressedEffects || 0}/${info.candidateEffects || 0}\n` +
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

  const handleSaveCode = async () => {
    if (!generatedCode.trim()) {
      alert('No code to save');
      return;
    }

    let codeToSave = generatedCode;
    let filename = generatedFiles[activeFileIndex]
      ? generatedFiles[activeFileIndex].name
      : `${exportType}_code_${new Date().toISOString().split('T')[0]}.asm`;

    if (unifiedAsmNeedsRequiredZx0Preprocess(generatedCode, lastGeneratedRomConfig) && filename === 'unitedFiles.asm') {
      setIsCompressingAsm(true);
      try {
        const result = await runCompressRequest(generatedCode, currentProjectName || 'MSX_Game', zx0Options);
        if (!result.success || !result.applied || !result.compressedCode) {
          alert(`Compression failed: ${result.message || 'Plain 48KB ASM requires ZX0 preprocessing before saving.'}`);
          return;
        }

        const merged = mergeCompressedAsmIntoFiles(generatedFiles, result);
        codeToSave = merged.compressedContent;
        filename = merged.compressedFileName;
        setAsmCompressionResult(result);
        startTransition(() => {
          setGeneratedFiles(merged.nextFiles);
          setActiveFileIndex(merged.compressedIndex);
          updateGeneratedCode(merged.compressedContent);
        });
      } finally {
        setIsCompressingAsm(false);
      }
    }

    // Save the ASM file
    const blob = new Blob([codeToSave], { type: 'text/plain' });
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
  const msx2BudgetFeedback = (compilationResult as any)?.msx2BudgetFeedback || generatedMsx2BudgetFeedback;
  const msx2BudgetFeedbackSource = (compilationResult as any)?.msx2BudgetFeedback ? 'build' : generatedMsx2BudgetFeedback ? 'generated ASM' : null;
  const msx2BudgetResolution = (compilationResult as any)?.msx2BudgetResolution;
  const msx2BudgetResolutionAttempts = Array.isArray(msx2BudgetResolution?.attempts)
    ? msx2BudgetResolution.attempts
    : [];
  const msx2BudgetStatus = String(msx2BudgetFeedback?.status || 'ok');
  const msx2BudgetStatusClass = msx2BudgetStatus === 'error'
    ? 'border-red-500 bg-red-950 bg-opacity-40 text-red-100'
    : msx2BudgetStatus === 'warning'
      ? 'border-yellow-500 bg-yellow-950 bg-opacity-30 text-yellow-100'
      : 'border-msx-border bg-msx-bgcolor bg-opacity-30 text-msx-textsecondary';
  const msx2BudgetBadgeClass = msx2BudgetStatus === 'error'
    ? 'text-red-200'
    : msx2BudgetStatus === 'warning'
      ? 'text-yellow-200'
      : 'text-green-200';
  const msx2BudgetPressureSummary = summarizeMsx2BudgetPressure(msx2BudgetFeedback);
  const msx2CompileFailure = (compilationResult as any)?.msx2CompileFailure;
  const msx2CompileFailurePlanB = msx2CompileFailure?.planB;

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
                    <option value="plain48k">Force Plain 48KB</option>
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

                <div>
                  <label className="block text-sm font-medium text-msx-textsecondary mb-2">
                    ROM Size:
                  </label>
                  <select
                    value={romSizeKB ?? 0}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setRomSizeKB(v === 0 ? undefined : v);
                    }}
                    className="w-full p-2 text-sm bg-msx-bgcolor border border-msx-border rounded text-msx-textprimary"
                  >
                    <option value={0}>Auto (32KB / 48KB / power-of-two)</option>
                    <option value={32}>32 KB</option>
                    <option value={48}>48 KB (plain48k)</option>
                    <option value={64}>64 KB</option>
                    <option value={128}>128 KB</option>
                    <option value={256}>256 KB</option>
                  </select>
                </div>

                <div className="bg-msx-bgcolor bg-opacity-40 border border-msx-border rounded p-2 text-xs text-msx-textsecondary">
                  Active ROM config: mode=<strong>{romMode}</strong>, mapper=<strong>{mapperFormat}</strong>, size=<strong>{romSizeKB ? `${romSizeKB}KB` : 'auto'}</strong>, engine=<strong>{executionMode}</strong>
                  {msx2Screen5ExportInfo.hasScreen5Presentation && (
                    <>
                      <div className="mt-1">
                        SCREEN 5 export: GameFlow=<strong>{msx2Screen5ExportInfo.flowName || 'auto'}</strong>, presentation=<strong>{msx2Screen5ExportInfo.presentationName || 'missing'}</strong>
                      </div>
                      <div className="mt-1">
                        Terminal transition=<strong>{msx2Screen5ExportInfo.transitionEffect ? `${msx2Screen5ExportInfo.transitionEffect} (${msx2Screen5ExportInfo.transitionDurationFrames} frames)` : 'none'}</strong>
                      </div>
                    </>
                  )}
                  {msx2Screen5ExportInfo.missingPresentation && (
                    <div className="mt-1 text-red-300">
                      Warning: selected MSX2 GameFlow node references a missing SCREEN 5 presentation asset.
                    </div>
                  )}
                  {msx2Screen5ExportInfo.invalidFlowShape && (
                    <div className="mt-1 text-yellow-300">
                      Warning: MSX2 SCREEN 5 export needs a reachable Screen5Presentation node and supports Start -&gt; optional Waypoints -&gt; Screen5Presentation -&gt; optional terminal Transition -&gt; End/Restart.
                    </div>
                  )}
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
                      <li>• Multiple screens: {(getAssetCount('screenmap') + getAssetCount('msx2screen') + getAssetCount('msx2bitmaproom')) > 1 ? 'Yes' : 'No'}</li>
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


                {projectAnalysis && exportType === 'dynamic_project_asm' && (
                  <div className="bg-blue-500 bg-opacity-10 p-2 rounded text-xs text-msx-textsecondary">
                    <p><strong>Project Analysis Results:</strong></p>
                    <ul className="mt-1 ml-4 text-xs">
                      <li>• ECS System: {projectAnalysis.hasECS ? '✅ Detected' : '❌ Not detected'}</li>
                      <li>• Components: {projectAnalysis.components.length}</li>
                      <li>• Entity Templates: {projectAnalysis.templates.length}</li>
                      <li>• Sprites: {projectAnalysis.sprites.length} ({projectAnalysis.hasAnimations ? 'with animations' : 'static'})</li>
                      <li>• Screens: {(projectAnalysis.screenMaps?.length || 0) + (projectAnalysis.msx2Screens?.length || 0) + (projectAnalysis.msx2Presentations?.length || 0)}</li>
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
                {ZX0_OPTION_ITEMS.map(({ key, label }) => (
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
                    onClick={() => setZx0Options(ZX0_NONE_OPTIONS)}
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
                  {isCompressingAsm ? 'Compressing...' : 'Compress Screen + Block Maps + Effects + Behavior + Tiles + Font (ZX0)'}
                </Button>

                <Button
                  onClick={handleAnalyzePostAsm}
                  disabled={isPostAsmAnalyzing || isPipelineBusy || !generatedCode.trim()}
                  variant="secondary"
                  className="w-full"
                >
                  {isPostAsmAnalyzing ? 'Analyzing unused ASM...' : 'Analyze unused ASM'}
                </Button>

                <Button
                  onClick={handleOptimizePostAsm}
                  disabled={isPostAsmOptimizing || isPipelineBusy || !generatedCode.trim()}
                  variant="secondary"
                  className="w-full"
                >
                  {isPostAsmOptimizing ? 'Applying validated ASM optimization...' : 'Apply unused ASM (validated)'}
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

                {!compilationResult && msx2BudgetFeedback && (
                  <div className={`p-2 rounded text-xs border ${msx2BudgetStatusClass}`}>
                    <div className="font-semibold text-msx-highlight mb-1">
                      MSX2 MegaROM budget preview
                    </div>
                    <div>
                      Source: <strong>{msx2BudgetFeedbackSource}</strong>
                      {', '}pressure=<strong className={msx2BudgetBadgeClass}>{msx2BudgetStatus}</strong>
                    </div>
                    <div>
                      Payload: <strong>{msx2BudgetFeedback.rom?.payloadBytes ?? 0}</strong> bytes,
                      {' '}RAM free: <strong>{msx2BudgetFeedback.ram?.freeBytes ?? 0}</strong> bytes
                    </div>
                    <div className="mt-1">
                      Core/resident: <strong>{msx2BudgetPressureSummary.residentCoreBytes}</strong> bytes,
                      {' '}world/content: <strong>{msx2BudgetPressureSummary.worldContentBytes}</strong> bytes
                    </div>
                    {msx2BudgetFeedback.runtimeModules && (
                      <div className="mt-1">
                        Runtime modules: <strong>{msx2BudgetFeedback.runtimeModules.includedCount ?? 0}</strong>
                        {' '}included ({msx2BudgetFeedback.runtimeModules.residentCount ?? 0} resident,
                        {' '}{msx2BudgetFeedback.runtimeModules.farCodeCount ?? 0} far,
                        {' '}{msx2BudgetFeedback.runtimeModules.worldSpecificCount ?? 0} world)
                      </div>
                    )}
                    {msx2BudgetFeedback.worldBankManifest && (
                      <div className="mt-1">
                        World Bank Packs: <strong>{msx2BudgetFeedback.worldBankManifest.worldCount ?? 0}</strong>
                        {' '}worlds, <strong>{msx2BudgetFeedback.worldBankManifest.estimatedPhysicalBankCount ?? 0}</strong>
                        {' '}banks @ {msx2BudgetFeedback.worldBankManifest.dataWindowAddress ?? '#A000'}
                        {(msx2BudgetFeedback.worldBankManifest.warningBankCount || msx2BudgetFeedback.worldBankManifest.overBudgetBankCount) ? (
                          <>
                            {' '}({msx2BudgetFeedback.worldBankManifest.warningBankCount ?? 0} warning, {msx2BudgetFeedback.worldBankManifest.overBudgetBankCount ?? 0} over)
                          </>
                        ) : null}
                      </div>
                    )}
                    {Array.isArray(msx2BudgetFeedback.worldPackages) && msx2BudgetFeedback.worldPackages.length > 0 && (
                      <div className="mt-1">
                        Worlds: {msx2BudgetFeedback.worldPackages
                          .slice(0, 2)
                          .map((item: any) => `${item.worldId ?? item.id} ${item.estimatedBytes ?? item.usedBytes ?? 0}b`)
                          .join(', ')}
                      </div>
                    )}
                    {Array.isArray(msx2BudgetFeedback.largestAssets) && msx2BudgetFeedback.largestAssets.length > 0 && (
                      <div className="mt-1">
                        Largest: {msx2BudgetFeedback.largestAssets
                          .slice(0, 2)
                          .map((item: any) => `${item.id} ${item.usedBytes}b`)
                          .join(', ')}
                      </div>
                    )}
                    {Array.isArray(msx2BudgetFeedback.warnings?.warningPackedBanks) &&
                      msx2BudgetFeedback.warnings.warningPackedBanks.length > 0 && (
                        <div className="mt-1 text-yellow-200">
                          Warning banks: {msx2BudgetFeedback.warnings.warningPackedBanks
                            .slice(0, 3)
                            .map((item: any) => `${item.bankId ?? item.id ?? '?'} ${item.usedBytes ?? item.bytes ?? 0}b`)
                            .join(', ')}
                        </div>
                      )}
                    {Array.isArray(msx2BudgetFeedback.suggestedFixes) && msx2BudgetFeedback.suggestedFixes.length > 0 && (
                      <div className="mt-2 text-yellow-200">
                        Suggested fixes:
                        {msx2BudgetFeedback.suggestedFixes.slice(0, 3).map((fix: any, index: number) => (
                          <div key={`${fix.target || 'fix'}_${index}`} className="font-mono text-[11px] text-yellow-100">
                            {fix.target ? `${fix.target}: ` : ''}{fix.action || fix.reason || 'Review budget'}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {postAsmAnalysisResult && (
                  <div className={`p-2 rounded text-xs border text-msx-textsecondary ${
                    postAsmAnalysisResult.success
                      ? 'bg-cyan-900 bg-opacity-30 border-cyan-600'
                      : 'bg-red-900 bg-opacity-30 border-red-600'
                  }`}>
                    <div className={`font-semibold mb-1 ${postAsmAnalysisResult.success ? 'text-cyan-300' : 'text-red-300'}`}>
                      Post-ASM Analysis
                    </div>
                    {postAsmAnalysisResult.success ? (
                      <>
                        <div>Findings: {postAsmAnalysisResult.summary?.findings ?? 0}</div>
                        <div>
                          Dead blocks: {postAsmAnalysisResult.summary?.deadBlockCandidates ?? 0}
                          {' '}({postAsmAnalysisResult.summary?.deadCandidateLines ?? 0} lines / {postAsmAnalysisResult.summary?.deadCandidateSourceBytes ?? 0} bytes)
                        </div>
                        <div>Unused runtime labels: {postAsmAnalysisResult.summary?.unusedRuntimeLabels ?? 0}</div>
                        <div>Inactive feature runtime: {postAsmAnalysisResult.summary?.inactiveFeatureRuntime ?? 0}</div>
                        <div>Unused screen loaders: {postAsmAnalysisResult.summary?.unusedScreenLoaders ?? 0}</div>
                        <div>Unused boss attack runtime: {postAsmAnalysisResult.summary?.unusedBossAttackRuntime ?? 0}</div>
                        <div>Unused component runtime: {postAsmAnalysisResult.summary?.unusedComponentRuntime ?? 0}</div>
                        <div>State-machine dispatch handlers: {postAsmAnalysisResult.summary?.stateMachineDispatchHandlers ?? 0}</div>
                        {(postAsmAnalysisResult.summary?.selectedRules?.length || 0) > 0 && (
                          <div className="font-mono text-[11px] text-cyan-100">
                            Rules: {postAsmAnalysisResult.summary?.selectedRules?.join(', ')}
                          </div>
                        )}
                        <div>ASM lines: {postAsmAnalysisResult.summary?.originalLineCount ?? 0}</div>
                        {(postAsmAnalysisResult.report?.findings || []).slice(0, 5).map((finding, index) => (
                          <div key={`${finding.rule_id}_${finding.routine}_${index}`} className="mt-1 font-mono text-[11px] text-msx-textprimary">
                            {finding.rule_id}: {finding.routine} lines {finding.line_start}-{finding.line_end}
                          </div>
                        ))}
                        {(postAsmAnalysisResult.report?.findings?.length || 0) > 5 && (
                          <div className="mt-1">
                            +{(postAsmAnalysisResult.report?.findings?.length || 0) - 5} more in report
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {postAsmAnalysisResult.reportMarkdownFile && (
                            <button
                              onClick={() => {
                                const downloadUrl = buildBackendUrl(`/download/${postAsmAnalysisResult.reportMarkdownFile}`);
                                const link = document.createElement('a');
                                link.href = downloadUrl;
                                link.download = postAsmAnalysisResult.reportMarkdownFile || 'post_asm_report.md';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="px-3 py-1 bg-cyan-700 hover:bg-cyan-600 text-white text-xs rounded transition-colors"
                            >
                              Download MD
                            </button>
                          )}
                          {postAsmAnalysisResult.reportJsonFile && (
                            <button
                              onClick={() => {
                                const downloadUrl = buildBackendUrl(`/download/${postAsmAnalysisResult.reportJsonFile}`);
                                const link = document.createElement('a');
                                link.href = downloadUrl;
                                link.download = postAsmAnalysisResult.reportJsonFile || 'post_asm_report.json';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="px-3 py-1 bg-cyan-700 hover:bg-cyan-600 text-white text-xs rounded transition-colors"
                            >
                              Download JSON
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div>{postAsmAnalysisResult.message || postAsmAnalysisResult.details || 'Analysis failed'}</div>
                    )}
                  </div>
                )}

                {postAsmOptimizationResult && (
                  <div className={`p-2 rounded text-xs border text-msx-textsecondary ${
                    postAsmOptimizationResult.success
                      ? 'bg-purple-900 bg-opacity-30 border-purple-600'
                      : 'bg-red-900 bg-opacity-30 border-red-600'
                  }`}>
                    <div className={`font-semibold mb-1 ${postAsmOptimizationResult.success ? 'text-purple-300' : 'text-red-300'}`}>
                      Post-ASM Optimized Artifact
                    </div>
                    {postAsmOptimizationResult.success ? (
                      <>
                        <div>Applied patches: {postAsmOptimizationResult.summary?.appliedPatches ?? 0}</div>
                        <div>
                          Dead-block savings: {postAsmOptimizationResult.summary?.deadCandidateLines ?? 0} lines / {postAsmOptimizationResult.summary?.deadCandidateSourceBytes ?? 0} bytes
                        </div>
                        <div>
                          Removed total: {postAsmOptimizationResult.summary?.removedLines ?? 0} lines / {postAsmOptimizationResult.summary?.removedSourceBytes ?? 0} bytes
                        </div>
                        {(postAsmOptimizationResult.summary?.selectedRules?.length || 0) > 0 && (
                          <div className="font-mono text-[11px] text-purple-100">
                            Rules: {postAsmOptimizationResult.summary?.selectedRules?.join(', ')}
                          </div>
                        )}
                        {Object.entries(postAsmOptimizationResult.summary?.ruleMetrics || {})
                          .filter(([, metrics]) => (metrics.removedLines || 0) > 0 || (metrics.patchable || 0) > 0)
                          .map(([ruleId, metrics]) => (
                            <div key={ruleId} className="font-mono text-[11px] text-msx-textprimary">
                              {ruleId}: {metrics.patchable ?? 0} patchable, {metrics.removedLines ?? 0} lines
                            </div>
                          ))}
                        <div>
                          Invariants: {postAsmOptimizationResult.invariantCheck?.ok === false ? 'failed' : 'passed'}
                        </div>
                        <div>{postAsmOptimizationResult.message || 'Optimized ASM generated separately.'}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {postAsmOptimizationResult.optimizedAsmDownloadUrl && (
                            <button
                              onClick={() => {
                                const downloadUrl = buildBackendUrl(postAsmOptimizationResult.optimizedAsmDownloadUrl || '');
                                const link = document.createElement('a');
                                link.href = downloadUrl;
                                link.download = postAsmOptimizationResult.optimizedAsmFile || 'optimized.asm';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded transition-colors"
                            >
                              Download optimized ASM
                            </button>
                          )}
                          {postAsmOptimizationResult.optimizedRomDownloadUrl && (
                            <button
                              onClick={() => {
                                const downloadUrl = buildBackendUrl(postAsmOptimizationResult.optimizedRomDownloadUrl || '');
                                const link = document.createElement('a');
                                link.href = downloadUrl;
                                link.download = postAsmOptimizationResult.optimizedRomFile || 'optimized.rom';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded transition-colors"
                            >
                              Download optimized ROM
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div>{postAsmOptimizationResult.message || postAsmOptimizationResult.details || 'Optimization failed'}</div>
                        {(postAsmOptimizationResult.invariantCheck?.errors || []).map((error, index) => (
                          <div key={`${error.id || 'invariant'}_${index}`} className="mt-1 text-red-200">
                            {error.message || error.id || 'Invariant check failed'}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {asmCompressionResult?.applied && (
                  <div className="p-2 rounded text-xs bg-green-900 bg-opacity-30 border border-green-600 text-msx-textsecondary">
                    <div className="font-semibold text-green-400">ZX0 Compression Applied</div>
                  <div>
                    Screens: {asmCompressionResult?.compressionInfo?.compressedScreens ?? 0}/{asmCompressionResult?.compressionInfo?.candidateScreens ?? 0}
                  </div>
                  <div>
                    Screen block maps: {asmCompressionResult?.compressionInfo?.compressedScreenBlockMaps ?? 0}/{asmCompressionResult?.compressionInfo?.candidateScreenBlockMaps ?? 0}
                  </div>
                  <div>
                    Effects: {asmCompressionResult?.compressionInfo?.compressedEffects ?? 0}/{asmCompressionResult?.compressionInfo?.candidateEffects ?? 0}
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


                {exportType === 'asm_all_in_one' && (
                  <Button
                    onClick={async () => {
                      setIsGenerating(true);
                      try {
                        const bundle = await generateMapperReadyBundle(currentProjectName || 'MSX_Game', buildCurrentRomConfig());
                        const autoCompressedBundle = await maybeAutoCompressMapperReadyBundle(bundle);
                        const finalBundle = autoCompressedBundle.bundle;

                        if (autoCompressedBundle.compressionResult) {
                          setAsmCompressionResult(autoCompressedBundle.compressionResult);
                        }

                        updateGeneratedCode(finalBundle.mainCode);
                        setGeneratedFiles(finalBundle.files);
                        setActiveFileIndex(finalBundle.activeIndex);
                        setLastGeneratedRomConfig(finalBundle.romConfig);

                        const activeFile = finalBundle.files[finalBundle.activeIndex];
                        const mainFileName = activeFile?.name || (finalBundle.modularFiles['unitedFiles.asm'] ? 'unitedFiles.asm' : 'main.asm');
                        const blob = new Blob([finalBundle.mainCode], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = mainFileName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);

                        const zipSuccess = await downloadModularZip(finalBundle.modularFiles, finalBundle.projectName);

                        alert(
                          zipSuccess
                            ? `Modular ASM project generated.\n\nMain file: ${mainFileName}\nZIP: ${finalBundle.projectName.toLowerCase()}_modular_project.zip\n\nReady for glass.jar compile.`
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
              <Panel title="ROM Build Result" className={compilationResult.success ? "border-green-500" : "border-red-500"}>
                <div className="p-3">
                  <div className={`text-sm ${compilationResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    {compilationResult.success
                      ? 'Compilation successful'
                      : (compilationResult as any).resolvedRomConfig?.resolvedRomMode === 'megarom_failed'
                        ? 'MegaROM build failed'
                      : (compilationResult as any).suggestedRomConfig
                        ? 'ROM capacity limit reached'
                        : 'Glass compilation failed'}
                  </div>
                  <div className="hidden">
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

                  {msx2BudgetFeedback && (
                    <div className={`mt-3 p-3 rounded border text-xs ${msx2BudgetStatusClass}`}>
                      <div className="text-sm text-msx-highlight font-semibold">
                        MSX2 MegaROM budget
                      </div>
                      {msx2BudgetFeedbackSource && (
                        <div className="mt-1 text-msx-textsecondary">
                          Source: <strong>{msx2BudgetFeedbackSource}</strong>
                        </div>
                      )}
                      <div className="mt-2 grid grid-cols-2 gap-2 text-msx-textsecondary">
                        <div>
                          ROM: <strong>{msx2BudgetFeedback.project?.romMode}</strong>
                          {', '}mapper=<strong>{msx2BudgetFeedback.project?.mapper}</strong>
                        </div>
                        <div>
                          Pressure: <strong className={msx2BudgetBadgeClass}>{msx2BudgetStatus}</strong>
                        </div>
                        <div>
                          Payload: <strong>{msx2BudgetFeedback.rom?.payloadBytes ?? 0}</strong> bytes
                        </div>
                        <div>
                          RAM free: <strong>{msx2BudgetFeedback.ram?.freeBytes ?? 0}</strong> bytes
                        </div>
                        <div>
                          Core/resident: <strong>{msx2BudgetPressureSummary.residentCoreBytes}</strong> bytes
                        </div>
                        <div>
                          World/content: <strong>{msx2BudgetPressureSummary.worldContentBytes}</strong> bytes
                        </div>
                        {msx2BudgetFeedback.runtimeModules && (
                          <div className="col-span-2">
                            Runtime modules: <strong>{msx2BudgetFeedback.runtimeModules.includedCount ?? 0}</strong>
                            {' '}included ({msx2BudgetFeedback.runtimeModules.residentCount ?? 0} resident,
                            {' '}{msx2BudgetFeedback.runtimeModules.farCodeCount ?? 0} far,
                            {' '}{msx2BudgetFeedback.runtimeModules.worldSpecificCount ?? 0} world)
                          </div>
                        )}
                        {msx2BudgetFeedback.worldBankManifest && (
                          <div className="col-span-2">
                            World Bank Packs: <strong>{msx2BudgetFeedback.worldBankManifest.worldCount ?? 0}</strong>
                            {' '}worlds, <strong>{msx2BudgetFeedback.worldBankManifest.estimatedPhysicalBankCount ?? 0}</strong>
                            {' '}banks @ {msx2BudgetFeedback.worldBankManifest.dataWindowAddress ?? '#A000'}
                            {(msx2BudgetFeedback.worldBankManifest.warningBankCount || msx2BudgetFeedback.worldBankManifest.overBudgetBankCount) ? (
                              <>
                                {' '}({msx2BudgetFeedback.worldBankManifest.warningBankCount ?? 0} warning, {msx2BudgetFeedback.worldBankManifest.overBudgetBankCount ?? 0} over)
                              </>
                            ) : null}
                          </div>
                        )}
                      </div>
                      {Array.isArray(msx2BudgetFeedback.worldPackages) &&
                        msx2BudgetFeedback.worldPackages.length > 0 && (
                          <div className="mt-2 text-msx-textsecondary">
                            Worlds: {msx2BudgetFeedback.worldPackages
                              .slice(0, 3)
                              .map((item: any) => `${item.worldId ?? item.id} ${item.estimatedBytes ?? item.usedBytes ?? 0}b`)
                              .join(', ')}
                          </div>
                        )}
                      {Array.isArray(msx2BudgetFeedback.rom?.bankClassSummary) &&
                        msx2BudgetFeedback.rom.bankClassSummary.length > 0 && (
                          <div className="mt-2 text-msx-textsecondary">
                            Classes: {msx2BudgetFeedback.rom.bankClassSummary
                              .map((item: any) => `${item.id} ${item.usedBytes}b`)
                              .join(', ')}
                          </div>
                        )}
                      {Array.isArray(msx2BudgetFeedback.largestAssets) &&
                        msx2BudgetFeedback.largestAssets.length > 0 && (
                          <div className="mt-1 text-msx-textsecondary">
                            Largest: {msx2BudgetFeedback.largestAssets
                              .slice(0, 3)
                              .map((item: any) => `${item.id} ${item.usedBytes}b`)
                              .join(', ')}
                          </div>
                        )}
                      {Array.isArray(msx2BudgetFeedback.warnings?.warningPackedBanks) &&
                        msx2BudgetFeedback.warnings.warningPackedBanks.length > 0 && (
                          <div className="mt-2 text-yellow-200">
                            Warning banks: {msx2BudgetFeedback.warnings.warningPackedBanks
                              .slice(0, 4)
                              .map((item: any) => `${item.bankId ?? item.id ?? '?'} ${item.usedBytes ?? item.bytes ?? 0}b`)
                              .join(', ')}
                          </div>
                        )}
                      {Array.isArray(msx2BudgetFeedback.suggestedFixes) &&
                        msx2BudgetFeedback.suggestedFixes.length > 0 && (
                          <div className="mt-2 text-yellow-200">
                            Suggested fixes:
                            {msx2BudgetFeedback.suggestedFixes.slice(0, 4).map((fix: any, index: number) => (
                              <div key={`${fix.target || 'fix'}_${index}`} className="font-mono text-[11px] text-yellow-100">
                                {fix.target ? `${fix.target}: ` : ''}{fix.action || fix.reason || 'Review budget'}
                              </div>
                            ))}
                          </div>
                        )}
                      {msx2BudgetResolution && (
                        <div className="mt-3 border-t border-msx-border pt-2 text-msx-textsecondary">
                          <div>
                            Resolution: <strong className={msx2BudgetResolution.status === 'resolved' ? 'text-green-200' : 'text-yellow-200'}>
                              {msx2BudgetResolution.status ?? 'unknown'}
                            </strong>
                            {' '}({msx2BudgetResolutionAttempts.length} attempt{msx2BudgetResolutionAttempts.length === 1 ? '' : 's'})
                          </div>
                          {msx2BudgetResolutionAttempts.slice(-3).map((attempt: any, index: number) => (
                            <div key={`${attempt.action || 'budget'}_${index}`} className="mt-1 font-mono text-[11px] text-msx-textprimary">
                              #{attempt.attempt ?? index}: {attempt.action ?? 'unknown'} {'->'} {attempt.status ?? 'unknown'}
                              {attempt.reason ? ` (${attempt.reason})` : ''}
                              {attempt.failure?.failedGateId ? (
                                <span className="block text-msx-textsecondary">
                                  failed gate: {attempt.failure.failedGateId}
                                  {attempt.failure.worldBankManifest
                                    ? `, world banks ${attempt.failure.worldBankManifest.warningBankCount ?? 0} warning/${attempt.failure.worldBankManifest.overBudgetBankCount ?? 0} over`
                                    : ''}
                                </span>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {(compilationResult as any).resolvedRomConfig?.resolvedRomMode === 'megarom_failed' && (
                    <div className="mt-3 p-3 bg-red-950 bg-opacity-40 rounded border border-red-500">
                      <div className="text-sm text-red-200 font-semibold">
                        MegaROM build stopped before OpenMSX
                      </div>
                      <div className="mt-1 text-xs text-msx-textsecondary">
                        {compilationResult.message || 'Glass could not produce a valid MegaROM image. Check the detailed logs and generated ASM bank layout.'}
                      </div>
                    </div>
                  )}

                  {(compilationResult as any).suggestedRomConfig && (
                    <div className="mt-3 p-3 bg-red-950 bg-opacity-40 rounded border border-red-500">
                      <div className="text-sm text-red-200 font-semibold">
                        ROM mode blocked before OpenMSX
                      </div>
                      <div className="mt-1 text-xs text-msx-textsecondary">
                        {compilationResult.message || (compilationResult as any).suggestedRomConfig.reason || 'The selected ROM mode cannot produce a valid ROM for this build.'}
                      </div>
                      {(compilationResult as any).requestedRomConfig?.romMode === 'plain48k' &&
                        (compilationResult as any).suggestedRomConfig?.romMode === 'megarom' && (
                          <div className="mt-2 text-xs text-red-100">
                            Plain 48KB was already regenerated and checked. It did not fit, so the next valid path is MegaROM.
                          </div>
                        )}
                      {(compilationResult as any).suggestedRomConfig?.validationStatus === 'candidate' && (
                        <div className="mt-2 text-xs text-red-100">
                          Plain 48KB is not guaranteed here. Mideas will regenerate and compile it; if that checked build exceeds 48KB, the valid path is MegaROM.
                        </div>
                      )}
                      <div className="mt-2 text-xs text-msx-textsecondary">
                        Suggested: mode=<strong>{(compilationResult as any).suggestedRomConfig.romMode}</strong>
                        {', '}mapper=<strong>{(compilationResult as any).suggestedRomConfig.mapperActive === false ? 'none' : (compilationResult as any).suggestedRomConfig.targetFormat}</strong>
                        {(compilationResult as any).suggestedRomConfig.romSizeKB && (
                          <>{', '}size=<strong>{(compilationResult as any).suggestedRomConfig.romSizeKB}KB</strong></>
                        )}
                      </div>
                      <button
                        onClick={() => handleSuggestedRomBuild((compilationResult as any).suggestedRomConfig)}
                        disabled={isPipelineBusy}
                        className="mt-3 px-3 py-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs rounded transition-colors"
                      >
                        {(compilationResult as any).suggestedRomConfig.label || 'Generate suggested ROM'}
                      </button>
                    </div>
                  )}

                  {(compilationResult as any).plain48kPage0Info && (
                    <div className="mt-3 p-3 bg-yellow-950 bg-opacity-30 rounded border border-yellow-600">
                      <div className="text-sm text-yellow-100 font-semibold">
                        Plain48K page 0 packing
                      </div>
                      <div className="mt-1 text-xs text-msx-textsecondary">
                        Page 0 is restricted to data groups with safe access routines. A ROM can be under 48KB in raw size and still fail if too much remains in #4000-#BFFF.
                      </div>
                      <div className="mt-2 text-xs text-yellow-100">
                        Used <strong>{(compilationResult as any).plain48kPage0Info.usedBytes ?? '?'}</strong> bytes,
                        remaining <strong>{(compilationResult as any).plain48kPage0Info.remainingBytes ?? '?'}</strong> bytes.
                      </div>
                      <div className="mt-2 text-xs text-msx-textsecondary">
                        Selected: {Array.isArray((compilationResult as any).plain48kPage0Info.selectedGroups) && (compilationResult as any).plain48kPage0Info.selectedGroups.length > 0
                          ? (compilationResult as any).plain48kPage0Info.selectedGroups.map((group: any) => `${group.label} (${group.sizeBytes} bytes)`).join(', ')
                          : 'none'}
                      </div>
                      <div className="mt-1 text-xs text-msx-textsecondary">
                        Skipped: {Array.isArray((compilationResult as any).plain48kPage0Info.skippedGroups) && (compilationResult as any).plain48kPage0Info.skippedGroups.length > 0
                          ? (compilationResult as any).plain48kPage0Info.skippedGroups.map((group: any) => `${group.label} (${group.sizeBytes} bytes)`).join(', ')
                          : 'none'}
                      </div>
                    </div>
                  )}

                  {msx2CompileFailure && (
                    <div className="mt-3 p-3 bg-red-950 bg-opacity-40 rounded border border-red-600">
                      <div className="text-sm text-red-100 font-semibold">
                        MSX2 resident bank overflow
                      </div>
                      <div className="mt-1 text-xs text-red-100">
                        {msx2CompileFailure.reason || 'Resident SCREEN 4 code/data crossed the fixed bank limit before the cold data bank.'}
                      </div>
                      {typeof msx2CompileFailure.overflowBytes === 'number' && (
                        <div className="mt-1 text-xs text-msx-textsecondary">
                          Overflow: <strong>{msx2CompileFailure.overflowBytes}</strong> bytes before `#C000`.
                        </div>
                      )}
                      {msx2CompileFailurePlanB && (
                        <div className="mt-2 text-xs text-msx-textsecondary space-y-1">
                          <div>Plan B: {msx2CompileFailurePlanB.primary}</div>
                          <div>{msx2CompileFailurePlanB.secondary}</div>
                          <div className="text-yellow-200">{msx2CompileFailurePlanB.avoid}</div>
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
                  onChange={(e) => updateGeneratedCode(e.target.value)}
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
