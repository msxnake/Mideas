import React, { useMemo, useState } from 'react';
import {
  EnemyAttackType,
  EnemyBehaviorStateTransition,
  EnemyBehaviorType,
  EnemyCategory,
  EnemyDefinition,
  EnemyHitboxRect,
  EnemyLibraryScope,
  EnemyRenderRoleBinding,
  EnemyRenderMode,
  EnemySpriteSize,
  ProjectAsset,
  SpawnParamSchemaItem,
  SpawnParamSchemaType,
} from '../../types';
import { GLOBAL_ENEMY_TEMPLATES, createEnemyFromTemplate } from '../../data/enemyLibrary';
import { addEntryToMsx2EnemyLibrary } from '../../utils/msx2EnemyLibrary';

interface Msx2EnemyEditorProps {
  enemy: EnemyDefinition;
  onUpdate: (enemy: EnemyDefinition) => void;
  allAssets: ProjectAsset[];
  setStatusBarMessage?: (message: string) => void;
}

const navItems = [
  'General',
  'Graphics & Animations',
  'Behavior',
  'Combat & Hitboxes',
  'Spawn Params',
  'Sounds & Budget',
  'Preview',
] as const;

type EnemyConfigSection = typeof navItems[number];

const BEHAVIOR_OPTIONS: EnemyBehaviorType[] = ['None', 'PatrolHorizontal', 'WalkerTurnOnEdge', 'FlyerSine', 'BounceDiagonal', 'Jumper', 'HopperTowardsPlayer', 'ShooterStatic', 'TurretAim', 'ChaseHorizontal', 'SlimeCeiling', 'GearWheel', 'FlyBounce8', 'DropFromCeiling', 'EmergeFromGround', 'CustomBehavior'];
const ATTACK_OPTIONS: EnemyAttackType[] = ['None', 'DamageOnTouch', 'ShooterStatic', 'ProjectileEmitter', 'MeleeBox', 'ExplosionOnTouch'];
const CATEGORY_OPTIONS: EnemyCategory[] = ['simpleEnemy', 'boss', 'hazard', 'projectileLike'];
const SCOPE_OPTIONS: EnemyLibraryScope[] = ['common', 'perWorld', 'boss'];
const RENDER_MODE_OPTIONS: EnemyRenderMode[] = ['hardwareSprite', 'softwareSprite', 'hybrid'];
const SPRITE_SIZE_OPTIONS: EnemySpriteSize[] = ['16x16', '16x32', '32x16', '32x32'];
const PARAM_TYPE_OPTIONS: SpawnParamSchemaType[] = ['byte', 'int', 'enum', 'boolean'];
const SOUND_EVENTS = ['onSpawn', 'onAttack', 'onHit', 'onDeath', 'onBounce', 'onDespawn'];
const ROLE_PRESETS = [
  { id: 'idle', label: 'Idle', state: 'Idle' },
  { id: 'patrol', label: 'Patrol', state: 'Patrol' },
  { id: 'attack', label: 'Attack', state: 'Attacking' },
  { id: 'melee', label: 'Melee', state: 'MeleeAttack' },
  { id: 'shoot', label: 'Shoot', state: 'Shooting' },
  { id: 'hurt', label: 'Hurt', state: 'Damaged' },
  { id: 'death', label: 'Death', state: 'Dying' },
] as const;
const STATE_OPTIONS = ['Idle', 'Patrol', 'Walking', 'Flying', 'Jumping', 'Falling', 'Attacking', 'MeleeAttack', 'Shooting', 'Damaged', 'Dying', 'Dead', 'Custom'];

const inputClass = 'h-7 w-full rounded border border-slate-700 bg-[#111821] px-2 text-xs text-slate-100 outline-none focus:border-red-500';
const selectClass = `${inputClass} pr-6`;
const panelClass = 'flex min-h-0 flex-col overflow-hidden rounded border border-slate-700 bg-[#1d2430] shadow-sm';
const panelTitleClass = 'flex-shrink-0 border-b border-slate-700 px-3 py-2 text-xs font-bold uppercase tracking-wide text-red-300';

const numberValue = (value: unknown, fallback = 0): number => Number.isFinite(Number(value)) ? Number(value) : fallback;
const logicUpdateIntervalFramesValue = (value: unknown): number =>
  Math.max(1, Math.min(255, Math.floor(numberValue(value, 1)) || 1));

const slugify = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'enemy';

const formatAsmSymbol = (value: string): string => slugify(value).toUpperCase();

const parseFrameList = (value: string): number[] => {
  const frames = value
    .split(',')
    .map(part => Number(part.trim()))
    .filter(Number.isFinite)
    .map(frame => Math.max(0, Math.min(255, Math.floor(frame))));
  return frames.length ? frames : [0];
};

const getAssetFrameCount = (asset?: ProjectAsset | null): number => {
  const frames = (asset?.data as any)?.frames;
  return Array.isArray(frames) ? Math.max(1, frames.length) : 1;
};

const rangeFramesForAsset = (asset?: ProjectAsset | null): number[] =>
  Array.from({ length: Math.min(8, getAssetFrameCount(asset)) }, (_unused, index) => index);

const buildRenderRoles = (enemy: EnemyDefinition): EnemyRenderRoleBinding[] => {
  const roles = enemy.render.roles;
  if (Array.isArray(roles) && roles.length > 0) {
    return roles.map((role, index) => ({
      id: role.id || `role_${index + 1}`,
      label: role.label || role.id || `Role ${index + 1}`,
      state: role.state || role.label || role.id || '',
      behavior: role.behavior || 'Any',
      attack: role.attack || 'Any',
      spriteId: role.spriteId || enemy.render.spriteId || '',
      animation: role.animation || role.id || `role_${index + 1}`,
      frames: Array.isArray(role.frames) && role.frames.length ? role.frames : [0],
      speed: numberValue(role.speed, 4),
      loop: role.loop ?? true,
      notes: role.notes || '',
    }));
  }
  return Object.entries(enemy.render.animations || {}).map(([id, animation], index) => ({
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1),
    state: id.charAt(0).toUpperCase() + id.slice(1),
    behavior: index === 0 ? enemy.behavior.type : 'Any',
    attack: index === 0 && enemy.attack.type !== 'None' ? enemy.attack.type : 'Any',
    spriteId: enemy.render.spriteId || '',
    animation: id,
    frames: animation.frames?.length ? animation.frames : [0],
    speed: numberValue(animation.speed, 4),
    loop: animation.loop ?? true,
  }));
};

const buildBehaviorTransitions = (enemy: EnemyDefinition): EnemyBehaviorStateTransition[] => (
  Array.isArray(enemy.behavior.stateTransitions)
    ? enemy.behavior.stateTransitions.map((transition, index) => ({
        id: transition.id || `transition_${index + 1}`,
        label: transition.label || transition.id || `Transition ${index + 1}`,
        condition: transition.condition || 'PlayerNear',
        toBehavior: transition.toBehavior || 'ChaseHorizontal',
        fromBehavior: transition.fromBehavior || enemy.behavior.type || 'Any',
        returnBehavior: transition.returnBehavior || enemy.behavior.type || 'None',
        rangeX: Math.max(1, Math.min(255, numberValue(transition.rangeX, 48))),
        rangeY: Math.max(1, Math.min(191, numberValue(transition.rangeY, 32))),
      }))
    : []
);

const Field: React.FC<{ label: string; children: React.ReactNode; suffix?: string }> = ({ label, children, suffix }) => (
  <label className="grid grid-cols-[112px_1fr_auto] items-center gap-2 text-xs text-slate-200">
    <span className="text-slate-100">{label}:</span>
    {children}
    <span className="min-w-0 text-[11px] text-slate-300">{suffix}</span>
  </label>
);

const SmallNumber: React.FC<{ value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number }> = ({ value, onChange, min, max, step = 1 }) => (
  <input
    type="number"
    min={min}
    max={max}
    step={step}
    className={inputClass}
    value={value}
    onChange={event => onChange(Number(event.target.value))}
  />
);

const Checkbox: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 text-xs text-slate-100">
    <input
      type="checkbox"
      checked={checked}
      onChange={event => onChange(event.target.checked)}
      className="h-3.5 w-3.5 accent-red-500"
    />
    {label}
  </label>
);

const getSpritePixels = (asset?: ProjectAsset | null): { pixels?: any[][]; backgroundColor?: string; width: number; height: number } => {
  const sprite = asset?.data as any;
  const frame = sprite?.frames?.[sprite?.currentFrameIndex || 0] || sprite?.frames?.[0];
  const pixels = frame?.data;
  const width = sprite?.size?.width || pixels?.[0]?.length || 16;
  const height = sprite?.size?.height || pixels?.length || 16;
  return { pixels, backgroundColor: sprite?.backgroundColor, width, height };
};

const SpritePreview: React.FC<{ asset?: ProjectAsset | null; size?: EnemySpriteSize }> = ({ asset, size = '16x16' }) => {
  const { pixels, backgroundColor, width, height } = getSpritePixels(asset);
  const [fallbackW, fallbackH] = size.split('x').map(value => Number(value) || 16);
  const resolvedW = pixels?.[0]?.length || fallbackW;
  const resolvedH = pixels?.length || fallbackH;
  const scale = Math.max(2, Math.min(5, Math.floor(128 / Math.max(width, height, resolvedW, resolvedH))));

  if (!pixels?.length) {
    return (
      <div className="relative h-32 w-32 rounded border border-slate-700 bg-[#0b1118]">
        <div className="absolute left-[34%] top-[18%] h-[18%] w-[32%] bg-[#5f437f]" />
        <div className="absolute left-[20%] top-[32%] h-[24%] w-[60%] bg-[#7c5aa8]" />
        <div className="absolute left-[8%] top-[24%] h-[26%] w-[26%] bg-[#3d2d5c]" />
        <div className="absolute right-[8%] top-[24%] h-[26%] w-[26%] bg-[#3d2d5c]" />
        <div className="absolute left-[38%] top-[52%] h-[18%] w-[24%] bg-[#251b38]" />
        <div className="absolute left-[42%] top-[36%] h-[5%] w-[5%] bg-[#f4d35e]" />
        <div className="absolute right-[42%] top-[36%] h-[5%] w-[5%] bg-[#f4d35e]" />
      </div>
    );
  }

  return (
    <div
      className="grid rounded border border-slate-700 bg-[#0b1118] p-2"
      style={{
        gridTemplateColumns: `repeat(${width}, ${scale}px)`,
        gridAutoRows: `${scale}px`,
        width: width * scale + 16,
        height: height * scale + 16,
      }}
    >
      {Array.from({ length: height }).flatMap((_, y) =>
        Array.from({ length: width }).map((__, x) => {
          const color = String((pixels[y]?.[x] ?? backgroundColor) || 'transparent');
          const transparent = !color || color.toUpperCase() === String(backgroundColor || '').toUpperCase() || color.toUpperCase() === 'TRANSPARENT' || color.toUpperCase() === 'RGBA(0,0,0,0)';
          return <span key={`${x}_${y}`} style={{ backgroundColor: transparent ? 'transparent' : color }} />;
        })
      )}
    </div>
  );
};

const HitboxEditor: React.FC<{ title: string; value: EnemyHitboxRect; onChange: (value: EnemyHitboxRect) => void }> = ({ title, value, onChange }) => (
  <div className="rounded border border-slate-700 bg-[#111821] p-3">
    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-300">{title}</div>
    <div className="grid grid-cols-4 gap-2">
      {(['x', 'y', 'w', 'h'] as const).map(key => (
        <label key={key} className="space-y-1 text-xs text-slate-200">
          <span className="uppercase text-slate-400">{key}</span>
          <SmallNumber value={numberValue(value[key])} onChange={next => onChange({ ...value, [key]: next })} min={0} />
        </label>
      ))}
    </div>
  </div>
);

const buildEnemyAsmPreview = (enemy: EnemyDefinition): string => {
  const enemySymbol = `ENEMY_${formatAsmSymbol(enemy.enemyId)}`;
  const params = enemy.spawnParamsSchema
    .slice()
    .sort((a, b) => a.exportParam.localeCompare(b.exportParam))
    .map(param => {
      if (param.type === 'boolean') return param.default ? '1' : '0';
      if (param.type === 'enum') return `${formatAsmSymbol(param.name)}_${formatAsmSymbol(String(param.default))}`;
      return String(param.default);
    });

  return [
    `${enemySymbol} EQU 0`,
    '',
    `${enemySymbol}_DEF:`,
    `    db BEHAVIOR_${formatAsmSymbol(enemy.behavior.type)}, ATTACK_${formatAsmSymbol(enemy.attack.type)}`,
    `    db ${enemy.stats.hp}, ${enemy.stats.damage}, ${enemy.stats.invulnerabilityFrames || 0}, ${enemy.stats.knockback || 0}`,
    `    db ${enemy.budget.cpu}, ${enemy.budget.sprites}, ${enemy.budget.ram}`,
    `    dw ${formatAsmSymbol(enemy.render.spriteId || 'missing_sprite')}_SPR`,
    '',
    `; Render roles:`,
    ...buildRenderRoles(enemy).map(role =>
      `;   ${formatAsmSymbol(role.id)} state=${role.state || '-'} behavior=${role.behavior || 'Any'} attack=${role.attack || 'Any'} sprite=${role.spriteId || enemy.render.spriteId || 'default'} frames=${role.frames.join(',')} speed=${role.speed}`
    ),
    '',
    `; Spawn: enemyId, x, y, p0, p1, p2, p3`,
    `    db ${enemySymbol}, 80, 64${params.length ? `, ${params.join(', ')}` : ''}`,
    `    db $FF`,
  ].join('\n');
};

const validateEnemy = (enemy: EnemyDefinition, allAssets: ProjectAsset[]): string[] => {
  const issues: string[] = [];
  if (!enemy.name.trim()) issues.push('Name is required.');
  if (!enemy.enemyId.trim()) issues.push('Enemy ID is required.');
  if (!enemy.render.spriteId) issues.push('Sprite is not assigned.');
  if (enemy.render.spriteId && !allAssets.some(asset => asset.id === enemy.render.spriteId)) issues.push('Assigned sprite was not found.');
  if (Object.keys(enemy.render.animations || {}).length === 0) issues.push('At least one animation is recommended.');
  const roles = buildRenderRoles(enemy);
  if (roles.length === 0) issues.push('At least one render role is recommended.');
  if (roles.some(role => role.spriteId && !allAssets.some(asset => asset.id === role.spriteId))) issues.push('A render role references a missing sprite.');
  if (roles.some(role => role.frames.length === 0)) issues.push('Every render role needs at least one frame.');
  if (enemy.attack.bulletSpriteId && !allAssets.some(asset => asset.id === enemy.attack.bulletSpriteId)) issues.push('The Bullet Sprite references a missing sprite.');
  if (enemy.behavior.type === 'TurretAim' && !String(enemy.attack.turretHeadSpriteId || '').trim()) issues.push('TurretAim requires an Aim Sprite.');
  if (enemy.attack.turretBaseSpriteId && !allAssets.some(asset => asset.id === enemy.attack.turretBaseSpriteId)) issues.push('The Turret Centre Sprite references a missing sprite.');
  if (enemy.attack.turretHeadSpriteId && !allAssets.some(asset => asset.id === enemy.attack.turretHeadSpriteId)) issues.push('The Turret Aim Sprite references a missing sprite.');
  if (enemy.hitboxes.body.w <= 0 || enemy.hitboxes.body.h <= 0) issues.push('Body hitbox must have width and height.');
  if (enemy.budget.sprites > 4) issues.push('Sprite budget is high for MSX2 hardware sprites.');
  return issues;
};

export const Msx2EnemyEditor: React.FC<Msx2EnemyEditorProps> = ({
  enemy,
  onUpdate,
  allAssets,
  setStatusBarMessage,
}) => {
  const [activeSection, setActiveSection] = useState<EnemyConfigSection>('General');
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const selectedSprite = useMemo(
    () => allAssets.find(asset => asset.id === enemy.render.spriteId) || null,
    [allAssets, enemy.render.spriteId]
  );
  const spriteAssets = allAssets.filter(asset => asset.type === 'msx2sprite' || asset.type === 'sprite');
  const soundAssets = allAssets.filter(asset => asset.type === 'sound');
  const issues = validateEnemy(enemy, allAssets);
  const animationEntries = Object.entries(enemy.render.animations || {});
  const renderRoles = buildRenderRoles(enemy);
  const behaviorTransitions = buildBehaviorTransitions(enemy);
  const selectedRole = renderRoles[Math.min(selectedRoleIndex, Math.max(0, renderRoles.length - 1))];
  const selectedRoleSprite = allAssets.find(asset => asset.id === selectedRole?.spriteId) || selectedSprite;

  const patch = (next: Partial<EnemyDefinition>) => onUpdate({ ...enemy, ...next });
  const patchRender = (next: Partial<EnemyDefinition['render']>) => patch({ render: { ...enemy.render, ...next } });
  const patchStats = (next: Partial<EnemyDefinition['stats']>) => patch({ stats: { ...enemy.stats, ...next } });
  const patchBudget = (next: Partial<EnemyDefinition['budget']>) => patch({ budget: { ...enemy.budget, ...next } });
  const patchSound = (eventId: string, soundAssetId: string) => patch({ sound: { ...enemy.sound, [eventId]: soundAssetId || null } });
  const patchRoles = (roles: EnemyRenderRoleBinding[]) => patchRender({ roles });
  const patchBehaviorTransitions = (stateTransitions: EnemyBehaviorStateTransition[]) => patch({
    behavior: { ...enemy.behavior, stateTransitions },
  });

  const applyTemplate = (templateId: string) => {
    const template = GLOBAL_ENEMY_TEMPLATES.find(item => item.templateId === templateId);
    if (!template) return;
    const next = createEnemyFromTemplate(template, { name: enemy.name || template.name });
    onUpdate({
      ...next,
      enemyId: enemy.enemyId || next.enemyId,
      name: enemy.name || next.name,
      render: {
        ...next.render,
        spriteId: enemy.render.spriteId,
        palette: enemy.render.palette,
      },
      sound: { ...next.sound, ...enemy.sound },
      budget: {
        ...next.budget,
        codePackage: enemy.budget.codePackage || next.budget.codePackage,
        graphicsPackage: enemy.budget.graphicsPackage || next.budget.graphicsPackage,
        graphicsBank: enemy.budget.graphicsBank || next.budget.graphicsBank,
        ramPackage: enemy.budget.ramPackage || next.budget.ramPackage,
      },
    });
    setStatusBarMessage?.(`Applied enemy preset "${template.name}".`);
  };

  const updateAnimation = (name: string, patchAnimation: Partial<{ frames: number[]; speed: number; loop: boolean }>) => {
    patchRender({
      animations: {
        ...enemy.render.animations,
        [name]: {
          frames: enemy.render.animations[name]?.frames || [0],
          speed: enemy.render.animations[name]?.speed || 4,
          loop: enemy.render.animations[name]?.loop ?? true,
          ...patchAnimation,
        },
      },
    });
  };

  const renameAnimation = (oldName: string, newName: string) => {
    const key = slugify(newName);
    if (!key || key === oldName) return;
    const nextAnimations = { ...enemy.render.animations };
    nextAnimations[key] = nextAnimations[oldName];
    delete nextAnimations[oldName];
    patchRender({ animations: nextAnimations });
  };

  const removeAnimation = (name: string) => {
    const nextAnimations = { ...enemy.render.animations };
    delete nextAnimations[name];
    patchRender({ animations: nextAnimations });
  };

  const updateRenderRole = (index: number, next: Partial<EnemyRenderRoleBinding>) => {
    const roles = renderRoles.map((role, roleIndex) => (
      roleIndex === index ? { ...role, ...next } : role
    ));
    patchRoles(roles);
  };

  const addRenderRole = (preset = ROLE_PRESETS[0]) => {
    const usedIds = new Set(renderRoles.map(role => role.id));
    let id = preset.id;
    let suffix = 2;
    while (usedIds.has(id)) id = `${preset.id}_${suffix++}`;
    const spriteId = enemy.render.spriteId || spriteAssets[0]?.id || '';
    const sprite = allAssets.find(asset => asset.id === spriteId) || null;
    const frames = rangeFramesForAsset(sprite);
    const role: EnemyRenderRoleBinding = {
      id,
      label: preset.label,
      state: preset.state,
      behavior: preset.id === 'patrol' ? enemy.behavior.type : 'Any',
      attack: preset.id === 'attack' || preset.id === 'melee' || preset.id === 'shoot' ? enemy.attack.type : 'Any',
      spriteId,
      animation: id,
      frames,
      speed: 4,
      loop: preset.id !== 'death',
    };
    patchRoles([...renderRoles, role]);
    setSelectedRoleIndex(renderRoles.length);
  };

  const duplicateRenderRole = (index: number) => {
    const source = renderRoles[index];
    if (!source) return;
    const usedIds = new Set(renderRoles.map(role => role.id));
    let id = `${source.id}_copy`;
    let suffix = 2;
    while (usedIds.has(id)) id = `${source.id}_copy_${suffix++}`;
    patchRoles([...renderRoles, { ...source, id, label: `${source.label} Copy`, animation: id }]);
    setSelectedRoleIndex(renderRoles.length);
  };

  const removeRenderRole = (index: number) => {
    const nextRoles = renderRoles.filter((_role, roleIndex) => roleIndex !== index);
    patchRoles(nextRoles);
    setSelectedRoleIndex(Math.max(0, Math.min(index, nextRoles.length - 1)));
  };

  const updateBehaviorTransition = (index: number, next: Partial<EnemyBehaviorStateTransition>) => {
    patchBehaviorTransitions(behaviorTransitions.map((transition, transitionIndex) => (
      transitionIndex === index ? { ...transition, ...next } : transition
    )));
  };

  const addBehaviorTransition = () => {
    const usedIds = new Set(behaviorTransitions.map(transition => transition.id));
    let id = 'player_near_chase';
    let suffix = 2;
    while (usedIds.has(id)) id = `player_near_chase_${suffix++}`;
    patchBehaviorTransitions([
      ...behaviorTransitions,
      {
        id,
        label: 'Player Near Chase',
        condition: 'PlayerNear',
        fromBehavior: enemy.behavior.type || 'Any',
        toBehavior: 'ChaseHorizontal',
        returnBehavior: enemy.behavior.type || 'None',
        rangeX: 48,
        rangeY: 32,
      },
    ]);
  };

  const removeBehaviorTransition = (index: number) => {
    patchBehaviorTransitions(behaviorTransitions.filter((_transition, transitionIndex) => transitionIndex !== index));
  };

  const updateSpawnParam = (index: number, next: Partial<SpawnParamSchemaItem>) => {
    patch({
      spawnParamsSchema: enemy.spawnParamsSchema.map((param, paramIndex) => (
        paramIndex === index ? { ...param, ...next } : param
      )),
    });
  };

  const removeSpawnParam = (index: number) => {
    patch({ spawnParamsSchema: enemy.spawnParamsSchema.filter((_, paramIndex) => paramIndex !== index) });
  };

  const addSpawnParam = () => {
    const used = new Set(enemy.spawnParamsSchema.map(param => param.exportParam));
    const slot = (['p0', 'p1', 'p2', 'p3'] as const).find(value => !used.has(value)) || 'p3';
    patch({
      spawnParamsSchema: [
        ...enemy.spawnParamsSchema,
        { name: slot, label: `Param ${slot.toUpperCase()}`, type: 'byte', default: 0, min: 0, max: 255, exportParam: slot },
      ],
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#121820] text-slate-100">
      <div className="flex flex-none items-center justify-between border-b border-slate-700 bg-[#17202b] px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-red-200">MSX2 Enemy Config: {enemy.name || 'Unnamed enemy'}</h2>
          <div className="text-xs text-slate-400">{enemy.enemyId || 'missing_id'} · {enemy.behavior.type} · {enemy.attack.type}</div>
        </div>
        <div className="flex items-center gap-2">
          <select className="h-8 rounded border border-slate-700 bg-[#111821] px-2 text-xs text-slate-100" value={enemy.basedOnTemplate || ''} onChange={event => applyTemplate(event.target.value)}>
            <option value="">Apply preset...</option>
            {GLOBAL_ENEMY_TEMPLATES.map(template => (
              <option key={template.templateId} value={template.templateId}>{template.name}</option>
            ))}
          </select>
          <button
            type="button"
            className="h-8 rounded border border-emerald-700 bg-emerald-900/30 px-3 text-xs text-emerald-100 hover:bg-emerald-800/50"
            title="Save this enemy to the global MSX2 Enemies Library (persists across projects, reusable via Libraries > Enemies)."
            onClick={() => {
              const entry = addEntryToMsx2EnemyLibrary(enemy, enemy.name);
              setStatusBarMessage?.(`Exported "${entry.name}" to the global MSX2 Enemies Library.`);
              alert(`Exported "${entry.name}" to the global MSX2 Enemies Library.`);
            }}
          >
            Export to Library
          </button>
          <button type="button" className="h-8 rounded border border-red-700 bg-red-900/30 px-3 text-xs text-red-100 hover:bg-red-800/50" onClick={() => applyTemplate('bat_enemy_basic')}>
            Bat Enemy
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[180px_1fr_300px] gap-3 p-3">
        <aside className="min-h-0 overflow-hidden rounded border border-slate-700 bg-[#1d2430]">
          <div className="border-b border-slate-700 px-4 py-2 text-xs font-bold uppercase tracking-wide text-red-300">Enemy Asset</div>
          {navItems.map(item => (
            <button
              key={item}
              type="button"
              onClick={() => setActiveSection(item)}
              className={`block h-8 w-full border-b border-slate-800 px-4 text-left text-xs ${activeSection === item ? 'bg-red-700 text-white' : 'text-slate-100 hover:bg-slate-800'}`}
            >
              {item}
            </button>
          ))}
        </aside>

        <main className="relative min-h-0">
          <section className={`${panelClass} ${activeSection === 'General' ? 'absolute inset-0' : 'hidden'}`}>
            <div className={panelTitleClass}>General</div>
            <div className="space-y-3 overflow-auto p-4">
              <Field label="Name"><input className={inputClass} value={enemy.name} onChange={event => patch({ name: event.target.value })} /></Field>
              <Field label="Enemy ID"><input className={inputClass} value={enemy.enemyId} onChange={event => patch({ enemyId: slugify(event.target.value) })} /></Field>
              <Field label="Category">
                <select className={selectClass} value={enemy.category} onChange={event => patch({ category: event.target.value as EnemyCategory })}>
                  {CATEGORY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </Field>
              <Field label="Scope">
                <select className={selectClass} value={enemy.scope} onChange={event => patch({ scope: event.target.value as EnemyLibraryScope })}>
                  {SCOPE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </Field>
              <Field label="World/Group"><input className={inputClass} value={enemy.world} onChange={event => patch({ world: event.target.value })} /></Field>
              <Field label="Behavior Set"><input className={inputClass} value={enemy.behaviorGroup} onChange={event => patch({ behaviorGroup: event.target.value })} /></Field>
              <label className="block space-y-1 text-xs text-slate-200">
                <span>Notes</span>
                <textarea className="h-28 w-full rounded border border-slate-700 bg-[#111821] p-2 text-xs text-slate-100 outline-none focus:border-red-500" value={enemy.notes || ''} onChange={event => patch({ notes: event.target.value })} />
              </label>
            </div>
          </section>

          <section className={`${panelClass} ${activeSection === 'Graphics & Animations' ? 'absolute inset-0' : 'hidden'}`}>
            <div className={panelTitleClass}>Graphics & Animations</div>
            <div className="space-y-4 overflow-auto p-4">
              <div className="rounded border border-slate-700 bg-[#111821]">
                <div className="grid grid-cols-2 gap-3 border-b border-slate-700 p-3">
                  <Field label="Default Sprite">
                    <select className={selectClass} value={enemy.render.spriteId} onChange={event => patchRender({ spriteId: event.target.value })}>
                      <option value="">None</option>
                      {spriteAssets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Render Mode">
                    <select className={selectClass} value={enemy.render.renderMode} onChange={event => patchRender({ renderMode: event.target.value as EnemyRenderMode })}>
                      {RENDER_MODE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </Field>
                  <Field label="Size">
                    <select className={selectClass} value={enemy.render.size} onChange={event => patchRender({ size: event.target.value as EnemySpriteSize })}>
                      {SPRITE_SIZE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </Field>
                  <Field label="Palette"><input className={inputClass} value={enemy.render.palette} onChange={event => patchRender({ palette: event.target.value })} /></Field>
                </div>

                <div className="flex items-center justify-between border-b border-slate-700 px-3 py-2">
                  <div>
                    <div className="text-xs font-bold uppercase text-red-300">Role Render Links</div>
                    <div className="text-[11px] text-slate-400">Declarative links: state/behavior to sprite render and frames.</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="h-7 rounded border border-slate-700 bg-[#0b1118] px-2 text-xs text-slate-100 outline-none focus:border-red-500"
                      defaultValue=""
                      onChange={event => {
                        const preset = ROLE_PRESETS.find(item => item.id === event.target.value);
                        if (preset) addRenderRole(preset);
                        event.currentTarget.value = '';
                      }}
                    >
                      <option value="">Add role...</option>
                      {ROLE_PRESETS.map(preset => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
                    </select>
                    <button type="button" className="h-7 rounded border border-slate-600 px-3 text-xs text-slate-100 hover:bg-slate-800" onClick={() => duplicateRenderRole(Math.min(selectedRoleIndex, Math.max(0, renderRoles.length - 1)))}>Duplicate</button>
                  </div>
                </div>

                <div className="min-h-[150px] overflow-auto">
                  <table className="w-full table-fixed text-xs">
                    <thead className="bg-[#141b25] text-left text-slate-300">
                      <tr>
                        <th className="w-12 px-3 py-2">ID</th>
                        <th className="w-28 px-3 py-2">Role</th>
                        <th className="w-32 px-3 py-2">State</th>
                        <th className="w-36 px-3 py-2">Behavior</th>
                        <th className="w-36 px-3 py-2">Attack</th>
                        <th className="px-3 py-2">Sprite</th>
                        <th className="w-24 px-3 py-2">Frames</th>
                        <th className="w-20 px-3 py-2">Speed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {renderRoles.map((role, index) => {
                        const roleSprite = allAssets.find(asset => asset.id === role.spriteId);
                        return (
                          <tr
                            key={`${role.id}_${index}`}
                            className={`cursor-pointer border-t border-slate-800 ${index === selectedRoleIndex ? 'bg-red-950/40 text-white' : 'text-slate-100 hover:bg-slate-800/60'}`}
                            onClick={() => setSelectedRoleIndex(index)}
                          >
                            <td className="px-3 py-2 text-slate-300">{index}</td>
                            <td className="truncate px-3 py-2 font-semibold">{role.label}</td>
                            <td className="truncate px-3 py-2">{role.state || '-'}</td>
                            <td className="truncate px-3 py-2">{role.behavior || 'Any'}</td>
                            <td className="truncate px-3 py-2">{role.attack || 'Any'}</td>
                            <td className="truncate px-3 py-2">{roleSprite?.name || (role.spriteId ? 'Missing sprite' : 'Default')}</td>
                            <td className="truncate px-3 py-2">{role.frames.join(',')}</td>
                            <td className="px-3 py-2">{role.speed}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedRole && (
                <div className="grid grid-cols-[180px_1fr] gap-3 rounded border border-slate-700 bg-[#111821] p-3">
                  <div className="flex flex-col items-center justify-center rounded border border-slate-700 bg-[#0b1118] p-3">
                    <SpritePreview asset={selectedRoleSprite} size={enemy.render.size} />
                    <div className="mt-2 max-w-full truncate text-xs text-slate-300">{selectedRoleSprite?.name || 'Default sprite'}</div>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Role ID"><input className={inputClass} value={selectedRole.id} onChange={event => updateRenderRole(selectedRoleIndex, { id: slugify(event.target.value), animation: slugify(event.target.value) })} /></Field>
                      <Field label="Label"><input className={inputClass} value={selectedRole.label} onChange={event => updateRenderRole(selectedRoleIndex, { label: event.target.value })} /></Field>
                      <Field label="State">
                        <select className={selectClass} value={selectedRole.state || ''} onChange={event => updateRenderRole(selectedRoleIndex, { state: event.target.value })}>
                          <option value="">Unlinked</option>
                          {STATE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </Field>
                      <Field label="Sprite">
                        <select className={selectClass} value={selectedRole.spriteId || ''} onChange={event => updateRenderRole(selectedRoleIndex, { spriteId: event.target.value, frames: rangeFramesForAsset(allAssets.find(asset => asset.id === event.target.value)) })}>
                          <option value="">Use default sprite</option>
                          {spriteAssets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                        </select>
                      </Field>
                      <Field label="Behavior">
                        <select className={selectClass} value={selectedRole.behavior || 'Any'} onChange={event => updateRenderRole(selectedRoleIndex, { behavior: event.target.value as EnemyRenderRoleBinding['behavior'] })}>
                          <option value="Any">Any</option>
                          {BEHAVIOR_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </Field>
                      <Field label="Attack">
                        <select className={selectClass} value={selectedRole.attack || 'Any'} onChange={event => updateRenderRole(selectedRoleIndex, { attack: event.target.value as EnemyRenderRoleBinding['attack'] })}>
                          <option value="Any">Any</option>
                          {ATTACK_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </Field>
                      <Field label="Frames"><input className={inputClass} value={selectedRole.frames.join(',')} onChange={event => updateRenderRole(selectedRoleIndex, { frames: parseFrameList(event.target.value) })} /></Field>
                      <Field label="Speed"><SmallNumber value={selectedRole.speed} min={1} max={255} onChange={value => updateRenderRole(selectedRoleIndex, { speed: value })} /></Field>
                    </div>
                    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                      <input className={inputClass} value={selectedRole.notes || ''} placeholder="Notes for this render role" onChange={event => updateRenderRole(selectedRoleIndex, { notes: event.target.value })} />
                      <Checkbox label="Loop" checked={selectedRole.loop} onChange={checked => updateRenderRole(selectedRoleIndex, { loop: checked })} />
                      <button type="button" className="h-7 rounded border border-red-700 bg-red-950/30 px-3 text-xs text-red-100 hover:bg-red-900/50" onClick={() => removeRenderRole(selectedRoleIndex)}>Delete</button>
                    </div>
                    <div className="text-[11px] text-slate-400">Internal key: {selectedRole.id} - Animation: {selectedRole.animation} - Frames: {selectedRole.frames.join(', ')}</div>
                  </div>
                </div>
              )}

              <div className="space-y-2 rounded border border-slate-700 bg-[#111821] p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-300">Animation Clips</div>
                    <div className="text-[11px] text-slate-500">Compatibility clips. Runtime role links above choose the sprite and frame set.</div>
                  </div>
                  <button type="button" className="rounded border border-slate-600 px-2 py-1 text-xs hover:bg-slate-800" onClick={() => updateAnimation(`anim_${animationEntries.length + 1}`, { frames: [0], speed: 4, loop: true })}>Add</button>
                </div>
                {animationEntries.map(([name, animation]) => (
                  <div key={name} className="grid grid-cols-[120px_1fr_72px_72px_auto] items-center gap-2 rounded border border-slate-700 bg-[#0b1118] p-2">
                    <input className={inputClass} value={name} onChange={event => renameAnimation(name, event.target.value)} />
                    <input className={inputClass} value={animation.frames.join(',')} onChange={event => updateAnimation(name, { frames: parseFrameList(event.target.value) })} />
                    <SmallNumber value={animation.speed} min={1} onChange={value => updateAnimation(name, { speed: value })} />
                    <Checkbox label="Loop" checked={animation.loop} onChange={checked => updateAnimation(name, { loop: checked })} />
                    <button type="button" className="rounded border border-slate-600 px-2 py-1 text-xs hover:bg-slate-800" onClick={() => removeAnimation(name)}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={`${panelClass} ${activeSection === 'Behavior' ? 'absolute inset-0' : 'hidden'}`}>
            <div className={panelTitleClass}>Behavior</div>
            <div className="space-y-3 overflow-auto p-4">
              <Field label="Movement">
                <select className={selectClass} value={enemy.behavior.type} onChange={event => patch({ behavior: { ...enemy.behavior, type: event.target.value as EnemyBehaviorType } })}>
                  {BEHAVIOR_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </Field>
              <Field label="Logic interval" suffix="frames/update">
                <SmallNumber
                  value={logicUpdateIntervalFramesValue(enemy.logicUpdateIntervalFrames ?? (enemy as any).logicUpdateEveryFrames)}
                  min={1}
                  max={255}
                  onChange={value => patch({ logicUpdateIntervalFrames: logicUpdateIntervalFramesValue(value) })}
                />
              </Field>
              <div className="rounded border border-slate-700 bg-[#111821] p-3 text-[11px] text-slate-400">
                CPU cadence: 1 runs behavior every frame, 2 every other frame, 3 every third frame. Sprite publication and contact checks still run every frame.
              </div>
              <Field label="Custom Routine"><input className={inputClass} value={enemy.behavior.customRoutine || ''} onChange={event => patch({ behavior: { ...enemy.behavior, customRoutine: event.target.value } })} /></Field>
              <div className="rounded border border-slate-700 bg-[#111821] p-3 text-xs text-slate-300">
                `FlyerSine` is the recommended movement for Bat Enemy. `PatrolHorizontal` and `WalkerTurnOnEdge` are cheaper for ground enemies.
                `SlimeCeiling` crawls along the floor, hops to the ceiling every N px (Slime hop distance on the placed entity) and sticks upside down, then drops back and repeats.
                `GearWheel` emits one 16x16 wheel from the placed coordinates: it falls with the authored speed, rolls on support, reverses at walls, disappears on an Effects=Exit cell, and respawns after the configured seconds.
                `FlyBounce8` is the bat: it drifts along one of 8 headings ignoring every tile, bounces off the room edges only, and rolls a new heading every N px (Turn distance on the placed entity).
                `TurretAim` uses two round hardware sprites, tracks the Player in 8 directions and fires only while the Player is inside its configured aiming arc.
              </div>
              <div className="space-y-2 rounded border border-slate-700 bg-[#111821] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">Runtime State Switches</div>
                    <div className="text-[11px] text-slate-500">Compact MSX2 behavior changes. Render roles remain declarative until per-slot render is implemented.</div>
                  </div>
                  <button type="button" className="h-7 rounded border border-slate-600 px-3 text-xs text-slate-100 hover:bg-slate-800" onClick={addBehaviorTransition}>Add Player Near</button>
                </div>
                {behaviorTransitions.length === 0 ? (
                  <div className="rounded border border-slate-800 bg-[#0b1118] p-2 text-xs text-slate-400">No runtime behavior transition. Enemy keeps its base movement.</div>
                ) : (
                  <div className="space-y-2">
                    {behaviorTransitions.map((transition, index) => (
                      <div key={`${transition.id}_${index}`} className="grid grid-cols-[120px_130px_130px_86px_86px_auto] items-end gap-2 rounded border border-slate-700 bg-[#0b1118] p-2">
                        <label className="space-y-1 text-xs text-slate-200">
                          <span className="text-slate-400">Condition</span>
                          <select className={selectClass} value={transition.condition} onChange={event => updateBehaviorTransition(index, { condition: event.target.value as EnemyBehaviorStateTransition['condition'] })}>
                            <option value="PlayerNear">PlayerNear</option>
                          </select>
                        </label>
                        <label className="space-y-1 text-xs text-slate-200">
                          <span className="text-slate-400">Near behavior</span>
                          <select className={selectClass} value={transition.toBehavior} onChange={event => updateBehaviorTransition(index, { toBehavior: event.target.value as EnemyBehaviorType })}>
                            {BEHAVIOR_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </label>
                        <label className="space-y-1 text-xs text-slate-200">
                          <span className="text-slate-400">Return behavior</span>
                          <select className={selectClass} value={transition.returnBehavior || enemy.behavior.type} onChange={event => updateBehaviorTransition(index, { returnBehavior: event.target.value as EnemyBehaviorType })}>
                            {BEHAVIOR_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </label>
                        <label className="space-y-1 text-xs text-slate-200">
                          <span className="text-slate-400">Range X</span>
                          <SmallNumber value={transition.rangeX} min={1} max={255} onChange={value => updateBehaviorTransition(index, { rangeX: value })} />
                        </label>
                        <label className="space-y-1 text-xs text-slate-200">
                          <span className="text-slate-400">Range Y</span>
                          <SmallNumber value={transition.rangeY} min={1} max={191} onChange={value => updateBehaviorTransition(index, { rangeY: value })} />
                        </label>
                        <button type="button" className="h-7 rounded border border-red-700 bg-red-950/30 px-3 text-xs text-red-100 hover:bg-red-900/50" onClick={() => removeBehaviorTransition(index)}>Delete</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <label className="block space-y-1 text-xs text-slate-200">
                <span>Required Routines</span>
                <textarea
                  className="h-32 w-full rounded border border-slate-700 bg-[#111821] p-2 font-mono text-xs text-slate-100 outline-none focus:border-red-500"
                  value={enemy.requiredRoutines.join('\n')}
                  onChange={event => patch({ requiredRoutines: event.target.value.split(/\r?\n|,/).map(value => value.trim()).filter(Boolean) })}
                />
              </label>
            </div>
          </section>

          <section className={`${panelClass} ${activeSection === 'Combat & Hitboxes' ? 'absolute inset-0' : 'hidden'}`}>
            <div className={panelTitleClass}>Combat & Hitboxes</div>
            <div className="space-y-4 overflow-auto p-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Attack">
                  <select className={selectClass} value={enemy.attack.type} onChange={event => patch({ attack: { ...enemy.attack, type: event.target.value as EnemyAttackType } })}>
                    {ATTACK_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                </Field>
                <Field label="Bullet Sprite">
                  <select
                    className={selectClass}
                    value={enemy.attack.bulletSpriteId || ''}
                    onChange={event => patch({ attack: { ...enemy.attack, bulletSpriteId: event.target.value || undefined } })}
                  >
                    <option value="">None (no shooting)</option>
                    {spriteAssets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                  </select>
                </Field>
              </div>
              <div className="text-[11px] text-slate-500">
                Bullet Sprite is the graphic/animation linked to this enemy's firing routine. Leave it on <span className="text-slate-300">None</span> if this enemy never shoots. The firing trigger (e.g. the drop-bomb check below) decides when it fires.
              </div>
              {enemy.behavior.type === 'TurretAim' && (
                <div className="space-y-3 rounded border border-cyan-800/70 bg-cyan-950/20 p-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-cyan-200">Aimed Turret (SCREEN 5)</div>
                    <div className="text-[11px] text-slate-400">Two round hardware sprites show the aim in 8 hardware directions. The bullet itself follows the exact signed vector from turret to Player at the configured speed. Tiles do not block vision, but the fired bullet is removed when it later hits a collision tile.</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Centre Sprite">
                      <select className={selectClass} value={enemy.attack.turretBaseSpriteId || enemy.render.spriteId || ''} onChange={event => patch({ attack: { ...enemy.attack, turretBaseSpriteId: event.target.value || undefined } })}>
                        <option value="">Use Default Sprite</option>
                        {spriteAssets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                      </select>
                    </Field>
                    <Field label="Aim Sprite">
                      <select className={selectClass} value={enemy.attack.turretHeadSpriteId || ''} onChange={event => patch({ attack: { ...enemy.attack, turretHeadSpriteId: event.target.value || undefined } })}>
                        <option value="">Select sprite</option>
                        {spriteAssets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                      </select>
                    </Field>
                    <Field label="Separation" suffix="px"><SmallNumber value={enemy.attack.turretMinSeparation ?? 8} min={0} max={32} onChange={value => patch({ attack: { ...enemy.attack, turretMinSeparation: value } })} /></Field>
                    <Field label="Centre Angle" suffix="deg"><SmallNumber value={enemy.attack.turretBaseAngle ?? 0} min={0} max={359} onChange={value => patch({ attack: { ...enemy.attack, turretBaseAngle: value } })} /></Field>
                    <Field label="Max Opening" suffix="deg"><SmallNumber value={enemy.attack.turretMaxAngle ?? 360} min={0} max={360} onChange={value => patch({ attack: { ...enemy.attack, turretMaxAngle: value } })} /></Field>
                    <Field label="Fire Rate" suffix="frames"><SmallNumber value={enemy.attack.fireRate ?? 60} min={1} max={255} onChange={value => patch({ attack: { ...enemy.attack, fireRate: value } })} /></Field>
                    <Field label="Bullet Speed" suffix="px/frame"><SmallNumber value={enemy.attack.bulletSpeed ?? 2} min={1} max={8} onChange={value => patch({ attack: { ...enemy.attack, bulletSpeed: value } })} /></Field>
                  </div>
                </div>
              )}
              <div className="rounded border border-slate-700 bg-[#111821] p-3">
                <Checkbox
                  label="Drop bomb when aligned with player X"
                  checked={Boolean(enemy.attack.dropBombOnPlayerX)}
                  onChange={checked => patch({ attack: { ...enemy.attack, dropBombOnPlayerX: checked } })}
                />
                <div className="mt-1 text-[11px] text-slate-500">
                  Optional. When active, the enemy drops a falling bullet whenever its X lines up with the player (±8px). Uses the shared enemy-bullet pool with a ~1s cooldown. Best paired with FlyerSine (Bat). The dropped bullet uses the Bullet Sprite selected above.
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <Field label="HP"><SmallNumber value={enemy.stats.hp} min={0} onChange={value => patchStats({ hp: value })} /></Field>
                <Field label="Damage"><SmallNumber value={enemy.stats.damage} min={0} onChange={value => patchStats({ damage: value })} /></Field>
                <Field label="I-Frames"><SmallNumber value={enemy.stats.invulnerabilityFrames || 0} min={0} onChange={value => patchStats({ invulnerabilityFrames: value })} /></Field>
                <Field label="Knockback"><SmallNumber value={enemy.stats.knockback || 0} min={0} onChange={value => patchStats({ knockback: value })} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <HitboxEditor title="Body Hitbox" value={enemy.hitboxes.body} onChange={body => patch({ hitboxes: { ...enemy.hitboxes, body } })} />
                <HitboxEditor title="Damage Hitbox" value={enemy.hitboxes.damage} onChange={damage => patch({ hitboxes: { ...enemy.hitboxes, damage } })} />
              </div>
            </div>
          </section>

          <section className={`${panelClass} ${activeSection === 'Spawn Params' ? 'absolute inset-0' : 'hidden'}`}>
            <div className={panelTitleClass}>Spawn Params</div>
            <div className="space-y-3 overflow-auto p-4">
              <div className="flex justify-end">
                <button type="button" className="rounded border border-slate-600 px-2 py-1 text-xs hover:bg-slate-800" onClick={addSpawnParam}>Add Param</button>
              </div>
              {enemy.spawnParamsSchema.map((param, index) => (
                <div key={`${param.exportParam}_${index}`} className="grid grid-cols-[72px_100px_1fr_88px_88px_96px_auto] items-center gap-2 rounded border border-slate-700 bg-[#111821] p-2">
                  <select className={selectClass} value={param.exportParam} onChange={event => updateSpawnParam(index, { exportParam: event.target.value as SpawnParamSchemaItem['exportParam'] })}>
                    {(['p0', 'p1', 'p2', 'p3'] as const).map(slot => <option key={slot} value={slot}>{slot}</option>)}
                  </select>
                  <input className={inputClass} value={param.name} onChange={event => updateSpawnParam(index, { name: slugify(event.target.value) })} />
                  <input className={inputClass} value={param.label || ''} onChange={event => updateSpawnParam(index, { label: event.target.value })} />
                  <select className={selectClass} value={param.type} onChange={event => updateSpawnParam(index, { type: event.target.value as SpawnParamSchemaType })}>
                    {PARAM_TYPE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                  <input className={inputClass} value={String(param.default)} onChange={event => updateSpawnParam(index, { default: param.type === 'boolean' ? event.target.value === 'true' : param.type === 'enum' ? event.target.value : Number(event.target.value) })} />
                  <input className={inputClass} value={(param.values || []).join(',')} placeholder="enum values" onChange={event => updateSpawnParam(index, { values: event.target.value.split(',').map(value => value.trim()).filter(Boolean) })} />
                  <button type="button" className="rounded border border-slate-600 px-2 py-1 text-xs hover:bg-slate-800" onClick={() => removeSpawnParam(index)}>Remove</button>
                </div>
              ))}
            </div>
          </section>

          <section className={`${panelClass} ${activeSection === 'Sounds & Budget' ? 'absolute inset-0' : 'hidden'}`}>
            <div className={panelTitleClass}>Sounds & Budget</div>
            <div className="space-y-4 overflow-auto p-4">
              <div className="grid grid-cols-2 gap-3">
                {SOUND_EVENTS.map(eventId => (
                  <Field key={eventId} label={eventId}>
                    <select className={selectClass} value={enemy.sound[eventId] || ''} onChange={event => patchSound(eventId, event.target.value)}>
                      <option value="">None</option>
                      {soundAssets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                    </select>
                  </Field>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="CPU"><SmallNumber value={enemy.budget.cpu} min={0} onChange={value => patchBudget({ cpu: value })} /></Field>
                <Field label="Sprites"><SmallNumber value={enemy.budget.sprites} min={0} onChange={value => patchBudget({ sprites: value })} /></Field>
                <Field label="RAM"><SmallNumber value={enemy.budget.ram} min={0} onChange={value => patchBudget({ ram: value })} suffix="bytes" /></Field>
              </div>
              <Field label="Code Package"><input className={inputClass} value={enemy.budget.codePackage} onChange={event => patchBudget({ codePackage: event.target.value })} /></Field>
              <Field label="GFX Package"><input className={inputClass} value={enemy.budget.graphicsPackage || ''} onChange={event => patchBudget({ graphicsPackage: event.target.value })} /></Field>
              <Field label="GFX Bank"><input className={inputClass} value={enemy.budget.graphicsBank || ''} onChange={event => patchBudget({ graphicsBank: event.target.value })} /></Field>
              <Field label="RAM Package"><input className={inputClass} value={enemy.budget.ramPackage || ''} onChange={event => patchBudget({ ramPackage: event.target.value })} /></Field>
            </div>
          </section>

          <section className={`${panelClass} ${activeSection === 'Preview' ? 'absolute inset-0' : 'hidden'}`}>
            <div className={panelTitleClass}>Preview</div>
            <div className="grid min-h-0 flex-1 grid-cols-[220px_1fr] gap-4 overflow-auto p-4">
              <div className="flex flex-col items-center justify-center rounded border border-slate-700 bg-[#111821] p-4">
                <SpritePreview asset={selectedSprite} size={enemy.render.size} />
                <div className="mt-3 text-center text-xs text-slate-300">{selectedSprite?.name || 'Bat placeholder'}</div>
              </div>
              <pre className="min-h-0 overflow-auto rounded border border-slate-700 bg-[#05070b] p-3 font-mono text-xs text-emerald-200">{buildEnemyAsmPreview(enemy)}</pre>
            </div>
          </section>
        </main>

        <aside className="flex min-h-0 flex-col gap-3">
          <div className="rounded border border-slate-700 bg-[#1d2430] p-4">
            <div className="mb-3 text-xs font-bold uppercase tracking-wide text-red-300">Sprite Preview</div>
            <div className="flex justify-center"><SpritePreview asset={selectedSprite} size={enemy.render.size} /></div>
            <div className="mt-3 text-center text-xs text-slate-300">{selectedSprite?.name || 'No sprite assigned'}</div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto rounded border border-slate-700 bg-[#1d2430] p-3">
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-red-300">Validation</div>
            {issues.length === 0 ? (
              <div className="rounded border border-emerald-700 bg-emerald-950/30 p-2 text-xs text-emerald-200">Enemy config is ready.</div>
            ) : (
              <div className="space-y-2">
                {issues.map(issue => (
                  <div key={issue} className="rounded border border-amber-700 bg-amber-950/30 p-2 text-xs text-amber-100">{issue}</div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
