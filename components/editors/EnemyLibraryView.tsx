import React, { useMemo, useRef, useState } from 'react';
import { EnemyAttackType, EnemyBehaviorType, EnemyDefinition, EnemyLibraryScope, EnemyTemplate, ProjectAsset, SpawnParamSchemaItem } from '../../types';
import { GLOBAL_ENEMY_TEMPLATES, createEmptyEnemyDefinition, createEnemyFromTemplate } from '../../data/enemyLibrary';
import { Button } from '../common/Button';
import { Panel } from '../common/Panel';
import { PlusCircleIcon, SaveIcon, LoadIcon, TrashIcon, SpriteIcon, PuzzlePieceIcon } from '../icons/MsxIcons';
import { downloadTextFile } from '../../utils/downloadUtils';
import { addEntryToMsx2EnemyLibrary } from '../../utils/msx2EnemyLibrary';
import { Msx2EnemyLibraryModal } from '../modals/Msx2EnemyLibraryModal';

interface EnemyLibraryViewProps {
  enemyDefinitions: EnemyDefinition[];
  onUpdateEnemyDefinitions: (updater: EnemyDefinition[] | ((prev: EnemyDefinition[]) => EnemyDefinition[])) => void;
  allAssets: ProjectAsset[];
  setStatusBarMessage?: (message: string) => void;
}

const BEHAVIOR_OPTIONS: EnemyBehaviorType[] = ['None', 'PatrolHorizontal', 'WalkerTurnOnEdge', 'FlyerSine', 'BounceDiagonal', 'Jumper', 'HopperTowardsPlayer', 'ShooterStatic', 'TurretAim', 'ChaseHorizontal', 'DropFromCeiling', 'EmergeFromGround', 'CustomBehavior'];
const ATTACK_OPTIONS: EnemyAttackType[] = ['None', 'DamageOnTouch', 'ShooterStatic', 'ProjectileEmitter', 'MeleeBox', 'ExplosionOnTouch'];
const SCOPE_OPTIONS: EnemyLibraryScope[] = ['common', 'perWorld', 'boss'];
const SOUND_EVENTS = ['onSpawn', 'onAttack', 'onHit', 'onDeath', 'onBounce', 'onDespawn'];

const inputClass = 'w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1 text-sm text-msx-textprimary focus:outline-none focus:border-msx-accent';
const labelClass = 'block text-xs text-msx-textsecondary mb-1';
const sectionTitleClass = 'text-sm font-semibold text-msx-textprimary border-b border-msx-border pb-1 mb-2';

const cloneEnemy = (enemy: EnemyDefinition): EnemyDefinition => JSON.parse(JSON.stringify(enemy));

const slugify = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'enemy';

const uniqueEnemyId = (base: string, enemies: EnemyDefinition[]): string => {
  const existing = new Set(enemies.map(enemy => enemy.enemyId));
  let id = slugify(base);
  let suffix = 2;
  while (existing.has(id)) id = `${slugify(base)}_${suffix++}`;
  return id;
};

const parseFrames = (value: string): number[] =>
  value.split(',').map(part => Number(part.trim())).filter(value => Number.isFinite(value)).map(value => Math.max(0, Math.floor(value)));

const formatAsmSymbol = (value: string): string =>
  slugify(value).toUpperCase();

const buildEnemyAsmPreview = (enemy: EnemyDefinition): string => {
  const enemySymbol = `ENEMY_${formatAsmSymbol(enemy.enemyId)}`;
  const behaviorSymbol = `BEHAVIOR_${formatAsmSymbol(enemy.behavior.type)}`;
  const attackSymbol = `ATTACK_${formatAsmSymbol(enemy.attack.type)}`;
  const formatParamDefault = (param: SpawnParamSchemaItem): string => {
    if (param.type === 'boolean') return param.default ? '1' : '0';
    if (param.type === 'enum') return `${formatAsmSymbol(String(param.name))}_${formatAsmSymbol(String(param.default))}`;
    return String(param.default);
  };
  const params = enemy.spawnParamsSchema
    .sort((a, b) => a.exportParam.localeCompare(b.exportParam))
    .map(formatParamDefault);

  return [
    `${enemySymbol} EQU 0 ; assigned by export order`,
    '',
    `${enemySymbol}_DEF:`,
    `    db ${behaviorSymbol}, ${attackSymbol}`,
    `    db ${enemy.stats.hp}, ${enemy.stats.damage}`,
    `    db ${enemy.budget.cpu}, ${enemy.budget.sprites}, ${enemy.budget.ram}`,
    `    dw ${formatAsmSymbol(enemy.render.spriteId || 'missing_sprite')}_SPR`,
    '',
    `; Spawn row: enemyId, x, y, p0, p1, p2, p3`,
    `    db ${enemySymbol}, 80, 64${params.length ? `, ${params.join(', ')}` : ''}`,
    `    db $FF`,
  ].join('\n');
};

const getEnemyWarnings = (enemy: EnemyDefinition, allAssets: ProjectAsset[]): string[] => {
  const warnings: string[] = [];
  if (!enemy.render.spriteId) warnings.push('MISSING SPRITE');
  if (enemy.render.spriteId && !allAssets.some(asset => asset.id === enemy.render.spriteId)) warnings.push('SPRITE NOT FOUND');
  if (Object.keys(enemy.render.animations || {}).length === 0) warnings.push('MISSING ANIMATION');
  if (enemy.hitboxes.body.w <= 0 || enemy.hitboxes.body.h <= 0 || enemy.hitboxes.damage.w <= 0 || enemy.hitboxes.damage.h <= 0) warnings.push('INVALID HITBOX');
  if (enemy.behavior.type !== 'None' && enemy.spawnParamsSchema.length === 0) warnings.push('MISSING SPAWN PARAMS');
  if (enemy.budget.cpu > 3) warnings.push('HIGH CPU');
  if (enemy.budget.sprites > 4) warnings.push('SPRITE BUDGET');
  return warnings;
};

const patchEnemy = <T extends keyof EnemyDefinition>(enemy: EnemyDefinition, key: T, value: EnemyDefinition[T]): EnemyDefinition => ({
  ...enemy,
  [key]: value,
});

export const EnemyLibraryView: React.FC<EnemyLibraryViewProps> = ({
  enemyDefinitions,
  onUpdateEnemyDefinitions,
  allAssets,
  setStatusBarMessage,
}) => {
  const [selectedEnemyId, setSelectedEnemyId] = useState<string | null>(enemyDefinitions[0]?.enemyId || null);
  const [search, setSearch] = useState('');
  const [worldFilter, setWorldFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isGlobalLibraryOpen, setIsGlobalLibraryOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const selectedEnemy = enemyDefinitions.find(enemy => enemy.enemyId === selectedEnemyId) || null;
  const spriteAssets = allAssets.filter(asset => asset.type === 'msx2sprite' || asset.type === 'sprite');
  const soundAssets = allAssets.filter(asset => asset.type === 'sound');
  const worlds = useMemo(() => Array.from(new Set(enemyDefinitions.map(enemy => enemy.world || 'common'))).sort(), [enemyDefinitions]);

  const filteredEnemies = enemyDefinitions.filter(enemy => {
    const text = `${enemy.name} ${enemy.enemyId} ${enemy.behavior.type} ${enemy.world}`.toLowerCase();
    return text.includes(search.toLowerCase())
      && (worldFilter === 'all' || enemy.world === worldFilter)
      && (typeFilter === 'all' || enemy.category === typeFilter || enemy.behavior.type === typeFilter);
  });

  const addFromTemplate = (template: EnemyTemplate) => {
    const enemy = createEnemyFromTemplate(template, {
      existingIds: new Set(enemyDefinitions.map(item => item.enemyId)),
    });
    onUpdateEnemyDefinitions([...enemyDefinitions, enemy]);
    setSelectedEnemyId(enemy.enemyId);
    setStatusBarMessage?.(`Created enemy "${enemy.name}".`);
  };

  const addEmpty = () => {
    const enemy = createEmptyEnemyDefinition(new Set(enemyDefinitions.map(item => item.enemyId)));
    onUpdateEnemyDefinitions([...enemyDefinitions, enemy]);
    setSelectedEnemyId(enemy.enemyId);
  };

  const duplicateSelected = () => {
    if (!selectedEnemy) return;
    const copy = cloneEnemy(selectedEnemy);
    copy.enemyId = uniqueEnemyId(`${selectedEnemy.enemyId}_copy`, enemyDefinitions);
    copy.name = `${selectedEnemy.name} Copy`;
    onUpdateEnemyDefinitions([...enemyDefinitions, copy]);
    setSelectedEnemyId(copy.enemyId);
  };

  const removeSelected = () => {
    if (!selectedEnemy) return;
    if (!window.confirm(`Remove enemy "${selectedEnemy.name}" from the project library? Screen spawn references are kept for now.`)) return;
    const next = enemyDefinitions.filter(enemy => enemy.enemyId !== selectedEnemy.enemyId);
    onUpdateEnemyDefinitions(next);
    setSelectedEnemyId(next[0]?.enemyId || null);
  };

  const updateSelected = (next: EnemyDefinition) => {
    const previousId = selectedEnemy?.enemyId || next.enemyId;
    onUpdateEnemyDefinitions(prev => {
      const exists = prev.some(item => item.enemyId === previousId);
      return exists ? prev.map(item => item.enemyId === previousId ? next : item) : [...prev, next];
    });
    setSelectedEnemyId(next.enemyId);
  };

  const updateParam = (index: number, patch: Partial<SpawnParamSchemaItem>) => {
    if (!selectedEnemy) return;
    const nextParams = selectedEnemy.spawnParamsSchema.map((param, currentIndex) => currentIndex === index ? { ...param, ...patch } : param);
    updateSelected({ ...selectedEnemy, spawnParamsSchema: nextParams });
  };

  const importEnemies = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const incoming: EnemyDefinition[] = Array.isArray(parsed) ? parsed : [parsed];
        const existingIds = new Set(enemyDefinitions.map(enemy => enemy.enemyId));
        const remapped = incoming.map(raw => {
          const enemy = raw as EnemyDefinition;
          const next = cloneEnemy(enemy);
          if (!next.enemyId || existingIds.has(next.enemyId)) next.enemyId = uniqueEnemyId(next.name || 'imported_enemy', [...enemyDefinitions, ...incoming]);
          existingIds.add(next.enemyId);
          return next;
        });
        onUpdateEnemyDefinitions([...enemyDefinitions, ...remapped]);
        setSelectedEnemyId(remapped[0]?.enemyId || selectedEnemyId);
        setStatusBarMessage?.(`Imported ${remapped.length} enemy definition(s).`);
      } catch (error) {
        alert(`Enemy import failed: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        if (importInputRef.current) importInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const exportSelected = () => {
    if (!selectedEnemy) return;
    downloadTextFile(`${selectedEnemy.enemyId}.enemy.json`, JSON.stringify(selectedEnemy, null, 2), 'application/json');
  };

  const exportAll = () => {
    downloadTextFile('mideas_enemy_library.json', JSON.stringify(enemyDefinitions, null, 2), 'application/json');
  };

  const exportSelectedToLibrary = () => {
    if (!selectedEnemy) return;
    const entry = addEntryToMsx2EnemyLibrary(selectedEnemy, selectedEnemy.name);
    setStatusBarMessage?.(`Exported "${entry.name}" to the global MSX2 Enemies Library.`);
    alert(`Exported "${entry.name}" to the global MSX2 Enemies Library.`);
  };

  const importFromLibrary = (enemy: EnemyDefinition) => {
    const next = cloneEnemy(enemy);
    if (!next.enemyId || enemyDefinitions.some(item => item.enemyId === next.enemyId)) {
      next.enemyId = uniqueEnemyId(next.name || 'imported_enemy', enemyDefinitions);
    }
    onUpdateEnemyDefinitions([...enemyDefinitions, next]);
    setSelectedEnemyId(next.enemyId);
  };

  return (
    <>
    <div className="h-full min-h-0 flex gap-2 p-2 overflow-hidden">
      <Panel title="Enemy Library MSX2" icon={<SpriteIcon />} className="w-[34rem] flex-shrink-0" bodyClassName="p-2 overflow-auto">
        <div className="flex gap-1 mb-2 flex-wrap">
          <Button size="sm" icon={<PlusCircleIcon />} onClick={addEmpty}>Empty</Button>
          <Button size="sm" variant="secondary" onClick={duplicateSelected} disabled={!selectedEnemy}>Duplicate</Button>
          <Button size="sm" variant="danger" icon={<TrashIcon />} onClick={removeSelected} disabled={!selectedEnemy}>Remove</Button>
          <Button size="sm" variant="ghost" icon={<SaveIcon />} onClick={exportSelected} disabled={!selectedEnemy}>Export</Button>
          <Button size="sm" variant="ghost" icon={<SaveIcon />} onClick={exportAll} disabled={enemyDefinitions.length === 0}>Export All</Button>
          <input ref={importInputRef} type="file" accept=".json" className="hidden" onChange={importEnemies} />
          <Button size="sm" variant="ghost" icon={<LoadIcon />} onClick={() => importInputRef.current?.click()}>Import</Button>
          <Button size="sm" variant="secondary" icon={<SaveIcon />} onClick={exportSelectedToLibrary} disabled={!selectedEnemy} title="Save the selected enemy to the global MSX2 Enemies Library (persists across projects).">Export to Library</Button>
          <Button size="sm" variant="primary" icon={<PuzzlePieceIcon />} onClick={() => setIsGlobalLibraryOpen(true)} title="Open the global MSX2 Enemies Library to import enemies into this project.">Library</Button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-2">
          <input className={inputClass} placeholder="Search" value={search} onChange={event => setSearch(event.target.value)} />
          <select className={inputClass} value={worldFilter} onChange={event => setWorldFilter(event.target.value)}>
            <option value="all">All worlds</option>
            {worlds.map(world => <option key={world} value={world}>{world}</option>)}
          </select>
          <select className={inputClass} value={typeFilter} onChange={event => setTypeFilter(event.target.value)}>
            <option value="all">All types</option>
            {['simpleEnemy', 'boss', 'hazard', 'projectileLike', ...BEHAVIOR_OPTIONS].map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>

        <div className="border border-msx-border rounded overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-msx-bgcolor text-msx-textsecondary">
              <tr>
                <th className="text-left p-1">Name</th>
                <th className="text-left p-1">World</th>
                <th className="text-left p-1">Behavior</th>
                <th className="text-left p-1">CPU</th>
                <th className="text-left p-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnemies.map(enemy => {
                const warnings = getEnemyWarnings(enemy, allAssets);
                const isSelected = selectedEnemyId === enemy.enemyId;
                return (
                  <tr
                    key={enemy.enemyId}
                    onClick={() => setSelectedEnemyId(enemy.enemyId)}
                    className={`cursor-pointer border-t border-msx-border ${isSelected ? 'bg-msx-accent text-white' : 'hover:bg-msx-border/60 text-msx-textprimary'}`}
                  >
                    <td className="p-1 font-medium">{enemy.name}</td>
                    <td className="p-1">{enemy.world}</td>
                    <td className="p-1">{enemy.behavior.type}</td>
                    <td className="p-1">{enemy.budget.cpu}</td>
                    <td className="p-1">{warnings.length === 0 ? 'OK' : warnings[0]}</td>
                  </tr>
                );
              })}
              {filteredEnemies.length === 0 && (
                <tr><td className="p-2 text-msx-textsecondary italic" colSpan={5}>No enemies match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3">
          <h4 className={sectionTitleClass}>Global Templates</h4>
          <div className="grid grid-cols-2 gap-1">
            {GLOBAL_ENEMY_TEMPLATES.map(template => (
              <Button key={template.templateId} size="sm" variant="ghost" justify="start" onClick={() => addFromTemplate(template)}>
                {template.name}
              </Button>
            ))}
          </div>
        </div>
      </Panel>

      <Panel title={selectedEnemy ? `Enemy Editor MSX2: ${selectedEnemy.name}` : 'Enemy Editor MSX2'} className="flex-grow min-w-0" bodyClassName="p-3 overflow-auto">
        {!selectedEnemy ? (
          <p className="text-msx-textsecondary">Create or select an enemy to edit.</p>
        ) : (
          <div className="grid grid-cols-12 gap-3">
            <section className="col-span-4 space-y-2">
              <h4 className={sectionTitleClass}>General</h4>
              <label><span className={labelClass}>enemyId</span><input className={inputClass} value={selectedEnemy.enemyId} onChange={event => updateSelected({ ...selectedEnemy, enemyId: slugify(event.target.value) })} /></label>
              <label><span className={labelClass}>name</span><input className={inputClass} value={selectedEnemy.name} onChange={event => updateSelected(patchEnemy(selectedEnemy, 'name', event.target.value))} /></label>
              <label><span className={labelClass}>category</span><select className={inputClass} value={selectedEnemy.category} onChange={event => updateSelected(patchEnemy(selectedEnemy, 'category', event.target.value as EnemyDefinition['category']))}>{['simpleEnemy', 'boss', 'hazard', 'projectileLike'].map(value => <option key={value}>{value}</option>)}</select></label>
              <label><span className={labelClass}>world</span><input className={inputClass} value={selectedEnemy.world} onChange={event => updateSelected(patchEnemy(selectedEnemy, 'world', event.target.value || 'common'))} /></label>
              <label><span className={labelClass}>behaviorGroup</span><input className={inputClass} value={selectedEnemy.behaviorGroup} onChange={event => updateSelected(patchEnemy(selectedEnemy, 'behaviorGroup', event.target.value))} /></label>
              <label><span className={labelClass}>scope</span><select className={inputClass} value={selectedEnemy.scope} onChange={event => updateSelected(patchEnemy(selectedEnemy, 'scope', event.target.value as EnemyLibraryScope))}>{SCOPE_OPTIONS.map(value => <option key={value}>{value}</option>)}</select></label>

              <h4 className={sectionTitleClass}>Behavior</h4>
              <label><span className={labelClass}>behavior type</span><select className={inputClass} value={selectedEnemy.behavior.type} onChange={event => updateSelected({ ...selectedEnemy, behavior: { ...selectedEnemy.behavior, type: event.target.value as EnemyBehaviorType } })}>{BEHAVIOR_OPTIONS.map(value => <option key={value}>{value}</option>)}</select></label>
              <label><span className={labelClass}>required routines</span><input className={inputClass} value={selectedEnemy.requiredRoutines.join(', ')} onChange={event => updateSelected({ ...selectedEnemy, requiredRoutines: event.target.value.split(',').map(value => value.trim()).filter(Boolean) })} /></label>
            </section>

            <section className="col-span-4 space-y-2">
              <h4 className={sectionTitleClass}>Render & Animations</h4>
              <label><span className={labelClass}>renderMode</span><select className={inputClass} value={selectedEnemy.render.renderMode} onChange={event => updateSelected({ ...selectedEnemy, render: { ...selectedEnemy.render, renderMode: event.target.value as EnemyDefinition['render']['renderMode'] } })}>{['hardwareSprite', 'softwareSprite', 'hybrid'].map(value => <option key={value}>{value}</option>)}</select></label>
              <label><span className={labelClass}>spriteSet</span><select className={inputClass} value={selectedEnemy.render.spriteId} onChange={event => updateSelected({ ...selectedEnemy, render: { ...selectedEnemy.render, spriteId: event.target.value } })}><option value="">Missing sprite</option>{spriteAssets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select></label>
              <label><span className={labelClass}>palette</span><input className={inputClass} value={selectedEnemy.render.palette} onChange={event => updateSelected({ ...selectedEnemy, render: { ...selectedEnemy.render, palette: event.target.value } })} /></label>
              <label><span className={labelClass}>spriteSize</span><select className={inputClass} value={selectedEnemy.render.size} onChange={event => updateSelected({ ...selectedEnemy, render: { ...selectedEnemy.render, size: event.target.value as EnemyDefinition['render']['size'] } })}>{['16x16', '16x32', '32x16', '32x32'].map(value => <option key={value}>{value}</option>)}</select></label>
              {Object.entries(selectedEnemy.render.animations).map(([id, animation]) => (
                <div key={id} className="border border-msx-border rounded p-2">
                  <div className="flex gap-2">
                    <input className={inputClass} value={id} readOnly title="Animation id" />
                    <Button size="sm" variant="danger" onClick={() => {
                      const animations = { ...selectedEnemy.render.animations };
                      delete animations[id];
                      updateSelected({ ...selectedEnemy, render: { ...selectedEnemy.render, animations } });
                    }}>Remove</Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <label><span className={labelClass}>frames</span><input className={inputClass} value={animation.frames.join(',')} onChange={event => updateSelected({ ...selectedEnemy, render: { ...selectedEnemy.render, animations: { ...selectedEnemy.render.animations, [id]: { ...animation, frames: parseFrames(event.target.value) } } } })} /></label>
                    <label><span className={labelClass}>speed</span><input className={inputClass} type="number" value={animation.speed} onChange={event => updateSelected({ ...selectedEnemy, render: { ...selectedEnemy.render, animations: { ...selectedEnemy.render.animations, [id]: { ...animation, speed: Number(event.target.value) || 0 } } } })} /></label>
                    <label className="flex items-end gap-2 text-xs text-msx-textsecondary"><input type="checkbox" checked={animation.loop} onChange={event => updateSelected({ ...selectedEnemy, render: { ...selectedEnemy.render, animations: { ...selectedEnemy.render.animations, [id]: { ...animation, loop: event.target.checked } } } })} /> loop</label>
                  </div>
                </div>
              ))}
              <Button size="sm" variant="ghost" onClick={() => updateSelected({ ...selectedEnemy, render: { ...selectedEnemy.render, animations: { ...selectedEnemy.render.animations, [`anim_${Object.keys(selectedEnemy.render.animations).length + 1}`]: { frames: [0], speed: 4, loop: true } } } })}>Add Animation</Button>
            </section>

            <section className="col-span-4 space-y-2">
              <h4 className={sectionTitleClass}>Attack & Damage</h4>
              <label><span className={labelClass}>attack type</span><select className={inputClass} value={selectedEnemy.attack.type} onChange={event => updateSelected({ ...selectedEnemy, attack: { ...selectedEnemy.attack, type: event.target.value as EnemyAttackType } })}>{ATTACK_OPTIONS.map(value => <option key={value}>{value}</option>)}</select></label>
              <div className="grid grid-cols-2 gap-2">
                <label><span className={labelClass}>hp</span><input className={inputClass} type="number" value={selectedEnemy.stats.hp} onChange={event => updateSelected({ ...selectedEnemy, stats: { ...selectedEnemy.stats, hp: Number(event.target.value) || 0 } })} /></label>
                <label><span className={labelClass}>contactDamage</span><input className={inputClass} type="number" value={selectedEnemy.stats.damage} onChange={event => updateSelected({ ...selectedEnemy, stats: { ...selectedEnemy.stats, damage: Number(event.target.value) || 0 } })} /></label>
                <label><span className={labelClass}>fireRate</span><input className={inputClass} type="number" value={selectedEnemy.attack.fireRate || 0} onChange={event => updateSelected({ ...selectedEnemy, attack: { ...selectedEnemy.attack, fireRate: Number(event.target.value) || 0 } })} /></label>
                <label><span className={labelClass}>maxProjectiles</span><input className={inputClass} type="number" value={selectedEnemy.attack.maxProjectiles || 0} onChange={event => updateSelected({ ...selectedEnemy, attack: { ...selectedEnemy.attack, maxProjectiles: Number(event.target.value) || 0 } })} /></label>
              </div>

              <h4 className={sectionTitleClass}>Hitboxes</h4>
              {(['body', 'damage'] as const).map(kind => (
                <div key={kind} className="grid grid-cols-5 gap-1 items-end">
                  <span className="text-xs text-msx-textsecondary">{kind}</span>
                  {(['x', 'y', 'w', 'h'] as const).map(field => (
                    <input key={field} className={inputClass} type="number" title={`${kind}.${field}`} value={selectedEnemy.hitboxes[kind][field]} onChange={event => updateSelected({ ...selectedEnemy, hitboxes: { ...selectedEnemy.hitboxes, [kind]: { ...selectedEnemy.hitboxes[kind], [field]: Number(event.target.value) || 0 } } })} />
                  ))}
                </div>
              ))}

              <h4 className={sectionTitleClass}>Sound</h4>
              {SOUND_EVENTS.map(eventName => (
                <label key={eventName}><span className={labelClass}>{eventName}</span><select className={inputClass} value={selectedEnemy.sound[eventName] || ''} onChange={event => updateSelected({ ...selectedEnemy, sound: { ...selectedEnemy.sound, [eventName]: event.target.value || null } })}><option value="">None</option>{soundAssets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select></label>
              ))}
            </section>

            <section className="col-span-6 space-y-2">
              <h4 className={sectionTitleClass}>Spawn Params Schema</h4>
              {selectedEnemy.spawnParamsSchema.map((param, index) => (
                <div key={`${param.exportParam}_${index}`} className="grid grid-cols-7 gap-1 items-end border border-msx-border rounded p-1">
                  <input className={inputClass} value={param.name} onChange={event => updateParam(index, { name: event.target.value })} />
                  <input className={inputClass} value={param.label || ''} placeholder="label" onChange={event => updateParam(index, { label: event.target.value })} />
                  <select className={inputClass} value={param.type} onChange={event => updateParam(index, { type: event.target.value as SpawnParamSchemaItem['type'] })}>{['byte', 'int', 'enum', 'boolean'].map(value => <option key={value}>{value}</option>)}</select>
                  <input className={inputClass} value={String(param.default)} onChange={event => updateParam(index, { default: param.type === 'boolean' ? event.target.value === 'true' : param.type === 'enum' ? event.target.value : Number(event.target.value) || 0 })} />
                  <input className={inputClass} value={(param.values || []).join(',')} placeholder="enum values" onChange={event => updateParam(index, { values: event.target.value.split(',').map(value => value.trim()).filter(Boolean) })} />
                  <select className={inputClass} value={param.exportParam} onChange={event => updateParam(index, { exportParam: event.target.value as SpawnParamSchemaItem['exportParam'] })}>{['p0', 'p1', 'p2', 'p3'].map(value => <option key={value}>{value}</option>)}</select>
                  <Button size="sm" variant="danger" onClick={() => updateSelected({ ...selectedEnemy, spawnParamsSchema: selectedEnemy.spawnParamsSchema.filter((_, currentIndex) => currentIndex !== index) })}>Del</Button>
                </div>
              ))}
              <Button size="sm" variant="ghost" onClick={() => updateSelected({ ...selectedEnemy, spawnParamsSchema: [...selectedEnemy.spawnParamsSchema, { name: `param${selectedEnemy.spawnParamsSchema.length}`, type: 'byte', default: 0, min: 0, max: 255, exportParam: `p${Math.min(3, selectedEnemy.spawnParamsSchema.length)}` as SpawnParamSchemaItem['exportParam'] }] })}>Add Param</Button>
            </section>

            <section className="col-span-6 space-y-2">
              <h4 className={sectionTitleClass}>Budget MSX2</h4>
              <div className="grid grid-cols-3 gap-2">
                <label><span className={labelClass}>CPU</span><input className={inputClass} type="number" value={selectedEnemy.budget.cpu} onChange={event => updateSelected({ ...selectedEnemy, budget: { ...selectedEnemy.budget, cpu: Number(event.target.value) || 0 } })} /></label>
                <label><span className={labelClass}>Sprites</span><input className={inputClass} type="number" value={selectedEnemy.budget.sprites} onChange={event => updateSelected({ ...selectedEnemy, budget: { ...selectedEnemy.budget, sprites: Number(event.target.value) || 0 } })} /></label>
                <label><span className={labelClass}>RAM</span><input className={inputClass} type="number" value={selectedEnemy.budget.ram} onChange={event => updateSelected({ ...selectedEnemy, budget: { ...selectedEnemy.budget, ram: Number(event.target.value) || 0 } })} /></label>
                <label><span className={labelClass}>codePackage</span><input className={inputClass} value={selectedEnemy.budget.codePackage} onChange={event => updateSelected({ ...selectedEnemy, budget: { ...selectedEnemy.budget, codePackage: event.target.value } })} /></label>
                <label><span className={labelClass}>graphicsPackage</span><input className={inputClass} value={selectedEnemy.budget.graphicsPackage || ''} onChange={event => updateSelected({ ...selectedEnemy, budget: { ...selectedEnemy.budget, graphicsPackage: event.target.value } })} /></label>
                <label><span className={labelClass}>graphicsBank</span><input className={inputClass} value={selectedEnemy.budget.graphicsBank || ''} onChange={event => updateSelected({ ...selectedEnemy, budget: { ...selectedEnemy.budget, graphicsBank: event.target.value } })} /></label>
              </div>
              <h4 className={sectionTitleClass}>ASM Export Preview</h4>
              <pre className="bg-msx-bgcolor border border-msx-border rounded p-2 text-xs text-msx-textprimary overflow-auto whitespace-pre-wrap">{buildEnemyAsmPreview(selectedEnemy)}</pre>
              <h4 className={sectionTitleClass}>Validation</h4>
              <div className="flex gap-1 flex-wrap">
                {getEnemyWarnings(selectedEnemy, allAssets).length === 0
                  ? <span className="px-2 py-1 rounded bg-msx-highlight text-msx-bgcolor text-xs font-semibold">OK</span>
                  : getEnemyWarnings(selectedEnemy, allAssets).map(warning => <span key={warning} className="px-2 py-1 rounded bg-msx-danger text-white text-xs font-semibold">{warning}</span>)}
              </div>
            </section>
          </div>
        )}
      </Panel>
    </div>
    {isGlobalLibraryOpen && (
      <Msx2EnemyLibraryModal
        isOpen={isGlobalLibraryOpen}
        onClose={() => setIsGlobalLibraryOpen(false)}
        setStatusBarMessage={setStatusBarMessage}
        onImportEnemy={importFromLibrary}
      />
    )}
    </>
  );
};
