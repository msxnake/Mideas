"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeMsx2PlayerDefinition = exports.normalizeMsx2PlayerEntries = exports.createDefaultMsx2PlayerEntries = exports.createDefaultMsx2PlayerDefinition = exports.normalizeFunctionKeyMapping = exports.normalizeFunctionKeyCustomActions = exports.normalizeFunctionKeyAction = exports.normalizePlayerControlMapping = exports.normalizePlayerJumpBinding = exports.normalizePlayerButtonBinding = exports.normalizePlayerInputSource = exports.normalizePlayerAnimations = exports.normalizePlayerAnimation = exports.inferAnimationPlayback = exports.inferAnimationRoleFromKey = exports.labelForAnimationRole = exports.buildPlayerStateMachinePatchFromAsset = exports.stateNamesFromStateMachineAsset = exports.buildSoundsImportFromAnimations = exports.findAnimationKeyForSoundSlot = exports.resolvePlayerSoundExportId = exports.resolvePlayerSoundValue = exports.normalizePlayerSoundTriggerPreset = exports.resolvePlayerSoundTrigger = exports.MSX2_PLAYER_SOUND_SLOTS = exports.MSX2_PLAYER_SOUND_CUSTOM_ASSET = exports.MSX2_PLAYER_SOUND_EVENT_DEFAULT = exports.MSX2_PLAYER_ANIMATION_ROLES = exports.MSX2_PLAYER_JUMP_BINDINGS = exports.MSX2_PLAYER_BUTTON_BINDINGS = exports.MSX2_PLAYER_INPUT_SOURCES = exports.MSX2_FUNCTION_KEY_ACTIONS = exports.spriteSizeFromMsx2Sprite = exports.dimensionsToPlayerSpriteSize = exports.parsePlayerSpriteSize = exports.normalizeMsx2PlayerFacing = exports.MSX2_PLAYER_FACING_OPTIONS = void 0;
const msx2PlayerImport_1 = require("./msx2PlayerImport");
const index_1 = require("./msxGenerator/skills/index");
const coerceSkillParameterValue = (param, raw) => {
    if (param.type === 'boolean') {
        return Boolean(raw);
    }
    const num = Number(raw);
    if (!Number.isFinite(num)) {
        return Number(param.default) || 0;
    }
    const min = typeof param.min === 'number' ? param.min : num;
    const max = typeof param.max === 'number' ? param.max : num;
    return Math.max(min, Math.min(max, num));
};
const buildSkillParametersDefaults = () => {
    const result = {};
    for (const skill of (0, index_1.getAllSkills)()) {
        // R1-A: only seed defaults for optional skills. Core skills (jump, gravity, ...)
        // stay opt-in: the legacy movement.* / components['msx2_jump'] runtime path is
        // preserved until the user explicitly opens the skill dialog and edits it.
        // This avoids breaking legacy projects whose physics values would otherwise be
        // overwritten by 8.8 fixed-point defaults from the skill registry.
        if (skill.required)
            continue;
        if (!skill.parameters?.length)
            continue;
        result[skill.id] = skill.parameters.reduce((acc, param) => {
            acc[param.key] = param.default;
            return acc;
        }, {});
    }
    return result;
};
const mergeSkillParameters = (playerSkillParameters) => {
    const defaults = buildSkillParametersDefaults();
    const raw = playerSkillParameters && typeof playerSkillParameters === 'object' ? playerSkillParameters : {};
    const merged = {};
    const knownSkillIds = new Set([...Object.keys(defaults), ...Object.keys(raw)]);
    for (const skillId of knownSkillIds) {
        const defParams = defaults[skillId] || {};
        const fromRaw = raw[skillId] && typeof raw[skillId] === 'object' ? raw[skillId] : {};
        const skillDef = (0, index_1.getAllSkills)().find(s => s.id === skillId);
        const paramDefs = skillDef?.parameters || [];
        const skillMerged = { ...defParams, ...fromRaw };
        for (const param of paramDefs) {
            skillMerged[param.key] = coerceSkillParameterValue(param, skillMerged[param.key]);
        }
        merged[skillId] = skillMerged;
    }
    return merged;
};
const MSX2_PLAYER_SPRITE_SIZE_PRESETS = ['16x16', '16x32', '32x16', '32x32'];
exports.MSX2_PLAYER_FACING_OPTIONS = [
    { value: 'neutral', label: 'Neutral' },
    { value: 'right', label: 'Right' },
    { value: 'left', label: 'Left' },
    { value: 'up', label: 'Up' },
    { value: 'down', label: 'Down' },
];
const MSX2_PLAYER_FACING_IDS = exports.MSX2_PLAYER_FACING_OPTIONS.map(option => option.value);
const normalizeMsx2PlayerFacing = (raw, fallback = 'right') => {
    const value = String(raw || '').trim().toLowerCase();
    return MSX2_PLAYER_FACING_IDS.includes(value)
        ? value
        : fallback;
};
exports.normalizeMsx2PlayerFacing = normalizeMsx2PlayerFacing;
const parsePlayerSpriteSize = (size) => {
    const [width, height] = String(size || '16x16').split('x').map(value => Number(value));
    return { width: width || 16, height: height || 16 };
};
exports.parsePlayerSpriteSize = parsePlayerSpriteSize;
const dimensionsToPlayerSpriteSize = (width, height) => {
    const key = `${Math.max(1, Math.trunc(width))}x${Math.max(1, Math.trunc(height))}`;
    return MSX2_PLAYER_SPRITE_SIZE_PRESETS.includes(key) ? key : '16x16';
};
exports.dimensionsToPlayerSpriteSize = dimensionsToPlayerSpriteSize;
const spriteSizeFromMsx2Sprite = (sprite) => {
    if (!sprite?.size)
        return undefined;
    return (0, exports.dimensionsToPlayerSpriteSize)(sprite.size.width, sprite.size.height);
};
exports.spriteSizeFromMsx2Sprite = spriteSizeFromMsx2Sprite;
const gameTypeFromProfile = (profileId) => {
    if (profileId === 'maze')
        return 'maze';
    if (profileId === 'shooterHorizontal')
        return 'shooterHorizontal';
    if (profileId === 'shooterVertical')
        return 'shooterVertical';
    return 'platform';
};
exports.MSX2_FUNCTION_KEY_ACTIONS = [
    { value: 'none', label: 'None' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'pause', label: 'Pause' },
    { value: 'map', label: 'Map' },
    { value: 'status', label: 'Status' },
    { value: 'save', label: 'Save' },
    { value: 'load', label: 'Load' },
    { value: 'magic', label: 'Magic' },
    { value: 'custom', label: 'Custom' },
];
exports.MSX2_PLAYER_INPUT_SOURCES = [
    { value: 'arrows', label: 'Arrows' },
    { value: 'joystick1', label: 'Joystick 1' },
    { value: 'joystick2', label: 'Joystick 2' },
];
exports.MSX2_PLAYER_BUTTON_BINDINGS = [
    { value: 'upArrow', label: 'Up Arrow' },
    { value: 'spc', label: 'Key SPC' },
    { value: 'n', label: 'Key N' },
    { value: 'm', label: 'Key M' },
    { value: 'joyA', label: 'Joystick Button A' },
    { value: 'joyB', label: 'Joystick Button B' },
];
/** @deprecated Use MSX2_PLAYER_BUTTON_BINDINGS */
exports.MSX2_PLAYER_JUMP_BINDINGS = exports.MSX2_PLAYER_BUTTON_BINDINGS;
exports.MSX2_PLAYER_ANIMATION_ROLES = [
    { value: 'idle', label: 'Idle' },
    { value: 'walk', label: 'Walk' },
    { value: 'run', label: 'Run' },
    { value: 'dash', label: 'Dash' },
    { value: 'jump', label: 'Jump' },
    { value: 'dead', label: 'Dead' },
    { value: 'attack', label: 'Attack' },
    { value: 'defend', label: 'Defend' },
    { value: 'custom', label: 'Custom' },
];
const ANIMATION_ROLE_IDS = exports.MSX2_PLAYER_ANIMATION_ROLES.map(option => option.value);
exports.MSX2_PLAYER_SOUND_EVENT_DEFAULT = 'event:default';
exports.MSX2_PLAYER_SOUND_CUSTOM_ASSET = '__custom__';
exports.MSX2_PLAYER_SOUND_SLOTS = [
    { id: 'onJump', label: 'Jump', defaultPreset: 'sfx_jump' },
    { id: 'onHit', label: 'Hit', defaultPreset: 'sfx_player_hit' },
    { id: 'onDeath', label: 'Death', defaultPreset: 'sfx_death' },
    { id: 'onAttack', label: 'Attack', defaultPreset: 'sfx_attack' },
    { id: 'onLand', label: 'Land', defaultPreset: 'sfx_land' },
];
const resolvePlayerSoundTrigger = (preset, custom, fallback = exports.MSX2_PLAYER_SOUND_EVENT_DEFAULT) => {
    const binding = String(preset || fallback).trim() || fallback;
    if (binding === 'custom')
        return String(custom || '').trim();
    if (binding.startsWith('anim:') || binding.startsWith('event:'))
        return binding;
    if (binding.startsWith('sfx_'))
        return exports.MSX2_PLAYER_SOUND_EVENT_DEFAULT;
    return binding;
};
exports.resolvePlayerSoundTrigger = resolvePlayerSoundTrigger;
const normalizePlayerSoundTriggerPreset = (preset) => {
    const value = String(preset || exports.MSX2_PLAYER_SOUND_EVENT_DEFAULT).trim() || exports.MSX2_PLAYER_SOUND_EVENT_DEFAULT;
    if (value === 'custom' || value.startsWith('anim:') || value.startsWith('event:'))
        return value;
    if (value.startsWith('sfx_'))
        return exports.MSX2_PLAYER_SOUND_EVENT_DEFAULT;
    return exports.MSX2_PLAYER_SOUND_EVENT_DEFAULT;
};
exports.normalizePlayerSoundTriggerPreset = normalizePlayerSoundTriggerPreset;
/** @deprecated Use resolvePlayerSoundTrigger for events and resolvePlayerSoundExportId for SFX ids. */
exports.resolvePlayerSoundValue = exports.resolvePlayerSoundTrigger;
const resolvePlayerSoundExportId = (soundAssetId, soundAssetCustom, fallback) => {
    if (soundAssetId === exports.MSX2_PLAYER_SOUND_CUSTOM_ASSET) {
        return String(soundAssetCustom || fallback).trim() || fallback;
    }
    if (soundAssetCustom?.trim())
        return soundAssetCustom.trim();
    return fallback;
};
exports.resolvePlayerSoundExportId = resolvePlayerSoundExportId;
const findAnimationKeyForSoundSlot = (slotId, animations, order) => {
    const roleMatchers = {
        onJump: 'jump',
        onAttack: 'attack',
        onDeath: 'dead',
    };
    if (slotId === 'onHit') {
        if (animations.hurt)
            return 'hurt';
        const hitKey = order.find(key => /hurt|hit/i.test(key));
        if (hitKey)
            return hitKey;
    }
    if (slotId === 'onDeath') {
        const deadKey = order.find(key => key === 'dead' || (/death|dead/i.test(key) && key !== 'hurt'));
        if (deadKey)
            return deadKey;
    }
    if (slotId === 'onLand') {
        const landKey = order.find(key => {
            const animation = animations[key];
            if (!animation)
                return false;
            if (/land|fall/i.test(key))
                return true;
            const label = (0, exports.labelForAnimationRole)(animation).toLowerCase();
            return label.includes('land') || label.includes('fall');
        });
        if (landKey)
            return landKey;
    }
    const role = roleMatchers[slotId];
    if (role) {
        const roleKey = order.find(key => {
            if (animations[key]?.role !== role)
                return false;
            if (slotId === 'onDeath' && key === 'hurt')
                return false;
            return true;
        });
        if (roleKey)
            return roleKey;
        const namedKey = order.find(key => key.toLowerCase().includes(role) && !(slotId === 'onDeath' && key === 'hurt'));
        if (namedKey)
            return namedKey;
    }
    return undefined;
};
exports.findAnimationKeyForSoundSlot = findAnimationKeyForSoundSlot;
const buildSoundsImportFromAnimations = (player) => {
    const order = player.animationOrder || Object.keys(player.animations);
    const soundPresets = { ...(player.soundPresets || {}) };
    const soundsEnabled = { ...(player.soundsEnabled || {}) };
    exports.MSX2_PLAYER_SOUND_SLOTS.forEach(slot => {
        const animationKey = (0, exports.findAnimationKeyForSoundSlot)(slot.id, player.animations, order);
        if (!animationKey)
            return;
        soundPresets[slot.id] = `anim:${animationKey}`;
        soundsEnabled[slot.id] = true;
    });
    return { soundPresets, soundsEnabled };
};
exports.buildSoundsImportFromAnimations = buildSoundsImportFromAnimations;
const normalizePlayerSounds = (player, defaults) => {
    const soundPresets = { ...(defaults.soundPresets || {}), ...(player?.soundPresets || {}) };
    const soundCustomValues = { ...(defaults.soundCustomValues || {}), ...(player?.soundCustomValues || {}) };
    const soundAssetIds = { ...(defaults.soundAssetIds || {}), ...(player?.soundAssetIds || {}) };
    const soundAssetCustomValues = { ...(defaults.soundAssetCustomValues || {}), ...(player?.soundAssetCustomValues || {}) };
    const soundsEnabled = { ...(defaults.soundsEnabled || {}), ...(player?.soundsEnabled || {}) };
    const sounds = exports.MSX2_PLAYER_SOUND_SLOTS.reduce((result, slot) => {
        const preset = (0, exports.normalizePlayerSoundTriggerPreset)(soundPresets[slot.id]);
        const enabled = soundsEnabled[slot.id];
        soundsEnabled[slot.id] = enabled !== false;
        soundPresets[slot.id] = preset;
        result[slot.id] = (0, exports.resolvePlayerSoundExportId)(soundAssetIds[slot.id], soundAssetCustomValues[slot.id], player?.sounds?.[slot.id] || slot.defaultPreset);
        return result;
    }, {});
    return { sounds, soundsEnabled, soundPresets, soundCustomValues, soundAssetIds, soundAssetCustomValues };
};
const stateNamesFromStateMachineAsset = (stateMachine) => {
    if (!stateMachine?.states?.length)
        return [];
    return stateMachine.states.map(state => String(state.name || state.id).trim()).filter(Boolean);
};
exports.stateNamesFromStateMachineAsset = stateNamesFromStateMachineAsset;
const buildPlayerStateMachinePatchFromAsset = (assetId, stateMachineAssets) => {
    if (!assetId) {
        return { stateMachineAssetId: undefined, stateMachine: [] };
    }
    const asset = stateMachineAssets.find(entry => entry.id === assetId);
    const stateMachine = asset?.data;
    const stateNames = (0, exports.stateNamesFromStateMachineAsset)(stateMachine);
    return {
        stateMachineAssetId: assetId,
        stateMachine: stateNames,
    };
};
exports.buildPlayerStateMachinePatchFromAsset = buildPlayerStateMachinePatchFromAsset;
const labelForAnimationRole = (animation) => {
    if (animation.role === 'custom')
        return animation.customRole?.trim() || 'Custom';
    const role = animation.role || 'custom';
    return exports.MSX2_PLAYER_ANIMATION_ROLES.find(option => option.value === role)?.label || role;
};
exports.labelForAnimationRole = labelForAnimationRole;
const inferAnimationRoleFromKey = (key) => {
    const normalized = key.toLowerCase();
    if (normalized.includes('idle'))
        return 'idle';
    if (normalized.includes('walk'))
        return 'walk';
    if (normalized.includes('run'))
        return 'run';
    if (normalized.includes('dash'))
        return 'dash';
    if (normalized.includes('jump') || normalized.includes('fall'))
        return 'jump';
    if (normalized.includes('dead') || normalized.includes('hurt') || normalized.includes('death'))
        return 'dead';
    if (normalized.includes('attack'))
        return 'attack';
    if (normalized.includes('defend') || normalized.includes('block'))
        return 'defend';
    return 'custom';
};
exports.inferAnimationRoleFromKey = inferAnimationRoleFromKey;
const inferAnimationPlayback = (key, animation) => {
    if (animation?.playback === 'loop' || animation?.playback === 'once')
        return animation.playback;
    const role = animation?.role || (0, exports.inferAnimationRoleFromKey)(key);
    if (role === 'dead' || role === 'attack' || role === 'jump' || role === 'dash')
        return 'once';
    return 'loop';
};
exports.inferAnimationPlayback = inferAnimationPlayback;
const normalizePlayerAnimation = (key, animation) => {
    const frames = Array.isArray(animation?.frames) && animation.frames.length > 0
        ? animation.frames.map(frame => Math.max(0, Math.trunc(Number(frame) || 0)))
        : [0];
    const role = animation?.role && ANIMATION_ROLE_IDS.includes(animation.role)
        ? animation.role
        : (0, exports.inferAnimationRoleFromKey)(key);
    const spriteAssetId = String(animation?.spriteAssetId || '').trim();
    const stateMachineState = String(animation?.stateMachineState || '').trim();
    return {
        frames,
        speed: Math.max(1, Math.trunc(Number(animation?.speed) || 6)),
        spriteAssetId: spriteAssetId || undefined,
        role,
        stateMachineState: stateMachineState || undefined,
        customRole: role === 'custom' ? String(animation?.customRole || key).trim() : animation?.customRole?.trim(),
        playback: (0, exports.inferAnimationPlayback)(key, animation),
    };
};
exports.normalizePlayerAnimation = normalizePlayerAnimation;
const normalizePlayerAnimations = (player, defaults) => {
    const hasExplicitAnimations = Boolean(player?.animations && Object.keys(player.animations).length > 0);
    const source = hasExplicitAnimations
        ? { ...(player?.animations || {}) }
        : { ...defaults.animations };
    const defaultOrder = defaults.animationOrder || Object.keys(defaults.animations);
    const orderSource = Array.isArray(player?.animationOrder) && player.animationOrder.length > 0
        ? player.animationOrder
        : defaultOrder;
    const knownKeys = Object.keys(source);
    const animationOrder = [
        ...orderSource.filter(key => knownKeys.includes(key)),
        ...knownKeys.filter(key => !orderSource.includes(key)),
    ];
    const animations = animationOrder.reduce((result, key) => {
        result[key] = (0, exports.normalizePlayerAnimation)(key, source[key]);
        return result;
    }, {});
    return { animations, animationOrder };
};
exports.normalizePlayerAnimations = normalizePlayerAnimations;
const withAnimationMeta = (key, animation) => (0, exports.normalizePlayerAnimation)(key, animation);
const FUNCTION_KEY_ACTION_IDS = exports.MSX2_FUNCTION_KEY_ACTIONS.map(option => option.value);
const INPUT_SOURCE_IDS = exports.MSX2_PLAYER_INPUT_SOURCES.map(option => option.value);
const BUTTON_BINDING_IDS = exports.MSX2_PLAYER_BUTTON_BINDINGS.map(option => option.value);
const LEGACY_FUNCTION_KEY_VALUES = new Set(['F1', 'F2', 'F3', 'F4', 'F5', 'Joystick', 'Keyboard']);
const LEGACY_INPUT_SOURCE_VALUES = new Set([
    'CURSOR_LEFT', 'CURSOR_RIGHT', 'CURSOR_UP', 'CURSOR_DOWN',
    'Left Arrow', 'Right Arrow', 'Up Arrow / Z', 'Down Arrow',
    'Space / X', 'Ctrl / C', 'Enter / V',
    'SPACE', 'M', 'UP', 'Keyboard', 'Joystick',
]);
const normalizePlayerInputSource = (raw, fallback = 'arrows') => {
    if (raw && INPUT_SOURCE_IDS.includes(raw)) {
        return raw;
    }
    if (raw === 'Joystick' || raw === 'Joystick 1' || raw === 'joystick_1')
        return 'joystick1';
    if (raw === 'Joystick 2' || raw === 'joystick_2')
        return 'joystick2';
    if (raw && LEGACY_INPUT_SOURCE_VALUES.has(raw))
        return 'arrows';
    return fallback;
};
exports.normalizePlayerInputSource = normalizePlayerInputSource;
const normalizePlayerButtonBinding = (raw, fallback = 'spc') => {
    if (raw && BUTTON_BINDING_IDS.includes(raw)) {
        return raw;
    }
    if (raw === 'UP' || raw === 'Up Arrow' || raw === 'Up Arrow / Z' || raw === 'CURSOR_UP')
        return 'upArrow';
    if (raw === 'SPACE' || raw === 'Space / X' || raw === 'SPC')
        return 'spc';
    if (raw === 'N')
        return 'n';
    if (raw === 'M' || raw === 'Ctrl / C' || raw === 'CTRL')
        return 'm';
    if (raw === 'joy_a' || raw === 'joystick_a' || raw === 'Joystick Button A')
        return 'joyA';
    if (raw === 'joy_b' || raw === 'joystick_b' || raw === 'Joystick Button B')
        return 'joyB';
    if (raw === 'arrows' || raw === 'joystick1' || raw === 'joystick2')
        return fallback;
    return fallback;
};
exports.normalizePlayerButtonBinding = normalizePlayerButtonBinding;
/** @deprecated Use normalizePlayerButtonBinding */
exports.normalizePlayerJumpBinding = exports.normalizePlayerButtonBinding;
const normalizePlayerControlMapping = (player, defaults) => {
    const directionIds = ['left', 'right', 'up', 'down'];
    const mapping = {};
    directionIds.forEach(controlId => {
        mapping[controlId] = (0, exports.normalizePlayerInputSource)(player?.inputMapping?.[controlId], defaults.inputMapping[controlId]);
    });
    mapping.jump = (0, exports.normalizePlayerButtonBinding)(player?.inputMapping?.jump, defaults.inputMapping.jump);
    mapping.attack = (0, exports.normalizePlayerButtonBinding)(player?.inputMapping?.attack, defaults.inputMapping.attack);
    return mapping;
};
exports.normalizePlayerControlMapping = normalizePlayerControlMapping;
const normalizeFunctionKeyAction = (raw, fallback, legacyAction, legacyEnabled) => {
    if (raw && FUNCTION_KEY_ACTION_IDS.includes(raw)) {
        return raw;
    }
    if (legacyEnabled && legacyAction)
        return legacyAction;
    if (raw && !LEGACY_FUNCTION_KEY_VALUES.has(raw))
        return 'custom';
    return fallback;
};
exports.normalizeFunctionKeyAction = normalizeFunctionKeyAction;
const normalizeFunctionKeyCustomActions = (player, actions) => {
    const ids = ['f1', 'f2', 'f3', 'f4', 'f5'];
    const result = {};
    ids.forEach(id => {
        if (actions[id] !== 'custom')
            return;
        const saved = player?.functionKeyCustomActions?.[id]?.trim();
        const raw = player?.inputMapping?.[id]?.trim();
        if (saved) {
            result[id] = saved;
            return;
        }
        if (raw && !FUNCTION_KEY_ACTION_IDS.includes(raw)) {
            result[id] = raw;
        }
        else {
            result[id] = '';
        }
    });
    return result;
};
exports.normalizeFunctionKeyCustomActions = normalizeFunctionKeyCustomActions;
const normalizeFunctionKeyMapping = (player, defaults) => ({
    f1: (0, exports.normalizeFunctionKeyAction)(player?.inputMapping?.f1, defaults.inputMapping.f1, 'inventory', player?.inputEnabled?.inventory ?? player?.inputEnabled?.f1),
    f2: (0, exports.normalizeFunctionKeyAction)(player?.inputMapping?.f2, defaults.inputMapping.f2, 'pause', player?.inputEnabled?.pause ?? player?.inputEnabled?.f2),
    f3: (0, exports.normalizeFunctionKeyAction)(player?.inputMapping?.f3, defaults.inputMapping.f3),
    f4: (0, exports.normalizeFunctionKeyAction)(player?.inputMapping?.f4, defaults.inputMapping.f4),
    f5: (0, exports.normalizeFunctionKeyAction)(player?.inputMapping?.f5, defaults.inputMapping.f5),
});
exports.normalizeFunctionKeyMapping = normalizeFunctionKeyMapping;
const createDefaultMsx2PlayerDefinition = (id = `msx2_player_${Date.now()}`, profileId) => {
    const gameType = gameTypeFromProfile(profileId);
    const isShooter = gameType === 'shooterHorizontal' || gameType === 'shooterVertical';
    const isMaze = gameType === 'maze';
    return {
        id,
        name: 'Player_Main',
        target: 'MSX2',
        gameType,
        defaultFacing: 'right',
        basedOnTemplate: isShooter ? 'shooter_basic' : isMaze ? 'maze_4_direction' : 'platformer_basic',
        render: {
            mode: 'hardwareSprite',
            spriteSize: isShooter ? '16x16' : '16x32',
            usesFlipX: true,
        },
        animations: isMaze
            ? {
                idle_down: { frames: [0], speed: 12 },
                idle_up: { frames: [1], speed: 12 },
                idle_left: { frames: [2], speed: 12 },
                idle_right: { frames: [3], speed: 12 },
                walk_down: { frames: [4, 5], speed: 6 },
                walk_up: { frames: [6, 7], speed: 6 },
                walk_left: { frames: [8, 9], speed: 6 },
                walk_right: { frames: [10, 11], speed: 6 },
                hurt: { frames: [12], speed: 6 },
            }
            : {
                idle: withAnimationMeta('idle', { frames: [0, 1], speed: 12, role: 'idle', playback: 'loop' }),
                walk: withAnimationMeta('walk', { frames: [2, 3, 4, 5], speed: 6, role: 'walk', playback: 'loop' }),
                jump: withAnimationMeta('jump', { frames: [6], speed: 1, role: 'jump', playback: 'once' }),
                fall: withAnimationMeta('fall', { frames: [7], speed: 1, role: 'custom', customRole: 'Fall', playback: 'loop' }),
                attack: withAnimationMeta('attack', { frames: [8, 9], speed: 4, role: 'attack', playback: 'once' }),
                hurt: withAnimationMeta('hurt', { frames: [10], speed: 6, role: 'dead', playback: 'once' }),
            },
        animationOrder: isMaze
            ? ['idle_down', 'idle_up', 'idle_left', 'idle_right', 'walk_down', 'walk_up', 'walk_left', 'walk_right', 'hurt']
            : ['idle', 'walk', 'jump', 'fall', 'attack', 'hurt'],
        hitboxes: {
            body: isShooter ? { x: 2, y: 2, w: 12, h: 12 } : { x: 3, y: 4, w: 10, h: 27 },
            feet: isShooter ? undefined : { x: 3, y: 30, w: 10, h: 2 },
            attack: { x: 14, y: 8, w: 10, h: 8 },
            attackByFacing: {
                right: { x: 14, y: 8, w: 10, h: 8 },
                left: { x: -8, y: 8, w: 10, h: 8 },
                up: { x: 4, y: -8, w: 8, h: 10 },
                down: { x: 4, y: 24, w: 8, h: 10 },
            },
            interaction: { x: -4, y: 4, w: 24, h: 24 },
        },
        movement: {
            model: gameType,
            moveSpeed: isShooter ? 3 : 2,
            acceleration: isShooter || isMaze ? 0 : 1,
            deceleration: isShooter || isMaze ? 0 : 1,
            gravity: isShooter || isMaze ? 0 : 1,
            maxFallSpeed: isShooter || isMaze ? 0 : 6,
            jumpPower: isShooter || isMaze ? 0 : 5,
            coyoteTime: isShooter || isMaze ? 0 : 4,
            jumpBuffer: isShooter || isMaze ? 0 : 4,
            airControl: !isShooter && !isMaze,
            diagonalAllowed: isMaze || isShooter,
            snapToGrid: false,
            screenBoundsClamp: isShooter,
            fireRate: isShooter ? 12 : 0,
            maxProjectiles: isShooter ? 2 : 0,
        },
        inputMapping: {
            left: 'arrows',
            right: 'arrows',
            up: 'arrows',
            down: 'arrows',
            jump: 'spc',
            attack: 'm',
            f1: 'inventory',
            f2: 'pause',
            f3: 'map',
            f4: 'none',
            f5: 'none',
        },
        inputEnabled: {
            left: true,
            right: true,
            up: isMaze || isShooter,
            down: isMaze || isShooter,
            jump: !isShooter && !isMaze,
            attack: isShooter || !isMaze,
            f1: false,
            f2: true,
            f3: false,
            f4: false,
            f5: false,
            inventory: false,
            pause: true,
        },
        health: {
            maxHealth: 5,
            lives: 3,
            invulnerabilityFrames: 60,
            knockbackX: isShooter ? 0 : 8,
            knockbackY: isShooter ? 0 : 4,
        },
        equippedWeaponId: isShooter ? 'player_blaster' : 'short_sword',
        weapons: [{
                id: isShooter ? 'player_blaster' : 'short_sword',
                name: isShooter ? 'Player Blaster' : 'Short Sword',
                type: isShooter ? 'projectile' : 'melee',
                availability: 'owned',
                pickupItemId: isShooter ? 'pickup_blaster' : 'pickup_short_sword',
                button: 'a',
                state: isShooter ? 'Shooting' : 'Attacking',
                animationRole: 'attack',
                damage: 1,
                cooldownFrames: isShooter ? 12 : 15,
                activeFrames: { start: isShooter ? 0 : 2, end: isShooter ? 1 : 6 },
                hitboxSource: isShooter ? 'none' : 'attackByFacing',
                projectileAssetId: isShooter ? 'player_bullet' : undefined,
                ammo: {
                    enabled: isShooter,
                    initial: isShooter ? 16 : 0,
                    max: isShooter ? 16 : 0,
                    consumePerUse: isShooter ? 1 : 0,
                    refillItemId: isShooter ? 'pickup_ammo' : undefined,
                    refillAmount: isShooter ? 8 : 0,
                    emptyBehavior: 'block',
                    emptyState: 'IDLE',
                },
                durability: {
                    enabled: false,
                    initial: 0,
                    max: 0,
                    consumePerUse: 0,
                    repairItemId: undefined,
                    repairAmount: 0,
                    breakBehavior: 'unequip',
                    brokenState: 'IDLE',
                },
                notes: 'Declarative weapon metadata. ASM runtime support pending.',
            }],
        attack: {
            type: isShooter ? 'projectile' : 'melee',
            damage: 1,
            durationFrames: isShooter ? 0 : 12,
            cooldownFrames: isShooter ? 12 : 15,
            projectileType: isShooter ? 'player_bullet' : undefined,
        },
        interaction: {
            mode: 'pressUp',
            box: { x: -4, y: 4, w: 24, h: 24 },
        },
        sounds: {
            onJump: 'sfx_jump',
            onHit: 'sfx_player_hit',
            onDeath: 'sfx_death',
            onAttack: 'sfx_attack',
            onLand: 'sfx_land',
        },
        soundPresets: {
            onJump: exports.MSX2_PLAYER_SOUND_EVENT_DEFAULT,
            onHit: exports.MSX2_PLAYER_SOUND_EVENT_DEFAULT,
            onDeath: exports.MSX2_PLAYER_SOUND_EVENT_DEFAULT,
            onAttack: exports.MSX2_PLAYER_SOUND_EVENT_DEFAULT,
            onLand: exports.MSX2_PLAYER_SOUND_EVENT_DEFAULT,
        },
        soundCustomValues: {},
        soundAssetIds: {},
        soundAssetCustomValues: {},
        soundsEnabled: {
            onJump: true,
            onHit: true,
            onDeath: true,
            onAttack: true,
            onLand: true,
        },
        inventoryHooks: [],
        stateMachineAssetId: undefined,
        logic: {
            isPlayer: true,
            blocksProjectiles: true,
            affectsEnemies: true,
            pushable: false,
            triggersEvents: true,
            canDie: true,
        },
        stateMachine: isMaze
            ? ['IDLE', 'MOVE', 'ATTACK', 'HURT', 'DEAD', 'INTERACT', 'DIALOGUE_LOCK', 'SCREEN_TRANSITION']
            : ['IDLE', 'WALK', 'JUMP', 'FALL', 'ATTACK', 'HURT', 'DEAD', 'INTERACT', 'DIALOGUE_LOCK', 'SCREEN_TRANSITION'],
        budget: {
            cpu: isShooter ? 2 : 3,
            ram: 64,
            sprites: isShooter ? 1 : 4,
            maxProjectiles: isShooter ? 2 : 0,
        },
        skillBindings: {},
        activeSkills: [],
        skillParameters: buildSkillParametersDefaults(),
        requiredRoutines: isShooter
            ? ['Player_ReadInput', 'Player_UpdateShooter', 'Player_ClampToScreen', 'Player_FireProjectile', 'Player_RenderHardwareSprite']
            : isMaze
                ? ['Player_ReadInput', 'Player_UpdateMaze', 'Player_CheckCollision', 'Player_HandleInteraction', 'Player_RenderHardwareSprite']
                : ['Player_ReadInput', 'Player_UpdatePlatformer', 'Player_CheckCollision', 'Player_ApplyGravity', 'Player_HandleJump', 'Player_HandleDamage', 'Player_HandleScreenTransition', 'Player_RenderHardwareSprite'],
        notes: 'MSX2 player core should stay resident and update every frame.',
    };
};
exports.createDefaultMsx2PlayerDefinition = createDefaultMsx2PlayerDefinition;
const createDefaultMsx2PlayerEntries = () => [
    { id: 'default', x: 32, y: 128, facing: 'right', state: 'IDLE', entryAnimation: 'none', invulnerabilityFrames: 0, cameraTransition: 'instant' },
    { id: 'from_left', x: 8, y: 128, facing: 'right', state: 'IDLE', entryAnimation: 'none', invulnerabilityFrames: 0, cameraTransition: 'instant' },
    { id: 'from_right', x: 231, y: 128, facing: 'left', state: 'IDLE', entryAnimation: 'none', invulnerabilityFrames: 0, cameraTransition: 'instant' },
    { id: 'from_up', x: 96, y: 8, facing: 'down', state: 'IDLE', entryAnimation: 'none', invulnerabilityFrames: 0, cameraTransition: 'instant' },
    { id: 'from_down', x: 96, y: 168, facing: 'up', state: 'IDLE', entryAnimation: 'none', invulnerabilityFrames: 0, cameraTransition: 'instant' },
];
exports.createDefaultMsx2PlayerEntries = createDefaultMsx2PlayerEntries;
const normalizeMsx2PlayerEntries = (entries) => {
    const source = Array.isArray(entries) && entries.length > 0 ? entries : (0, exports.createDefaultMsx2PlayerEntries)();
    return source.map((entry, index) => ({
        id: String(entry.id || `entry_${index + 1}`),
        x: Math.max(0, Math.min(255, Math.round(Number(entry.x) || 0))),
        y: Math.max(0, Math.min(191, Math.round(Number(entry.y) || 0))),
        facing: (0, exports.normalizeMsx2PlayerFacing)(entry.facing, 'right'),
        state: entry.state || 'IDLE',
        playerId: entry.playerId,
        entryAnimation: entry.entryAnimation || 'none',
        invulnerabilityFrames: Math.max(0, Math.min(255, Math.round(Number(entry.invulnerabilityFrames) || 0))),
        cameraTransition: entry.cameraTransition || 'instant',
    }));
};
exports.normalizeMsx2PlayerEntries = normalizeMsx2PlayerEntries;
const normalizeMsx2PlayerDefinition = (player) => {
    const parsed = (0, msx2PlayerImport_1.parseMsx2PlayerImport)(player);
    const profileId = parsed?.gameType === 'maze'
        ? 'maze'
        : parsed?.gameType === 'shooterHorizontal'
            ? 'shooterHorizontal'
            : parsed?.gameType === 'shooterVertical'
                ? 'shooterVertical'
                : 'platform';
    const defaults = (0, exports.createDefaultMsx2PlayerDefinition)(parsed?.id, profileId);
    const functionKeys = (0, exports.normalizeFunctionKeyMapping)(parsed, defaults);
    const controlSources = (0, exports.normalizePlayerControlMapping)(parsed, defaults);
    const functionKeyCustomActions = (0, exports.normalizeFunctionKeyCustomActions)(parsed, functionKeys);
    const { animations, animationOrder } = (0, exports.normalizePlayerAnimations)(parsed, defaults);
    const playerSounds = normalizePlayerSounds(parsed, defaults);
    return {
        ...defaults,
        ...(parsed || {}),
        defaultFacing: (0, exports.normalizeMsx2PlayerFacing)(parsed?.defaultFacing, defaults.defaultFacing),
        render: {
            ...defaults.render,
            ...(parsed?.render || {}),
        },
        hitboxes: {
            ...defaults.hitboxes,
            ...(parsed?.hitboxes || {}),
        },
        movement: {
            ...defaults.movement,
            ...(parsed?.movement || {}),
        },
        health: {
            ...defaults.health,
            ...(parsed?.health || {}),
        },
        weapons: Array.isArray(parsed?.weapons) ? parsed.weapons : defaults.weapons,
        equippedWeaponId: Object.prototype.hasOwnProperty.call(parsed || {}, 'equippedWeaponId')
            ? parsed?.equippedWeaponId
            : defaults.equippedWeaponId,
        attack: {
            ...defaults.attack,
            ...(parsed?.attack || {}),
        },
        interaction: {
            ...defaults.interaction,
            ...(parsed?.interaction || {}),
        },
        animations,
        animationOrder,
        ...playerSounds,
        stateMachineAssetId: parsed?.stateMachineAssetId || defaults.stateMachineAssetId,
        logic: {
            ...defaults.logic,
            ...(parsed?.logic || {}),
        },
        components: {
            ...(defaults.components || {}),
            ...(parsed?.components || {}),
        },
        inputMapping: {
            ...defaults.inputMapping,
            ...(parsed?.inputMapping || {}),
            ...controlSources,
            ...functionKeys,
        },
        inputEnabled: {
            ...defaults.inputEnabled,
            ...(parsed?.inputEnabled || {}),
            f1: parsed?.inputEnabled?.f1 ?? parsed?.inputEnabled?.inventory ?? defaults.inputEnabled.f1,
            f2: parsed?.inputEnabled?.f2 ?? parsed?.inputEnabled?.pause ?? defaults.inputEnabled.f2,
        },
        functionKeyCustomActions,
        skillBindings: {
            ...(defaults.skillBindings || {}),
            ...(parsed?.skillBindings || {}),
        },
        activeSkills: parsed?.activeSkills ?? defaults.activeSkills,
        skillParameters: mergeSkillParameters(parsed?.skillParameters),
    };
};
exports.normalizeMsx2PlayerDefinition = normalizeMsx2PlayerDefinition;
