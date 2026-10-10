import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ProjectAsset } from '../../types';
import { Button } from '../common/Button';
import {
  collectSpriteViewAssets, getSpriteViewWorld, getSpriteViewScreens, spritePatternPixel,
  SPRITE_PATTERN_BASE, SPRITE_PATTERN_BYTES, SPRITE_PATTERN_CAPACITY, SPRITE_PATTERN_TABLE_BYTES,
  type SpriteViewPattern,
} from '../../utils/msx2SpriteView';

const hex = (value: number) => `#${value.toString(16).toUpperCase().padStart(4, '0')}`;

function PatternCanvas({ entry, color, scale = 4 }: { entry?: SpriteViewPattern; color: boolean; scale?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        ctx.fillStyle = ((x >> 2) + (y >> 2)) % 2 ? '#252b36' : '#1b2029';
        ctx.fillRect(x, y, 1, 1);
        if (entry && spritePatternPixel(entry.pattern, x, y)) {
          const slot = (entry.colors[y] ?? 15) & 15;
          if (color && slot === 0) continue;
          ctx.fillStyle = color ? entry.palette?.find(item => item.slotIndex === slot)?.hex || '#ffffff' : '#e2e8f0';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }, [entry, color]);
  return <canvas ref={ref} width={16} height={16} style={{ width: 16 * scale, height: 16 * scale, imageRendering: 'pixelated' }} aria-label={entry ? `${entry.label}, frame ${entry.frame + 1}, layer ${entry.layer + 1}` : 'Free pattern cell'} />;
}

export const SpriteViewEditor: React.FC<{
  assets: ProjectAsset[];
  onNavigateToAsset: (assetId: string) => void;
}> = ({ assets, onNavigateToAsset }) => {
  const worlds = useMemo(() => assets.filter(asset => asset.type === 'worldmap'), [assets]);
  const sprites = useMemo(() => assets.filter(asset => asset.type === 'msx2sprite'), [assets]);
  const [worldId, setWorldId] = useState('');
  const [tab, setTab] = useState<'world' | 'screen' | 'assets'>('world');
  const [screenId, setScreenId] = useState('');
  const [assetFilter, setAssetFilter] = useState('');
  const [color, setColor] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const selectedWorldId = worlds.some(world => world.id === worldId) ? worldId : worlds[0]?.id || '';
  const world = useMemo(() => getSpriteViewWorld(assets, selectedWorldId), [assets, selectedWorldId]);
  const screens = useMemo(() => getSpriteViewScreens(assets, selectedWorldId), [assets, selectedWorldId]);
  const selectedScreenId = screens.some(screen => screen.id === screenId) ? screenId : screens[0]?.id || '';
  const screenBank = useMemo(() => tab === 'screen' && selectedScreenId ? getSpriteViewWorld(assets, selectedWorldId, selectedScreenId) : undefined, [assets, selectedWorldId, selectedScreenId, tab]);
  const bankView = tab === 'screen' ? screenBank : world;
  const patternBase = world?.patternBase ?? (assets.some(asset => asset.type === 'msx2screen') ? 0x3800 : SPRITE_PATTERN_BASE);
  const screenMode = world?.screenMode ?? (patternBase === 0x3800 ? 'SCREEN 4' : 'SCREEN 5');
  const catalogue = useMemo(() => collectSpriteViewAssets(assets), [assets]);
  const patterns = useMemo(() => {
    if (tab === 'assets') return catalogue.filter(entry => !assetFilter || entry.assetId === assetFilter);
    const bank: SpriteViewPattern[] = [];
    for (const entry of bankView?.patterns || []) bank[entry.group!] = entry;
    return bank;
  }, [tab, catalogue, assetFilter, bankView]);
  const cells = tab !== 'assets' ? Math.max(SPRITE_PATTERN_CAPACITY, patterns.length) : patterns.length;
  const detail = selected === null ? undefined : patterns[selected];
  useEffect(() => setSelected(null), [tab, selectedWorldId, selectedScreenId, assetFilter, assets]);

  return (
    <section className="h-full flex flex-col bg-msx-bg text-msx-textprimary overflow-hidden" aria-label="Sprite View">
      <header className="px-5 pt-4 pb-3 border-b border-msx-border space-y-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Sprite View <span className="text-xs font-normal text-msx-textsecondary ml-2">MSX2 · {screenMode}</span></h2>
            <p className="text-xs text-msx-textsecondary mt-1">Sprite pattern table · {hex(patternBase)}–{hex(patternBase + SPRITE_PATTERN_TABLE_BYTES - 1)} · 64 cells of 16×16 · 32 bytes per cell</p>
          </div>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={color} onChange={event => setColor(event.target.checked)} />Show layer colors</label>
        </div>
        <div role="tablist" aria-label="Sprite View tabs" className="flex gap-2">
          <button role="tab" aria-selected={tab === 'world'} onClick={() => setTab('world')} className={`px-3 py-2 text-sm rounded ${tab === 'world' ? 'bg-msx-accent text-white' : 'bg-msx-panelbg text-msx-textsecondary'}`}>World general sprites</button>
          <button role="tab" aria-selected={tab === 'screen'} onClick={() => setTab('screen')} className={`px-3 py-2 text-sm rounded ${tab === 'screen' ? 'bg-msx-accent text-white' : 'bg-msx-panelbg text-msx-textsecondary'}`}>Screen sprites</button>
          <button role="tab" aria-selected={tab === 'assets'} onClick={() => setTab('assets')} className={`px-3 py-2 text-sm rounded ${tab === 'assets' ? 'bg-msx-accent text-white' : 'bg-msx-panelbg text-msx-textsecondary'}`}>All sprite assets</button>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-2">World
            <select aria-label="Sprite View world" value={selectedWorldId} onChange={event => { setWorldId(event.target.value); setScreenId(''); }} className="bg-msx-panelbg border border-msx-border rounded px-2 py-1 min-w-48">
              {!worlds.length && <option value="">No World assets</option>}
              {worlds.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2">Screen
            <select aria-label="Sprite View screen" value={tab === 'screen' ? selectedScreenId : ''} onChange={event => { setScreenId(event.target.value); setTab(event.target.value ? 'screen' : 'world'); }} className="bg-msx-panelbg border border-msx-border rounded px-2 py-1 min-w-48" disabled={!screens.length}>
              <option value="">{screens.length ? 'General sprites only' : 'No screens in this world'}</option>
              {screens.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
            </select>
          </label>
          {tab === 'assets' && <label className="flex items-center gap-2">Sprite
            <select aria-label="Sprite View asset filter" value={assetFilter} onChange={event => setAssetFilter(event.target.value)} className="bg-msx-panelbg border border-msx-border rounded px-2 py-1">
              <option value="">All sprites ({sprites.length})</option>
              {sprites.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
            </select>
          </label>}
          <span className="text-msx-textsecondary">{tab === 'world' ? 'Patterns loaded at world entry. Screen-specific uploads are excluded.' : tab === 'screen' ? 'World general bank + selected screen dynamics, at their allocated VRAM positions.' : `${patterns.length} authored patterns · all frames and color layers · catalogue order, without VRAM allocation.`}</span>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto p-5" role="tabpanel" aria-label={tab === 'world' ? 'World general sprites' : tab === 'screen' ? 'Screen sprites' : 'All sprite assets'}>
        {tab === 'world' && !world && <p className="text-sm text-msx-textsecondary mb-4">{worlds.length ? 'This world has no MSX2 screens. Add a SCREEN 4 screen or SCREEN 5 room to inspect its general sprite bank.' : 'Create a World asset and add MSX2 screens to inspect the sprite bank.'}</p>}
        {tab === 'screen' && !screens.length && <p className="text-sm text-msx-textsecondary mb-4">This world has no MSX2 screens to inspect.</p>}
        {bankView && tab !== 'assets' && <div className="text-xs text-msx-textsecondary mb-4 space-y-1">
          {tab === 'screen' && <p>Selected screen: <span className="text-msx-textprimary">{bankView.screenName}</span> · <span className="text-emerald-400">General</span> · <span className="text-sky-400">Dynamic</span> · dashed cells are reserved runtime capacity.</p>}
          <p>Entry room: <span className="text-msx-textprimary">{bankView.entryRoomName}</span></p>
          {bankView.sharedBank && <p>Shared player bank from the initial room “{bankView.bootRoomName}”, retained between worlds by the current runtime.</p>}
          {bankView.independentPreview && <p>This world is outside the active Game Flow. Showing its independent entry bank.</p>}
          {!!bankView.aliases.length && <p>States reusing the base bank: {bankView.aliases.join(', ')}. They consume no additional patterns.</p>}
          {bankView.inspectionError && <p className="text-red-400">Sprite bank could not be fully inspected: {bankView.inspectionError}. Total usage is unavailable.</p>}
        </div>}
        {tab === 'assets' && !patterns.length && <p className="text-sm text-msx-textsecondary">No sprite patterns to display. Create an MSX2 Sprite asset with frames.</p>}
        <div className="flex flex-wrap gap-5 items-start">
          {(tab === 'assets' || bankView) && <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(8, 72px)' }}>
            {Array.from({ length: cells }, (_, index) => {
              const entry = patterns[index];
              const overflow = tab !== 'assets' && index >= SPRITE_PATTERN_CAPACITY;
              const border = selected === index ? 'border-msx-accent ring-1 ring-msx-accent' : overflow ? 'border-red-500' : !entry ? 'border-msx-border opacity-40' : tab !== 'screen' ? 'border-msx-border' : !entry.dynamic ? 'border-emerald-500/70' : entry.reserved ? 'border-sky-500/50 border-dashed' : 'border-sky-500/70';
              const title = entry ? `${entry.label} · frame ${entry.frame + 1} · cell (${entry.x}, ${entry.y}) · layer ${entry.layer + 1}${entry.mirrored ? ' · mirrored' : ''}` : 'Free for screen-specific pattern uploads';
              return <button key={index} type="button" onClick={() => setSelected(index)} title={title} aria-label={`${tab !== 'assets' ? 'Pattern group' : 'Asset pattern'} ${index}: ${title}`} aria-pressed={selected === index} className={`p-1 rounded border text-left ${border}`}>
                <PatternCanvas entry={entry} color={color} />
                <span className="block text-[10px] font-mono text-msx-textsecondary mt-1">{String(index).padStart(2, '0')} {tab !== 'assets' ? overflow ? 'OVER' : hex(patternBase + index * SPRITE_PATTERN_BYTES) : `F${(entry?.frame || 0) + 1}`}</span>
              </button>;
            })}
          </div>}
          <aside className="w-64 p-4 bg-msx-panelbg border border-msx-border rounded space-y-3 text-xs" aria-label="Pattern details">
            <h3 className="font-semibold text-sm">{selected === null ? 'Pattern details' : `Pattern ${selected}`}</h3>
            {selected === null ? <p className="text-msx-textsecondary">Select a cell to inspect its sprite, frame, color layer and 32 pattern bytes.</p> : detail ? <>
              <PatternCanvas entry={detail} color={color} scale={8} />
              <p className="font-semibold break-words">{detail.label}</p>
              {tab === 'screen' && <p className="text-msx-textsecondary">{detail.dynamic ? detail.reserved ? 'Reserved dynamic capacity' : 'Selected screen dynamic pattern' : 'World general pattern'}</p>}
              <p>Frame {detail.frame + 1} · layer {detail.layer + 1}<br />Cell offset: {detail.x}, {detail.y}<br />{detail.mirrored ? 'Mirrored orientation' : 'Authored orientation'}</p>
              {tab !== 'assets' && (selected < SPRITE_PATTERN_CAPACITY ? <p>Pattern numbers: {selected * 4}–{selected * 4 + 3}<br />VRAM: {hex(patternBase + selected * 32)}–{hex(patternBase + selected * 32 + 31)}</p> : <p className="text-red-400">Outside the sprite pattern table.</p>)}
              <pre className="text-[10px] text-msx-textsecondary whitespace-pre-wrap font-mono">{Array.from({ length: 4 }, (_, row) => detail.pattern.slice(row * 8, row * 8 + 8).map(byte => byte.toString(16).toUpperCase().padStart(2, '0')).join(' ')).join('\n')}</pre>
              <p className="text-msx-textsecondary">Each cell shows one hardware pattern. Color layers and CC/OR flags are kept separate.</p>
              {detail.assetId && <Button size="sm" variant="secondary" onClick={() => onNavigateToAsset(detail.assetId!)}>Open sprite asset</Button>}
            </> : <p className="text-msx-textsecondary">Free cell · 32 bytes available for screen-specific patterns.</p>}
          </aside>
        </div>
      </div>

      <footer className="shrink-0 border-t border-msx-border px-5 py-3 bg-msx-panelbg" aria-label="Sprite pattern VRAM usage">
        <div className="flex flex-wrap justify-between gap-2 text-xs mb-2">
          <strong>Sprite pattern VRAM · {tab === 'screen' ? 'selected screen + world' : 'selected world'}</strong>
          {bankView && !bankView.inspectionError ? <span>Occupied: {bankView.usedBytes} B ({bankView.patterns.length}/64 cells) · Free: {bankView.freeBytes} B · Total: {SPRITE_PATTERN_TABLE_BYTES} B</span> : <span>{bankView?.inspectionError ? 'Allocation failed: this screen or project cannot be exported. See the error above.' : 'Select a world with MSX2 screens to calculate usage.'}</span>}
        </div>
        <div role="progressbar" aria-label="General sprite pattern VRAM occupied" aria-valuemin={0} aria-valuemax={SPRITE_PATTERN_TABLE_BYTES} aria-valuenow={bankView?.inspectionError ? undefined : Math.min(bankView?.usedBytes || 0, SPRITE_PATTERN_TABLE_BYTES)} aria-valuetext={bankView?.inspectionError ? 'Allocation failed' : undefined} className="h-2 rounded bg-msx-bg overflow-hidden">
          <div className={`h-full ${bankView?.overflowBytes || bankView?.inspectionError ? 'bg-red-500' : 'bg-msx-accent'}`} style={{ width: `${bankView?.inspectionError ? 100 : Math.min(100, (bankView?.usedBytes || 0) / SPRITE_PATTERN_TABLE_BYTES * 100)}%` }} />
        </div>
        {bankView && <p className={`text-[11px] mt-2 ${bankView.overflowBytes ? 'text-red-400' : 'text-msx-textsecondary'}`}>{bankView.inspectionError ? 'Allocation failed. Usage is unavailable until the reported issue is resolved.' : bankView.overflowBytes ? `Overflow: ${bankView.overflowBytes} B beyond the sprite pattern table.` : tab === 'screen' ? 'Includes the general bank, dynamic uploads and reserved runtime cache cells. Shared enemy patterns use the first referenced color layer for preview.' : 'Free space is measured after the general bank and initial effects load. Screen-specific enemies and other dynamic uploads will use part of it. Color and attribute tables are counted separately from patterns.'}</p>}
      </footer>
    </section>
  );
};
