"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMsx2PlayerImport = exports.MSX2_PLAYER_IMPORT_SCHEMA = void 0;
exports.MSX2_PLAYER_IMPORT_SCHEMA = 'mideas.msx2.player';
const DIRECTION_IDS = ['left', 'right', 'up', 'down'];
const FUNCTION_KEY_IDS = ['f1', 'f2', 'f3', 'f4', 'f5'];
const FUNCTION_KEY_LABELS = {
    f1: 'F1',
    f2: 'F2',
    f3: 'F3',
    f4: 'F4',
    f5: 'F5',
};
const flattenControlsFromDocument = (controls) => {
    if (!controls)
        return {};
    const inputMapping = {};
    const inputEnabled = {};
    const functionKeyCustomActions = {};
    DIRECTION_IDS.forEach(direction => {
        const entry = controls.directions?.[direction];
        if (!entry)
            return;
        inputMapping[direction] = entry.inputSource;
        inputEnabled[direction] = entry.enabled;
    });
    if (controls.buttons?.A) {
        inputMapping.jump = controls.buttons.A.binding;
        inputEnabled.jump = controls.buttons.A.enabled;
    }
    if (controls.buttons?.B) {
        inputMapping.attack = controls.buttons.B.binding;
        inputEnabled.attack = controls.buttons.B.enabled;
    }
    FUNCTION_KEY_IDS.forEach(keyId => {
        const label = FUNCTION_KEY_LABELS[keyId];
        const entry = controls.functionKeys?.[label];
        if (!entry)
            return;
        inputMapping[keyId] = entry.action;
        inputEnabled[keyId] = entry.enabled;
        if (entry.action === 'custom' && entry.customText) {
            functionKeyCustomActions[keyId] = entry.customText;
        }
    });
    return {
        inputMapping,
        inputEnabled,
        functionKeyCustomActions,
    };
};
const flattenDetailedPlayerPayload = (payload) => {
    const player = payload;
    const identity = player.identity || {};
    const controlsPatch = flattenControlsFromDocument(player.controls);
    return {
        id: identity.id,
        name: identity.name,
        target: identity.target,
        gameType: identity.gameType,
        defaultFacing: identity.defaultFacing,
        basedOnTemplate: identity.basedOnTemplate ?? player.stateMachine?.template,
        notes: identity.notes,
        render: player.render,
        weapons: player.weapons,
        equippedWeaponId: player.equippedWeaponId,
        animations: player.animations
            ? Object.entries(player.animations).reduce((result, [name, animation]) => {
                const { frameCount: _frameCount, roleLabel: _roleLabel, playback: _playback, renderLink, ...rest } = animation;
                const spriteAssetId = String(rest.spriteAssetId || renderLink?.spriteAssetId || '').trim();
                result[name] = {
                    ...rest,
                    ...(spriteAssetId ? { spriteAssetId } : {}),
                };
                return result;
            }, {})
            : undefined,
        animationOrder: Array.isArray(player.animationOrder)
            ? player.animationOrder
            : undefined,
        hitboxes: player.hitboxes,
        movement: player.movement,
        health: player.health,
        attack: player.combat?.attack ?? player.attack,
        interaction: player.interaction,
        sounds: player.sounds,
        soundsEnabled: player.soundsEnabled,
        soundPresets: player.soundPresets,
        soundCustomValues: player.soundCustomValues,
        soundAssetIds: player.soundAssetIds,
        soundAssetCustomValues: player.soundAssetCustomValues,
        inventoryHooks: player.inventoryHooks,
        logic: player.logic,
        ...(Array.isArray(player.activeSkills)
            ? { activeSkills: player.activeSkills }
            : {}),
        ...(player.skillBindings
            ? { skillBindings: player.skillBindings }
            : {}),
        ...(player.skillParameters
            ? { skillParameters: player.skillParameters }
            : {}),
        components: player.components,
        stateMachineAssetId: player.stateMachine?.assetId,
        stateMachine: player.stateMachine?.states,
        budget: player.runtime?.budget,
        requiredRoutines: player.runtime?.requiredRoutines,
        ...controlsPatch,
    };
};
const parseMsx2PlayerImport = (raw) => {
    if (!raw || typeof raw !== 'object')
        return {};
    const doc = raw;
    if (doc.compact && typeof doc.compact === 'object') {
        const compact = doc.compact;
        const detailed = flattenDetailedPlayerPayload(doc.player || {});
        return {
            ...compact,
            ...detailed,
            activeSkills: detailed.activeSkills ?? compact.activeSkills,
            skillBindings: detailed.skillBindings ?? compact.skillBindings,
            skillParameters: detailed.skillParameters ?? compact.skillParameters,
        };
    }
    if (doc.schema === exports.MSX2_PLAYER_IMPORT_SCHEMA && doc.player && typeof doc.player === 'object') {
        return flattenDetailedPlayerPayload(doc.player);
    }
    if (doc.player && typeof doc.player === 'object') {
        return flattenDetailedPlayerPayload(doc.player);
    }
    return doc;
};
exports.parseMsx2PlayerImport = parseMsx2PlayerImport;
