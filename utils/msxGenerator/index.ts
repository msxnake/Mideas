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
  // Only external-pt3 tracks are in music_pt3_track_table (soundGenerator uses same filter).
  // Indexing all PSG tracks would produce wrong table offsets when non-pt3 tracks exist.
  let pt3TrackIndex = 0;
  const trackIndexByAssetId = tracks.reduce((map: Record<string, number>, track: any) => {
    if (track?.id && track?.playbackBackend === 'external-pt3') {
      map[track.id] = pt3TrackIndex++;
    }
    return map;
  }, {} as Record<string, number>);

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

  // Generate individual files
  console.log('📝 [MSX GENERATOR] Generating all ASM files...');
  console.log(`🔧 Hardware Mode: ${hardwareMode.toUpperCase()}, Optimize: ${optimizeLevel}`);
  console.log(`[MSX GENERATOR] ROM config: mode=${romMode}, mapper=${targetFormat}, autoMegaROM=${autoMegaROM}`);

  // For plain48k ROMs, move font data to page 0 to free space in the main ROM window
  const hasMenus = analysis.gameFlow?.nodes?.some((node: any) => node.type === 'SubMenu');
  const hasText = analysis.screenMaps?.some((screen: any) =>
    (screen.layers as any)?.text || (screen as any).textElements?.length > 0
  );
  const hasHudElements = analysis.screenMaps?.some((screen: any) =>
    screen.hudConfiguration?.elements && screen.hudConfiguration.elements.length > 0
  );
  const needsFont = !!(hasMenus || hasText || hasHudElements);
  const fontInPage0 = romMode === 'plain48k' && needsFont;
  const fontRawData = fontInPage0 ? getFontRawData(analysis) : undefined;

  const files: GeneratedASMFiles = {
    'page0.asm': generatePage0File(analysis, romMode, fontRawData),
    'bios.asm': generateBIOSFile({ hardwareMode: { mode: hardwareMode, optimizeLevel } }),
    'constants.asm': generateConstantsFile(analysis),
    'variables.asm': generateVariablesFile(analysis),
    'mapper.asm': generateMapperFile({ targetFormat, romMode, autoMegaROM }),
    'interrupt.asm': generateInterruptFile(analysis, { interruptDrivenComponents, romMode }, executionPlan),
    'header.asm': generateHeaderFile(projectName, analysis, executionPlan, romMode),
    'patterns.asm': generatePatternsFile(analysis, romMode),
    'colors.asm': generateColorsFile(analysis, romMode),
    'components.asm': interruptDrivenComponents
      ? '; Components are generated inside interrupt.asm (interruptDrivenComponents=true)\n'
      : generateComponentsFile(analysis, romMode),
    'entities.asm': generateEntitiesFile(analysis),
    'worlds.asm': generateWorldsFile(analysis),
    'screens.asm': generateScreensFile(analysis, romMode),
    'sprites.asm': generateSpritesFile(analysis, romMode),
    'font.asm': generateFontFile(analysis, romMode, fontInPage0),
    'hud.asm': generateHudFile(analysis),
    'menus.asm': generateMenusFile(analysis),
    'sound.asm': generateSoundFile(analysis, executionPlan),
    'scroll.asm': generateScrollFile(analysis),
    'animtiles.asm': generateAnimatedTilesFile(analysis, romMode),
    'statemachine.asm': analysis.stateMachines && analysis.stateMachines.length > 0
      ? generateStateMachineSystem(analysis.stateMachines, analysis.globalVariables, analysis.sprites, analysis.tiles, (analysis as any).templates, (analysis as any).sounds, (analysis as any).trackIndexByAssetId, romMode)
      : '; No State Machines\n',
    'gameflow.asm': generateGameFlowFile(analysis, executionPlan),
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

  console.log(`[MSX GENERATOR] ROM config: mode=${romMode}, mapper=${targetFormat}, autoMegaROM=${autoMegaROM}`);

  // For plain48k ROMs, move font data to page 0 to free space in the main ROM window
  const hasMenus2 = analysis.gameFlow?.nodes?.some((node: any) => node.type === 'SubMenu');
  const hasText2 = analysis.screenMaps?.some((screen: any) =>
    (screen.layers as any)?.text || (screen as any).textElements?.length > 0
  );
  const hasHudElements2 = analysis.screenMaps?.some((screen: any) =>
    screen.hudConfiguration?.elements && screen.hudConfiguration.elements.length > 0
  );
  const needsFont2 = !!(hasMenus2 || hasText2 || hasHudElements2);
  const fontInPage02 = romMode === 'plain48k' && needsFont2;
  const fontRawData2 = fontInPage02 ? getFontRawData(analysis) : undefined;

  // Generate files using same logic as generateModularASM
  const files: GeneratedASMFiles = {
    'page0.asm': generatePage0File(analysis, romMode, fontRawData2),
    'bios.asm': generateBIOSFile({ hardwareMode: { mode: hardwareMode, optimizeLevel } }),
    'constants.asm': generateConstantsFile(analysis),
    'variables.asm': generateVariablesFile(analysis),
    'mapper.asm': generateMapperFile({ targetFormat, romMode, autoMegaROM }),
    'interrupt.asm': generateInterruptFile(analysis, { interruptDrivenComponents, romMode }, executionPlan),
    'header.asm': generateHeaderFile(summary.projectInfo.name, analysis, executionPlan, romMode),
    'patterns.asm': generatePatternsFile(analysis, romMode),
    'colors.asm': generateColorsFile(analysis, romMode),
    'components.asm': interruptDrivenComponents
      ? '; Components are generated inside interrupt.asm (interruptDrivenComponents=true)\n'
      : generateComponentsFile(analysis, romMode),
    'entities.asm': generateEntitiesFile(analysis),
    'worlds.asm': generateWorldsFile(analysis),
    'screens.asm': generateScreensFile(analysis, romMode),
    'sprites.asm': generateSpritesFile(analysis, romMode),
    'font.asm': generateFontFile(analysis, romMode, fontInPage02),
    'hud.asm': generateHudFile(analysis),
    'menus.asm': generateMenusFile(analysis),
    'sound.asm': generateSoundFile(analysis, executionPlan),
    'scroll.asm': generateScrollFile(analysis),
    'animtiles.asm': generateAnimatedTilesFile(analysis, romMode),
    'statemachine.asm': analysis.stateMachines && analysis.stateMachines.length > 0
      ? generateStateMachineSystem(analysis.stateMachines, analysis.globalVariables, analysis.sprites, analysis.tiles, (analysis as any).templates, (analysis as any).sounds, (analysis as any).trackIndexByAssetId, romMode)
      : '; No State Machines\n',
    'gameflow.asm': generateGameFlowFile(analysis, executionPlan),
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
