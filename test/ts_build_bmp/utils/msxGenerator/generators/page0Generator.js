"use strict";
/**
 * @fileoverview Page 0 Generator - linear 48K page-0 cold data groups
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAGE0_BUDGET_BYTES = void 0;
exports.buildPage0Plan = buildPage0Plan;
exports.presentationScreenUsesPage0Group = presentationScreenUsesPage0Group;
exports.fontDataUsesPage0Group = fontDataUsesPage0Group;
exports.screenRuntimeDataUsesPage0Group = screenRuntimeDataUsesPage0Group;
exports.hasPage0DataGroups = hasPage0DataGroups;
exports.page0NeedsZx0Decoder = page0NeedsZx0Decoder;
exports.formatPage0PlanComments = formatPage0PlanComments;
exports.generatePage0File = generatePage0File;
const screenUtils_1 = require("../../../components/utils/screenUtils");
const blockMapBuilder_1 = require("../../screenOptimization/blockMapBuilder");
const screen2TileBanks_1 = require("../utils/screen2TileBanks");
exports.PAGE0_BUDGET_BYTES = 16 * 1024;
const SCREEN_WIDTH = 32;
const SCREEN_HEIGHT = 24;
const ASM_BYTES_PER_LINE = 16;
const EMPTY_PAGE0_PLAN = {
    budgetBytes: exports.PAGE0_BUDGET_BYTES,
    usedBytes: 0,
    remainingBytes: exports.PAGE0_BUDGET_BYTES,
    selectedGroups: [],
    rejectedGroups: [],
};
function hasValidPresentationScreenData(analysis) {
    const config = analysis.presentationScreen;
    if (!config?.enabled)
        return false;
    return Array.isArray(config.data?.nameTable) && config.data.nameTable.length === (SCREEN_WIDTH * SCREEN_HEIGHT);
}
function getPresentationScreenTotalBytes(analysis) {
    const config = analysis.presentationScreen;
    if (!config?.data)
        return 0;
    return [
        config.data.nameTable,
        config.data.patternBank0,
        config.data.patternBank1,
        config.data.patternBank2,
        config.data.colorBank0,
        config.data.colorBank1,
        config.data.colorBank2,
    ].reduce((total, bytes) => total + (Array.isArray(bytes) ? bytes.length : 0), 0);
}
function screenRuntimeGroupId(screenIndex) {
    return `screenRuntime:${screenIndex}`;
}
function sanitizeScreenName(value, fallback) {
    const cleaned = String(value || '')
        .trim()
        .replace(/[^A-Z0-9]/gi, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toUpperCase();
    return cleaned || fallback;
}
function resolveTileBankDefinitions(screen, analysis) {
    return (0, screen2TileBanks_1.resolveRuntimeScreen2TileBankDefinitions)(analysis, screen.tileBankAssetId);
}
function buildLayerLayoutBytes(screen, layerName, analysis, tileBankDefinitions) {
    const exportScreen = {
        ...screen,
        activeAreaX: 0,
        activeAreaY: 0,
        activeAreaWidth: SCREEN_WIDTH,
        activeAreaHeight: SCREEN_HEIGHT,
        layers: {
            ...screen.layers,
            background: screen.layers[layerName],
        },
    };
    return Array.from((0, screenUtils_1.generateScreenMapLayoutBytes)(exportScreen, analysis.tiles || [], tileBankDefinitions, 'SCREEN 2 (Graphics I)'));
}
function buildBehaviorMapDataFromCollisionLayer(screen, analysis) {
    const collisionLayer = screen.layers.collision || [];
    const behaviorMapData = [];
    const collisionRows = collisionLayer.length;
    const collisionCols = collisionLayer[0]?.length ?? 0;
    const tileById = new Map((analysis.tiles || []).map((tile) => [tile.id, tile]));
    for (let row = 0; row < SCREEN_HEIGHT; row++) {
        for (let col = 0; col < SCREEN_WIDTH; col++) {
            const srcRow = collisionRows > 0
                ? Math.min(collisionRows - 1, Math.floor((row * collisionRows) / SCREEN_HEIGHT))
                : 0;
            const srcCol = collisionCols > 0
                ? Math.min(collisionCols - 1, Math.floor((col * collisionCols) / SCREEN_WIDTH))
                : 0;
            behaviorMapData.push((0, screenUtils_1.encodeBehaviorByteFromLogicalProperties)((0, screenUtils_1.getScreenTileLogicalProperties)(collisionLayer[srcRow]?.[srcCol], tileById)));
        }
    }
    return behaviorMapData;
}
function buildBehaviorMapDataFromBackgroundLayer(screen, analysis) {
    const backgroundLayer = screen.layers.background || [];
    const behaviorMapData = [];
    const tileById = new Map((analysis.tiles || []).map((tile) => [tile.id, tile]));
    for (let row = 0; row < SCREEN_HEIGHT; row++) {
        for (let col = 0; col < SCREEN_WIDTH; col++) {
            behaviorMapData.push((0, screenUtils_1.encodeBehaviorByteFromLogicalProperties)((0, screenUtils_1.getScreenTileLogicalProperties)(backgroundLayer[row]?.[col], tileById)));
        }
    }
    return behaviorMapData;
}
function buildInteractionTargetIdMap(analysis) {
    const targetIdByKey = new Map();
    const globalVariables = Array.isArray(analysis.globalVariables)
        ? analysis.globalVariables
        : [];
    let nextId = 1;
    for (const variable of globalVariables) {
        const name = typeof variable?.name === 'string' ? variable.name.trim() : '';
        const asmName = typeof variable?.asmName === 'string' ? variable.asmName.trim() : '';
        if (!asmName)
            continue;
        const existingId = targetIdByKey.get(asmName) ?? targetIdByKey.get(asmName.toLowerCase());
        const targetId = existingId ?? nextId++;
        targetIdByKey.set(asmName, targetId);
        targetIdByKey.set(asmName.toLowerCase(), targetId);
        if (name) {
            targetIdByKey.set(name, targetId);
            targetIdByKey.set(name.toLowerCase(), targetId);
        }
    }
    return targetIdByKey;
}
function buildScreenRuntimePage0Candidates(analysis) {
    const screens = Array.isArray(analysis.screenMaps) ? analysis.screenMaps : [];
    if (screens.length === 0)
        return [];
    const interactionTargetIdMap = buildInteractionTargetIdMap(analysis);
    return screens
        .map((screen, index) => {
        const screenName = sanitizeScreenName(screen.name, `SCREEN_${index}`);
        const tileBankDefinitions = resolveTileBankDefinitions(screen, analysis);
        const backgroundLayoutBytes = buildLayerLayoutBytes(screen, 'background', analysis, tileBankDefinitions);
        const backgroundBlockMap = (0, blockMapBuilder_1.buildScreenBlockMapFromBytes)({
            bytes: backgroundLayoutBytes,
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
            mode: screen.blockOptimization?.backgroundMode,
        });
        const effectsLayoutBytes = buildLayerLayoutBytes(screen, 'effects', analysis, tileBankDefinitions);
        const interactionMaps = (0, screenUtils_1.buildScreenInteractionMaps)(screen, analysis.tiles || []);
        const interactionTargetMap = interactionMaps.targetMap.map((targetRef) => {
            if (typeof targetRef !== 'string')
                return 0;
            const trimmed = targetRef.trim();
            if (!trimmed)
                return 0;
            return interactionTargetIdMap.get(trimmed) ?? interactionTargetIdMap.get(trimmed.toLowerCase()) ?? 0;
        });
        const behaviorSource = (0, screenUtils_1.resolveScreenBehaviorSource)(screen);
        const blocks = [];
        if (backgroundBlockMap) {
            blocks.push({
                label: `SCREEN_${screenName}_${index}_BLOCK_CATALOG`,
                bytes: backgroundBlockMap.catalogFlatBytes,
                comments: [`${screen.name} - block catalog`, `Packed into page 0 group for plain48k layout.`],
            });
            blocks.push({
                label: `SCREEN_${screenName}_${index}_BLOCK_MAP`,
                bytes: backgroundBlockMap.mapIndices,
                comments: [`${screen.name} - block index map`, `Packed into page 0 group for plain48k layout.`],
            });
        }
        else {
            blocks.push({
                label: `SCREEN_${screenName}_${index}_LAYOUT`,
                bytes: backgroundLayoutBytes,
                comments: [`${screen.name} - background layout`, `Packed into page 0 group for plain48k layout.`],
            });
        }
        blocks.push({
            label: `SCREEN_${screenName}_${index}_EFFECTS_LAYOUT`,
            bytes: effectsLayoutBytes,
            comments: [`${screen.name} - effects layout`, `Copied from page 0 to runtime_effects_layout on screen load.`],
        });
        if (behaviorSource === 'backgroundChars') {
            blocks.push({
                label: `BEHAVIOR_${screenName}_${index}_DATA`,
                bytes: buildBehaviorMapDataFromBackgroundLayer(screen, analysis),
                comments: [
                    `${screen.name} - per-cell behavior map`,
                    `Copied from page 0 to runtime_behavior_map on screen load.`,
                ],
            });
            blocks.push({
                label: `SCREEN_${screenName}_${index}_CHAR_BEHAVIOR_TABLE`,
                bytes: (0, screenUtils_1.buildScreenCharBehaviorTable)({
                    ...screen,
                    activeAreaX: 0,
                    activeAreaY: 0,
                    activeAreaWidth: SCREEN_WIDTH,
                    activeAreaHeight: SCREEN_HEIGHT,
                }, analysis.tiles || [], tileBankDefinitions, 'SCREEN 2 (Graphics I)'),
                comments: [`${screen.name} - background char -> behavior lookup table`],
            });
        }
        else {
            blocks.push({
                label: `BEHAVIOR_${screenName}_${index}_DATA`,
                bytes: buildBehaviorMapDataFromCollisionLayer(screen, analysis),
                comments: [`${screen.name} - behavior map`, `Copied from page 0 to runtime_behavior_map on screen load.`],
            });
        }
        blocks.push({
            label: `SCREEN_${screenName}_${index}_INTERACTION_TYPE_MAP`,
            bytes: interactionMaps.typeMap,
            comments: [`${screen.name} - per-cell interaction type map`],
        });
        blocks.push({
            label: `SCREEN_${screenName}_${index}_INTERACTION_VALUE_MAP`,
            bytes: interactionMaps.valueMap,
            comments: [`${screen.name} - per-cell interaction value map`],
        });
        blocks.push({
            label: `SCREEN_${screenName}_${index}_INTERACTION_TARGET_MAP`,
            bytes: interactionTargetMap,
            comments: [`${screen.name} - per-cell interaction target map`],
        });
        const sizeBytes = blocks.reduce((total, block) => total + block.bytes.length, 0);
        return {
            screenIndex: index,
            screenName,
            displayName: screen.name || `Screen ${index}`,
            sizeBytes,
            blocks,
        };
    })
        .filter(candidate => candidate.sizeBytes > 0);
}
function buildPage0Plan(analysis, romMode = 'simple32k', fontRawData) {
    if (romMode !== 'plain48k') {
        return EMPTY_PAGE0_PLAN;
    }
    const plan = {
        budgetBytes: exports.PAGE0_BUDGET_BYTES,
        usedBytes: 0,
        remainingBytes: exports.PAGE0_BUDGET_BYTES,
        selectedGroups: [],
        rejectedGroups: [],
    };
    // Group: Presentation Screen (priority 10)
    if (hasValidPresentationScreenData(analysis)) {
        const presentationScreen = analysis.presentationScreen;
        const mode = presentationScreen.runtime?.romDataGroup ?? 'auto';
        const sizeBytes = getPresentationScreenTotalBytes(analysis);
        const baseGroup = {
            id: 'presentationScreen',
            label: 'Presentation Screen',
            sizeBytes,
            priority: 10,
        };
        if (mode === 'default') {
            plan.rejectedGroups.push({
                ...baseGroup,
                mode,
                reason: 'Asset override keeps this group in the standard ROM area.',
            });
        }
        else if (sizeBytes <= plan.remainingBytes) {
            plan.selectedGroups.push({
                ...baseGroup,
                mode,
                reason: mode === 'page0'
                    ? 'Forced into page 0 by asset override.'
                    : 'Auto-packed into page 0 as highest-priority cold data.',
            });
            plan.usedBytes += sizeBytes;
            plan.remainingBytes -= sizeBytes;
        }
        else {
            plan.rejectedGroups.push({
                ...baseGroup,
                mode,
                reason: mode === 'page0'
                    ? `Forced page 0 placement requested, but ${sizeBytes} bytes exceeds remaining budget.`
                    : `Auto-pack skipped because ${sizeBytes} bytes exceeds remaining page-0 budget.`,
            });
        }
    }
    // Group: per-screen runtime data (priority 8) - copied to RAM on screen load.
    for (const screenCandidate of buildScreenRuntimePage0Candidates(analysis)) {
        const mode = 'auto';
        const baseGroup = {
            id: screenRuntimeGroupId(screenCandidate.screenIndex),
            label: `Screen Runtime Data (${screenCandidate.displayName})`,
            sizeBytes: screenCandidate.sizeBytes,
            priority: 8,
        };
        if (screenCandidate.sizeBytes <= plan.remainingBytes) {
            plan.selectedGroups.push({
                ...baseGroup,
                mode,
                reason: 'Auto-packed into page 0; copied to RAM during screen load.',
            });
            plan.usedBytes += screenCandidate.sizeBytes;
            plan.remainingBytes -= screenCandidate.sizeBytes;
        }
        else {
            plan.rejectedGroups.push({
                ...baseGroup,
                mode,
                reason: `Auto-pack skipped because ${screenCandidate.sizeBytes} bytes exceeds remaining page-0 budget.`,
            });
        }
    }
    // Group: Font Data (priority 5) — moved to page0 to free space in main ROM
    if (fontRawData && fontRawData.patternBytes.length > 0) {
        const sizeBytes = fontRawData.patternBytes.length + fontRawData.colorBytes.length;
        const baseGroup = {
            id: 'fontData',
            label: 'Font Data (patterns + colors)',
            sizeBytes,
            priority: 5,
        };
        if (sizeBytes <= plan.remainingBytes) {
            plan.selectedGroups.push({
                ...baseGroup,
                mode: 'auto',
                reason: 'Auto-packed into page 0 to free space in main plain48k ROM.',
            });
            plan.usedBytes += sizeBytes;
            plan.remainingBytes -= sizeBytes;
        }
        else {
            plan.rejectedGroups.push({
                ...baseGroup,
                mode: 'auto',
                reason: `Auto-pack skipped because ${sizeBytes} bytes exceeds remaining page-0 budget.`,
            });
        }
    }
    return plan;
}
function generateRawByteBlock(label, bytes, comments = []) {
    let asm = '';
    if (comments.length > 0) {
        asm += comments.map(comment => `; ${comment}`).join('\n') + '\n';
    }
    asm += `${label}:\n`;
    if (!Array.isArray(bytes) || bytes.length === 0) {
        asm += '    DB #00\n';
        return asm;
    }
    for (let i = 0; i < bytes.length; i += ASM_BYTES_PER_LINE) {
        const chunk = bytes.slice(i, i + ASM_BYTES_PER_LINE);
        const formatted = chunk.map(value => `#${value.toString(16).padStart(2, '0').toUpperCase()}`);
        asm += `    DB ${formatted.join(',')}\n`;
    }
    return asm;
}
function presentationScreenUsesPage0Group(analysis, romMode = 'plain48k') {
    return buildPage0Plan(analysis, romMode).selectedGroups.some(group => group.id === 'presentationScreen');
}
function fontDataUsesPage0Group(analysis, romMode = 'plain48k', fontRawData) {
    return buildPage0Plan(analysis, romMode, fontRawData).selectedGroups.some(group => group.id === 'fontData');
}
function screenRuntimeDataUsesPage0Group(analysis, romMode = 'plain48k', screenIndex, fontRawData) {
    return buildPage0Plan(analysis, romMode, fontRawData).selectedGroups.some(group => group.id === screenRuntimeGroupId(screenIndex));
}
function hasPage0DataGroups(analysis, romMode = 'simple32k', fontRawData) {
    return buildPage0Plan(analysis, romMode, fontRawData).selectedGroups.length > 0;
}
function page0NeedsZx0Decoder(analysis, romMode = 'simple32k', fontRawData) {
    const page0Plan = buildPage0Plan(analysis, romMode, fontRawData);
    // Font data in page0 is always ZX0-compressed by server.js
    if (fontRawData && page0Plan.selectedGroups.some(group => group.id === 'fontData')) {
        return true;
    }
    // Screen runtime blobs packed into page 0 are also ZX0-compressed by
    // server.js. The screen loader then calls page0_decompress_to_ram for
    // layout/catalog/map/effects blocks, so the helper must be real.
    if (page0Plan.selectedGroups.some(group => String(group.id).startsWith('screenRuntime:'))) {
        return true;
    }
    if (page0Plan.selectedGroups.some(group => group.id === 'presentationScreen')) {
        const compression = analysis.presentationScreen?.compression;
        return !!(compression?.compressNameTable ||
            compression?.compressPatterns ||
            compression?.compressColors);
    }
    return false;
}
function formatPage0PlanComments(plan) {
    const lines = [
        '; Page 0 Budget Planner',
        `; Budget: ${plan.budgetBytes} bytes`,
        `; Used: ${plan.usedBytes} bytes`,
        `; Remaining: ${plan.remainingBytes} bytes`,
    ];
    if (plan.selectedGroups.length > 0) {
        lines.push('; Selected groups:');
        lines.push(...plan.selectedGroups.map(group => `; - ${group.label}: ${group.sizeBytes} bytes [${group.mode}] ${group.reason}`));
    }
    else {
        lines.push('; Selected groups: none');
    }
    if (plan.rejectedGroups.length > 0) {
        lines.push('; Skipped groups:');
        lines.push(...plan.rejectedGroups.map(group => `; - ${group.label}: ${group.sizeBytes} bytes [${group.mode}] ${group.reason}`));
    }
    return lines.join('\n');
}
function generatePage0File(analysis, romMode = 'simple32k', fontRawData) {
    const plan = buildPage0Plan(analysis, romMode, fontRawData);
    if (plan.selectedGroups.length === 0) {
        return `; ==================================================================
; PAGE 0 DATA GROUPS
; File: page0.asm
; Description: No cold data groups selected for page 0
; ==================================================================
${formatPage0PlanComments(plan)}
`;
    }
    let code = `; ==================================================================
; PAGE 0 DATA GROUPS
; File: page0.asm
; Description: Cold data packed in the 0000h-3FFFh window for linear 48K ROMs
; ==================================================================

${formatPage0PlanComments(plan)}

`;
    // Presentation Screen group
    if (plan.selectedGroups.some(g => g.id === 'presentationScreen')) {
        const config = analysis.presentationScreen;
        code += `; ------------------------------------------------------------------
; Group: Presentation Screen
; PRESENTATION_SCREEN_ROM_DATA_GROUP: page0
; ------------------------------------------------------------------

`;
        code += generateRawByteBlock('PRESENTATION_SCREEN_NAMETBL', config.data.nameTable, [
            `${config.name} - Name table (32x24)`,
            'Packed into page 0 group for plain48k layout.'
        ]);
        code += '\n';
        code += generateRawByteBlock('PRESENTATION_SCREEN_PATTERNS_B0', config.data.patternBank0, [
            `${config.name} - Pattern bank 0`,
        ]);
        code += '\n';
        code += generateRawByteBlock('PRESENTATION_SCREEN_PATTERNS_B1', config.data.patternBank1, [
            `${config.name} - Pattern bank 1`,
        ]);
        code += '\n';
        code += generateRawByteBlock('PRESENTATION_SCREEN_PATTERNS_B2', config.data.patternBank2, [
            `${config.name} - Pattern bank 2`,
        ]);
        code += '\n';
        code += generateRawByteBlock('PRESENTATION_SCREEN_COLORS_B0', config.data.colorBank0, [
            `${config.name} - Color bank 0`,
        ]);
        code += '\n';
        code += generateRawByteBlock('PRESENTATION_SCREEN_COLORS_B1', config.data.colorBank1, [
            `${config.name} - Color bank 1`,
        ]);
        code += '\n';
        code += generateRawByteBlock('PRESENTATION_SCREEN_COLORS_B2', config.data.colorBank2, [
            `${config.name} - Color bank 2`,
        ]);
        code += '\n';
    }
    // Font Data group
    if (fontRawData && plan.selectedGroups.some(g => g.id === 'fontData')) {
        code += `; ------------------------------------------------------------------
; Group: Font Data
; FONT_DATA_ROM_DATA_GROUP: page0
; server.js will ZX0-compress these blobs and patch init_font_system
; to call page0_decompress_to_ram instead of dzx0_standard.
; ------------------------------------------------------------------

`;
        code += generateRawByteBlock('FONT_PATTERN_DATA', fontRawData.patternBytes, [
            'Font pattern data (raw, ZX0-compressed by server.js)',
        ]);
        code += '\n';
        code += generateRawByteBlock('FONT_COLOR_DATA', fontRawData.colorBytes, [
            'Font color attribute data (raw, ZX0-compressed by server.js)',
        ]);
        code += '\n';
    }
    // Per-screen runtime data groups
    for (const screenCandidate of buildScreenRuntimePage0Candidates(analysis)) {
        if (!plan.selectedGroups.some(g => g.id === screenRuntimeGroupId(screenCandidate.screenIndex))) {
            continue;
        }
        code += `; ------------------------------------------------------------------
; Group: Screen Runtime Data (${screenCandidate.displayName})
; SCREEN_RUNTIME_DATA_ROM_DATA_GROUP: page0
; Copied to RAM during load_screen_*; not read directly during gameplay.
; ------------------------------------------------------------------

`;
        for (const block of screenCandidate.blocks) {
            code += generateRawByteBlock(block.label, block.bytes, block.comments);
            code += '\n';
        }
    }
    return code;
}
