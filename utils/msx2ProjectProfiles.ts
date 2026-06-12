import { ComponentDefinition, EntityTemplate, ProjectAsset, Msx2GameFlowGraph, Msx2GameProfileId, Msx2ProjectProfile, Msx2Screen4BitmapRoom, Msx2Screen4Runtime, Msx2Screen4TileScreen } from '../types';
import { createDefaultScreen5PaletteSlots } from './msx2PaletteUtils';
import { normalizeMsx2ShooterRuntimeConfig } from './msx2ShooterRuntime';
import {
  MSX2_ENTITY_REPERTOIRE,
  Msx2EntityCreatePreset,
  buildMsx2EntityComponents,
} from '../components/msx2_screen4_editor/msx2EntityCatalog';
import { createDefaultMsx2PlayerEntries } from './msx2PlayerDefaults';

export interface Msx2GameProfileOption {
  id: Msx2GameProfileId;
  label: string;
  description: string;
  previewKind: Msx2GameProfileId;
}

const MSX2_SHARED_ASSET_TYPES: ProjectAsset['type'][] = [
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

const MSX2_PLATFORM_MAZE_ASSET_TYPES: ProjectAsset['type'][] = [
  ...MSX2_SHARED_ASSET_TYPES,
  'msx2bitmaproom',
];

const PROFILE_DEFINITIONS: Record<Msx2GameProfileId, Omit<Msx2ProjectProfile, 'version'>> = {
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
        'carryable_object',
        'custom_entity',
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
        'msx2_carryable',
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
        'custom_entity',
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
        'custom_entity',
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
        'carryable_object',
        'custom_entity',
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
        'msx2_carryable',
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
        'custom_entity',
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
export const MSX2_CREATABLE_GAME_PROFILE_IDS: Msx2GameProfileId[] = [
  'platform',
  'maze',
  'shooterVertical',
  'shooterHorizontal',
];

export const MSX2_GAME_PROFILE_OPTIONS: Msx2GameProfileOption[] = MSX2_CREATABLE_GAME_PROFILE_IDS.map(id => ({
  id,
  label: PROFILE_DEFINITIONS[id].label,
  description: PROFILE_DEFINITIONS[id].description,
  previewKind: id,
}));

export function buildMsx2ProjectProfile(profileId: Msx2GameProfileId): Msx2ProjectProfile {
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

export function normalizeMsx2ProjectProfile(
  profile: Msx2ProjectProfile | null | undefined
): Msx2ProjectProfile | null {
  if (!profile?.profileId) return null;
  const latest = buildMsx2ProjectProfile(profile.profileId);
  const mergeUnique = <T,>(saved: readonly T[] | undefined, baseline: readonly T[]): T[] => {
    const merged = new Set<T>([...(saved || []), ...baseline]);
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

export function resolveMsx2ProjectProfile(
  profile: Msx2ProjectProfile | null | undefined,
  profileId?: Msx2GameProfileId | null
): Msx2ProjectProfile | null {
  if (profile?.profileId) return normalizeMsx2ProjectProfile(profile);
  if (profileId) return buildMsx2ProjectProfile(profileId);
  return null;
}

export function isAssetTypeAllowedForMsx2Profile(
  assetType: ProjectAsset['type'],
  profile: Msx2ProjectProfile | null | undefined
): boolean {
  if (!profile) return true;
  return profile.filters.allowedAssetTypes.includes(assetType);
}

export const MSX2_ENTITY_TEMPLATE_ID_PREFIX = 'tpl_msx2_';

export function getMsx2EntityPresetIdFromTemplateId(templateId: string): string | null {
  if (!templateId.startsWith(MSX2_ENTITY_TEMPLATE_ID_PREFIX)) return null;
  return templateId.slice(MSX2_ENTITY_TEMPLATE_ID_PREFIX.length);
}

export function getMsx2EntityTemplateId(presetId: string): string {
  return `${MSX2_ENTITY_TEMPLATE_ID_PREFIX}${presetId}`;
}

export function filterMsx2EntityPresetsForProfile(
  presets: Msx2EntityCreatePreset[],
  profile: Msx2ProjectProfile | null | undefined
): Msx2EntityCreatePreset[] {
  if (!profile) return presets;
  const allowed = new Set(profile.filters.allowedEntityPresetIds);
  const filtered = presets.filter(preset => allowed.has(preset.id));
  return filtered.length > 0 ? filtered : presets.filter(preset => preset.id === profile.filters.defaultEntityPresetId);
}

export function isEntityTemplateAllowedForMsx2Profile(
  template: EntityTemplate,
  profile: Msx2ProjectProfile | null | undefined
): boolean {
  if (!profile) return true;
  const presetId = getMsx2EntityPresetIdFromTemplateId(template.id);
  if (!presetId) return true;
  return profile.filters.allowedEntityPresetIds.includes(presetId);
}

export function filterEntityTemplatesForMsx2Profile(
  templates: EntityTemplate[],
  profile: Msx2ProjectProfile | null | undefined
): EntityTemplate[] {
  if (!profile) return templates;
  return templates.filter(template => isEntityTemplateAllowedForMsx2Profile(template, profile));
}

export function isComponentDefinitionAllowedForMsx2Profile(
  component: ComponentDefinition,
  profile: Msx2ProjectProfile | null | undefined
): boolean {
  if (!profile) return true;
  if ((component.target || 'MSX1') !== 'MSX2') return true;
  return isMsx2ComponentAllowedForProfile(component.id, profile);
}

export function filterComponentDefinitionsForMsx2Profile(
  components: ComponentDefinition[],
  profile: Msx2ProjectProfile | null | undefined
): ComponentDefinition[] {
  if (!profile) return components;
  return components.filter(component => isComponentDefinitionAllowedForMsx2Profile(component, profile));
}

export function getMsx2ProfileEntityLabels(profile: Msx2ProjectProfile | null | undefined): string[] {
  if (!profile) return [];
  const allowed = new Set(profile.filters.allowedEntityPresetIds);
  return MSX2_ENTITY_REPERTOIRE
    .filter(preset => allowed.has(preset.id))
    .map(preset => preset.label);
}

export type Msx2LockedRuntimeMode = 'platform' | 'maze' | 'shooterVertical' | 'shooterHorizontal';

export function getMsx2LockedRuntimeMode(
  profile: Msx2ProjectProfile | null | undefined
): Msx2LockedRuntimeMode | null {
  if (!profile) return null;
  const mode = profile.movementMode;
  if (mode === 'platform' || mode === 'maze' || mode === 'shooterVertical' || mode === 'shooterHorizontal') {
    return mode;
  }
  return null;
}

export function getMsx2LockedRuntimeModeLabel(mode: Msx2LockedRuntimeMode): string {
  switch (mode) {
    case 'platform': return 'Player platform';
    case 'maze': return 'Maze';
    case 'shooterVertical': return 'Shooter vertical 60Hz';
    case 'shooterHorizontal': return 'Shooter horizontal';
    default: return mode;
  }
}

export function mapMsx2MovementOptionToEngine(optionValue: string): string {
  if (optionValue === 'static') return 'staticEnemy';
  return optionValue;
}

export function filterMsx2EntityMovementOptionsForProfile<T extends { value: string }>(
  options: readonly T[],
  profile: Msx2ProjectProfile | null | undefined
): T[] {
  if (!profile) return [...options];
  const allowed = new Set(profile.filters.allowedEntityEngines);
  return options.filter(option => allowed.has(mapMsx2MovementOptionToEngine(option.value)));
}

export function isMsx2ComponentAllowedForProfile(
  componentId: string,
  profile: Msx2ProjectProfile | null | undefined
): boolean {
  if (!profile) return true;
  return profile.filters.allowedComponentIds.includes(componentId);
}

function buildDefaultRuntime(profile: Msx2ProjectProfile): Msx2Screen4Runtime {
  if (profile.screenEngine === 'shooter') {
    const shooter = normalizeMsx2ShooterRuntimeConfig({
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

export function buildStarterMsx2GameFlowAsset(
  profile: Msx2ProjectProfile,
  screenId: string,
  projectName: string,
  purpose: Msx2GameFlowGraph['purpose'] = 'screen4-runtime'
): Msx2GameFlowGraph {
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

function buildStarterPlayerEntity(profile: Msx2ProjectProfile) {
  const preset = MSX2_ENTITY_REPERTOIRE.find(item => item.id === profile.filters.defaultEntityPresetId)
    || MSX2_ENTITY_REPERTOIRE[0];
  const startX = profile.profileId === 'shooterVertical' ? 7 : profile.profileId === 'shooterHorizontal' ? 7 : 2;
  const startY = profile.profileId.startsWith('shooter') ? 10 : profile.profileId === 'maze' ? 6 : 9;

  return {
    id: `entity_${profile.profileId}_player_${Date.now()}`,
    name: preset.label,
    kind: preset.kind,
    position: { x: startX, y: startY },
    components: buildMsx2EntityComponents(preset, startX, startY),
    params: { ...(preset.params || {}) },
  };
}

export function buildStarterMsx2BitmapRoomAsset(
  profile: Msx2ProjectProfile,
  projectName: string
): Msx2Screen4BitmapRoom {
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
  const preset = MSX2_ENTITY_REPERTOIRE.find(item => item.id === profile.filters.defaultEntityPresetId)
    || MSX2_ENTITY_REPERTOIRE[0];
  const player = {
    id: `entity_${profile.profileId}_player_${Date.now()}`,
    name: preset.label,
    kind: preset.kind,
    position: { x: 8, y: 10 },
    components: buildMsx2EntityComponents(preset, 8, 10),
    params: { ...(preset.params || {}) },
  };

  return {
    id: roomId,
    name: `${profile.label} Room 1`,
    target: 'MSX2',
    vdpMode: 'SCREEN4_BITMAP_ROOM',
    width: 256,
    height: 192,
    palette: createDefaultScreen5PaletteSlots(),
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
    playerEntries: createDefaultMsx2PlayerEntries(),
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

export function usesMsx2BitmapRoomStarter(profile: Msx2ProjectProfile): boolean {
  return profile.profileId === 'bitmapPlatform';
}

export function buildStarterMsx2ScreenAsset(
  profile: Msx2ProjectProfile,
  projectName: string
): Msx2Screen4TileScreen {
  const screenId = `screen_${profile.profileId}_${projectName.replace(/\s+/g, '_').toLowerCase()}`;
  const tileSize = 16;
  const blankTile = Array.from({ length: tileSize }, () => Array.from({ length: tileSize }, () => 0));
  const floorTile = Array.from({ length: tileSize }, (_, y) =>
    Array.from({ length: tileSize }, (_, x) => y < 3 ? 15 : (x % 8 < 4 ? 5 : 4))
  );
  const collisionRow = profile.profileId === 'platform' ? 11 : -1;
  const map = Array.from({ length: 12 }, (_, rowIndex) =>
    Array.from({ length: 16 }, (_, colIndex) => {
      if (profile.profileId === 'platform' && rowIndex === 11) return 1;
      if (profile.profileId === 'platform' && rowIndex === 8 && colIndex >= 4 && colIndex <= 7) return 1;
      if (profile.profileId === 'maze' && rowIndex % 2 === 0 && colIndex % 2 === 0) return 1;
      return 0;
    })
  );
  const collision = Array.from({ length: 12 }, (_, rowIndex) =>
    Array.from({ length: 16 }, () => (collisionRow === rowIndex ? 1 : 0))
  );

  return {
    id: screenId,
    name: `${profile.label} Stage 1`,
    target: 'MSX2',
    vdpMode: 'SCREEN4',
    tileSize: 16,
    widthTiles: 16,
    heightTiles: 12,
    palette: createDefaultScreen5PaletteSlots(),
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
    playerEntries: createDefaultMsx2PlayerEntries(),
    runtime: buildDefaultRuntime(profile),
  };
}
