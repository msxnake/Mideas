/**
 * @fileoverview MSX Modular ASM Generator - Main Entry Point
 * Coordinates all ASM file generators
 */

import { ProjectAsset } from '../../types';
import { getMsx2ScreenModeConflictMessage } from '../msx2ProjectProfiles';
import { analyzeProject, ProjectAnalysis } from '../asmTemplateGenerator';
import { GeneratedASMFiles, ProjectSummary } from './types/asmTypes';

// Import all generators
import { generateBIOSFile } from './generators/biosGenerator';
import { generateConstantsFile } from './generators/constantsGenerator';
import { generateVariablesFile } from './generators/variablesGenerator';
import { generateHeaderFile } from './generators/headerGenerator';
import { generateGameFlowFile } from './generators/gameFlowGenerator';
import { generateMainFile } from './generators/mainGenerator';
import { generateMapperFile } from './generators/mapperGenerator';
import { generateResourceManagerFile } from './generators/resourceManagerGenerator';
import { shouldKeepRuntimeBackgroundLayout } from './generators/runtimeLayoutPolicy';
import { generatePatternsFile } from './generators/patternsGenerator';
import { generateColorsFile } from './generators/colorsGenerator';
import { generateUnifiedFile } from './generators/unifiedGenerator';
import { generateSpritesFile } from './generators/spritesGenerator';
import { generateComponentsFile } from './generators/componentsGenerator';
import { generateEntitiesFile } from './generators/entitiesGenerator';
import { generateScreensFile } from './generators/screensGenerator';
import { generateFontFile, getFontRawData } from './generators/fontGenerator';
import { generateHudFile } from './generators/hudGenerator';
import { generateWorldsFile } from './generators/worldGenerator';
import { generateMenusFile } from './generators/menusGenerator';
import { generateStateMachineSystem } from './generators/stateMachineGenerator';
import { generateInterruptFile } from './generators/interruptGenerator';
import { generateSoundFile } from './generators/soundGenerator';
import { generateScrollFile } from './generators/scrollGenerator';
import { generateAnimatedTilesFile } from './generators/animatedTilesGenerator';
import { generateBossesFile } from './generators/bossesGenerator';
import { generatePage0File } from './generators/page0Generator';
import { getMapperWindowConfig } from './generators/mapperWindowUtils';
import { generateMsx2Screen4Files } from './generators/msx2/msx2Screen4Generator';
import { generateMsx2Screen4BitmapRoomFiles } from './generators/msx2/msx2Screen4BitmapRoomGenerator';
import { generateMsx2Screen5PresentationFiles } from './generators/msx2/msx2Screen5PresentationGenerator';
import { buildExecutionPlan } from './planning/executionPlan';
import { validateExecutionPlan } from './planning/executionValidators';
import type { EngineExecutionMode, ExecutionPlan } from './types/executionTypes';

/**
 * MSX Modular Configuration
 */
export type MSXMapperFormat = 'konami' | 'ascii8' | 'ascii16';
export type MSXRomMode = 'auto' | 'simple32k' | 'plain48k' | 'megarom';
export type GraphicsBackend = 'screen2-tilebank' | 'msx2-screen4-pattern' | 'msx2-screen4-bitmap-room' | 'msx2-screen5-presentation';
type LegacyGraphicsBackend = 'msx2-screen5-bitmap' | 'msx2-screen5-tile16';

export interface MSXInterruptConfig {
  enableAudioTask?: boolean;
  enableFrameCounterTask?: boolean;
  enableHardPlayerTick?: boolean;
  enableInputTask?: boolean;
  maxIrqCyclesPerFrame?: number;
  strictIrqValidation?: boolean;
}

export interface MSXModularConfig {
  generateUnified?: boolean;
  targetFormat?: MSXMapperFormat;
  romMode?: MSXRomMode;
  autoMegaROM?: boolean;
  executionMode?: EngineExecutionMode;
  interruptDrivenComponents?: boolean;
  hardwareMode?: 'bios' | 'direct' | 'hybrid'; // Hardware access mode
  optimizeLevel?: 'safe' | 'aggressive'; // Optimization level for direct mode
  interruptConfig?: MSXInterruptConfig;
  screenMode?: string;
  targetGraphicsBackend?: GraphicsBackend | LegacyGraphicsBackend;
}

function resolveExecutionMode(config: MSXModularConfig): EngineExecutionMode {
  if (config.executionMode) {
    return config.executionMode;
  }
  return 'interruptTaskManager';
}

function buildValidatedExecutionPlan(
  analysis: ProjectAnalysis,
  config: MSXModularConfig
): ExecutionPlan {
  const normalizedConfig: MSXModularConfig = {
    ...config,
    executionMode: resolveExecutionMode(config),
  };
  const plan = validateExecutionPlan(buildExecutionPlan(analysis, normalizedConfig), analysis);
  if (plan.diagnostics.errors.length > 0) {
    throw new Error(`Execution plan validation failed:\n${plan.diagnostics.errors.join('\n')}`);
  }
  return plan;
}

function buildRuntimeTrackIndexByAssetId(tracks: any[]): Record<string, number> {
  const psgTracks = (tracks || [])
    .filter((track: any) => (track?.soundChip || 'PSG') === 'PSG')
    .map((track: any) => ({
      ...track,
      soundChip: track?.soundChip || 'PSG'
    }));
  const pt3Tracks = psgTracks.filter((track: any) => track?.playbackBackend === 'external-pt3');
  const runtimeTracks = pt3Tracks.length > 0
    ? pt3Tracks
    : psgTracks.filter((track: any) => track?.playbackBackend !== 'external-pt3');

  return runtimeTracks.reduce((map: Record<string, number>, track: any, index: number) => {
    if (track?.id) {
      map[track.id] = index;
    }
    return map;
  }, {} as Record<string, number>);
}

function hasMsx2BitmapRoomAssets(assets: ProjectAsset[] | undefined): boolean {
  return Array.isArray(assets) && assets.some(asset => asset?.type === 'msx2bitmaproom');
}

function hasMsx2PresentationAssets(assets: ProjectAsset[] | undefined): boolean {
  return Array.isArray(assets) && assets.some(asset => asset?.type === 'msx2presentation');
}

function resolveMsx2GameFlowBackend(assets: ProjectAsset[] | undefined): GraphicsBackend | undefined {
  if (!Array.isArray(assets)) return undefined;
  const flows = assets.filter(asset => asset?.type === 'msx2gameflow');
  const flow = flows.find(asset => asset.name === 'Main MSX2') || flows[0];
  const purpose = (flow?.data as any)?.purpose;
  if (purpose === 'screen4-bitmap-runtime') return 'msx2-screen4-bitmap-room';
  if (purpose === 'screen4-runtime') return 'msx2-screen4-pattern';
  if (purpose === 'screen5-presentation') return 'msx2-screen5-presentation';
  return undefined;
}

function resolveGraphicsBackend(config: MSXModularConfig, assets?: ProjectAsset[]): GraphicsBackend {
  if (config.targetGraphicsBackend === 'msx2-screen5-bitmap' || config.targetGraphicsBackend === 'msx2-screen5-tile16') {
    console.warn(`Legacy ${config.targetGraphicsBackend} backend is deprecated; routing to the SCREEN 4 pattern backend.`);
    return 'msx2-screen4-pattern';
  }
  const msx2GameFlowBackend = resolveMsx2GameFlowBackend(assets);
  if (msx2GameFlowBackend) {
    return msx2GameFlowBackend;
  }
  if (config.targetGraphicsBackend) {
    return config.targetGraphicsBackend;
  }
  if (hasMsx2PresentationAssets(assets)) {
    return 'msx2-screen5-presentation';
  }
  if (hasMsx2BitmapRoomAssets(assets)) {
    return 'msx2-screen4-bitmap-room';
  }
  if (config.screenMode === 'SCREEN 4 (Graphics II)' || config.screenMode === 'SCREEN 5 (Graphics III)') {
    return 'msx2-screen4-pattern';
  }
  return 'screen2-tilebank';
}

/**
 * Convert ProjectSummary to ProjectAnalysis format
 */
function convertSummaryToAnalysis(summary: ProjectSummary): ProjectAnalysis {
  // This function was extracted from the original msxModularGenerator.ts (lines 143-289)
  // It converts the summary format to the analysis format used by generators
  const summaryAssets = summary.assets as any;
  const unwrapSummaryAsset = <T = any>(asset: any): T => {
    if (asset && typeof asset === 'object' && asset.data && typeof asset.data === 'object') {
      return {
        ...asset.data,
        id: asset.data.id || asset.id,
        name: asset.data.name || asset.name,
      } as T;
    }
    return asset as T;
  };
  const unwrapSummaryAssets = <T = any>(items: any[] | undefined): T[] =>
    (Array.isArray(items) ? items : []).map(item => unwrapSummaryAsset<T>(item));

  const sprites = unwrapSummaryAssets(summaryAssets.sprites);
  const msx2Sprites = unwrapSummaryAssets(summaryAssets.msx2Sprites || summaryAssets.msx2sprites);
  const msx2Bitmaps = unwrapSummaryAssets(summaryAssets.msx2Bitmaps || summaryAssets.msx2bitmaps);
  const msx2Screens = unwrapSummaryAssets(summaryAssets.msx2Screens || summaryAssets.msx2screens || summaryAssets.msx2Screen5Screens);
  const msx2BitmapRooms = unwrapSummaryAssets(summaryAssets.msx2BitmapRooms || summaryAssets.msx2bitmaprooms);
  const msx2Presentations = unwrapSummaryAssets(summaryAssets.msx2Presentations || summaryAssets.msx2presentations);
  const msx2GameFlows = unwrapSummaryAssets(summaryAssets.msx2GameFlows || summaryAssets.msx2gameflows);
  const tiles = unwrapSummaryAssets(summaryAssets.tiles);
  const tileBanks = unwrapSummaryAssets(summaryAssets.tileBanks || summaryAssets.tilebanks);
  const screenMaps = unwrapSummaryAssets(summaryAssets.screens || summaryAssets.screenMaps);
  const entities = unwrapSummaryAssets(summaryAssets.entities);
  const components = unwrapSummaryAssets(summaryAssets.components);
  const templates = unwrapSummaryAssets(summaryAssets.templates || summaryAssets.entityTemplates);
  const fonts = unwrapSummaryAssets(summaryAssets.fonts);
  const stateMachines = unwrapSummaryAssets(summaryAssets.stateMachines || summaryAssets.statemachines);
  const worldmaps = unwrapSummaryAssets(summaryAssets.worldMaps || summaryAssets.worldmaps);
  const bosses = unwrapSummaryAssets(summaryAssets.bosses);
  const globalVariables = unwrapSummaryAssets(summaryAssets.globalVariables || summaryAssets.globalvariables);

  const tracks = (summaryAssets.tracks || [])
    .filter((track: any) => (track?.soundChip || 'PSG') === 'PSG')
    .map((track: any) => ({
      ...track,
      soundChip: track?.soundChip || 'PSG'
    }));
  // Keep Game Flow/state-machine track indices aligned with the backend that
  // soundGenerator will actually export: PT3 if any PT3 exists, otherwise
  // serialized PSG tracker tracks.
  const trackIndexByAssetId = buildRuntimeTrackIndexByAssetId(summary.assets.tracks || []);

  const analysis: ProjectAnalysis = {
    hasSprites: sprites.length > 0,
    hasTiles: tiles.length > 0,
    hasScreens: screenMaps.length > 0 || msx2BitmapRooms.length > 0 || msx2Presentations.length > 0,
    hasEntities: entities.length > 0,
    hasComponents: components.length > 0 || entities.some((e: any) => e.components && Object.keys(e.components).length > 0),
    hasGameFlow: !!summary.execution.mainGameFlow,
    hasMenus: (summaryAssets.menus || []).length > 0,
    hasFonts: fonts.length > 0,
    hasECS: entities.length > 0 || components.length > 0,
    hasMultipleScreens: screenMaps.length > 1 || msx2Screens.length > 1 || msx2Presentations.length > 1,
    hasAnimations: sprites.some((s: any) => s.frames && s.frames.length > 1),
    hasCollisions: true, // Default to true for summary
    hasMenuSystem: (summaryAssets.menus || []).length > 0,
    components: components as any[],
    templates: templates as any[],
    entities: entities as any[],
    sprites: sprites as any[],
    msx2Sprites: msx2Sprites as any[],
    msx2Bitmaps: msx2Bitmaps as any[],
    msx2Screens: msx2Screens as any[],
    msx2BitmapRooms: msx2BitmapRooms as any[],
    msx2Presentations: msx2Presentations as any[],
    msx2GameFlows: msx2GameFlows as any[],
    sounds: [],
    tracks: tracks as any[],
    trackIndexByAssetId,
    tiles: tiles as any[],
    tileBanks: tileBanks as any[],
    screens: screenMaps as any[],
    screenMaps: screenMaps as any[],
    bosses: bosses as any[],
    gameFlow: summary.execution.mainGameFlow as any,
    projectName: summary.projectInfo.name,
    customStates: [], // Added missing property
    stateMachines: stateMachines as any[],
    worldmaps,
    fonts,
    globalVariables
  };

  return analysis;
}

/**
 * Generate modular ASM files from project assets
 */
export function generateModularASM(
  projectName: string,
  assets: ProjectAsset[],
  config: MSXModularConfig = {}
): GeneratedASMFiles {
  console.log('🔧 Generating modular ASM files...');

  // Validate inputs
  if (!projectName) {
    console.error('❌ projectName is required');
    throw new Error('projectName is required');
  }

  if (!assets) {
    console.error('❌ assets is undefined or null');
    throw new Error('assets array is required');
  }

  if (!Array.isArray(assets)) {
    console.error('❌ assets is not an array');
    throw new Error('assets must be an array');
  }

  console.log(`📊 Project: ${projectName}, Assets: ${assets.length}, Config:`, config);

  // One ROM = one MSX2 graphics mode. Block export of projects that mix tile SCREEN 4 screens
  // and bitmap SCREEN 5 rooms before any backend is selected (the selector would otherwise pick
  // one mode and silently drop the other set of screens).
  const screenModeConflict = getMsx2ScreenModeConflictMessage(assets);
  if (screenModeConflict) {
    console.error('❌', screenModeConflict);
    throw new Error(screenModeConflict);
  }

  const targetGraphicsBackend = resolveGraphicsBackend(config, assets);
  if (targetGraphicsBackend === 'msx2-screen5-presentation') {
    const analysis = analyzeProject(projectName, assets);
    return generateMsx2Screen5PresentationFiles(projectName, analysis, {
      screenMode: 'SCREEN 5 (Graphics III)',
      romMode: config.romMode || 'simple32k',
      targetFormat: config.targetFormat || 'konami',
      autoMegaROM: config.autoMegaROM ?? false,
    });
  }
  if (targetGraphicsBackend === 'msx2-screen4-bitmap-room') {
    const analysis = analyzeProject(projectName, assets);
    return generateMsx2Screen4BitmapRoomFiles(projectName, analysis, {
      screenMode: 'SCREEN 4 (Graphics II)',
      romMode: config.romMode || 'simple32k',
      targetFormat: config.targetFormat || 'konami',
      autoMegaROM: config.autoMegaROM ?? false,
    });
  }
  if (targetGraphicsBackend === 'msx2-screen4-pattern') {
    const analysis = analyzeProject(projectName, assets);
    return generateMsx2Screen4Files(projectName, analysis, {
      screenMode: config.screenMode === 'SCREEN 5 (Graphics III)' ? 'SCREEN 5 (Graphics III)' : 'SCREEN 4 (Graphics II)',
      romMode: config.romMode || 'simple32k',
      targetFormat: config.targetFormat || 'konami',
      autoMegaROM: config.autoMegaROM ?? false,
    });
  }

  // Analyze project
  let analysis: ProjectAnalysis;
  try {
    analysis = analyzeProject(projectName, assets);
    console.log(`🔍 Analysis complete: ${analysis.sprites.length} sprites, ${analysis.tiles.length} tiles`);
  } catch (error) {
    console.error('❌ Error analyzing project:', error);
    // Fallback to empty analysis
    analysis = {
      hasSprites: false,
      hasTiles: false,
      hasScreens: false,
      hasEntities: false,
      hasComponents: false,
      hasGameFlow: false,
      hasMenus: false,
      hasFonts: false,
      hasECS: false,
      hasMultipleScreens: false,
      hasAnimations: false,
      hasCollisions: false,
      hasMenuSystem: false,
      components: [],
      templates: [],
      entities: [],
      sprites: [],
      msx2Sprites: [],
      msx2Bitmaps: [],
      msx2Screens: [],
      msx2BitmapRooms: [],
      msx2Presentations: [],
      sounds: [],
      tracks: [],
      trackIndexByAssetId: {},
      tiles: [],
      tileBanks: [],
      screens: [],
      screenMaps: [],
      bosses: [],
      projectName: projectName,
      customStates: [],
      stateMachines: [],
      globalVariables: []
    };
    console.log('🔄 Using fallback empty analysis');
  }

  const interruptDrivenComponents = config.interruptDrivenComponents ?? true;
  const hardwareMode = config.hardwareMode || 'hybrid'; // Default to hybrid mode
  const optimizeLevel = config.optimizeLevel || 'safe';
  const targetFormat: MSXMapperFormat = config.targetFormat || 'konami';
  const romMode: MSXRomMode = config.romMode || 'simple32k';
  const autoMegaROM = config.autoMegaROM ?? false;
  const executionPlan = buildValidatedExecutionPlan(analysis, config);
  const mapperWindow = getMapperWindowConfig(romMode, targetFormat);
  const keepRuntimeBackgroundLayout = shouldKeepRuntimeBackgroundLayout(analysis);
  const hasHardPlayerTickScreenRuntime = (analysis.screenMaps?.length || 0) > 0;
  const hardPlayerTickEnabled = (config.interruptConfig?.enableHardPlayerTick ?? false)
    && hasHardPlayerTickScreenRuntime
    && !(romMode === 'megarom' && targetFormat === 'ascii16');

  // Generate individual files
  console.log('📝 [MSX GENERATOR] Generating all ASM files...');
  console.log(`🔧 Hardware Mode: ${hardwareMode.toUpperCase()}, Optimize: ${optimizeLevel}`);
  console.log(`[MSX GENERATOR] ROM config: mode=${romMode}, mapper=${targetFormat}, autoMegaROM=${autoMegaROM}`);

  // For plain48k ROMs, move font data to page 0 to free space in the main ROM window
  const hasMenus = analysis.gameFlow?.nodes?.some((node: any) => node.type === 'SubMenu' || node.type === 'Controls');
  const hasGameFlowText = analysis.gameFlow?.nodes?.some((node: any) =>
    node.type === 'Text' || node.type === 'TextScroll' || node.type === 'TextScrollColor' || node.type === 'TextScroll2'
  );
  const hasText = analysis.screenMaps?.some((screen: any) =>
    (screen.layers as any)?.text || (screen as any).textElements?.length > 0
  );
  const hasDialogue = analysis.dialogues?.some((dialogue: any) =>
    Array.isArray(dialogue?.lines) && dialogue.lines.some((line: any) => String(line?.text || '').length > 0)
  );
  const hasHudElements = analysis.screenMaps?.some((screen: any) =>
    screen.hudConfiguration?.elements && screen.hudConfiguration.elements.length > 0
  );
  const needsFont = !!(hasMenus || hasGameFlowText || hasText || hasHudElements || hasDialogue);
  const fontInPage0 = romMode === 'plain48k' && needsFont;
  const fontInBank4 = romMode === 'megarom' && needsFont;
  const fontRawData = fontInPage0 ? getFontRawData(analysis) : undefined;

  const files: GeneratedASMFiles = {
    'page0.asm': generatePage0File(analysis, romMode, fontRawData),
    'bios.asm': generateBIOSFile({ hardwareMode: { mode: hardwareMode, optimizeLevel } }),
    'constants.asm': generateConstantsFile(analysis),
    'variables.asm': generateVariablesFile(analysis, romMode),
    'mapper.asm': generateMapperFile({ targetFormat, romMode, autoMegaROM }),
    'resource_ids.asm': '; Resource ids are emitted by the unified MegaROM backend when available.\nRESOURCE_ID_INVALID EQU #FF\n',
    'resource_table.asm': '; Resource table is emitted by the unified MegaROM backend when available.\nRESOURCE_TABLE_ENTRY_SIZE EQU 8\nRESOURCE_TABLE_COUNT EQU 0\nresource_table:\n',
    'resource_manager.asm': generateResourceManagerFile(mapperWindow, { keepRuntimeBackgroundLayout }),
    'interrupt.asm': generateInterruptFile(
      analysis,
      { interruptDrivenComponents, romMode, hardPlayerTickEnabled },
      executionPlan
    ),
    'header.asm': generateHeaderFile(projectName, analysis, executionPlan, romMode, targetFormat),
    'patterns.asm': generatePatternsFile(analysis, romMode, romMode === 'megarom', targetFormat),
    'colors.asm': generateColorsFile(analysis, romMode, romMode === 'megarom', targetFormat),
    'components.asm': (interruptDrivenComponents && romMode !== 'megarom')
      ? '; Components are generated inside interrupt.asm (interruptDrivenComponents=true)\n'
      : generateComponentsFile(analysis, romMode, targetFormat),
    'entities.asm': generateEntitiesFile(analysis),
    'worlds.asm': generateWorldsFile(analysis, romMode),
    'screens.asm': generateScreensFile(analysis, romMode, romMode === 'megarom', targetFormat),
    'sprites.asm': generateSpritesFile(analysis, romMode, romMode === 'megarom', targetFormat),
    'font.asm': generateFontFile(analysis, romMode, fontInPage0, fontInBank4, targetFormat),
    'hud.asm': generateHudFile(analysis),
    'menus.asm': generateMenusFile(analysis),
    'sound.asm': generateSoundFile(analysis, executionPlan, romMode),
    'scroll.asm': generateScrollFile(analysis),
    'animtiles.asm': generateAnimatedTilesFile(analysis, romMode, targetFormat),
    'bosses.asm': generateBossesFile(analysis, { includeBossData: romMode !== 'megarom' }),
    'statemachine.asm': analysis.stateMachines && analysis.stateMachines.length > 0
      ? generateStateMachineSystem(analysis.stateMachines, analysis.globalVariables, analysis.sprites, analysis.tiles, (analysis as any).templates, (analysis as any).sounds, (analysis as any).trackIndexByAssetId, romMode, targetFormat, (analysis as any).entities)
      : '; No State Machines\n',
    'gameflow.asm': generateGameFlowFile(analysis, executionPlan, romMode),
    'main.asm': generateMainFile(projectName, analysis, romMode),
    'unitedFiles.asm': ''
  };

  // Generate unified file if requested
  if (config.generateUnified) {
    files['unitedFiles.asm'] = generateUnifiedFile(files, projectName, analysis, executionPlan, {
      romMode,
      targetFormat,
      autoMegaROM
    });
  }

  console.log('✅ Modular ASM files generated successfully!');
  console.log(`📊 Generated ${Object.keys(files).filter(k => files[k as keyof GeneratedASMFiles]).length} files`);
  console.log('📋 [DEBUG] Files generated:', Object.keys(files));
  console.log('🎯 [DEBUG] interrupt.asm length:', files['interrupt.asm']?.length || 'MISSING!');

  return files;
}

/**
 * Generate modular ASM files from project summary
 */
export function generateModularASMFromSummary(
  summary: ProjectSummary,
  config: MSXModularConfig = {}
): GeneratedASMFiles {
  console.log('🔧 Generating modular ASM files from summary...');
  console.log(`📊 Summary: ${summary.projectInfo.name}`);

  // Validate summary
  if (!summary.projectInfo?.name) {
    throw new Error('Summary must contain valid projectInfo.name');
  }

  if (!summary.assets) {
    throw new Error('Summary must contain assets section');
  }

  // Convert summary to analysis format
  let analysis: ProjectAnalysis;
  try {
    analysis = convertSummaryToAnalysis(summary);
    console.log(`🔍 Analysis from summary: ${analysis.sprites.length} sprites, ${analysis.tiles.length} tiles`);
  } catch (error) {
    console.error('❌ Error converting summary:', error);
    throw error;
  }

  const summaryGraphicsConfig: MSXModularConfig = {
    ...config,
    screenMode: config.screenMode || (summary as any).screenMode || (summary as any).currentScreenMode,
    targetGraphicsBackend: config.targetGraphicsBackend || (summary as any).targetGraphicsBackend,
  };
  const summaryAssetList = [
    ...((summary.assets as any).msx2BitmapRooms || []).map((data: any) => ({ type: 'msx2bitmaproom', data } as ProjectAsset)),
    ...((summary.assets as any).msx2bitmaprooms || []).map((data: any) => ({ type: 'msx2bitmaproom', data } as ProjectAsset)),
    ...((summary.assets as any).msx2Presentations || []).map((data: any) => ({ type: 'msx2presentation', data } as ProjectAsset)),
    ...((summary.assets as any).msx2presentations || []).map((data: any) => ({ type: 'msx2presentation', data } as ProjectAsset)),
  ];
  const summaryGraphicsBackend = resolveGraphicsBackend(summaryGraphicsConfig, summaryAssetList);
  if (summaryGraphicsBackend === 'msx2-screen5-presentation') {
    return generateMsx2Screen5PresentationFiles(summary.projectInfo.name, analysis, {
      screenMode: 'SCREEN 5 (Graphics III)',
      romMode: summaryGraphicsConfig.romMode || 'simple32k',
      targetFormat: summaryGraphicsConfig.targetFormat || 'konami',
      autoMegaROM: summaryGraphicsConfig.autoMegaROM ?? false,
    });
  }
  if (summaryGraphicsBackend === 'msx2-screen4-bitmap-room') {
    return generateMsx2Screen4BitmapRoomFiles(summary.projectInfo.name, analysis, {
      screenMode: 'SCREEN 4 (Graphics II)',
      romMode: summaryGraphicsConfig.romMode || 'simple32k',
      targetFormat: summaryGraphicsConfig.targetFormat || 'konami',
      autoMegaROM: summaryGraphicsConfig.autoMegaROM ?? false,
    });
  }
  if (summaryGraphicsBackend === 'msx2-screen4-pattern') {
    return generateMsx2Screen4Files(summary.projectInfo.name, analysis, {
      screenMode: summaryGraphicsConfig.screenMode === 'SCREEN 5 (Graphics III)' ? 'SCREEN 5 (Graphics III)' : 'SCREEN 4 (Graphics II)',
      romMode: summaryGraphicsConfig.romMode || 'simple32k',
      targetFormat: summaryGraphicsConfig.targetFormat || 'konami',
      autoMegaROM: summaryGraphicsConfig.autoMegaROM ?? false,
    });
  }

  const interruptDrivenComponents = config.interruptDrivenComponents ?? true;
  const hardwareMode = config.hardwareMode || 'hybrid'; // Default to hybrid mode
  const optimizeLevel = config.optimizeLevel || 'safe';

  console.log(`🔧 Hardware Mode: ${hardwareMode.toUpperCase()}, Optimize: ${optimizeLevel}`);

  const targetFormat: MSXMapperFormat = config.targetFormat || 'konami';
  const romMode: MSXRomMode = config.romMode || 'simple32k';
  const autoMegaROM = config.autoMegaROM ?? false;
  const executionPlan = buildValidatedExecutionPlan(analysis, config);
  const mapperWindow = getMapperWindowConfig(romMode, targetFormat);
  const hasHardPlayerTickScreenRuntime = (analysis.screenMaps?.length || 0) > 0;
  const hardPlayerTickEnabled = (config.interruptConfig?.enableHardPlayerTick ?? false)
    && hasHardPlayerTickScreenRuntime
    && !(romMode === 'megarom' && targetFormat === 'ascii16');

  console.log(`[MSX GENERATOR] ROM config: mode=${romMode}, mapper=${targetFormat}, autoMegaROM=${autoMegaROM}`);

  // For plain48k ROMs, move font data to page 0 to free space in the main ROM window
  const hasMenus2 = analysis.gameFlow?.nodes?.some((node: any) => node.type === 'SubMenu' || node.type === 'Controls');
  const hasGameFlowText2 = analysis.gameFlow?.nodes?.some((node: any) =>
    node.type === 'Text' || node.type === 'TextScroll' || node.type === 'TextScrollColor' || node.type === 'TextScroll2'
  );
  const hasText2 = analysis.screenMaps?.some((screen: any) =>
    (screen.layers as any)?.text || (screen as any).textElements?.length > 0
  );
  const hasDialogue2 = analysis.dialogues?.some((dialogue: any) =>
    Array.isArray(dialogue?.lines) && dialogue.lines.some((line: any) => String(line?.text || '').length > 0)
  );
  const hasHudElements2 = analysis.screenMaps?.some((screen: any) =>
    screen.hudConfiguration?.elements && screen.hudConfiguration.elements.length > 0
  );
  const needsFont2 = !!(hasMenus2 || hasGameFlowText2 || hasText2 || hasHudElements2 || hasDialogue2);
  const fontInPage02 = romMode === 'plain48k' && needsFont2;
  const fontInBank42 = romMode === 'megarom' && needsFont2;
  const fontRawData2 = fontInPage02 ? getFontRawData(analysis) : undefined;

  // Generate files using same logic as generateModularASM
  const keepRuntimeBackgroundLayout2 = shouldKeepRuntimeBackgroundLayout(analysis);

  const files: GeneratedASMFiles = {
    'page0.asm': generatePage0File(analysis, romMode, fontRawData2),
    'bios.asm': generateBIOSFile({ hardwareMode: { mode: hardwareMode, optimizeLevel } }),
    'constants.asm': generateConstantsFile(analysis),
    'variables.asm': generateVariablesFile(analysis, romMode),
    'mapper.asm': generateMapperFile({ targetFormat, romMode, autoMegaROM }),
    'resource_ids.asm': '; Resource ids are emitted by the unified MegaROM backend when available.\nRESOURCE_ID_INVALID EQU #FF\n',
    'resource_table.asm': '; Resource table is emitted by the unified MegaROM backend when available.\nRESOURCE_TABLE_ENTRY_SIZE EQU 8\nRESOURCE_TABLE_COUNT EQU 0\nresource_table:\n',
    'resource_manager.asm': generateResourceManagerFile(mapperWindow, { keepRuntimeBackgroundLayout: keepRuntimeBackgroundLayout2 }),
    'interrupt.asm': generateInterruptFile(
      analysis,
      { interruptDrivenComponents, romMode, hardPlayerTickEnabled },
      executionPlan
    ),
    'header.asm': generateHeaderFile(summary.projectInfo.name, analysis, executionPlan, romMode, targetFormat),
    'patterns.asm': generatePatternsFile(analysis, romMode, romMode === 'megarom', targetFormat),
    'colors.asm': generateColorsFile(analysis, romMode, romMode === 'megarom', targetFormat),
    'components.asm': (interruptDrivenComponents && romMode !== 'megarom')
      ? '; Components are generated inside interrupt.asm (interruptDrivenComponents=true)\n'
      : generateComponentsFile(analysis, romMode, targetFormat),
    'entities.asm': generateEntitiesFile(analysis),
    'worlds.asm': generateWorldsFile(analysis, romMode),
    'screens.asm': generateScreensFile(analysis, romMode, romMode === 'megarom', targetFormat),
    'sprites.asm': generateSpritesFile(analysis, romMode, romMode === 'megarom', targetFormat),
    'font.asm': generateFontFile(analysis, romMode, fontInPage02, fontInBank42, targetFormat),
    'hud.asm': generateHudFile(analysis),
    'menus.asm': generateMenusFile(analysis),
    'sound.asm': generateSoundFile(analysis, executionPlan, romMode),
    'scroll.asm': generateScrollFile(analysis),
    'animtiles.asm': generateAnimatedTilesFile(analysis, romMode, targetFormat),
    'bosses.asm': generateBossesFile(analysis, { includeBossData: romMode !== 'megarom' }),
    'statemachine.asm': analysis.stateMachines && analysis.stateMachines.length > 0
      ? generateStateMachineSystem(analysis.stateMachines, analysis.globalVariables, analysis.sprites, analysis.tiles, (analysis as any).templates, (analysis as any).sounds, (analysis as any).trackIndexByAssetId, romMode, targetFormat, (analysis as any).entities)
      : '; No State Machines\n',
    'gameflow.asm': generateGameFlowFile(analysis, executionPlan, romMode),
    'main.asm': generateMainFile(summary.projectInfo.name, analysis, romMode),
    'unitedFiles.asm': ''
  };

  // Generate unified file if requested
  if (config.generateUnified) {
    files['unitedFiles.asm'] = generateUnifiedFile(files, summary.projectInfo.name, analysis, executionPlan, {
      romMode,
      targetFormat,
      autoMegaROM
    });
  }

  console.log('✅ Modular ASM files from summary generated successfully!');
  return files;
}

// Re-export types for convenience
export type { GeneratedASMFiles, ProjectSummary, ProjectAnalysis };
