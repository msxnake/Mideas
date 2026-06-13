"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeMsx2PlayerUpdate = exports.parseMsx2PlayerImport = exports.buildDetailedMsx2PlayerDocument = exports.MSX2_PLAYER_DOCUMENT_VERSION = exports.MSX2_PLAYER_DOCUMENT_SCHEMA = void 0;
const msx2PlayerDefaults_1 = require("./msx2PlayerDefaults");
const msx2PlayerImport_1 = require("./msx2PlayerImport");
Object.defineProperty(exports, "parseMsx2PlayerImport", { enumerable: true, get: function () { return msx2PlayerImport_1.parseMsx2PlayerImport; } });
exports.MSX2_PLAYER_DOCUMENT_SCHEMA = 'mideas.msx2.player';
exports.MSX2_PLAYER_DOCUMENT_VERSION = 1;
const DIRECTION_IDS = ['left', 'right', 'up', 'down'];
const FUNCTION_KEY_IDS = ['f1', 'f2', 'f3', 'f4', 'f5'];
const FUNCTION_KEY_LABELS = {
    f1: 'F1',
    f2: 'F2',
    f3: 'F3',
    f4: 'F4',
    f5: 'F5',
};
const labelForInputSource = (value) => msx2PlayerDefaults_1.MSX2_PLAYER_INPUT_SOURCES.find(option => option.value === value)?.label ?? value;
const labelForButtonBinding = (value) => msx2PlayerDefaults_1.MSX2_PLAYER_BUTTON_BINDINGS.find(option => option.value === value)?.label ?? value;
const labelForFunctionKeyAction = (action, customText) => {
    if (action === 'custom')
        return customText?.trim() || 'Custom';
    return msx2PlayerDefaults_1.MSX2_FUNCTION_KEY_ACTIONS.find(option => option.value === action)?.label ?? action;
};
const isControlEnabled = (player, key) => {
    if (key.startsWith('f'))
        return player.inputEnabled?.[key] === true;
    return player.inputEnabled?.[key] !== false;
};
const buildSoundsSection = (player) => msx2PlayerDefaults_1.MSX2_PLAYER_SOUND_SLOTS.reduce((result, slot) => {
    const triggerPreset = (0, msx2PlayerDefaults_1.normalizePlayerSoundTriggerPreset)(player.soundPresets?.[slot.id]);
    const triggerCustom = player.soundCustomValues?.[slot.id]?.trim();
    const soundAssetId = player.soundAssetIds?.[slot.id];
    const soundAssetCustom = player.soundAssetCustomValues?.[slot.id]?.trim();
    const triggerLabel = triggerPreset === 'custom'
        ? (triggerCustom || 'Custom event')
        : triggerPreset.startsWith('anim:')
            ? `Anim: ${(0, msx2PlayerDefaults_1.labelForAnimationRole)(player.animations[triggerPreset.slice(5)] || { role: 'custom', frames: [0], speed: 6, customRole: triggerPreset.slice(5) })}`
            : 'Player event';
    result[slot.id] = {
        label: slot.label,
        enabled: player.soundsEnabled?.[slot.id] !== false,
        triggerPreset,
        ...(triggerPreset === 'custom' && triggerCustom ? { triggerCustom } : {}),
        triggerLabel,
        ...(soundAssetId ? { soundAssetId } : {}),
        ...(soundAssetCustom ? { soundAssetCustom } : {}),
        resolved: player.sounds?.[slot.id] || (0, msx2PlayerDefaults_1.resolvePlayerSoundExportId)(soundAssetId, soundAssetCustom, slot.defaultPreset),
        ...(triggerPreset.startsWith('anim:') ? { linkedAnimationKey: triggerPreset.slice(5) } : {}),
    };
    return result;
}, {});
const buildStateMachineSection = (player) => ({
    template: player.basedOnTemplate,
    assetId: player.stateMachineAssetId,
    states: player.stateMachine,
    stateCount: player.stateMachine.length,
    transitionCount: 0,
});
const buildControlsSection = (player) => {
    const directions = DIRECTION_IDS.reduce((result, direction) => {
        const inputSource = player.inputMapping[direction] || 'arrows';
        result[direction] = {
            enabled: isControlEnabled(player, direction),
            inputSource,
            label: labelForInputSource(inputSource),
        };
        return result;
    }, {});
    const jumpBinding = player.inputMapping.jump || 'spc';
    const attackBinding = player.inputMapping.attack || 'm';
    const functionKeys = FUNCTION_KEY_IDS.reduce((result, keyId) => {
        const action = player.inputMapping[keyId] || 'none';
        const customText = player.functionKeyCustomActions?.[keyId]?.trim();
        result[FUNCTION_KEY_LABELS[keyId]] = {
            enabled: isControlEnabled(player, keyId),
            action,
            label: labelForFunctionKeyAction(action, customText),
            ...(action === 'custom' && customText ? { customText } : {}),
        };
        return result;
    }, {});
    return {
        directions,
        buttons: {
            A: {
                slot: 'jump',
                enabled: isControlEnabled(player, 'jump'),
                binding: jumpBinding,
                label: labelForButtonBinding(jumpBinding),
            },
            B: {
                slot: 'attack',
                enabled: isControlEnabled(player, 'attack'),
                binding: attackBinding,
                label: labelForButtonBinding(attackBinding),
            },
        },
        functionKeys,
    };
};
const buildDetailedMsx2PlayerDocument = (player, exportedAt = new Date().toISOString()) => {
    const normalized = (0, msx2PlayerDefaults_1.normalizeMsx2PlayerDefinition)(player);
    const order = normalized.animationOrder || Object.keys(normalized.animations);
    const animations = order.reduce((result, name) => {
        const animation = normalized.animations[name];
        if (!animation)
            return result;
        const resolvedSpriteAssetId = animation.spriteAssetId || normalized.render.spriteAssetId;
        result[name] = {
            ...animation,
            frameCount: animation.frames.length,
            roleLabel: (0, msx2PlayerDefaults_1.labelForAnimationRole)(animation),
            playback: animation.playback || 'loop',
            renderLink: {
                spriteAssetId: resolvedSpriteAssetId,
                usesPlayerDefault: !animation.spriteAssetId,
                frameIndices: [...animation.frames],
            },
        };
        return result;
    }, {});
    return {
        schema: exports.MSX2_PLAYER_DOCUMENT_SCHEMA,
        schemaVersion: exports.MSX2_PLAYER_DOCUMENT_VERSION,
        exportedAt,
        generatedBy: 'Mideas MSX Player Config',
        player: {
            identity: {
                id: normalized.id,
                name: normalized.name,
                target: normalized.target,
                gameType: normalized.gameType,
                defaultFacing: normalized.defaultFacing,
                basedOnTemplate: normalized.basedOnTemplate,
                notes: normalized.notes,
            },
            render: normalized.render,
            animations,
            animationOrder: order,
            hitboxes: normalized.hitboxes,
            movement: normalized.movement,
            controls: buildControlsSection(normalized),
            health: normalized.health,
            weapons: normalized.weapons || [],
            equippedWeaponId: normalized.equippedWeaponId,
            combat: {
                attack: normalized.attack,
                attackHitbox: normalized.hitboxes.attack,
            },
            interaction: normalized.interaction,
            sounds: normalized.sounds || {},
            soundsEnabled: normalized.soundsEnabled || {},
            soundPresets: normalized.soundPresets || {},
            soundCustomValues: normalized.soundCustomValues || {},
            soundAssetIds: normalized.soundAssetIds || {},
            soundAssetCustomValues: normalized.soundAssetCustomValues || {},
            soundsConfig: buildSoundsSection(normalized),
            inventoryHooks: normalized.inventoryHooks || [],
            logic: normalized.logic || {},
            activeSkills: normalized.activeSkills || [],
            skillBindings: normalized.skillBindings || {},
            skillParameters: normalized.skillParameters || {},
            components: normalized.components || {},
            stateMachine: buildStateMachineSection(normalized),
            runtime: {
                budget: normalized.budget,
                requiredRoutines: normalized.requiredRoutines,
            },
        },
        compact: normalized,
    };
};
exports.buildDetailedMsx2PlayerDocument = buildDetailedMsx2PlayerDocument;
const mergeMsx2PlayerUpdate = (current, patch) => {
    if (patch && typeof patch === 'object' && patch.schema === exports.MSX2_PLAYER_DOCUMENT_SCHEMA) {
        return (0, msx2PlayerDefaults_1.normalizeMsx2PlayerDefinition)((0, msx2PlayerImport_1.parseMsx2PlayerImport)(patch));
    }
    const partialPatch = patch;
    const base = (0, msx2PlayerDefaults_1.normalizeMsx2PlayerDefinition)((0, msx2PlayerImport_1.parseMsx2PlayerImport)(current));
    return (0, msx2PlayerDefaults_1.normalizeMsx2PlayerDefinition)({
        ...base,
        ...partialPatch,
        render: partialPatch.render ? { ...base.render, ...partialPatch.render } : base.render,
        hitboxes: partialPatch.hitboxes ? { ...base.hitboxes, ...partialPatch.hitboxes } : base.hitboxes,
        movement: partialPatch.movement ? { ...base.movement, ...partialPatch.movement } : base.movement,
        health: partialPatch.health ? { ...base.health, ...partialPatch.health } : base.health,
        weapons: partialPatch.weapons ?? base.weapons,
        equippedWeaponId: partialPatch.equippedWeaponId ?? base.equippedWeaponId,
        attack: partialPatch.attack ? { ...base.attack, ...partialPatch.attack } : base.attack,
        interaction: partialPatch.interaction ? { ...base.interaction, ...partialPatch.interaction } : base.interaction,
        sounds: partialPatch.sounds ? { ...(base.sounds || {}), ...partialPatch.sounds } : base.sounds,
        soundsEnabled: partialPatch.soundsEnabled
            ? { ...(base.soundsEnabled || {}), ...partialPatch.soundsEnabled }
            : base.soundsEnabled,
        soundPresets: partialPatch.soundPresets
            ? { ...(base.soundPresets || {}), ...partialPatch.soundPresets }
            : base.soundPresets,
        soundCustomValues: partialPatch.soundCustomValues
            ? { ...(base.soundCustomValues || {}), ...partialPatch.soundCustomValues }
            : base.soundCustomValues,
        soundAssetIds: partialPatch.soundAssetIds
            ? { ...(base.soundAssetIds || {}), ...partialPatch.soundAssetIds }
            : base.soundAssetIds,
        soundAssetCustomValues: partialPatch.soundAssetCustomValues
            ? { ...(base.soundAssetCustomValues || {}), ...partialPatch.soundAssetCustomValues }
            : base.soundAssetCustomValues,
        inputMapping: partialPatch.inputMapping ? { ...base.inputMapping, ...partialPatch.inputMapping } : base.inputMapping,
        inputEnabled: partialPatch.inputEnabled ? { ...base.inputEnabled, ...partialPatch.inputEnabled } : base.inputEnabled,
        functionKeyCustomActions: partialPatch.functionKeyCustomActions
            ? { ...base.functionKeyCustomActions, ...partialPatch.functionKeyCustomActions }
            : base.functionKeyCustomActions,
        animations: partialPatch.animations !== undefined ? partialPatch.animations : base.animations,
        animationOrder: partialPatch.animationOrder !== undefined ? partialPatch.animationOrder : base.animationOrder,
        logic: partialPatch.logic ? { ...base.logic, ...partialPatch.logic } : base.logic,
        components: partialPatch.components ? { ...(base.components || {}), ...partialPatch.components } : base.components,
        stateMachineAssetId: partialPatch.stateMachineAssetId !== undefined
            ? partialPatch.stateMachineAssetId
            : base.stateMachineAssetId,
        stateMachine: partialPatch.stateMachine !== undefined ? partialPatch.stateMachine : base.stateMachine,
        budget: partialPatch.budget ? { ...base.budget, ...partialPatch.budget } : base.budget,
        skillParameters: partialPatch.skillParameters
            ? { ...(base.skillParameters || {}), ...partialPatch.skillParameters }
            : base.skillParameters,
        activeSkills: partialPatch.activeSkills !== undefined ? partialPatch.activeSkills : base.activeSkills,
        skillBindings: partialPatch.skillBindings !== undefined ? partialPatch.skillBindings : base.skillBindings,
    });
};
exports.mergeMsx2PlayerUpdate = mergeMsx2PlayerUpdate;
