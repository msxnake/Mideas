"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeGlobalVariableName = normalizeGlobalVariableName;
exports.buildGlobalVariableAsmName = buildGlobalVariableAsmName;
exports.buildGlobalVariableConstantPrefix = buildGlobalVariableConstantPrefix;
exports.getAllGlobalVariables = getAllGlobalVariables;
exports.getGlobalVariableByName = getGlobalVariableByName;
exports.getCustomGlobalVariables = getCustomGlobalVariables;
exports.getUsedGlobalVariables = getUsedGlobalVariables;
const constants_1 = require("../constants");
function normalizeGlobalVariableName(rawName) {
    const trimmedName = typeof rawName === 'string' ? rawName.trim() : '';
    if (!trimmedName)
        return '';
    const builtInVariable = constants_1.MIDEAS_GLOBAL_VARIABLES.find(variable => variable.name.toLowerCase() === trimmedName.toLowerCase());
    return builtInVariable ? builtInVariable.name : trimmedName;
}
function buildGlobalVariableAsmName(variableName) {
    const normalizedName = normalizeGlobalVariableName(variableName);
    return `global_var_${normalizedName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')}`;
}
function buildGlobalVariableConstantPrefix(variableName) {
    const normalizedName = normalizeGlobalVariableName(variableName);
    return `${normalizedName.replace(/[^A-Za-z0-9]/g, '_').toUpperCase()}_`;
}
/**
 * Merges default MIDEAS global variables with custom project-specific variables.
 * Custom variables override defaults if they share the same name.
 *
 * @param assets - Array of project assets
 * @returns Combined array of global variables (defaults + custom)
 */
function getAllGlobalVariables(assets) {
    const globalVarsAssets = assets.filter(asset => asset.type === 'globalvariables' && asset.data);
    if (globalVarsAssets.length === 0) {
        // No custom variables, return only defaults
        return [...constants_1.MIDEAS_GLOBAL_VARIABLES];
    }
    // Create a map to avoid duplicates (custom overrides default)
    const variablesMap = new Map();
    // Add default variables first
    constants_1.MIDEAS_GLOBAL_VARIABLES.forEach(variable => {
        const normalizedName = normalizeGlobalVariableName(variable.name);
        variablesMap.set(normalizedName, { ...variable, name: normalizedName });
    });
    // Add/override with custom variables from every GlobalVariables asset.
    // Later assets override earlier ones when names collide because globals
    // share one runtime namespace.
    globalVarsAssets.forEach(asset => {
        const customVariables = asset.data.customVariables || [];
        customVariables.forEach((variable) => {
            const normalizedName = normalizeGlobalVariableName(variable.name);
            if (!normalizedName)
                return;
            variablesMap.set(normalizedName, {
                ...variable,
                name: normalizedName,
                asmName: buildGlobalVariableAsmName(normalizedName),
                constantPrefix: variable.constantPrefix || buildGlobalVariableConstantPrefix(normalizedName),
            });
        });
    });
    // Return as array, preserving order (defaults first, then new custom ones)
    const defaultNames = constants_1.MIDEAS_GLOBAL_VARIABLES.map(v => normalizeGlobalVariableName(v.name));
    const result = [];
    // First add all that exist in defaults (whether overridden or not)
    defaultNames.forEach(name => {
        const variable = variablesMap.get(name);
        if (variable) {
            result.push(variable);
            variablesMap.delete(name);
        }
    });
    // Then add any new custom variables not in defaults
    variablesMap.forEach(variable => {
        result.push(variable);
    });
    return result;
}
/**
 * Gets a specific global variable by name from the merged list
 */
function getGlobalVariableByName(assets, variableName) {
    const allVariables = getAllGlobalVariables(assets);
    const normalizedName = normalizeGlobalVariableName(variableName);
    return allVariables.find(v => normalizeGlobalVariableName(v.name) === normalizedName);
}
/**
 * Gets only the custom variables created by the user in the GlobalVariables asset.
 * Does NOT include the default MIDEAS variables.
 *
 * @param assets - Array of project assets
 * @returns Array of only custom user-defined global variables
 */
function getCustomGlobalVariables(assets) {
    const globalVarsAssets = assets.filter(asset => asset.type === 'globalvariables' && asset.data);
    if (globalVarsAssets.length === 0) {
        return [];
    }
    const normalizedVariables = new Map();
    globalVarsAssets.forEach(asset => {
        const customVariables = asset.data.customVariables || [];
        customVariables.forEach((variable) => {
            const normalizedName = normalizeGlobalVariableName(variable.name);
            if (!normalizedName)
                return;
            normalizedVariables.set(normalizedName, {
                ...variable,
                name: normalizedName,
                asmName: buildGlobalVariableAsmName(normalizedName),
                constantPrefix: variable.constantPrefix || buildGlobalVariableConstantPrefix(normalizedName),
            });
        });
    });
    return Array.from(normalizedVariables.values());
}
/**
 * Detects which global variables are actually used in the project
 * by scanning entities, behaviors, state machines, and custom code.
 *
 * @param assets - Array of project assets
 * @returns Array of only the global variables that are referenced in the project
 */
function getUsedGlobalVariables(assets) {
    const allVariables = getAllGlobalVariables(assets);
    // If no variables defined, return empty array
    if (allVariables.length === 0) {
        return [];
    }
    // Collect all code snippets from the project
    const codeSnippets = [];
    // 1. Extract code from entities (behaviors)
    const screenMaps = assets.filter(a => a.type === 'screenmap');
    screenMaps.forEach(screenMap => {
        const entities = screenMap.data?.layers?.entities || [];
        entities.forEach((entity) => {
            // Check Behavior component
            if (entity.components?.Behavior?.behaviorCode) {
                codeSnippets.push(entity.components.Behavior.behaviorCode);
            }
        });
    });
    const msx2Screens = assets.filter(a => a.type === 'msx2screen');
    msx2Screens.forEach(screen => {
        const entities = screen.data?.layers?.entities || [];
        entities.forEach((entity) => {
            const components = entity?.components || {};
            Object.values(components).forEach((component) => {
                if (typeof component?.behaviorCode === 'string')
                    codeSnippets.push(component.behaviorCode);
                if (typeof component?.customCode === 'string')
                    codeSnippets.push(component.customCode);
                if (typeof component?.script === 'string')
                    codeSnippets.push(component.script);
            });
        });
    });
    // 2. Extract code from StateMachine nodes AND variable references from IfThenElse and Globals nodes
    const gameFlowAsset = assets.find(a => a.type === 'gameflow');
    const ifThenElseVariableNames = new Set();
    const globalsVariableNames = new Set();
    const initGlobalsVariableNames = new Set();
    const tileCollectorVariableNames = new Set();
    const hudVariableNames = new Set();
    const addInitGlobalVariableName = (rawValue) => {
        if (typeof rawValue !== 'string')
            return;
        const variableName = normalizeGlobalVariableName(rawValue);
        if (!variableName)
            return;
        initGlobalsVariableNames.add(variableName);
    };
    const addHudVariableName = (rawValue) => {
        if (typeof rawValue !== 'string')
            return;
        const variableName = normalizeGlobalVariableName(rawValue);
        if (!variableName)
            return;
        hudVariableNames.add(variableName);
    };
    const addHudPlaceholderVariableNames = (rawText) => {
        if (typeof rawText !== 'string' || !rawText.includes('{{'))
            return;
        const placeholderRegex = /\{\{\s*([^{}]+?)\s*\}\}/g;
        for (const match of rawText.matchAll(placeholderRegex)) {
            addHudVariableName(match[1]);
        }
    };
    if (gameFlowAsset?.data) {
        const gameFlow = gameFlowAsset.data;
        if (gameFlow.nodes && Array.isArray(gameFlow.nodes)) {
            gameFlow.nodes.forEach((node) => {
                // StateMachine nodes have customCode
                if (node.type === 'StateMachine' && node.data?.customCode) {
                    codeSnippets.push(node.data.customCode);
                }
                // IfThenElse nodes reference global variables by name
                if (node.type === 'IfThenElse' && node.variableName) {
                    const normalizedName = normalizeGlobalVariableName(node.variableName);
                    if (normalizedName) {
                        ifThenElseVariableNames.add(normalizedName);
                    }
                }
                // Globals nodes set global variables
                if (node.type === 'Globals' && node.variables && Array.isArray(node.variables)) {
                    node.variables.forEach((varAssignment) => {
                        if (varAssignment.variableName) {
                            const normalizedName = normalizeGlobalVariableName(varAssignment.variableName);
                            if (normalizedName) {
                                globalsVariableNames.add(normalizedName);
                            }
                        }
                    });
                }
                if ((node.type === 'Start' || node.type === 'WorldLink') && node.initializeGlobals?.variables && Array.isArray(node.initializeGlobals.variables)) {
                    node.initializeGlobals.variables.forEach((varAssignment) => {
                        addInitGlobalVariableName(varAssignment?.variableName);
                    });
                }
            });
        }
    }
    // 3. Extract code from component definitions
    const componentDefs = assets.filter(a => a.type === 'componentdefinition');
    componentDefs.forEach(comp => {
        const compData = comp.data;
        if (compData.customCode) {
            codeSnippets.push(compData.customCode);
        }
    });
    // 3.5. Extract global variable references from Tile Collector configuration
    const addTileCollectorVariableName = (rawValue) => {
        if (typeof rawValue !== 'string')
            return;
        const variableName = normalizeGlobalVariableName(rawValue);
        if (!variableName)
            return;
        tileCollectorVariableNames.add(variableName);
    };
    screenMaps.forEach(screenMap => {
        const entities = screenMap.data?.layers?.entities || [];
        entities.forEach((entity) => {
            addTileCollectorVariableName(entity?.componentOverrides?.comp_tile_collector?.targetVariable);
            addTileCollectorVariableName(entity?.componentOverrides?.comp_tile_collector?.flagVariable);
        });
        const hudElements = screenMap.data?.hudConfiguration?.elements || [];
        hudElements.forEach((element) => {
            const hudType = String(element?.type || '').toLowerCase();
            if (hudType === 'score') {
                hudVariableNames.add(normalizeGlobalVariableName('Score'));
            }
            else if (hudType === 'lives') {
                hudVariableNames.add(normalizeGlobalVariableName('Lives'));
            }
            addHudVariableName(element?.details?.variableName);
            addHudVariableName(element?.details?.globalVariableName);
            addHudVariableName(element?.details?.bindingVariable);
            addHudPlaceholderVariableNames(element?.text);
            addHudPlaceholderVariableNames(element?.name);
        });
    });
    msx2Screens.forEach(screen => {
        const entities = screen.data?.layers?.entities || [];
        entities.forEach((entity) => {
            Object.values(entity?.components || {}).forEach((component) => {
                addTileCollectorVariableName(component?.targetVariable);
                addTileCollectorVariableName(component?.flagVariable);
            });
        });
    });
    const templates = assets.filter(a => a.type === 'entitytemplate');
    templates.forEach(templateAsset => {
        const template = templateAsset.data;
        const tileCollectorComp = template?.components?.find((c) => c.definitionId === 'comp_tile_collector');
        addTileCollectorVariableName(tileCollectorComp?.defaultValues?.targetVariable);
        addTileCollectorVariableName(tileCollectorComp?.defaultValues?.flagVariable);
    });
    // 4. Detect which variables are used
    const usedVariables = [];
    const usedVariableNames = new Set();
    allVariables.forEach(variable => {
        const normalizedVariableName = normalizeGlobalVariableName(variable.name);
        // Check 1: Variable's asmName appears in any code snippet
        const isUsedInCode = codeSnippets.some(code => {
            // Match the asmName as a whole word (not part of another identifier)
            const regex = new RegExp(`\\b${variable.asmName}\\b`, 'i');
            return regex.test(code);
        });
        // Check 2: Variable is referenced by an IfThenElse node
        const isUsedInIfThenElse = ifThenElseVariableNames.has(normalizedVariableName);
        // Check 3: Variable is set by a Globals node
        const isUsedInGlobals = globalsVariableNames.has(normalizedVariableName);
        const isUsedInInitGlobals = initGlobalsVariableNames.has(normalizedVariableName);
        const isUsedInTileCollector = tileCollectorVariableNames.has(normalizedVariableName);
        const isUsedInHud = hudVariableNames.has(normalizedVariableName);
        if ((isUsedInCode || isUsedInIfThenElse || isUsedInGlobals || isUsedInInitGlobals || isUsedInTileCollector || isUsedInHud) && !usedVariableNames.has(normalizedVariableName)) {
            usedVariables.push(variable);
            usedVariableNames.add(normalizedVariableName);
        }
    });
    // 5. Add any missing variables referenced in Globals nodes that weren't in allVariables
    globalsVariableNames.forEach(varName => {
        const normalizedName = normalizeGlobalVariableName(varName);
        if (!usedVariableNames.has(normalizedName)) {
            // Create a default variable for this undefined name
            const asmName = buildGlobalVariableAsmName(normalizedName);
            usedVariables.push({
                name: normalizedName,
                asmName: asmName,
                constantPrefix: buildGlobalVariableConstantPrefix(normalizedName),
                type: '8bit',
                description: `Auto-generated variable from Globals node`,
                values: [{ label: '0', value: 0 }],
                category: 'special'
            });
            usedVariableNames.add(normalizedName);
        }
    });
    // 6b. Add any missing variables referenced by Start/WorldLink initialization
    initGlobalsVariableNames.forEach(varName => {
        const normalizedName = normalizeGlobalVariableName(varName);
        if (!usedVariableNames.has(normalizedName)) {
            const asmName = buildGlobalVariableAsmName(normalizedName);
            usedVariables.push({
                name: normalizedName,
                asmName,
                constantPrefix: buildGlobalVariableConstantPrefix(normalizedName),
                type: '8bit',
                description: 'Auto-generated variable from node initialization',
                values: [{ label: '0', value: 0 }],
                category: 'special'
            });
            usedVariableNames.add(normalizedName);
        }
    });
    // 6. Add any missing variables referenced in IfThenElse nodes that weren't in allVariables
    ifThenElseVariableNames.forEach(varName => {
        const normalizedName = normalizeGlobalVariableName(varName);
        if (!usedVariableNames.has(normalizedName)) {
            // Create a default variable for this undefined name
            const asmName = buildGlobalVariableAsmName(normalizedName);
            usedVariables.push({
                name: normalizedName,
                asmName: asmName,
                constantPrefix: buildGlobalVariableConstantPrefix(normalizedName),
                type: '8bit',
                description: `Auto-generated variable from IfThenElse node`,
                values: [{ label: '0', value: 0 }],
                category: 'special'
            });
            usedVariableNames.add(normalizedName);
        }
    });
    // 7. Add any missing variables referenced by Tile Collector that weren't in allVariables
    tileCollectorVariableNames.forEach(varName => {
        const normalizedName = normalizeGlobalVariableName(varName);
        if (!usedVariableNames.has(normalizedName)) {
            const asmName = buildGlobalVariableAsmName(normalizedName);
            usedVariables.push({
                name: normalizedName,
                asmName: asmName,
                constantPrefix: buildGlobalVariableConstantPrefix(normalizedName),
                type: '8bit',
                description: `Auto-generated variable from Tile Collector`,
                values: [{ label: '0', value: 0 }],
                category: 'special'
            });
            usedVariableNames.add(normalizedName);
        }
    });
    // 8. Add any missing variables referenced by HUD bindings/placeholders
    hudVariableNames.forEach(varName => {
        const normalizedName = normalizeGlobalVariableName(varName);
        if (!usedVariableNames.has(normalizedName)) {
            const asmName = buildGlobalVariableAsmName(normalizedName);
            usedVariables.push({
                name: normalizedName,
                asmName: asmName,
                constantPrefix: buildGlobalVariableConstantPrefix(normalizedName),
                type: '8bit',
                description: `Auto-generated variable from HUD binding`,
                values: [{ label: '0', value: 0 }],
                category: 'special'
            });
            usedVariableNames.add(normalizedName);
        }
    });
    return usedVariables;
}
