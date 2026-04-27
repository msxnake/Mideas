/**
 * @fileoverview MSX Modular ASM Generator - Main Entry Point
 * Coordinates all ASM file generators
 */

import { ProjectAsset } from '../../types';
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
import { generatePage0File } from './generators/page0Generator';
import { getMapperWindowConfig } from './generators/mapperWindowUtils';
import { buildExecutionPlan } from './planning/executionPlan';
import { validateExecutionPlan } from './planning/executionValidators';
import type { EngineExecutionMode, ExecutionPlan } from './types/executionTypes';

/**
 * MSX Modular Configuration
 */
export type MSXMapperFormat = 'konami' | 'ascii8' | 'ascii16';
export type MSXRomMode = 'auto' | 'simple32k' | 'plain48k' | 'megarom';

export interface MSXInterruptConfig {
  enableAudioTask?: boolean;
  enableFrameCounterTask?: boolean;
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

/**
 * Convert ProjectSummary to ProjectAnalysis format
 */
function convertSummaryToAnalysis(summary: ProjectSummary): ProjectAnalysis {
  // This function was extracted from the original msxModularGenerator.ts (lines 143-289)
  // It converts the summary format to the analysis format used by generators
  const tracks = (summary.assets.tracks || [])
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
    hasSprites: summary.assets.sprites.length > 0,
    hasTiles: summary.assets.tiles.length > 0,
    hasScreens: summary.assets.screens.length > 0,
    hasEntities: summary.assets.entities.length > 0,
    hasComponents: summary.assets.entities.some(e => e.components && Object.keys(e.components).length > 0),
    hasGameFlow: !!summary.execution.mainGameFlow,
    hasMenus: summary.assets.menus.length > 0,
    hasFonts: summary.assets.fonts.length > 0,
    hasECS: summary.assets.entities.length > 0, // Simplified check
    hasMultipleScreens: summary.assets.screens.length > 1,
    hasAnimations: summary.assets.sprites.some(s => s.frames && s.frames.length > 1),
    hasCollisions: true, // Default to true for summary
    hasMenuSystem: summary.assets.menus.length > 0,
    components: [],
    templates: [], // Added missing property
    entities: summary.assets.entities as any[],
    sprites: summary.assets.sprites as any[],
    sounds: [],
    tracks: tracks as any[],
    trackIndexByAssetId,
    tiles: summary.assets.tiles as any[],
    tileBanks: [],
    screens: summary.assets.screens as any[], // Added alias
    screenMaps: summary.assets.screens as any[], // Added missing property
    gameFlow: summary.execution.mainGameFlow as any,
    projectName: summary.projectInfo.name,
    customStates: [], // Added missing property
    stateMachines: [], // Added missing property
    globalVariables: []
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
      sounds: [],
      tracks: [],
      trackIndexByAssetId: {},
      tiles: [],
      tileBanks: [],
      screens: [],
      screenMaps: [],
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

  // Generate individual files
  console.log('📝 [MSX GENERATOR] Generating all ASM files...');
  console.log(`🔧 Hardware Mode: ${hardwareMode.toUpperCase()}, Optimize: ${optimizeLevel}`);
  console.log(`[MSX GENERATOR] ROM config: mode=${romMode}, mapper=${targetFormat}, autoMegaROM=${autoMegaROM}`);

  // For plain48k ROMs, move font data to page 0 to free space in the main ROM window
  const hasMenus = analysis.gameFlow?.nodes?.some((node: any) => node.type === 'SubMenu');
  const hasText = analysis.screenMaps?.some((screen: any) =>
    (screen.layers as any)?.text || (screen as any).textElements?.length > 0
  );
  const hasDialogue = analysis.dialogues?.some((dialogue: any) =>
    Array.isArray(dialogue?.lines) && dialogue.lines.some((line: any) => String(line?.text || '').length > 0)
  );
  const hasHudElements = analysis.screenMaps?.some((screen: any) =>
    screen.hudConfiguration?.elements && screen.hudConfiguration.elements.length > 0
  );
  const needsFont = !!(hasMenus || hasText || hasHudElements || hasDialogue);
  const fontInPage0 = romMode === 'plain48k' && needsFont;
  const fontInBank4 = romMode === 'megarom' && needsFont;
  const fontRawData = fontInPage0 ? getFontRawData(analysis) : undefined;

  const files: GeneratedASMFiles = {
    'page0.asm': generatePage0File(analysis, romMode, fontRawData),
    'bios.asm': generateBIOSFile({ hardwareMode: { mode: hardwareMode, optimizeLevel } }),
    'constants.asm': generateConstantsFile(analysis),
    'variables.asm': generateVariablesFile(analysis),
    'mapper.asm': generateMapperFile({ targetFormat, romMode, autoMegaROM }),
    'resource_ids.asm': '; Resource ids are emitted by the unified MegaROM backend when available.\nRESOURCE_ID_INVALID EQU #FF\n',
    'resource_table.asm': '; Resource table is emitted by the unified MegaROM backend when available.\nRESOURCE_TABLE_ENTRY_SIZE EQU 8\nRESOURCE_TABLE_COUNT EQU 0\nresource_table:\n',
    'resource_manager.asm': generateResourceManagerFile(mapperWindow),
    'interrupt.asm': generateInterruptFile(analysis, { interruptDrivenComponents, romMode }, executionPlan),
    'header.asm': generateHeaderFile(projectName, analysis, executionPlan, romMode),
    'patterns.asm': generatePatternsFile(analysis, romMode, romMode === 'megarom', targetFormat),
    'colors.asm': generateColorsFile(analysis, romMode, romMode === 'megarom', targetFormat),
    'components.asm': (interruptDrivenComponents && romMode !== 'megarom')
      ? '; Components are generated inside interrupt.asm (interruptDrivenComponents=true)\n'
      : generateComponentsFile(analysis, romMode),
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
    'statemachine.asm': analysis.stateMachines && analysis.stateMachines.length > 0
      ? generateStateMachineSystem(analysis.stateMachines, analysis.globalVariables, analysis.sprites, analysis.tiles, (analysis as any).templates, (analysis as any).sounds, (analysis as any).trackIndexByAssetId, romMode)
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

  const interruptDrivenComponents = config.interruptDrivenComponents ?? true;
  const hardwareMode = config.hardwareMode || 'hybrid'; // Default to hybrid mode
  const optimizeLevel = config.optimizeLevel || 'safe';

  console.log(`🔧 Hardware Mode: ${hardwareMode.toUpperCase()}, Optimize: ${optimizeLevel}`);

  const targetFormat: MSXMapperFormat = config.targetFormat || 'konami';
  const romMode: MSXRomMode = config.romMode || 'simple32k';
  const autoMegaROM = config.autoMegaROM ?? false;
  const executionPlan = buildValidatedExecutionPlan(analysis, config);
  const mapperWindow = getMapperWindowConfig(romMode, targetFormat);

  console.log(`[MSX GENERATOR] ROM config: mode=${romMode}, mapper=${targetFormat}, autoMegaROM=${autoMegaROM}`);

  // For plain48k ROMs, move font data to page 0 to free space in the main ROM window
  const hasMenus2 = analysis.gameFlow?.nodes?.some((node: any) => node.type === 'SubMenu');
  const hasText2 = analysis.screenMaps?.some((screen: any) =>
    (screen.layers as any)?.text || (screen as any).textElements?.length > 0
  );
  const hasDialogue2 = analysis.dialogues?.some((dialogue: any) =>
    Array.isArray(dialogue?.lines) && dialogue.lines.some((line: any) => String(line?.text || '').length > 0)
  );
  const hasHudElements2 = analysis.screenMaps?.some((screen: any) =>
    screen.hudConfiguration?.elements && screen.hudConfiguration.elements.length > 0
  );
  const needsFont2 = !!(hasMenus2 || hasText2 || hasHudElements2 || hasDialogue2);
  const fontInPage02 = romMode === 'plain48k' && needsFont2;
  const fontInBank42 = romMode === 'megarom' && needsFont2;
  const fontRawData2 = fontInPage02 ? getFontRawData(analysis) : undefined;

  // Generate files using same logic as generateModularASM
  const files: GeneratedASMFiles = {
    'page0.asm': generatePage0File(analysis, romMode, fontRawData2),
    'bios.asm': generateBIOSFile({ hardwareMode: { mode: hardwareMode, optimizeLevel } }),
    'constants.asm': generateConstantsFile(analysis),
    'variables.asm': generateVariablesFile(analysis),
    'mapper.asm': generateMapperFile({ targetFormat, romMode, autoMegaROM }),
    'resource_ids.asm': '; Resource ids are emitted by the unified MegaROM backend when available.\nRESOURCE_ID_INVALID EQU #FF\n',
    'resource_table.asm': '; Resource table is emitted by the unified MegaROM backend when available.\nRESOURCE_TABLE_ENTRY_SIZE EQU 8\nRESOURCE_TABLE_COUNT EQU 0\nresource_table:\n',
    'resource_manager.asm': generateResourceManagerFile(mapperWindow),
    'interrupt.asm': generateInterruptFile(analysis, { interruptDrivenComponents, romMode }, executionPlan),
    'header.asm': generateHeaderFile(summary.projectInfo.name, analysis, executionPlan, romMode),
    'patterns.asm': generatePatternsFile(analysis, romMode, romMode === 'megarom', targetFormat),
    'colors.asm': generateColorsFile(analysis, romMode, romMode === 'megarom', targetFormat),
    'components.asm': (interruptDrivenComponents && romMode !== 'megarom')
      ? '; Components are generated inside interrupt.asm (interruptDrivenComponents=true)\n'
      : generateComponentsFile(analysis, romMode),
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
    'statemachine.asm': analysis.stateMachines && analysis.stateMachines.length > 0
      ? generateStateMachineSystem(analysis.stateMachines, analysis.globalVariables, analysis.sprites, analysis.tiles, (analysis as any).templates, (analysis as any).sounds, (analysis as any).trackIndexByAssetId, romMode)
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
