import type {
  Msx2PlayerControlId,
  Msx2PlayerDefinition,
  Msx2PlayerFunctionKeyId,
  ProjectAsset,
} from '../types';
import {
  MSX2_FUNCTION_KEY_ACTIONS,
  MSX2_PLAYER_BUTTON_BINDINGS,
  MSX2_PLAYER_INPUT_SOURCES,
  normalizeMsx2PlayerDefinition,
} from './msx2PlayerDefaults';

export type StateMachineInputId =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'fire'
  | 'action2'
  | Msx2PlayerFunctionKeyId;

export interface StateMachineInputOption {
  value: StateMachineInputId;
  label: string;
  playerControlId: Msx2PlayerControlId | Msx2PlayerFunctionKeyId;
}

const FUNCTION_KEY_IDS: Msx2PlayerFunctionKeyId[] = ['f1', 'f2', 'f3', 'f4', 'f5'];

const FALLBACK_OPTIONS: StateMachineInputOption[] = [
  { value: 'left', label: 'Left', playerControlId: 'left' },
  { value: 'right', label: 'Right', playerControlId: 'right' },
  { value: 'up', label: 'Up', playerControlId: 'up' },
  { value: 'down', label: 'Down', playerControlId: 'down' },
  { value: 'fire', label: 'Button A / Action 1', playerControlId: 'jump' },
  { value: 'action2', label: 'Button B / Action 2', playerControlId: 'attack' },
  { value: 'f1', label: 'F1', playerControlId: 'f1' },
  { value: 'f2', label: 'F2', playerControlId: 'f2' },
  { value: 'f3', label: 'F3', playerControlId: 'f3' },
  { value: 'f4', label: 'F4', playerControlId: 'f4' },
  { value: 'f5', label: 'F5', playerControlId: 'f5' },
];

const unwrapPlayerAsset = (asset: ProjectAsset): Partial<Msx2PlayerDefinition> | undefined => {
  if (asset.type !== 'msx2player') return undefined;
  const data = asset.data as any;
  return (data?.compact || data?.player || data) as Partial<Msx2PlayerDefinition> | undefined;
};

export const resolveStateMachinePlayer = (
  allAssets: ProjectAsset[] = [],
  stateMachineAssetId?: string,
): Msx2PlayerDefinition | undefined => {
  const players = allAssets
    .filter(asset => asset.type === 'msx2player')
    .map(asset => ({ asset, player: unwrapPlayerAsset(asset) }))
    .filter((entry): entry is { asset: ProjectAsset; player: Partial<Msx2PlayerDefinition> } => Boolean(entry.player));
  if (!players.length) return undefined;

  const linked = stateMachineAssetId
    ? players.find(({ player }) => String(player.stateMachineAssetId || '').trim() === stateMachineAssetId)
    : undefined;
  return normalizeMsx2PlayerDefinition((linked || players[0]).player);
};

const labelForValue = (
  options: ReadonlyArray<{ value: string; label: string }>,
  value: unknown,
): string => options.find(option => option.value === value)?.label || String(value || '');

export const getStateMachineInputOptions = (
  allAssets: ProjectAsset[] = [],
  stateMachineAssetId?: string,
): StateMachineInputOption[] => {
  const player = resolveStateMachinePlayer(allAssets, stateMachineAssetId);
  if (!player) return FALLBACK_OPTIONS;

  const options: StateMachineInputOption[] = [];
  const addDirection = (id: 'left' | 'right' | 'up' | 'down', label: string) => {
    if (player.inputEnabled?.[id] === false) return;
    const source = labelForValue(MSX2_PLAYER_INPUT_SOURCES, player.inputMapping[id]);
    options.push({ value: id, label: source ? `${label} — ${source}` : label, playerControlId: id });
  };
  addDirection('left', 'Left');
  addDirection('right', 'Right');
  addDirection('up', 'Up');
  addDirection('down', 'Down');

  if (player.inputEnabled?.jump !== false) {
    const source = labelForValue(MSX2_PLAYER_BUTTON_BINDINGS, player.inputMapping.jump);
    options.push({
      value: 'fire',
      label: `Button A / Action 1${source ? ` — ${source}` : ''}`,
      playerControlId: 'jump',
    });
  }
  if (player.inputEnabled?.attack !== false) {
    const source = labelForValue(MSX2_PLAYER_BUTTON_BINDINGS, player.inputMapping.attack);
    options.push({
      value: 'action2',
      label: `Button B / Action 2${source ? ` — ${source}` : ''}`,
      playerControlId: 'attack',
    });
  }

  FUNCTION_KEY_IDS.forEach(keyId => {
    if (player.inputEnabled?.[keyId] !== true) return;
    const action = String(player.inputMapping[keyId] || 'none');
    const actionLabel = action === 'custom'
      ? String(player.functionKeyCustomActions?.[keyId] || 'Custom').trim()
      : labelForValue(MSX2_FUNCTION_KEY_ACTIONS, action);
    options.push({
      value: keyId,
      label: `${keyId.toUpperCase()}${actionLabel ? ` — ${actionLabel}` : ''}`,
      playerControlId: keyId,
    });
  });

  return options;
};

export const normalizeStateMachineInput = (value: unknown): string => {
  const raw = String(value ?? '').trim();
  const normalized = raw.toLowerCase().replace(/[\s_-]+/g, '');
  if (!normalized) return '';
  if (['up', 'arrowup', 'cursorup'].includes(normalized)) return 'up';
  if (['down', 'arrowdown', 'cursordown'].includes(normalized)) return 'down';
  if (['left', 'arrowleft', 'cursorleft'].includes(normalized)) return 'left';
  if (['right', 'arrowright', 'cursorright'].includes(normalized)) return 'right';
  if (['fire', 'space', 'spc', 'buttona', 'button1', 'action1', 'joya', 'joysticka', 'jump'].includes(normalized)) {
    return 'fire';
  }
  if (['action2', 'fire2', 'buttonb', 'button2', 'btn2', 'grab', 'attack', 'joyb', 'joystickb', 'secondbutton', 'keyn', 'n', 'keym', 'm'].includes(normalized)) {
    return 'action2';
  }
  if (/^f[1-5]$/.test(normalized)) return normalized;
  return raw;
};

const RUNTIME_KEY_IDS: Record<string, number> = {
  up: 1,
  right: 3,
  down: 5,
  left: 7,
  fire: 9,
  action2: 10,
  f1: 11,
  f2: 12,
  f3: 13,
  f4: 14,
  f5: 15,
};

export const resolveStateMachineRuntimeKeyId = (value: unknown): number => (
  RUNTIME_KEY_IDS[normalizeStateMachineInput(value).toLowerCase()] || 0
);

const browserAliasesForButtonBinding = (binding: unknown): string[] => {
  switch (String(binding || '').trim()) {
    case 'upArrow':
      return ['arrowup', 'up'];
    case 'n':
      return ['keyn', 'n'];
    case 'm':
      return ['keym', 'm'];
    case 'joyA':
      return ['gamepadbutton0', 'joya'];
    case 'joyB':
      return ['gamepadbutton1', 'joyb'];
    case 'spc':
    default:
      return ['space', ' '];
  }
};

export const getStateMachineBrowserInputAliases = (
  value: unknown,
  allAssets: ProjectAsset[] = [],
  stateMachineAssetId?: string,
): string[] => {
  const input = normalizeStateMachineInput(value).toLowerCase();
  const player = resolveStateMachinePlayer(allAssets, stateMachineAssetId);
  if (input === 'fire') return browserAliasesForButtonBinding(player?.inputMapping.jump);
  if (input === 'action2') return browserAliasesForButtonBinding(player?.inputMapping.attack || 'm');
  if (/^f[1-5]$/.test(input)) return [input];
  if (['up', 'down', 'left', 'right'].includes(input)) return [input, `arrow${input}`];
  return [input];
};
