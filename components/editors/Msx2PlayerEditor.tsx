import React, { useMemo, useRef, useState } from 'react';
import { MSXColorValue, Msx2PlayerDefinition, Msx2Sprite, ProjectAsset } from '../../types';
import { normalizeMsx2PlayerDefinition } from '../../utils/msx2PlayerDefaults';

interface Msx2PlayerEditorProps {
  player: Msx2PlayerDefinition;
  onUpdate: (data: Partial<Msx2PlayerDefinition>) => void;
  allAssets: ProjectAsset[];
}

const navItems = [
  'General',
  'Graphics & Animations',
  'Physics & Movement',
  'Controls',
  'Combat & Damage',
  'Abilities & Items',
  'States & Logic',
  'Sounds',
  'Spawn & Respawn',
  'Preview',
] as const;

type PlayerConfigSection = typeof navItems[number];

const inputClass = 'h-7 w-full rounded border border-slate-700 bg-[#111821] px-2 text-xs text-slate-100 outline-none focus:border-blue-500';
const selectClass = `${inputClass} pr-6`;
const panelClass = 'flex min-h-0 flex-col overflow-hidden rounded border border-slate-700 bg-[#1d2430] shadow-sm';
const panelTitleClass = 'flex-shrink-0 border-b border-slate-700 px-3 py-2 text-xs font-bold uppercase tracking-wide text-sky-300';

const numberValue = (value: unknown, fallback = 0): number => Number.isFinite(Number(value)) ? Number(value) : fallback;

const spriteSizeToDimensions = (size: Msx2PlayerDefinition['render']['spriteSize']) => {
  const [width, height] = size.split('x').map(value => Number(value));
  return { width: width || 16, height: height || 16 };
};

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

const Checkbox: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 text-xs text-slate-100">
    <input
      type="checkbox"
      checked={checked}
      onChange={event => onChange(event.target.checked)}
      className="h-3.5 w-3.5 accent-blue-500"
    />
    {label}
  </label>
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
  large?: boolean;
  className?: string;
}> = ({ sprite, large = false, className = '' }) => {
  const frame = sprite?.frames?.[sprite.currentFrameIndex] || sprite?.frames?.[0];
  const pixels = frame?.data;
  const width = sprite?.size?.width || pixels?.[0]?.length || 16;
  const height = sprite?.size?.height || pixels?.length || 16;
  const backgroundColor = String(sprite?.backgroundColor || '').toUpperCase();
  const scale = large ? Math.min(5, Math.max(2, Math.floor(112 / Math.max(width, height)))) : Math.min(4, Math.max(2, Math.floor(84 / Math.max(width, height))));

  if (!pixels?.length) {
    return <PlayerPixelArt large={large} />;
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

export const Msx2PlayerEditor: React.FC<Msx2PlayerEditorProps> = ({ player, onUpdate, allAssets }) => {
  const normalized = useMemo(() => normalizeMsx2PlayerDefinition(player), [player]);
  const [activeSection, setActiveSection] = useState<PlayerConfigSection>('General');
  const importRef = useRef<HTMLInputElement>(null);
  const spriteAssets = allAssets.filter(asset => asset.type === 'msx2sprite');
  const paletteAssets = allAssets.filter(asset => asset.type === 'palette');
  const selectedSprite = useMemo(
    () => spriteAssets.find(asset => asset.id === normalized.render.spriteAssetId)?.data as Msx2Sprite | undefined,
    [normalized.render.spriteAssetId, spriteAssets]
  );
  const spriteSize = spriteSizeToDimensions(normalized.render.spriteSize);
  const body = normalized.hitboxes.body;
  const attack = normalized.hitboxes.attack || { x: 4, y: 6, w: 8, h: 12 };
  const worldCompatibility = normalized.worldCompatibility || ['all'];

  const updateRender = (patch: Partial<Msx2PlayerDefinition['render']>) => onUpdate({ render: { ...normalized.render, ...patch } });
  const updateMovement = (patch: Partial<Msx2PlayerDefinition['movement']>) => onUpdate({ movement: { ...normalized.movement, ...patch } });
  const updateHealth = (patch: Partial<Msx2PlayerDefinition['health']>) => onUpdate({ health: { ...normalized.health, ...patch } });
  const updateAttack = (patch: Partial<Msx2PlayerDefinition['attack']>) => onUpdate({ attack: { ...normalized.attack, ...patch } });
  const updateBodyHitbox = (patch: Partial<typeof body>) => onUpdate({ hitboxes: { ...normalized.hitboxes, body: { ...body, ...patch } } });
  const updateAttackHitbox = (patch: Partial<typeof attack>) => onUpdate({ hitboxes: { ...normalized.hitboxes, attack: { ...attack, ...patch } } });
  const updateWorld = (world: string, checked: boolean) => {
    const next = checked
      ? Array.from(new Set([...worldCompatibility.filter(value => value !== 'all'), world]))
      : worldCompatibility.filter(value => value !== world);
    onUpdate({ worldCompatibility: next.length ? next : ['all'] });
  };

  const exportPlayer = () => {
    const blob = new Blob([JSON.stringify(normalized, null, 2)], { type: 'application/json' });
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
        onUpdate(normalizeMsx2PlayerDefinition(JSON.parse(String(reader.result))));
      } catch {
        window.alert('Invalid MSX2 player JSON.');
      }
    };
    reader.readAsText(file);
  };

  const animationRows = Object.entries(normalized.animations).map(([name, animation], index) => ({
    id: index,
    name,
    type: name === 'hurt' || name === 'death' ? 'Once' : 'Loop',
    frames: animation.frames.length,
    speed: animation.speed,
  }));

  return (
    <div className="h-full min-h-0 overflow-hidden bg-[#11161f] text-slate-100">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex h-11 flex-shrink-0 items-center gap-3 border-b border-slate-800 bg-[#151a23] px-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="text-xs font-semibold text-slate-100">Player Name:</span>
            <input className={`${inputClass} max-w-[320px]`} value={normalized.name} onChange={event => onUpdate({ name: event.target.value })} />
          </div>
          <button className="h-8 rounded border border-slate-700 bg-[#242c38] px-5 text-xs hover:bg-[#2d3747]" type="button" onClick={() => navigator.clipboard?.writeText(JSON.stringify(normalized, null, 2))}>Duplicate</button>
          <button className="h-8 rounded border border-slate-700 bg-[#242c38] px-5 text-xs hover:bg-[#2d3747]" type="button" onClick={exportPlayer}>Export...</button>
          <button className="h-8 rounded border border-slate-700 bg-[#242c38] px-5 text-xs hover:bg-[#2d3747]" type="button" onClick={() => importRef.current?.click()}>Import...</button>
          <button className="h-8 rounded border border-blue-700 bg-blue-700 px-6 text-xs font-semibold hover:bg-blue-600" type="button" onClick={() => onUpdate(normalized)}>Save</button>
          <input ref={importRef} type="file" accept=".json,.player.json,application/json" className="hidden" onChange={event => importPlayer(event.target.files?.[0])} />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[238px_1fr] gap-2 overflow-hidden p-2">
          <aside className="grid min-h-0 grid-rows-[1fr_330px] gap-2">
            <section className={panelClass}>
              <div className={panelTitleClass}>Player Config</div>
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
                    <SpriteFramePreview sprite={selectedSprite} large />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button className="h-8 w-8 rounded border border-slate-700 bg-[#242c38] text-xs" type="button">&gt;</button>
                  <button className="h-8 w-8 rounded border border-slate-700 bg-[#242c38] text-xs" type="button">[]</button>
                  <select className={`${selectClass} flex-1`} value="idle" onChange={() => undefined}>
                    <option value="idle">Anim: Idle Down</option>
                    <option value="walk">Anim: Walk Right</option>
                    <option value="jump">Anim: Jump</option>
                    <option value="hurt">Anim: Hurt</option>
                  </select>
                </div>
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
                  <div className="grid grid-cols-[96px_1fr] items-center gap-2 text-xs">
                    <span>Worlds:</span>
                    <div className="grid grid-cols-4 gap-2">
                      {['World 1', 'World 2', 'World 3', 'World 4'].map(world => (
                        <Checkbox key={world} label={world} checked={worldCompatibility.includes(world) || worldCompatibility.includes('all')} onChange={checked => updateWorld(world, checked)} />
                      ))}
                    </div>
                  </div>
                  <Field label="Initial Health"><SmallNumber value={normalized.health.maxHealth} onChange={value => updateHealth({ maxHealth: value })} /></Field>
                  <Field label="Max Health"><SmallNumber value={normalized.health.maxHealth} onChange={value => updateHealth({ maxHealth: value })} /></Field>
                  <Field label="Initial Lives"><SmallNumber value={normalized.health.lives} onChange={value => updateHealth({ lives: value })} /></Field>
                  <Field label="Default Facing">
                    <select className={selectClass} value="right" onChange={() => undefined}>
                      <option>Right</option>
                      <option>Left</option>
                      <option>Up</option>
                      <option>Down</option>
                    </select>
                  </Field>
                  <div className="grid grid-cols-[96px_1fr] items-center gap-2 text-xs">
                    <span>Size (px):</span>
                    <div className="grid grid-cols-4 items-center gap-2">
                      <span>Width:</span><input className={inputClass} readOnly value={spriteSize.width} />
                      <span>Height:</span><input className={inputClass} readOnly value={spriteSize.height} />
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
                </div>
              </section>

              <section className={`${panelClass} ${activeSection === 'Physics & Movement' ? 'absolute inset-0' : 'hidden'}`}>
                <div className={panelTitleClass}>Physics & Movement</div>
                <div className="grid min-h-0 flex-1 grid-cols-[minmax(260px,1fr)_270px] gap-3 overflow-hidden p-3">
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
                  <div className="relative min-h-[220px] overflow-hidden rounded border border-slate-700 bg-[#141a24] p-3">
                    <div className="absolute left-16 top-5 h-px w-16 bg-green-300" />
                    <div className="absolute left-[88px] top-3 text-xs text-green-200">{spriteSize.width}</div>
                    <div className="absolute right-10 top-14 h-24 w-px bg-green-300" />
                    <div className="absolute right-12 top-[82px] text-xs text-green-200">{spriteSize.height}</div>
                    <div className="absolute left-16 top-10 h-24 w-16 border border-green-500/70">
                      <div className="flex h-full w-full items-center justify-center">
                        <SpriteFramePreview sprite={selectedSprite} />
                      </div>
                    </div>
                    <div className="absolute bottom-12 left-16 h-20 w-16 border border-red-500/80">
                      <div className="flex h-full w-full items-center justify-center">
                        <SpriteFramePreview sprite={selectedSprite} />
                      </div>
                    </div>
                    <div className="absolute bottom-6 right-4 space-y-2 text-xs">
                      <div className="flex items-center gap-2"><span className="h-3 w-3 border border-green-400" />Sprite Size</div>
                      <div className="flex items-center gap-2"><span className="h-3 w-3 border border-red-500" />Collision Box</div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="grid min-h-0 grid-cols-[1.15fr_0.72fr_0.78fr] gap-2">
              <section className={`${panelClass} ${activeSection === 'Graphics & Animations' ? 'absolute inset-0' : 'hidden'}`}>
                <div className={panelTitleClass}>Graphics & Animations</div>
                <div className="grid min-h-0 flex-1 grid-cols-[minmax(260px,1fr)_72px] gap-3 overflow-hidden p-3">
                  <div className="min-h-0 space-y-2 overflow-hidden">
                    <Field label="Sprite Set">
                      <select className={selectClass} value={normalized.render.spriteAssetId || ''} onChange={event => updateRender({ spriteAssetId: event.target.value || undefined })}>
                        <option value="">hero_set_01.chr</option>
                        {spriteAssets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                      </select>
                    </Field>
                    <Field label="Color Palette">
                      <select className={selectClass} value={normalized.render.paletteAssetId || ''} onChange={event => updateRender({ paletteAssetId: event.target.value || undefined })}>
                        <option value="">default_player.pal</option>
                        {paletteAssets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                      </select>
                    </Field>
                    <Field label="Animations"><SmallNumber value={animationRows.length} onChange={() => undefined} /></Field>
                    <div className="max-h-[150px] overflow-auto rounded border border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-[#151b25] text-slate-200">
                          <tr><th className="px-2 py-1">ID</th><th>Name</th><th>Type</th><th>Frames</th><th>Speed</th></tr>
                        </thead>
                        <tbody>
                          {animationRows.map(row => (
                            <tr key={row.name} className="border-t border-slate-800">
                              <td className="px-2 py-1">{row.id}</td><td>{row.name}</td><td>{row.type}</td><td>{row.frames}</td><td>{row.speed}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {['Add', 'Edit', 'Duplicate', 'Delete', 'Up', 'Down'].map(label => (
                      <button key={label} type="button" className="h-7 rounded border border-slate-700 bg-[#242c38] text-xs hover:bg-[#2d3747]">{label}</button>
                    ))}
                  </div>
                </div>
              </section>

              <section className={`${panelClass} ${activeSection === 'Controls' ? 'absolute inset-0' : 'hidden'}`}>
                <div className={panelTitleClass}>Controls</div>
                <div className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
                  {[
                    ['Left', 'left', 'Left Arrow'],
                    ['Right', 'right', 'Right Arrow'],
                    ['Up', 'up', 'Up Arrow / Z'],
                    ['Down / Crouch', 'down', 'Down Arrow'],
                    ['Jump', 'jump', 'Space / X'],
                    ['Attack', 'attack', 'Ctrl / C'],
                    ['Use / Action', 'interact', 'Enter / V'],
                  ].map(([label, key, fallback]) => (
                    <Field key={key} label={label}>
                      <select
                        className={selectClass}
                        value={normalized.inputMapping[key] || fallback}
                        onChange={event => onUpdate({ inputMapping: { ...normalized.inputMapping, [key]: event.target.value } })}
                      >
                        <option>{fallback}</option>
                        <option>Joystick</option>
                        <option>Keyboard</option>
                      </select>
                    </Field>
                  ))}
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
                  <div className="grid grid-cols-4 items-center gap-2 text-xs">
                    <span>Hit Box:</span><span>Left</span><SmallNumber value={attack.x} onChange={value => updateAttackHitbox({ x: value })} /><span />
                    <span /><span>Top</span><SmallNumber value={attack.y} onChange={value => updateAttackHitbox({ y: value })} /><span />
                    <span /><span>Width</span><SmallNumber value={attack.w} onChange={value => updateAttackHitbox({ w: value })} /><span />
                    <span /><span>Height</span><SmallNumber value={attack.h} onChange={value => updateAttackHitbox({ h: value })} /><span />
                  </div>
                  <Field label="I-Time" suffix="frames"><SmallNumber value={normalized.health.invulnerabilityFrames} onChange={value => updateHealth({ invulnerabilityFrames: value })} /></Field>
                  <Field label="Knockback"><SmallNumber step={0.01} value={numberValue(normalized.health.knockbackX, 1)} onChange={value => updateHealth({ knockbackX: value })} /></Field>
                  <Checkbox label="Can Take Damage" checked={true} onChange={() => undefined} />
                </div>
              </section>
            </div>

            <div className="grid min-h-0 grid-cols-[0.8fr_0.9fr_1fr_0.72fr] gap-2">
              <section className={`${panelClass} ${activeSection === 'Abilities & Items' ? 'absolute inset-0' : 'hidden'}`}>
                <div className={panelTitleClass}>Abilities & Items</div>
                <div className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
                  <Field label="Start Items"><input className={inputClass} value={(normalized.inventoryHooks || []).join(', ') || 'Sword, Shield'} onChange={event => onUpdate({ inventoryHooks: event.target.value.split(',').map(value => value.trim()).filter(Boolean) })} /></Field>
                  <Field label="Max Items"><SmallNumber value={6} onChange={() => undefined} /></Field>
                  <Checkbox label="Can Use Items" checked={true} onChange={() => undefined} />
                  <Checkbox label="Can Use Magic" checked={true} onChange={() => undefined} />
                </div>
              </section>
              <section className={`${panelClass} ${activeSection === 'States & Logic' ? 'absolute inset-0' : 'hidden'}`}>
                <div className={panelTitleClass}>States & Logic</div>
                <div className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
                  <Field label="State Machine"><input className={inputClass} value={normalized.basedOnTemplate || 'default_player.fsm'} onChange={event => onUpdate({ basedOnTemplate: event.target.value })} /></Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Checkbox label="Is Player" checked={true} onChange={() => undefined} />
                    <Checkbox label="Blocks Projectiles" checked={true} onChange={() => undefined} />
                    <Checkbox label="Affects Enemies" checked={true} onChange={() => undefined} />
                    <Checkbox label="Pushable" checked={false} onChange={() => undefined} />
                    <Checkbox label="Triggers Events" checked={true} onChange={() => undefined} />
                    <Checkbox label="Can Die" checked={true} onChange={() => undefined} />
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
                <p>Define all properties of the player character here. The player will be available in the Screen Editor for the selected worlds.</p>
                <p className="mt-3">Changes can be tested in the preview at any time.</p>
              </section>
            </div>
            <section className={`${panelClass} ${activeSection === 'Sounds' ? 'absolute inset-0' : 'hidden'}`}>
              <div className={panelTitleClass}>Sounds</div>
              <div className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
                {[
                  ['Jump', 'onJump', 'sfx_jump'],
                  ['Hit', 'onHit', 'sfx_player_hit'],
                  ['Death', 'onDeath', 'sfx_death'],
                  ['Attack', 'onAttack', 'sfx_attack'],
                  ['Land', 'onLand', 'sfx_land'],
                ].map(([label, key, fallback]) => (
                  <Field key={key} label={label}>
                    <input
                      className={inputClass}
                      value={normalized.sounds?.[key] || fallback}
                      onChange={event => onUpdate({ sounds: { ...(normalized.sounds || {}), [key]: event.target.value } })}
                    />
                  </Field>
                ))}
              </div>
            </section>
            <section className={`${panelClass} ${activeSection === 'Preview' ? 'absolute inset-0' : 'hidden'}`}>
              <div className={panelTitleClass}>Preview</div>
              <div className="min-h-0 flex-1 overflow-auto p-4">
                <div className="relative h-full min-h-[360px] overflow-hidden rounded border border-slate-700 bg-[linear-gradient(45deg,#1a202b_25%,transparent_25%),linear-gradient(-45deg,#1a202b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1a202b_75%),linear-gradient(-45deg,transparent_75%,#1a202b_75%)] bg-[length:24px_24px] bg-[#141923]">
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-[linear-gradient(#48b548_0_35%,#7b5127_35%)]" />
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
                    <SpriteFramePreview sprite={selectedSprite} large />
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};
