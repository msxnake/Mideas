import {
  Msx2PlayerAnimationPlayback,
  Msx2PlayerDefinition,
  Msx2PlayerFunctionKeyId,
} from '../types';
import type { Msx2PlayerDocument } from './msx2PlayerDocument';

export const MSX2_PLAYER_IMPORT_SCHEMA = 'mideas.msx2.player' as const;

const DIRECTION_IDS = ['left', 'right', 'up', 'down'] as const;
const FUNCTION_KEY_IDS: Msx2PlayerFunctionKeyId[] = ['f1', 'f2', 'f3', 'f4', 'f5'];
const FUNCTION_KEY_LABELS: Record<Msx2PlayerFunctionKeyId, string> = {
  f1: 'F1',
  f2: 'F2',
  f3: 'F3',
  f4: 'F4',
  f5: 'F5',
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
    defaultFacing: identity.defaultFacing,
    basedOnTemplate: identity.basedOnTemplate ?? player.stateMachine?.template,
    notes: identity.notes,
    render: player.render,
    weapons: player.weapons,
    equippedWeaponId: player.equippedWeaponId,
    animations: player.animations
      ? Object.entries(player.animations).reduce((result, [name, animation]) => {
        const {
          frameCount: _frameCount,
          roleLabel: _roleLabel,
          playback: _playback,
          renderLink,
          ...rest
        } = animation as Msx2PlayerDefinition['animations'][string] & {
          frameCount?: number;
          roleLabel?: string;
          playback?: Msx2PlayerAnimationPlayback;
          renderLink?: { spriteAssetId?: string };
        };
        const spriteAssetId = String(
          rest.spriteAssetId || renderLink?.spriteAssetId || '',
        ).trim();
        result[name] = {
          ...rest,
          ...(spriteAssetId ? { spriteAssetId } : {}),
        };
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
    ...(Array.isArray((player as { activeSkills?: string[] }).activeSkills)
      ? { activeSkills: (player as { activeSkills?: string[] }).activeSkills }
      : {}),
    ...((player as { skillBindings?: Msx2PlayerDefinition['skillBindings'] }).skillBindings
      ? { skillBindings: (player as { skillBindings?: Msx2PlayerDefinition['skillBindings'] }).skillBindings }
      : {}),
    ...((player as { skillParameters?: Msx2PlayerDefinition['skillParameters'] }).skillParameters
      ? { skillParameters: (player as { skillParameters?: Msx2PlayerDefinition['skillParameters'] }).skillParameters }
      : {}),
    components: player.components,
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
    const compact = doc.compact as Partial<Msx2PlayerDefinition>;
    const detailed = flattenDetailedPlayerPayload((doc.player as Msx2PlayerDocument['player']) || {});
    return {
      ...compact,
      ...detailed,
      activeSkills: detailed.activeSkills ?? compact.activeSkills,
      skillBindings: detailed.skillBindings ?? compact.skillBindings,
      skillParameters: detailed.skillParameters ?? compact.skillParameters,
    };
  }

  if (doc.schema === MSX2_PLAYER_IMPORT_SCHEMA && doc.player && typeof doc.player === 'object') {
    return flattenDetailedPlayerPayload(doc.player as Msx2PlayerDocument['player']);
  }

  if (doc.player && typeof doc.player === 'object') {
    return flattenDetailedPlayerPayload(doc.player as Msx2PlayerDocument['player']);
  }

  return doc as Partial<Msx2PlayerDefinition>;
};
