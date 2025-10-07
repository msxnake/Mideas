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
import { generateGameFlowStateMachine } from './generators/gameFlowGenerator';
import { generateMainFile } from './generators/mainGenerator';
import { generatePatternsFile } from './generators/patternsGenerator';
import { generateColorsFile } from './generators/colorsGenerator';
import { generateUnifiedFile } from './generators/unifiedGenerator';
import { generateSpritesFile } from './generators/spritesGenerator';
import { generateComponentsFile } from './generators/componentsGenerator';
import { generateEntitiesFile } from './generators/entitiesGenerator';
import { generateScreensFile } from './generators/screensGenerator';
import { generateFontFile } from './generators/fontGenerator';
import { generateWorldsFile } from './generators/worldGenerator';
import { generateMenusFile } from './generators/menusGenerator';

/**
 * MSX Modular Configuration
 */
export interface MSXModularConfig {
  generateUnified?: boolean;
  targetFormat?: 'konami' | 'ascii8' | 'ascii16';
}

/**
 * Convert ProjectSummary to ProjectAnalysis format
 */
function convertSummaryToAnalysis(summary: ProjectSummary): ProjectAnalysis {
  // This function was extracted from the original msxModularGenerator.ts (lines 143-289)
  // It converts the summary format to the analysis format used by generators

  const analysis: ProjectAnalysis = {
    hasSprites: summary.assets.sprites.length > 0,
    hasTiles: summary.assets.tiles.length > 0,
    hasScreens: summary.assets.screens.length > 0,
    hasEntities: summary.assets.entities.length > 0,
    hasComponents: summary.assets.entities.some(e => e.components && Object.keys(e.components).length > 0),
    hasGameFlow: !!summary.execution.mainGameFlow,
    hasMenus: summary.assets.menus.length > 0,
    hasFonts: summary.assets.fonts.length > 0,
    components: [],
    entities: summary.assets.entities as any[], // Type conversion
    sprites: summary.assets.sprites as any[],
    tiles: summary.assets.tiles as any[],
    screens: summary.assets.screens as any[],
    gameFlow: summary.execution.mainGameFlow as any,
    projectName: summary.projectInfo.name
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
      components: [],
      entities: [],
      sprites: [],
      tiles: [],
      screens: [],
      projectName: projectName
    };
    console.log('🔄 Using fallback empty analysis');
  }

  // Generate individual files
  const files: GeneratedASMFiles = {
    'bios.asm': generateBIOSFile(),
    'constants.asm': generateConstantsFile(analysis),
    'variables.asm': generateVariablesFile(analysis),
    'header.asm': generateHeaderFile(projectName, analysis),
    'patterns.asm': generatePatternsFile(analysis),
    'colors.asm': generateColorsFile(analysis),
    'components.asm': generateComponentsFile(analysis),
    'entities.asm': generateEntitiesFile(analysis),
    'worlds.asm': generateWorldsFile(analysis),
    'screens.asm': generateScreensFile(analysis),
    'sprites.asm': generateSpritesFile(analysis),
    'font.asm': generateFontFile(analysis),
    'menus.asm': generateMenusFile(analysis),
    'gameflow.asm': '', // TODO: Extract from main or header if needed
    'main.asm': generateMainFile(projectName, analysis),
    'unitedFiles.asm': ''
  };

  // Generate unified file if requested
  if (config.generateUnified) {
    files['unitedFiles.asm'] = generateUnifiedFile(files, projectName, analysis);
  }

  console.log('✅ Modular ASM files generated successfully!');
  console.log(`📊 Generated ${Object.keys(files).filter(k => files[k as keyof GeneratedASMFiles]).length} files`);

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

  // Generate files using same logic as generateModularASM
  const files: GeneratedASMFiles = {
    'bios.asm': generateBIOSFile(),
    'constants.asm': generateConstantsFile(analysis),
    'variables.asm': generateVariablesFile(analysis),
    'header.asm': generateHeaderFile(summary.projectInfo.name, analysis),
    'patterns.asm': generatePatternsFile(analysis),
    'colors.asm': generateColorsFile(analysis),
    'entities.asm': generateEntitiesFile(analysis),
    'worlds.asm': generateWorldsFile(analysis),
    'screens.asm': generateScreensFile(analysis),
    'sprites.asm': generateSpritesFile(analysis),
    'font.asm': generateFontFile(analysis),
    'menus.asm': generateMenusFile(analysis),
    'gameflow.asm': '',
    'main.asm': generateMainFile(summary.projectInfo.name, analysis),
    'unitedFiles.asm': ''
  };

  // Generate unified file if requested
  if (config.generateUnified) {
    files['unitedFiles.asm'] = generateUnifiedFile(files, summary.projectInfo.name, analysis);
  }

  console.log('✅ Modular ASM files from summary generated successfully!');
  return files;
}

// Re-export types for convenience
export type { GeneratedASMFiles, ProjectSummary, ProjectAnalysis };
export type { MSXModularConfig };
