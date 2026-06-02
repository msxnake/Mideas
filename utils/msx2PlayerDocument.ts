import {
  Msx2PlayerButtonBinding,
  Msx2PlayerControlId,
  Msx2PlayerDefinition,
  Msx2PlayerFunctionKeyAction,
  Msx2PlayerFunctionKeyId,
  Msx2PlayerInputSource,
  Msx2PlayerAnimationPlayback,
} from '../types';
import {
  MSX2_FUNCTION_KEY_ACTIONS,
  MSX2_PLAYER_BUTTON_BINDINGS,
  MSX2_PLAYER_INPUT_SOURCES,
  MSX2_PLAYER_SOUND_SLOTS,
  labelForAnimationRole,
  normalizeMsx2PlayerDefinition,
  normalizePlayerSoundTriggerPreset,
  resolvePlayerSoundExportId,
} from './msx2PlayerDefaults';

export const MSX2_PLAYER_DOCUMENT_SCHEMA = 'mideas.msx2.player' as const;
export const MSX2_PLAYER_DOCUMENT_VERSION = 1;

const DIRECTION_IDS = ['left', 'right', 'up', 'down'] as const;
const FUNCTION_KEY_IDS: Msx2PlayerFunctionKeyId[] = ['f1', 'f2', 'f3', 'f4', 'f5'];
const FUNCTION_KEY_LABELS: Record<Msx2PlayerFunctionKeyId, string> = {
  f1: 'F1',
  f2: 'F2',
  f3: 'F3',
  f4: 'F4',
  f5: 'F5',
};

export interface Msx2PlayerDocument {
  schema: typeof MSX2_PLAYER_DOCUMENT_SCHEMA;
  schemaVersion: number;
  exportedAt: string;
  generatedBy: string;
  player: {
    identity: {
      id: string;
      name: string;
      target: 'MSX2';
      gameType: Msx2PlayerDefinition['gameType'];
      basedOnTemplate?: string;
      worldCompatibility: string[];
      notes?: string;
    };
    render: Msx2PlayerDefinition['render'];
    animations: Record<string, Msx2PlayerDefinition['animations'][string] & {
      frameCount: number;
      roleLabel: string;
      playback: Msx2PlayerAnimationPlayback;
      renderLink: {
        spriteAssetId?: string;
        usesPlayerDefault: boolean;
        frameIndices: number[];
      };
    }>;
    animationOrder: string[];
    hitboxes: Msx2PlayerDefinition['hitboxes'];
    movement: Msx2PlayerDefinition['movement'];
    controls: {
      directions: Record<(typeof DIRECTION_IDS)[number], {
        enabled: boolean;
        inputSource: Msx2PlayerInputSource;
        label: string;
      }>;
      buttons: {
        A: {
          slot: 'jump';
          enabled: boolean;
          binding: Msx2PlayerButtonBinding;
          label: string;
        };
        B: {
          slot: 'attack';
          enabled: boolean;
          binding: Msx2PlayerButtonBinding;
          label: string;
        };
      };
      functionKeys: Record<string, {
        enabled: boolean;
        action: Msx2PlayerFunctionKeyAction;
        label: string;
        customText?: string;
      }>;
    };
    health: Msx2PlayerDefinition['health'];
    combat: {
      attack: Msx2PlayerDefinition['attack'];
      attackHitbox?: Msx2PlayerDefinition['hitboxes']['attack'];
    };
    interaction: Msx2PlayerDefinition['interaction'];
    sounds: NonNullable<Msx2PlayerDefinition['sounds']>;
    soundsEnabled: NonNullable<Msx2PlayerDefinition['soundsEnabled']>;
    soundPresets: NonNullable<Msx2PlayerDefinition['soundPresets']>;
    soundCustomValues: NonNullable<Msx2PlayerDefinition['soundCustomValues']>;
    soundAssetIds: NonNullable<Msx2PlayerDefinition['soundAssetIds']>;
    soundAssetCustomValues: NonNullable<Msx2PlayerDefinition['soundAssetCustomValues']>;
    soundsConfig: Record<string, {
      label: string;
      enabled: boolean;
      triggerPreset: string;
      triggerCustom?: string;
      triggerLabel: string;
      soundAssetId?: string;
      soundAssetCustom?: string;
      resolved: string;
      linkedAnimationKey?: string;
    }>;
    inventoryHooks: string[];
    logic: NonNullable<Msx2PlayerDefinition['logic']>;
    stateMachine: {
      template?: string;
      assetId?: string;
      assetName?: string;
      initialStateId?: string | null;
      states: string[];
      stateCount: number;
      transitionCount: number;
    };
    runtime: {
      budget: Msx2PlayerDefinition['budget'];
      requiredRoutines: string[];
    };
  };
  compact: Msx2PlayerDefinition;
}

const labelForInputSource = (value: Msx2PlayerInputSource): string =>
  MSX2_PLAYER_INPUT_SOURCES.find(option => option.value === value)?.label ?? value;

const labelForButtonBinding = (value: Msx2PlayerButtonBinding): string =>
  MSX2_PLAYER_BUTTON_BINDINGS.find(option => option.value === value)?.label ?? value;

const labelForFunctionKeyAction = (
  action: Msx2PlayerFunctionKeyAction,
  customText?: string,
): string => {
  if (action === 'custom') return customText?.trim() || 'Custom';
  return MSX2_FUNCTION_KEY_ACTIONS.find(option => option.value === action)?.label ?? action;
};

const isControlEnabled = (
  player: Msx2PlayerDefinition,
  key: Msx2PlayerControlId | Msx2PlayerFunctionKeyId,
): boolean => {
  if (key.startsWith('f')) return player.inputEnabled?.[key as Msx2PlayerFunctionKeyId] === true;
  return player.inputEnabled?.[key as Msx2PlayerControlId] !== false;
};

const buildSoundsSection = (
  player: Msx2PlayerDefinition,
): Msx2PlayerDocument['player']['soundsConfig'] =>
  MSX2_PLAYER_SOUND_SLOTS.reduce((result, slot) => {
    const triggerPreset = normalizePlayerSoundTriggerPreset(player.soundPresets?.[slot.id]);
    const triggerCustom = player.soundCustomValues?.[slot.id]?.trim();
    const soundAssetId = player.soundAssetIds?.[slot.id];
    const soundAssetCustom = player.soundAssetCustomValues?.[slot.id]?.trim();
    const triggerLabel = triggerPreset === 'custom'
      ? (triggerCustom || 'Custom event')
      : triggerPreset.startsWith('anim:')
        ? `Anim: ${labelForAnimationRole(player.animations[triggerPreset.slice(5)] || { role: 'custom', frames: [0], speed: 6, customRole: triggerPreset.slice(5) })}`
        : 'Player event';
    result[slot.id] = {
      label: slot.label,
      enabled: player.soundsEnabled?.[slot.id] !== false,
      triggerPreset,
      ...(triggerPreset === 'custom' && triggerCustom ? { triggerCustom } : {}),
      triggerLabel,
      ...(soundAssetId ? { soundAssetId } : {}),
      ...(soundAssetCustom ? { soundAssetCustom } : {}),
      resolved: player.sounds?.[slot.id] || resolvePlayerSoundExportId(soundAssetId, soundAssetCustom, slot.defaultPreset),
      ...(triggerPreset.startsWith('anim:') ? { linkedAnimationKey: triggerPreset.slice(5) } : {}),
    };
    return result;
  }, {} as Msx2PlayerDocument['player']['soundsConfig']);

const buildStateMachineSection = (
  player: Msx2PlayerDefinition,
): Msx2PlayerDocument['player']['stateMachine'] => ({
  template: player.basedOnTemplate,
  assetId: player.stateMachineAssetId,
  states: player.stateMachine,
  stateCount: player.stateMachine.length,
  transitionCount: 0,
});

const buildControlsSection = (player: Msx2PlayerDefinition): Msx2PlayerDocument['player']['controls'] => {
  const directions = DIRECTION_IDS.reduce((result, direction) => {
    const inputSource = (player.inputMapping[direction] as Msx2PlayerInputSource) || 'arrows';
    result[direction] = {
      enabled: isControlEnabled(player, direction),
      inputSource,
      label: labelForInputSource(inputSource),
    };
    return result;
  }, {} as Msx2PlayerDocument['player']['controls']['directions']);

  const jumpBinding = (player.inputMapping.jump as Msx2PlayerButtonBinding) || 'spc';
  const attackBinding = (player.inputMapping.attack as Msx2PlayerButtonBinding) || 'm';

  const functionKeys = FUNCTION_KEY_IDS.reduce((result, keyId) => {
    const action = (player.inputMapping[keyId] as Msx2PlayerFunctionKeyAction) || 'none';
    const customText = player.functionKeyCustomActions?.[keyId]?.trim();
    result[FUNCTION_KEY_LABELS[keyId]] = {
      enabled: isControlEnabled(player, keyId),
      action,
      label: labelForFunctionKeyAction(action, customText),
      ...(action === 'custom' && customText ? { customText } : {}),
    };
    return result;
  }, {} as Msx2PlayerDocument['player']['controls']['functionKeys']);

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

export const buildDetailedMsx2PlayerDocument = (
  player: Msx2PlayerDefinition,
  exportedAt = new Date().toISOString(),
): Msx2PlayerDocument => {
  const normalized = normalizeMsx2PlayerDefinition(player);
  const order = normalized.animationOrder || Object.keys(normalized.animations);
  const animations = order.reduce((result, name) => {
    const animation = normalized.animations[name];
    if (!animation) return result;
    const resolvedSpriteAssetId = animation.spriteAssetId || normalized.render.spriteAssetId;
    result[name] = {
      ...animation,
      frameCount: animation.frames.length,
      roleLabel: labelForAnimationRole(animation),
      playback: animation.playback || 'loop',
      renderLink: {
        spriteAssetId: resolvedSpriteAssetId,
        usesPlayerDefault: !animation.spriteAssetId,
        frameIndices: [...animation.frames],
      },
    };
    return result;
  }, {} as Msx2PlayerDocument['player']['animations']);

  return {
    schema: MSX2_PLAYER_DOCUMENT_SCHEMA,
    schemaVersion: MSX2_PLAYER_DOCUMENT_VERSION,
    exportedAt,
    generatedBy: 'Mideas MSX Player Config',
    player: {
      identity: {
        id: normalized.id,
        name: normalized.name,
        target: normalized.target,
        gameType: normalized.gameType,
        basedOnTemplate: normalized.basedOnTemplate,
        worldCompatibility: normalized.worldCompatibility || ['all'],
        notes: normalized.notes,
      },
      render: normalized.render,
      animations,
      animationOrder: order,
      hitboxes: normalized.hitboxes,
      movement: normalized.movement,
      controls: buildControlsSection(normalized),
      health: normalized.health,
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
      stateMachine: buildStateMachineSection(normalized),
      runtime: {
        budget: normalized.budget,
        requiredRoutines: normalized.requiredRoutines,
      },
    },
    compact: normalized,
  };
};

const flattenControlsFromDocument = (
  controls: Msx2PlayerDocument['player']['controls'] | undefined,
): Partial<Msx2PlayerDefinition> => {
  if (!controls) return {};

  const inputMapping: Record<string, string> = {};
  const inputEnabled: NonNullable<Msx2PlayerDefinition['inputEnabled']> = {};
  const functionKeyCustomActions: NonNullable<Msx2PlayerDefinition['functionKeyCustomActions']> = {};

  DIRECTION_IDS.forEach(direction => {
    const entry = controls.directions?.[direction];
    if (!entry) return;
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
    if (!entry) return;
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

const flattenDetailedPlayerPayload = (
  payload: Msx2PlayerDocument['player'] | Record<string, unknown>,
): Partial<Msx2PlayerDefinition> => {
  const player = payload as Msx2PlayerDocument['player'];
  const identity = player.identity || ({} as Msx2PlayerDocument['player']['identity']);
  const controlsPatch = flattenControlsFromDocument(player.controls);

  return {
    id: identity.id,
    name: identity.name,
    target: identity.target,
    gameType: identity.gameType,
    basedOnTemplate: identity.basedOnTemplate ?? player.stateMachine?.template,
    worldCompatibility: identity.worldCompatibility,
    notes: identity.notes,
    render: player.render,
    animations: player.animations
      ? Object.entries(player.animations).reduce((result, [name, animation]) => {
        const {
          frameCount: _frameCount,
          roleLabel: _roleLabel,
          playback: _playback,
          renderLink: _renderLink,
          ...rest
        } = animation as Msx2PlayerDefinition['animations'][string] & {
          frameCount?: number;
          roleLabel?: string;
          playback?: Msx2PlayerAnimationPlayback;
          renderLink?: unknown;
        };
        result[name] = rest;
        return result;
      }, {} as Msx2PlayerDefinition['animations'])
      : undefined,
    animationOrder: Array.isArray((player as Msx2PlayerDocument['player']).animationOrder)
      ? (player as Msx2PlayerDocument['player']).animationOrder
      : undefined,
    hitboxes: player.hitboxes,
    movement: player.movement,
    health: player.health,
    attack: player.combat?.attack ?? (player as unknown as { attack?: Msx2PlayerDefinition['attack'] }).attack,
    interaction: player.interaction,
    sounds: player.sounds,
    soundsEnabled: player.soundsEnabled,
    soundPresets: player.soundPresets,
    soundCustomValues: player.soundCustomValues,
    soundAssetIds: player.soundAssetIds,
    soundAssetCustomValues: player.soundAssetCustomValues,
    inventoryHooks: player.inventoryHooks,
    logic: player.logic,
    stateMachineAssetId: player.stateMachine?.assetId,
    stateMachine: player.stateMachine?.states,
    budget: player.runtime?.budget,
    requiredRoutines: player.runtime?.requiredRoutines,
    ...controlsPatch,
  };
};

export const parseMsx2PlayerImport = (raw: unknown): Partial<Msx2PlayerDefinition> => {
  if (!raw || typeof raw !== 'object') return {};

  const doc = raw as Record<string, unknown>;

  if (doc.compact && typeof doc.compact === 'object') {
    return {
      ...(doc.compact as Partial<Msx2PlayerDefinition>),
      ...flattenDetailedPlayerPayload((doc.player as Msx2PlayerDocument['player']) || {}),
    };
  }

  if (doc.schema === MSX2_PLAYER_DOCUMENT_SCHEMA && doc.player && typeof doc.player === 'object') {
    return flattenDetailedPlayerPayload(doc.player as Msx2PlayerDocument['player']);
  }

  if (doc.player && typeof doc.player === 'object') {
    return flattenDetailedPlayerPayload(doc.player as Msx2PlayerDocument['player']);
  }

  return doc as Partial<Msx2PlayerDefinition>;
};

export const mergeMsx2PlayerUpdate = (
  current: unknown,
  patch: Partial<Msx2PlayerDefinition> | Msx2PlayerDocument,
): Msx2PlayerDefinition => {
  if (patch && typeof patch === 'object' && (patch as Msx2PlayerDocument).schema === MSX2_PLAYER_DOCUMENT_SCHEMA) {
    return normalizeMsx2PlayerDefinition(parseMsx2PlayerImport(patch));
  }

  const partialPatch = patch as Partial<Msx2PlayerDefinition>;
  const base = normalizeMsx2PlayerDefinition(parseMsx2PlayerImport(current));
  return normalizeMsx2PlayerDefinition({
    ...base,
    ...partialPatch,
    render: partialPatch.render ? { ...base.render, ...partialPatch.render } : base.render,
    hitboxes: partialPatch.hitboxes ? { ...base.hitboxes, ...partialPatch.hitboxes } : base.hitboxes,
    movement: partialPatch.movement ? { ...base.movement, ...partialPatch.movement } : base.movement,
    health: partialPatch.health ? { ...base.health, ...partialPatch.health } : base.health,
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
    stateMachineAssetId: partialPatch.stateMachineAssetId !== undefined
      ? partialPatch.stateMachineAssetId
      : base.stateMachineAssetId,
    stateMachine: partialPatch.stateMachine !== undefined ? partialPatch.stateMachine : base.stateMachine,
    budget: partialPatch.budget ? { ...base.budget, ...partialPatch.budget } : base.budget,
  });
};
