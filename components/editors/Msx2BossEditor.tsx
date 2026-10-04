import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Msx2BitmapStampAsset,
  Msx2BossDamageZone,
  Msx2BossDefeatAction,
  Msx2BossDefinition,
  Msx2BossPhase,
  Msx2BossRoomLockStep,
  Msx2ShootDefinition,
  Msx2Screen5BitmapRoom,
  ProjectAsset,
  Screen5PaletteSlot,
} from '../../types';
import { createDefaultScreen5PaletteSlots, ensureScreen5PaletteSlots } from '../../utils/msx2PaletteUtils';
import { WorldPaletteResolution, resolveWorldPalettes } from '../../utils/msx2WorldPalette';
import { AtlasEntryRef, collectAtlasEntries } from '../../utils/msx2AtlasEntries';
import { bitmapStampFrameCount, bitmapStampToPixelGrid } from '../../utils/msx2Screen5BitmapTileLibrary';

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

const NAV_ITEMS = ['General', 'Body & Graphics', 'Movement', 'Room Lock', 'Attack Phases', 'Damage Zones', 'Death FX', 'Defeat Actions', 'Encounters'] as const;
type Section = typeof NAV_ITEMS[number];

/** MSX2 palette approximation, good enough for the zone-editor preview. */
const MSX2_PREVIEW_BG = '#101018';

/** What a boss is able to fire, as the generator will resolve it at build time. */
interface BossAttackCapabilities {
  /** A projectile back-end is configured, so cadence / bullet speed mean something. */
  bullets: boolean;
  /** Hardware-sprite bullets: the only back-end that can fire an authored pattern. */
  spriteBullets: boolean;
  /** Ceiling debris: aimed-shot wording (and shoot patterns) do not apply. */
  fallingRocks: boolean;
  /** Hardware-sprite soap bubbles that rebound and expire after authored hits. */
  soapBubbles: boolean;
  /** A growing cardinal laser will be emitted for this boss. */
  laser: boolean;
}

/**
 * Mirror of the generator's `resolveProjectile` / `resolveLaser` decisions
 * (utils/msxGenerator/generators/msx2/msx2BitmapBossGenerator.ts).
 *
 * Kept deliberately in step with them: the Attack Phases table uses this to
 * decide which knobs to show, and a UI that offers a knob the build silently
 * drops is worse than no knob at all.
 */
function resolveBossAttacks(
  boss: Msx2BossDefinition,
  atlasEntries: AtlasEntryRef[],
  bodyW: number,
  bodyH: number,
  shootAssets: ProjectAsset[],
): BossAttackCapabilities {
  const fallingRocks = (boss.bossProjectilePattern || 'aimed') === 'fallingRocks';
  const soapBubbles = (boss.bossProjectilePattern || 'aimed') === 'soapBubbles';
  const moleLightning = (boss.bossProjectilePattern || 'aimed') === 'moleLightning';
  const moleRock = (boss.bossProjectilePattern || 'aimed') === 'moleRock';
  const wantsBitmap = !soapBubbles && !moleLightning && !moleRock && (fallingRocks || (boss.bossProjectileKind || 'sprite') === 'bitmap');
  const projectileId = String(boss.bossProjectileTileId || '').trim();
  const projectileEntry = projectileId
    ? atlasEntries.find(entry => entry.id === projectileId)
    : undefined;
  const projectileFits = !!projectileEntry
    && projectileEntry.w >= 8 && projectileEntry.w <= 16
    && projectileEntry.h >= 8 && projectileEntry.h <= 16;
  // Sprite bullets need no atlas tile at all (the 16x16 blob is generated), so
  // they are on as soon as the boss carries any projectile setting.
  const spriteBullets = !wantsBitmap
    && (!!projectileId || boss.bossShootInterval !== undefined || boss.bossProjectileKind !== undefined);
  const bullets = spriteBullets || (wantsBitmap && projectileFits);

  const laserShoot = shootAssets.find(asset => asset.id === boss.bossLaserShootId)?.data as Msx2ShootDefinition | undefined;
  const authoredLaser = laserShoot?.pattern === 'laser' ? laserShoot : undefined;
  const laserId = String(authoredLaser?.laserTileId ?? boss.bossLaserTileId ?? '').trim();
  const laserEntry = laserId ? atlasEntries.find(entry => entry.id === laserId) : undefined;
  const explicitLaser = !!laserEntry && laserEntry.w === 16 && laserEntry.h === 16;
  // Automatic fallback, in the generator's order: the projectile tile if it is
  // 16x16, then the body when the whole boss is a single 16x16 cell.
  const fallbackLaser = !laserId
    && ((!!projectileEntry && projectileEntry.w === 16 && projectileEntry.h === 16)
      || (bodyW === 16 && bodyH === 16));
  const laser = (explicitLaser || fallbackLaser) && (authoredLaser?.laserDirectionMask ?? boss.bossLaserDirectionMask ?? 0x0f) !== 0;
  return { bullets, spriteBullets, fallingRocks, soapBubbles, laser };
}

const card = 'bg-msx-panel border border-msx-border rounded p-3 mb-3';
const label = 'block text-xs text-msx-textsecondary mb-1';
const input = 'w-full bg-msx-bgcolor border border-msx-border rounded px-2 py-1 text-sm text-msx-textprimary';
const btn = 'px-2 py-1 text-xs rounded border border-msx-border hover:bg-msx-hover';

/** Memoised {@link resolveWorldPalettes}: the world palette wins over the room's own. */
function useWorldPalettes(allAssets: ProjectAsset[]): WorldPaletteResolution {
  return useMemo(() => resolveWorldPalettes(allAssets), [allAssets]);
}

/** Memoised {@link collectAtlasEntries}: distinct atlas tiles, world-coloured. */
function useAtlasEntries(allAssets: ProjectAsset[]): AtlasEntryRef[] {
  return useMemo(() => collectAtlasEntries(allAssets), [allAssets]);
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
  /** Base plus sparse Stamp frame variants. Legacy horizontal strips keep using `pixels`. */
  framePixels: number[][][];
  frameCount: number;
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
      const frameCount = bitmapStampFrameCount(stamp);
      const framePixels = Array.from({ length: frameCount }, (_unused, frameIndex) => bitmapStampToPixelGrid(stamp, frameIndex));
      const h = pixels.length;
      const w = pixels[0]?.length || 0;
      if (w <= 0 || h <= 0) continue;
      out.push({
        id: asset.id,
        name: asset.name || stamp.name || asset.id,
        w, h, pixels, framePixels, frameCount,
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
  const hasVariantFrames = stamp.frameCount > 1;
  const frameCount = hasVariantFrames ? stamp.frameCount : Math.max(1, frames);
  const sourcePixels = hasVariantFrames
    ? stamp.framePixels[Math.min(frameIndex, stamp.frameCount - 1)] || stamp.pixels
    : stamp.pixels;
  const w = hasVariantFrames ? Math.max(1, stamp.w) : Math.max(1, Math.floor(stamp.w / frameCount));
  const h = Math.max(1, stamp.h);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const image = ctx.createImageData(w, h);
    const originX = Math.min(frameIndex, frameCount - 1) * w;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const color = sourcePixels[y]?.[hasVariantFrames ? x : originX + x];
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
  }, [stamp, sourcePixels, w, h, frameIndex, frameCount, hasVariantFrames]);

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
            const frameW = stamp.frameCount > 1 ? stamp.w : Math.max(1, Math.floor(stamp.w / Math.max(1, frames)));
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
                title={`${stamp.name} — ${stamp.w}x${stamp.h}${stamp.frameCount > 1 ? ` (${stamp.frameCount} sparse frames of ${perFrame})` : frames > 1 ? ` (${frames} horizontal frames of ${perFrame})` : ''}`}
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
  /** Which node of the route this copy enters on. Blank = node 0. */
  pathStartNode: number | '';
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
          pathStartNode: params.bossPathStartNode === undefined || params.bossPathStartNode === null || params.bossPathStartNode === ''
            ? ''
            : Number(params.bossPathStartNode),
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
  const shootAssets = useMemo(() => allAssets.filter(a => a.type === 'msx2shoot'), [allAssets]);
  const dialogueAssets = useMemo(() => allAssets.filter(a => a.type === 'msx2dialogue'), [allAssets]);
  const soundAssets = useMemo(() => allAssets.filter(a => a.type === 'sound'), [allAssets]);
  const roomAssets = useMemo(() => allAssets.filter(a => a.type === 'msx2bitmaproom'), [allAssets]);
  const usedHere = encounters.filter(e => e.bossId === boss.id).length;

  const set = <K extends keyof Msx2BossDefinition>(key: K, value: Msx2BossDefinition[K]) =>
    onUpdate({ ...boss, [key]: value });

  useEffect(() => {
    if (!boss.bossPhases?.length) {
      onUpdate({ ...boss, bossPhases: [{
        id: 'phase_1', enterWhenHpBelowPercent: 100,
        interval: boss.bossShootInterval || 90,
        projectileSpeed: boss.bossProjectileSpeed || 2,
        projectileSpriteId: boss.bossProjectileSpriteId || '',
      }] });
    } else if (!boss.bossPhases.some(phase => Number(phase.enterWhenHpBelowPercent) === 100)) {
      const highest = boss.bossPhases.reduce((best, phase, index) =>
        Number(phase.enterWhenHpBelowPercent) > Number(boss.bossPhases[best].enterWhenHpBelowPercent)
          ? index : best, 0);
      onUpdate({ ...boss, bossPhases: boss.bossPhases.map((phase, index) =>
        index === highest ? { ...phase, enterWhenHpBelowPercent: 100 } : phase) });
    }
  }, [boss, onUpdate]);

  // The body drives the zone editor canvas size: zones are authored in
  // boss-local pixels, so the preview must match the real body rectangle.
  const bodyStamp = bodyStamps.find(s => s.id === boss.bossStampAssetId);
  const threadPalette = bodyStamp?.palette || createDefaultScreen5PaletteSlots();
  const stampFrameCount = bodyStamp && bodyStamp.frameCount > 1 ? bodyStamp.frameCount : 0;
  const frames = stampFrameCount || Math.max(1, Number(boss.bossFrames) || 1);
  // Pre-stamp bosses name a room atlas tile instead. The generator still
  // supports them and takes the body rectangle from that entry, so the editor
  // has to resolve it the same way -- otherwise the two disagree about how big
  // the boss is, and every size rule downstream (death FX "must fit inside the
  // body", the damage-zone canvas) is applied against a body that does not
  // exist. See msx2BitmapBossGenerator resolveBossParams / buildEntry.
  const bodyAtlasEntry = !boss.bossStampAssetId && boss.bossAtlasEntryId
    ? atlasEntries.find(e => e.id === boss.bossAtlasEntryId)
    : undefined;
  const bodyW = bodyStamp
    ? (stampFrameCount ? bodyStamp.w : Math.floor(bodyStamp.w / frames))
    : bodyAtlasEntry
      // Same clamps as the generator: even width, 16..128 per frame.
      ? Math.max(16, Math.min(128, Math.floor(Math.floor(bodyAtlasEntry.w / frames) / 2) * 2))
      : 64;
  const bodyH = bodyStamp
    ? bodyStamp.h
    : bodyAtlasEntry ? Math.max(16, Math.min(96, bodyAtlasEntry.h)) : 64;
  const bodyPreviewScale = Math.max(1, Math.min(4, Math.floor(160 / Math.max(bodyW, 1))));
  const barrierEntry = atlasEntries.find(e => e.id === boss.bossBarrierTileId);
  const activePath = pathAssets.find(asset => asset.id === boss.bossPathId);
  const activePathFiring = (activePath?.data as any)?.firing;
  // What this boss can actually DO, resolved exactly like the generator does
  // (resolveProjectile / resolveLaser). The attack-phase table is driven by it:
  // showing a bullet cadence to a boss that only fires a laser is not a small
  // cosmetic problem -- those fields genuinely do nothing for it.
  const attacks = useMemo(
    () => resolveBossAttacks(boss, atlasEntries, bodyW, bodyH, shootAssets),
    [boss, atlasEntries, bodyW, bodyH, shootAssets],
  );

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
              {boss.bossProjectilePattern !== 'moleRock' && <div>
                <label className={label}>Hit points</label>
                <input type="number" min={1} max={255} className={input}
                  value={boss.bossHp} onChange={e => set('bossHp', Number(e.target.value))} />
              </div>}
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
              {boss.bossProjectilePattern === 'moleRock'
                ? ' Set the required returned rocks in Attack Phases; an encounter HP override changes that count for its room.'
                : <> The screen may override HP with <code>hpOverride</code>.</>}
            </p>
            <p className="text-xs text-msx-textsecondary mt-2">
              For a double confrontation, create two Boss assets when they need different
              Paths, select one route in each asset's <strong>Movement</strong> tab, then place
              both Boss entities in the same SCREEN 5 room. Their laser state and defeat state
              remain independent.
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
                  onPick={id => {
                    const picked = bodyStamps.find(stamp => stamp.id === id);
                    onUpdate({
                      ...boss,
                      bossStampAssetId: id,
                      bossAtlasEntryId: '',
                      ...(picked && picked.frameCount > 1 ? { bossFrames: picked.frameCount } : {}),
                    });
                  }}
                />
                {!boss.bossStampAssetId && boss.bossAtlasEntryId && (
                  <p className="text-xs mt-1" style={{ color: '#ffb454' }}>
                    This boss still points at the old atlas entry <code>{boss.bossAtlasEntryId}</code>.
                    It keeps working, but pick a stamp to move it over.
                  </p>
                )}
              </div>
              <div>
                <label className={label}>{stampFrameCount ? 'Animation frames (from Stamp variants)' : 'Animation frames (horizontal strip)'}</label>
                <input type="number" min={1} max={4} className={input}
                  value={frames}
                  disabled={!!stampFrameCount}
                  onChange={e => set('bossFrames', Number(e.target.value))} />
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
                  : bodyAtlasEntry
                    ? Array.from({ length: frames }, (_, index) => (
                      <div key={index} className="text-center">
                        <AtlasPreviewBox entry={bodyAtlasEntry} scale={bodyPreviewScale} frames={frames} frameIndex={index}
                          emptyHint="" />
                        <div className="text-[10px] text-msx-textsecondary mt-1">frame {index}</div>
                      </div>
                    ))
                    : <AtlasPreviewBox scale={1} emptyHint="Pick a Bitmap Stamp to see the boss." />}
              </div>
            </div>

            <p className="text-xs text-msx-textsecondary mt-3">
              Body size resolves to <strong>{bodyW}×{bodyH}</strong> px per frame.
              {stampFrameCount
                ? <> The Stamp supplies {stampFrameCount} sparse frames; only cells changed from the base are stored and packed.</>
                : null}
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
              <select className={input} value={boss.bossPathId || ''} disabled={boss.bossMovement === 'randomPath' || boss.bossMovement === 'burrowRandom' || boss.bossMovement === 'chickCharge'}
                onChange={e => set('bossPathId', e.target.value)}>
                <option value="">— none, use the simple movement below —</option>
                {pathAssets.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.name}</option>
                ))}
              </select>
              <p className="text-xs text-msx-textsecondary mt-2">
                {boss.bossMovement === 'randomPath'
                  ? 'Random path generates its own branches and ignores authored routes.'
                  : boss.bossMovement === 'burrowRandom'
                    ? 'El Topo chooses a new emergence column without an authored path.'
                  : boss.bossMovement === 'chickCharge'
                    ? 'Pollito chooses a charging direction at the end of each wind-up.'
                  : <>A path wins over the simple movement, and each attack phase can switch to a different one. Author routes in <strong>MSX2 Paths</strong>.</>}
              </p>
            </div>

            <div className={`grid grid-cols-3 gap-3 ${boss.bossPathId ? 'opacity-50' : ''}`}>
              <div>
                <label className={label}>Mode</label>
                <select className={input} value={boss.bossMovement || ''}
                  onChange={e => {
                    const movement = (e.target.value || undefined) as Msx2BossDefinition['bossMovement'];
                    onUpdate({ ...boss, bossMovement: movement,
                      bossPathId: movement === 'randomPath' || movement === 'burrowRandom' || movement === 'chickCharge' ? '' : boss.bossPathId,
                      bossProjectilePattern: movement === 'burrowRandom' ? 'moleRock' : boss.bossProjectilePattern,
                      bossProjectileKind: movement === 'burrowRandom' ? 'sprite' : boss.bossProjectileKind,
                      bossThreadLength: movement === 'randomPath' ? (boss.bossThreadLength ?? 32) : boss.bossThreadLength,
                      bossThreadRetractPx: movement === 'randomPath' ? (boss.bossThreadRetractPx ?? 16) : boss.bossThreadRetractPx,
                      bossThreadReturnAfter: movement === 'randomPath' ? (boss.bossThreadReturnAfter ?? 5) : boss.bossThreadReturnAfter,
                      bossThreadEnabled: movement === 'randomPath' ? (boss.bossThreadEnabled ?? true) : boss.bossThreadEnabled });
                  }}>
                  <option value="">Inherit from the placed boss</option>
                  <option value="static">Static — never moves, only shoots</option>
                  <option value="patrolX">Patrol horizontally</option>
                  <option value="patrolY">Patrol vertically</option>
                  <option value="patrolXY">Patrol diagonally (bounces on both axes)</option>
                  <option value="randomPath">Random path — alternating web branches</option>
                  <option value="burrowRandom">El Topo — random underground emergence</option>
                  <option value="chickCharge">Pollito — pecking charge and dizzy stomp</option>
                </select>
              </div>
              <div>
                <label className={label}>Speed (px/frame)</label>
                <input type="number" min={1} max={2} className={input}
                   disabled={!!boss.bossPathId || !boss.bossMovement || boss.bossMovement === 'static' || boss.bossMovement === 'randomPath' || boss.bossMovement === 'burrowRandom'}
                  value={boss.bossSpeed ?? 2}
                  onChange={e => set('bossSpeed', Number(e.target.value))} />
              </div>
              <div>
                <label className={label}>Travel from spawn (px, 0 = whole room)</label>
                <input type="number" min={0} max={255} className={input}
                   disabled={!!boss.bossPathId || boss.bossMovement === 'static' || boss.bossMovement === 'randomPath' || boss.bossMovement === 'burrowRandom' || boss.bossMovement === 'chickCharge'}
                  value={boss.bossRangePx ?? 0}
                  onChange={e => set('bossRangePx', Number(e.target.value))} />
              </div>
            </div>
            {boss.bossPathId && boss.bossMovement !== 'randomPath' && (
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
              Random path generates alternating branches at runtime; no authored path is needed.
            </p>

            {boss.bossMovement === 'burrowRandom' && (
              <div className="mt-4 pt-3 border-t border-msx-border">
                <h4 className="text-sm font-semibold mb-2">El Topo — emergence</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className={label}>Minimum X (px)</label><input type="number" min={0} max={224} step={16} className={input} value={boss.bossMoleMinX ?? 16} onChange={e => set('bossMoleMinX', Number(e.target.value))} /></div>
                  <div><label className={label}>Maximum X (px)</label><input type="number" min={0} max={224} step={16} className={input} value={boss.bossMoleMaxX ?? 80} onChange={e => set('bossMoleMaxX', Number(e.target.value))} /></div>
                  <div><label className={label}>Spark warning (frames at 60 Hz)</label><input type="number" min={1} max={255} className={input} value={boss.bossMoleHiddenFrames ?? 240} onChange={e => set('bossMoleHiddenFrames', Number(e.target.value))} /></div>
                  <div><label className={label}>Emerging (frames)</label><input type="number" min={1} max={120} className={input} value={boss.bossMoleEmergeFrames ?? 12} onChange={e => set('bossMoleEmergeFrames', Number(e.target.value))} /></div>
                  <div><label className={label}>Retreating (frames)</label><input type="number" min={1} max={120} className={input} value={boss.bossMoleRetreatFrames ?? 10} onChange={e => set('bossMoleRetreatFrames', Number(e.target.value))} /></div>
                  <div><label className={label}>Spark colour (SCREEN 5 slot)</label><select className={input} value={boss.bossMoleSparkColor ?? 11} onChange={e => set('bossMoleSparkColor', Number(e.target.value))}>{Array.from({ length: 16 }, (_, i) => <option key={i} value={i}>{i} — {threadPalette[i]?.hex || 'palette colour'}</option>)}</select></div>
                </div>
                <p className="text-xs text-msx-textsecondary mt-2">240 warning frames = 4 seconds. Sparks mark the next random emergence point; the floor tiles stay visible throughout.</p>
              </div>
            )}

            {boss.bossMovement === 'chickCharge' && (
              <div className="mt-4 pt-3 border-t border-msx-border">
                <h4 className="text-sm font-semibold mb-2">Pollito — embestida</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className={label}>Preparación (fotogramas)</label><input type="number" min={1} max={255} className={input} value={boss.bossChickWindupFrames ?? 45} onChange={e => set('bossChickWindupFrames', Number(e.target.value))} /></div>
                  <div><label className={label}>Mareo tras fallar (fotogramas)</label><input type="number" min={1} max={255} className={input} value={boss.bossChickStunFrames ?? 150} onChange={e => set('bossChickStunFrames', Number(e.target.value))} /></div>
                  <div><label className={label}>Pausa tras acertar (fotogramas)</label><input type="number" min={1} max={255} className={input} value={boss.bossChickRecoveryFrames ?? 55} onChange={e => set('bossChickRecoveryFrames', Number(e.target.value))} /></div>
                </div>
                <p className="text-xs text-msx-textsecondary mt-2">Solo un pisotón durante el mareo quita un corazón. La embestida empuja al jugador hasta 16 píxeles, respetando los muros.</p>
              </div>
            )}

            {boss.bossMovement !== 'burrowRandom' && boss.bossMovement !== 'chickCharge' && <div className="mt-4 pt-3 border-t border-msx-border">
              <h4 className="text-sm font-semibold mb-2">Web branches</h4>
              <label className="flex items-center gap-2 text-sm mb-3">
                <input type="checkbox" checked={boss.bossThreadEnabled ?? ((boss.bossThreadLength ?? 0) > 0)}
                  onChange={e => set('bossThreadEnabled', e.target.checked)} />
                Draw a web filament while moving
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={label}>Branch extension (px)</label>
                  <input type="number" min={2} max={64} step={2} className={input}
                    value={boss.bossThreadLength ?? 32}
                    onChange={e => set('bossThreadLength', Math.max(2, Math.min(64, (Number(e.target.value) || 2) & ~1)))} />
                </div>
                <div>
                  <label className={label}>Retract along branch (px)</label>
                  <input type="number" min={0} max={boss.bossThreadLength ?? 32} step={2} className={input}
                    value={boss.bossThreadRetractPx ?? 16}
                    onChange={e => set('bossThreadRetractPx', Math.max(0, Math.min(boss.bossThreadLength ?? 32, (Number(e.target.value) || 0) & ~1)))} />
                </div>
                <div>
                  <label className={label}>Thread colour (SCREEN 5)</label>
                  <select className={input} disabled={boss.bossThreadEnabled === false}
                    value={boss.bossThreadColor ?? 14}
                    onChange={e => set('bossThreadColor', Number(e.target.value))}>
                    {Array.from({ length: 15 }, (_, i) => i + 1).map(index => (
                      <option key={index} value={index}>{index} — {threadPalette[index]?.hex || 'palette colour'}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-3 max-w-xs">
                <label className={label}>Return to spawn after branches</label>
                <input type="number" min={1} max={8} step={1} className={input}
                  disabled={boss.bossMovement !== 'randomPath'}
                  value={boss.bossThreadReturnAfter ?? 5}
                  onChange={e => set('bossThreadReturnAfter', Math.max(1, Math.min(8, Number(e.target.value) || 1)))} />
              </div>
              <p className="text-xs text-msx-textsecondary mt-2">
                Random path chooses a new direction for each branch. The boss advances by the extension
                distance, retraces the configured pixels while removing that part of the filament,
                then starts another branch. After the selected number of branches it retraces the
                whole route to spawn, erases the web and attacks again. The thread has no collision.
              </p>
            </div>}
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
                    <button key={entry.id} onClick={() => set('bossBarrierTileId', entry.id)}
                      className={`flex flex-col items-center justify-center gap-1 p-1 rounded border ${boss.bossBarrierTileId === entry.id ? 'border-msx-accent' : 'border-msx-border hover:bg-msx-hover'}`}
                      style={{ background: MSX2_PREVIEW_BG, width: 90 }}
                      title={`${entry.label}${entry.roomCount > 1 ? ` — used in ${entry.roomCount} rooms` : ` — ${entry.roomName}`}`}>
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

        {section === 'Attack Phases' && (
          <PhasesPanel boss={boss} onUpdate={onUpdate} pathAssets={pathAssets}
            shootAssets={shootAssets} spriteAssets={spriteAssets} atlasEntries={atlasEntries}
            attacks={attacks} activePathFiring={activePathFiring} />
        )}

        {section === 'Damage Zones' && (
          <ZonesPanel boss={boss} onUpdate={onUpdate} bodyW={bodyW} bodyH={bodyH}
            bodyStamp={bodyStamp} bodyAtlasEntry={bodyAtlasEntry} frames={frames} soundAssets={soundAssets}
            setStatusBarMessage={setStatusBarMessage} />
        )}

        {section === 'Death FX' && (
          <DeathFxPanel boss={boss} set={set} bodyStamps={bodyStamps} bodyW={bodyW} bodyH={bodyH}
            soundAssets={soundAssets} />
        )}

        {section === 'Defeat Actions' && (
          <DefeatPanel boss={boss} onUpdate={onUpdate} doors={doors}
            dialogues={dialogueAssets} rooms={roomAssets} />
        )}

        {section === 'Encounters' && (
          <EncountersPanel boss={boss} encounters={encounters} allAssets={allAssets}
            pathNodeCount={((activePath?.data as any)?.nodes || []).length}
            pathLoops={String((activePath?.data as any)?.loopMode || '') === 'loop'}
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
      kind === 'closeBarrier' ? { kind: 'closeBarrier', animated: true, linesPerFrame: 4 }
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
    next.push({ kind: 'closeBarrier', animated: !!legacyAnimated, linesPerFrame: 4 });
    onUpdate({
      ...boss,
      roomLockSequence: next,
      bossBarrierAnimated: undefined,
      bossBarrierDialogueAssetId: undefined,
    });
  };

  // The mandatory walk-in target, as the screen X of the player's body centre.
  // Undefined means "never authored" and keeps the historical screen centre, so
  // clearing the field is a real reset rather than "walk into the left wall".
  const entryX = typeof boss.bossIntroEntryX === 'number' && Number.isFinite(boss.bossIntroEntryX)
    ? Math.max(0, Math.min(255, Math.round(boss.bossIntroEntryX)))
    : 128;
  const setEntryX = (value: number | undefined) => onUpdate({
    ...boss,
    bossIntroEntryX: value === undefined || !Number.isFinite(value)
      ? undefined
      : Math.max(0, Math.min(255, Math.round(value))),
  });

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

      {/*
        Step 0 is not authored and cannot be removed — the runtime always walks
        the player in before the sequence runs — but WHERE it stops is per boss,
        so it is shown here, in order, rather than hidden in the runtime.
      */}
      <div className="flex gap-2 items-end mb-2 pb-2 border-b border-msx-border">
        <div className="w-6 text-xs text-msx-textsecondary pb-2">0.</div>
        <div className="w-36">
          <label className={label}>Step</label>
          <input className={input} value="Walk in (always)" readOnly />
        </div>
        <div className="w-24">
          <label className={label}>Stop at X</label>
          <input type="number" min={0} max={255} className={input} value={entryX}
            onChange={e => setEntryX(e.target.value === '' ? undefined : Number(e.target.value))} />
        </div>
        <div className="flex-1">
          <label className={label}>Click the room width to place them</label>
          <div
            className="relative h-6 rounded border border-msx-border cursor-crosshair"
            style={{ background: MSX2_PREVIEW_BG }}
            title="0 = left wall, 255 = right wall"
            onClick={e => {
              const box = e.currentTarget.getBoundingClientRect();
              if (box.width <= 0) return;
              setEntryX(Math.round(((e.clientX - box.left) / box.width) * 255));
            }}
          >
            <div className="absolute top-0 bottom-0 border-l border-dashed border-msx-textsecondary" style={{ left: '50%' }} />
            <div className="absolute top-0 bottom-0 w-1 bg-msx-accent" style={{ left: `${(entryX / 255) * 100}%` }} />
          </div>
        </div>
        <button className={btn} onClick={() => setEntryX(undefined)}
          disabled={boss.bossIntroEntryX === undefined}>Centre</button>
      </div>

      {steps.length === 0 && !hasLegacy && (
        <p className="text-xs text-msx-textsecondary">
          No authored steps: after the walk-in above, the chain seals at once and the
          fight starts. Add steps to stage the entrance.
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
                <label className={label}>Raster scanlines/frame</label>
                <input type="number" min={1} max={16} className={input}
                  disabled={step.animated === false}
                  value={step.linesPerFrame ?? step.cellsPerFrame ?? 4}
                  onChange={e => patch(index, {
                    linesPerFrame: Number(e.target.value),
                    cellsPerFrame: undefined,
                  })} />
              </div>
              <div className="flex-1 text-xs text-msx-textsecondary pb-2">
                {step.animated === false
                  ? 'The whole chain appears at once.'
                  : `A horizontal pixel scan descends from Y=0 to Y=191, ${step.linesPerFrame ?? step.cellsPerFrame ?? 4} scanline(s) per frame (about ${Math.ceil(192 / Math.max(1, step.linesPerFrame ?? step.cellsPerFrame ?? 4))} frames). Only empty perimeter cells are sealed.`}
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

/** Steps a phase may take per body update, and what that means on screen. */
const PHASE_MOVE_STEPS = [
  { value: 1, label: 'Normal — one step per update' },
  { value: 2, label: 'Fast — two steps at once' },
  { value: 3, label: 'Frantic — three steps at once' },
] as const;

/**
 * HP-threshold attack phases.
 *
 * A phase is the boss's escalation script: as its health drops it may fire a
 * different PATTERN (not just faster), speed its laser up, move in longer jumps,
 * redraw its body more often, or switch route. Everything except the threshold
 * is optional, and an untouched phase generates exactly the bytes it did before
 * those knobs existed.
 *
 * The table only offers what THIS boss can actually do (see
 * {@link resolveBossAttacks}): a laser-only boss has no bullet cadence to tune,
 * and showing it one was the fastest way to author a phase that does nothing.
 */
const PhasesPanel: React.FC<{
  boss: Msx2BossDefinition;
  onUpdate: (b: Msx2BossDefinition) => void;
  pathAssets: ProjectAsset[];
  shootAssets: ProjectAsset[];
  spriteAssets: ProjectAsset[];
  atlasEntries: AtlasEntryRef[];
  attacks: BossAttackCapabilities;
  /** `'path'` means the node scripts fire and the phase cadence is ignored. */
  activePathFiring?: string;
}> = ({ boss, onUpdate, pathAssets, shootAssets, spriteAssets, atlasEntries, attacks, activePathFiring }) => {
  const phases = boss.bossPhases || [];
  const update = (next: Msx2BossPhase[]) => {
    if (!next.length) return;
    const covered = next.some(phase => Number(phase.enterWhenHpBelowPercent) === 100);
    const complete = covered ? next : next.map((phase, index) => index === next.reduce((best, item, at) =>
      Number(item.enterWhenHpBelowPercent) > Number(next[best].enterWhenHpBelowPercent) ? at : best, 0)
      ? { ...phase, enterWhenHpBelowPercent: 100 } : phase);
    onUpdate({ ...boss, bossPhases: complete });
  };
  const patch = (index: number, changes: Partial<Msx2BossPhase>) =>
    update(phases.map((phase, i) => i === index ? { ...phase, ...changes } : phase));
  const set = <K extends keyof Msx2BossDefinition>(key: K, value: Msx2BossDefinition[K]) =>
    onUpdate({ ...boss, [key]: value });
  const projectileEntry = atlasEntries.find(entry => entry.id === boss.bossProjectileTileId);

  const maxHp = Math.max(1, Number(boss.bossHp) || 1);
  const baseBodyInterval = Math.max(1, Number(boss.bossInterval) || 3);
  const baseStepPx = Math.max(1, Math.min(2, Number(boss.bossSpeed) || 2));
  const laserAssets = shootAssets.filter(asset => (asset.data as Msx2ShootDefinition)?.pattern === 'laser');
  const bulletShootAssets = shootAssets.filter(asset => (asset.data as Msx2ShootDefinition)?.pattern !== 'laser');
  const selectedLaser = laserAssets.find(asset => asset.id === boss.bossLaserShootId)?.data as Msx2ShootDefinition | undefined;
  const baseLaserInterval = Number(selectedLaser?.laserInterval ?? boss.bossLaserInterval ?? 90);
  const legacyLaserTile = atlasEntries.find(entry => entry.id === boss.bossLaserTileId);
  /** Same conversion the generator makes: a percentage becomes an absolute HP. */
  const hpOf = (percent: number) =>
    Math.max(1, Math.min(255, Math.ceil((maxHp * Math.max(1, Math.min(100, percent || 100))) / 100)));

  // Fight order = the runtime's order: thresholds ascending, first match wins.
  // Everything the panel says about "when is this phase active" is derived from
  // it, so the editor cannot describe an order the ROM does not use.
  const ranked = phases
    .map((phase, index) => ({ phase, index, hp: hpOf(phase.enterWhenHpBelowPercent) }))
    .sort((a, b) => a.hp - b.hp);
  const bandOf = (index: number) => {
    const at = ranked.findIndex(row => row.index === index);
    if (at < 0) return null;
    const upper = ranked[at].hp;
    const lower = at > 0 ? ranked[at - 1].hp + 1 : 1;
    // A duplicate threshold is dead code: the earlier entry already matched.
    const shadowed = at > 0 && ranked[at - 1].hp >= upper;
    return { upper, lower, shadowed, order: ranked.length - at };
  };
  const highest = ranked.length ? ranked[ranked.length - 1].hp : 0;

  const add = () => {
    // Suggest a threshold strictly BELOW the lowest one authored so far, in
    // ABSOLUTE hit points: two phases that round to the same HP means the second
    // can never run, and that is the commonest way to author a dead phase.
    // A boss with very few hit points can run out of room, and the card then
    // says so rather than the editor pretending otherwise.
    const target = ranked.length ? Math.max(1, ranked[0].hp - 1) : maxHp;
    const percent = phases.length === 0 ? 100 : Math.max(1, Math.min(100, Math.ceil((target * 100) / maxHp)));
    update([...phases, {
      id: `phase_${phases.length + 1}`,
      enterWhenHpBelowPercent: percent,
      interval: boss.bossShootInterval || 90,
      projectileSpeed: boss.bossProjectileSpeed || 2,
      projectileSpriteId: phases[phases.length - 1]?.projectileSpriteId ?? boss.bossProjectileSpriteId ?? '',
    }]);
  };

  const firesLabel = attacks.bullets && attacks.laser ? 'bullets and laser'
    : attacks.laser ? 'laser only'
      : attacks.soapBubbles ? 'soap bubbles'
      : boss.bossProjectilePattern === 'moleLightning' ? 'electric bolts'
      : boss.bossProjectilePattern === 'moleRock' ? 'thrown rock'
      : attacks.fallingRocks ? 'falling rocks'
        : attacks.bullets ? 'bullets'
          : 'nothing yet';

  return (
    <div className={card}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Attack Phases</h3>
        <button className={btn} onClick={add}>+ Add phase</button>
      </div>

      <div className="border border-msx-border rounded p-2 mb-3">
        <h4 className="text-xs font-semibold mb-2">Projectile setup shared by the phases</h4>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className={label}>Launch pattern</label>
            <select className={input} value={boss.bossProjectilePattern || 'aimed'}
              onChange={e => set('bossProjectilePattern', e.target.value as Msx2BossDefinition['bossProjectilePattern'])}>
              <option value="aimed">Aimed at the player</option>
              <option value="fallingRocks">Falling rocks from the ceiling</option>
              <option value="soapBubbles">Soap bubbles — diagonal rebounds</option>
              <option value="moleLightning">El Topo — upward electric fan</option>
              <option value="moleRock">El Topo — arcing rock</option>
            </select>
          </div>
          <div>
            <label className={label}>Kind</label>
            <select className={input} value={boss.bossProjectileKind || 'sprite'}
              disabled={boss.bossProjectilePattern === 'fallingRocks' || boss.bossProjectilePattern === 'soapBubbles' || boss.bossProjectilePattern === 'moleLightning' || boss.bossProjectilePattern === 'moleRock'}
              onChange={e => set('bossProjectileKind', e.target.value as 'sprite' | 'bitmap')}>
              <option value="sprite">Hardware sprite</option>
              <option value="bitmap">Bitmap blit</option>
            </select>
          </div>
          <div>
            <label className={label}>Damage (hearts)</label>
            <input type="number" min={0} max={8} className={input} value={boss.bossProjectileDamage}
              onChange={e => set('bossProjectileDamage', Number(e.target.value))} />
          </div>
        </div>
        {boss.bossProjectilePattern === 'soapBubbles' && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div>
              <label className={label}>Rebounds per bubble</label>
              <input type="number" min={1} max={15} className={input}
                value={boss.bossBubbleBounces ?? 5}
                onChange={e => set('bossBubbleBounces', Number(e.target.value))} />
            </div>
            <div>
              <label className={label}>Mouth X (boss px)</label>
              <input type="number" min={0} max={127} className={input}
                value={boss.bossBubbleMouthX ?? 18}
                onChange={e => set('bossBubbleMouthX', Number(e.target.value))} />
            </div>
            <div>
              <label className={label}>Mouth Y (boss px)</label>
              <input type="number" min={0} max={95} className={input}
                value={boss.bossBubbleMouthY ?? 44}
                onChange={e => set('bossBubbleMouthY', Number(e.target.value))} />
            </div>
            <p className="col-span-3 text-xs text-msx-textsecondary">The head opens on each volley, the bubbles reflect diagonally, and a new fan rotates its launch angles after the whole volley has vanished.</p>
          </div>
        )}
        {boss.bossProjectilePattern === 'moleLightning' && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div><label className={label}>Ray range (px)</label><input type="number" min={16} max={240} step={8} className={input} value={boss.bossMoleRayRangePx ?? 128} onChange={e => set('bossMoleRayRangePx', Number(e.target.value))} /></div>
            <div><label className={label}>Diagonal angle from vertical</label><select className={input} value={boss.bossMoleRayAngleSteps ?? 2} onChange={e => set('bossMoleRayAngleSteps', Number(e.target.value))}><option value={1}>22.5°</option><option value={2}>45°</option><option value={3}>67.5°</option></select></div>
            <div><label className={label}>Ray speed (px/frame)</label><input type="number" min={1} max={4} className={input} value={boss.bossMoleRaySpeed ?? 2} onChange={e => set('bossMoleRaySpeed', Number(e.target.value))} /></div>
            <p className="col-span-3 text-xs text-msx-textsecondary">The mole fires three electric bolts: vertical and both diagonals. Range determines how long the bolts remain active.</p>
          </div>
        )}
        {boss.bossProjectilePattern === 'moleRock' && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div><label className={label}>Rock arc height</label><select className={input} value={boss.bossMoleRockArcHeightPx ?? 80} onChange={e => set('bossMoleRockArcHeightPx', Number(e.target.value) as 40 | 60 | 80)}><option value={40}>Low</option><option value={60}>Medium</option><option value={80}>High</option></select></div>
            <div><label className={label}>Returned rocks to defeat</label><input type="number" min={1} max={255} className={input} value={boss.bossHp} onChange={e => set('bossHp', Math.max(1, Math.min(255, Number(e.target.value) || 1)))} /></div>
            <p className="col-span-3 text-xs text-msx-textsecondary">Shoot the rock while it rises: El Topo stays exposed and the return removes one point. He hides as soon as it starts descending, so a later return misses. An unreturned rock lands and disappears.</p>
          </div>
        )}
        {(boss.bossProjectilePattern === 'fallingRocks' || boss.bossProjectileKind === 'bitmap') && (
          <div className="mt-2">
            <label className={label}>Bullet atlas tile (8..16 px)</label>
            <select className={input} value={boss.bossProjectileTileId}
              onChange={e => set('bossProjectileTileId', e.target.value)}>
              <option value="">Choose a tile</option>
              {atlasEntries.filter(entry => entry.w >= 8 && entry.w <= 16 && entry.h >= 8 && entry.h <= 16)
                .map(entry => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
            </select>
            <div className="mt-2"><AtlasPreviewBox entry={projectileEntry} scale={4} emptyHint="Pick a bullet tile." /></div>
            {boss.bossProjectilePattern === 'fallingRocks' && (
              <p className="text-xs text-msx-textsecondary mt-1">Falling rocks always use the bitmap blitter and require a tile.</p>
            )}
          </div>
        )}
      </div>

      <div className="border border-msx-border rounded p-2 mb-3">
        <h4 className="text-xs font-semibold mb-2">Laser shoot shared by the phases</h4>
        <label className={label}>Laser pattern</label>
        <select className={input} value={boss.bossLaserShootId ?? ''}
          onChange={e => set('bossLaserShootId', e.target.value)}>
          <option value="">Legacy boss laser settings</option>
          {laserAssets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
        </select>
        {boss.bossLaserShootId && !selectedLaser && (
          <p className="text-xs text-yellow-400 mt-2">The selected Laser Shoot is missing. The ROM will use the legacy boss settings.</p>
        )}
        {selectedLaser ? (
          <p className="text-xs text-msx-textsecondary mt-2">Edit tile, length, direction and wave interval in the selected MSX2 Shoots asset. Each phase can override its wave interval below.</p>
        ) : (
          <details className="mt-2">
            <summary className="text-xs cursor-pointer">Edit legacy laser settings</summary>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className={label}>Frames between waves</label>
                <input type="number" min={1} max={255} className={input} value={boss.bossLaserInterval ?? 90}
                  onChange={e => set('bossLaserInterval', Number(e.target.value))} />
              </div>
              <div>
                <label className={label}>Maximum length (pixels)</label>
                <input type="number" min={16} max={240} step={16} className={input} value={boss.bossLaserMaxLengthPx ?? 128}
                  onChange={e => set('bossLaserMaxLengthPx', Number(e.target.value))} />
              </div>
            </div>
            <label className={`${label} mt-2`}>Bitmap tile (16×16)</label>
            <select className={input} value={boss.bossLaserTileId ?? ''} onChange={e => set('bossLaserTileId', e.target.value)}>
              <option value="">Automatic: projectile tile or 16×16 boss body</option>
              {atlasEntries.filter(entry => entry.w === 16 && entry.h === 16)
                .map(entry => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
            </select>
            {legacyLaserTile && <div className="mt-2"><AtlasPreviewBox entry={legacyLaserTile} scale={3} emptyHint="" /></div>}
            <label className={`${label} mt-2`}>Directions</label>
            <div className="flex gap-3 text-xs">
              {['North', 'East', 'South', 'West'].map((direction, bit) => (
                <label key={direction} className="flex items-center gap-1">
                  <input type="checkbox" checked={!!((boss.bossLaserDirectionMask ?? 0x0f) & (1 << bit))}
                    onChange={() => set('bossLaserDirectionMask', (boss.bossLaserDirectionMask ?? 0x0f) ^ (1 << bit))} />
                  {direction}
                </label>
              ))}
            </div>
          </details>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
        <span className="px-2 py-1 rounded border border-msx-border text-msx-textsecondary">
          This boss fires: <strong className="text-msx-textprimary">{firesLabel}</strong>
        </span>
        <span className="px-2 py-1 rounded border border-msx-border text-msx-textsecondary">
          {boss.bossProjectilePattern === 'moleRock' ? 'Returned rocks to defeat' : 'Hit points'}: <strong className="text-msx-textprimary">{maxHp}</strong>
        </span>
        {!attacks.bullets && !attacks.laser && (
          <span className="text-yellow-400">
            No attack is configured, so a phase can still change route, body cadence and speed — but nothing will shoot.
          </span>
        )}
      </div>

      {activePathFiring === 'path' && (
        <p className="text-xs mb-3" style={{ color: '#ffb454' }}>
          The boss path is set to <strong>only the node scripts shoot</strong>, so the
          firing cadence below is ignored while that path is active. Fire from the path
          nodes, or switch the path to the automatic cadence.
        </p>
      )}

      {phases.map((phase, index) => {
        const band = bandOf(index);
        const shootAsset = shootAssets.find(asset => asset.id === phase.shootId);
        const shootDefinition = shootAsset?.data as Msx2ShootDefinition | undefined;
        const shootSpriteId = boss.bossProjectilePattern !== 'moleRock' && shootDefinition?.pattern !== 'laser'
          ? String(shootDefinition?.projectileSpriteId || '').trim() : '';
        const shootSprite = spriteAssets.find(asset => asset.id === shootSpriteId);
        const moveSteps = Math.max(1, Math.min(3, Number(phase.moveStepMultiplier) || 1));
        const bodyInterval = Number(phase.bodyInterval) || 0;
        return (
          <div key={index} className="border border-msx-border rounded p-2 mb-3">
            {/* --- identity and the HP band this phase really covers --- */}
            <div className="flex items-end gap-2 mb-2">
              <div className="w-40">
                <label className={label}>ID</label>
                <input className={input} value={phase.id}
                  onChange={e => patch(index, { id: e.target.value })} />
              </div>
              <div className="w-32">
                <label className={label}>At or below HP %</label>
                <input type="number" min={1} max={100} className={input} value={phase.enterWhenHpBelowPercent}
                  onChange={e => patch(index, { enterWhenHpBelowPercent: Number(e.target.value) })} />
              </div>
              <div className="flex-1">
                <label className={label}>Active while</label>
                {/* Bar and caption sit side by side: printing the text over the
                    bar made the overlap unreadable exactly where it matters. */}
                <div className="flex items-center gap-2 h-6">
                  <div className="flex-1 h-3 rounded border border-msx-border overflow-hidden relative"
                    style={{ background: MSX2_PREVIEW_BG }}>
                    {band && !band.shadowed && (
                      <div className="absolute top-0 bottom-0 bg-msx-accent"
                        style={{
                          left: `${((band.lower - 1) / maxHp) * 100}%`,
                          width: `${Math.max(2, ((band.upper - band.lower + 1) / maxHp) * 100)}%`,
                        }} />
                    )}
                  </div>
                  <span className="text-[10px] whitespace-nowrap"
                    style={band && !band.shadowed ? undefined : { color: '#ffb454' }}>
                    {band && !band.shadowed
                      ? `HP ${band.upper} down to ${band.lower} — phase ${band.order} of the fight`
                      : 'never: an earlier phase already covers this HP'}
                  </span>
                </div>
              </div>
              {phases.length > 1 && <button className={btn} onClick={() => update(phases.filter((_, i) => i !== index))}>Remove</button>}
            </div>

            {/* --- what it shoots: only the back-ends this boss actually has --- */}
            {attacks.bullets && boss.bossProjectilePattern !== 'moleRock' && (
              <div className="grid grid-cols-4 gap-2 mb-2">
                <div>
                  <label className={label}>
                    {attacks.fallingRocks ? 'Frames between rocks' : 'Frames between shots'}
                  </label>
                  <input type="number" min={10} max={255} className={input} value={phase.interval}
                    onChange={e => patch(index, { interval: Number(e.target.value) })} />
                </div>
                <div>
                  <label className={label}>Bullet speed (px/frame)</label>
                  <input type="number" min={1} max={4} className={input} value={phase.projectileSpeed}
                    onChange={e => patch(index, { projectileSpeed: Number(e.target.value) })} />
                </div>
                <div className="col-span-2">
                  <label className={label}>Shot pattern — how MANY bullets go out</label>
                  <select className={input} value={phase.shootId ?? ''}
                    onChange={e => patch(index, { shootId: e.target.value })}>
                    <option value="">One bullet, aimed at the player</option>
                    {bulletShootAssets.map(asset => (
                      <option key={asset.id} value={asset.id}>{asset.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {attacks.bullets && boss.bossProjectilePattern === 'moleRock' && (
              <p className="text-xs text-msx-textsecondary mb-2">El Topo throws one rock per emergence. Its arc and landing are configured above; this phase selects the rock sprite.</p>
            )}

            {attacks.spriteBullets && (
              <div className="mb-2">
                <label className={label}>Projectile sprite for this phase</label>
                <select className={input} disabled={!!shootSpriteId}
                  value={shootSpriteId || (phase.projectileSpriteId ?? boss.bossProjectileSpriteId ?? '')}
                  onChange={e => patch(index, { projectileSpriteId: e.target.value })}>
                  <option value="">Built-in small blob</option>
                  {shootSpriteId && !shootSprite && <option value={shootSpriteId}>Missing: {shootSpriteId}</option>}
                  {spriteAssets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                </select>
                <p className="text-[10px] text-msx-textsecondary mt-1">
                  {shootSpriteId
                    ? `${shootSprite?.name || 'Missing sprite'} comes from the selected Shoot Definition.`
                    : 'The sprite changes when this HP phase becomes active. Boss bullets use the enemy sprite slots.'}
                </p>
              </div>
            )}

            {attacks.bullets && phase.shootId && !attacks.spriteBullets && (
              <p className="text-xs mb-2" style={{ color: '#ffb454' }}>
                Shot patterns need hardware-sprite bullets. This boss uses the bitmap
                blitter, which has one bullet in flight, so it will keep firing a single
                aimed shot.
              </p>
            )}
            {attacks.bullets && boss.bossProjectilePattern !== 'moleRock' && shootAsset && (
              <p className="text-xs text-msx-textsecondary mb-2">
                <strong>{shootAsset.name}</strong>: {describeShoot(shootAsset)}
              </p>
            )}
            {phase.shootId && shootAssets.length > 0 && !shootAsset && (
              <p className="text-xs mb-2" style={{ color: '#ffb454' }}>
                That shot pattern no longer exists; the phase will fire one aimed bullet.
              </p>
            )}

            {attacks.laser && (
              <div className="grid grid-cols-4 gap-2 mb-2">
                <div>
                  <label className={label}>Frames between laser waves</label>
                  <input type="number" min={0} max={255} className={input}
                    value={phase.laserInterval ?? 0}
                    onChange={e => patch(index, { laserInterval: Number(e.target.value) })} />
                </div>
                <div className="col-span-3 flex items-end">
                  <p className="text-xs text-msx-textsecondary pb-1">
                    0 keeps the boss default ({baseLaserInterval} frames). Lower = the beams
                    come back sooner; the boss still stands still while a wave grows.
                  </p>
                </div>
              </div>
            )}

            {/* --- how it moves: route, body cadence and step size --- */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={label}>Path</label>
                <select className={input} value={phase.pathId ?? ''}
                  onChange={e => patch(index, { pathId: e.target.value })}>
                  <option value="">Keep the boss default</option>
                  <option value="none">None — stand still</option>
                  {pathAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-msx-textsecondary mt-1">
                  The route changes when the current one finishes its lap, not the instant
                  the HP drops. A route is a relative shape, so switching mid-lap would anchor
                  it wherever the boss happened to be; waiting means every route starts from
                  the same spot. Everything else on this phase applies at once.
                </p>
              </div>
              <div>
                <label className={label}>Body update every (frames)</label>
                <input type="number" min={0} max={16} className={input} value={bodyInterval}
                  onChange={e => patch(index, { bodyInterval: Number(e.target.value) })} />
                <p className="text-[10px] text-msx-textsecondary mt-1">
                  0 = boss default ({baseBodyInterval}). {bodyInterval > 0 && bodyInterval < baseBodyInterval
                    ? `${(60 / bodyInterval).toFixed(0)} updates/s instead of ${(60 / baseBodyInterval).toFixed(0)} — costs VDP time.`
                    : 'Lower means more movement and animation, at a VDP cost.'}
                </p>
              </div>
              <div>
                <label className={label}>Movement speed</label>
                <select className={input} value={moveSteps}
                  onChange={e => patch(index, { moveStepMultiplier: Number(e.target.value) })}>
                  {PHASE_MOVE_STEPS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <p className="text-[10px] text-msx-textsecondary mt-1">
                  {moveSteps === 1
                    ? `${baseStepPx}px per body update.`
                    : `up to ${baseStepPx * moveSteps}px per body update — less smooth, but it costs no extra body redraw.`}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {phases.length > 0 && (
        <div className="text-xs text-msx-textsecondary mt-2 space-y-1">
          <p>
            The phase with the lowest matching threshold wins, so a boss naturally gets
            angrier as it loses health. Order in this list does not matter — the HP band
            on each card is what the ROM will do.
          </p>
          {highest > 0 && highest < maxHp && (
            <p style={{ color: '#ffb454' }}>
              Nothing covers HP {maxHp} down to {highest + 1}: the boss opens the fight on
              its base settings. Add a phase at 100% if that is not what you want.
            </p>
          )}
          <p>
            One step of movement stays capped at 2px (the body's trail cleanup), so a
            faster phase takes several steps per update instead. On a path, that also
            makes the node pauses go by quicker.
          </p>
        </div>
      )}
    </div>
  );
};

/** One-line summary of a `msx2shoot` asset, for the phase card. */
function describeShoot(asset: ProjectAsset): string {
  const shoot = ((asset.data as any)?.shoot ?? asset.data) as any;
  if (!shoot) return 'pattern not readable';
  const count = Math.max(1, Number(shoot.bulletCount) || 1);
  const burst = Math.max(1, Number(shoot.burstCount) || 1);
  const pattern = String(shoot.pattern || 'aimed');
  const shape = pattern === 'radial' ? 'around the whole circle'
    : pattern === 'spread' ? 'in a fan around the aim'
      : pattern === 'linear' ? `always ${String(shoot.direction || 'down')}`
        : 'aimed at the player';
  const waves = burst > 1
    ? `, ${burst} waves ${Math.max(1, Number(shoot.burstInterval) || 8)} frames apart`
    : '';
  return `${count} bullet${count === 1 ? '' : 's'} ${shape}${waves}.`;
}

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
  /** Pre-stamp bosses draw their body from a room atlas tile instead. */
  bodyAtlasEntry?: AtlasEntryRef;
  frames: number;
  soundAssets: ProjectAsset[];
  setStatusBarMessage?: (m: string) => void;
}> = ({ boss, onUpdate, bodyW, bodyH, bodyStamp, bodyAtlasEntry, frames, soundAssets, setStatusBarMessage }) => {
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
              {bodyStamp
                ? <StampCanvas stamp={bodyStamp} scale={scale} frames={frames} frameIndex={previewFrame} />
                : bodyAtlasEntry
                  ? <AtlasEntryCanvas entry={bodyAtlasEntry} scale={scale} frames={frames} frameIndex={previewFrame} />
                  : null}
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
            {bodyStamp || bodyAtlasEntry
              ? <>Drag on the body to add a zone ({bodyW}×{bodyH} px, boss-local coordinates).
                Red = weak point, grey = armour. Bullets pass THROUGH the bare body
                between zones, so a boss with zones is only hittable on them.</>
              : <>No body picked yet, so this is an empty {bodyW}×{bodyH} placeholder.
                Choose a Bitmap Stamp in <strong>Body &amp; Graphics</strong> to draw zones over the real boss.</>}
          </p>
        </div>

        <div className="flex-1">
          {zones.length === 0 && (
            <p className="text-xs text-msx-textsecondary">
              No zones: the whole body takes 1 damage per bullet. Add one and the rule
              flips — only the zones stop a bullet, the rest of the body lets it through.
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
              <div>
                <label className={label}>Hit sound</label>
                <select className={input} value={zone.hitSoundAssetId || ''}
                  onChange={e => update(zones.map((z, i) => i === index ? { ...z, hitSoundAssetId: e.target.value } : z))}>
                  <option value="">— Silent —</option>
                  {soundAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                  ))}
                </select>
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

          {/* Boss-wide, not per zone: only a weak point earns a blast, so it is the
              player's "that one hurt" signal AND a pointer at the vulnerable spot. */}
          <div className="mt-4 pt-3 border-t border-msx-border">
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={boss.bossHitBlastEnabled === true}
                onChange={e => onUpdate({ ...boss, bossHitBlastEnabled: e.target.checked })} />
              Explosion on the weak point when it is hit
            </label>
            {boss.bossHitBlastEnabled === true && (
              <div className="grid grid-cols-2 gap-3 mt-2 max-w-sm">
                <div>
                  <label className={label}>Frames held</label>
                  <input type="number" min={1} max={30} className={input}
                    value={boss.bossHitBlastFrames ?? 6}
                    onChange={e => onUpdate({ ...boss, bossHitBlastFrames: Number(e.target.value) })} />
                </div>
              </div>
            )}
            <p className="text-xs text-msx-textsecondary mt-2">
              Reuses the stamps from the <strong>Death FX</strong> section, which are already
              in the atlas, so this costs no extra VRAM and no visible time — the blast is one
              small transparent blit and the boss's next redraw erases it. Pick at least one
              Death FX stamp or there is nothing to draw. It pops at the centre of whichever
              weak point the bullet hit, so it also tells the player where to aim.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Frames of a single animated explosion; the runtime table is capped here too. */
const MAX_DEATH_ANIM_FRAMES = 3;

/**
 * Death presentation editor. Two modes share the same stamp list:
 *
 * - Random variants (the original): every blast picks one stamp at random and
 *   stays on the body until the whole sequence ends.
 * - Animated: the list is ONE explosion's frames, in order. Compact mode
 *   scatters the ordered frames with minimal ROM cost. Concurrent mode keeps
 *   up to three independent blasts alive and erases each one when it ends.
 */
const DeathFxPanel: React.FC<{
  boss: Msx2BossDefinition;
  set: <K extends keyof Msx2BossDefinition>(key: K, value: Msx2BossDefinition[K]) => void;
  bodyStamps: BodyStampRef[];
  bodyW: number;
  bodyH: number;
  soundAssets: ProjectAsset[];
}> = ({ boss, set, bodyStamps, bodyW, bodyH, soundAssets }) => {
  const selectedIds = boss.bossDeathExplosionStampIds || [];
  const animated = boss.bossDeathExplosionAnimated === true;
  const concurrent = animated && boss.bossDeathExplosionConcurrent === true;
  const frameStamps = selectedIds
    .map(id => bodyStamps.find(s => s.id === id))
    .filter((s): s is BodyStampRef => !!s);
  const firstFrame = frameStamps[0];
  const [previewFrame, setPreviewFrame] = useState(0);

  // Animated preview of the authored frames, at the runtime's own cadence.
  const frameDelay = Math.max(1, Math.min(30, Number(boss.bossDeathExplosionFrameDelay) || 4));
  useEffect(() => {
    if (!animated || frameStamps.length < 2) return;
    const timer = window.setInterval(
      () => setPreviewFrame(f => (f + 1) % frameStamps.length),
      Math.round((frameDelay * 1000) / 60),
    );
    return () => window.clearInterval(timer);
  }, [animated, frameStamps.length, frameDelay]);

  /** Why this stamp cannot be used, or '' when it can. */
  const rejection = (stamp: BodyStampRef): string => {
    if (stamp.w > bodyW || stamp.h > bodyH || stamp.w > 64 || stamp.h > 64) {
      return `must fit inside the ${bodyW}x${bodyH} boss and be at most 64x64`;
    }
    if (!animated) return '';
    if (stamp.w % 2 !== 0) return 'an animated explosion needs an even width so it can be erased cleanly';
    if (firstFrame && stamp.id !== firstFrame.id && (stamp.w !== firstFrame.w || stamp.h !== firstFrame.h)) {
      return `every frame must be ${firstFrame.w}x${firstFrame.h}, like frame 1`;
    }
    return '';
  };

  const toggle = (stamp: BodyStampRef) => {
    if (selectedIds.includes(stamp.id)) {
      set('bossDeathExplosionStampIds', selectedIds.filter(id => id !== stamp.id));
      return;
    }
    if (animated && selectedIds.length >= MAX_DEATH_ANIM_FRAMES) return;
    set('bossDeathExplosionStampIds', [...selectedIds, stamp.id]);
  };

  return (
    <div className={card}>
      <h3 className="text-sm font-semibold mb-2">Boss Death — Bitmap Explosions</h3>
      <p className="text-xs text-msx-textsecondary mb-3">
        {animated
          ? (concurrent
            ? 'The stamps below are the frames of ONE explosion, played in order. Up to 3 independent blasts run at once and each is erased when it ends. Colour 0 is transparent.'
            : 'The stamps below are ordered animation frames. Compact mode scatters the frames, then reconstructs the complete Boss bitmap after every explosion—including before the final hold—using much less resident ROM.')
          : 'Pick one or more Bitmap Stamps. When HP reaches zero, the runtime distributes them pseudo-randomly across the boss body. Colour 0 is transparent, so each explosion is composited over the boss.'}
      </p>

      <label className="flex items-center gap-2 text-xs text-msx-textprimary mb-3">
        <input
          type="checkbox"
          checked={animated}
          onChange={e => set('bossDeathExplosionAnimated', e.target.checked)}
        />
        Animated explosion (2-3 frames)
      </label>

      {animated && (
        <label className="flex items-center gap-2 text-xs text-msx-textprimary mb-3">
          <input type="checkbox" checked={concurrent}
            onChange={e => set('bossDeathExplosionConcurrent', e.target.checked)} />
          Concurrent layered blasts (up to 3; larger resident ROM)
        </label>
      )}

      <div className="mb-3">
        <label className={label}>Explosion sound (MSX2 PSG)</label>
        <select className={input}
          value={boss.bossDeathExplosionSoundAssetId || ''}
          onChange={e => set('bossDeathExplosionSoundAssetId', e.target.value)}>
          <option value="">— Built-in MSX2 explosion —</option>
          {soundAssets.map(asset => (
            <option key={asset.id} value={asset.id}>{asset.name}</option>
          ))}
        </select>
        <p className="text-xs text-msx-textsecondary mt-1">
          Each bitmap blast restarts this Sound FX on PSG channel C. The built-in
          fallback is used when no asset is selected or the referenced sound is missing.
        </p>
      </div>

      <div className={`grid ${animated ? 'grid-cols-4' : 'grid-cols-3'} gap-3 mb-3`}>
        <div>
          <label className={label}>Explosion count</label>
          <input type="number" min={1} max={32} className={input}
            value={boss.bossDeathExplosionCount ?? 8}
            onChange={e => set('bossDeathExplosionCount', Number(e.target.value))} />
        </div>
        <div>
          <label className={label}>Frames between blasts</label>
          <input type="number" min={1} max={60} className={input}
            value={boss.bossDeathExplosionInterval ?? 6}
            onChange={e => set('bossDeathExplosionInterval', Number(e.target.value))} />
        </div>
        {animated && (
          <div>
            <label className={label}>Frames per animation frame</label>
            <input type="number" min={1} max={30} className={input}
              value={boss.bossDeathExplosionFrameDelay ?? 4}
              onChange={e => set('bossDeathExplosionFrameDelay', Number(e.target.value))} />
          </div>
        )}
        <div>
          <label className={label}>Final hold (frames)</label>
          <input type="number" min={1} max={255} className={input}
            value={boss.bossDeathExplosionHoldFrames ?? 12}
            onChange={e => set('bossDeathExplosionHoldFrames', Number(e.target.value))} />
        </div>
      </div>

      {animated && frameStamps.length > 0 && (
        <div className="flex items-center gap-3 mb-3 p-2 border border-msx-border rounded"
          style={{ background: MSX2_PREVIEW_BG }}>
          <StampCanvas
            stamp={frameStamps[Math.min(previewFrame, frameStamps.length - 1)]}
            scale={Math.max(1, Math.min(4, Math.floor(72 / Math.max(firstFrame?.w || 1, firstFrame?.h || 1))))}
          />
          <span className="text-[10px] text-msx-textsecondary">
            Frame {Math.min(previewFrame, frameStamps.length - 1) + 1} / {frameStamps.length}
            {frameStamps.length < 2 && ' — add a second frame to animate'}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <label className={label}>
          {animated
            ? `Explosion frames (${selectedIds.length}/${MAX_DEATH_ANIM_FRAMES}, click in order)`
            : 'Explosion Bitmap Stamps'}
        </label>
        <button className={btn} onClick={() => set('bossDeathExplosionStampIds', [])}>
          Clear all
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto border border-msx-border rounded p-2">
        {bodyStamps.length === 0 && (
          <p className="text-xs text-msx-textsecondary p-2">
            No Bitmap Stamps are available. Create or import explosion
            stamps first, then return here.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {bodyStamps.map(stamp => {
            const order = selectedIds.indexOf(stamp.id);
            const selected = order >= 0;
            const why = rejection(stamp);
            const full = animated && !selected && selectedIds.length >= MAX_DEATH_ANIM_FRAMES;
            const disabled = (!selected && !!why) || full;
            const scale = Math.max(1, Math.min(4, Math.floor(72 / Math.max(stamp.w, stamp.h, 1))));
            return (
              <button
                key={stamp.id}
                disabled={disabled}
                onClick={() => toggle(stamp)}
                title={disabled
                  ? `${stamp.name} — ${full ? `an explosion holds at most ${MAX_DEATH_ANIM_FRAMES} frames` : why}`
                  : `${stamp.name} — ${stamp.w}x${stamp.h}`}
                className={`flex flex-col items-center justify-end gap-1 p-1 rounded border ${
                  selected ? 'border-msx-accent' : 'border-msx-border hover:bg-msx-hover'
                } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                style={{ background: MSX2_PREVIEW_BG, width: 92 }}
              >
                <div className="flex-1 flex items-center justify-center" style={{ minHeight: 76 }}>
                  <StampCanvas stamp={stamp} scale={scale} />
                </div>
                <span className="text-[9px] leading-tight text-msx-textprimary truncate w-full text-center">
                  {selected ? (animated ? `${order + 1}. ` : '✓ ') : ''}{stamp.name}
                </span>
                <span className="text-[9px] text-msx-textsecondary">{stamp.w}x{stamp.h}</span>
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-msx-textsecondary mt-3">
        {animated && selectedIds.length === 0
          ? 'No custom frames selected: the ROM will use three built-in bitmap blast variants (compact mode).'
          : 'Custom stamps selected: these bitmaps will be used for the death presentation.'}
        {' '}Defeat actions and barrier removal run only after the final explosion and hold.
        {concurrent && ' At most one live explosion advances per game frame to protect the VDP budget.'}
      </p>
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
  /** Nodes in the route this boss walks, so the entry node can be bounded. */
  pathNodeCount: number;
  /** Only a closed ring can be entered anywhere; an open route cannot. */
  pathLoops: boolean;
  onUpdateAsset?: (assetId: string, data: any) => void;
  setStatusBarMessage?: (m: string) => void;
}> = ({ boss, encounters, allAssets, pathNodeCount, pathLoops, onUpdateAsset, setStatusBarMessage }) => {
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

  const setStartNode = (encounter: BossEncounterRef, value: string) => {
    patchEntity(encounter, params => {
      if (value === '' || Number(value) === 0) {
        const { bossPathStartNode, ...rest } = params;
        return rest;
      }
      return { ...params, bossPathStartNode: Number(value) };
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
              <label className={label}>{boss.bossProjectilePattern === 'moleRock' ? 'Returned rocks override' : 'HP override'}</label>
              <input type="number" min={1} max={255} className={input} value={encounter.hpOverride}
                placeholder={String(boss.bossHp)} disabled={!usesThis || !onUpdateAsset}
                onChange={e => setHpOverride(encounter, e.target.value)} />
            </div>
            <div className="w-28">
              <label className={label}>Start node</label>
              <input type="number" min={0} max={Math.max(0, pathNodeCount - 1)} className={input}
                value={encounter.pathStartNode} placeholder="0"
                disabled={!usesThis || !onUpdateAsset || !pathLoops}
                title={!pathLoops
                  ? 'Only a looping route can be entered on another node.'
                  : `This route has ${pathNodeCount} nodes (0..${Math.max(0, pathNodeCount - 1)}).`}
                onChange={e => setStartNode(encounter, e.target.value)} />
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
        Leave the override empty to inherit {boss.bossHp} {boss.bossProjectilePattern === 'moleRock' ? 'returned rocks' : 'HP'}.
      </p>
      <p className="text-xs text-msx-textsecondary mt-2">
        Each boss starts <strong>where you placed it on the room</strong> and walks the route
        from there, so two entries in the same room may share one Path without stacking on
        top of each other. <strong>Start node</strong> additionally shifts a copy along the
        route — put one boss on node 0 and the other half a lap ahead and they orbit in
        opposition instead of in formation. It needs a looping route, because only a closed
        ring can be entered anywhere.
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
  const patch = (index: number, changes: Partial<Msx2BossDefeatAction>) =>
    update(actions.map((a, i) => i === index ? { ...a, ...changes } as Msx2BossDefeatAction : a));
  const move = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= actions.length) return;
    const next = [...actions];
    const [row] = next.splice(index, 1);
    next.splice(to, 0, row);
    update(next);
  };

  const addAction = (kind: Msx2BossDefeatAction['action']) => {
    const created: Msx2BossDefeatAction =
      kind === 'setFlag' ? { action: 'setFlag', flag: `boss_${boss.id || 'x'}_defeated` }
        : kind === 'giveKey' ? { action: 'giveKey', count: 1 }
          : kind === 'showMessage' ? { action: 'showMessage', dialogueAssetId: dialogues[0]?.id || '' }
            : kind === 'dialogue' ? { action: 'dialogue', dialogueAssetId: dialogues[0]?.id || '' }
              : kind === 'wait' ? { action: 'wait', frames: 60 }
                : kind === 'changeScreen' ? { action: 'changeScreen', target: rooms[0]?.id || '' }
                  : { action: 'openDoor', target: doors[0]?.id || '' };
    update([...actions, created]);
  };

  const stepTitle = (action: Msx2BossDefeatAction) =>
    action.action === 'setFlag' ? 'Set flag'
      : action.action === 'giveKey' ? 'Give key'
        : action.action === 'openDoor' ? 'Open door'
          : action.action === 'showMessage' ? 'Message'
            : action.action === 'dialogue' ? 'Boss speaks'
              : action.action === 'wait' ? 'Wait'
                : 'Change screen';

  return (
    <div className={card}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Defeat Actions</h3>
        <div className="flex gap-1">
          <button className={btn} onClick={() => addAction('setFlag')}>+ Set flag</button>
          <button className={btn} onClick={() => addAction('giveKey')}>+ Give key</button>
          <button className={btn} onClick={() => addAction('openDoor')} disabled={doors.length === 0}>+ Open door</button>
          <button className={btn} onClick={() => addAction('dialogue')} disabled={dialogues.length === 0}>+ Dialogue</button>
          <button className={btn} onClick={() => addAction('wait')}>+ Wait</button>
          <button className={btn} onClick={() => addAction('changeScreen')} disabled={rooms.length === 0}>+ Change screen</button>
        </div>
      </div>

      <h4 className="text-sm font-semibold mb-2">Final sequence</h4>

      {actions.length === 0 && (
        <p className="text-xs text-msx-textsecondary">
          Nothing happens beyond the boss disappearing and the room unlocking.
          Add steps to stage the ending: dying words, a held beat, then the reward.
        </p>
      )}

      {actions.map((action, index) => (
        <div key={index} className="flex gap-2 items-end mb-2 pb-2 border-b border-msx-border">
          <div className="w-6 text-xs text-msx-textsecondary pb-2">{index + 1}.</div>
          <div className="w-36">
            <label className={label}>Step</label>
            <input className={input} value={stepTitle(action)} readOnly />
          </div>
          {action.action === 'setFlag' && (
            <div className="flex-1">
              <label className={label}>Flag name</label>
              <input className={input} value={action.flag}
                onChange={e => patch(index, { flag: e.target.value })} />
            </div>
          )}
          {action.action === 'giveKey' && (
            <div className="w-32">
              <label className={label}>How many</label>
              <input type="number" min={1} max={255} className={input} value={action.count ?? 1}
                onChange={e => patch(index, { count: Number(e.target.value) })} />
            </div>
          )}
          {action.action === 'openDoor' && (
            <div className="flex-1">
              <label className={label}>Door</label>
              <select className={input} value={action.target}
                onChange={e => patch(index, { target: e.target.value })}>
                <option value="">— pick a locked door —</option>
                {doors.map(door => <option key={door.id} value={door.id}>{door.label}</option>)}
              </select>
            </div>
          )}
          {(action.action === 'showMessage' || action.action === 'dialogue') && (
            <div className="flex-1">
              <label className={label}>Dialogue</label>
              <select className={input} value={action.dialogueAssetId || ''}
                onChange={e => patch(index, { dialogueAssetId: e.target.value })}>
                <option value="">— pick a dialogue —</option>
                {dialogues.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
              </select>
              {action.action === 'showMessage' && (
                <p className="text-xs text-msx-textsecondary mt-1">
                  Legacy message: the next steps fire at once, even with the box open.
                  Prefer &ldquo;Boss speaks&rdquo;, which waits for the player.
                </p>
              )}
            </div>
          )}
          {action.action === 'wait' && (
            <>
              <div className="w-28">
                <label className={label}>Frames</label>
                <input type="number" min={1} max={255} className={input} value={action.frames}
                  onChange={e => patch(index, { frames: Number(e.target.value) })} />
              </div>
              <div className="flex-1 text-xs text-msx-textsecondary pb-2">
                About {(action.frames / 60).toFixed(1)}s at 60Hz.
              </div>
            </>
          )}
          {action.action === 'changeScreen' && (
            <>
              <div className="flex-1">
                <label className={label}>Go to room</label>
                <select className={input} value={action.target || ''}
                  onChange={e => patch(index, { target: e.target.value })}>
                  <option value="">— pick a room —</option>
                  {rooms.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                </select>
              </div>
              <div className="w-20">
                <label className={label}>Entry x</label>
                <input type="number" min={0} max={254} className={input} value={action.entryX ?? ''}
                  placeholder="keep"
                  onChange={e => patch(index, { entryX: e.target.value === '' ? undefined : Number(e.target.value) })} />
              </div>
              <div className="w-20">
                <label className={label}>Entry y</label>
                <input type="number" min={0} max={255} className={input} value={action.entryY ?? ''}
                  placeholder="keep"
                  onChange={e => patch(index, { entryY: e.target.value === '' ? undefined : Number(e.target.value) })} />
              </div>
            </>
          )}
          <div className="flex gap-1">
            <button className={btn} title="Move earlier" disabled={index === 0}
              onClick={() => move(index, -1)}>&uarr;</button>
            <button className={btn} title="Move later" disabled={index === actions.length - 1}
              onClick={() => move(index, 1)}>&darr;</button>
            <button className={btn} onClick={() => update(actions.filter((_, i) => i !== index))}>&#10005;</button>
          </div>
        </div>
      ))}

      <p className="text-xs text-msx-textsecondary mt-2">
        The boss is a progress event, not just an enemy: these run once, in this
        order, when it dies. A &ldquo;Boss speaks&rdquo; step waits for the player to read
        the dialogue through, and the player is frozen for the whole sequence —
        the defeat-side twin of the entry sequence. &ldquo;Give key&rdquo; needs a key/door
        system in the project, and &ldquo;open door&rdquo; needs a locked door entity to target.
      </p>
    </div>
  );
};

/** A blank boss with the defaults the runtime expects. */
export { createMsx2BossDefinition } from '../../utils/msx2AssetDefaults';
