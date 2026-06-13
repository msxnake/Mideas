"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MSX2_ENTITY_TEMPLATE_ID_PREFIX = exports.MSX2_GAME_PROFILE_OPTIONS = exports.MSX2_CREATABLE_GAME_PROFILE_IDS = void 0;
exports.buildMsx2ProjectProfile = buildMsx2ProjectProfile;
exports.normalizeMsx2ProjectProfile = normalizeMsx2ProjectProfile;
exports.resolveMsx2ProjectProfile = resolveMsx2ProjectProfile;
exports.isAssetTypeAllowedForMsx2Profile = isAssetTypeAllowedForMsx2Profile;
exports.getMsx2EntityPresetIdFromTemplateId = getMsx2EntityPresetIdFromTemplateId;
exports.getMsx2EntityTemplateId = getMsx2EntityTemplateId;
exports.filterMsx2EntityPresetsForProfile = filterMsx2EntityPresetsForProfile;
exports.isEntityTemplateAllowedForMsx2Profile = isEntityTemplateAllowedForMsx2Profile;
exports.filterEntityTemplatesForMsx2Profile = filterEntityTemplatesForMsx2Profile;
exports.isComponentDefinitionAllowedForMsx2Profile = isComponentDefinitionAllowedForMsx2Profile;
exports.filterComponentDefinitionsForMsx2Profile = filterComponentDefinitionsForMsx2Profile;
exports.getMsx2ProfileEntityLabels = getMsx2ProfileEntityLabels;
exports.getMsx2LockedRuntimeMode = getMsx2LockedRuntimeMode;
exports.getMsx2LockedRuntimeModeLabel = getMsx2LockedRuntimeModeLabel;
exports.mapMsx2MovementOptionToEngine = mapMsx2MovementOptionToEngine;
exports.filterMsx2EntityMovementOptionsForProfile = filterMsx2EntityMovementOptionsForProfile;
exports.isMsx2ComponentAllowedForProfile = isMsx2ComponentAllowedForProfile;
exports.buildStarterMsx2GameFlowAsset = buildStarterMsx2GameFlowAsset;
exports.buildStarterMsx2BitmapRoomAsset = buildStarterMsx2BitmapRoomAsset;
exports.usesMsx2BitmapRoomStarter = usesMsx2BitmapRoomStarter;
exports.buildStarterMsx2ScreenAsset = buildStarterMsx2ScreenAsset;
const msx2PaletteUtils_1 = require("./msx2PaletteUtils");
const msx2ShooterRuntime_1 = require("./msx2ShooterRuntime");
const msx2EntityCatalog_1 = require("../components/msx2_screen4_editor/msx2EntityCatalog");
const msx2PlayerDefaults_1 = require("./msx2PlayerDefaults");
const MSX2_SHARED_ASSET_TYPES = [
    'code',
    'statemachine',
    'globalvariables',
    'palette',
    'msx2sprite',
    'msx2screen',
    'msx2player',
    'msx2enemy',
    'msx2presentation',
    'msx2gameflow',
    'worldmap',
    'msx2hudfont',
    'sound',
    'track',
];
const MSX2_PLATFORM_MAZE_ASSET_TYPES = [
    ...MSX2_SHARED_ASSET_TYPES,
    'msx2bitmaproom',
];
const PROFILE_DEFINITIONS = {
    platform: {
        profileId: 'platform',
        label: 'Platformer',
        description: 'Jump, gravity, platforms, collectibles and screen exits.',
        screenEngine: 'player',
        movementMode: 'platform',
        filters: {
            allowedAssetTypes: [...MSX2_PLATFORM_MAZE_ASSET_TYPES],
            allowedEntityPresetIds: [
                'player',
                'player_shooter',
                'enemy_static',
                'patrol_x',
                'patrol_y',
                'collectible',
                'pickup_item',
                'door',
                'checkpoint',
                'hazard',
                'spike_trap',
                'player_bullet',
            ],
            allowedEntityEngines: [
                'platform',
                'staticEnemy',
                'patrolX',
                'patrolY',
                'collectible',
                'pickupItem',
                'door',
                'checkpoint',
                'hazard',
                'spike',
            ],
            allowedComponentIds: [
                'msx2_transform',
                'msx2_hardware_sprite',
                'msx2_player_control',
                'msx2_movement',
                'msx2_collision',
                'msx2_collectible',
                'msx2_door_exit',
                'msx2_hazard',
                'msx2_ai',
                'msx2_animation',
                'msx2_health',
                'msx2_damage',
                'msx2_spawn',
                'msx2_checkpoint',
                'msx2_screen_transition',
                'msx2_inventory',
                'msx2_score',
                'msx2_timer',
                'msx2_jump',
                'msx2_gravity',
                'msx2_push_box',
                'msx2_platform',
                'msx2_char_render',
                'msx2_grid_snap',
                'msx2_shooter',
                'msx2_projectile',
            ],
            defaultEntityPresetId: 'player',
            showBehaviorLayer: true,
            showEffectsLayer: true,
        },
    },
    maze: {
        profileId: 'maze',
        label: 'Maze',
        description: 'Grid movement, ghosts, collectibles and exits.',
        screenEngine: 'maze',
        movementMode: 'maze',
        filters: {
            allowedAssetTypes: [...MSX2_PLATFORM_MAZE_ASSET_TYPES],
            allowedEntityPresetIds: [
                'player_maze',
                'ghost_maze',
                'collectible',
                'pickup_item',
                'spike_trap',
                'door',
            ],
            allowedEntityEngines: [
                'maze',
                'ghostMaze',
                'collectible',
                'pickupItem',
                'spike',
                'door',
            ],
            allowedComponentIds: [
                'msx2_transform',
                'msx2_hardware_sprite',
                'msx2_player_control',
                'msx2_movement',
                'msx2_collision',
                'msx2_collectible',
                'msx2_door_exit',
                'msx2_hazard',
                'msx2_char_render',
                'msx2_ai',
                'msx2_animation',
                'msx2_health',
                'msx2_damage',
                'msx2_spawn',
                'msx2_screen_transition',
                'msx2_inventory',
                'msx2_score',
                'msx2_push_box',
            ],
            defaultEntityPresetId: 'player_maze',
            showBehaviorLayer: false,
            showEffectsLayer: true,
        },
    },
    shooterVertical: {
        profileId: 'shooterVertical',
        label: 'Shooter vertical 60Hz',
        description: 'Vertical arcade shooter with scroll, pools and 60Hz budget.',
        screenEngine: 'shooter',
        movementMode: 'shooterVertical',
        filters: {
            allowedAssetTypes: [...MSX2_SHARED_ASSET_TYPES],
            allowedEntityPresetIds: [
                'shooter_vertical_player',
                'enemy_static',
                'patrol_y',
                'hazard',
                'collectible',
            ],
            allowedEntityEngines: [
                'shooterVertical',
                'staticEnemy',
                'patrolY',
                'hazard',
                'collectible',
            ],
            allowedComponentIds: [
                'msx2_transform',
                'msx2_hardware_sprite',
                'msx2_player_control',
                'msx2_movement',
                'msx2_collision',
                'msx2_shooter',
                'msx2_projectile',
                'msx2_health',
                'msx2_damage',
                'msx2_spawn',
                'msx2_score',
                'msx2_lives',
                'msx2_scroll',
                'msx2_hazard',
            ],
            defaultEntityPresetId: 'shooter_vertical_player',
            showBehaviorLayer: false,
            showEffectsLayer: false,
        },
    },
    bitmapPlatform: {
        profileId: 'bitmapPlatform',
        label: 'Action bitmap (VK-style)',
        description: 'SCREEN 4 bitmap rooms composed with V9938 copy/fill/line commands and hardware sprites.',
        screenEngine: 'player',
        movementMode: 'platform',
        filters: {
            allowedAssetTypes: [...MSX2_PLATFORM_MAZE_ASSET_TYPES],
            allowedEntityPresetIds: [
                'player',
                'player_shooter',
                'enemy_static',
                'patrol_x',
                'patrol_y',
                'collectible',
                'pickup_item',
                'door',
                'checkpoint',
                'hazard',
                'spike_trap',
                'player_bullet',
            ],
            allowedEntityEngines: [
                'platform',
                'staticEnemy',
                'patrolX',
                'patrolY',
                'collectible',
                'pickupItem',
                'door',
                'checkpoint',
                'hazard',
                'spike',
            ],
            allowedComponentIds: [
                'msx2_transform',
                'msx2_hardware_sprite',
                'msx2_player_control',
                'msx2_movement',
                'msx2_collision',
                'msx2_collectible',
                'msx2_door_exit',
                'msx2_hazard',
                'msx2_ai',
                'msx2_animation',
                'msx2_health',
                'msx2_damage',
                'msx2_spawn',
                'msx2_checkpoint',
                'msx2_screen_transition',
                'msx2_inventory',
                'msx2_score',
                'msx2_timer',
                'msx2_jump',
                'msx2_gravity',
                'msx2_push_box',
                'msx2_platform',
                'msx2_shooter',
                'msx2_projectile',
            ],
            defaultEntityPresetId: 'player',
            showBehaviorLayer: true,
            showEffectsLayer: true,
        },
    },
    shooterHorizontal: {
        profileId: 'shooterHorizontal',
        label: 'Shooter horizontal',
        description: 'Galaxian-style formation, dive attacks and wave controller.',
        screenEngine: 'shooter',
        movementMode: 'shooterHorizontal',
        filters: {
            allowedAssetTypes: [...MSX2_SHARED_ASSET_TYPES],
            allowedEntityPresetIds: [
                'galaxian_player',
                'galaxian_alien_formation',
                'galaxian_laser',
                'galaxian_wave_controller',
                'enemy_static',
                'hazard',
            ],
            allowedEntityEngines: [
                'shooterHorizontal',
                'patrolX',
                'staticEnemy',
                'hazard',
                'checkpoint',
            ],
            allowedComponentIds: [
                'msx2_transform',
                'msx2_hardware_sprite',
                'msx2_player_control',
                'msx2_movement',
                'msx2_collision',
                'msx2_shooter',
                'msx2_projectile',
                'msx2_formation',
                'msx2_attack_pattern',
                'msx2_attack_wave',
                'msx2_wave',
                'msx2_health',
                'msx2_damage',
                'msx2_spawn',
                'msx2_score',
                'msx2_lives',
                'msx2_timer',
                'msx2_hazard',
            ],
            defaultEntityPresetId: 'galaxian_player',
            showBehaviorLayer: false,
            showEffectsLayer: false,
        },
    },
};
/** Profiles offered when creating a new MSX2 project (bitmap starter is internal-only). */
exports.MSX2_CREATABLE_GAME_PROFILE_IDS = [
    'platform',
    'maze',
    'shooterVertical',
    'shooterHorizontal',
];
exports.MSX2_GAME_PROFILE_OPTIONS = exports.MSX2_CREATABLE_GAME_PROFILE_IDS.map(id => ({
    id,
    label: PROFILE_DEFINITIONS[id].label,
    description: PROFILE_DEFINITIONS[id].description,
    previewKind: id,
}));
function buildMsx2ProjectProfile(profileId) {
    const definition = PROFILE_DEFINITIONS[profileId];
    if (!definition) {
        throw new Error(`Unknown MSX2 game profile: ${profileId}`);
    }
    return {
        version: 1,
        ...definition,
        filters: {
            ...definition.filters,
            allowedAssetTypes: [...definition.filters.allowedAssetTypes],
            allowedEntityPresetIds: [...definition.filters.allowedEntityPresetIds],
            allowedEntityEngines: [...definition.filters.allowedEntityEngines],
            allowedComponentIds: [...definition.filters.allowedComponentIds],
        },
    };
}
function normalizeMsx2ProjectProfile(profile) {
    if (!profile?.profileId)
        return null;
    const latest = buildMsx2ProjectProfile(profile.profileId);
    const mergeUnique = (saved, baseline) => {
        const merged = new Set([...(saved || []), ...baseline]);
        return [...merged];
    };
    return {
        ...latest,
        ...profile,
        filters: {
            ...latest.filters,
            ...profile.filters,
            allowedAssetTypes: mergeUnique(profile.filters?.allowedAssetTypes, latest.filters.allowedAssetTypes),
            allowedEntityPresetIds: mergeUnique(profile.filters?.allowedEntityPresetIds, latest.filters.allowedEntityPresetIds),
            allowedEntityEngines: mergeUnique(profile.filters?.allowedEntityEngines, latest.filters.allowedEntityEngines),
            allowedComponentIds: mergeUnique(profile.filters?.allowedComponentIds, latest.filters.allowedComponentIds),
        },
    };
}
function resolveMsx2ProjectProfile(profile, profileId) {
    if (profile?.profileId)
        return normalizeMsx2ProjectProfile(profile);
    if (profileId)
        return buildMsx2ProjectProfile(profileId);
    return null;
}
function isAssetTypeAllowedForMsx2Profile(assetType, profile) {
    if (!profile)
        return true;
    return profile.filters.allowedAssetTypes.includes(assetType);
}
exports.MSX2_ENTITY_TEMPLATE_ID_PREFIX = 'tpl_msx2_';
function getMsx2EntityPresetIdFromTemplateId(templateId) {
    if (!templateId.startsWith(exports.MSX2_ENTITY_TEMPLATE_ID_PREFIX))
        return null;
    return templateId.slice(exports.MSX2_ENTITY_TEMPLATE_ID_PREFIX.length);
}
function getMsx2EntityTemplateId(presetId) {
    return `${exports.MSX2_ENTITY_TEMPLATE_ID_PREFIX}${presetId}`;
}
function filterMsx2EntityPresetsForProfile(presets, profile) {
    if (!profile)
        return presets;
    const allowed = new Set(profile.filters.allowedEntityPresetIds);
    const filtered = presets.filter(preset => allowed.has(preset.id));
    return filtered.length > 0 ? filtered : presets.filter(preset => preset.id === profile.filters.defaultEntityPresetId);
}
function isEntityTemplateAllowedForMsx2Profile(template, profile) {
    if (!profile)
        return true;
    const presetId = getMsx2EntityPresetIdFromTemplateId(template.id);
    if (!presetId)
        return true;
    return profile.filters.allowedEntityPresetIds.includes(presetId);
}
function filterEntityTemplatesForMsx2Profile(templates, profile) {
    if (!profile)
        return templates;
    return templates.filter(template => isEntityTemplateAllowedForMsx2Profile(template, profile));
}
function isComponentDefinitionAllowedForMsx2Profile(component, profile) {
    if (!profile)
        return true;
    if ((component.target || 'MSX1') !== 'MSX2')
        return true;
    return isMsx2ComponentAllowedForProfile(component.id, profile);
}
function filterComponentDefinitionsForMsx2Profile(components, profile) {
    if (!profile)
        return components;
    return components.filter(component => isComponentDefinitionAllowedForMsx2Profile(component, profile));
}
function getMsx2ProfileEntityLabels(profile) {
    if (!profile)
        return [];
    const allowed = new Set(profile.filters.allowedEntityPresetIds);
    return msx2EntityCatalog_1.MSX2_ENTITY_REPERTOIRE
        .filter(preset => allowed.has(preset.id))
        .map(preset => preset.label);
}
function getMsx2LockedRuntimeMode(profile) {
    if (!profile)
        return null;
    const mode = profile.movementMode;
    if (mode === 'platform' || mode === 'maze' || mode === 'shooterVertical' || mode === 'shooterHorizontal') {
        return mode;
    }
    return null;
}
function getMsx2LockedRuntimeModeLabel(mode) {
    switch (mode) {
        case 'platform': return 'Player platform';
        case 'maze': return 'Maze';
        case 'shooterVertical': return 'Shooter vertical 60Hz';
        case 'shooterHorizontal': return 'Shooter horizontal';
        default: return mode;
    }
}
function mapMsx2MovementOptionToEngine(optionValue) {
    if (optionValue === 'static')
        return 'staticEnemy';
    return optionValue;
}
function filterMsx2EntityMovementOptionsForProfile(options, profile) {
    if (!profile)
        return [...options];
    const allowed = new Set(profile.filters.allowedEntityEngines);
    return options.filter(option => allowed.has(mapMsx2MovementOptionToEngine(option.value)));
}
function isMsx2ComponentAllowedForProfile(componentId, profile) {
    if (!profile)
        return true;
    return profile.filters.allowedComponentIds.includes(componentId);
}
function buildDefaultRuntime(profile) {
    if (profile.screenEngine === 'shooter') {
        const shooter = (0, msx2ShooterRuntime_1.normalizeMsx2ShooterRuntimeConfig)({
            direction: profile.movementMode === 'shooterHorizontal' ? 'horizontal' : 'vertical',
            scrollMode: profile.movementMode === 'shooterHorizontal' ? 'none' : 'tileVertical',
        });
        return {
            screenKind: 'playable',
            screenEngine: 'shooter',
            movementMode: profile.movementMode,
            movementModel: profile.movementMode,
            requiredCollectibles: 0,
            initialAir: 0,
            disableAirTimer: true,
            airTimer: false,
            activeAreaX: 0,
            activeAreaY: 0,
            activeAreaWidth: 16,
            activeAreaHeight: 12,
            hideHud: profile.movementMode === 'shooterHorizontal',
            shooter,
            notes: `Starter screen for MSX2 ${profile.label} project.`,
        };
    }
    if (profile.screenEngine === 'maze') {
        return {
            screenKind: 'playable',
            screenEngine: 'maze',
            movementMode: 'maze',
            movementModel: 'maze',
            requiredCollectibles: 0,
            initialAir: 0,
            disableAirTimer: true,
            activeAreaX: 0,
            activeAreaY: 0,
            activeAreaWidth: 16,
            activeAreaHeight: 12,
            notes: `Starter screen for MSX2 ${profile.label} project.`,
        };
    }
    return {
        screenKind: 'playable',
        screenEngine: 'player',
        movementMode: 'platform',
        movementModel: 'platform',
        requiredCollectibles: 0,
        initialAir: 255,
        activeAreaX: 0,
        activeAreaY: 0,
        activeAreaWidth: 16,
        activeAreaHeight: 12,
        notes: `Starter screen for MSX2 ${profile.label} project.`,
    };
}
function buildStarterMsx2GameFlowAsset(profile, screenId, projectName, purpose = 'screen4-runtime') {
    const slug = projectName.replace(/\s+/g, '_').toLowerCase();
    const startId = `gf_start_${profile.profileId}_${slug}`;
    const screenNodeId = `gf_screen_${profile.profileId}_${slug}`;
    return {
        id: `gf_${profile.profileId}_${slug}`,
        name: 'Main MSX2',
        target: 'MSX2',
        purpose,
        startNodeId: startId,
        panOffset: { x: 0, y: 0 },
        zoomLevel: 1,
        nodes: [
            { id: startId, type: 'Start', position: { x: 70, y: 110 } },
            {
                id: screenNodeId,
                type: 'Screen4Screen',
                position: { x: 320, y: 110 },
                screenAssetId: screenId,
                waitForKey: false,
                waitFrames: 0,
            },
        ],
        connections: [
            { id: `gf_conn_${profile.profileId}_${slug}`, from: { nodeId: startId }, to: { nodeId: screenNodeId } },
        ],
    };
}
function buildStarterPlayerEntity(profile) {
    const preset = msx2EntityCatalog_1.MSX2_ENTITY_REPERTOIRE.find(item => item.id === profile.filters.defaultEntityPresetId)
        || msx2EntityCatalog_1.MSX2_ENTITY_REPERTOIRE[0];
    const startX = profile.profileId === 'shooterVertical' ? 7 : profile.profileId === 'shooterHorizontal' ? 7 : 2;
    const startY = profile.profileId.startsWith('shooter') ? 10 : profile.profileId === 'maze' ? 6 : 9;
    return {
        id: `entity_${profile.profileId}_player_${Date.now()}`,
        name: preset.label,
        kind: preset.kind,
        position: { x: startX, y: startY },
        components: (0, msx2EntityCatalog_1.buildMsx2EntityComponents)(preset, startX, startY),
        params: { ...(preset.params || {}) },
    };
}
function buildStarterMsx2BitmapRoomAsset(profile, projectName) {
    const roomId = `bitmap_room_${profile.profileId}_${projectName.replace(/\s+/g, '_').toLowerCase()}`;
    const atlasPixels = Array.from({ length: 64 }, () => Array.from({ length: 256 }, () => 0));
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            atlasPixels[y][x] = (x + y) % 2 === 0 ? 4 : 5;
        }
    }
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            atlasPixels[16 + y][x] = 15;
        }
    }
    const preset = msx2EntityCatalog_1.MSX2_ENTITY_REPERTOIRE.find(item => item.id === profile.filters.defaultEntityPresetId)
        || msx2EntityCatalog_1.MSX2_ENTITY_REPERTOIRE[0];
    const player = {
        id: `entity_${profile.profileId}_player_${Date.now()}`,
        name: preset.label,
        kind: preset.kind,
        position: { x: 8, y: 10 },
        components: (0, msx2EntityCatalog_1.buildMsx2EntityComponents)(preset, 8, 10),
        params: { ...(preset.params || {}) },
    };
    return {
        id: roomId,
        name: `${profile.label} Room 1`,
        target: 'MSX2',
        vdpMode: 'SCREEN4_BITMAP_ROOM',
        width: 256,
        height: 192,
        palette: (0, msx2PaletteUtils_1.createDefaultScreen5PaletteSlots)(),
        atlas: {
            width: 256,
            height: 64,
            offscreenBaseY: 320,
            pixels: atlasPixels,
            entries: [
                { id: 'floor_tile', name: 'Floor 8x8', sx: 0, sy: 0, w: 8, h: 8 },
                { id: 'hud_glyph', name: 'HUD Glyph 8x8', sx: 0, sy: 16, w: 8, h: 8 },
                { id: 'door_icon', name: 'Door 16x16', sx: 0, sy: 48, w: 16, h: 16 },
            ],
        },
        composition: {
            source: 'authored',
            commands: [
                { id: 'clear', op: 'fill', x: 0, y: 0, w: 256, h: 192, color: 1 },
                { id: 'floor_row', op: 'copy', atlasEntryId: 'floor_tile', dx: 0, dy: 160, w: 8, h: 8 },
                { id: 'floor_row_2', op: 'copy', atlasEntryId: 'floor_tile', dx: 8, dy: 160, w: 8, h: 8 },
                { id: 'floor_row_3', op: 'copy', atlasEntryId: 'floor_tile', dx: 16, dy: 160, w: 8, h: 8 },
                { id: 'hud_label', op: 'copy', atlasEntryId: 'hud_glyph', dx: 8, dy: 0, w: 8, h: 8 },
                { id: 'player_bar_bg', op: 'fill', x: 59, y: 13, w: 66, h: 6, color: 0 },
                { id: 'player_bar', op: 'fill', x: 60, y: 14, w: 64, h: 4, color: 11 },
                { id: 'player_bar_top', op: 'lineH', x: 59, y: 13, length: 66, color: 14 },
                { id: 'door', op: 'copy', atlasEntryId: 'door_icon', dx: 64, dy: 128, w: 16, h: 16 },
            ],
        },
        collision: Array.from({ length: 12 }, () => Array.from({ length: 16 }, () => 0)),
        effects: Array.from({ length: 12 }, () => Array.from({ length: 16 }, () => 0)),
        behavior: Array.from({ length: 12 }, () => Array.from({ length: 16 }, () => 0)),
        entities: [player],
        playerEntries: (0, msx2PlayerDefaults_1.createDefaultMsx2PlayerEntries)(),
        runtime: {
            screenKind: 'playable',
            screenEngine: 'player',
            movementMode: 'platform',
            movementModel: 'platform',
            requiredCollectibles: 0,
            initialAir: 255,
            activeAreaX: 0,
            activeAreaY: 0,
            activeAreaWidth: 16,
            activeAreaHeight: 12,
            hudStyle: 'statusBars',
            playerEnergyMax: 64,
            playerEnergyInitial: 64,
            notes: `Starter bitmap SCREEN 4 room for ${profile.label}.`,
        },
        notes: 'V9938 bitmap room: atlas in offscreen VRAM, visible page composed by command list.',
    };
}
function usesMsx2BitmapRoomStarter(profile) {
    return profile.profileId === 'bitmapPlatform';
}
function buildStarterMsx2ScreenAsset(profile, projectName) {
    const screenId = `screen_${profile.profileId}_${projectName.replace(/\s+/g, '_').toLowerCase()}`;
    const tileSize = 16;
    const blankTile = Array.from({ length: tileSize }, () => Array.from({ length: tileSize }, () => 0));
    const floorTile = Array.from({ length: tileSize }, (_, y) => Array.from({ length: tileSize }, (_, x) => y < 3 ? 15 : (x % 8 < 4 ? 5 : 4)));
    const collisionRow = profile.profileId === 'platform' ? 11 : -1;
    const map = Array.from({ length: 12 }, (_, rowIndex) => Array.from({ length: 16 }, (_, colIndex) => {
        if (profile.profileId === 'platform' && rowIndex === 11)
            return 1;
        if (profile.profileId === 'platform' && rowIndex === 8 && colIndex >= 4 && colIndex <= 7)
            return 1;
        if (profile.profileId === 'maze' && rowIndex % 2 === 0 && colIndex % 2 === 0)
            return 1;
        return 0;
    }));
    const collision = Array.from({ length: 12 }, (_, rowIndex) => Array.from({ length: 16 }, () => (collisionRow === rowIndex ? 1 : 0)));
    return {
        id: screenId,
        name: `${profile.label} Stage 1`,
        target: 'MSX2',
        vdpMode: 'SCREEN4',
        tileSize: 16,
        widthTiles: 16,
        heightTiles: 12,
        palette: (0, msx2PaletteUtils_1.createDefaultScreen5PaletteSlots)(),
        tiles: [
            { id: `${screenId}_tile_0`, name: 'Blank', width: tileSize, height: tileSize, pixels: blankTile },
            { id: `${screenId}_tile_1`, name: 'Solid', width: tileSize, height: tileSize, pixels: floorTile },
        ],
        map,
        collisionMap: collision,
        layers: {
            collision,
            effects: Array.from({ length: 12 }, () => Array.from({ length: 16 }, () => 0)),
            behavior: Array.from({ length: 12 }, () => Array.from({ length: 16 }, () => 0)),
            entities: [buildStarterPlayerEntity(profile)],
        },
        playerEntries: (0, msx2PlayerDefaults_1.createDefaultMsx2PlayerEntries)(),
        runtime: buildDefaultRuntime(profile),
    };
}
