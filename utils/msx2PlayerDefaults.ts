import { Msx2GameProfileId, Msx2PlayerAnimation, Msx2PlayerAnimationPlayback, Msx2PlayerAnimationRole, Msx2PlayerButtonBinding, Msx2PlayerControlId, Msx2PlayerDefinition, Msx2PlayerEntry, Msx2PlayerFacing, Msx2PlayerFunctionKeyAction, Msx2PlayerFunctionKeyId, Msx2PlayerGameType, Msx2PlayerInputSource, Msx2PlayerSpriteSize, Msx2Sprite } from '../types';
import { StateMachine } from '../statemachine.types';
import { parseMsx2PlayerImport } from './msx2PlayerImport';
import { getAllSkills } from './msxGenerator/skills/index';
import type { SkillDef, SkillParameterDef } from './msxGenerator/skills/types';

const coerceSkillParameterValue = (param: SkillParameterDef, raw: unknown): number | boolean => {
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

const buildSkillParametersDefaults = (): Record<string, Record<string, number | boolean>> => {
  const result: Record<string, Record<string, number | boolean>> = {};
  for (const skill of getAllSkills() as SkillDef[]) {
    // R1-A: only seed defaults for optional skills. Core skills (jump, gravity, ...)
    // stay opt-in: the legacy movement.* / components['msx2_jump'] runtime path is
    // preserved until the user explicitly opens the skill dialog and edits it.
    // This avoids breaking legacy projects whose physics values would otherwise be
    // overwritten by 8.8 fixed-point defaults from the skill registry.
    if (skill.required) continue;
    if (!skill.parameters?.length) continue;
    result[skill.id] = skill.parameters.reduce<Record<string, number | boolean>>((acc, param) => {
      acc[param.key] = param.default;
      return acc;
    }, {});
  }
  return result;
};

const mergeSkillParameters = (
  playerSkillParameters: Record<string, Record<string, number | boolean>> | undefined,
): Record<string, Record<string, number | boolean>> => {
  const defaults = buildSkillParametersDefaults();
  const raw = playerSkillParameters && typeof playerSkillParameters === 'object' ? playerSkillParameters : {};
  const merged: Record<string, Record<string, number | boolean>> = {};
  const knownSkillIds = new Set<string>([...Object.keys(defaults), ...Object.keys(raw)]);
  for (const skillId of knownSkillIds) {
    const defParams = defaults[skillId] || {};
    const fromRaw = raw[skillId] && typeof raw[skillId] === 'object' ? raw[skillId] : {};
    const skillDef = (getAllSkills() as SkillDef[]).find(s => s.id === skillId);
    const paramDefs: SkillParameterDef[] = skillDef?.parameters || [];
    const skillMerged: Record<string, number | boolean> = { ...defParams, ...fromRaw };
    for (const param of paramDefs) {
      skillMerged[param.key] = coerceSkillParameterValue(param, skillMerged[param.key]);
    }
    merged[skillId] = skillMerged;
  }
  return merged;
};

const MSX2_PLAYER_SPRITE_SIZE_PRESETS: Msx2PlayerSpriteSize[] = ['16x16', '16x32', '32x16', '32x32'];
export const MSX2_PLAYER_FACING_OPTIONS: ReadonlyArray<{ value: Msx2PlayerFacing; label: string }> = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'right', label: 'Right' },
  { value: 'left', label: 'Left' },
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' },
];

const MSX2_PLAYER_FACING_IDS = MSX2_PLAYER_FACING_OPTIONS.map(option => option.value);

export const normalizeMsx2PlayerFacing = (
  raw: unknown,
  fallback: Msx2PlayerFacing = 'right',
): Msx2PlayerFacing => {
  const value = String(raw || '').trim().toLowerCase();
  return MSX2_PLAYER_FACING_IDS.includes(value as Msx2PlayerFacing)
    ? value as Msx2PlayerFacing
    : fallback;
};

export const parsePlayerSpriteSize = (
  size: Msx2PlayerSpriteSize | string | undefined,
): { width: number; height: number } => {
  const [width, height] = String(size || '16x16').split('x').map(value => Number(value));
  return { width: width || 16, height: height || 16 };
};

export const dimensionsToPlayerSpriteSize = (width: number, height: number): Msx2PlayerSpriteSize => {
  const key = `${Math.max(1, Math.trunc(width))}x${Math.max(1, Math.trunc(height))}` as Msx2PlayerSpriteSize;
  return MSX2_PLAYER_SPRITE_SIZE_PRESETS.includes(key) ? key : '16x16';
};

export const spriteSizeFromMsx2Sprite = (
  sprite: Pick<Msx2Sprite, 'size'> | null | undefined,
): Msx2PlayerSpriteSize | undefined => {
  if (!sprite?.size) return undefined;
  return dimensionsToPlayerSpriteSize(sprite.size.width, sprite.size.height);
};

const gameTypeFromProfile = (profileId?: Msx2GameProfileId | null): Msx2PlayerGameType => {
  if (profileId === 'maze') return 'maze';
  if (profileId === 'shooterHorizontal') return 'shooterHorizontal';
  if (profileId === 'shooterVertical') return 'shooterVertical';
  return 'platform';
};

export const MSX2_FUNCTION_KEY_ACTIONS: ReadonlyArray<{ value: Msx2PlayerFunctionKeyAction; label: string }> = [
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

export const MSX2_PLAYER_INPUT_SOURCES: ReadonlyArray<{ value: Msx2PlayerInputSource; label: string }> = [
  { value: 'arrows', label: 'Arrows' },
  { value: 'joystick1', label: 'Joystick 1' },
  { value: 'joystick2', label: 'Joystick 2' },
];

export const MSX2_PLAYER_BUTTON_BINDINGS: ReadonlyArray<{ value: Msx2PlayerButtonBinding; label: string }> = [
  { value: 'upArrow', label: 'Up Arrow' },
  { value: 'spc', label: 'Key SPC' },
  { value: 'n', label: 'Key N' },
  { value: 'm', label: 'Key M' },
  { value: 'joyA', label: 'Joystick Button A' },
  { value: 'joyB', label: 'Joystick Button B' },
];

/** @deprecated Use MSX2_PLAYER_BUTTON_BINDINGS */
export const MSX2_PLAYER_JUMP_BINDINGS = MSX2_PLAYER_BUTTON_BINDINGS;

export const MSX2_PLAYER_ANIMATION_ROLES: ReadonlyArray<{ value: Msx2PlayerAnimationRole; label: string }> = [
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

const ANIMATION_ROLE_IDS = MSX2_PLAYER_ANIMATION_ROLES.map(option => option.value);

export type Msx2PlayerSoundSlotId = 'onJump' | 'onHit' | 'onDeath' | 'onAttack' | 'onLand';

export const MSX2_PLAYER_SOUND_EVENT_DEFAULT = 'event:default' as const;
export const MSX2_PLAYER_SOUND_CUSTOM_ASSET = '__custom__' as const;

export const MSX2_PLAYER_SOUND_SLOTS: ReadonlyArray<{
  id: Msx2PlayerSoundSlotId;
  label: string;
  defaultPreset: string;
}> = [
  { id: 'onJump', label: 'Jump', defaultPreset: 'sfx_jump' },
  { id: 'onHit', label: 'Hit', defaultPreset: 'sfx_player_hit' },
  { id: 'onDeath', label: 'Death', defaultPreset: 'sfx_death' },
  { id: 'onAttack', label: 'Attack', defaultPreset: 'sfx_attack' },
  { id: 'onLand', label: 'Land', defaultPreset: 'sfx_land' },
];

export const resolvePlayerSoundTrigger = (
  preset: string | undefined,
  custom: string | undefined,
  fallback = MSX2_PLAYER_SOUND_EVENT_DEFAULT,
): string => {
  const binding = String(preset || fallback).trim() || fallback;
  if (binding === 'custom') return String(custom || '').trim();
  if (binding.startsWith('anim:') || binding.startsWith('event:')) return binding;
  if (binding.startsWith('sfx_')) return MSX2_PLAYER_SOUND_EVENT_DEFAULT;
  return binding;
};

export const normalizePlayerSoundTriggerPreset = (preset: string | undefined): string => {
  const value = String(preset || MSX2_PLAYER_SOUND_EVENT_DEFAULT).trim() || MSX2_PLAYER_SOUND_EVENT_DEFAULT;
  if (value === 'custom' || value.startsWith('anim:') || value.startsWith('event:')) return value;
  if (value.startsWith('sfx_')) return MSX2_PLAYER_SOUND_EVENT_DEFAULT;
  return MSX2_PLAYER_SOUND_EVENT_DEFAULT;
};

/** @deprecated Use resolvePlayerSoundTrigger for events and resolvePlayerSoundExportId for SFX ids. */
export const resolvePlayerSoundValue = resolvePlayerSoundTrigger;

export const resolvePlayerSoundExportId = (
  soundAssetId: string | undefined,
  soundAssetCustom: string | undefined,
  fallback: string,
): string => {
  if (soundAssetId === MSX2_PLAYER_SOUND_CUSTOM_ASSET) {
    return String(soundAssetCustom || fallback).trim() || fallback;
  }
  if (soundAssetCustom?.trim()) return soundAssetCustom.trim();
  return fallback;
};

export const findAnimationKeyForSoundSlot = (
  slotId: Msx2PlayerSoundSlotId,
  animations: Record<string, Msx2PlayerAnimation>,
  order: string[],
): string | undefined => {
  const roleMatchers: Partial<Record<Msx2PlayerSoundSlotId, Msx2PlayerAnimationRole>> = {
    onJump: 'jump',
    onAttack: 'attack',
    onDeath: 'dead',
  };

  if (slotId === 'onHit') {
    if (animations.hurt) return 'hurt';
    const hitKey = order.find(key => /hurt|hit/i.test(key));
    if (hitKey) return hitKey;
  }

  if (slotId === 'onDeath') {
    const deadKey = order.find(key => key === 'dead' || (/death|dead/i.test(key) && key !== 'hurt'));
    if (deadKey) return deadKey;
  }

  if (slotId === 'onLand') {
    const landKey = order.find(key => {
      const animation = animations[key];
      if (!animation) return false;
      if (/land|fall/i.test(key)) return true;
      const label = labelForAnimationRole(animation).toLowerCase();
      return label.includes('land') || label.includes('fall');
    });
    if (landKey) return landKey;
  }

  const role = roleMatchers[slotId];
  if (role) {
    const roleKey = order.find(key => {
      if (animations[key]?.role !== role) return false;
      if (slotId === 'onDeath' && key === 'hurt') return false;
      return true;
    });
    if (roleKey) return roleKey;
    const namedKey = order.find(key => key.toLowerCase().includes(role) && !(slotId === 'onDeath' && key === 'hurt'));
    if (namedKey) return namedKey;
  }

  return undefined;
};

export const buildSoundsImportFromAnimations = (
  player: Pick<Msx2PlayerDefinition, 'animations' | 'animationOrder' | 'soundPresets' | 'soundsEnabled'>,
): Pick<Msx2PlayerDefinition, 'soundPresets' | 'soundsEnabled'> => {
  const order = player.animationOrder || Object.keys(player.animations);
  const soundPresets = { ...(player.soundPresets || {}) };
  const soundsEnabled = { ...(player.soundsEnabled || {}) };

  MSX2_PLAYER_SOUND_SLOTS.forEach(slot => {
    const animationKey = findAnimationKeyForSoundSlot(slot.id, player.animations, order);
    if (!animationKey) return;
    soundPresets[slot.id] = `anim:${animationKey}`;
    soundsEnabled[slot.id] = true;
  });

  return { soundPresets, soundsEnabled };
};

const normalizePlayerSounds = (
  player: Partial<Msx2PlayerDefinition> | undefined,
  defaults: Msx2PlayerDefinition,
): Pick<Msx2PlayerDefinition, 'sounds' | 'soundsEnabled' | 'soundPresets' | 'soundCustomValues' | 'soundAssetIds' | 'soundAssetCustomValues'> => {
  const soundPresets = { ...(defaults.soundPresets || {}), ...(player?.soundPresets || {}) };
  const soundCustomValues = { ...(defaults.soundCustomValues || {}), ...(player?.soundCustomValues || {}) };
  const soundAssetIds = { ...(defaults.soundAssetIds || {}), ...(player?.soundAssetIds || {}) };
  const soundAssetCustomValues = { ...(defaults.soundAssetCustomValues || {}), ...(player?.soundAssetCustomValues || {}) };
  const soundsEnabled = { ...(defaults.soundsEnabled || {}), ...(player?.soundsEnabled || {}) };
  const sounds = MSX2_PLAYER_SOUND_SLOTS.reduce((result, slot) => {
    const preset = normalizePlayerSoundTriggerPreset(soundPresets[slot.id]);
    const enabled = soundsEnabled[slot.id];
    soundsEnabled[slot.id] = enabled !== false;
    soundPresets[slot.id] = preset;
    result[slot.id] = resolvePlayerSoundExportId(
      soundAssetIds[slot.id],
      soundAssetCustomValues[slot.id],
      player?.sounds?.[slot.id] || slot.defaultPreset,
    );
    return result;
  }, {} as Record<string, string>);

  return { sounds, soundsEnabled, soundPresets, soundCustomValues, soundAssetIds, soundAssetCustomValues };
};

export const stateNamesFromStateMachineAsset = (stateMachine?: StateMachine | null): string[] => {
  if (!stateMachine?.states?.length) return [];
  return stateMachine.states.map(state => String(state.name || state.id).trim()).filter(Boolean);
};

export const buildPlayerStateMachinePatchFromAsset = (
  assetId: string | undefined,
  stateMachineAssets: ReadonlyArray<{ id: string; data?: unknown }>,
): Pick<Msx2PlayerDefinition, 'stateMachineAssetId' | 'stateMachine'> => {
  if (!assetId) {
    return { stateMachineAssetId: undefined, stateMachine: [] };
  }
  const asset = stateMachineAssets.find(entry => entry.id === assetId);
  const stateMachine = asset?.data as StateMachine | undefined;
  const stateNames = stateNamesFromStateMachineAsset(stateMachine);
  return {
    stateMachineAssetId: assetId,
    stateMachine: stateNames,
  };
};

export const labelForAnimationRole = (animation: Msx2PlayerAnimation): string => {
  if (animation.role === 'custom') return animation.customRole?.trim() || 'Custom';
  const role = animation.role || 'custom';
  return MSX2_PLAYER_ANIMATION_ROLES.find(option => option.value === role)?.label || role;
};

export const inferAnimationRoleFromKey = (key: string): Msx2PlayerAnimationRole => {
  const normalized = key.toLowerCase();
  if (normalized.includes('idle')) return 'idle';
  if (normalized.includes('walk')) return 'walk';
  if (normalized.includes('run')) return 'run';
  if (normalized.includes('dash')) return 'dash';
  if (normalized.includes('jump') || normalized.includes('fall')) return 'jump';
  if (normalized.includes('dead') || normalized.includes('hurt') || normalized.includes('death')) return 'dead';
  if (normalized.includes('attack')) return 'attack';
  if (normalized.includes('defend') || normalized.includes('block')) return 'defend';
  return 'custom';
};

export const inferAnimationPlayback = (
  key: string,
  animation?: Msx2PlayerAnimation,
): Msx2PlayerAnimationPlayback => {
  if (animation?.playback === 'loop' || animation?.playback === 'once') return animation.playback;
  const role = animation?.role || inferAnimationRoleFromKey(key);
  if (role === 'dead' || role === 'attack' || role === 'jump' || role === 'dash') return 'once';
  return 'loop';
};

export const normalizePlayerAnimation = (
  key: string,
  animation: Msx2PlayerAnimation | undefined,
): Msx2PlayerAnimation => {
  const frames = Array.isArray(animation?.frames) && animation.frames.length > 0
    ? animation.frames.map(frame => Math.max(0, Math.trunc(Number(frame) || 0)))
    : [0];
  const role = animation?.role && ANIMATION_ROLE_IDS.includes(animation.role)
    ? animation.role
    : inferAnimationRoleFromKey(key);
  const spriteAssetId = String(animation?.spriteAssetId || '').trim();
  const stateMachineState = String(animation?.stateMachineState || '').trim();
  return {
    frames,
    speed: Math.max(1, Math.trunc(Number(animation?.speed) || 6)),
    spriteAssetId: spriteAssetId || undefined,
    role,
    stateMachineState: stateMachineState || undefined,
    customRole: role === 'custom' ? String(animation?.customRole || key).trim() : animation?.customRole?.trim(),
    playback: inferAnimationPlayback(key, animation),
  };
};

export const normalizePlayerAnimations = (
  player: Partial<Msx2PlayerDefinition> | undefined,
  defaults: Msx2PlayerDefinition,
): { animations: Record<string, Msx2PlayerAnimation>; animationOrder: string[] } => {
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
    result[key] = normalizePlayerAnimation(key, source[key]);
    return result;
  }, {} as Record<string, Msx2PlayerAnimation>);
  return { animations, animationOrder };
};

const withAnimationMeta = (
  key: string,
  animation: Msx2PlayerAnimation,
): Msx2PlayerAnimation => normalizePlayerAnimation(key, animation);

const FUNCTION_KEY_ACTION_IDS = MSX2_FUNCTION_KEY_ACTIONS.map(option => option.value);
const INPUT_SOURCE_IDS = MSX2_PLAYER_INPUT_SOURCES.map(option => option.value);
const BUTTON_BINDING_IDS = MSX2_PLAYER_BUTTON_BINDINGS.map(option => option.value);
const LEGACY_FUNCTION_KEY_VALUES = new Set(['F1', 'F2', 'F3', 'F4', 'F5', 'Joystick', 'Keyboard']);
const LEGACY_INPUT_SOURCE_VALUES = new Set([
  'CURSOR_LEFT', 'CURSOR_RIGHT', 'CURSOR_UP', 'CURSOR_DOWN',
  'Left Arrow', 'Right Arrow', 'Up Arrow / Z', 'Down Arrow',
  'Space / X', 'Ctrl / C', 'Enter / V',
  'SPACE', 'M', 'UP', 'Keyboard', 'Joystick',
]);

export const normalizePlayerInputSource = (
  raw: string | undefined,
  fallback: Msx2PlayerInputSource = 'arrows',
): Msx2PlayerInputSource => {
  if (raw && INPUT_SOURCE_IDS.includes(raw as Msx2PlayerInputSource)) {
    return raw as Msx2PlayerInputSource;
  }
  if (raw === 'Joystick' || raw === 'Joystick 1' || raw === 'joystick_1') return 'joystick1';
  if (raw === 'Joystick 2' || raw === 'joystick_2') return 'joystick2';
  if (raw && LEGACY_INPUT_SOURCE_VALUES.has(raw)) return 'arrows';
  return fallback;
};

export const normalizePlayerButtonBinding = (
  raw: string | undefined,
  fallback: Msx2PlayerButtonBinding = 'spc',
): Msx2PlayerButtonBinding => {
  if (raw && BUTTON_BINDING_IDS.includes(raw as Msx2PlayerButtonBinding)) {
    return raw as Msx2PlayerButtonBinding;
  }
  if (raw === 'UP' || raw === 'Up Arrow' || raw === 'Up Arrow / Z' || raw === 'CURSOR_UP') return 'upArrow';
  if (raw === 'SPACE' || raw === 'Space / X' || raw === 'SPC') return 'spc';
  if (raw === 'N') return 'n';
  if (raw === 'M' || raw === 'Ctrl / C' || raw === 'CTRL') return 'm';
  if (raw === 'joy_a' || raw === 'joystick_a' || raw === 'Joystick Button A') return 'joyA';
  if (raw === 'joy_b' || raw === 'joystick_b' || raw === 'Joystick Button B') return 'joyB';
  if (raw === 'arrows' || raw === 'joystick1' || raw === 'joystick2') return fallback;
  return fallback;
};

/** @deprecated Use normalizePlayerButtonBinding */
export const normalizePlayerJumpBinding = normalizePlayerButtonBinding;

export const normalizePlayerControlMapping = (
  player: Partial<Msx2PlayerDefinition> | undefined,
  defaults: Msx2PlayerDefinition,
): Record<string, string> => {
  const directionIds: Exclude<Msx2PlayerControlId, 'jump' | 'attack'>[] = ['left', 'right', 'up', 'down'];
  const mapping: Record<string, string> = {};
  directionIds.forEach(controlId => {
    mapping[controlId] = normalizePlayerInputSource(
      player?.inputMapping?.[controlId],
      defaults.inputMapping[controlId] as Msx2PlayerInputSource,
    );
  });
  mapping.jump = normalizePlayerButtonBinding(
    player?.inputMapping?.jump,
    defaults.inputMapping.jump as Msx2PlayerButtonBinding,
  );
  mapping.attack = normalizePlayerButtonBinding(
    player?.inputMapping?.attack,
    defaults.inputMapping.attack as Msx2PlayerButtonBinding,
  );
  return mapping;
};

export const normalizeFunctionKeyAction = (
  raw: string | undefined,
  fallback: Msx2PlayerFunctionKeyAction,
  legacyAction?: Msx2PlayerFunctionKeyAction,
  legacyEnabled?: boolean,
): Msx2PlayerFunctionKeyAction => {
  if (raw && FUNCTION_KEY_ACTION_IDS.includes(raw as Msx2PlayerFunctionKeyAction)) {
    return raw as Msx2PlayerFunctionKeyAction;
  }
  if (legacyEnabled && legacyAction) return legacyAction;
  if (raw && !LEGACY_FUNCTION_KEY_VALUES.has(raw)) return 'custom';
  return fallback;
};

export const normalizeFunctionKeyCustomActions = (
  player: Partial<Msx2PlayerDefinition> | undefined,
  actions: Record<Msx2PlayerFunctionKeyId, Msx2PlayerFunctionKeyAction>,
): Partial<Record<Msx2PlayerFunctionKeyId, string>> => {
  const ids: Msx2PlayerFunctionKeyId[] = ['f1', 'f2', 'f3', 'f4', 'f5'];
  const result: Partial<Record<Msx2PlayerFunctionKeyId, string>> = {};
  ids.forEach(id => {
    if (actions[id] !== 'custom') return;
    const saved = player?.functionKeyCustomActions?.[id]?.trim();
    const raw = player?.inputMapping?.[id]?.trim();
    if (saved) {
      result[id] = saved;
      return;
    }
    if (raw && !FUNCTION_KEY_ACTION_IDS.includes(raw as Msx2PlayerFunctionKeyAction)) {
      result[id] = raw;
    } else {
      result[id] = '';
    }
  });
  return result;
};

export const normalizeFunctionKeyMapping = (
  player: Partial<Msx2PlayerDefinition> | undefined,
  defaults: Msx2PlayerDefinition,
): Record<Msx2PlayerFunctionKeyId, Msx2PlayerFunctionKeyAction> => ({
  f1: normalizeFunctionKeyAction(
    player?.inputMapping?.f1,
    defaults.inputMapping.f1 as Msx2PlayerFunctionKeyAction,
    'inventory',
    player?.inputEnabled?.inventory ?? player?.inputEnabled?.f1,
  ),
  f2: normalizeFunctionKeyAction(
    player?.inputMapping?.f2,
    defaults.inputMapping.f2 as Msx2PlayerFunctionKeyAction,
    'pause',
    player?.inputEnabled?.pause ?? player?.inputEnabled?.f2,
  ),
  f3: normalizeFunctionKeyAction(player?.inputMapping?.f3, defaults.inputMapping.f3 as Msx2PlayerFunctionKeyAction),
  f4: normalizeFunctionKeyAction(player?.inputMapping?.f4, defaults.inputMapping.f4 as Msx2PlayerFunctionKeyAction),
  f5: normalizeFunctionKeyAction(player?.inputMapping?.f5, defaults.inputMapping.f5 as Msx2PlayerFunctionKeyAction),
});

export const createDefaultMsx2PlayerDefinition = (
  id = `msx2_player_${Date.now()}`,
  profileId?: Msx2GameProfileId | null
): Msx2PlayerDefinition => {
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
      onJump: MSX2_PLAYER_SOUND_EVENT_DEFAULT,
      onHit: MSX2_PLAYER_SOUND_EVENT_DEFAULT,
      onDeath: MSX2_PLAYER_SOUND_EVENT_DEFAULT,
      onAttack: MSX2_PLAYER_SOUND_EVENT_DEFAULT,
      onLand: MSX2_PLAYER_SOUND_EVENT_DEFAULT,
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

export const createDefaultMsx2PlayerEntries = (): Msx2PlayerEntry[] => [
  { id: 'default', x: 32, y: 128, facing: 'right', state: 'IDLE', entryAnimation: 'none', invulnerabilityFrames: 0, cameraTransition: 'instant' },
  { id: 'from_left', x: 8, y: 128, facing: 'right', state: 'IDLE', entryAnimation: 'none', invulnerabilityFrames: 0, cameraTransition: 'instant' },
  { id: 'from_right', x: 231, y: 128, facing: 'left', state: 'IDLE', entryAnimation: 'none', invulnerabilityFrames: 0, cameraTransition: 'instant' },
  { id: 'from_up', x: 96, y: 8, facing: 'down', state: 'IDLE', entryAnimation: 'none', invulnerabilityFrames: 0, cameraTransition: 'instant' },
  { id: 'from_down', x: 96, y: 168, facing: 'up', state: 'IDLE', entryAnimation: 'none', invulnerabilityFrames: 0, cameraTransition: 'instant' },
];

export const normalizeMsx2PlayerEntries = (entries: Msx2PlayerEntry[] | undefined): Msx2PlayerEntry[] => {
  const source = Array.isArray(entries) && entries.length > 0 ? entries : createDefaultMsx2PlayerEntries();
  return source.map((entry, index) => ({
    id: String(entry.id || `entry_${index + 1}`),
    x: Math.max(0, Math.min(255, Math.round(Number(entry.x) || 0))),
    y: Math.max(0, Math.min(191, Math.round(Number(entry.y) || 0))),
    facing: normalizeMsx2PlayerFacing(entry.facing, 'right'),
    state: entry.state || 'IDLE',
    playerId: entry.playerId,
    entryAnimation: entry.entryAnimation || 'none',
    invulnerabilityFrames: Math.max(0, Math.min(255, Math.round(Number(entry.invulnerabilityFrames) || 0))),
    cameraTransition: entry.cameraTransition || 'instant',
  }));
};

export const normalizeMsx2PlayerDefinition = (player: Partial<Msx2PlayerDefinition> | unknown): Msx2PlayerDefinition => {
  const parsed = parseMsx2PlayerImport(player);
  const profileId = parsed?.gameType === 'maze'
    ? 'maze'
    : parsed?.gameType === 'shooterHorizontal'
      ? 'shooterHorizontal'
      : parsed?.gameType === 'shooterVertical'
        ? 'shooterVertical'
        : 'platform';
  const defaults = createDefaultMsx2PlayerDefinition(parsed?.id, profileId);
  const functionKeys = normalizeFunctionKeyMapping(parsed, defaults);
  const controlSources = normalizePlayerControlMapping(parsed, defaults);
  const functionKeyCustomActions = normalizeFunctionKeyCustomActions(parsed, functionKeys);
  const { animations, animationOrder } = normalizePlayerAnimations(parsed, defaults);
  const playerSounds = normalizePlayerSounds(parsed, defaults);
  return {
    ...defaults,
    ...(parsed || {}),
    defaultFacing: normalizeMsx2PlayerFacing(parsed?.defaultFacing, defaults.defaultFacing),
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
