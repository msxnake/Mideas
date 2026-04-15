"use strict";
/**
 * @fileoverview MSX Modular ASM Generator - Main Entry Point
 * Coordinates all ASM file generators
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateModularASM = generateModularASM;
exports.generateModularASMFromSummary = generateModularASMFromSummary;
const asmTemplateGenerator_1 = require("../asmTemplateGenerator");
// Import all generators
const biosGenerator_1 = require("./generators/biosGenerator");
const constantsGenerator_1 = require("./generators/constantsGenerator");
const variablesGenerator_1 = require("./generators/variablesGenerator");
const headerGenerator_1 = require("./generators/headerGenerator");
const gameFlowGenerator_1 = require("./generators/gameFlowGenerator");
const mainGenerator_1 = require("./generators/mainGenerator");
const mapperGenerator_1 = require("./generators/mapperGenerator");
const resourceManagerGenerator_1 = require("./generators/resourceManagerGenerator");
const patternsGenerator_1 = require("./generators/patternsGenerator");
const colorsGenerator_1 = require("./generators/colorsGenerator");
const unifiedGenerator_1 = require("./generators/unifiedGenerator");
const spritesGenerator_1 = require("./generators/spritesGenerator");
const componentsGenerator_1 = require("./generators/componentsGenerator");
const entitiesGenerator_1 = require("./generators/entitiesGenerator");
const screensGenerator_1 = require("./generators/screensGenerator");
const fontGenerator_1 = require("./generators/fontGenerator");
const hudGenerator_1 = require("./generators/hudGenerator");
const worldGenerator_1 = require("./generators/worldGenerator");
const menusGenerator_1 = require("./generators/menusGenerator");
const stateMachineGenerator_1 = require("./generators/stateMachineGenerator");
const interruptGenerator_1 = require("./generators/interruptGenerator");
const soundGenerator_1 = require("./generators/soundGenerator");
const scrollGenerator_1 = require("./generators/scrollGenerator");
const animatedTilesGenerator_1 = require("./generators/animatedTilesGenerator");
const page0Generator_1 = require("./generators/page0Generator");
const mapperWindowUtils_1 = require("./generators/mapperWindowUtils");
const executionPlan_1 = require("./planning/executionPlan");
const executionValidators_1 = require("./planning/executionValidators");
function resolveExecutionMode(config) {
    if (config.executionMode) {
        return config.executionMode;
    }
    return 'interruptTaskManager';
}
function buildValidatedExecutionPlan(analysis, config) {
    const normalizedConfig = {
        ...config,
        executionMode: resolveExecutionMode(config),
    };
    const plan = (0, executionValidators_1.validateExecutionPlan)((0, executionPlan_1.buildExecutionPlan)(analysis, normalizedConfig), analysis);
    if (plan.diagnostics.errors.length > 0) {
        throw new Error(`Execution plan validation failed:\n${plan.diagnostics.errors.join('\n')}`);
    }
    return plan;
}
function buildRuntimeTrackIndexByAssetId(tracks) {
    const psgTracks = (tracks || [])
        .filter((track) => (track?.soundChip || 'PSG') === 'PSG')
        .map((track) => ({
        ...track,
        soundChip: track?.soundChip || 'PSG'
    }));
    const pt3Tracks = psgTracks.filter((track) => track?.playbackBackend === 'external-pt3');
    const runtimeTracks = pt3Tracks.length > 0
        ? pt3Tracks
        : psgTracks.filter((track) => track?.playbackBackend !== 'external-pt3');
    return runtimeTracks.reduce((map, track, index) => {
        if (track?.id) {
            map[track.id] = index;
        }
        return map;
    }, {});
}
/**
 * Convert ProjectSummary to ProjectAnalysis format
 */
function convertSummaryToAnalysis(summary) {
    // This function was extracted from the original msxModularGenerator.ts (lines 143-289)
    // It converts the summary format to the analysis format used by generators
    const tracks = (summary.assets.tracks || [])
        .filter((track) => (track?.soundChip || 'PSG') === 'PSG')
        .map((track) => ({
        ...track,
        soundChip: track?.soundChip || 'PSG'
    }));
    // Keep Game Flow/state-machine track indices aligned with the backend that
    // soundGenerator will actually export: PT3 if any PT3 exists, otherwise
    // serialized PSG tracker tracks.
    const trackIndexByAssetId = buildRuntimeTrackIndexByAssetId(summary.assets.tracks || []);
    const analysis = {
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
        entities: summary.assets.entities,
        sprites: summary.assets.sprites,
        sounds: [],
        tracks: tracks,
        trackIndexByAssetId,
        tiles: summary.assets.tiles,
        tileBanks: [],
        screens: summary.assets.screens, // Added alias
        screenMaps: summary.assets.screens, // Added missing property
        gameFlow: summary.execution.mainGameFlow,
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
function generateModularASM(projectName, assets, config = {}) {
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
    let analysis;
    try {
        analysis = (0, asmTemplateGenerator_1.analyzeProject)(projectName, assets);
        console.log(`🔍 Analysis complete: ${analysis.sprites.length} sprites, ${analysis.tiles.length} tiles`);
    }
    catch (error) {
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
    const targetFormat = config.targetFormat || 'konami';
    const romMode = config.romMode || 'simple32k';
    const autoMegaROM = config.autoMegaROM ?? false;
    const executionPlan = buildValidatedExecutionPlan(analysis, config);
    const mapperWindow = (0, mapperWindowUtils_1.getMapperWindowConfig)(romMode, targetFormat);
    // Generate individual files
    console.log('📝 [MSX GENERATOR] Generating all ASM files...');
    console.log(`🔧 Hardware Mode: ${hardwareMode.toUpperCase()}, Optimize: ${optimizeLevel}`);
    console.log(`[MSX GENERATOR] ROM config: mode=${romMode}, mapper=${targetFormat}, autoMegaROM=${autoMegaROM}`);
    // For plain48k ROMs, move font data to page 0 to free space in the main ROM window
    const hasMenus = analysis.gameFlow?.nodes?.some((node) => node.type === 'SubMenu');
    const hasText = analysis.screenMaps?.some((screen) => screen.layers?.text || screen.textElements?.length > 0);
    const hasHudElements = analysis.screenMaps?.some((screen) => screen.hudConfiguration?.elements && screen.hudConfiguration.elements.length > 0);
    const needsFont = !!(hasMenus || hasText || hasHudElements);
    const fontInPage0 = romMode === 'plain48k' && needsFont;
    const fontInBank4 = romMode === 'megarom' && needsFont;
    const fontRawData = fontInPage0 ? (0, fontGenerator_1.getFontRawData)(analysis) : undefined;
    const files = {
        'page0.asm': (0, page0Generator_1.generatePage0File)(analysis, romMode, fontRawData),
        'bios.asm': (0, biosGenerator_1.generateBIOSFile)({ hardwareMode: { mode: hardwareMode, optimizeLevel } }),
        'constants.asm': (0, constantsGenerator_1.generateConstantsFile)(analysis),
        'variables.asm': (0, variablesGenerator_1.generateVariablesFile)(analysis),
        'mapper.asm': (0, mapperGenerator_1.generateMapperFile)({ targetFormat, romMode, autoMegaROM }),
        'resource_ids.asm': '; Resource ids are emitted by the unified MegaROM backend when available.\nRESOURCE_ID_INVALID EQU #FF\n',
        'resource_table.asm': '; Resource table is emitted by the unified MegaROM backend when available.\nRESOURCE_TABLE_ENTRY_SIZE EQU 8\nRESOURCE_TABLE_COUNT EQU 0\nresource_table:\n',
        'resource_manager.asm': (0, resourceManagerGenerator_1.generateResourceManagerFile)(mapperWindow),
        'interrupt.asm': (0, interruptGenerator_1.generateInterruptFile)(analysis, { interruptDrivenComponents, romMode }, executionPlan),
        'header.asm': (0, headerGenerator_1.generateHeaderFile)(projectName, analysis, executionPlan, romMode),
        'patterns.asm': (0, patternsGenerator_1.generatePatternsFile)(analysis, romMode, romMode === 'megarom', targetFormat),
        'colors.asm': (0, colorsGenerator_1.generateColorsFile)(analysis, romMode, romMode === 'megarom', targetFormat),
        'components.asm': (interruptDrivenComponents && romMode !== 'megarom')
            ? '; Components are generated inside interrupt.asm (interruptDrivenComponents=true)\n'
            : (0, componentsGenerator_1.generateComponentsFile)(analysis, romMode),
        'entities.asm': (0, entitiesGenerator_1.generateEntitiesFile)(analysis),
        'worlds.asm': (0, worldGenerator_1.generateWorldsFile)(analysis, romMode),
        'screens.asm': (0, screensGenerator_1.generateScreensFile)(analysis, romMode, romMode === 'megarom', targetFormat),
        'sprites.asm': (0, spritesGenerator_1.generateSpritesFile)(analysis, romMode, romMode === 'megarom', targetFormat),
        'font.asm': (0, fontGenerator_1.generateFontFile)(analysis, romMode, fontInPage0, fontInBank4, targetFormat),
        'hud.asm': (0, hudGenerator_1.generateHudFile)(analysis),
        'menus.asm': (0, menusGenerator_1.generateMenusFile)(analysis),
        'sound.asm': (0, soundGenerator_1.generateSoundFile)(analysis, executionPlan, romMode),
        'scroll.asm': (0, scrollGenerator_1.generateScrollFile)(analysis),
        'animtiles.asm': (0, animatedTilesGenerator_1.generateAnimatedTilesFile)(analysis, romMode, targetFormat),
        'statemachine.asm': analysis.stateMachines && analysis.stateMachines.length > 0
            ? (0, stateMachineGenerator_1.generateStateMachineSystem)(analysis.stateMachines, analysis.globalVariables, analysis.sprites, analysis.tiles, analysis.templates, analysis.sounds, analysis.trackIndexByAssetId, romMode)
            : '; No State Machines\n',
        'gameflow.asm': (0, gameFlowGenerator_1.generateGameFlowFile)(analysis, executionPlan),
        'main.asm': (0, mainGenerator_1.generateMainFile)(projectName, analysis, romMode),
        'unitedFiles.asm': ''
    };
    // Generate unified file if requested
    if (config.generateUnified) {
        files['unitedFiles.asm'] = (0, unifiedGenerator_1.generateUnifiedFile)(files, projectName, analysis, executionPlan, {
            romMode,
            targetFormat,
            autoMegaROM
        });
    }
    console.log('✅ Modular ASM files generated successfully!');
    console.log(`📊 Generated ${Object.keys(files).filter(k => files[k]).length} files`);
    console.log('📋 [DEBUG] Files generated:', Object.keys(files));
    console.log('🎯 [DEBUG] interrupt.asm length:', files['interrupt.asm']?.length || 'MISSING!');
    return files;
}
/**
 * Generate modular ASM files from project summary
 */
function generateModularASMFromSummary(summary, config = {}) {
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
    let analysis;
    try {
        analysis = convertSummaryToAnalysis(summary);
        console.log(`🔍 Analysis from summary: ${analysis.sprites.length} sprites, ${analysis.tiles.length} tiles`);
    }
    catch (error) {
        console.error('❌ Error converting summary:', error);
        throw error;
    }
    const interruptDrivenComponents = config.interruptDrivenComponents ?? true;
    const hardwareMode = config.hardwareMode || 'hybrid'; // Default to hybrid mode
    const optimizeLevel = config.optimizeLevel || 'safe';
    console.log(`🔧 Hardware Mode: ${hardwareMode.toUpperCase()}, Optimize: ${optimizeLevel}`);
    const targetFormat = config.targetFormat || 'konami';
    const romMode = config.romMode || 'simple32k';
    const autoMegaROM = config.autoMegaROM ?? false;
    const executionPlan = buildValidatedExecutionPlan(analysis, config);
    const mapperWindow = (0, mapperWindowUtils_1.getMapperWindowConfig)(romMode, targetFormat);
    console.log(`[MSX GENERATOR] ROM config: mode=${romMode}, mapper=${targetFormat}, autoMegaROM=${autoMegaROM}`);
    // For plain48k ROMs, move font data to page 0 to free space in the main ROM window
    const hasMenus2 = analysis.gameFlow?.nodes?.some((node) => node.type === 'SubMenu');
    const hasText2 = analysis.screenMaps?.some((screen) => screen.layers?.text || screen.textElements?.length > 0);
    const hasHudElements2 = analysis.screenMaps?.some((screen) => screen.hudConfiguration?.elements && screen.hudConfiguration.elements.length > 0);
    const needsFont2 = !!(hasMenus2 || hasText2 || hasHudElements2);
    const fontInPage02 = romMode === 'plain48k' && needsFont2;
    const fontInBank42 = romMode === 'megarom' && needsFont2;
    const fontRawData2 = fontInPage02 ? (0, fontGenerator_1.getFontRawData)(analysis) : undefined;
    // Generate files using same logic as generateModularASM
    const files = {
        'page0.asm': (0, page0Generator_1.generatePage0File)(analysis, romMode, fontRawData2),
        'bios.asm': (0, biosGenerator_1.generateBIOSFile)({ hardwareMode: { mode: hardwareMode, optimizeLevel } }),
        'constants.asm': (0, constantsGenerator_1.generateConstantsFile)(analysis),
        'variables.asm': (0, variablesGenerator_1.generateVariablesFile)(analysis),
        'mapper.asm': (0, mapperGenerator_1.generateMapperFile)({ targetFormat, romMode, autoMegaROM }),
        'resource_ids.asm': '; Resource ids are emitted by the unified MegaROM backend when available.\nRESOURCE_ID_INVALID EQU #FF\n',
        'resource_table.asm': '; Resource table is emitted by the unified MegaROM backend when available.\nRESOURCE_TABLE_ENTRY_SIZE EQU 8\nRESOURCE_TABLE_COUNT EQU 0\nresource_table:\n',
        'resource_manager.asm': (0, resourceManagerGenerator_1.generateResourceManagerFile)(mapperWindow),
        'interrupt.asm': (0, interruptGenerator_1.generateInterruptFile)(analysis, { interruptDrivenComponents, romMode }, executionPlan),
        'header.asm': (0, headerGenerator_1.generateHeaderFile)(summary.projectInfo.name, analysis, executionPlan, romMode),
        'patterns.asm': (0, patternsGenerator_1.generatePatternsFile)(analysis, romMode, romMode === 'megarom', targetFormat),
        'colors.asm': (0, colorsGenerator_1.generateColorsFile)(analysis, romMode, romMode === 'megarom', targetFormat),
        'components.asm': (interruptDrivenComponents && romMode !== 'megarom')
            ? '; Components are generated inside interrupt.asm (interruptDrivenComponents=true)\n'
            : (0, componentsGenerator_1.generateComponentsFile)(analysis, romMode),
        'entities.asm': (0, entitiesGenerator_1.generateEntitiesFile)(analysis),
        'worlds.asm': (0, worldGenerator_1.generateWorldsFile)(analysis, romMode),
        'screens.asm': (0, screensGenerator_1.generateScreensFile)(analysis, romMode, romMode === 'megarom', targetFormat),
        'sprites.asm': (0, spritesGenerator_1.generateSpritesFile)(analysis, romMode, romMode === 'megarom', targetFormat),
        'font.asm': (0, fontGenerator_1.generateFontFile)(analysis, romMode, fontInPage02, fontInBank42, targetFormat),
        'hud.asm': (0, hudGenerator_1.generateHudFile)(analysis),
        'menus.asm': (0, menusGenerator_1.generateMenusFile)(analysis),
        'sound.asm': (0, soundGenerator_1.generateSoundFile)(analysis, executionPlan, romMode),
        'scroll.asm': (0, scrollGenerator_1.generateScrollFile)(analysis),
        'animtiles.asm': (0, animatedTilesGenerator_1.generateAnimatedTilesFile)(analysis, romMode, targetFormat),
        'statemachine.asm': analysis.stateMachines && analysis.stateMachines.length > 0
            ? (0, stateMachineGenerator_1.generateStateMachineSystem)(analysis.stateMachines, analysis.globalVariables, analysis.sprites, analysis.tiles, analysis.templates, analysis.sounds, analysis.trackIndexByAssetId, romMode)
            : '; No State Machines\n',
        'gameflow.asm': (0, gameFlowGenerator_1.generateGameFlowFile)(analysis, executionPlan),
        'main.asm': (0, mainGenerator_1.generateMainFile)(summary.projectInfo.name, analysis, romMode),
        'unitedFiles.asm': ''
    };
    // Generate unified file if requested
    if (config.generateUnified) {
        files['unitedFiles.asm'] = (0, unifiedGenerator_1.generateUnifiedFile)(files, summary.projectInfo.name, analysis, executionPlan, {
            romMode,
            targetFormat,
            autoMegaROM
        });
    }
    console.log('✅ Modular ASM files from summary generated successfully!');
    return files;
}
