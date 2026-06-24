import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MSX2_FUNCTION_KEY_ACTIONS, MSX2_PLAYER_BUTTON_BINDINGS, MSX2_PLAYER_FACING_OPTIONS, MSX2_PLAYER_INPUT_SOURCES, MSX2_PLAYER_SOUND_CUSTOM_ASSET, MSX2_PLAYER_SOUND_EVENT_DEFAULT, MSX2_PLAYER_SOUND_SLOTS, buildPlayerStateMachinePatchFromAsset, buildSoundsImportFromAnimations, dimensionsToPlayerSpriteSize, labelForAnimationRole, normalizeMsx2PlayerDefinition, parsePlayerSpriteSize, resolvePlayerSoundExportId, spriteSizeFromMsx2Sprite } from '../../utils/msx2PlayerDefaults';
import { buildDetailedMsx2PlayerDocument, parseMsx2PlayerImport } from '../../utils/msx2PlayerDocument';
import {
  playerAnimationFromMsx2Sprite,
  playerAnimationPreviewTiming,
  syncPlayerAnimationsFromLinkedSprites,
} from '../../utils/msx2SpriteAnimation';
import { StateMachine, StateMachineState, StateMachineStateName } from '../../statemachine.types';
import { MSXColorValue, Msx2PlayerAnimation, Msx2PlayerControlId, Msx2PlayerDefinition, Msx2PlayerFacing, Msx2PlayerFunctionKeyAction, Msx2PlayerFunctionKeyId, Msx2PlayerLogicFlags, Msx2PlayerSoundSlotId, Msx2Screen4Tile, Msx2Screen4TileScreen, Msx2Sprite, ProjectAsset, Screen5PaletteSlot } from '../../types';
import { getMsx2TileBehaviorKind } from '../../utils/msx2Screen4TileBehavior';
import { MSX2_COMPONENT_FIELD_EDITORS, MSX2_COMPONENT_REPERTOIRE, Msx2ComponentId } from '../msx2_screen4_editor/msx2EntityCatalog';
import { getAllSkills, getSkillsForBackend } from '../../utils/msxGenerator/skills/index';
import { resolveGraphicsBackend } from '../../utils/msxGenerator';
import type { GraphicsBackend } from '../../utils/msxGenerator/graphicsBackend';
import type { SkillControlIcon, SkillDef, SkillParameterDef } from '../../utils/msxGenerator/skills/types';
import { BulletConfigDialog } from '../dialogs/skills/BulletConfigDialog';

interface Msx2PlayerEditorProps {
  player: Msx2PlayerDefinition | Record<string, unknown>;
  playerAssetName?: string;
  onUpdate: (data: Partial<Msx2PlayerDefinition>) => void;
  allAssets: ProjectAsset[];
  onUpsertStateMachineAsset?: (asset: ProjectAsset) => void;
}

const navItems = [
  'General',
  'Graphics & Render',
  'Physics & Movement',
  'Controls',
  'Combat & Damage',
  'Weapons',
  'Abilities & Items',
  'States & Logic',
  'Sounds',
  'Spawn & Respawn',
  'Preview',
] as const;

type PlayerConfigSection = typeof navItems[number];
type PlayerAttackFacing = Exclude<Msx2PlayerFacing, 'neutral'>;
type PlayerWeaponDefinition = NonNullable<Msx2PlayerDefinition['weapons']>[number];
type PlayerWeaponType = PlayerWeaponDefinition['type'];
type PlayerWeaponButton = PlayerWeaponDefinition['button'];
type PlayerWeaponHitboxSource = PlayerWeaponDefinition['hitboxSource'];
type PlayerWeaponAvailability = NonNullable<PlayerWeaponDefinition['availability']>;
type PlayerWeaponEmptyBehavior = NonNullable<NonNullable<PlayerWeaponDefinition['ammo']>['emptyBehavior']>;
type PlayerWeaponBreakBehavior = NonNullable<NonNullable<PlayerWeaponDefinition['durability']>['breakBehavior']>;

const inputClass = 'h-7 w-full rounded border border-slate-700 bg-[#111821] px-2 text-xs text-slate-100 outline-none focus:border-blue-500';
const selectClass = `${inputClass} pr-6`;
const panelClass = 'flex min-h-0 flex-col overflow-hidden rounded border border-slate-700 bg-[#1d2430] shadow-sm';
const panelTitleClass = 'flex-shrink-0 border-b border-slate-700 px-3 py-2 text-xs font-bold uppercase tracking-wide text-sky-300';
const PLAYER_ATTACK_FACING_OPTIONS: ReadonlyArray<{ value: PlayerAttackFacing; label: string }> = [
  { value: 'right', label: 'Right' },
  { value: 'left', label: 'Left' },
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' },
];
const PLAYER_WEAPON_TYPE_OPTIONS: ReadonlyArray<{ value: PlayerWeaponType; label: string }> = [
  { value: 'melee', label: 'Melee' },
  { value: 'projectile', label: 'Projectile' },
  { value: 'arc', label: 'Arc' },
  { value: 'bomb', label: 'Bomb' },
  { value: 'magic', label: 'Magic' },
];
const PLAYER_WEAPON_BUTTON_OPTIONS: ReadonlyArray<{ value: PlayerWeaponButton; label: string }> = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
];
const PLAYER_WEAPON_HITBOX_SOURCE_OPTIONS: ReadonlyArray<{ value: PlayerWeaponHitboxSource; label: string }> = [
  { value: 'attackByFacing', label: 'Directional Attack Box' },
  { value: 'custom', label: 'Custom / future' },
  { value: 'none', label: 'None' },
];
const PLAYER_WEAPON_AVAILABILITY_OPTIONS: ReadonlyArray<{ value: PlayerWeaponAvailability; label: string }> = [
  { value: 'owned', label: 'Owned at start' },
  { value: 'pickup', label: 'Pickup required' },
  { value: 'locked', label: 'Locked / scripted' },
];
const PLAYER_WEAPON_EMPTY_BEHAVIOR_OPTIONS: ReadonlyArray<{ value: PlayerWeaponEmptyBehavior; label: string }> = [
  { value: 'block', label: 'Block use' },
  { value: 'unequip', label: 'Unequip' },
  { value: 'switchState', label: 'Switch state' },
];
const PLAYER_WEAPON_BREAK_BEHAVIOR_OPTIONS: ReadonlyArray<{ value: PlayerWeaponBreakBehavior; label: string }> = [
  { value: 'unequip', label: 'Unequip' },
  { value: 'remove', label: 'Remove weapon' },
  { value: 'keepBroken', label: 'Keep broken' },
];

const numberValue = (value: unknown, fallback = 0): number => Number.isFinite(Number(value)) ? Number(value) : fallback;

const sanitizeWeaponId = (value: string): string => {
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return sanitized || 'weapon';
};

const sanitizePlayerStateMachineAssetName = (value: string): string => {
  const sanitized = value
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return sanitized || 'Player';
};

const nextPlayerStateMachineAssetIdentity = (stateMachineAssets: ProjectAsset[], playerAssetName: string): { id: string; name: string } => {
  const baseName = `${sanitizePlayerStateMachineAssetName(playerAssetName)}_sm`;
  const baseId = baseName.toLowerCase();
  const existingIds = new Set(stateMachineAssets.map(asset => asset.id.toLowerCase()));
  const existingNames = new Set(stateMachineAssets.map(asset => asset.name.toLowerCase()));
  let suffix = 1;
  while (true) {
    const id = suffix === 1 ? baseId : `${baseId}${suffix}`;
    const name = suffix === 1 ? baseName : `${baseName}${suffix}`;
    if (!existingIds.has(id.toLowerCase()) && !existingNames.has(name.toLowerCase())) {
      return { id, name };
    }
    suffix += 1;
  }
};

const sanitizePlayerStateId = (value: string): string => {
  const sanitized = value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
  return sanitized || 'STATE';
};

const playerStateNameFromLabel = (label: string): StateMachineStateName => {
  const trimmed = label.trim();
  const mapped: Record<string, StateMachineStateName> = {
    Idle: 'Idle',
    Walk: 'Walking',
    Run: 'Running',
    Dash: 'Dashing',
    Jump: 'Jumping',
    Fall: 'Falling',
    Attack: 'Attacking',
    Defend: 'Defending',
    Dead: 'Dead',
    Hurt: 'Hurt',
  };
  return (mapped[trimmed] || trimmed || 'Idle') as StateMachineStateName;
};

const friendlyStateLabelFromId = (stateId: string): string => {
  const trimmed = stateId.trim();
  const mapped: Record<string, string> = {
    IDLE: 'Idle',
    WALK: 'Walking',
    RUN: 'Running',
    DASH: 'Dashing',
    JUMP: 'Jumping',
    FALL: 'Falling',
    ATTACK: 'Attacking',
    DEFEND: 'Defending',
    DEAD: 'Dead',
    HURT: 'Hurt',
  };
  if (mapped[trimmed.toUpperCase()]) return mapped[trimmed.toUpperCase()];
  return trimmed
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, value => value.toUpperCase());
};

const stateMachineStateFromId = (stateId: string, index: number): StateMachineState => ({
  id: stateId,
  name: friendlyStateLabelFromId(stateId) as StateMachineStateName,
  position: {
    x: 120 + (index % 4) * 180,
    y: 80 + Math.floor(index / 4) * 120,
  },
});

const Field: React.FC<{ label: string; children: React.ReactNode; suffix?: string }> = ({ label, children, suffix }) => (
  <label className="grid grid-cols-[96px_1fr_auto] items-center gap-2 text-xs text-slate-200">
    <span className="text-slate-100">{label}:</span>
    {children}
    <span className="min-w-0 text-[11px] text-slate-300">{suffix}</span>
  </label>
);

const SmallNumber: React.FC<{
  value: number;
  onChange: (value: number) => void;
  step?: number;
}> = ({ value, onChange, step = 1 }) => (
  <input
    type="number"
    step={step}
    className={inputClass}
    value={value}
    onChange={event => onChange(Number(event.target.value))}
  />
);

const Checkbox: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; title?: string }> = ({ label, checked, onChange, title }) => (
  <label className="flex items-center gap-2 text-xs text-slate-100" title={title}>
    <input
      type="checkbox"
      checked={checked}
      onChange={event => onChange(event.target.checked)}
      className="h-3.5 w-3.5 accent-blue-500"
    />
    {label}
  </label>
);

const PLAYER_NATIVE_COMPONENT_IDS: Msx2ComponentId[] = [
  'msx2_hardware_sprite',
  'msx2_player_control',
  'msx2_jump',
  'msx2_gravity',
  'msx2_push_box',
];

const formatComponentFieldLabel = (key: string): string =>
  key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/\b\w/g, value => value.toUpperCase());

interface PlayerBoxTileOption {
  screenId: string;
  screenName: string;
  tile: Msx2Screen4Tile;
  tileIndex: number;
  palette: Screen5PaletteSlot[];
}

const getBoxTilePixelWidth = (tile: Msx2Screen4Tile | undefined): number =>
  Math.max(8, Math.min(32, Number(tile?.width ?? tile?.pixels?.[0]?.length ?? 16) || 16));

const getBoxTilePixelHeight = (tile: Msx2Screen4Tile | undefined): number =>
  Math.max(8, Math.min(32, Number(tile?.height ?? tile?.pixels?.length ?? 16) || 16));

const buildPlayerBoxTileOptions = (assets: ProjectAsset[]): PlayerBoxTileOption[] => {
  const options: PlayerBoxTileOption[] = [];
  const seen = new Set<string>();

  assets.forEach(asset => {
    if (asset.type !== 'msx2screen') return;
    const screen = asset.data as Msx2Screen4TileScreen | undefined;
    if (!screen?.tiles?.length) return;
    screen.tiles.forEach((tile, tileIndex) => {
      if (getMsx2TileBehaviorKind(tile) !== 'box') return;
      const dedupeKey = tile.id ? `${asset.id}:${tile.id}` : `${asset.id}:tile:${tileIndex}`;
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);
      options.push({
        screenId: asset.id,
        screenName: asset.name || screen.name || asset.id,
        tile,
        tileIndex,
        palette: screen.palette || [],
      });
    });
  });

  return options;
};

const PlayerBoxTilePreview: React.FC<{ option: PlayerBoxTileOption }> = ({ option }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const width = getBoxTilePixelWidth(option.tile);
    const height = getBoxTilePixelHeight(option.tile);
    canvas.width = width;
    canvas.height = height;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#05070b';
    ctx.fillRect(0, 0, width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const slot = Number(option.tile.pixels?.[y]?.[x]) || 0;
        const hex = option.palette[slot]?.hex || (slot === 0 ? '#05070b' : '#ffffff');
        ctx.fillStyle = hex.toLowerCase() === 'transparent' ? '#05070b' : hex;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [option]);

  return (
    <canvas
      ref={canvasRef}
      className="h-12 w-12 flex-none rounded border border-slate-700 bg-black"
      style={{ imageRendering: 'pixelated' }}
      aria-hidden
    />
  );
};

const PlayerComponentsDialog: React.FC<{
  components: Record<string, Record<string, any>>;
  spriteAssets: ProjectAsset[];
  boxTileOptions: PlayerBoxTileOption[];
  onPatchComponent: (componentId: Msx2ComponentId, patch: Record<string, any>) => void;
  onClose: () => void;
}> = ({ components, spriteAssets, boxTileOptions, onPatchComponent, onClose }) => {
  const componentDefs = PLAYER_NATIVE_COMPONENT_IDS
    .map(id => MSX2_COMPONENT_REPERTOIRE.find(component => component.id === id))
    .filter(Boolean) as NonNullable<(typeof MSX2_COMPONENT_REPERTOIRE)[number]>[];

  const renderField = (componentId: Msx2ComponentId, key: string, values: Record<string, any>, defaults: Record<string, any>) => {
    const config = MSX2_COMPONENT_FIELD_EDITORS[componentId]?.[key];
    if (componentId === 'msx2_push_box' && key === 'tileId') return null;
    if (config?.hidden) return null;
    const value = values[key] ?? defaults[key];
    const label = config?.label || formatComponentFieldLabel(key);
    const patch = (nextValue: unknown) => onPatchComponent(componentId, { [key]: nextValue });

    if (config?.kind === 'boolean' || typeof value === 'boolean') {
      return (
        <label key={key} className="flex items-center gap-2 rounded border border-slate-700 bg-[#111821] px-2 py-1.5 text-xs">
          <input
            type="checkbox"
            checked={value !== false}
            onChange={event => patch(event.target.checked)}
            className="h-3.5 w-3.5 accent-blue-500"
          />
          <span>{label}</span>
        </label>
      );
    }

    if (config?.kind === 'select') {
      const options = config.options || [];
      return (
        <label key={key} className="space-y-1 text-xs text-slate-200">
          <span>{label}</span>
          <select className={selectClass} value={String(value ?? options[0] ?? '')} onChange={event => patch(event.target.value)}>
            {options.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      );
    }

    if (config?.kind === 'msx2SpriteAsset') {
      return (
        <label key={key} className="space-y-1 text-xs text-slate-200">
          <span>{label}</span>
          <select className={selectClass} value={String(value || '')} onChange={event => patch(event.target.value)}>
            <option value="">None (use box tile)</option>
            {spriteAssets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
          </select>
        </label>
      );
    }

    if (componentId === 'msx2_push_box' && config?.kind === 'tileIndex') {
      const selectedTileId = String(values.tileId || '').trim();
      const selectedTileIndex = Number.isFinite(Number(value)) ? Number(value) : 0;
      return (
        <div key={key} className="col-span-2 space-y-2 text-xs text-slate-200">
          <div className="flex items-center justify-between gap-2">
            <span>{label}</span>
            <span className="text-[10px] text-slate-400">Filtrado: Caja / BOX</span>
          </div>
          {boxTileOptions.length === 0 ? (
            <div className="rounded border border-amber-700/60 bg-amber-950/20 px-3 py-2 text-[11px] text-amber-100">
              No hay tiles marcados como Caja en las pantallas SCREEN 4/5.
            </div>
          ) : (
            <div className="grid max-h-56 grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2 overflow-auto rounded border border-slate-700 bg-[#111821] p-2">
              {boxTileOptions.map(option => {
                const optionTileId = String(option.tile.id || '').trim();
                const selected = selectedTileId
                  ? optionTileId === selectedTileId
                  : option.tileIndex === selectedTileIndex;
                return (
                  <button
                    key={`${option.screenId}:${optionTileId || option.tileIndex}`}
                    type="button"
                    className={`flex min-w-0 items-center gap-2 rounded border p-2 text-left hover:border-sky-500 ${
                      selected ? 'border-sky-400 bg-sky-950/40' : 'border-slate-700 bg-[#1d2430]'
                    }`}
                    title={`${option.screenName} - tile ${option.tileIndex}${optionTileId ? ` - ${optionTileId}` : ''}`}
                    onClick={() => onPatchComponent(componentId, {
                      tileIndex: option.tileIndex,
                      tileId: optionTileId,
                      boxTileIndex: option.tileIndex,
                    })}
                  >
                    <PlayerBoxTilePreview option={option} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-slate-100">
                        {option.tileIndex}: {option.tile.name || optionTileId || 'Box tile'}
                      </span>
                      <span className="block truncate text-[10px] text-slate-400">{option.screenName}</span>
                      {optionTileId && <span className="block truncate text-[10px] text-slate-500">{optionTileId}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const numeric = config?.kind === 'tileIndex' || typeof value === 'number' || config?.min !== undefined || config?.max !== undefined;
    if (numeric) {
      return (
        <label key={key} className="space-y-1 text-xs text-slate-200">
          <span>{label}</span>
          <input
            type="number"
            min={config?.min}
            max={config?.max}
            className={inputClass}
            value={Number.isFinite(Number(value)) ? Number(value) : 0}
            onChange={event => {
              let nextValue = Number(event.target.value);
              if (!Number.isFinite(nextValue)) nextValue = Number(defaults[key]) || 0;
              if (config?.min !== undefined) nextValue = Math.max(config.min, nextValue);
              if (config?.max !== undefined) nextValue = Math.min(config.max, nextValue);
              patch(nextValue);
            }}
          />
        </label>
      );
    }

    return (
      <label key={key} className="space-y-1 text-xs text-slate-200">
        <span>{label}</span>
        <input className={inputClass} value={String(value ?? '')} onChange={event => patch(event.target.value)} />
      </label>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className="flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded border border-slate-700 bg-[#151a23] shadow-xl">
        <div className="flex h-11 items-center justify-between border-b border-slate-700 px-4">
          <h3 className="text-sm font-semibold text-slate-100">Player Components</h3>
          <button type="button" className="h-7 rounded border border-slate-700 px-3 text-xs hover:bg-slate-800" onClick={onClose}>Close</button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <div className="grid gap-3">
            {componentDefs.map(component => {
              const defaults = component.defaults || {};
              const values = { ...defaults, ...(components[component.id] || {}) };
              const fieldKeys = Array.from(new Set([
                ...Object.keys(defaults),
                ...Object.keys(MSX2_COMPONENT_FIELD_EDITORS[component.id] || {}),
                ...Object.keys(components[component.id] || {}),
              ]));
              return (
                <section key={component.id} className="rounded border border-slate-700 bg-[#1d2430]">
                  <div className="border-b border-slate-700 px-3 py-2">
                    <div className="text-xs font-bold uppercase tracking-wide text-sky-300">{component.label}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">{component.description}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-3">
                    {fieldKeys.map(key => renderField(component.id, key, values, defaults))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const skillMeta: Record<string, { icon: string; category: string; description: string }> = {
  dash: { icon: '💨', category: 'movement', description: 'Quick dash in facing direction' },
  double_jump: { icon: '🦘', category: 'movement', description: 'Jump again in mid-air' },
  wall_jump: { icon: '🧱', category: 'movement', description: 'Jump off walls' },
  air_dash: { icon: '💨', category: 'movement', description: 'Dash while in mid-air' },
  charge_attack: { icon: '⚡', category: 'attack', description: 'Hold to charge, release to attack' },
  glide: { icon: '🦅', category: 'movement', description: 'Slow fall with horizontal control' },
  spin_attack: { icon: '🔄', category: 'attack', description: 'Rotating melee attack' },
  parry: { icon: '🛡️', category: 'defense', description: 'Deflect enemy attacks' },
  crouch: { icon: '⬇️', category: 'movement', description: 'Duck under obstacles' },
  climb: { icon: '🪜', category: 'movement', description: 'Climb ladders and ropes' },
  high_jump: { icon: '⬆️', category: 'movement', description: 'Hold jump for higher leap' },
  collector_gems: { icon: '💎', category: 'collection', description: 'Collect gems and crystals' },
  collector_items: { icon: '🪙', category: 'collection', description: 'Pick up coins, keys and power-ups' },
  push_wall: { icon: '🧱', category: 'puzzle', description: 'Push moveable walls to create paths' },
  push_door: { icon: '🚪', category: 'puzzle', description: 'Open doors by pushing or using keys' },
  carry_object: { icon: '📦', category: 'utility', description: 'Pick up, carry and throw objects' },
  teleport_a_b: { icon: '🌀', category: 'movement', description: 'Teleport between two saved positions' },
  carry_and_throw: { icon: '🏋️', category: 'utility', description: 'Lift objects and throw them through gaps' },
  power_stomp: { icon: '💥', category: 'attack', description: 'Fall with impact, break tiles and damage enemies' },
};

const categoryColors: Record<string, string> = {
  movement: 'text-emerald-400',
  attack: 'text-red-400',
  defense: 'text-blue-400',
  collection: 'text-amber-400',
  puzzle: 'text-purple-400',
  utility: 'text-yellow-400',
};

const SkillParametersDialog: React.FC<{
  skill: SkillDef;
  values: Record<string, number | boolean>;
  onPatch: (key: string, value: number | boolean) => void;
  onClose: () => void;
}> = ({ skill, values, onPatch, onClose }) => {
  const parameters = skill.parameters || [];
  const meta = skillMeta[skill.id] || { icon: '⚙️', category: 'utility', description: 'Skill parameters' };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${skill.label} parameters`}
    >
      <div className="flex max-h-[86vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-slate-700 bg-[#151a23] shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{meta.icon}</span>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">{skill.label}</h3>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-medium ${categoryColors[meta.category]}`}>
                  {meta.category.toUpperCase()}
                </span>
                <span className="text-[10px] text-slate-500">·</span>
                <span className="text-[10px] text-slate-400">{meta.description}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {parameters.map((param: SkillParameterDef) => {
              const raw = values[param.key];
              const fallback = param.default;
              if (param.type === 'boolean') {
                const checked = raw === undefined ? Boolean(fallback) : Boolean(raw);
                return (
                  <label
                    key={param.key}
                    className="col-span-2 flex items-start gap-3 rounded border border-slate-700 bg-[#111821] px-3 py-2.5 text-xs text-slate-100"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={event => onPatch(param.key, event.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-sky-500"
                    />
                    <span className="space-y-0.5">
                      <span className="block font-medium">{param.label}</span>
                      {param.help && <span className="block text-[10px] leading-relaxed text-slate-400">{param.help}</span>}
                    </span>
                  </label>
                );
              }
              const numValue = Number(raw);
              const safeValue = Number.isFinite(numValue) ? numValue : Number(fallback) || 0;
              return (
                <div key={param.key} className="space-y-1.5 text-xs text-slate-200">
                  <label className="flex items-center justify-between gap-2">
                    <span className="text-slate-300">{param.label}</span>
                    <span className="min-w-[40px] rounded bg-slate-800 px-1.5 py-0.5 text-center text-[10px] text-sky-400">
                      {safeValue}
                    </span>
                  </label>
                  <input
                    type="number"
                    min={param.min}
                    max={param.max}
                    step={param.step ?? 1}
                    className={inputClass}
                    value={safeValue}
                    onChange={event => {
                      let next = Number(event.target.value);
                      if (!Number.isFinite(next)) next = Number(fallback) || 0;
                      if (typeof param.min === 'number') next = Math.max(param.min, next);
                      if (typeof param.max === 'number') next = Math.min(param.max, next);
                      onPatch(param.key, next);
                    }}
                  />
                  {param.help && <p className="text-[10px] leading-relaxed text-slate-400">{param.help}</p>}
                </div>
              );
            })}
          </div>
          {parameters.length === 0 && (
            <div className="py-8 text-center text-[11px] text-slate-400">
              This skill has no editable parameters yet.
            </div>
          )}
        </div>
        <div className="border-t border-slate-700 px-4 py-2">
          <p className="text-[10px] text-slate-500">Changes apply immediately · Skill ID: {skill.id}</p>
        </div>
      </div>
    </div>
  );
};

const FunctionKeyField: React.FC<{
  keyId: Msx2PlayerFunctionKeyId;
  enabled: boolean;
  action: Msx2PlayerFunctionKeyAction;
  customLabel: string;
  onEnabledChange: (enabled: boolean) => void;
  onActionChange: (action: Msx2PlayerFunctionKeyAction) => void;
  onCustomLabelChange: (label: string) => void;
}> = ({ keyId, enabled, action, customLabel, onEnabledChange, onActionChange, onCustomLabelChange }) => (
  <div className={`grid grid-cols-[20px_112px_1fr] items-center gap-2 text-xs ${enabled ? 'text-slate-200' : 'text-slate-500'}`}>
    <input
      type="checkbox"
      checked={enabled}
      onChange={event => onEnabledChange(event.target.checked)}
      className="h-3.5 w-3.5 accent-blue-500"
      title={enabled ? 'Disable this function key' : 'Enable this function key'}
    />
    <span className={enabled ? 'text-slate-100' : 'text-slate-400'}>{keyId.toUpperCase()}:</span>
    <div className="flex min-w-0 items-center gap-2">
      <select
        className={`${selectClass} ${action === 'custom' ? 'w-[108px] shrink-0' : 'w-full'} ${enabled ? '' : 'cursor-not-allowed opacity-50'}`}
        value={action}
        disabled={!enabled}
        onChange={event => onActionChange(event.target.value as Msx2PlayerFunctionKeyAction)}
      >
        {MSX2_FUNCTION_KEY_ACTIONS.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {action === 'custom' && (
        <input
          className={`${inputClass} min-w-0 flex-1 ${enabled ? '' : 'cursor-not-allowed opacity-50'}`}
          value={customLabel}
          disabled={!enabled}
          placeholder="Type custom action"
          onChange={event => onCustomLabelChange(event.target.value)}
        />
      )}
    </div>
  </div>
);

const SoundField: React.FC<{
  label: string;
  enabled: boolean;
  triggerPreset: string;
  triggerCustom: string;
  soundAssetId: string;
  soundCustom: string;
  animationOptions: ReadonlyArray<{ value: string; label: string }>;
  soundOptions: ReadonlyArray<{ value: string; label: string }>;
  defaultSoundId: string;
  onEnabledChange: (enabled: boolean) => void;
  onTriggerPresetChange: (preset: string) => void;
  onTriggerCustomChange: (value: string) => void;
  onSoundAssetChange: (assetId: string) => void;
  onSoundCustomChange: (value: string) => void;
}> = ({
  label,
  enabled,
  triggerPreset,
  triggerCustom,
  soundAssetId,
  soundCustom,
  animationOptions,
  soundOptions,
  defaultSoundId,
  onEnabledChange,
  onTriggerPresetChange,
  onTriggerCustomChange,
  onSoundAssetChange,
  onSoundCustomChange,
}) => (
  <div className={`grid grid-cols-[20px_72px_1fr] items-start gap-2 text-xs ${enabled ? 'text-slate-200' : 'text-slate-500'}`}>
    <input
      type="checkbox"
      checked={enabled}
      onChange={event => onEnabledChange(event.target.checked)}
      className="mt-1.5 h-3.5 w-3.5 accent-blue-500"
      title={enabled ? `Disable ${label} sound` : `Enable ${label} sound`}
    />
    <span className={`mt-1.5 ${enabled ? 'text-slate-100' : 'text-slate-400'}`}>{label}:</span>
    <div className="min-w-0 space-y-1.5">
      <div className="grid grid-cols-[52px_1fr] items-center gap-2">
        <span className="text-[10px] uppercase tracking-wide text-slate-400">Event</span>
        <div className="flex min-w-0 items-center gap-2">
          <select
            className={`${selectClass} ${triggerPreset === 'custom' ? 'w-[132px] shrink-0' : 'w-full'} ${enabled ? '' : 'cursor-not-allowed opacity-50'}`}
            value={triggerPreset}
            disabled={!enabled}
            onChange={event => onTriggerPresetChange(event.target.value)}
          >
            <option value={MSX2_PLAYER_SOUND_EVENT_DEFAULT}>Player event</option>
            {animationOptions.length > 0 && (
              <optgroup label="Animations">
                {animationOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </optgroup>
            )}
            <option value="custom">Custom</option>
          </select>
          {triggerPreset === 'custom' && (
            <input
              className={`${inputClass} min-w-0 flex-1 ${enabled ? '' : 'cursor-not-allowed opacity-50'}`}
              value={triggerCustom}
              disabled={!enabled}
              placeholder="Custom event id"
              onChange={event => onTriggerCustomChange(event.target.value)}
            />
          )}
        </div>
      </div>
      <div className="grid grid-cols-[52px_1fr] items-center gap-2">
        <span className="text-[10px] uppercase tracking-wide text-slate-400">Sound</span>
        <div className="flex min-w-0 items-center gap-2">
          <select
            className={`${selectClass} ${soundAssetId === MSX2_PLAYER_SOUND_CUSTOM_ASSET ? 'w-[132px] shrink-0' : 'w-full'} ${enabled ? '' : 'cursor-not-allowed opacity-50'}`}
            value={soundAssetId || '__default__'}
            disabled={!enabled}
            onChange={event => onSoundAssetChange(event.target.value)}
          >
            <option value="__default__">{defaultSoundId}</option>
            {soundOptions.length > 0 && (
              <optgroup label="PSG Sound Editor">
                {soundOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </optgroup>
            )}
            <option value={MSX2_PLAYER_SOUND_CUSTOM_ASSET}>Custom</option>
          </select>
          {soundAssetId === MSX2_PLAYER_SOUND_CUSTOM_ASSET && (
            <input
              className={`${inputClass} min-w-0 flex-1 ${enabled ? '' : 'cursor-not-allowed opacity-50'}`}
              value={soundCustom}
              disabled={!enabled}
              placeholder="Custom SFX id"
              onChange={event => onSoundCustomChange(event.target.value)}
            />
          )}
        </div>
      </div>
    </div>
  </div>
);

const DirectionKeyIcon: React.FC<{ direction: 'left' | 'right' | 'up' | 'down'; dimmed?: boolean }> = ({ direction, dimmed = false }) => {
  const titles = {
    left: 'Left arrow key',
    right: 'Right arrow key',
    up: 'Up arrow key',
    down: 'Down arrow key',
  };
  const arrows: Record<'left' | 'right' | 'up' | 'down', string> = {
    up: 'M15 8.5 L20.5 17.5 H9.5 Z',
    down: 'M15 21.5 L9.5 12.5 H20.5 Z',
    left: 'M8.5 15 L17.5 9.5 V20.5 Z',
    right: 'M21.5 15 L12.5 9.5 V20.5 Z',
  };
  const shadowId = `key-shadow-${direction}`;

  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      className={`block drop-shadow-sm ${dimmed ? 'opacity-40' : ''}`}
      aria-label={titles[direction]}
      role="img"
    >
      <title>{titles[direction]}</title>
      <defs>
        <linearGradient id={`key-face-${direction}`} x1="16" y1="2" x2="16" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="55%" stopColor="#dde3eb" />
          <stop offset="100%" stopColor="#c4ccd8" />
        </linearGradient>
        <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="0.8" floodColor="#000000" floodOpacity="0.28" />
        </filter>
      </defs>
      <rect x="2" y="2" width="28" height="28" rx="6" fill={`url(#key-face-${direction})`} stroke="#778090" strokeWidth="1.1" filter={`url(#${shadowId})`} />
      <rect x="4" y="4" width="24" height="10" rx="4" fill="#ffffff" opacity="0.55" />
      <rect x="4" y="24" width="24" height="3.5" rx="1.75" fill="#9aa3b2" opacity="0.45" />
      <path d={arrows[direction]} fill="#10141c" />
    </svg>
  );
};

const ActionButtonBadge: React.FC<{ letter: 'A' | 'B'; dimmed?: boolean }> = ({ letter, dimmed = false }) => (
  <span
    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-black ${letter === 'A' ? 'bg-red-500' : 'bg-blue-500'} ${dimmed ? 'opacity-40' : ''}`}
    title={`Button ${letter}`}
    aria-label={`Button ${letter}`}
  >
    {letter}
  </span>
);

const WeaponIcon: React.FC<{ type: PlayerWeaponType; selected?: boolean }> = ({ type, selected = false }) => {
  const stroke = selected ? '#7dd3fc' : '#cbd5e1';
  const accent = selected ? '#38bdf8' : '#64748b';
  const fill = selected ? '#0f2d42' : '#151b25';
  return (
    <span className={`inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded border ${selected ? 'border-sky-500 bg-sky-950/50' : 'border-slate-700 bg-[#111821]'}`}>
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
        <rect x="2" y="2" width="28" height="28" rx="5" fill={fill} opacity="0.9" />
        {type === 'melee' && (
          <>
            <path d="M22 4l4 4-10.5 11-4-4L22 4z" fill={accent} stroke={stroke} strokeWidth="1.4" />
            <path d="M10 16l6 6" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
            <path d="M7 19l6 6" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          </>
        )}
        {type === 'projectile' && (
          <>
            <path d="M5 16h17" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />
            <path d="M19 9l7 7-7 7" fill="none" stroke={accent} strokeWidth="2.4" strokeLinejoin="round" />
            <path d="M7 11h6M7 21h6" stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          </>
        )}
        {type === 'arc' && (
          <>
            <path d="M9 23c10-2 15-8 15-18" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
            <path d="M8 8c6 3 10 8 10 17" fill="none" stroke={accent} strokeWidth="2.1" strokeLinecap="round" />
            <path d="M5 18l6 6" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {type === 'bomb' && (
          <>
            <circle cx="15" cy="18" r="7" fill={accent} stroke={stroke} strokeWidth="1.5" />
            <path d="M18 11l4-5" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
            <path d="M22 5l3 2M23 4l1 4" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}
        {type === 'magic' && (
          <>
            <path d="M16 5l2.5 7 7.5 1-5.5 5 1.5 7-6-3.5-6 3.5 1.5-7-5.5-5 7.5-1L16 5z" fill={accent} stroke={stroke} strokeWidth="1.3" />
            <circle cx="8" cy="7" r="1.2" fill="#f8fafc" />
            <circle cx="25" cy="23" r="1.1" fill="#f8fafc" />
          </>
        )}
      </svg>
    </span>
  );
};

const ControlField: React.FC<{
  directionKey?: 'left' | 'right' | 'up' | 'down';
  badge?: 'A' | 'B';
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}> = ({ directionKey, badge, enabled, onEnabledChange, value, onValueChange, options }) => (
  <div className={`grid grid-cols-[20px_44px_1fr] items-center gap-2 text-xs ${enabled ? 'text-slate-200' : 'text-slate-500'}`}>
    <input
      type="checkbox"
      checked={enabled}
      onChange={event => onEnabledChange(event.target.checked)}
      className="h-3.5 w-3.5 accent-blue-500"
      title={
        directionKey
          ? `${enabled ? 'Disable' : 'Enable'} ${directionKey} arrow`
          : badge
            ? `${enabled ? 'Disable' : 'Enable'} button ${badge}`
            : enabled ? 'Disable this control' : 'Enable this control'
      }
    />
    {directionKey ? (
      <DirectionKeyIcon direction={directionKey} dimmed={!enabled} />
    ) : badge ? (
      <ActionButtonBadge letter={badge} dimmed={!enabled} />
    ) : null}
    <select
      className={`${selectClass} ${enabled ? '' : 'cursor-not-allowed opacity-50'}`}
      value={value}
      disabled={!enabled}
      onChange={event => onValueChange(event.target.value)}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  </div>
);

const PlayerPixelArt: React.FC<{ large?: boolean }> = ({ large = false }) => (
  <div className={`relative mx-auto ${large ? 'h-24 w-20' : 'h-20 w-16'}`}>
    <div className="absolute left-[30%] top-[4%] h-[18%] w-[34%] bg-[#c77622]" />
    <div className="absolute left-[22%] top-[12%] h-[16%] w-[52%] bg-[#e0993b]" />
    <div className="absolute left-[30%] top-[26%] h-[13%] w-[36%] bg-[#f1c27d]" />
    <div className="absolute left-[25%] top-[38%] h-[28%] w-[44%] bg-[#1f67b3]" />
    <div className="absolute left-[14%] top-[42%] h-[24%] w-[14%] bg-[#f1c27d]" />
    <div className="absolute right-[16%] top-[42%] h-[24%] w-[14%] bg-[#f1c27d]" />
    <div className="absolute left-[28%] bottom-[7%] h-[28%] w-[16%] bg-[#1b1b1f]" />
    <div className="absolute right-[28%] bottom-[7%] h-[28%] w-[16%] bg-[#1b1b1f]" />
    <div className="absolute left-[23%] bottom-0 h-[8%] w-[24%] bg-[#8b5a2b]" />
    <div className="absolute right-[23%] bottom-0 h-[8%] w-[24%] bg-[#8b5a2b]" />
  </div>
);

const SpriteFramePreview: React.FC<{
  sprite?: Msx2Sprite | null;
  frameIndex?: number;
  large?: boolean;
  pixelScale?: number;
  className?: string;
}> = ({ sprite, frameIndex, large = false, pixelScale, className = '' }) => {
  const resolvedIndex = frameIndex ?? sprite?.currentFrameIndex ?? 0;
  const frame = sprite?.frames?.[resolvedIndex] || sprite?.frames?.[0];
  const pixels = frame?.data;
  const width = sprite?.size?.width || pixels?.[0]?.length || 16;
  const height = sprite?.size?.height || pixels?.length || 16;
  const backgroundColor = String(sprite?.backgroundColor || '').toUpperCase();
  const scale = pixelScale ?? (large
    ? Math.min(5, Math.max(2, Math.floor(112 / Math.max(width, height))))
    : Math.min(4, Math.max(2, Math.floor(84 / Math.max(width, height)))));

  if (!pixels?.length) {
    return <PlayerPixelArt large={large || (pixelScale ?? 0) >= 4} />;
  }

  return (
    <div
      className={`grid ${className}`}
      style={{
        gridTemplateColumns: `repeat(${width}, ${scale}px)`,
        gridAutoRows: `${scale}px`,
        width: width * scale,
        height: height * scale,
      }}
    >
      {Array.from({ length: height }).flatMap((_, y) =>
        Array.from({ length: width }).map((__, x) => {
          const color = String((pixels[y]?.[x] ?? backgroundColor) as MSXColorValue);
          const normalized = color.toUpperCase();
          const transparent = !color || normalized === backgroundColor || normalized === 'TRANSPARENT' || normalized === 'RGBA(0,0,0,0)';
          return (
            <span
              key={`${x}_${y}`}
              style={{ backgroundColor: transparent ? 'transparent' : color }}
            />
          );
        })
      )}
    </div>
  );
};

const PlayerSpriteHitboxPreview: React.FC<{
  sprite?: Msx2Sprite | null;
  frameWidth: number;
  frameHeight: number;
  hitbox: { x: number; y: number; w: number; h: number };
  attackHitbox?: { x: number; y: number; w: number; h: number };
  attackHitboxes?: Partial<Record<PlayerAttackFacing, { x: number; y: number; w: number; h: number }>>;
  title?: string;
  className?: string;
}> = ({ sprite, frameWidth, frameHeight, hitbox, attackHitbox, attackHitboxes, title = 'Sprite & Collision', className = '' }) => {
  const spritePixelW = sprite?.size?.width || frameWidth;
  const spritePixelH = sprite?.size?.height || frameHeight;
  const maxStage = 168;
  const ruler = 24;
  const rightAttack = attackHitboxes?.right || attackHitbox;
  const mirroredAttack = rightAttack ? { ...rightAttack, x: frameWidth - rightAttack.x - rightAttack.w } : undefined;
  const leftAttack = mirroredAttack;
  const previews = rightAttack || leftAttack
    ? [
      { label: 'Right', attack: rightAttack, mirrorSprite: false },
      { label: 'Left mirror', attack: leftAttack, mirrorSprite: true },
    ]
    : [{ label: 'Sprite', attack: undefined, mirrorSprite: false }];

  const renderPreview = (label: string, previewAttack: typeof attackHitbox, mirrorSprite: boolean) => {
    const bounds = [
      { x: 0, y: 0, w: frameWidth, h: frameHeight },
      hitbox,
      ...(previewAttack ? [previewAttack] : []),
    ];
    const minX = Math.min(...bounds.map(rect => rect.x));
    const minY = Math.min(...bounds.map(rect => rect.y));
    const maxX = Math.max(...bounds.map(rect => rect.x + rect.w));
    const maxY = Math.max(...bounds.map(rect => rect.y + rect.h));
    const previewWidth = Math.max(1, maxX - minX);
    const previewHeight = Math.max(1, maxY - minY);
    const originX = -minX;
    const originY = -minY;
    const scale = Math.max(2, Math.min(5, Math.floor(maxStage / Math.max(previewWidth, previewHeight))));
    const stageW = previewWidth * scale;
    const stageH = previewHeight * scale;
    const spriteFrameLeft = originX * scale;
    const spriteFrameTop = originY * scale;

    return (
      <div key={label} className="flex min-w-[220px] flex-col items-center">
        <div className="mb-2 text-[11px] font-semibold text-slate-300">{label}</div>
        <div
          className="grid items-end"
          style={{
            gridTemplateColumns: `${ruler}px ${stageW}px`,
            gridTemplateRows: `${ruler}px ${stageH}px`,
          }}
        >
          <div />
          <div className="relative pb-1">
            <div className="relative border-t border-emerald-400/80">
              <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full px-1 text-[10px] font-medium tabular-nums text-emerald-300">
                {previewWidth}px
              </span>
              <span className="absolute left-0 top-0 h-1.5 w-px bg-emerald-400/80" />
              <span className="absolute right-0 top-0 h-1.5 w-px bg-emerald-400/80" />
            </div>
          </div>
          <div className="relative flex justify-end pr-1">
            <div className="relative h-full border-l border-emerald-400/80">
              <span className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 pr-1.5 text-[10px] font-medium tabular-nums text-emerald-300">
                {previewHeight}px
              </span>
              <span className="absolute left-0 top-0 h-px w-1.5 bg-emerald-400/80" />
              <span className="absolute bottom-0 left-0 h-px w-1.5 bg-emerald-400/80" />
            </div>
          </div>
          <div
            className="relative overflow-visible border border-emerald-500/70 bg-[#0a1018]"
            style={{ width: stageW, height: stageH }}
          >
            <div
              className="pointer-events-none absolute border border-emerald-500/70"
              style={{
                left: spriteFrameLeft,
                top: spriteFrameTop,
                width: frameWidth * scale,
                height: frameHeight * scale,
              }}
            />
            <div
              className="absolute"
              style={{
                left: spriteFrameLeft + ((frameWidth - spritePixelW) / 2) * scale,
                top: spriteFrameTop + (frameHeight - spritePixelH) * scale,
                transform: mirrorSprite ? 'scaleX(-1)' : undefined,
                transformOrigin: 'center',
              }}
            >
              <SpriteFramePreview sprite={sprite} pixelScale={scale} />
            </div>
            <div
              className="pointer-events-none absolute border-2 border-dashed border-white bg-white/10 outline outline-1 outline-dashed outline-black"
              style={{
                left: (originX + hitbox.x) * scale,
                top: (originY + hitbox.y) * scale,
                width: hitbox.w * scale,
                height: hitbox.h * scale,
              }}
              title={`Body: ${hitbox.x},${hitbox.y} ${hitbox.w}x${hitbox.h}px`}
            />
            {previewAttack && (
              <div
                className="pointer-events-none absolute border-2 border-dashed border-red-500/90 bg-red-500/10 outline outline-1 outline-dashed outline-black"
                style={{
                  left: (originX + previewAttack.x) * scale,
                  top: (originY + previewAttack.y) * scale,
                  width: previewAttack.w * scale,
                  height: previewAttack.h * scale,
                }}
                title={`Attack: ${previewAttack.x},${previewAttack.y} ${previewAttack.w}x${previewAttack.h}px`}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex h-full min-h-[220px] flex-col overflow-hidden rounded border border-slate-700 bg-[#121820] ${className}`}>
      <div className="border-b border-slate-700 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-sky-300">
        {title}
      </div>
      <div className="flex flex-1 flex-col items-center justify-center overflow-auto px-4 py-5">
        <div className="flex max-w-full flex-wrap items-start justify-center gap-8">
          {previews.map(({ label, attack, mirrorSprite }) => renderPreview(label, attack, mirrorSprite))}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] text-slate-300">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 border border-emerald-400 bg-emerald-950/30" />
            Sprite 16x16
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 border-2 border-dashed border-white bg-white/10 outline outline-1 outline-dashed outline-black" />
            Body
          </span>
          {(rightAttack || leftAttack) && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 border-2 border-dashed border-red-500 bg-red-500/10 outline outline-1 outline-dashed outline-black" />
              Attack
            </span>
          )}
        </div>
        <p className="mt-2 text-center text-[10px] tabular-nums text-slate-500">
          Hitbox ({hitbox.x}, {hitbox.y}) / {hitbox.w}x{hitbox.h}px
        </p>
      </div>
    </div>
  );
};
const animationDelayMs = (speed: number): number =>
  Math.max(32, Math.round(Math.max(1, speed) * (1000 / 60)));

const usePlayerAnimationPreview = (
  animation: Msx2PlayerAnimation | undefined,
  animationKey: string | null,
  sprite?: Msx2Sprite,
) => {
  const previewTiming = useMemo(
    () => playerAnimationPreviewTiming(animation, sprite),
    [animation, sprite],
  );
  const frameIndices = previewTiming.frameIndices;
  const [playing, setPlaying] = useState(false);
  const [slot, setSlot] = useState(0);
  const spriteFrameIndex = frameIndices[Math.min(slot, frameIndices.length - 1)] ?? 0;
  const delayMs = animationDelayMs(previewTiming.speedFrames);

  useEffect(() => {
    setSlot(0);
    setPlaying(false);
  }, [animationKey, frameIndices.join(',')]);

  useEffect(() => {
    if (!playing || frameIndices.length <= 1) return undefined;
    const playback = previewTiming.playback ?? 'loop';
    const timer = window.setInterval(() => {
      setSlot(previous => {
        const last = frameIndices.length - 1;
        if (previous >= last) {
          if (playback === 'once') {
            setPlaying(false);
            return last;
          }
          return 0;
        }
        return previous + 1;
      });
    }, delayMs);
    return () => window.clearInterval(timer);
  }, [playing, frameIndices, delayMs, previewTiming.playback]);

  return {
    playing,
    play: () => setPlaying(true),
    stop: () => {
      setPlaying(false);
      setSlot(0);
    },
    spriteFrameIndex,
  };
};

const PlayerPreviewControls: React.FC<{
  playing: boolean;
  onPlay: () => void;
  onStop: () => void;
  selectedKey: string | null;
  animationRows: ReadonlyArray<{ key: string; animation: string }>;
  onSelectAnimation: (key: string | null) => void;
}> = ({ playing, onPlay, onStop, selectedKey, animationRows, onSelectAnimation }) => (
  <div className="mt-3 flex items-center gap-2">
    <button
      className={`h-8 w-8 rounded border text-xs ${playing ? 'border-sky-500 bg-sky-900/50' : 'border-slate-700 bg-[#242c38] hover:bg-[#2d3747]'}`}
      type="button"
      title="Play animation"
      aria-label="Play animation"
      onClick={onPlay}
    >
      &gt;
    </button>
    <button
      className="h-8 w-8 rounded border border-slate-700 bg-[#242c38] text-xs hover:bg-[#2d3747]"
      type="button"
      title="Stop animation"
      aria-label="Stop animation"
      onClick={onStop}
    >
      []
    </button>
    <select
      className={`${selectClass} flex-1`}
      value={selectedKey || ''}
      onChange={event => onSelectAnimation(event.target.value || null)}
    >
      {animationRows.map(row => (
        <option key={row.key} value={row.key}>Anim: {row.animation}</option>
      ))}
    </select>
  </div>
);

export const Msx2PlayerEditor: React.FC<Msx2PlayerEditorProps> = ({ player, playerAssetName, onUpdate, allAssets, onUpsertStateMachineAsset }) => {
  const normalized = useMemo(() => normalizeMsx2PlayerDefinition(player), [player]);
  // Resolve the project's graphics backend from its assets using the SAME rule
  // as the ASM generator (single source of truth), so the skill list shown here
  // matches what the generator will actually emit. A skill with no
  // supportedBackends declared is always shown (backward compatible).
  const graphicsBackend: GraphicsBackend = useMemo(() => resolveGraphicsBackend({}, allAssets), [allAssets]);
  const skillsForBackend = useMemo(() => getSkillsForBackend(graphicsBackend), [graphicsBackend]);
  const detailedDocument = useMemo(() => buildDetailedMsx2PlayerDocument(normalized), [normalized]);
  const [selectedAnimationKey, setSelectedAnimationKey] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<PlayerConfigSection>('General');
  const [isComponentsDialogOpen, setIsComponentsDialogOpen] = useState(false);
  const [openSkillDialogId, setOpenSkillDialogId] = useState<string | null>(null);
  const [isBulletConfigOpen, setIsBulletConfigOpen] = useState(false);
  const [selectedAttackFacing, setSelectedAttackFacing] = useState<PlayerAttackFacing>('right');
  const [selectedWeaponId, setSelectedWeaponId] = useState<string | null>(null);
  const [newStateName, setNewStateName] = useState('');
  const importRef = useRef<HTMLInputElement>(null);
  const lastAnimationSyncSignatureRef = useRef<string | null>(null);
  const spriteAssets = useMemo(() => allAssets.filter(asset => asset.type === 'msx2sprite'), [allAssets]);
  const soundAssets = useMemo(() => allAssets.filter(asset => asset.type === 'sound'), [allAssets]);
  const stateMachineAssets = useMemo(() => allAssets.filter(asset => asset.type === 'statemachine'), [allAssets]);
  const paletteAssets = useMemo(() => allAssets.filter(asset => asset.type === 'palette'), [allAssets]);
  const boxTileOptions = useMemo(() => buildPlayerBoxTileOptions(allAssets), [allAssets]);
  const selectedSprite = useMemo(
    () => spriteAssets.find(asset => asset.id === normalized.render.spriteAssetId)?.data as Msx2Sprite | undefined,
    [normalized.render.spriteAssetId, spriteAssets]
  );
  const resolveAnimationSpriteAssetId = (animation?: Msx2PlayerAnimation) =>
    animation?.spriteAssetId || normalized.render.spriteAssetId;
  const resolveAnimationSprite = (animation?: Msx2PlayerAnimation): Msx2Sprite | undefined => {
    const assetId = resolveAnimationSpriteAssetId(animation);
    if (!assetId) return undefined;
    return spriteAssets.find(asset => asset.id === assetId)?.data as Msx2Sprite | undefined;
  };
  const labelForSpriteAsset = (assetId?: string) => {
    if (!assetId) return 'Default';
    return spriteAssets.find(asset => asset.id === assetId)?.name || assetId;
  };
  const spriteSize = parsePlayerSpriteSize(normalized.render.spriteSize);
  const body = normalized.hitboxes.body;
  const attack = normalized.hitboxes.attack || { x: 4, y: 6, w: 8, h: 12 };
  const attackByFacing = normalized.hitboxes.attackByFacing || {};
  const selectedAttackHitbox = attackByFacing[selectedAttackFacing] || attack;
  const logic = normalized.logic || {};
  const selectedStateMachineAsset = useMemo(
    () => stateMachineAssets.find(asset => asset.id === normalized.stateMachineAssetId),
    [normalized.stateMachineAssetId, stateMachineAssets],
  );
  const selectedStateMachine = selectedStateMachineAsset?.data as StateMachine | undefined;
  const weapons = normalized.weapons || [];
  const equippedWeaponId = normalized.equippedWeaponId || '';
  const selectedWeapon =
    weapons.find(weapon => weapon.id === selectedWeaponId)
    || weapons[0]
    || null;
  const weaponStateOptions = useMemo(() => {
    const names = selectedStateMachine
      ? selectedStateMachine.states.map(state => state.name || state.id)
      : normalized.stateMachine;
    return Array.from(new Set(names.filter(Boolean)));
  }, [normalized.stateMachine, selectedStateMachine]);
  const weaponAnimationRoles = normalized.animationOrder?.length
    ? normalized.animationOrder
    : Object.keys(normalized.animations || {});

  const updateRender = (patch: Partial<Msx2PlayerDefinition['render']>) => onUpdate({ render: { ...normalized.render, ...patch } });
  const selectDefaultSpriteAsset = (spriteAssetId: string | undefined) => {
    const sprite = spriteAssetId
      ? spriteAssets.find(asset => asset.id === spriteAssetId)?.data as Msx2Sprite | undefined
      : undefined;
    const nextSpriteSize = spriteSizeFromMsx2Sprite(sprite);
    const defaultRenderAnimations = Object.fromEntries(
      Object.entries(normalized.animations).map(([key, animation]) => [
        key,
        animation.spriteAssetId
          ? animation
          : playerAnimationFromMsx2Sprite(animation, sprite),
      ]),
    ) as Record<string, Msx2PlayerAnimation>;
    onUpdate({
      render: {
        ...normalized.render,
        spriteAssetId,
        ...(nextSpriteSize ? { spriteSize: nextSpriteSize } : {}),
      },
      animations: defaultRenderAnimations,
    });
  };

  useEffect(() => {
    if (!normalized.render.spriteAssetId) return;
    if (!selectedSprite?.size) return;
    const nextSpriteSize = spriteSizeFromMsx2Sprite(selectedSprite);
    if (nextSpriteSize && normalized.render.spriteSize !== nextSpriteSize) {
      updateRender({ spriteSize: nextSpriteSize });
    }
  }, [
    normalized.render.spriteAssetId,
    normalized.render.spriteSize,
    selectedSprite?.size?.width,
    selectedSprite?.size?.height,
  ]);

  useEffect(() => {
    if (!spriteAssets.length) return;
    const { animations, changed } = syncPlayerAnimationsFromLinkedSprites(normalized, spriteAssets);
    if (!changed) return;
    const animationOrder = normalized.animationOrder || Object.keys(animations);
    const syncSignature = JSON.stringify({ animations, animationOrder });
    if (lastAnimationSyncSignatureRef.current === syncSignature) return;
    lastAnimationSyncSignatureRef.current = syncSignature;
    onUpdate({
      animations,
      animationOrder,
    });
  }, [normalized, spriteAssets]);
  const updateMovement = (patch: Partial<Msx2PlayerDefinition['movement']>) => onUpdate({ movement: { ...normalized.movement, ...patch } });
  const updateHealth = (patch: Partial<Msx2PlayerDefinition['health']>) => onUpdate({ health: { ...normalized.health, ...patch } });
  const updateAttack = (patch: Partial<Msx2PlayerDefinition['attack']>) => onUpdate({ attack: { ...normalized.attack, ...patch } });
  const updateWeapons = (nextWeapons: PlayerWeaponDefinition[], nextEquippedWeaponId = normalized.equippedWeaponId) => {
    onUpdate({
      weapons: nextWeapons,
      equippedWeaponId: nextEquippedWeaponId || '',
    });
  };
  const updateSkillParameter = (skillId: string, key: string, value: number | boolean) => {
    const current = normalized.skillParameters || {};
    const skillEntry = { ...(current[skillId] || {}), [key]: value };
    onUpdate({
      skillParameters: {
        ...current,
        [skillId]: skillEntry,
      },
    });
  };
  const addWeapon = () => {
    const existingIds = new Set(weapons.map(weapon => weapon.id));
    const baseId = 'weapon';
    let index = weapons.length + 1;
    let id = `${baseId}_${index}`;
    while (existingIds.has(id)) {
      index += 1;
      id = `${baseId}_${index}`;
    }
    const nextWeapon: PlayerWeaponDefinition = {
      id,
      name: `Weapon ${index}`,
      type: 'melee',
      availability: 'pickup',
      pickupItemId: `pickup_${id}`,
      button: 'a',
      state: weaponStateOptions[0] || 'Attacking',
      animationRole: 'attack',
      damage: 1,
      cooldownFrames: 15,
      activeFrames: { start: 2, end: 6 },
      hitboxSource: 'attackByFacing',
      ammo: { enabled: false, initial: 0, max: 0, consumePerUse: 0, refillAmount: 0, emptyBehavior: 'block' },
      durability: { enabled: false, initial: 0, max: 0, consumePerUse: 0, repairAmount: 0, breakBehavior: 'unequip' },
      notes: 'Declarative weapon metadata. ASM runtime support pending.',
    };
    updateWeapons([...weapons, nextWeapon], equippedWeaponId);
    setSelectedWeaponId(id);
  };
  const updateSelectedWeapon = (patch: Partial<PlayerWeaponDefinition>) => {
    if (!selectedWeapon) return;
    const nextWeapon = {
      ...selectedWeapon,
      ...patch,
      activeFrames: {
        ...selectedWeapon.activeFrames,
        ...(patch.activeFrames || {}),
      },
    };
    const nextWeapons = weapons.map(weapon => weapon.id === selectedWeapon.id ? nextWeapon : weapon);
    const nextEquippedWeaponId = equippedWeaponId === selectedWeapon.id ? nextWeapon.id : equippedWeaponId;
    updateWeapons(nextWeapons, nextEquippedWeaponId);
    if (patch.id) {
      setSelectedWeaponId(nextWeapon.id);
    }
  };
  const renameSelectedWeaponId = (value: string) => {
    if (!selectedWeapon) return;
    const id = sanitizeWeaponId(value);
    if (!id || id === selectedWeapon.id) return;
    if (weapons.some(weapon => weapon.id === id)) return;
    updateSelectedWeapon({ id });
  };
  const duplicateSelectedWeapon = () => {
    if (!selectedWeapon) return;
    const baseId = sanitizeWeaponId(`${selectedWeapon.id}_copy`);
    const existingIds = new Set(weapons.map(weapon => weapon.id));
    let id = baseId;
    let suffix = 2;
    while (existingIds.has(id)) {
      id = `${baseId}_${suffix}`;
      suffix += 1;
    }
    const duplicate = {
      ...selectedWeapon,
      id,
      name: `${selectedWeapon.name} Copy`,
    };
    updateWeapons([...weapons, duplicate], equippedWeaponId);
    setSelectedWeaponId(id);
  };
  const removeSelectedWeapon = () => {
    if (!selectedWeapon) return;
    const nextWeapons = weapons.filter(weapon => weapon.id !== selectedWeapon.id);
    const nextEquippedWeaponId = equippedWeaponId === selectedWeapon.id ? '' : equippedWeaponId;
    updateWeapons(nextWeapons, nextEquippedWeaponId);
    setSelectedWeaponId(nextWeapons[0]?.id || null);
  };
  const updateBodyHitbox = (patch: Partial<typeof body>) => onUpdate({ hitboxes: { ...normalized.hitboxes, body: { ...body, ...patch } } });
  const updateAttackHitboxForFacing = (patch: Partial<typeof selectedAttackHitbox>) => {
    const nextHitbox = { ...selectedAttackHitbox, ...patch };
    onUpdate({
      hitboxes: {
        ...normalized.hitboxes,
        attack: selectedAttackFacing === 'right' ? nextHitbox : attack,
        attackByFacing: {
          ...attackByFacing,
          [selectedAttackFacing]: nextHitbox,
        },
      },
    });
  };
  const updateInputEnabled = (key: string, enabled: boolean) => {
    onUpdate({ inputEnabled: { ...normalized.inputEnabled, [key]: enabled } });
  };
  const updateLogic = (patch: Partial<Msx2PlayerLogicFlags>) => {
    onUpdate({ logic: { ...logic, ...patch } });
  };
  const updateNativeComponent = (componentId: Msx2ComponentId, patch: Record<string, any>) => {
    const def = MSX2_COMPONENT_REPERTOIRE.find(component => component.id === componentId);
    const defaults = def?.defaults || {};
    onUpdate({
      components: {
        ...(normalized.components || {}),
        [componentId]: {
          ...defaults,
          ...(normalized.components?.[componentId] || {}),
          ...patch,
        },
      },
    });
  };
  const selectStateMachineAsset = (assetId: string | undefined) => {
    onUpdate(buildPlayerStateMachinePatchFromAsset(assetId, stateMachineAssets));
  };

  const controlRows: ReadonlyArray<{
    directionKey?: 'left' | 'right' | 'up' | 'down';
    badge?: 'A' | 'B';
    key: Msx2PlayerControlId;
    binding: 'direction' | 'button';
    fallback: string;
  }> = [
    { directionKey: 'left', key: 'left', binding: 'direction', fallback: 'arrows' },
    { directionKey: 'right', key: 'right', binding: 'direction', fallback: 'arrows' },
    { directionKey: 'up', key: 'up', binding: 'direction', fallback: 'arrows' },
    { directionKey: 'down', key: 'down', binding: 'direction', fallback: 'arrows' },
    { badge: 'A', key: 'jump', binding: 'button', fallback: 'spc' },
    { badge: 'B', key: 'attack', binding: 'button', fallback: 'm' },
  ];

  const functionKeyRows: Msx2PlayerFunctionKeyId[] = ['f1', 'f2', 'f3', 'f4', 'f5'];

  const exportPlayer = () => {
    const blob = new Blob([JSON.stringify(detailedDocument, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${normalized.id || 'msx2_player'}.player.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importPlayer = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        onUpdate(parseMsx2PlayerImport(JSON.parse(String(reader.result))));
      } catch {
        window.alert('Invalid MSX2 player JSON.');
      }
    };
    reader.readAsText(file);
  };

  const animationOrder = normalized.animationOrder || Object.keys(normalized.animations);
  const selectedKey = selectedAnimationKey && normalized.animations[selectedAnimationKey]
    ? selectedAnimationKey
    : animationOrder[0] || null;
  const selectedAnimation = selectedKey ? normalized.animations[selectedKey] : undefined;
  const selectedAnimationSprite = useMemo(
    () => resolveAnimationSprite(selectedAnimation),
    [selectedAnimation, normalized.render.spriteAssetId, spriteAssets]
  );
  const selectedAnimationTiming = useMemo(
    () => playerAnimationPreviewTiming(selectedAnimation, selectedAnimationSprite),
    [selectedAnimation, selectedAnimationSprite],
  );
  const previewAnimationSprite = selectedAnimationSprite || selectedSprite;
  const previewAnimation = usePlayerAnimationPreview(selectedAnimation, selectedKey, previewAnimationSprite);

  const updateAnimations = (animations: Record<string, Msx2PlayerAnimation>, nextOrder: string[]) => {
    onUpdate({ animations, animationOrder: nextOrder });
  };

  const updateSelectedAnimationRender = (spriteAssetId: string | undefined) => {
    if (!selectedKey) return;
    const selected = normalized.animations[selectedKey];
    const sprite = spriteAssetId
      ? spriteAssets.find(asset => asset.id === spriteAssetId)?.data as Msx2Sprite | undefined
      : selectedSprite;
    updateAnimations(
      {
        ...normalized.animations,
        [selectedKey]: {
          ...selected,
          ...playerAnimationFromMsx2Sprite(selected, sprite),
          spriteAssetId,
        },
      },
      animationOrder,
    );
  };

  const updateSelectedAnimationState = (stateMachineState: string | undefined) => {
    if (!selectedKey) return;
    const selected = normalized.animations[selectedKey];
    updateAnimations(
      {
        ...normalized.animations,
        [selectedKey]: {
          ...selected,
          stateMachineState: stateMachineState || undefined,
        },
      },
      animationOrder,
    );
  };

  const stateMachineStateOptions = useMemo(() => {
    const fromAsset = selectedStateMachine?.states?.map(state => ({
      value: String(state.id || state.name || '').trim(),
      label: String(state.name || state.id || '').trim(),
    })) || [];
    const fromTemplate = normalized.stateMachine.map(stateName => ({
      value: stateName,
      label: friendlyStateLabelFromId(stateName),
    }));
    const seen = new Set<string>();
    return [...fromAsset, ...fromTemplate]
      .filter(option => option.value && !seen.has(option.value) && seen.add(option.value));
  }, [selectedStateMachine, normalized.stateMachine]);

  const stateMachineStateLabelByValue = useMemo(
    () => new Map(stateMachineStateOptions.map(option => [option.value, option.label])),
    [stateMachineStateOptions],
  );

  const animationRows = animationOrder
    .filter(key => normalized.animations[key])
    .map((key, index) => {
      const animation = normalized.animations[key];
      const renderSprite = resolveAnimationSprite(animation);
      const stateMachineState = animation.stateMachineState || '';
      return {
        key,
        id: index,
        animation: labelForAnimationRole(animation),
        stateMachineState,
        stateMachineStateLabel: stateMachineState
          ? stateMachineStateLabelByValue.get(stateMachineState) || friendlyStateLabelFromId(stateMachineState)
          : '',
        render: labelForSpriteAsset(resolveAnimationSpriteAssetId(animation)),
        renderFrames: renderSprite?.frames?.length || 0,
      };
    });

  const linkedPlayerStateMachineAsset = normalized.stateMachineAssetId
    ? stateMachineAssets.find(asset => asset.id === normalized.stateMachineAssetId)
    : undefined;
  const nextPlayerStateMachineAsset = useMemo(
    () => nextPlayerStateMachineAssetIdentity(stateMachineAssets, playerAssetName || normalized.id || 'Player'),
    [stateMachineAssets, playerAssetName, normalized.id],
  );
  const targetPlayerStateMachineAssetId = linkedPlayerStateMachineAsset?.id
    || nextPlayerStateMachineAsset.id;
  const targetPlayerStateMachineAssetName = linkedPlayerStateMachineAsset?.name
    || nextPlayerStateMachineAsset.name;

  const createOrUpdatePlayerStateMachine = () => {
    if (!onUpsertStateMachineAsset) return;
    const orderedAnimationKeys = animationOrder.filter(key => {
      const animation = normalized.animations[key];
      return animation && String(animation.stateMachineState || '').trim();
    });
    if (!orderedAnimationKeys.length) return;

    const existingAsset = linkedPlayerStateMachineAsset;
    const existingMachine = existingAsset?.data as StateMachine | undefined;
    const existingStatesById = new Map((existingMachine?.states || []).map(state => [state.id, state]));
    const stateSources: Array<{ key: string; animation: Msx2PlayerAnimation; stateId: string }> = [];
    const usedStateIds = new Set<string>();

    orderedAnimationKeys.forEach(key => {
      const animation = normalized.animations[key];
      const stateId = sanitizePlayerStateId(animation.stateMachineState || key);
      if (usedStateIds.has(stateId)) return;
      usedStateIds.add(stateId);
      stateSources.push({ key, animation, stateId });
    });

    const states: StateMachineState[] = stateSources.map(({ animation, stateId }, index) => {
      const label = labelForAnimationRole(animation);
      const existingState = existingStatesById.get(stateId);
      return {
        ...existingState,
        id: stateId,
        name: existingState?.name || playerStateNameFromLabel(label),
        position: existingState?.position || {
          x: 120 + (index % 4) * 180,
          y: 80 + Math.floor(index / 4) * 120,
        },
      };
    });

    const validStateIds = new Set(states.map(state => state.id));
    const transitions = (existingMachine?.transitions || []).filter(transition =>
      validStateIds.has(transition.fromStateId) && validStateIds.has(transition.toStateId)
    );
    const initialStateId = existingMachine?.initialStateId && validStateIds.has(existingMachine.initialStateId)
      ? existingMachine.initialStateId
      : states[0]?.id || null;
    const assetId = existingAsset?.id || targetPlayerStateMachineAssetId;
    const assetName = existingAsset?.name || targetPlayerStateMachineAssetName;
    const stateMachine: StateMachine = {
      id: assetId,
      name: assetName,
      states,
      events: existingMachine?.events || [],
      transitions,
      initialStateId,
    };

    onUpsertStateMachineAsset({
      id: assetId,
      name: assetName,
      type: 'statemachine',
      data: stateMachine,
    });
    onUpdate({
      stateMachineAssetId: assetId,
      stateMachine: states.map(state => state.id),
    });
  };

  const addPlayerStateMachineState = () => {
    if (!onUpsertStateMachineAsset) return;
    const label = newStateName.trim();
    if (!label) return;
    const newStateId = sanitizePlayerStateId(label);
    const existingAsset = linkedPlayerStateMachineAsset;
    const existingMachine = existingAsset?.data as StateMachine | undefined;
    const seedStates = existingMachine?.states?.length
      ? existingMachine.states
      : normalized.stateMachine.map((stateId, index) => stateMachineStateFromId(stateId, index));
    const matchingState = seedStates.find(state =>
      state.id.toLowerCase() === newStateId.toLowerCase()
      || String(state.name || '').trim().toLowerCase() === label.toLowerCase()
    );
    const states = matchingState
      ? seedStates
      : [
        ...seedStates,
        {
          id: newStateId,
          name: label as StateMachineStateName,
          position: {
            x: 120 + (seedStates.length % 4) * 180,
            y: 80 + Math.floor(seedStates.length / 4) * 120,
          },
        },
      ];
    const validStateIds = new Set(states.map(state => state.id));
    const transitions = (existingMachine?.transitions || []).filter(transition =>
      validStateIds.has(transition.fromStateId) && validStateIds.has(transition.toStateId)
    );
    const assetId = existingAsset?.id || targetPlayerStateMachineAssetId;
    const assetName = existingAsset?.name || targetPlayerStateMachineAssetName;
    const initialStateId = existingMachine?.initialStateId && validStateIds.has(existingMachine.initialStateId)
      ? existingMachine.initialStateId
      : states[0]?.id || null;
    const stateMachine: StateMachine = {
      id: assetId,
      name: assetName,
      states,
      events: existingMachine?.events || [],
      transitions,
      initialStateId,
    };

    onUpsertStateMachineAsset({
      id: assetId,
      name: assetName,
      type: 'statemachine',
      data: stateMachine,
    });
    onUpdate({
      stateMachineAssetId: assetId,
      stateMachine: states.map(state => state.id),
    });
    setNewStateName('');
  };

  const soundAnimationOptions = useMemo(
    () => animationOrder
      .filter(key => normalized.animations[key])
      .map(key => ({
        value: `anim:${key}`,
        label: `Anim: ${labelForAnimationRole(normalized.animations[key])}`,
      })),
    [animationOrder, normalized.animations],
  );

  const soundAssetOptions = useMemo(
    () => soundAssets.map(asset => ({
      value: asset.id,
      label: asset.name,
    })),
    [soundAssets],
  );

  const updateSoundSlot = (
    slotId: Msx2PlayerSoundSlotId,
    patch: {
      enabled?: boolean;
      triggerPreset?: string;
      triggerCustom?: string;
      soundAssetId?: string | null;
      soundCustom?: string;
    },
  ) => {
    const slot = MSX2_PLAYER_SOUND_SLOTS.find(entry => entry.id === slotId);
    if (!slot) return;

    const soundPresets = {
      ...(normalized.soundPresets || {}),
      ...(patch.triggerPreset !== undefined ? { [slotId]: patch.triggerPreset } : {}),
    };
    const soundCustomValues = {
      ...(normalized.soundCustomValues || {}),
      ...(patch.triggerCustom !== undefined ? { [slotId]: patch.triggerCustom } : {}),
    };
    const soundAssetIds = { ...(normalized.soundAssetIds || {}) };
    const soundAssetCustomValues = {
      ...(normalized.soundAssetCustomValues || {}),
      ...(patch.soundCustom !== undefined ? { [slotId]: patch.soundCustom } : {}),
    };
    const soundsEnabled = {
      ...(normalized.soundsEnabled || {}),
      ...(patch.enabled !== undefined ? { [slotId]: patch.enabled } : {}),
    };

    if (patch.soundAssetId !== undefined) {
      if (!patch.soundAssetId || patch.soundAssetId === '__default__') {
        delete soundAssetIds[slotId];
      } else {
        soundAssetIds[slotId] = patch.soundAssetId;
      }
    }

    const selectedSoundAssetId = soundAssetIds[slotId];
    let resolvedSound = slot.defaultPreset;
    if (selectedSoundAssetId === MSX2_PLAYER_SOUND_CUSTOM_ASSET) {
      resolvedSound = resolvePlayerSoundExportId(
        MSX2_PLAYER_SOUND_CUSTOM_ASSET,
        soundAssetCustomValues[slotId],
        slot.defaultPreset,
      );
    } else if (selectedSoundAssetId) {
      const asset = soundAssets.find(entry => entry.id === selectedSoundAssetId);
      resolvedSound = asset?.name || asset?.id || slot.defaultPreset;
    } else if (soundAssetCustomValues[slotId]?.trim()) {
      resolvedSound = soundAssetCustomValues[slotId].trim();
    } else {
      resolvedSound = normalized.sounds?.[slotId] || slot.defaultPreset;
    }

    onUpdate({
      soundPresets,
      soundCustomValues,
      soundAssetIds,
      soundAssetCustomValues,
      soundsEnabled,
      sounds: {
        ...(normalized.sounds || {}),
        [slotId]: resolvedSound,
      },
    });
  };

  const importSoundsFromAnimations = () => {
    onUpdate(buildSoundsImportFromAnimations(normalized));
  };

  return (
    <div className="h-full min-h-0 overflow-hidden bg-[#11161f] text-slate-100">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex h-11 flex-shrink-0 items-center gap-3 border-b border-slate-800 bg-[#151a23] px-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="text-xs font-semibold text-slate-100">Player Name:</span>
            <input className={`${inputClass} max-w-[320px]`} value={normalized.name} onChange={event => onUpdate({ name: event.target.value })} />
          </div>
          <button className="h-8 rounded border border-slate-700 bg-[#242c38] px-5 text-xs hover:bg-[#2d3747]" type="button" onClick={() => navigator.clipboard?.writeText(JSON.stringify(detailedDocument, null, 2))}>Duplicate</button>
          <button className="h-8 rounded border border-slate-700 bg-[#242c38] px-5 text-xs hover:bg-[#2d3747]" type="button" onClick={() => setIsComponentsDialogOpen(true)}>Components...</button>
          <button className="h-8 rounded border border-slate-700 bg-[#242c38] px-5 text-xs hover:bg-[#2d3747]" type="button" onClick={exportPlayer}>Export...</button>
          <button className="h-8 rounded border border-slate-700 bg-[#242c38] px-5 text-xs hover:bg-[#2d3747]" type="button" onClick={() => importRef.current?.click()}>Import...</button>
          <button className="h-8 rounded border border-blue-700 bg-blue-700 px-6 text-xs font-semibold hover:bg-blue-600" type="button" onClick={() => onUpdate(detailedDocument as unknown as Partial<Msx2PlayerDefinition>)}>Save</button>
          <input ref={importRef} type="file" accept=".json,.player.json,application/json" className="hidden" onChange={event => importPlayer(event.target.files?.[0])} />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[238px_1fr] gap-2 overflow-hidden p-2">
          <aside className="grid min-h-0 grid-rows-[1fr_330px] gap-2">
            <section className={panelClass}>
              <div className={panelTitleClass}>Player Config</div>
              <div className="border-b border-slate-800 p-2">
                <button
                  type="button"
                  className="h-8 w-full rounded border border-sky-700 bg-sky-950/40 px-3 text-left text-xs font-semibold text-sky-200 hover:bg-sky-900/50"
                  onClick={() => setIsComponentsDialogOpen(true)}
                >
                  Components...
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-auto py-1">
                {navItems.map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setActiveSection(item)}
                    className={`block h-8 w-full border-b border-slate-800 px-4 text-left text-xs ${activeSection === item ? 'bg-blue-700 text-white' : 'text-slate-100 hover:bg-slate-800'}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>

            <section className={panelClass}>
              <div className={panelTitleClass}>Player Preview</div>
              <div className="min-h-0 flex-1 overflow-auto p-3">
                <div className="relative h-[220px] overflow-hidden rounded border border-slate-700 bg-[linear-gradient(45deg,#1a202b_25%,transparent_25%),linear-gradient(-45deg,#1a202b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1a202b_75%),linear-gradient(-45deg,transparent_75%,#1a202b_75%)] bg-[length:20px_20px] bg-[#141923]">
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-[linear-gradient(#48b548_0_35%,#7b5127_35%)]" />
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
                    <SpriteFramePreview
                      sprite={previewAnimationSprite}
                      frameIndex={previewAnimation.spriteFrameIndex}
                      large
                    />
                  </div>
                </div>
                <PlayerPreviewControls
                  playing={previewAnimation.playing}
                  onPlay={previewAnimation.play}
                  onStop={previewAnimation.stop}
                  selectedKey={selectedKey}
                  animationRows={animationRows}
                  onSelectAnimation={setSelectedAnimationKey}
                />
              </div>
            </section>
          </aside>

          <main className="relative min-h-0 overflow-hidden">
            <div className="grid min-h-0 grid-cols-[1.2fr_1.58fr] gap-2">
              <section className={`${panelClass} ${activeSection === 'General' ? 'absolute inset-0' : 'hidden'}`}>
                <div className={panelTitleClass}>General</div>
                <div className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
                  <Field label="Player ID"><input className={inputClass} value={normalized.id} onChange={event => onUpdate({ id: event.target.value })} /></Field>
                  <Field label="Description"><input className={inputClass} value={normalized.notes || 'Main player character'} onChange={event => onUpdate({ notes: event.target.value })} /></Field>
                  <Field label="Initial Health"><SmallNumber value={normalized.health.maxHealth} onChange={value => updateHealth({ maxHealth: value })} /></Field>
                  <Field label="Max Health"><SmallNumber value={normalized.health.maxHealth} onChange={value => updateHealth({ maxHealth: value })} /></Field>
                  <Field label="Initial Lives"><SmallNumber value={normalized.health.lives} onChange={value => updateHealth({ lives: value })} /></Field>
                  <Field label="Default Facing">
                    <select className={selectClass} value={normalized.defaultFacing || 'right'} onChange={event => onUpdate({ defaultFacing: event.target.value as Msx2PlayerDefinition['defaultFacing'] })}>
                      {MSX2_PLAYER_FACING_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </Field>
                  <div className="grid grid-cols-[96px_1fr] items-center gap-2 text-xs">
                    <span>Size (px):</span>
                    <div className="grid grid-cols-4 items-center gap-2">
                      <span>Width:</span><input
                        className={`${inputClass} ${!selectedSprite?.size ? 'text-red-500' : ''}`}
                        readOnly
                        value={selectedSprite?.size?.width ?? spriteSize.width}
                        title={selectedSprite?.size ? 'Auto-derived from sprite asset' : 'Sprite asset not found — value from JSON'}
                      />
                      <span>Height:</span><input
                        className={`${inputClass} ${!selectedSprite?.size ? 'text-red-500' : ''}`}
                        readOnly
                        value={selectedSprite?.size?.height ?? spriteSize.height}
                        title={selectedSprite?.size ? 'Auto-derived from sprite asset' : 'Sprite asset not found — value from JSON'}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-[96px_1fr] items-center gap-2 text-xs">
                    <span>Collision Box:</span>
                    <div className="grid grid-cols-8 items-center gap-2">
                      <span>Left</span><SmallNumber value={body.x} onChange={value => updateBodyHitbox({ x: value })} />
                      <span>Top</span><SmallNumber value={body.y} onChange={value => updateBodyHitbox({ y: value })} />
                      <span>Width</span><SmallNumber value={body.w} onChange={value => updateBodyHitbox({ w: value })} />
                      <span>Height</span><SmallNumber value={body.h} onChange={value => updateBodyHitbox({ h: value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-[96px_1fr] items-center gap-2 text-xs">
                    <span>Attack Box:</span>
                    <div className="grid grid-cols-[120px_repeat(8,minmax(0,1fr))] items-center gap-2">
                      <select
                        className={selectClass}
                        value={selectedAttackFacing}
                        onChange={event => setSelectedAttackFacing(event.target.value as PlayerAttackFacing)}
                        title="Attack box orientation"
                      >
                        {PLAYER_ATTACK_FACING_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <span>Left</span><SmallNumber value={selectedAttackHitbox.x} onChange={value => updateAttackHitboxForFacing({ x: value })} />
                      <span>Top</span><SmallNumber value={selectedAttackHitbox.y} onChange={value => updateAttackHitboxForFacing({ y: value })} />
                      <span>Width</span><SmallNumber value={selectedAttackHitbox.w} onChange={value => updateAttackHitboxForFacing({ w: value })} />
                      <span>Height</span><SmallNumber value={selectedAttackHitbox.h} onChange={value => updateAttackHitboxForFacing({ h: value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-[96px_1fr] gap-2 text-xs">
                    <span className="pt-2 text-slate-300">Hitbox View:</span>
                    <PlayerSpriteHitboxPreview
                      sprite={selectedSprite}
                      frameWidth={spriteSize.width}
                      frameHeight={spriteSize.height}
                      hitbox={body}
                      attackHitbox={selectedAttackHitbox}
                      attackHitboxes={attackByFacing}
                      title="Sprite & Hitboxes"
                      className="min-h-[250px]"
                    />
                  </div>
                </div>
              </section>

              <section className={`${panelClass} ${activeSection === 'Physics & Movement' ? 'absolute inset-0' : 'hidden'}`}>
                <div className={panelTitleClass}>Physics & Movement</div>
                <div className="grid min-h-0 flex-1 grid-cols-[minmax(260px,1fr)_minmax(220px,280px)] gap-3 overflow-hidden p-3">
                  <div className="min-h-0 space-y-2 overflow-auto pr-1">
                    <Field label="Max Speed" suffix="px/frame"><SmallNumber step={0.01} value={numberValue(normalized.movement.moveSpeed, 2)} onChange={value => updateMovement({ moveSpeed: value })} /></Field>
                    <Field label="Acceleration"><SmallNumber step={0.01} value={numberValue(normalized.movement.acceleration, 0.2)} onChange={value => updateMovement({ acceleration: value })} /></Field>
                    <Field label="Friction"><SmallNumber step={0.01} value={numberValue(normalized.movement.deceleration, 0.15)} onChange={value => updateMovement({ deceleration: value })} /></Field>
                    <Field label="Jump Speed"><SmallNumber step={0.01} value={-Math.abs(numberValue(normalized.movement.jumpPower, 3.5))} onChange={value => updateMovement({ jumpPower: Math.abs(value) })} /></Field>
                    <Field label="Gravity"><SmallNumber step={0.01} value={numberValue(normalized.movement.gravity, 0.12)} onChange={value => updateMovement({ gravity: value })} /></Field>
                    <Field label="Max Fall Speed"><SmallNumber step={0.01} value={numberValue(normalized.movement.maxFallSpeed, 3)} onChange={value => updateMovement({ maxFallSpeed: value })} /></Field>
                    <Field label="Air Control"><SmallNumber step={0.01} value={normalized.movement.airControl ? 0.3 : 0} onChange={value => updateMovement({ airControl: value > 0 })} /></Field>
                    <Field label="Step Height" suffix="px"><SmallNumber value={6} onChange={() => undefined} /></Field>
                    <Field label="Ladder Speed"><SmallNumber step={0.01} value={1.2} onChange={() => undefined} /></Field>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Checkbox label="Can Crouch" checked={false} onChange={() => undefined} />
                      <Checkbox label="Can Climb Ladders" checked={true} onChange={() => undefined} />
                    </div>
                  </div>
                  <PlayerSpriteHitboxPreview
                    sprite={selectedSprite}
                    frameWidth={spriteSize.width}
                    frameHeight={spriteSize.height}
                    hitbox={body}
                    attackHitbox={selectedAttackHitbox}
                    attackHitboxes={attackByFacing}
                  />
                </div>
              </section>
            </div>

            <div className="grid min-h-0 grid-cols-[1.15fr_0.72fr_0.78fr] gap-2">
              <section className={`${panelClass} ${activeSection === 'Graphics & Render' ? 'absolute inset-0' : 'hidden'}`}>
                <div className={panelTitleClass}>Graphics & Render</div>
                <div className="min-h-0 flex-1 overflow-hidden p-3">
                  <div className="min-h-0 space-y-2 overflow-hidden">
                    <Field label="Default Sprite Set">
                      <select className={selectClass} value={normalized.render.spriteAssetId || ''} onChange={event => selectDefaultSpriteAsset(event.target.value || undefined)}>
                        <option value="">(none)</option>
                        {spriteAssets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                      </select>
                    </Field>
                    <Field label="Color Palette">
                      <select className={selectClass} value={normalized.render.paletteAssetId || ''} onChange={event => updateRender({ paletteAssetId: event.target.value || undefined })}>
                        <option value="">default_player.pal</option>
                        {paletteAssets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                      </select>
                    </Field>
                    <div className="max-h-[150px] overflow-auto rounded border border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-[#151b25] text-slate-200">
                          <tr><th className="px-2 py-1">ID</th><th>Role</th><th>State</th><th>Assigned Render</th><th>Render Frames</th></tr>
                        </thead>
                        <tbody>
                          {animationRows.map(row => (
                            <tr
                              key={row.key}
                              className={`cursor-pointer border-t border-slate-800 ${selectedKey === row.key ? 'bg-blue-900/40' : 'hover:bg-slate-800/60'}`}
                              onClick={() => setSelectedAnimationKey(row.key)}
                            >
                              <td className="px-2 py-1">{row.id}</td>
                              <td>{row.animation}</td>
                              <td className="max-w-[96px] truncate text-slate-300" title={row.stateMachineState || 'Unlinked'}>{row.stateMachineStateLabel || '-'}</td>
                              <td className="max-w-[96px] truncate" title={row.render}>{row.render}</td>
                              <td>{row.renderFrames || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {selectedAnimation && selectedKey && (
                      <div className="space-y-2 rounded border border-slate-700 bg-[#151b25] p-2">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-sky-300">Assign Render</div>
                        <Field label="Role">
                          <input className={inputClass} readOnly value={labelForAnimationRole(selectedAnimation)} />
                        </Field>
                        <Field label="Render">
                          <select
                            className={selectClass}
                            value={selectedAnimation.spriteAssetId || ''}
                            onChange={event => updateSelectedAnimationRender(event.target.value || undefined)}
                          >
                            <option value="">Use default sprite set</option>
                            {spriteAssets.map(asset => (
                              <option key={asset.id} value={asset.id}>{asset.name}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="State">
                          <select
                            className={selectClass}
                            value={selectedAnimation.stateMachineState || ''}
                            onChange={event => updateSelectedAnimationState(event.target.value || undefined)}
                          >
                            <option value="">Unlinked (declarative only)</option>
                            {stateMachineStateOptions.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="New State">
                          <div className="grid grid-cols-[1fr_auto] gap-2">
                            <input
                              className={inputClass}
                              value={newStateName}
                              placeholder="Attacking"
                              onChange={event => setNewStateName(event.target.value)}
                              onKeyDown={event => {
                                if (event.key === 'Enter') {
                                  event.preventDefault();
                                  addPlayerStateMachineState();
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="rounded border border-slate-600 bg-[#242c38] px-3 py-1 text-xs font-semibold text-slate-100 hover:bg-[#2d3747] disabled:cursor-not-allowed disabled:opacity-50"
                              onClick={addPlayerStateMachineState}
                              disabled={!onUpsertStateMachineAsset || !newStateName.trim()}
                              title={`Add a State to ${targetPlayerStateMachineAssetName}`}
                            >
                              Add State
                            </button>
                          </div>
                        </Field>
                        <div className="text-[11px] text-slate-400">
                          Internal key: {selectedKey}
                          {' · '}
                          Render: {labelForSpriteAsset(resolveAnimationSpriteAssetId(selectedAnimation))}
                          {selectedAnimationSprite
                            ? ` (${selectedAnimationTiming.frameIndices.length} anim frames @ ${selectedAnimationTiming.speedFrames}f)`
                            : ''}
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            className="rounded border border-sky-700 bg-sky-900/50 px-3 py-1.5 text-xs font-semibold text-sky-100 hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={createOrUpdatePlayerStateMachine}
                            disabled={!onUpsertStateMachineAsset || !animationRows.some(row => row.stateMachineState)}
                            title={`Create or update ${targetPlayerStateMachineAssetName} from explicitly linked State rows`}
                          >
                            Create/Update {targetPlayerStateMachineAssetName}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className={`${panelClass} ${activeSection === 'Controls' ? 'absolute inset-0' : 'hidden'}`}>
                <div className={panelTitleClass}>Controls</div>
                <div className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
                  <p className="text-[11px] text-slate-400">
                    Directions use Arrows or Joystick 1/2. Buttons A and B map to any MSX key or joystick trigger.
                  </p>
                  {controlRows.map(({ directionKey, badge, key, binding, fallback }) => {
                    const enabled = normalized.inputEnabled?.[key] !== false;
                    const value = normalized.inputMapping[key] || fallback;
                    const options = binding === 'button' ? MSX2_PLAYER_BUTTON_BINDINGS : MSX2_PLAYER_INPUT_SOURCES;
                    return (
                      <div key={key}>
                        <ControlField
                          directionKey={directionKey}
                          badge={badge}
                          enabled={enabled}
                          onEnabledChange={checked => updateInputEnabled(key, checked)}
                          value={value}
                          onValueChange={nextValue => onUpdate({ inputMapping: { ...normalized.inputMapping, [key]: nextValue } })}
                          options={options}
                        />
                      </div>
                    );
                  })}
                  <div className="border-t border-slate-800 pt-2">
                    <p className="mb-2 text-[11px] text-slate-400">
                      Function keys keep their MSX key (F1-F5). Pick a preset or choose Custom to type your own action.
                    </p>
                    {functionKeyRows.map(keyId => {
                      const enabled = normalized.inputEnabled?.[keyId] === true;
                      const action = (normalized.inputMapping[keyId] as Msx2PlayerFunctionKeyAction) || 'none';
                      const customLabel = normalized.functionKeyCustomActions?.[keyId] || '';
                      return (
                        <FunctionKeyField
                          key={keyId}
                          keyId={keyId}
                          enabled={enabled}
                          action={action}
                          customLabel={customLabel}
                          onEnabledChange={checked => updateInputEnabled(keyId, checked)}
                          onActionChange={value => onUpdate({
                            inputMapping: { ...normalized.inputMapping, [keyId]: value },
                            ...(value === 'custom'
                              ? { functionKeyCustomActions: { ...normalized.functionKeyCustomActions, [keyId]: customLabel } }
                              : {}),
                          })}
                          onCustomLabelChange={label => onUpdate({
                            inputMapping: { ...normalized.inputMapping, [keyId]: 'custom' },
                            functionKeyCustomActions: { ...normalized.functionKeyCustomActions, [keyId]: label },
                          })}
                        />
                      );
                    })}
                  </div>
                  <div className="border-t border-slate-800 pt-2 mt-2">
                    <p className="mb-2 text-[11px] text-slate-400">
                      Skill button bindings. Primary is always required; set secondary to None for single-button activation.
                    </p>
                    {(() => {
                      const CONTROL_OPTIONS = [
                        { value: 'left', label: '←' },
                        { value: 'right', label: '→' },
                        { value: 'up', label: '↑' },
                        { value: 'down', label: '↓' },
                        { value: 'jump', label: 'A' },
                        { value: 'attack', label: 'B' },
                      ];
                      const CONTROL_OPTIONS_WITH_NONE = [
                        { value: 'none', label: 'None' },
                        ...CONTROL_OPTIONS,
                      ];
                      const skillBindings = normalized.skillBindings ?? {};
                      const activeIds = new Set(normalized.activeSkills ?? []);
                      const bindableSkills = skillsForBackend.filter(s => s.controlIcon && !s.required && activeIds.has(s.id));
                      const resolveBinding = (skillId: string): { primary: string; secondary: string } => {
                        const override = skillBindings[skillId];
                        if (override) return { primary: override.primary, secondary: override.secondary ?? 'none' };
                        const def = getAllSkills().find(s => s.id === skillId);
                        if (!def || !def.controlIcon) return { primary: 'attack', secondary: 'none' };
                        const icons = Array.isArray(def.controlIcon) ? def.controlIcon : [def.controlIcon];
                        return { primary: icons[0] || 'attack', secondary: icons[1] || 'none' };
                      };
                      const updateBinding = (skillId: string, field: 'primary' | 'secondary', value: string) => {
                        const current = resolveBinding(skillId);
                        const next: Record<string, any> = { ...current, [field]: value === 'none' && field === 'secondary' ? 'none' : value };
                        if (field === 'secondary' && value === 'none') delete next.secondary;
                        onUpdate({
                          skillBindings: {
                            ...skillBindings,
                            [skillId]: { primary: next.primary, ...(next.secondary && next.secondary !== 'none' ? { secondary: next.secondary } : {}) },
                          },
                        });
                      };
                      return (
                        <div className="space-y-1">
                          {bindableSkills.map(skill => {
                            const binding = resolveBinding(skill.id);
                            return (
                              <div key={skill.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 text-xs">
                                <span className="text-slate-200 truncate">{skill.label}</span>
                                <select
                                  className="w-12 rounded border border-slate-700 bg-[#1e2632] px-1 py-0.5 text-center text-xs"
                                  value={binding.primary}
                                  onChange={e => updateBinding(skill.id, 'primary', e.target.value)}
                                >
                                  {CONTROL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                                <span className="text-slate-500">+</span>
                                <select
                                  className="w-12 rounded border border-slate-700 bg-[#1e2632] px-1 py-0.5 text-center text-xs"
                                  value={binding.secondary}
                                  onChange={e => updateBinding(skill.id, 'secondary', e.target.value)}
                                >
                                  {CONTROL_OPTIONS_WITH_NONE.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </section>

              <section className={`${panelClass} ${activeSection === 'Combat & Damage' ? 'absolute inset-0' : 'hidden'}`}>
                <div className={panelTitleClass}>Combat & Damage</div>
                <div className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
                  <Field label="Attack Power"><SmallNumber value={normalized.attack.damage} onChange={value => updateAttack({ damage: value })} /></Field>
                  <Field label="Attack Type">
                    <select className={selectClass} value={normalized.attack.type} onChange={event => updateAttack({ type: event.target.value as Msx2PlayerDefinition['attack']['type'] })}>
                      <option value="none">None</option><option value="melee">Melee</option><option value="projectile">Projectile</option><option value="whip">Whip</option><option value="swordArc">Sword Arc</option><option value="shot">Shot</option><option value="bomb">Bomb</option>
                    </select>
                  </Field>
                  <p className="rounded border border-slate-700 bg-[#151b25] px-3 py-2 text-[11px] text-slate-400">
                    Directional Attack Boxes are edited in General and stored as JSON metadata for future ASM attack routines.
                  </p>
                  <Field label="I-Time" suffix="frames"><SmallNumber value={normalized.health.invulnerabilityFrames} onChange={value => updateHealth({ invulnerabilityFrames: value })} /></Field>
                  <Field label="Knockback"><SmallNumber step={0.01} value={numberValue(normalized.health.knockbackX, 1)} onChange={value => updateHealth({ knockbackX: value })} /></Field>
                  <Checkbox label="Can Take Damage" checked={true} onChange={() => undefined} />
                </div>
              </section>

              <section className={`${panelClass} ${activeSection === 'Weapons' ? 'absolute inset-0' : 'hidden'}`}>
                <div className={`${panelTitleClass} flex items-center justify-between gap-2`}>
                  <span>Weapons</span>
                  <span className="text-[10px] font-semibold normal-case tracking-normal text-slate-400">Declarative JSON only</span>
                </div>
                <div className="grid min-h-0 flex-1 grid-cols-[minmax(250px,0.72fr)_minmax(420px,1.28fr)] gap-3 overflow-hidden p-3">
                  <div className="flex min-h-0 flex-col rounded border border-slate-700 bg-[#151b25]">
                    <div className="flex items-center justify-between border-b border-slate-700 px-3 py-2">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wide text-sky-300">Arsenal</div>
                        <div className="text-[10px] text-slate-500">
                          {weapons.length} weapon{weapons.length === 1 ? '' : 's'} / {equippedWeaponId ? 'one equipped' : 'none equipped'}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="rounded border border-sky-600 bg-sky-900/40 px-2 py-1 text-[11px] font-semibold text-sky-100 hover:bg-sky-800/60"
                        onClick={addWeapon}
                      >
                        Add
                      </button>
                    </div>
                    <div className="min-h-0 flex-1 space-y-2 overflow-auto p-2">
                      {weapons.length === 0 ? (
                        <div className="rounded border border-dashed border-slate-600 bg-[#111821] p-4 text-center text-[11px] text-slate-400">
                          No weapons defined yet.
                        </div>
                      ) : weapons.map(weapon => {
                        const selected = selectedWeapon?.id === weapon.id;
                        const equipped = equippedWeaponId === weapon.id;
                        return (
                          <button
                            key={weapon.id}
                            type="button"
                            className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-2 rounded border px-2 py-2 text-left transition ${
                              selected
                                ? 'border-sky-500 bg-sky-950/45'
                                : 'border-slate-700 bg-[#111821] hover:border-slate-500 hover:bg-[#18202c]'
                            }`}
                            onClick={() => setSelectedWeaponId(weapon.id)}
                          >
                            <WeaponIcon type={weapon.type} selected={selected} />
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-semibold text-slate-100">{weapon.name || weapon.id}</span>
                              <span className="block truncate text-[10px] text-slate-400">
                                {weapon.type} / Button {weapon.button.toUpperCase()} / {weapon.state || 'No state'}
                              </span>
                            </span>
                            <span className={`rounded border px-1.5 py-0.5 text-[10px] ${equipped ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200' : 'border-slate-700 text-slate-500'}`}>
                              {equipped ? 'Equipped' : 'Stored'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-4 gap-2 border-t border-slate-700 p-2">
                      <button type="button" className="rounded border border-slate-700 bg-[#202938] px-2 py-1 text-[11px] text-slate-200 hover:bg-[#2b3545]" onClick={duplicateSelectedWeapon} disabled={!selectedWeapon}>
                        Duplicate
                      </button>
                      <button type="button" className="rounded border border-emerald-700 bg-emerald-950/30 px-2 py-1 text-[11px] text-emerald-200 hover:bg-emerald-900/40" onClick={() => selectedWeapon && updateWeapons(weapons, selectedWeapon.id)} disabled={!selectedWeapon}>
                        Equip
                      </button>
                      <button type="button" className="rounded border border-slate-600 bg-[#111821] px-2 py-1 text-[11px] text-slate-200 hover:bg-[#202938]" onClick={() => updateWeapons(weapons, '')} disabled={!equippedWeaponId}>
                        Unequip
                      </button>
                      <button type="button" className="rounded border border-red-900/80 bg-red-950/30 px-2 py-1 text-[11px] text-red-200 hover:bg-red-900/40" onClick={removeSelectedWeapon} disabled={!selectedWeapon}>
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="min-h-0 overflow-auto rounded border border-slate-700 bg-[#151b25]">
                    {selectedWeapon ? (
                      <div className="space-y-3 p-3">
                        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded border border-slate-700 bg-[#111821] p-3">
                          <WeaponIcon type={selectedWeapon.type} selected />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-100">{selectedWeapon.name || selectedWeapon.id}</div>
                            <div className="text-[11px] text-slate-400">
                              Runtime link: {selectedWeapon.hitboxSource === 'attackByFacing' ? 'Directional Attack Box' : selectedWeapon.hitboxSource}
                            </div>
                          </div>
                          <ActionButtonBadge letter={selectedWeapon.button.toUpperCase() as 'A' | 'B'} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded border border-slate-700 bg-[#111821] p-3">
                            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-sky-300">Identity</div>
                            <div className="space-y-2">
                              <Field label="Name"><input className={inputClass} value={selectedWeapon.name} onChange={event => updateSelectedWeapon({ name: event.target.value })} /></Field>
                              <Field label="ID">
                                <input
                                  className={inputClass}
                                  value={selectedWeapon.id}
                                  onChange={event => updateSelectedWeapon({ id: event.target.value })}
                                  onBlur={event => renameSelectedWeaponId(event.target.value)}
                                />
                              </Field>
                              <Field label="Type">
                                <select className={selectClass} value={selectedWeapon.type} onChange={event => updateSelectedWeapon({ type: event.target.value as PlayerWeaponType })}>
                                  {PLAYER_WEAPON_TYPE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                              </Field>
                              <Field label="Availability">
                                <select className={selectClass} value={selectedWeapon.availability || 'owned'} onChange={event => updateSelectedWeapon({ availability: event.target.value as PlayerWeaponAvailability })}>
                                  {PLAYER_WEAPON_AVAILABILITY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                              </Field>
                              <Field label="Pickup Item">
                                <input
                                  className={inputClass}
                                  value={selectedWeapon.pickupItemId || ''}
                                  onChange={event => updateSelectedWeapon({ pickupItemId: event.target.value || undefined })}
                                  placeholder="msx2_inventory itemId"
                                />
                              </Field>
                            </div>
                          </div>

                          <div className="rounded border border-slate-700 bg-[#111821] p-3">
                            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-sky-300">Input & State</div>
                            <div className="space-y-2">
                              <Field label="Button">
                                <select className={selectClass} value={selectedWeapon.button} onChange={event => updateSelectedWeapon({ button: event.target.value as PlayerWeaponButton })}>
                                  {PLAYER_WEAPON_BUTTON_OPTIONS.map(option => <option key={option.value} value={option.value}>Button {option.label}</option>)}
                                </select>
                              </Field>
                              <Field label="State">
                                <select className={selectClass} value={selectedWeapon.state || ''} onChange={event => updateSelectedWeapon({ state: event.target.value || undefined })}>
                                  <option value="">Unlinked</option>
                                  {weaponStateOptions.map(stateName => <option key={stateName} value={stateName}>{stateName}</option>)}
                                </select>
                              </Field>
                              <Field label="Anim Role">
                                <select className={selectClass} value={selectedWeapon.animationRole || ''} onChange={event => updateSelectedWeapon({ animationRole: (event.target.value || undefined) as PlayerWeaponDefinition['animationRole'] })}>
                                  <option value="">Unlinked</option>
                                  {weaponAnimationRoles.map(role => <option key={role} value={role}>{labelForAnimationRole(role as any)}</option>)}
                                </select>
                              </Field>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-[0.9fr_1.1fr] gap-3">
                          <div className="rounded border border-slate-700 bg-[#111821] p-3">
                            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-sky-300">Timing</div>
                            <div className="grid grid-cols-2 gap-2">
                              <Field label="Damage"><SmallNumber value={selectedWeapon.damage} onChange={value => updateSelectedWeapon({ damage: value })} /></Field>
                              <Field label="Cooldown" suffix="frames"><SmallNumber value={selectedWeapon.cooldownFrames} onChange={value => updateSelectedWeapon({ cooldownFrames: value })} /></Field>
                              <Field label="Active Start" suffix="frame"><SmallNumber value={selectedWeapon.activeFrames.start} onChange={value => updateSelectedWeapon({ activeFrames: { start: value, end: selectedWeapon.activeFrames.end } })} /></Field>
                              <Field label="Active End" suffix="frame"><SmallNumber value={selectedWeapon.activeFrames.end} onChange={value => updateSelectedWeapon({ activeFrames: { start: selectedWeapon.activeFrames.start, end: value } })} /></Field>
                            </div>
                          </div>

                          <div className="rounded border border-slate-700 bg-[#111821] p-3">
                            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-sky-300">Runtime Link</div>
                            <div className="space-y-2">
                              <Field label="Hitbox">
                                <select className={selectClass} value={selectedWeapon.hitboxSource} onChange={event => updateSelectedWeapon({ hitboxSource: event.target.value as PlayerWeaponHitboxSource })}>
                                  {PLAYER_WEAPON_HITBOX_SOURCE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                              </Field>
                              <Field label="Projectile Asset">
                                <button
                                  type="button"
                                  className={`${inputClass} text-left`}
                                  onClick={() => setIsBulletConfigOpen(true)}
                                  title="Configure bullet visual (sprite or char)"
                                >
                                  {selectedWeapon.bulletVisual
                                    ? selectedWeapon.bulletVisual.kind === 'sprite'
                                      ? (selectedWeapon.bulletVisual.spriteAssetId ? `Sprite: ${selectedWeapon.bulletVisual.spriteAssetId}` : 'Sprite: (none)')
                                      : `Char: ${selectedWeapon.bulletVisual.charCode ?? 0}`
                                    : (selectedWeapon.projectileAssetId ? `Legacy: ${selectedWeapon.projectileAssetId}` : 'Configure...')}
                                </button>
                              </Field>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded border border-slate-700 bg-[#111821] p-3">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <div className="text-[11px] font-bold uppercase tracking-wide text-sky-300">Ammo</div>
                              <label className="flex items-center gap-1 text-[10px] text-slate-300">
                                <input
                                  type="checkbox"
                                  className="h-3.5 w-3.5 accent-blue-500"
                                  checked={selectedWeapon.ammo?.enabled || false}
                                  onChange={event => updateSelectedWeapon({
                                    ammo: {
                                      enabled: event.target.checked,
                                      initial: selectedWeapon.ammo?.initial || 0,
                                      max: selectedWeapon.ammo?.max || 0,
                                      consumePerUse: selectedWeapon.ammo?.consumePerUse || 1,
                                      refillItemId: selectedWeapon.ammo?.refillItemId,
                                      refillAmount: selectedWeapon.ammo?.refillAmount || 0,
                                      emptyBehavior: selectedWeapon.ammo?.emptyBehavior || 'block',
                                      emptyState: selectedWeapon.ammo?.emptyState,
                                    },
                                  })}
                                />
                                Enabled
                              </label>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Field label="Initial"><SmallNumber value={selectedWeapon.ammo?.initial || 0} onChange={value => updateSelectedWeapon({ ammo: { enabled: selectedWeapon.ammo?.enabled || false, initial: value, max: selectedWeapon.ammo?.max || 0, consumePerUse: selectedWeapon.ammo?.consumePerUse || 1, refillItemId: selectedWeapon.ammo?.refillItemId, refillAmount: selectedWeapon.ammo?.refillAmount || 0, emptyBehavior: selectedWeapon.ammo?.emptyBehavior || 'block', emptyState: selectedWeapon.ammo?.emptyState } })} /></Field>
                              <Field label="Max"><SmallNumber value={selectedWeapon.ammo?.max || 0} onChange={value => updateSelectedWeapon({ ammo: { enabled: selectedWeapon.ammo?.enabled || false, initial: selectedWeapon.ammo?.initial || 0, max: value, consumePerUse: selectedWeapon.ammo?.consumePerUse || 1, refillItemId: selectedWeapon.ammo?.refillItemId, refillAmount: selectedWeapon.ammo?.refillAmount || 0, emptyBehavior: selectedWeapon.ammo?.emptyBehavior || 'block', emptyState: selectedWeapon.ammo?.emptyState } })} /></Field>
                              <Field label="Per Use"><SmallNumber value={selectedWeapon.ammo?.consumePerUse || 0} onChange={value => updateSelectedWeapon({ ammo: { enabled: selectedWeapon.ammo?.enabled || false, initial: selectedWeapon.ammo?.initial || 0, max: selectedWeapon.ammo?.max || 0, consumePerUse: value, refillItemId: selectedWeapon.ammo?.refillItemId, refillAmount: selectedWeapon.ammo?.refillAmount || 0, emptyBehavior: selectedWeapon.ammo?.emptyBehavior || 'block', emptyState: selectedWeapon.ammo?.emptyState } })} /></Field>
                              <Field label="Refill Amt"><SmallNumber value={selectedWeapon.ammo?.refillAmount || 0} onChange={value => updateSelectedWeapon({ ammo: { enabled: selectedWeapon.ammo?.enabled || false, initial: selectedWeapon.ammo?.initial || 0, max: selectedWeapon.ammo?.max || 0, consumePerUse: selectedWeapon.ammo?.consumePerUse || 1, refillItemId: selectedWeapon.ammo?.refillItemId, refillAmount: value, emptyBehavior: selectedWeapon.ammo?.emptyBehavior || 'block', emptyState: selectedWeapon.ammo?.emptyState } })} /></Field>
                              <Field label="Refill Item"><input className={inputClass} value={selectedWeapon.ammo?.refillItemId || ''} onChange={event => updateSelectedWeapon({ ammo: { enabled: selectedWeapon.ammo?.enabled || false, initial: selectedWeapon.ammo?.initial || 0, max: selectedWeapon.ammo?.max || 0, consumePerUse: selectedWeapon.ammo?.consumePerUse || 1, refillItemId: event.target.value || undefined, refillAmount: selectedWeapon.ammo?.refillAmount || 0, emptyBehavior: selectedWeapon.ammo?.emptyBehavior || 'block', emptyState: selectedWeapon.ammo?.emptyState } })} /></Field>
                              <Field label="On Empty">
                                <select className={selectClass} value={selectedWeapon.ammo?.emptyBehavior || 'block'} onChange={event => updateSelectedWeapon({ ammo: { enabled: selectedWeapon.ammo?.enabled || false, initial: selectedWeapon.ammo?.initial || 0, max: selectedWeapon.ammo?.max || 0, consumePerUse: selectedWeapon.ammo?.consumePerUse || 1, refillItemId: selectedWeapon.ammo?.refillItemId, refillAmount: selectedWeapon.ammo?.refillAmount || 0, emptyBehavior: event.target.value as PlayerWeaponEmptyBehavior, emptyState: selectedWeapon.ammo?.emptyState } })}>
                                  {PLAYER_WEAPON_EMPTY_BEHAVIOR_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                              </Field>
                            </div>
                          </div>

                          <div className="rounded border border-slate-700 bg-[#111821] p-3">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <div className="text-[11px] font-bold uppercase tracking-wide text-sky-300">Durability</div>
                              <label className="flex items-center gap-1 text-[10px] text-slate-300">
                                <input
                                  type="checkbox"
                                  className="h-3.5 w-3.5 accent-blue-500"
                                  checked={selectedWeapon.durability?.enabled || false}
                                  onChange={event => updateSelectedWeapon({
                                    durability: {
                                      enabled: event.target.checked,
                                      initial: selectedWeapon.durability?.initial || 0,
                                      max: selectedWeapon.durability?.max || 0,
                                      consumePerUse: selectedWeapon.durability?.consumePerUse || 1,
                                      repairItemId: selectedWeapon.durability?.repairItemId,
                                      repairAmount: selectedWeapon.durability?.repairAmount || 0,
                                      breakBehavior: selectedWeapon.durability?.breakBehavior || 'unequip',
                                      brokenState: selectedWeapon.durability?.brokenState,
                                    },
                                  })}
                                />
                                Enabled
                              </label>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Field label="Initial"><SmallNumber value={selectedWeapon.durability?.initial || 0} onChange={value => updateSelectedWeapon({ durability: { enabled: selectedWeapon.durability?.enabled || false, initial: value, max: selectedWeapon.durability?.max || 0, consumePerUse: selectedWeapon.durability?.consumePerUse || 1, repairItemId: selectedWeapon.durability?.repairItemId, repairAmount: selectedWeapon.durability?.repairAmount || 0, breakBehavior: selectedWeapon.durability?.breakBehavior || 'unequip', brokenState: selectedWeapon.durability?.brokenState } })} /></Field>
                              <Field label="Max"><SmallNumber value={selectedWeapon.durability?.max || 0} onChange={value => updateSelectedWeapon({ durability: { enabled: selectedWeapon.durability?.enabled || false, initial: selectedWeapon.durability?.initial || 0, max: value, consumePerUse: selectedWeapon.durability?.consumePerUse || 1, repairItemId: selectedWeapon.durability?.repairItemId, repairAmount: selectedWeapon.durability?.repairAmount || 0, breakBehavior: selectedWeapon.durability?.breakBehavior || 'unequip', brokenState: selectedWeapon.durability?.brokenState } })} /></Field>
                              <Field label="Per Use"><SmallNumber value={selectedWeapon.durability?.consumePerUse || 0} onChange={value => updateSelectedWeapon({ durability: { enabled: selectedWeapon.durability?.enabled || false, initial: selectedWeapon.durability?.initial || 0, max: selectedWeapon.durability?.max || 0, consumePerUse: value, repairItemId: selectedWeapon.durability?.repairItemId, repairAmount: selectedWeapon.durability?.repairAmount || 0, breakBehavior: selectedWeapon.durability?.breakBehavior || 'unequip', brokenState: selectedWeapon.durability?.brokenState } })} /></Field>
                              <Field label="Repair Amt"><SmallNumber value={selectedWeapon.durability?.repairAmount || 0} onChange={value => updateSelectedWeapon({ durability: { enabled: selectedWeapon.durability?.enabled || false, initial: selectedWeapon.durability?.initial || 0, max: selectedWeapon.durability?.max || 0, consumePerUse: selectedWeapon.durability?.consumePerUse || 1, repairItemId: selectedWeapon.durability?.repairItemId, repairAmount: value, breakBehavior: selectedWeapon.durability?.breakBehavior || 'unequip', brokenState: selectedWeapon.durability?.brokenState } })} /></Field>
                              <Field label="Repair Item"><input className={inputClass} value={selectedWeapon.durability?.repairItemId || ''} onChange={event => updateSelectedWeapon({ durability: { enabled: selectedWeapon.durability?.enabled || false, initial: selectedWeapon.durability?.initial || 0, max: selectedWeapon.durability?.max || 0, consumePerUse: selectedWeapon.durability?.consumePerUse || 1, repairItemId: event.target.value || undefined, repairAmount: selectedWeapon.durability?.repairAmount || 0, breakBehavior: selectedWeapon.durability?.breakBehavior || 'unequip', brokenState: selectedWeapon.durability?.brokenState } })} /></Field>
                              <Field label="On Break">
                                <select className={selectClass} value={selectedWeapon.durability?.breakBehavior || 'unequip'} onChange={event => updateSelectedWeapon({ durability: { enabled: selectedWeapon.durability?.enabled || false, initial: selectedWeapon.durability?.initial || 0, max: selectedWeapon.durability?.max || 0, consumePerUse: selectedWeapon.durability?.consumePerUse || 1, repairItemId: selectedWeapon.durability?.repairItemId, repairAmount: selectedWeapon.durability?.repairAmount || 0, breakBehavior: event.target.value as PlayerWeaponBreakBehavior, brokenState: selectedWeapon.durability?.brokenState } })}>
                                  {PLAYER_WEAPON_BREAK_BEHAVIOR_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                              </Field>
                            </div>
                          </div>
                        </div>

                        <div className="rounded border border-slate-700 bg-[#111821] p-3">
                          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-sky-300">Notes</div>
                          <textarea
                            className="min-h-[70px] w-full resize-none rounded border border-slate-700 bg-[#0f141c] px-2 py-2 text-xs text-slate-100 outline-none focus:border-blue-500"
                            value={selectedWeapon.notes || ''}
                            onChange={event => updateSelectedWeapon({ notes: event.target.value })}
                          />
                          <div className="mt-2 grid grid-cols-4 gap-2 text-[10px] text-slate-400">
                            <div className="rounded border border-slate-700 bg-[#151b25] px-2 py-1">Button: {selectedWeapon.button.toUpperCase()}</div>
                            <div className="rounded border border-slate-700 bg-[#151b25] px-2 py-1">State: {selectedWeapon.state || '-'}</div>
                            <div className="rounded border border-slate-700 bg-[#151b25] px-2 py-1">Active: {selectedWeapon.activeFrames.start}-{selectedWeapon.activeFrames.end}</div>
                            <div className="rounded border border-slate-700 bg-[#151b25] px-2 py-1">Stock: {selectedWeapon.availability || 'owned'}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full min-h-[260px] items-center justify-center p-6">
                        <div className="max-w-sm rounded border border-dashed border-slate-600 bg-[#111821] p-5 text-center">
                          <div className="mb-3 flex justify-center"><WeaponIcon type="melee" /></div>
                          <div className="text-sm font-semibold text-slate-100">No weapon selected</div>
                          <div className="mt-1 text-[11px] text-slate-400">Create a weapon to link attack input, state, animation role and hitbox metadata.</div>
                          <button
                            type="button"
                            className="mt-4 rounded border border-sky-600 bg-sky-900/40 px-3 py-1.5 text-xs font-semibold text-sky-100 hover:bg-sky-800/60"
                            onClick={addWeapon}
                          >
                            Add Weapon
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            <div className="grid min-h-0 grid-cols-[0.8fr_0.9fr_1fr_0.72fr] gap-2">
              <section className={`${panelClass} ${activeSection === 'Abilities & Items' ? 'absolute inset-0' : 'hidden'}`}>
                <div className={panelTitleClass}>Abilities & Items</div>
                <div className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
                  <div>
                    <p className="mb-2 text-[11px] font-semibold text-slate-300">Skill Parameters</p>
                    <p className="mb-2 text-[11px] text-slate-400">Click a skill to edit its parameters. Core skills (jump, gravity, air resistance, item collection) are always active.</p>
                    <div className="space-y-1">
                      {skillsForBackend.filter(s => s.parameters && s.parameters.length > 0).map(skill => {
                        const active = normalized.activeSkills?.includes(skill.id) ?? false;
                        const hasParameters = Boolean(skill.parameters && skill.parameters.length > 0);
                        const isCore = skill.required;
                        const canOpenDialog = (isCore || active) && hasParameters;
                        return (
                          <div key={skill.id} className="flex items-center gap-2 text-xs">
                            {!isCore && (
                              <input
                                type="checkbox"
                                checked={active}
                                onChange={e => {
                                  const current = normalized.activeSkills ?? [];
                                  const next = e.target.checked
                                    ? [...current, skill.id]
                                    : current.filter(id => id !== skill.id);
                                  onUpdate({ activeSkills: next });
                                }}
                                className="h-3.5 w-3.5 shrink-0 accent-blue-500"
                                title={active ? 'Disable skill' : 'Enable skill'}
                              />
                            )}
                            {isCore && <span className="h-3.5 w-3.5 shrink-0 rounded bg-slate-600" />}
                            {canOpenDialog ? (
                              <button
                                type="button"
                                onClick={() => setOpenSkillDialogId(skill.id)}
                                className="flex items-center gap-1 truncate rounded border border-transparent px-1 py-0.5 text-slate-200 hover:border-sky-700 hover:bg-sky-950/30 hover:text-sky-100"
                                title={`Edit ${skill.label} parameters`}
                                aria-haspopup="dialog"
                              >
                                {skill.label}
                                <span className="text-[10px] text-sky-400">⚙</span>
                              </button>
                            ) : (
                              <span className={`text-slate-200 ${hasParameters ? 'opacity-80' : ''}`}>
                                {skill.label}
                                {hasParameters && !isCore && <span className="ml-1 text-[10px] text-slate-500">(inactive)</span>}
                              </span>
                            )}
                            {isCore && (
                              <span className="ml-1 text-[10px] text-slate-500">core</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="border-t border-slate-800 pt-2">
                    <p className="mb-2 text-[11px] font-semibold text-slate-300">Inventory</p>
                    <Field label="Start Items"><input className={inputClass} value={(normalized.inventoryHooks || []).join(', ') || 'Sword, Shield'} onChange={event => onUpdate({ inventoryHooks: event.target.value.split(',').map(value => value.trim()).filter(Boolean) })} /></Field>
                    <Field label="Max Items"><SmallNumber value={6} onChange={() => undefined} /></Field>
                    <Checkbox
                      label="Can Use Items"
                      checked={normalized.logic?.canUseItems !== false}
                      onChange={checked => updateLogic({ canUseItems: checked })}
                    />
                    <Checkbox
                      label="Can Use Magic"
                      checked={normalized.logic?.canUseMagic !== false}
                      onChange={checked => updateLogic({ canUseMagic: checked })}
                    />
                  </div>
                </div>
              </section>
              <section className={`${panelClass} ${activeSection === 'States & Logic' ? 'absolute inset-0' : 'hidden'}`}>
                <div className={panelTitleClass}>States & Logic</div>
                <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3">
                  <Field label="State Machine">
                    <select
                      className={selectClass}
                      value={normalized.stateMachineAssetId || ''}
                      onChange={event => selectStateMachineAsset(event.target.value || undefined)}
                    >
                      <option value="">(none)</option>
                      {stateMachineAssets.map(asset => (
                        <option key={asset.id} value={asset.id}>{asset.name}</option>
                      ))}
                    </select>
                  </Field>
                  <div className="rounded border border-slate-700 bg-[#121820] p-3">
                    {selectedStateMachine ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-semibold text-slate-100">{selectedStateMachineAsset?.name || selectedStateMachine.name}</div>
                            <div className="text-[11px] text-slate-400">
                              Initial: {selectedStateMachine.initialStateId || '—'}
                              {' · '}
                              {selectedStateMachine.states.length} states
                              {' · '}
                              {selectedStateMachine.transitions.length} transitions
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {selectedStateMachine.states.map(state => (
                            <span
                              key={state.id}
                              className={`rounded border px-2 py-0.5 text-[10px] ${
                                state.id === selectedStateMachine.initialStateId
                                  ? 'border-sky-500 bg-sky-950/40 text-sky-200'
                                  : 'border-slate-700 bg-[#151b25] text-slate-300'
                              }`}
                            >
                              {state.name || state.id}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-[11px] text-slate-400">
                          Select a State Machine asset from the project, or use the built-in template states below.
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {normalized.stateMachine.map(stateName => (
                            <span key={stateName} className="rounded border border-slate-700 bg-[#151b25] px-2 py-0.5 text-[10px] text-slate-300">
                              {stateName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <Field label="Game Template">
                    <input className={inputClass} readOnly value={normalized.basedOnTemplate || 'platformer_basic'} />
                  </Field>
                  <div>
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-sky-300">Logic Flags</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Checkbox label="Is Player" checked={logic.isPlayer !== false} onChange={checked => updateLogic({ isPlayer: checked })} />
                      <Checkbox label="Blocks Projectiles" checked={logic.blocksProjectiles !== false} onChange={checked => updateLogic({ blocksProjectiles: checked })} />
                      <Checkbox label="Affects Enemies" checked={logic.affectsEnemies !== false} onChange={checked => updateLogic({ affectsEnemies: checked })} />
                      <Checkbox label="Pushable" checked={logic.pushable === true} onChange={checked => updateLogic({ pushable: checked })} />
                      <Checkbox label="Triggers Events" checked={logic.triggersEvents !== false} onChange={checked => updateLogic({ triggersEvents: checked })} />
                      <Checkbox label="Can Die" checked={logic.canDie !== false} onChange={checked => updateLogic({ canDie: checked })} />
                    </div>
                  </div>
                </div>
              </section>
              <section className={`${panelClass} ${activeSection === 'Spawn & Respawn' ? 'absolute inset-0' : 'hidden'}`}>
                <div className={panelTitleClass}>Spawn & Respawn</div>
                <div className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
                  <Field label="Respawn Mode"><select className={selectClass}><option>Last Checkpoint</option><option>Screen Entry</option><option>World Start</option></select></Field>
                  <Field label="Initial Spawn"><select className={selectClass}><option>World Start</option><option>Default Entry</option><option>Checkpoint</option></select></Field>
                  <Field label="Respawn I-Time" suffix="frames"><SmallNumber value={90} onChange={() => undefined} /></Field>
                  <Field label="Restore Health"><select className={selectClass}><option>Full</option><option>Half</option><option>Keep</option></select></Field>
                  <Checkbox label="Reset Enemies on Respawn" checked={true} onChange={() => undefined} />
                  <Checkbox label="Reset Screen Objects" checked={false} onChange={() => undefined} />
                </div>
              </section>
              <section className="hidden min-h-0 overflow-auto rounded border border-amber-300 bg-[#fff2b8] p-4 text-xs leading-relaxed text-slate-900">
                <div className="mb-2 font-bold uppercase">Info</div>
                <p>Define all properties of the player character here. The player can be selected from MSX2 screen player entries.</p>
                <p className="mt-3">Changes can be tested in the preview at any time.</p>
              </section>
            </div>
            <section className={`${panelClass} ${activeSection === 'Sounds' ? 'absolute inset-0' : 'hidden'}`}>
              <div className={panelTitleClass}>Sounds</div>
              <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-slate-400">
                    Link player events to animations and pick MSX2 PSG sound assets for each slot.
                  </p>
                  <button
                    type="button"
                    className="h-7 shrink-0 rounded border border-sky-700 bg-sky-950/40 px-3 text-xs text-sky-200 hover:bg-sky-900/50"
                    onClick={importSoundsFromAnimations}
                  >
                    Import from Animations
                  </button>
                </div>
                {MSX2_PLAYER_SOUND_SLOTS.map(slot => {
                  const triggerPreset = normalized.soundPresets?.[slot.id] || MSX2_PLAYER_SOUND_EVENT_DEFAULT;
                  const triggerCustom = normalized.soundCustomValues?.[slot.id] || '';
                  const soundAssetId = normalized.soundAssetIds?.[slot.id] || '';
                  const soundCustom = normalized.soundAssetCustomValues?.[slot.id] || '';
                  const enabled = normalized.soundsEnabled?.[slot.id] !== false;
                  return (
                    <SoundField
                      key={slot.id}
                      label={slot.label}
                      enabled={enabled}
                      triggerPreset={triggerPreset}
                      triggerCustom={triggerCustom}
                      soundAssetId={soundAssetId}
                      soundCustom={soundCustom}
                      animationOptions={soundAnimationOptions}
                      soundOptions={soundAssetOptions}
                      defaultSoundId={slot.defaultPreset}
                      onEnabledChange={checked => updateSoundSlot(slot.id, { enabled: checked })}
                      onTriggerPresetChange={value => updateSoundSlot(slot.id, { triggerPreset: value })}
                      onTriggerCustomChange={value => updateSoundSlot(slot.id, { triggerCustom: value, triggerPreset: 'custom' })}
                      onSoundAssetChange={value => updateSoundSlot(slot.id, { soundAssetId: value })}
                      onSoundCustomChange={value => updateSoundSlot(slot.id, { soundCustom: value, soundAssetId: MSX2_PLAYER_SOUND_CUSTOM_ASSET })}
                    />
                  );
                })}
              </div>
            </section>
            <section className={`${panelClass} ${activeSection === 'Preview' ? 'absolute inset-0' : 'hidden'}`}>
              <div className={panelTitleClass}>Preview</div>
              <div className="min-h-0 flex-1 overflow-auto p-4">
                <div className="relative h-full min-h-[360px] overflow-hidden rounded border border-slate-700 bg-[linear-gradient(45deg,#1a202b_25%,transparent_25%),linear-gradient(-45deg,#1a202b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1a202b_75%),linear-gradient(-45deg,transparent_75%,#1a202b_75%)] bg-[length:24px_24px] bg-[#141923]">
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-[linear-gradient(#48b548_0_35%,#7b5127_35%)]" />
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
                    <SpriteFramePreview
                      sprite={previewAnimationSprite}
                      frameIndex={previewAnimation.spriteFrameIndex}
                      large
                    />
                  </div>
                </div>
                <PlayerPreviewControls
                  playing={previewAnimation.playing}
                  onPlay={previewAnimation.play}
                  onStop={previewAnimation.stop}
                  selectedKey={selectedKey}
                  animationRows={animationRows}
                  onSelectAnimation={setSelectedAnimationKey}
                />
              </div>
            </section>
          </main>
        </div>
        {isComponentsDialogOpen && (
          <PlayerComponentsDialog
            components={normalized.components || {}}
            spriteAssets={spriteAssets}
            boxTileOptions={boxTileOptions}
            onPatchComponent={updateNativeComponent}
            onClose={() => setIsComponentsDialogOpen(false)}
          />
        )}
        {openSkillDialogId && (() => {
          const skill = (getAllSkills() as SkillDef[]).find(s => s.id === openSkillDialogId);
          if (!skill || !skill.parameters?.length) return null;
          const skillValues = normalized.skillParameters?.[skill.id] || {};
          return (
            <SkillParametersDialog
              skill={skill}
              values={skillValues}
              onPatch={(key, value) => updateSkillParameter(skill.id, key, value)}
              onClose={() => setOpenSkillDialogId(null)}
            />
          );
        })()}
        {isBulletConfigOpen && selectedWeapon && (
          <BulletConfigDialog
            weapon={selectedWeapon}
            spriteAssets={spriteAssets}
            allowCharMode={graphicsBackend !== 'msx2-screen4-bitmap-room'}
            onPatch={patch => updateSelectedWeapon(patch)}
            onClose={() => setIsBulletConfigOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
