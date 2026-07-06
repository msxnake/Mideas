"use strict";
/**
 * @fileoverview MSX Modular ASM Generator - Main Entry Point
 * Coordinates all ASM file generators
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveGraphicsBackend = resolveGraphicsBackend;
exports.generateModularASM = generateModularASM;
exports.generateModularASMFromSummary = generateModularASMFromSummary;
const msx2ProjectProfiles_1 = require("../msx2ProjectProfiles");
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
const runtimeLayoutPolicy_1 = require("./generators/runtimeLayoutPolicy");
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
const bossesGenerator_1 = require("./generators/bossesGenerator");
const page0Generator_1 = require("./generators/page0Generator");
const mapperWindowUtils_1 = require("./generators/mapperWindowUtils");
const msx2Screen4Generator_1 = require("./generators/msx2/msx2Screen4Generator");
const msx2Screen5BitmapRoomGenerator_1 = require("./generators/msx2/msx2Screen5BitmapRoomGenerator");
const msx2Screen5PresentationGenerator_1 = require("./generators/msx2/msx2Screen5PresentationGenerator");
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
function hasMsx2BitmapRoomAssets(assets) {
    return Array.isArray(assets) && assets.some(asset => asset?.type === 'msx2bitmaproom');
}
function hasMsx2PresentationAssets(assets) {
    return Array.isArray(assets) && assets.some(asset => asset?.type === 'msx2presentation');
}
function resolveMsx2GameFlowBackend(assets) {
    if (!Array.isArray(assets))
        return undefined;
    const flows = assets.filter(asset => asset?.type === 'msx2gameflow');
    const flow = flows.find(asset => asset.name === 'Main MSX2') || flows[0];
    const purpose = flow?.data?.purpose;
    if (purpose === 'screen4-bitmap-runtime')
        return 'msx2-screen4-bitmap-room';
    if (purpose === 'screen4-runtime')
        return 'msx2-screen4-pattern';
    if (purpose === 'screen5-presentation')
        return 'msx2-screen5-presentation';
    return undefined;
}
function resolveGraphicsBackend(config, assets) {
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
function convertSummaryToAnalysis(summary) {
    // This function was extracted from the original msxModularGenerator.ts (lines 143-289)
    // It converts the summary format to the analysis format used by generators
    const summaryAssets = summary.assets;
    const unwrapSummaryAsset = (asset) => {
        if (asset && typeof asset === 'object' && asset.data && typeof asset.data === 'object') {
            return {
                ...asset.data,
                id: asset.data.id || asset.id,
                name: asset.data.name || asset.name,
            };
        }
        return asset;
    };
    const unwrapSummaryAssets = (items) => (Array.isArray(items) ? items : []).map(item => unwrapSummaryAsset(item));
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
        hasSprites: sprites.length > 0,
        hasTiles: tiles.length > 0,
        hasScreens: screenMaps.length > 0 || msx2BitmapRooms.length > 0 || msx2Presentations.length > 0,
        hasEntities: entities.length > 0,
        hasComponents: components.length > 0 || entities.some((e) => e.components && Object.keys(e.components).length > 0),
        hasGameFlow: !!summary.execution.mainGameFlow,
        hasMenus: (summaryAssets.menus || []).length > 0,
        hasFonts: fonts.length > 0,
        hasECS: entities.length > 0 || components.length > 0,
        hasMultipleScreens: screenMaps.length > 1 || msx2Screens.length > 1 || msx2Presentations.length > 1,
        hasAnimations: sprites.some((s) => s.frames && s.frames.length > 1),
        hasCollisions: true, // Default to true for summary
        hasMenuSystem: (summaryAssets.menus || []).length > 0,
        components: components,
        templates: templates,
        entities: entities,
        sprites: sprites,
        msx2Sprites: msx2Sprites,
        msx2Bitmaps: msx2Bitmaps,
        msx2Screens: msx2Screens,
        msx2BitmapRooms: msx2BitmapRooms,
        msx2Presentations: msx2Presentations,
        msx2GameFlows: msx2GameFlows,
        sounds: [],
        tracks: tracks,
        trackIndexByAssetId,
        tiles: tiles,
        tileBanks: tileBanks,
        screens: screenMaps,
        screenMaps: screenMaps,
        bosses: bosses,
        gameFlow: summary.execution.mainGameFlow,
        projectName: summary.projectInfo.name,
        customStates: [], // Added missing property
        stateMachines: stateMachines,
        worldmaps,
        fonts,
        globalVariables
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
    // One ROM = one MSX2 graphics mode. Block export of projects that mix tile SCREEN 4 screens
    // and bitmap SCREEN 5 rooms before any backend is selected (the selector would otherwise pick
    // one mode and silently drop the other set of screens).
    const screenModeConflict = (0, msx2ProjectProfiles_1.getMsx2ScreenModeConflictMessage)(assets);
    if (screenModeConflict) {
        console.error('❌', screenModeConflict);
        throw new Error(screenModeConflict);
    }
    const targetGraphicsBackend = resolveGraphicsBackend(config, assets);
    if (targetGraphicsBackend === 'msx2-screen5-presentation') {
        const analysis = (0, asmTemplateGenerator_1.analyzeProject)(projectName, assets);
        return (0, msx2Screen5PresentationGenerator_1.generateMsx2Screen5PresentationFiles)(projectName, analysis, {
            screenMode: 'SCREEN 5 (Graphics III)',
            romMode: config.romMode || 'simple32k',
            targetFormat: config.targetFormat || 'konami',
            autoMegaROM: config.autoMegaROM ?? false,
        });
    }
    if (targetGraphicsBackend === 'msx2-screen4-bitmap-room') {
        const analysis = (0, asmTemplateGenerator_1.analyzeProject)(projectName, assets);
        return (0, msx2Screen5BitmapRoomGenerator_1.generateMsx2Screen5BitmapRoomFiles)(projectName, analysis, {
            screenMode: 'SCREEN 4 (Graphics II)',
            romMode: config.romMode || 'simple32k',
            targetFormat: config.targetFormat || 'konami',
            autoMegaROM: config.autoMegaROM ?? false,
        });
    }
    if (targetGraphicsBackend === 'msx2-screen4-pattern') {
        const analysis = (0, asmTemplateGenerator_1.analyzeProject)(projectName, assets);
        return (0, msx2Screen4Generator_1.generateMsx2Screen4Files)(projectName, analysis, {
            screenMode: config.screenMode === 'SCREEN 5 (Graphics III)' ? 'SCREEN 5 (Graphics III)' : 'SCREEN 4 (Graphics II)',
            romMode: config.romMode || 'simple32k',
            targetFormat: config.targetFormat || 'konami',
            autoMegaROM: config.autoMegaROM ?? false,
        });
    }
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
    const targetFormat = config.targetFormat || 'konami';
    const romMode = config.romMode || 'simple32k';
    const autoMegaROM = config.autoMegaROM ?? false;
    const executionPlan = buildValidatedExecutionPlan(analysis, config);
    const mapperWindow = (0, mapperWindowUtils_1.getMapperWindowConfig)(romMode, targetFormat);
    const keepRuntimeBackgroundLayout = (0, runtimeLayoutPolicy_1.shouldKeepRuntimeBackgroundLayout)(analysis);
    const hasHardPlayerTickScreenRuntime = (analysis.screenMaps?.length || 0) > 0;
    const hardPlayerTickEnabled = (config.interruptConfig?.enableHardPlayerTick ?? false)
        && hasHardPlayerTickScreenRuntime
        && !(romMode === 'megarom' && targetFormat === 'ascii16');
    // Generate individual files
    console.log('📝 [MSX GENERATOR] Generating all ASM files...');
    console.log(`🔧 Hardware Mode: ${hardwareMode.toUpperCase()}, Optimize: ${optimizeLevel}`);
    console.log(`[MSX GENERATOR] ROM config: mode=${romMode}, mapper=${targetFormat}, autoMegaROM=${autoMegaROM}`);
    // For plain48k ROMs, move font data to page 0 to free space in the main ROM window
    const hasMenus = analysis.gameFlow?.nodes?.some((node) => node.type === 'SubMenu' || node.type === 'Controls');
    const hasGameFlowText = analysis.gameFlow?.nodes?.some((node) => node.type === 'Text' || node.type === 'TextScroll' || node.type === 'TextScrollColor' || node.type === 'TextScroll2');
    const hasText = analysis.screenMaps?.some((screen) => screen.layers?.text || screen.textElements?.length > 0);
    const hasDialogue = analysis.dialogues?.some((dialogue) => Array.isArray(dialogue?.lines) && dialogue.lines.some((line) => String(line?.text || '').length > 0));
    const hasHudElements = analysis.screenMaps?.some((screen) => screen.hudConfiguration?.elements && screen.hudConfiguration.elements.length > 0);
    const needsFont = !!(hasMenus || hasGameFlowText || hasText || hasHudElements || hasDialogue);
    const fontInPage0 = romMode === 'plain48k' && needsFont;
    const fontInBank4 = romMode === 'megarom' && needsFont;
    const fontRawData = fontInPage0 ? (0, fontGenerator_1.getFontRawData)(analysis) : undefined;
    const files = {
        'page0.asm': (0, page0Generator_1.generatePage0File)(analysis, romMode, fontRawData),
        'bios.asm': (0, biosGenerator_1.generateBIOSFile)({ hardwareMode: { mode: hardwareMode, optimizeLevel } }),
        'constants.asm': (0, constantsGenerator_1.generateConstantsFile)(analysis),
        'variables.asm': (0, variablesGenerator_1.generateVariablesFile)(analysis, romMode),
        'mapper.asm': (0, mapperGenerator_1.generateMapperFile)({ targetFormat, romMode, autoMegaROM }),
        'resource_ids.asm': '; Resource ids are emitted by the unified MegaROM backend when available.\nRESOURCE_ID_INVALID EQU #FF\n',
        'resource_table.asm': '; Resource table is emitted by the unified MegaROM backend when available.\nRESOURCE_TABLE_ENTRY_SIZE EQU 8\nRESOURCE_TABLE_COUNT EQU 0\nresource_table:\n',
        'resource_manager.asm': (0, resourceManagerGenerator_1.generateResourceManagerFile)(mapperWindow, { keepRuntimeBackgroundLayout }),
        'interrupt.asm': (0, interruptGenerator_1.generateInterruptFile)(analysis, { interruptDrivenComponents, romMode, hardPlayerTickEnabled }, executionPlan),
        'header.asm': (0, headerGenerator_1.generateHeaderFile)(projectName, analysis, executionPlan, romMode, targetFormat),
        'patterns.asm': (0, patternsGenerator_1.generatePatternsFile)(analysis, romMode, romMode === 'megarom', targetFormat),
        'colors.asm': (0, colorsGenerator_1.generateColorsFile)(analysis, romMode, romMode === 'megarom', targetFormat),
        'components.asm': (interruptDrivenComponents && romMode !== 'megarom')
            ? '; Components are generated inside interrupt.asm (interruptDrivenComponents=true)\n'
            : (0, componentsGenerator_1.generateComponentsFile)(analysis, romMode, targetFormat),
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
        'bosses.asm': (0, bossesGenerator_1.generateBossesFile)(analysis, { includeBossData: romMode !== 'megarom' }),
        'statemachine.asm': analysis.stateMachines && analysis.stateMachines.length > 0
            ? (0, stateMachineGenerator_1.generateStateMachineSystem)(analysis.stateMachines, analysis.globalVariables, analysis.sprites, analysis.tiles, analysis.templates, analysis.sounds, analysis.trackIndexByAssetId, romMode, targetFormat, analysis.entities)
            : '; No State Machines\n',
        'gameflow.asm': (0, gameFlowGenerator_1.generateGameFlowFile)(analysis, executionPlan, romMode),
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
    const summaryGraphicsConfig = {
        ...config,
        screenMode: config.screenMode || summary.screenMode || summary.currentScreenMode,
        targetGraphicsBackend: config.targetGraphicsBackend || summary.targetGraphicsBackend,
    };
    const summaryAssetList = [
        ...(summary.assets.msx2BitmapRooms || []).map((data) => ({ type: 'msx2bitmaproom', data })),
        ...(summary.assets.msx2bitmaprooms || []).map((data) => ({ type: 'msx2bitmaproom', data })),
        ...(summary.assets.msx2Presentations || []).map((data) => ({ type: 'msx2presentation', data })),
        ...(summary.assets.msx2presentations || []).map((data) => ({ type: 'msx2presentation', data })),
    ];
    const summaryGraphicsBackend = resolveGraphicsBackend(summaryGraphicsConfig, summaryAssetList);
    if (summaryGraphicsBackend === 'msx2-screen5-presentation') {
        return (0, msx2Screen5PresentationGenerator_1.generateMsx2Screen5PresentationFiles)(summary.projectInfo.name, analysis, {
            screenMode: 'SCREEN 5 (Graphics III)',
            romMode: summaryGraphicsConfig.romMode || 'simple32k',
            targetFormat: summaryGraphicsConfig.targetFormat || 'konami',
            autoMegaROM: summaryGraphicsConfig.autoMegaROM ?? false,
        });
    }
    if (summaryGraphicsBackend === 'msx2-screen4-bitmap-room') {
        return (0, msx2Screen5BitmapRoomGenerator_1.generateMsx2Screen5BitmapRoomFiles)(summary.projectInfo.name, analysis, {
            screenMode: 'SCREEN 4 (Graphics II)',
            romMode: summaryGraphicsConfig.romMode || 'simple32k',
            targetFormat: summaryGraphicsConfig.targetFormat || 'konami',
            autoMegaROM: summaryGraphicsConfig.autoMegaROM ?? false,
        });
    }
    if (summaryGraphicsBackend === 'msx2-screen4-pattern') {
        return (0, msx2Screen4Generator_1.generateMsx2Screen4Files)(summary.projectInfo.name, analysis, {
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
    const targetFormat = config.targetFormat || 'konami';
    const romMode = config.romMode || 'simple32k';
    const autoMegaROM = config.autoMegaROM ?? false;
    const executionPlan = buildValidatedExecutionPlan(analysis, config);
    const mapperWindow = (0, mapperWindowUtils_1.getMapperWindowConfig)(romMode, targetFormat);
    const hasHardPlayerTickScreenRuntime = (analysis.screenMaps?.length || 0) > 0;
    const hardPlayerTickEnabled = (config.interruptConfig?.enableHardPlayerTick ?? false)
        && hasHardPlayerTickScreenRuntime
        && !(romMode === 'megarom' && targetFormat === 'ascii16');
    console.log(`[MSX GENERATOR] ROM config: mode=${romMode}, mapper=${targetFormat}, autoMegaROM=${autoMegaROM}`);
    // For plain48k ROMs, move font data to page 0 to free space in the main ROM window
    const hasMenus2 = analysis.gameFlow?.nodes?.some((node) => node.type === 'SubMenu' || node.type === 'Controls');
    const hasGameFlowText2 = analysis.gameFlow?.nodes?.some((node) => node.type === 'Text' || node.type === 'TextScroll' || node.type === 'TextScrollColor' || node.type === 'TextScroll2');
    const hasText2 = analysis.screenMaps?.some((screen) => screen.layers?.text || screen.textElements?.length > 0);
    const hasDialogue2 = analysis.dialogues?.some((dialogue) => Array.isArray(dialogue?.lines) && dialogue.lines.some((line) => String(line?.text || '').length > 0));
    const hasHudElements2 = analysis.screenMaps?.some((screen) => screen.hudConfiguration?.elements && screen.hudConfiguration.elements.length > 0);
    const needsFont2 = !!(hasMenus2 || hasGameFlowText2 || hasText2 || hasHudElements2 || hasDialogue2);
    const fontInPage02 = romMode === 'plain48k' && needsFont2;
    const fontInBank42 = romMode === 'megarom' && needsFont2;
    const fontRawData2 = fontInPage02 ? (0, fontGenerator_1.getFontRawData)(analysis) : undefined;
    // Generate files using same logic as generateModularASM
    const keepRuntimeBackgroundLayout2 = (0, runtimeLayoutPolicy_1.shouldKeepRuntimeBackgroundLayout)(analysis);
    const files = {
        'page0.asm': (0, page0Generator_1.generatePage0File)(analysis, romMode, fontRawData2),
        'bios.asm': (0, biosGenerator_1.generateBIOSFile)({ hardwareMode: { mode: hardwareMode, optimizeLevel } }),
        'constants.asm': (0, constantsGenerator_1.generateConstantsFile)(analysis),
        'variables.asm': (0, variablesGenerator_1.generateVariablesFile)(analysis, romMode),
        'mapper.asm': (0, mapperGenerator_1.generateMapperFile)({ targetFormat, romMode, autoMegaROM }),
        'resource_ids.asm': '; Resource ids are emitted by the unified MegaROM backend when available.\nRESOURCE_ID_INVALID EQU #FF\n',
        'resource_table.asm': '; Resource table is emitted by the unified MegaROM backend when available.\nRESOURCE_TABLE_ENTRY_SIZE EQU 8\nRESOURCE_TABLE_COUNT EQU 0\nresource_table:\n',
        'resource_manager.asm': (0, resourceManagerGenerator_1.generateResourceManagerFile)(mapperWindow, { keepRuntimeBackgroundLayout: keepRuntimeBackgroundLayout2 }),
        'interrupt.asm': (0, interruptGenerator_1.generateInterruptFile)(analysis, { interruptDrivenComponents, romMode, hardPlayerTickEnabled }, executionPlan),
        'header.asm': (0, headerGenerator_1.generateHeaderFile)(summary.projectInfo.name, analysis, executionPlan, romMode, targetFormat),
        'patterns.asm': (0, patternsGenerator_1.generatePatternsFile)(analysis, romMode, romMode === 'megarom', targetFormat),
        'colors.asm': (0, colorsGenerator_1.generateColorsFile)(analysis, romMode, romMode === 'megarom', targetFormat),
        'components.asm': (interruptDrivenComponents && romMode !== 'megarom')
            ? '; Components are generated inside interrupt.asm (interruptDrivenComponents=true)\n'
            : (0, componentsGenerator_1.generateComponentsFile)(analysis, romMode, targetFormat),
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
        'bosses.asm': (0, bossesGenerator_1.generateBossesFile)(analysis, { includeBossData: romMode !== 'megarom' }),
        'statemachine.asm': analysis.stateMachines && analysis.stateMachines.length > 0
            ? (0, stateMachineGenerator_1.generateStateMachineSystem)(analysis.stateMachines, analysis.globalVariables, analysis.sprites, analysis.tiles, analysis.templates, analysis.sounds, analysis.trackIndexByAssetId, romMode, targetFormat, analysis.entities)
            : '; No State Machines\n',
        'gameflow.asm': (0, gameFlowGenerator_1.generateGameFlowFile)(analysis, executionPlan, romMode),
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
