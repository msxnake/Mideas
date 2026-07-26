import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Msx2BitmapStampAsset,
  Msx2BossDamageZone,
  Msx2BossDefeatAction,
  Msx2BossDefinition,
  Msx2BossPhase,
  Msx2BossRoomLockStep,
  Msx2Screen5BitmapRoom,
  ProjectAsset,
  Screen5PaletteSlot,
} from '../../types';
import { createDefaultScreen5PaletteSlots, ensureScreen5PaletteSlots } from '../../utils/msx2PaletteUtils';
import { WorldPaletteResolution, resolveWorldPalettes } from '../../utils/msx2WorldPalette';
import { bitmapStampToPixelGrid } from '../../utils/msx2Screen5BitmapTileLibrary';

/**
 * MSX2 SCREEN 5 bitmap Boss Editor.
 *
 * A boss is NOT a normal entity: it owns the room while it lives (chain
 * barrier), fights in HP-driven attack phases, only takes damage on its weak
 * points, and triggers progress actions when it dies. This editor authors the
 * reusable BossDefinition; a screen then references it from a placed boss
 * entity (the BossEncounter) and may override HP or rewards per instance.
 *
 * See docs/msx/BOSS_SYSTEM_DESIGN.md for the runtime contract.
 */

interface Msx2BossEditorProps {
  boss: Msx2BossDefinition;
  onUpdate: (boss: Msx2BossDefinition) => void;
  allAssets: ProjectAsset[];
  /** Patches another asset's data (used to point a room's boss entity at this definition). */
  onUpdateAsset?: (assetId: string, data: any) => void;
  onDuplicateAsset?: (assetId: string) => void;
  setStatusBarMessage?: (message: string) => void;
}

const NAV_ITEMS = ['General', 'Body & Graphics', 'Movement', 'Room Lock', 'Projectiles', 'Attack Phases', 'Damage Zones', 'Defeat Actions', 'Encounters'] as const;
type Section = typeof NAV_ITEMS[number];

/** MSX2 palette approximation, good enough for the zone-editor preview. */
const MSX2_PREVIEW_BG = '#101018';

const card = 'bg-msx-panel border border-msx-border rounded p-3 mb-3';
const label = 'block text-xs text-msx-textsecondary mb-1';
const input = 'w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1 text-sm text-msx-textprimary';
const btn = 'px-2 py-1 text-xs rounded border border-msx-border hover:bg-msx-hover';

/**
 * One atlas entry, carrying enough of its room to be drawn: the atlas bitmap is
 * shared per room, so an entry is only a rectangle (sx,sy,w,h) inside it.
 */
interface AtlasEntryRef {
  id: string;
  /** Unique per room: the same atlas entry id is shared by every room that imported it. */
  key: string;
  label: string;
  w: number;
  h: number;
  roomName: string;
  sx: number;
  sy: number;
  pixels: number[][];
  palette: Screen5PaletteSlot[];
}

/** Memoised {@link resolveWorldPalettes}: the world palette wins over the room's own. */
function useWorldPalettes(allAssets: ProjectAsset[]): WorldPaletteResolution {
  return useMemo(() => resolveWorldPalettes(allAssets), [allAssets]);
}

/** Collect every atlas entry across the project's bitmap rooms. */
function useAtlasEntries(allAssets: ProjectAsset[]): AtlasEntryRef[] {
  const { byRoom } = useWorldPalettes(allAssets);
  return useMemo(() => {
    const out: AtlasEntryRef[] = [];
    for (const asset of allAssets) {
      if (asset.type !== 'msx2bitmaproom') continue;
      const room = asset.data as Msx2Screen5BitmapRoom | undefined;
      const atlas = room?.atlas;
      if (!atlas) continue;
      // The world's shared palette is what the game runs with; the room's
      // own slots are only a fallback for rooms outside a palette-carrying world.
      const palette = byRoom.get(asset.id)
        || (room?.palette?.length ? ensureScreen5PaletteSlots(room.palette).slots : createDefaultScreen5PaletteSlots());
      for (const entry of atlas.entries || []) {
        if (!entry?.id) continue;
        out.push({
          id: String(entry.id),
          key: `${asset.id}:${entry.id}`,
          label: `${entry.name || entry.id} (${entry.w}x${entry.h})`,
          w: Number(entry.w) || 0,
          h: Number(entry.h) || 0,
          roomName: asset.name,
          sx: Number(entry.sx) || 0,
          sy: Number(entry.sy) || 0,
          pixels: atlas.pixels || [],
          palette,
        });
      }
    }
    return out;
  }, [allAssets, byRoom]);
}

/** '#rgb' / '#rrggbb' -> [r,g,b]; anything unparseable reads as black. */
function hexToRgb(hex: string | undefined): [number, number, number] {
  const value = String(hex || '').replace('#', '');
  const full = value.length === 3 ? value.split('').map(c => c + c).join('') : value;
  if (full.length !== 6) return [0, 0, 0];
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/**
 * Draws one atlas entry (or one frame of a horizontal strip) at 1 canvas pixel
 * per MSX pixel, upscaled by CSS so it stays crisp. Colour 0 is left
 * transparent, exactly as SCREEN 5 treats it, so the boss reads as a silhouette
 * over whatever sits behind the canvas.
 */
const AtlasEntryCanvas: React.FC<{
  entry?: AtlasEntryRef;
  scale: number;
  frames?: number;
  frameIndex?: number;
  className?: string;
}> = ({ entry, scale, frames = 1, frameIndex = 0, className }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const frameCount = Math.max(1, frames);
  const w = entry ? Math.max(1, Math.floor(entry.w / frameCount)) : 0;
  const h = entry ? Math.max(1, entry.h) : 0;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !entry || w <= 0 || h <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const image = ctx.createImageData(w, h);
    const originX = entry.sx + Math.min(frameIndex, frameCount - 1) * w;
    for (let y = 0; y < h; y++) {
      const row = entry.pixels[entry.sy + y];
      for (let x = 0; x < w; x++) {
        const color = row?.[originX + x];
        const offset = (y * w + x) * 4;
        if (!color) continue;                    // 0 / undefined = transparent
        const [r, g, b] = hexToRgb(entry.palette[color & 0x0f]?.hex);
        image.data[offset] = r;
        image.data[offset + 1] = g;
        image.data[offset + 2] = b;
        image.data[offset + 3] = 255;
      }
    }
    ctx.clearRect(0, 0, w, h);
    ctx.putImageData(image, 0, 0);
  }, [entry, w, h, frameIndex, frameCount]);

  if (!entry || w <= 0 || h <= 0) return null;
  return (
    <canvas
      ref={ref}
      width={w}
      height={h}
      className={className}
      style={{ width: w * scale, height: h * scale, imageRendering: 'pixelated' }}
    />
  );
};

/** Framed thumbnail for the atlas pickers; shows a hint when nothing is chosen. */
const AtlasPreviewBox: React.FC<{
  entry?: AtlasEntryRef;
  scale: number;
  frames?: number;
  frameIndex?: number;
  emptyHint: string;
}> = ({ entry, scale, frames, frameIndex, emptyHint }) => (
  <div className="inline-flex items-center justify-center border border-msx-border rounded p-2 min-w-[64px] min-h-[64px]"
    style={{ background: MSX2_PREVIEW_BG }}>
    {entry
      ? <AtlasEntryCanvas entry={entry} scale={scale} frames={frames} frameIndex={frameIndex} />
      : <span className="text-xs text-msx-textsecondary px-2">{emptyHint}</span>}
  </div>
);

/**
 * One `msx2bitmapstamp` asset, composed into a single pixel grid.
 *
 * A boss body IS a stamp: it is authored as one picture, and the generator
 * injects it into the shared world atlas so it reaches VRAM without any room
 * having to paint it. Atlas entries were never the right unit here — importing
 * a stamp into a room SPLITS it into 16x16 cells, so the old picker was mostly
 * showing stamp fragments (`door_market_r0_c0`, `_r0_c1`...), once per room.
 */
interface BodyStampRef {
  id: string;
  name: string;
  w: number;
  h: number;
  pixels: number[][];
  palette: Screen5PaletteSlot[];
}

/** Every bitmap stamp in the project, composed and ready to draw. */
function useBodyStamps(allAssets: ProjectAsset[]): BodyStampRef[] {
  const { shared } = useWorldPalettes(allAssets);
  return useMemo(() => {
    const out: BodyStampRef[] = [];
    for (const asset of allAssets) {
      if (asset.type !== 'msx2bitmapstamp') continue;
      const data = asset.data as Msx2BitmapStampAsset | undefined;
      const stamp = data?.stamp;
      if (!stamp) continue;
      const pixels = bitmapStampToPixelGrid(stamp);
      const h = pixels.length;
      const w = pixels[0]?.length || 0;
      if (w <= 0 || h <= 0) continue;
      out.push({
        id: asset.id,
        name: asset.name || stamp.name || asset.id,
        w, h, pixels,
        // The generator injects stamps into the world atlas, so in game they
        // are drawn with the world palette, not the copy saved with the stamp.
        // With several world palettes there is no unambiguous choice, so the
        // stamp's own slots stand in.
        palette: shared
          || (data?.palette?.length ? ensureScreen5PaletteSlots(data.palette).slots : createDefaultScreen5PaletteSlots()),
      });
    }
    return out;
  }, [allAssets, shared]);
}

/** Draws a composed stamp (or one frame of a horizontal strip) at 1:1, CSS-upscaled. */
const StampCanvas: React.FC<{
  stamp: BodyStampRef;
  scale: number;
  frames?: number;
  frameIndex?: number;
}> = ({ stamp, scale, frames = 1, frameIndex = 0 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const frameCount = Math.max(1, frames);
  const w = Math.max(1, Math.floor(stamp.w / frameCount));
  const h = Math.max(1, stamp.h);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const image = ctx.createImageData(w, h);
    const originX = Math.min(frameIndex, frameCount - 1) * w;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const color = stamp.pixels[y]?.[originX + x];
        if (!color) continue;                     // 0 = transparent, as on SCREEN 5
        const [r, g, b] = hexToRgb(stamp.palette[color & 0x0f]?.hex);
        const offset = (y * w + x) * 4;
        image.data[offset] = r;
        image.data[offset + 1] = g;
        image.data[offset + 2] = b;
        image.data[offset + 3] = 255;
      }
    }
    ctx.clearRect(0, 0, w, h);
    ctx.putImageData(image, 0, 0);
  }, [stamp, w, h, frameIndex, frameCount]);

  return (
    <canvas
      ref={ref}
      width={w}
      height={h}
      style={{ width: w * scale, height: h * scale, imageRendering: 'pixelated' }}
    />
  );
};

/** Visual picker for the boss body: the project's Bitmap Stamps, drawn. */
const BossBodyPicker: React.FC<{
  stamps: BodyStampRef[];
  value: string;
  frames: number;
  onPick: (id: string) => void;
}> = ({ stamps, value, frames, onPick }) => {
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return stamps;
    return stamps.filter(stamp => stamp.name.toLowerCase().includes(needle));
  }, [stamps, query]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <input
          className={`${input} flex-1`}
          placeholder="Filter stamps by name…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button className={btn} onClick={() => onPick('')}>Clear</button>
      </div>

      <div className="max-h-80 overflow-y-auto border border-msx-border rounded p-2">
        {stamps.length === 0 && (
          <p className="text-xs text-msx-textsecondary p-2">
            This project has no Bitmap Stamps yet. Create one in the bitmap room editor
            (select an area &rarr; save as stamp) or import one from the stamp library.
          </p>
        )}
        {stamps.length > 0 && visible.length === 0 && (
          <p className="text-xs text-msx-textsecondary p-2">No stamp matches that filter.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {visible.map(stamp => {
            const frameW = Math.max(1, Math.floor(stamp.w / Math.max(1, frames)));
            // Fit inside a 96px box, never upscaling past 3x so a small stamp and
            // a 96x96 body stay comparable at a glance.
            const scale = Math.max(1, Math.min(3, Math.floor(96 / Math.max(frameW, stamp.h, 1))));
            const selected = stamp.id === value;
            const perFrame = `${frameW}x${stamp.h}`;
            // The generator refuses a per-frame body outside 16..128 x 16..96, so
            // say it here rather than letting the boss vanish at build time.
            const fits = frameW >= 16 && frameW <= 128 && stamp.h >= 16 && stamp.h <= 96;
            return (
              <button
                key={stamp.id}
                onClick={() => onPick(stamp.id)}
                title={`${stamp.name} — ${stamp.w}x${stamp.h}${frames > 1 ? ` (${frames} frames of ${perFrame})` : ''}`}
                className={`flex flex-col items-center justify-end gap-1 p-1 rounded border ${selected ? 'border-msx-accent' : 'border-msx-border hover:bg-msx-hover'}`}
                style={{ background: MSX2_PREVIEW_BG, width: 108 }}
              >
                <div className="flex-1 flex items-center justify-center" style={{ minHeight: 100 }}>
                  <StampCanvas stamp={stamp} scale={scale} frames={frames} frameIndex={0} />
                </div>
                <span className="text-[10px] leading-tight text-msx-textprimary truncate w-full text-center">
                  {stamp.name}
                </span>
                <span className="text-[10px] leading-tight text-center" style={{ color: fits ? undefined : '#ffb454' }}>
                  {perFrame}{fits ? '' : ' — out of range'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/** Locked-door entities, so "openDoor" can be picked instead of typed. */
function useDoorEntities(allAssets: ProjectAsset[]) {
  return useMemo(() => {
    const out: Array<{ id: string; label: string }> = [];
    for (const asset of allAssets) {
      if (asset.type !== 'msx2bitmaproom') continue;
      const entities = (asset.data as any)?.entities || [];
      for (const entity of entities) {
        if (entity?.kind !== 'door' || !entity?.id) continue;
        out.push({ id: String(entity.id), label: `${entity.name || entity.id} — ${asset.name}` });
      }
    }
    return out;
  }, [allAssets]);
}

/** A placed `kind:'boss'` entity — the BossEncounter side of the split. */
interface BossEncounterRef {
  roomAssetId: string;
  roomName: string;
  entityId: string;
  entityName: string;
  bossId: string;
  hpOverride: number | '';
}

/** Every boss placed on a bitmap room, whichever definition it points at. */
function useBossEncounters(allAssets: ProjectAsset[]): BossEncounterRef[] {
  return useMemo(() => {
    const out: BossEncounterRef[] = [];
    for (const asset of allAssets) {
      if (asset.type !== 'msx2bitmaproom') continue;
      for (const entity of ((asset.data as any)?.entities || []) as any[]) {
        if (entity?.kind !== 'boss' || !entity?.id) continue;
        const params = entity.params || {};
        out.push({
          roomAssetId: asset.id,
          roomName: asset.name,
          entityId: String(entity.id),
          entityName: String(entity.name || entity.id),
          bossId: String(params.bossId || params.bossDefinitionId || ''),
          hpOverride: params.hpOverride === undefined || params.hpOverride === null || params.hpOverride === ''
            ? ''
            : Number(params.hpOverride),
        });
      }
    }
    return out;
  }, [allAssets]);
}

export const Msx2BossEditor: React.FC<Msx2BossEditorProps> = ({
  boss, onUpdate, allAssets, onUpdateAsset, onDuplicateAsset, setStatusBarMessage,
}) => {
  const [section, setSection] = useState<Section>('General');
  // Atlas entries still back the BARRIER and PROJECTILE tile pickers, which are
  // genuinely 16x16 room tiles. The body is not one of those any more.
  const atlasEntries = useAtlasEntries(allAssets);
  const bodyStamps = useBodyStamps(allAssets);
  const doors = useDoorEntities(allAssets);
  const encounters = useBossEncounters(allAssets);
  const spriteAssets = useMemo(() => allAssets.filter(a => a.type === 'msx2sprite'), [allAssets]);
  const pathAssets = useMemo(() => allAssets.filter(a => a.type === 'msx2bosspath'), [allAssets]);
  const dialogueAssets = useMemo(() => allAssets.filter(a => a.type === 'msx2dialogue'), [allAssets]);
  const roomAssets = useMemo(() => allAssets.filter(a => a.type === 'msx2bitmaproom'), [allAssets]);
  const usedHere = encounters.filter(e => e.bossId === boss.id).length;

  const set = <K extends keyof Msx2BossDefinition>(key: K, value: Msx2BossDefinition[K]) =>
    onUpdate({ ...boss, [key]: value });

  // The body drives the zone editor canvas size: zones are authored in
  // boss-local pixels, so the preview must match the real body rectangle.
  const bodyStamp = bodyStamps.find(s => s.id === boss.bossStampAssetId);
  const frames = Math.max(1, Number(boss.bossFrames) || 1);
  const bodyW = bodyStamp ? Math.floor(bodyStamp.w / frames) : 64;
  const bodyH = bodyStamp ? bodyStamp.h : 64;
  const bodyPreviewScale = Math.max(1, Math.min(4, Math.floor(160 / Math.max(bodyW, 1))));
  const barrierEntry = atlasEntries.find(e => e.id === boss.bossBarrierTileId);
  const projectileEntry = atlasEntries.find(e => e.id === boss.bossProjectileTileId);

  return (
    <div className="flex h-full text-msx-textprimary">
      <nav className="w-44 shrink-0 border-r border-msx-border p-2 space-y-1">
        {NAV_ITEMS.map(item => (
          <button
            key={item}
            onClick={() => setSection(item)}
            className={`w-full text-left px-2 py-1 text-sm rounded ${section === item ? 'bg-msx-accent text-white' : 'hover:bg-msx-hover'}`}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto p-4">
        {section === 'General' && (
          <div className={card}>
            <h3 className="text-sm font-semibold mb-3">General</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Name</label>
                <input className={input} value={boss.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div>
                <label className={label}>ID (referenced by screens as bossId)</label>
                <input className={input} value={boss.id} readOnly />
              </div>
              <div>
                <label className={label}>Hit points</label>
                <input type="number" min={1} max={255} className={input}
                  value={boss.bossHp} onChange={e => set('bossHp', Number(e.target.value))} />
              </div>
              <div>
                <label className={label}>Contact damage (hearts)</label>
                <input type="number" min={0} max={8} className={input}
                  value={boss.bossDamage} onChange={e => set('bossDamage', Number(e.target.value))} />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button className={btn} disabled={!onDuplicateAsset}
                onClick={() => {
                  onDuplicateAsset?.(boss.id);
                  setStatusBarMessage?.(`Duplicated boss "${boss.name}".`);
                }}>Duplicate this boss</button>
              <span className="text-xs text-msx-textsecondary">
                {usedHere === 0
                  ? 'Not placed on any room yet — see the Encounters tab.'
                  : `Used by ${usedHere} placed boss${usedHere === 1 ? '' : 'es'}.`}
              </span>
            </div>

            <p className="text-xs text-msx-textsecondary mt-3">
              A screen uses this boss by placing a boss entity with <code>bossId = {boss.id || '…'}</code>.
              The screen may override HP with <code>hpOverride</code>.
            </p>
          </div>
        )}

        {section === 'Body & Graphics' && (
          <div className={card}>
            <h3 className="text-sm font-semibold mb-3">Body & Graphics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={label}>
                  Body — Bitmap Stamp
                  {bodyStamp ? ` — ${bodyStamp.name}` : ' — none picked'}
                </label>
                <BossBodyPicker
                  stamps={bodyStamps}
                  value={boss.bossStampAssetId || ''}
                  frames={frames}
                  onPick={id => onUpdate({ ...boss, bossStampAssetId: id, bossAtlasEntryId: '' })}
                />
                {!boss.bossStampAssetId && boss.bossAtlasEntryId && (
                  <p className="text-xs mt-1" style={{ color: '#ffb454' }}>
                    This boss still points at the old atlas entry <code>{boss.bossAtlasEntryId}</code>.
                    It keeps working, but pick a stamp to move it over.
                  </p>
                )}
              </div>
              <div>
                <label className={label}>Animation frames (horizontal strip)</label>
                <input type="number" min={1} max={4} className={input}
                  value={boss.bossFrames} onChange={e => set('bossFrames', Number(e.target.value))} />
              </div>
              <div>
                <label className={label}>Frames between animation steps</label>
                <input type="number" min={1} max={255} className={input}
                  value={boss.bossAnimDelay} onChange={e => set('bossAnimDelay', Number(e.target.value))} />
              </div>
              <div>
                <label className={label}>Body redraw cadence (frames)</label>
                <input type="number" min={1} max={8} className={input}
                  value={boss.bossInterval} onChange={e => set('bossInterval', Number(e.target.value))} />
              </div>
            </div>
            <div className="mt-3">
              <label className={label}>Preview — one box per animation frame</label>
              <div className="flex gap-2 flex-wrap">
                {bodyStamp
                  ? Array.from({ length: frames }, (_, index) => (
                    <div key={index} className="text-center">
                      <div className="inline-flex items-center justify-center border border-msx-border rounded p-2 min-w-[64px] min-h-[64px]"
                        style={{ background: MSX2_PREVIEW_BG }}>
                        <StampCanvas stamp={bodyStamp} scale={bodyPreviewScale} frames={frames} frameIndex={index} />
                      </div>
                      <div className="text-[10px] text-msx-textsecondary mt-1">frame {index}</div>
                    </div>
                  ))
                  : <AtlasPreviewBox scale={1} emptyHint="Pick a Bitmap Stamp to see the boss." />}
              </div>
            </div>

            <p className="text-xs text-msx-textsecondary mt-3">
              Body size resolves to <strong>{bodyW}×{bodyH}</strong> px per frame.
              The body redraws every {boss.bossInterval} frames so its big blit never shares a
              frame with the projectiles — keep this at 3 unless you know the blit budget.
            </p>
          </div>
        )}

        {section === 'Movement' && (
          <div className={card}>
            <h3 className="text-sm font-semibold mb-3">Movement</h3>
            <div className="mb-3">
              <label className={label}>Path (a route asset the boss walks)</label>
              <select className={input} value={boss.bossPathId || ''}
                onChange={e => set('bossPathId', e.target.value)}>
                <option value="">— none, use the simple movement below —</option>
                {pathAssets.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.name}</option>
                ))}
              </select>
              <p className="text-xs text-msx-textsecondary mt-2">
                A path wins over the simple movement, and each attack phase can switch to a
                different one. Author routes in <strong>MSX2 Boss Paths</strong>.
              </p>
            </div>

            <div className={`grid grid-cols-3 gap-3 ${boss.bossPathId ? 'opacity-50' : ''}`}>
              <div>
                <label className={label}>Mode</label>
                <select className={input} value={boss.bossMovement || ''} disabled={!!boss.bossPathId}
                  onChange={e => set('bossMovement', (e.target.value || undefined) as Msx2BossDefinition['bossMovement'])}>
                  <option value="">Inherit from the placed boss</option>
                  <option value="static">Static — never moves, only shoots</option>
                  <option value="patrolX">Patrol horizontally</option>
                  <option value="patrolY">Patrol vertically</option>
                  <option value="patrolXY">Patrol diagonally (bounces on both axes)</option>
                </select>
              </div>
              <div>
                <label className={label}>Speed (px/frame)</label>
                <input type="number" min={1} max={2} className={input}
                  disabled={!!boss.bossPathId || !boss.bossMovement || boss.bossMovement === 'static'}
                  value={boss.bossSpeed ?? 2}
                  onChange={e => set('bossSpeed', Number(e.target.value))} />
              </div>
              <div>
                <label className={label}>Travel from spawn (px, 0 = whole room)</label>
                <input type="number" min={0} max={255} className={input}
                  disabled={!!boss.bossPathId || boss.bossMovement === 'static'}
                  value={boss.bossRangePx ?? 0}
                  onChange={e => set('bossRangePx', Number(e.target.value))} />
              </div>
            </div>
            {boss.bossPathId && (
              <p className="text-xs text-msx-accent mt-3">
                The simple movement is off while a path is selected: the route decides
                where the boss goes. Clear the path above to patrol instead.
              </p>
            )}

            <p className="text-xs text-msx-textsecondary mt-3">
              A <strong>static</strong> boss is the turret case: it stands still and lets the
              projectiles and phases do the work, and it costs no body redraw movement at all.
              Speed tops out at <strong>2 px/frame</strong> — the body's trail is cleaned with
              4-pixel strips, so anything faster leaves a smear.
            </p>
            <p className="text-xs text-msx-textsecondary mt-2">
              Movement is a straight bounce between two bounds. Free-form waypoint paths would
              need a new runtime mode in the boss ASM; they are not available yet.
            </p>
          </div>
        )}

        {section === 'Room Lock' && (
          <div className={card}>
            <h3 className="text-sm font-semibold mb-3">Room Lock — chain barrier</h3>
            <label className={label}>Barrier tile (16×16 atlas tile)</label>
            <div className="max-h-96 overflow-y-auto border border-msx-border rounded p-2 mb-3">
              <div className="flex flex-wrap gap-2">
                <button className={`${btn} ${boss.bossBarrierTileId === '' ? 'border-msx-accent' : ''}`} onClick={() => set('bossBarrierTileId', '')}>
                  No barrier
                </button>
                {atlasEntries.filter(e => e.w >= 16 && e.h >= 16).map(entry => {
                  const scale = Math.max(1, Math.floor(80 / Math.max(entry.w, entry.h, 1)));
                  return (
                    <button key={entry.key} onClick={() => set('bossBarrierTileId', entry.id)}
                      className={`flex flex-col items-center justify-center gap-1 p-1 rounded border ${boss.bossBarrierTileId === entry.id ? 'border-msx-accent' : 'border-msx-border hover:bg-msx-hover'}`}
                      style={{ background: MSX2_PREVIEW_BG, width: 90 }}
                      title={`${entry.label} — ${entry.roomName}`}>
                      <div className="flex-1 flex items-center justify-center" style={{ minHeight: 80 }}>
                        <AtlasEntryCanvas entry={entry} scale={scale} />
                      </div>
                      <span className="text-[8px] leading-tight text-msx-textprimary truncate w-full text-center">{entry.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-3">
              {/* A 3x3 patch: the barrier is a repeated tile, so it must be judged tiled. */}
              <div className="inline-grid grid-cols-3 border border-msx-border rounded p-2"
                style={{ background: MSX2_PREVIEW_BG, gap: 0 }}>
                {barrierEntry
                  ? Array.from({ length: 9 }, (_, index) => (
                    <AtlasEntryCanvas key={index} entry={barrierEntry} scale={3} />
                  ))
                  : <span className="text-xs text-msx-textsecondary px-2 col-span-3">No barrier: the player can walk out mid-fight.</span>}
              </div>
            </div>

            <RoomLockSequencePanel boss={boss} onUpdate={onUpdate} dialogues={dialogueAssets} />

            <p className="text-xs text-msx-textsecondary mt-3">
              While the boss lives, this tile seals the room perimeter so the player cannot leave.
              It is placed <strong>only on empty cells</strong>, checked tile by tile, so existing
              walls, floor and scenery are never overwritten — and it is removed when the boss dies.
              The cell the player is standing on is never sealed, so walking in never traps them.
            </p>
          </div>
        )}

        {section === 'Projectiles' && (
          <div className={card}>
            <h3 className="text-sm font-semibold mb-3">Projectiles</h3>
            <label className={label}>Kind</label>
            <select className={input} value={boss.bossProjectileKind}
              onChange={e => set('bossProjectileKind', e.target.value as 'sprite' | 'bitmap')}>
              <option value="sprite">Hardware sprite — fast, several at once (default)</option>
              <option value="bitmap">Bitmap blit — slow multicolour bombs / homing rockets</option>
            </select>

            {boss.bossProjectileKind === 'sprite' ? (
              <div className="mt-3">
                <label className={label}>Bullet sprite (empty = built-in small blob)</label>
                <select className={input} value={boss.bossProjectileSpriteId}
                  onChange={e => set('bossProjectileSpriteId', e.target.value)}>
                  <option value="">— built-in 8×8 blob —</option>
                  {spriteAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                  ))}
                </select>
                <p className="text-xs text-msx-textsecondary mt-2">
                  Sprite bullets reuse the enemy sprite slots, so the boss room must have
                  <strong> no regular enemies</strong> (that is the normal design anyway).
                </p>
              </div>
            ) : (
              <div className="mt-3">
                <label className={label}>Bullet atlas tile (8..16 px)</label>
                <div className="max-h-80 overflow-y-auto border border-msx-border rounded p-2 mb-2">
                  <div className="flex flex-wrap gap-2">
                    <button className={`${btn} ${boss.bossProjectileTileId === '' ? 'border-msx-accent' : ''}`} onClick={() => set('bossProjectileTileId', '')}>
                      None
                    </button>
                    {atlasEntries.filter(e => e.w <= 16 && e.h <= 16).map(entry => {
                      const scale = Math.max(1, Math.floor(70 / Math.max(entry.w, entry.h, 1)));
                      return (
                        <button key={entry.key} onClick={() => set('bossProjectileTileId', entry.id)}
                          className={`flex flex-col items-center justify-center gap-1 p-1 rounded border ${boss.bossProjectileTileId === entry.id ? 'border-msx-accent' : 'border-msx-border hover:bg-msx-hover'}`}
                          style={{ background: MSX2_PREVIEW_BG, width: 80 }}
                          title={`${entry.label} — ${entry.roomName}`}>
                          <div className="flex-1 flex items-center justify-center" style={{ minHeight: 70 }}>
                            <AtlasEntryCanvas entry={entry} scale={scale} />
                          </div>
                          <span className="text-[8px] leading-tight text-msx-textprimary truncate w-full text-center">{entry.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-2">
                  <AtlasPreviewBox entry={projectileEntry} scale={4} emptyHint="Pick a bullet tile." />
                </div>
                <p className="text-xs text-msx-textsecondary mt-2">
                  Bitmap bullets are drawn by the VDP blitter and can use the full palette,
                  which suits slow bombs and rockets.
                </p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <label className={label}>Frames between shots</label>
                <input type="number" min={20} max={255} className={input}
                  value={boss.bossShootInterval} onChange={e => set('bossShootInterval', Number(e.target.value))} />
              </div>
              <div>
                <label className={label}>Speed (px/frame)</label>
                <input type="number" min={1} max={4} className={input}
                  value={boss.bossProjectileSpeed} onChange={e => set('bossProjectileSpeed', Number(e.target.value))} />
              </div>
              <div>
                <label className={label}>Damage (hearts)</label>
                <input type="number" min={0} max={8} className={input}
                  value={boss.bossProjectileDamage} onChange={e => set('bossProjectileDamage', Number(e.target.value))} />
              </div>
            </div>
          </div>
        )}

        {section === 'Attack Phases' && (
          <PhasesPanel boss={boss} onUpdate={onUpdate} pathAssets={pathAssets} />
        )}

        {section === 'Damage Zones' && (
          <ZonesPanel boss={boss} onUpdate={onUpdate} bodyW={bodyW} bodyH={bodyH}
            bodyStamp={bodyStamp} frames={frames} setStatusBarMessage={setStatusBarMessage} />
        )}

        {section === 'Defeat Actions' && (
          <DefeatPanel boss={boss} onUpdate={onUpdate} doors={doors}
            dialogues={dialogueAssets} rooms={roomAssets} />
        )}

        {section === 'Encounters' && (
          <EncountersPanel boss={boss} encounters={encounters} allAssets={allAssets}
            onUpdateAsset={onUpdateAsset} setStatusBarMessage={setStatusBarMessage} />
        )}
      </div>
    </div>
  );
};

/**
 * The Room Lock entry sequence: what the player sees, in order, when they walk
 * into the boss room. They cannot move while it runs.
 *
 * Order is the whole point, so this is an ordered list rather than a set of
 * switches: a dialogue placed before the chain closes reads as a warning, the
 * same dialogue after it reads as a taunt.
 */
const RoomLockSequencePanel: React.FC<{
  boss: Msx2BossDefinition;
  onUpdate: (b: Msx2BossDefinition) => void;
  dialogues: ProjectAsset[];
}> = ({ boss, onUpdate, dialogues }) => {
  const steps = boss.roomLockSequence || [];
  const update = (next: Msx2BossRoomLockStep[]) => onUpdate({ ...boss, roomLockSequence: next });
  const patch = (index: number, changes: Partial<Msx2BossRoomLockStep>) =>
    update(steps.map((step, i) => i === index ? { ...step, ...changes } as Msx2BossRoomLockStep : step));
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  };

  const add = (kind: Msx2BossRoomLockStep['kind']) => {
    const created: Msx2BossRoomLockStep =
      kind === 'closeBarrier' ? { kind: 'closeBarrier', animated: true, cellsPerFrame: 4 }
        : kind === 'dialogue' ? { kind: 'dialogue', dialogueAssetId: dialogues[0]?.id || '' }
          : { kind: 'wait', frames: 30 };
    update([...steps, created]);
  };

  // The sequence replaces the old standalone switches, so offer the one-click
  // migration instead of silently dropping what the boss already had.
  const legacyAnimated = boss.bossBarrierAnimated;
  const legacyDialogue = boss.bossBarrierDialogueAssetId;
  const hasLegacy = steps.length === 0 && (legacyAnimated || legacyDialogue);
  const adoptLegacy = () => {
    const next: Msx2BossRoomLockStep[] = [];
    if (legacyDialogue) next.push({ kind: 'dialogue', dialogueAssetId: legacyDialogue });
    next.push({ kind: 'closeBarrier', animated: !!legacyAnimated, cellsPerFrame: 4 });
    onUpdate({
      ...boss,
      roomLockSequence: next,
      bossBarrierAnimated: undefined,
      bossBarrierDialogueAssetId: undefined,
    });
  };

  const stepTitle = (step: Msx2BossRoomLockStep) =>
    step.kind === 'closeBarrier' ? 'Close the chain'
      : step.kind === 'dialogue' ? 'Boss speaks'
        : 'Wait';

  const hasCloseStep = steps.some(step => step.kind === 'closeBarrier');

  return (
    <div className="mt-4 border-t border-msx-border pt-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold">Entry sequence</h4>
        <div className="flex gap-1">
          <button className={btn} onClick={() => add('closeBarrier')}>+ Close chain</button>
          <button className={btn} onClick={() => add('dialogue')} disabled={dialogues.length === 0}>+ Dialogue</button>
          <button className={btn} onClick={() => add('wait')}>+ Wait</button>
        </div>
      </div>

      {hasLegacy && (
        <div className="flex items-center gap-2 mb-2 p-2 rounded border" style={{ borderColor: '#ffb454' }}>
          <span className="text-xs flex-1" style={{ color: '#ffb454' }}>
            This boss still uses the old switches. Turn them into a sequence you can reorder.
          </span>
          <button className={btn} onClick={adoptLegacy}>Convert</button>
        </div>
      )}

      {steps.length === 0 && !hasLegacy && (
        <p className="text-xs text-msx-textsecondary">
          No sequence: the chain seals the moment the room loads and the fight starts
          straight away. Add steps to make an entrance.
        </p>
      )}

      {steps.map((step, index) => (
        <div key={index} className="flex gap-2 items-end mb-2 pb-2 border-b border-msx-border">
          <div className="w-6 text-xs text-msx-textsecondary pb-2">{index + 1}.</div>
          <div className="w-36">
            <label className={label}>Step</label>
            <input className={input} value={stepTitle(step)} readOnly />
          </div>

          {step.kind === 'closeBarrier' && (
            <>
              <div className="flex items-center gap-2 pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4" checked={step.animated !== false}
                    onChange={e => patch(index, { animated: e.target.checked })} />
                  <span className="text-xs text-msx-textsecondary">Animate</span>
                </label>
              </div>
              <div className="w-32">
                <label className={label}>Cells per frame</label>
                <input type="number" min={1} max={16} className={input}
                  disabled={step.animated === false}
                  value={step.cellsPerFrame ?? 4}
                  onChange={e => patch(index, { cellsPerFrame: Number(e.target.value) })} />
              </div>
              <div className="flex-1 text-xs text-msx-textsecondary pb-2">
                {step.animated === false
                  ? 'The whole chain appears at once.'
                  : `The 52 perimeter cells appear ${step.cellsPerFrame ?? 4} at a time (about ${Math.ceil(52 / Math.max(1, step.cellsPerFrame ?? 4))} frames).`}
              </div>
            </>
          )}

          {step.kind === 'dialogue' && (
            <div className="flex-1">
              <label className={label}>Dialogue</label>
              <select className={input} value={step.dialogueAssetId}
                onChange={e => patch(index, { dialogueAssetId: e.target.value })}>
                <option value="">— pick a dialogue —</option>
                {dialogues.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
              </select>
            </div>
          )}

          {step.kind === 'wait' && (
            <>
              <div className="w-28">
                <label className={label}>Frames</label>
                <input type="number" min={1} max={255} className={input} value={step.frames}
                  onChange={e => patch(index, { frames: Number(e.target.value) })} />
              </div>
              <div className="flex-1 text-xs text-msx-textsecondary pb-2">
                About {(step.frames / 60).toFixed(1)}s at 60Hz.
              </div>
            </>
          )}

          <div className="flex gap-1">
            <button className={btn} title="Move earlier" disabled={index === 0}
              onClick={() => move(index, -1)}>&uarr;</button>
            <button className={btn} title="Move later" disabled={index === steps.length - 1}
              onClick={() => move(index, 1)}>&darr;</button>
            <button className={btn} onClick={() => update(steps.filter((_, i) => i !== index))}>&#10005;</button>
          </div>
        </div>
      ))}

      {steps.length > 0 && (
        <p className="text-xs text-msx-textsecondary mt-2">
          The player is frozen for the whole sequence and regains control at the end.
          A dialogue step waits for the player to read it through.
          {!hasCloseStep && boss.bossBarrierTileId && (
            <span style={{ color: '#ffb454' }}> No &ldquo;Close chain&rdquo; step: the chain never seals, so the player can walk out mid-fight.</span>
          )}
        </p>
      )}
    </div>
  );
};

/** HP-threshold attack phases. */
const PhasesPanel: React.FC<{
  boss: Msx2BossDefinition;
  onUpdate: (b: Msx2BossDefinition) => void;
  pathAssets: ProjectAsset[];
}> = ({ boss, onUpdate, pathAssets }) => {
  const phases = boss.bossPhases || [];
  const update = (next: Msx2BossPhase[]) => onUpdate({ ...boss, bossPhases: next });
  const add = () => update([...phases, {
    id: `phase_${phases.length + 1}`,
    enterWhenHpBelowPercent: 100,
    interval: boss.bossShootInterval || 90,
    projectileSpeed: boss.bossProjectileSpeed || 2,
  }]);

  return (
    <div className={card}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Attack Phases</h3>
        <button className={btn} onClick={add}>+ Add phase</button>
      </div>
      {phases.length === 0 && (
        <p className="text-xs text-msx-textsecondary">
          No phases: the boss keeps a single firing rhythm for the whole fight.
        </p>
      )}
      {phases.map((phase, index) => (
        <div key={index} className="grid grid-cols-7 gap-2 items-end mb-2 pb-2 border-b border-msx-border">
          <div>
            <label className={label}>ID</label>
            <input className={input} value={phase.id}
              onChange={e => update(phases.map((p, i) => i === index ? { ...p, id: e.target.value } : p))} />
          </div>
          <div>
            <label className={label}>At or below HP %</label>
            <input type="number" min={1} max={100} className={input} value={phase.enterWhenHpBelowPercent}
              onChange={e => update(phases.map((p, i) => i === index ? { ...p, enterWhenHpBelowPercent: Number(e.target.value) } : p))} />
          </div>
          <div>
            <label className={label}>Shot interval</label>
            <input type="number" min={10} max={255} className={input} value={phase.interval}
              onChange={e => update(phases.map((p, i) => i === index ? { ...p, interval: Number(e.target.value) } : p))} />
          </div>
          <div>
            <label className={label}>Bullet speed</label>
            <input type="number" min={1} max={4} className={input} value={phase.projectileSpeed}
              onChange={e => update(phases.map((p, i) => i === index ? { ...p, projectileSpeed: Number(e.target.value) } : p))} />
          </div>
          <div className="col-span-2">
            <label className={label}>Path</label>
            <select className={input} value={phase.pathId ?? ''}
              onChange={e => update(phases.map((p, i) => i === index ? { ...p, pathId: e.target.value } : p))}>
              <option value="">Keep the boss default</option>
              <option value="none">None — stand still</option>
              {pathAssets.map(asset => (
                <option key={asset.id} value={asset.id}>{asset.name}</option>
              ))}
            </select>
          </div>
          <button className={btn} onClick={() => update(phases.filter((_, i) => i !== index))}>Remove</button>
        </div>
      ))}
      <p className="text-xs text-msx-textsecondary mt-2">
        The phase with the lowest matching threshold wins, so a boss naturally gets
        angrier as it loses health. Movement speed is not a phase knob: the body's
        trail cleanup caps it at 2 px/frame.
      </p>
    </div>
  );
};

/**
 * Visual damage-zone editor: drag rectangles straight onto the body instead of
 * typing boss-local coordinates. Zone order matters at runtime (first match
 * wins), so weak points must sit ABOVE the armour that contains them.
 */
const ZonesPanel: React.FC<{
  boss: Msx2BossDefinition;
  onUpdate: (b: Msx2BossDefinition) => void;
  bodyW: number;
  bodyH: number;
  bodyStamp?: BodyStampRef;
  frames: number;
  setStatusBarMessage?: (m: string) => void;
}> = ({ boss, onUpdate, bodyW, bodyH, bodyStamp, frames, setStatusBarMessage }) => {
  const zones = boss.damageZones || [];
  const update = (next: Msx2BossDamageZone[]) => onUpdate({ ...boss, damageZones: next });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  // A weak point can sit on a body part that moves between frames, so the
  // backdrop frame is pickable while the coordinates stay boss-local.
  const [previewFrame, setPreviewFrame] = useState(0);
  const scale = Math.max(1, Math.floor(320 / Math.max(bodyW, 1)));

  const toLocal = (ev: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(bodyW - 1, Math.floor((ev.clientX - rect.left) / scale))),
      y: Math.max(0, Math.min(bodyH - 1, Math.floor((ev.clientY - rect.top) / scale))),
    };
  };

  const finishDrag = () => {
    if (!drag) return;
    const x = Math.min(drag.x0, drag.x1);
    const y = Math.min(drag.y0, drag.y1);
    const w = Math.abs(drag.x1 - drag.x0) + 1;
    const h = Math.abs(drag.y1 - drag.y0) + 1;
    setDrag(null);
    if (w < 4 || h < 4) return;   // ignore stray clicks
    // New zones go FIRST: a freshly drawn weak point must win over the armour
    // plate that usually covers the whole body.
    update([{ id: `zone_${zones.length + 1}`, type: 'weak_point', x, y, w, h, damageMultiplier: 1 }, ...zones]);
    setStatusBarMessage?.(`Damage zone added at ${x},${y} (${w}x${h}).`);
  };

  return (
    <div className={card}>
      <h3 className="text-sm font-semibold mb-3">Damage Zones</h3>
      <div className="flex gap-4">
        <div>
          <div
            ref={canvasRef}
            className="relative border border-msx-border cursor-crosshair"
            style={{ width: bodyW * scale, height: bodyH * scale, background: MSX2_PREVIEW_BG }}
            onMouseDown={e => { const p = toLocal(e); setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y }); }}
            onMouseMove={e => { if (drag) { const p = toLocal(e); setDrag({ ...drag, x1: p.x, y1: p.y }); } }}
            onMouseUp={finishDrag}
            onMouseLeave={() => setDrag(null)}
          >
            {/* The body sits behind the zones and must not eat the drag events. */}
            <div className="absolute inset-0 pointer-events-none">
              {bodyStamp && <StampCanvas stamp={bodyStamp} scale={scale} frames={frames} frameIndex={previewFrame} />}
            </div>
            {zones.map((zone, index) => (
              <div
                key={index}
                onClick={() => setSelected(index)}
                className="absolute"
                style={{
                  left: zone.x * scale, top: zone.y * scale,
                  width: zone.w * scale, height: zone.h * scale,
                  border: `2px solid ${zone.type === 'invulnerable' ? '#888' : '#ff4d4d'}`,
                  background: zone.type === 'invulnerable' ? 'rgba(136,136,136,0.15)' : 'rgba(255,77,77,0.2)',
                  outline: selected === index ? '1px dashed #fff' : undefined,
                }}
                title={`${zone.id} (${zone.type})`}
              />
            ))}
            {drag && (
              <div className="absolute border-2 border-dashed border-white/70" style={{
                left: Math.min(drag.x0, drag.x1) * scale,
                top: Math.min(drag.y0, drag.y1) * scale,
                width: (Math.abs(drag.x1 - drag.x0) + 1) * scale,
                height: (Math.abs(drag.y1 - drag.y0) + 1) * scale,
              }} />
            )}
          </div>
          {frames > 1 && (
            <div className="flex gap-1 mt-2 items-center">
              <span className="text-xs text-msx-textsecondary mr-1">Frame:</span>
              {Array.from({ length: frames }, (_, index) => (
                <button key={index} className={`${btn} ${previewFrame === index ? 'bg-msx-accent text-white' : ''}`}
                  onClick={() => setPreviewFrame(index)}>{index}</button>
              ))}
            </div>
          )}
          <p className="text-xs text-msx-textsecondary mt-2" style={{ width: bodyW * scale }}>
            {bodyStamp
              ? <>Drag on the body to add a zone ({bodyW}×{bodyH} px, boss-local coordinates).
                Red = weak point, grey = armour.</>
              : <>No body stamp picked yet, so this is an empty {bodyW}×{bodyH} placeholder.
                Choose one in <strong>Body &amp; Graphics</strong> to draw zones over the real boss.</>}
          </p>
        </div>

        <div className="flex-1">
          {zones.length === 0 && (
            <p className="text-xs text-msx-textsecondary">
              No zones: the whole body takes 1 damage per bullet.
            </p>
          )}
          {zones.map((zone, index) => (
            <div key={index} className={`grid grid-cols-10 gap-1 items-end mb-2 pb-2 border-b border-msx-border ${selected === index ? 'bg-msx-hover/30' : ''}`}>
              <div className="col-span-2">
                <label className={label}>ID</label>
                <input className={input} value={zone.id}
                  onChange={e => update(zones.map((z, i) => i === index ? { ...z, id: e.target.value } : z))} />
              </div>
              <div className="col-span-2">
                <label className={label}>Type</label>
                <select className={input} value={zone.type}
                  onChange={e => update(zones.map((z, i) => i === index ? { ...z, type: e.target.value as any } : z))}>
                  <option value="weak_point">Weak point</option>
                  <option value="invulnerable">Armour</option>
                </select>
              </div>
              <div>
                <label className={label}>x</label>
                <input type="number" className={input} value={zone.x}
                  onChange={e => update(zones.map((z, i) => i === index ? { ...z, x: Number(e.target.value) } : z))} />
              </div>
              <div>
                <label className={label}>y</label>
                <input type="number" className={input} value={zone.y}
                  onChange={e => update(zones.map((z, i) => i === index ? { ...z, y: Number(e.target.value) } : z))} />
              </div>
              <div>
                <label className={label}>w</label>
                <input type="number" min={1} max={bodyW} className={input} value={zone.w}
                  onChange={e => update(zones.map((z, i) => i === index ? { ...z, w: Number(e.target.value) } : z))} />
              </div>
              <div>
                <label className={label}>h</label>
                <input type="number" min={1} max={bodyH} className={input} value={zone.h}
                  onChange={e => update(zones.map((z, i) => i === index ? { ...z, h: Number(e.target.value) } : z))} />
              </div>
              <div>
                <label className={label}>×dmg</label>
                <input type="number" min={1} max={16} className={input} value={zone.damageMultiplier}
                  disabled={zone.type === 'invulnerable'}
                  onChange={e => update(zones.map((z, i) => i === index ? { ...z, damageMultiplier: Number(e.target.value) } : z))} />
              </div>
              <div className="flex gap-1">
                <button className={btn} title="Move up (tested earlier)"
                  onClick={() => {
                    if (index === 0) return;
                    const next = [...zones];
                    [next[index - 1], next[index]] = [next[index], next[index - 1]];
                    update(next);
                  }}>↑</button>
                <button className={btn} onClick={() => update(zones.filter((_, i) => i !== index))}>✕</button>
              </div>
            </div>
          ))}
          <p className="text-xs text-msx-textsecondary mt-2">
            Zones are tested top to bottom and the first hit wins, so keep weak points
            above the armour that covers them.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * BossDefinition <-> BossEncounter wiring: which placed bosses use this
 * definition, and the per-instance HP override. Assigning writes `bossId` on the
 * room's boss entity, which is exactly what the generator merges at build time.
 */
const EncountersPanel: React.FC<{
  boss: Msx2BossDefinition;
  encounters: BossEncounterRef[];
  allAssets: ProjectAsset[];
  onUpdateAsset?: (assetId: string, data: any) => void;
  setStatusBarMessage?: (m: string) => void;
}> = ({ boss, encounters, allAssets, onUpdateAsset, setStatusBarMessage }) => {
  const patchEntity = (encounter: BossEncounterRef, patch: (params: any) => any) => {
    const room = allAssets.find(a => a.id === encounter.roomAssetId);
    const data = room?.data as any;
    if (!data || !onUpdateAsset) return;
    const entities = (data.entities || []).map((entity: any) =>
      entity?.id === encounter.entityId ? { ...entity, params: patch({ ...(entity.params || {}) }) } : entity);
    onUpdateAsset(encounter.roomAssetId, { entities });
  };

  const assign = (encounter: BossEncounterRef) => {
    patchEntity(encounter, params => ({ ...params, bossId: boss.id }));
    setStatusBarMessage?.(`"${encounter.entityName}" in ${encounter.roomName} now uses "${boss.name}".`);
  };

  const detach = (encounter: BossEncounterRef) => {
    patchEntity(encounter, params => {
      const { bossId, bossDefinitionId, ...rest } = params;
      return rest;
    });
    setStatusBarMessage?.(`"${encounter.entityName}" no longer follows a definition.`);
  };

  const setHpOverride = (encounter: BossEncounterRef, value: string) => {
    patchEntity(encounter, params => {
      if (value === '') {
        const { hpOverride, ...rest } = params;
        return rest;
      }
      return { ...params, hpOverride: Number(value) };
    });
  };

  return (
    <div className={card}>
      <h3 className="text-sm font-semibold mb-3">Encounters</h3>
      {encounters.length === 0 && (
        <p className="text-xs text-msx-textsecondary">
          No boss placed on any bitmap room yet. Drop a <code>boss</code> entity on a room
          in the bitmap room editor, then come back here to point it at this definition.
        </p>
      )}
      {encounters.map(encounter => {
        const usesThis = encounter.bossId === boss.id;
        const usesOther = !!encounter.bossId && !usesThis;
        return (
          <div key={`${encounter.roomAssetId}:${encounter.entityId}`}
            className="flex gap-2 items-end mb-2 pb-2 border-b border-msx-border">
            <div className="flex-1">
              <div className="text-sm">{encounter.entityName}</div>
              <div className="text-xs text-msx-textsecondary">
                {encounter.roomName} — {usesThis ? 'uses this boss' : usesOther ? `uses "${encounter.bossId}"` : 'authored inline'}
              </div>
            </div>
            <div className="w-28">
              <label className={label}>HP override</label>
              <input type="number" min={1} max={255} className={input} value={encounter.hpOverride}
                placeholder={String(boss.bossHp)} disabled={!usesThis || !onUpdateAsset}
                onChange={e => setHpOverride(encounter, e.target.value)} />
            </div>
            {usesThis
              ? <button className={btn} disabled={!onUpdateAsset} onClick={() => detach(encounter)}>Detach</button>
              : <button className={btn} disabled={!onUpdateAsset} onClick={() => assign(encounter)}>Use this boss</button>}
          </div>
        );
      })}
      <p className="text-xs text-msx-textsecondary mt-2">
        The definition supplies the defaults and the placed boss wins on anything it sets,
        so the same creature can appear in several rooms with a different HP or reward.
        Leave the override empty to inherit {boss.bossHp} HP.
      </p>
    </div>
  );
};

/** What the boss triggers when it dies. */
const DefeatPanel: React.FC<{
  boss: Msx2BossDefinition;
  onUpdate: (b: Msx2BossDefinition) => void;
  doors: Array<{ id: string; label: string }>;
  dialogues: ProjectAsset[];
  rooms: ProjectAsset[];
}> = ({ boss, onUpdate, doors, dialogues, rooms }) => {
  const actions = boss.onDefeated || [];
  const update = (next: Msx2BossDefeatAction[]) => onUpdate({ ...boss, onDefeated: next });

  const addAction = (kind: Msx2BossDefeatAction['action']) => {
    const created: Msx2BossDefeatAction =
      kind === 'setFlag' ? { action: 'setFlag', flag: `boss_${boss.id || 'x'}_defeated` }
        : kind === 'giveKey' ? { action: 'giveKey', count: 1 }
          : kind === 'showMessage' ? { action: 'showMessage', dialogueAssetId: dialogues[0]?.id || '' }
            : kind === 'changeScreen' ? { action: 'changeScreen', target: rooms[0]?.id || '' }
              : { action: 'openDoor', target: doors[0]?.id || '' };
    update([...actions, created]);
  };

  return (
    <div className={card}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Defeat Actions</h3>
        <div className="flex gap-1">
          <button className={btn} onClick={() => addAction('setFlag')}>+ Set flag</button>
          <button className={btn} onClick={() => addAction('giveKey')}>+ Give key</button>
          <button className={btn} onClick={() => addAction('openDoor')} disabled={doors.length === 0}>+ Open door</button>
          <button className={btn} onClick={() => addAction('showMessage')} disabled={dialogues.length === 0}>+ Message</button>
          <button className={btn} onClick={() => addAction('changeScreen')} disabled={rooms.length === 0}>+ Change screen</button>
        </div>
      </div>

      {actions.length === 0 && (
        <p className="text-xs text-msx-textsecondary">
          Nothing happens beyond the boss disappearing and the room unlocking.
        </p>
      )}

      {actions.map((action, index) => (
        <div key={index} className="flex gap-2 items-end mb-2 pb-2 border-b border-msx-border">
          <div className="w-28">
            <label className={label}>Action</label>
            <input className={input} value={action.action} readOnly />
          </div>
          {action.action === 'setFlag' && (
            <div className="flex-1">
              <label className={label}>Flag name</label>
              <input className={input} value={action.flag}
                onChange={e => update(actions.map((a, i) => i === index ? { ...a, flag: e.target.value } as Msx2BossDefeatAction : a))} />
            </div>
          )}
          {action.action === 'giveKey' && (
            <div className="w-32">
              <label className={label}>How many</label>
              <input type="number" min={1} max={255} className={input} value={action.count ?? 1}
                onChange={e => update(actions.map((a, i) => i === index ? { ...a, count: Number(e.target.value) } as Msx2BossDefeatAction : a))} />
            </div>
          )}
          {action.action === 'openDoor' && (
            <div className="flex-1">
              <label className={label}>Door</label>
              <select className={input} value={action.target}
                onChange={e => update(actions.map((a, i) => i === index ? { ...a, target: e.target.value } as Msx2BossDefeatAction : a))}>
                <option value="">— pick a locked door —</option>
                {doors.map(door => <option key={door.id} value={door.id}>{door.label}</option>)}
              </select>
            </div>
          )}
          {action.action === 'showMessage' && (
            <div className="flex-1">
              <label className={label}>Dialogue</label>
              <select className={input} value={action.dialogueAssetId || ''}
                onChange={e => update(actions.map((a, i) => i === index ? { ...a, dialogueAssetId: e.target.value } as Msx2BossDefeatAction : a))}>
                <option value="">— pick a dialogue —</option>
                {dialogues.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
              </select>
            </div>
          )}
          {action.action === 'changeScreen' && (
            <>
              <div className="flex-1">
                <label className={label}>Go to room</label>
                <select className={input} value={action.target || ''}
                  onChange={e => update(actions.map((a, i) => i === index ? { ...a, target: e.target.value } as Msx2BossDefeatAction : a))}>
                  <option value="">— pick a room —</option>
                  {rooms.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                </select>
              </div>
              <div className="w-20">
                <label className={label}>Entry x</label>
                <input type="number" min={0} max={254} className={input} value={action.entryX ?? ''}
                  placeholder="keep"
                  onChange={e => update(actions.map((a, i) => i === index
                    ? { ...a, entryX: e.target.value === '' ? undefined : Number(e.target.value) } as Msx2BossDefeatAction : a))} />
              </div>
              <div className="w-20">
                <label className={label}>Entry y</label>
                <input type="number" min={0} max={255} className={input} value={action.entryY ?? ''}
                  placeholder="keep"
                  onChange={e => update(actions.map((a, i) => i === index
                    ? { ...a, entryY: e.target.value === '' ? undefined : Number(e.target.value) } as Msx2BossDefeatAction : a))} />
              </div>
            </>
          )}
          <button className={btn} onClick={() => update(actions.filter((_, i) => i !== index))}>Remove</button>
        </div>
      ))}

      <p className="text-xs text-msx-textsecondary mt-2">
        The boss is a progress event, not just an enemy: these run once, when it dies.
        "Give key" needs a key/door system in the project, and "open door" needs a
        locked door entity to target.
      </p>
    </div>
  );
};

/** A blank boss with the defaults the runtime expects. */
export function createMsx2BossDefinition(id: string, name: string): Msx2BossDefinition {
  return {
    id,
    name,
    bossAtlasEntryId: '',
    bossFrames: 1,
    bossAnimDelay: 12,
    bossHp: 8,
    bossDamage: 1,
    bossInterval: 3,
    bossMovement: 'patrolX',
    bossSpeed: 2,
    bossRangePx: 0,
    bossBarrierTileId: '',
    bossProjectileKind: 'sprite',
    bossProjectileSpriteId: '',
    bossProjectileTileId: '',
    bossShootInterval: 90,
    bossProjectileSpeed: 2,
    bossProjectileDamage: 1,
    bossPhases: [],
    damageZones: [],
    onDefeated: [],
  };
}
