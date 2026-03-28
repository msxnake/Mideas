var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var index_exports = {};
__export(index_exports, {
  generateModularASM: () => generateModularASM,
  generateModularASMFromSummary: () => generateModularASMFromSummary
});
module.exports = __toCommonJS(index_exports);
var import_asmTemplateGenerator = require("../asmTemplateGenerator");
var import_biosGenerator = require("./generators/biosGenerator");
var import_constantsGenerator = require("./generators/constantsGenerator");
var import_variablesGenerator = require("./generators/variablesGenerator");
var import_headerGenerator = require("./generators/headerGenerator");
var import_gameFlowGenerator = require("./generators/gameFlowGenerator");
var import_mainGenerator = require("./generators/mainGenerator");
var import_mapperGenerator = require("./generators/mapperGenerator");
var import_patternsGenerator = require("./generators/patternsGenerator");
var import_colorsGenerator = require("./generators/colorsGenerator");
var import_unifiedGenerator = require("./generators/unifiedGenerator");
var import_spritesGenerator = require("./generators/spritesGenerator");
var import_componentsGenerator = require("./generators/componentsGenerator");
var import_entitiesGenerator = require("./generators/entitiesGenerator");
var import_screensGenerator = require("./generators/screensGenerator");
var import_fontGenerator = require("./generators/fontGenerator");
var import_hudGenerator = require("./generators/hudGenerator");
var import_worldGenerator = require("./generators/worldGenerator");
var import_menusGenerator = require("./generators/menusGenerator");
var import_stateMachineGenerator = require("./generators/stateMachineGenerator");
var import_interruptGenerator = require("./generators/interruptGenerator");
var import_soundGenerator = require("./generators/soundGenerator");
var import_scrollGenerator = require("./generators/scrollGenerator");
var import_animatedTilesGenerator = require("./generators/animatedTilesGenerator");
var import_page0Generator = require("./generators/page0Generator");
var import_executionPlan = require("./planning/executionPlan");
var import_executionValidators = require("./planning/executionValidators");
function resolveExecutionMode(config) {
  if (config.executionMode) {
    return config.executionMode;
  }
  return "interruptTaskManager";
}
function buildValidatedExecutionPlan(analysis, config) {
  const normalizedConfig = {
    ...config,
    executionMode: resolveExecutionMode(config)
  };
  const plan = (0, import_executionValidators.validateExecutionPlan)((0, import_executionPlan.buildExecutionPlan)(analysis, normalizedConfig), analysis);
  if (plan.diagnostics.errors.length > 0) {
    throw new Error(`Execution plan validation failed:
${plan.diagnostics.errors.join("\n")}`);
  }
  return plan;
}
function convertSummaryToAnalysis(summary) {
  const tracks = (summary.assets.tracks || []).filter((track) => (track?.soundChip || "PSG") === "PSG").map((track) => ({
    ...track,
    soundChip: track?.soundChip || "PSG"
  }));
  let pt3TrackIndex = 0;
  const trackIndexByAssetId = tracks.reduce((map, track) => {
    if (track?.id && track?.playbackBackend === "external-pt3") {
      map[track.id] = pt3TrackIndex++;
    }
    return map;
  }, {});
  const analysis = {
    hasSprites: summary.assets.sprites.length > 0,
    hasTiles: summary.assets.tiles.length > 0,
    hasScreens: summary.assets.screens.length > 0,
    hasEntities: summary.assets.entities.length > 0,
    hasComponents: summary.assets.entities.some((e) => e.components && Object.keys(e.components).length > 0),
    hasGameFlow: !!summary.execution.mainGameFlow,
    hasMenus: summary.assets.menus.length > 0,
    hasFonts: summary.assets.fonts.length > 0,
    hasECS: summary.assets.entities.length > 0,
    // Simplified check
    hasMultipleScreens: summary.assets.screens.length > 1,
    hasAnimations: summary.assets.sprites.some((s) => s.frames && s.frames.length > 1),
    hasCollisions: true,
    // Default to true for summary
    hasMenuSystem: summary.assets.menus.length > 0,
    components: [],
    templates: [],
    // Added missing property
    entities: summary.assets.entities,
    sprites: summary.assets.sprites,
    sounds: [],
    tracks,
    trackIndexByAssetId,
    tiles: summary.assets.tiles,
    tileBanks: [],
    screens: summary.assets.screens,
    // Added alias
    screenMaps: summary.assets.screens,
    // Added missing property
    gameFlow: summary.execution.mainGameFlow,
    projectName: summary.projectInfo.name,
    customStates: [],
    // Added missing property
    stateMachines: [],
    // Added missing property
    globalVariables: []
  };
  return analysis;
}
function generateModularASM(projectName, assets, config = {}) {
  console.log("\u{1F527} Generating modular ASM files...");
  if (!projectName) {
    console.error("\u274C projectName is required");
    throw new Error("projectName is required");
  }
  if (!assets) {
    console.error("\u274C assets is undefined or null");
    throw new Error("assets array is required");
  }
  if (!Array.isArray(assets)) {
    console.error("\u274C assets is not an array");
    throw new Error("assets must be an array");
  }
  console.log(`\u{1F4CA} Project: ${projectName}, Assets: ${assets.length}, Config:`, config);
  let analysis;
  try {
    analysis = (0, import_asmTemplateGenerator.analyzeProject)(projectName, assets);
    console.log(`\u{1F50D} Analysis complete: ${analysis.sprites.length} sprites, ${analysis.tiles.length} tiles`);
  } catch (error) {
    console.error("\u274C Error analyzing project:", error);
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
      projectName,
      customStates: [],
      stateMachines: [],
      globalVariables: []
    };
    console.log("\u{1F504} Using fallback empty analysis");
  }
  const interruptDrivenComponents = config.interruptDrivenComponents ?? true;
  const hardwareMode = config.hardwareMode || "hybrid";
  const optimizeLevel = config.optimizeLevel || "safe";
  const targetFormat = config.targetFormat || "konami";
  const romMode = config.romMode || "simple32k";
  const autoMegaROM = config.autoMegaROM ?? false;
  const executionPlan = buildValidatedExecutionPlan(analysis, config);
  console.log("\u{1F4DD} [MSX GENERATOR] Generating all ASM files...");
  console.log(`\u{1F527} Hardware Mode: ${hardwareMode.toUpperCase()}, Optimize: ${optimizeLevel}`);
  console.log(`[MSX GENERATOR] ROM config: mode=${romMode}, mapper=${targetFormat}, autoMegaROM=${autoMegaROM}`);
  const hasMenus = analysis.gameFlow?.nodes?.some((node) => node.type === "SubMenu");
  const hasText = analysis.screenMaps?.some(
    (screen) => screen.layers?.text || screen.textElements?.length > 0
  );
  const hasHudElements = analysis.screenMaps?.some(
    (screen) => screen.hudConfiguration?.elements && screen.hudConfiguration.elements.length > 0
  );
  const needsFont = !!(hasMenus || hasText || hasHudElements);
  const fontInPage0 = romMode === "plain48k" && needsFont;
  const fontInBank4 = romMode === "megarom" && needsFont;
  const fontRawData = fontInPage0 ? (0, import_fontGenerator.getFontRawData)(analysis) : void 0;
  const files = {
    "page0.asm": (0, import_page0Generator.generatePage0File)(analysis, romMode, fontRawData),
    "bios.asm": (0, import_biosGenerator.generateBIOSFile)({ hardwareMode: { mode: hardwareMode, optimizeLevel } }),
    "constants.asm": (0, import_constantsGenerator.generateConstantsFile)(analysis),
    "variables.asm": (0, import_variablesGenerator.generateVariablesFile)(analysis),
    "mapper.asm": (0, import_mapperGenerator.generateMapperFile)({ targetFormat, romMode, autoMegaROM }),
    "interrupt.asm": (0, import_interruptGenerator.generateInterruptFile)(analysis, { interruptDrivenComponents, romMode }, executionPlan),
    "header.asm": (0, import_headerGenerator.generateHeaderFile)(projectName, analysis, executionPlan, romMode),
    "patterns.asm": (0, import_patternsGenerator.generatePatternsFile)(analysis, romMode),
    "colors.asm": (0, import_colorsGenerator.generateColorsFile)(analysis, romMode),
    "components.asm": interruptDrivenComponents && romMode !== "megarom" ? "; Components are generated inside interrupt.asm (interruptDrivenComponents=true)\n" : (0, import_componentsGenerator.generateComponentsFile)(analysis, romMode),
    "entities.asm": (0, import_entitiesGenerator.generateEntitiesFile)(analysis),
    "worlds.asm": (0, import_worldGenerator.generateWorldsFile)(analysis),
    "screens.asm": (0, import_screensGenerator.generateScreensFile)(analysis, romMode),
    "sprites.asm": (0, import_spritesGenerator.generateSpritesFile)(analysis, romMode),
    "font.asm": (0, import_fontGenerator.generateFontFile)(analysis, romMode, fontInPage0, fontInBank4),
    "hud.asm": (0, import_hudGenerator.generateHudFile)(analysis),
    "menus.asm": (0, import_menusGenerator.generateMenusFile)(analysis),
    "sound.asm": (0, import_soundGenerator.generateSoundFile)(analysis, executionPlan),
    "scroll.asm": (0, import_scrollGenerator.generateScrollFile)(analysis),
    "animtiles.asm": (0, import_animatedTilesGenerator.generateAnimatedTilesFile)(analysis, romMode),
    "statemachine.asm": analysis.stateMachines && analysis.stateMachines.length > 0 ? (0, import_stateMachineGenerator.generateStateMachineSystem)(analysis.stateMachines, analysis.globalVariables, analysis.sprites, analysis.tiles, analysis.templates, analysis.sounds, analysis.trackIndexByAssetId, romMode) : "; No State Machines\n",
    "gameflow.asm": (0, import_gameFlowGenerator.generateGameFlowFile)(analysis, executionPlan),
    "main.asm": (0, import_mainGenerator.generateMainFile)(projectName, analysis, romMode),
    "unitedFiles.asm": ""
  };
  if (config.generateUnified) {
    files["unitedFiles.asm"] = (0, import_unifiedGenerator.generateUnifiedFile)(files, projectName, analysis, executionPlan, {
      romMode,
      targetFormat,
      autoMegaROM
    });
  }
  console.log("\u2705 Modular ASM files generated successfully!");
  console.log(`\u{1F4CA} Generated ${Object.keys(files).filter((k) => files[k]).length} files`);
  console.log("\u{1F4CB} [DEBUG] Files generated:", Object.keys(files));
  console.log("\u{1F3AF} [DEBUG] interrupt.asm length:", files["interrupt.asm"]?.length || "MISSING!");
  return files;
}
function generateModularASMFromSummary(summary, config = {}) {
  console.log("\u{1F527} Generating modular ASM files from summary...");
  console.log(`\u{1F4CA} Summary: ${summary.projectInfo.name}`);
  if (!summary.projectInfo?.name) {
    throw new Error("Summary must contain valid projectInfo.name");
  }
  if (!summary.assets) {
    throw new Error("Summary must contain assets section");
  }
  let analysis;
  try {
    analysis = convertSummaryToAnalysis(summary);
    console.log(`\u{1F50D} Analysis from summary: ${analysis.sprites.length} sprites, ${analysis.tiles.length} tiles`);
  } catch (error) {
    console.error("\u274C Error converting summary:", error);
    throw error;
  }
  const interruptDrivenComponents = config.interruptDrivenComponents ?? true;
  const hardwareMode = config.hardwareMode || "hybrid";
  const optimizeLevel = config.optimizeLevel || "safe";
  console.log(`\u{1F527} Hardware Mode: ${hardwareMode.toUpperCase()}, Optimize: ${optimizeLevel}`);
  const targetFormat = config.targetFormat || "konami";
  const romMode = config.romMode || "simple32k";
  const autoMegaROM = config.autoMegaROM ?? false;
  const executionPlan = buildValidatedExecutionPlan(analysis, config);
  console.log(`[MSX GENERATOR] ROM config: mode=${romMode}, mapper=${targetFormat}, autoMegaROM=${autoMegaROM}`);
  const hasMenus2 = analysis.gameFlow?.nodes?.some((node) => node.type === "SubMenu");
  const hasText2 = analysis.screenMaps?.some(
    (screen) => screen.layers?.text || screen.textElements?.length > 0
  );
  const hasHudElements2 = analysis.screenMaps?.some(
    (screen) => screen.hudConfiguration?.elements && screen.hudConfiguration.elements.length > 0
  );
  const needsFont2 = !!(hasMenus2 || hasText2 || hasHudElements2);
  const fontInPage02 = romMode === "plain48k" && needsFont2;
  const fontInBank42 = romMode === "megarom" && needsFont2;
  const fontRawData2 = fontInPage02 ? (0, import_fontGenerator.getFontRawData)(analysis) : void 0;
  const files = {
    "page0.asm": (0, import_page0Generator.generatePage0File)(analysis, romMode, fontRawData2),
    "bios.asm": (0, import_biosGenerator.generateBIOSFile)({ hardwareMode: { mode: hardwareMode, optimizeLevel } }),
    "constants.asm": (0, import_constantsGenerator.generateConstantsFile)(analysis),
    "variables.asm": (0, import_variablesGenerator.generateVariablesFile)(analysis),
    "mapper.asm": (0, import_mapperGenerator.generateMapperFile)({ targetFormat, romMode, autoMegaROM }),
    "interrupt.asm": (0, import_interruptGenerator.generateInterruptFile)(analysis, { interruptDrivenComponents, romMode }, executionPlan),
    "header.asm": (0, import_headerGenerator.generateHeaderFile)(summary.projectInfo.name, analysis, executionPlan, romMode),
    "patterns.asm": (0, import_patternsGenerator.generatePatternsFile)(analysis, romMode),
    "colors.asm": (0, import_colorsGenerator.generateColorsFile)(analysis, romMode),
    "components.asm": interruptDrivenComponents && romMode !== "megarom" ? "; Components are generated inside interrupt.asm (interruptDrivenComponents=true)\n" : (0, import_componentsGenerator.generateComponentsFile)(analysis, romMode),
    "entities.asm": (0, import_entitiesGenerator.generateEntitiesFile)(analysis),
    "worlds.asm": (0, import_worldGenerator.generateWorldsFile)(analysis),
    "screens.asm": (0, import_screensGenerator.generateScreensFile)(analysis, romMode),
    "sprites.asm": (0, import_spritesGenerator.generateSpritesFile)(analysis, romMode),
    "font.asm": (0, import_fontGenerator.generateFontFile)(analysis, romMode, fontInPage02, fontInBank42),
    "hud.asm": (0, import_hudGenerator.generateHudFile)(analysis),
    "menus.asm": (0, import_menusGenerator.generateMenusFile)(analysis),
    "sound.asm": (0, import_soundGenerator.generateSoundFile)(analysis, executionPlan),
    "scroll.asm": (0, import_scrollGenerator.generateScrollFile)(analysis),
    "animtiles.asm": (0, import_animatedTilesGenerator.generateAnimatedTilesFile)(analysis, romMode),
    "statemachine.asm": analysis.stateMachines && analysis.stateMachines.length > 0 ? (0, import_stateMachineGenerator.generateStateMachineSystem)(analysis.stateMachines, analysis.globalVariables, analysis.sprites, analysis.tiles, analysis.templates, analysis.sounds, analysis.trackIndexByAssetId, romMode) : "; No State Machines\n",
    "gameflow.asm": (0, import_gameFlowGenerator.generateGameFlowFile)(analysis, executionPlan),
    "main.asm": (0, import_mainGenerator.generateMainFile)(summary.projectInfo.name, analysis, romMode),
    "unitedFiles.asm": ""
  };
  if (config.generateUnified) {
    files["unitedFiles.asm"] = (0, import_unifiedGenerator.generateUnifiedFile)(files, summary.projectInfo.name, analysis, executionPlan, {
      romMode,
      targetFormat,
      autoMegaROM
    });
  }
  console.log("\u2705 Modular ASM files from summary generated successfully!");
  return files;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generateModularASM,
  generateModularASMFromSummary
});
