/**
 * "Soldado perseguidor" (Boina Verde of Back to Mars): data model and normalizers.
 *
 * Two pieces of authored data, both optional, both inert unless a room turns the alert on:
 *
 *   ROOM     `data.runtime.alertZone = { enabled, spawnDelaySec, guardPx }` on an `msx2bitmaproom`.
 *            The room starts with nothing in sight; `spawnDelaySec` seconds after the player enters, the soldier appears
 *            at the place the player came in by, unless the player is still closer than `guardPx` pixels to that spot
 *            (then it waits, frame by frame, until the player has moved away: no spawn-kill).
 *
 *   PROJECT  the soldier is the ONE `msx2enemy` asset with `data.pursuer.enabled = true`. It owns the 16x32 sprite
 *            (`stackVertical`, two 16x16 cells) and the `rules` program (`msx2enemybehavior`) that drives it. The generator
 *            places a copy of it as entity 0 of every alert room; nobody places it by hand in those rooms.
 *
 * Nothing here knows about Z80: the generator (msx2BitmapPursuerGenerator.ts) turns this into ROM. Keeping the model in
 * a plain util lets the editor and the contract scripts use the same defaults and limits as the ROM.
 */

/** Seconds between entering an alert room and the soldier appearing (when the player is not too close). */
export const MSX2_ALERT_DEFAULT_SPAWN_DELAY_SEC = 4;
export const MSX2_ALERT_MIN_SPAWN_DELAY_SEC = 0.5;
export const MSX2_ALERT_MAX_SPAWN_DELAY_SEC = 30;
/** The soldier does not appear while the player is within this many pixels (on both axes) of the entry spot. */
export const MSX2_ALERT_DEFAULT_GUARD_PX = 32;
export const MSX2_ALERT_MAX_GUARD_PX = 255;
/** Video frames per second the countdown is measured in. */
export const MSX2_ALERT_FRAMES_PER_SECOND = 60;
/** The soldier is as big as the player: 16x32, i.e. two stacked 16x16 hardware cells. */
export const MSX2_PURSUER_BODY_WIDTH = 16;
export const MSX2_PURSUER_BODY_HEIGHT = 32;

/** `msx2bitmaproom.data.runtime.alertZone`, always fully populated after normalizing. */
export interface Msx2AlertZoneConfig {
  enabled: boolean;
  spawnDelaySec: number;
  guardPx: number;
}

/** `msx2enemy.data.pursuer`. Only `enabled` exists for now; later phases add speeds, sight and so on. */
export interface Msx2PursuerConfig {
  enabled: boolean;
}

/** Minimal structural view of a project asset: this module must not depend on the whole `ProjectAsset` union. */
export interface Msx2PursuerAssetLike {
  id?: string;
  name?: string;
  type?: string;
  data?: any;
}

const finiteOr = (value: unknown, fallback: number): number => {
  const n = typeof value === 'string' && value.trim() === '' ? NaN : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const truthy = (value: unknown): boolean =>
  value === true || value === 1 || String(value).trim().toLowerCase() === 'true' || String(value).trim() === '1';

/** Anything that is not a valid alert zone becomes the default, disabled one. Never throws. */
export function normalizeMsx2AlertZone(raw: unknown): Msx2AlertZoneConfig {
  const source = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};
  const delay = Math.min(
    MSX2_ALERT_MAX_SPAWN_DELAY_SEC,
    Math.max(MSX2_ALERT_MIN_SPAWN_DELAY_SEC, finiteOr(source.spawnDelaySec, MSX2_ALERT_DEFAULT_SPAWN_DELAY_SEC)),
  );
  const guard = Math.min(
    MSX2_ALERT_MAX_GUARD_PX,
    Math.max(0, Math.round(finiteOr(source.guardPx, MSX2_ALERT_DEFAULT_GUARD_PX))),
  );
  return { enabled: truthy(source.enabled), spawnDelaySec: delay, guardPx: guard };
}

/** The alert zone of a room (`room.runtime.alertZone`); disabled when the room has none. */
export function getMsx2RoomAlertZone(room: { runtime?: unknown } | undefined | null): Msx2AlertZoneConfig {
  const runtime = room?.runtime as { alertZone?: unknown } | undefined;
  return normalizeMsx2AlertZone(runtime?.alertZone);
}

/** Countdown length in video frames (the ROM counts game frames: one tick per pass of the main loop). */
export function msx2AlertSpawnDelayFrames(config: Msx2AlertZoneConfig): number {
  return Math.max(1, Math.round(config.spawnDelaySec * MSX2_ALERT_FRAMES_PER_SECOND));
}

/** `data.pursuer` of an enemy asset; disabled when absent. */
export function normalizeMsx2Pursuer(raw: unknown): Msx2PursuerConfig {
  const source = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};
  return { enabled: truthy(source.enabled) };
}

/** What the generator needs to synthesize the soldier. */
export interface Msx2PursuerSoldier {
  asset: Msx2PursuerAssetLike;
  /** `msx2enemy` asset id (what an entity carries in `params.enemyAssetId`). */
  enemyAssetId: string;
  /** Display name of the enemy asset, for messages. */
  name: string;
  spriteAssetId: string;
  behaviorAssetId: string;
  /** Id of the first render role when the asset has roles (kept so the entity selects the same one the editor shows). */
  renderRoleId: string;
  logicUpdateIntervalFrames: number;
}

export interface Msx2PursuerProjectResolution {
  /** Present when exactly one enemy asset has `pursuer.enabled` and nothing is wrong with it. */
  soldier?: Msx2PursuerSoldier;
  /** How many enemy assets asked to be the soldier (0 = the project has none). */
  candidateCount: number;
  /** Every problem found; a project that uses alert zones must have none. */
  errors: string[];
}

const assetMatches = (candidate: Msx2PursuerAssetLike, id: string): boolean =>
  candidate.id === id
  || candidate.name === id
  || String(candidate.data?.id || '').trim() === id
  || String(candidate.data?.assetId || '').trim() === id
  || String(candidate.data?.enemyId || '').trim() === id;

/**
 * Finds THE soldier of a project and checks the pieces it needs.
 *
 * Rules: at most one `msx2enemy` may have `pursuer.enabled`; its sprite must be 16x32 `stackVertical`; its behaviour must be
 * an ordered-`rules` program (a `path_follow` route cannot react to the player, which is the whole point of the soldier).
 * The result lists every problem instead of stopping at the first, so an author fixes them in one pass.
 */
export function resolveMsx2PursuerProject(assets: readonly Msx2PursuerAssetLike[] | undefined | null): Msx2PursuerProjectResolution {
  const all = Array.isArray(assets) ? assets : [];
  const errors: string[] = [];
  const candidates = all.filter(asset => asset?.type === 'msx2enemy' && normalizeMsx2Pursuer(asset.data?.pursuer).enabled);
  if (candidates.length === 0) return { candidateCount: 0, errors };
  const label = (asset: Msx2PursuerAssetLike) => `"${asset.name || asset.data?.name || asset.id}"`;
  if (candidates.length > 1) {
    errors.push(`Only one enemy may be the pursuer soldier, but ${candidates.length} have pursuer.enabled: ${candidates.map(label).join(', ')}.`);
    return { candidateCount: candidates.length, errors };
  }
  const asset = candidates[0];
  const data = asset.data || {};
  const roles: any[] = Array.isArray(data.render?.roles) ? data.render.roles : [];
  const spriteAssetId = String(roles[0]?.spriteId || data.render?.spriteId || '').trim();
  const behaviorAssetId = String(data.behavior?.behaviorAssetId || data.behaviorAssetId || '').trim();

  if (!spriteAssetId) {
    errors.push(`Pursuer enemy ${label(asset)} has no sprite (render.spriteId).`);
  } else {
    const sprite = all.find(candidate => candidate?.type === 'msx2sprite' && assetMatches(candidate, spriteAssetId));
    if (!sprite) {
      errors.push(`Pursuer enemy ${label(asset)}: sprite "${spriteAssetId}" does not exist.`);
    } else {
      const width = Number(sprite.data?.size?.width);
      const height = Number(sprite.data?.size?.height);
      if (width !== MSX2_PURSUER_BODY_WIDTH || height !== MSX2_PURSUER_BODY_HEIGHT) {
        errors.push(`Pursuer enemy ${label(asset)}: sprite "${sprite.name || spriteAssetId}" is ${width}x${height}, it must be ${MSX2_PURSUER_BODY_WIDTH}x${MSX2_PURSUER_BODY_HEIGHT} (the size of the player).`);
      }
      if (sprite.data?.superSpriteLayout !== 'stackVertical') {
        errors.push(`Pursuer enemy ${label(asset)}: sprite "${sprite.name || spriteAssetId}" must use the stackVertical layout (two 16x16 cells), not "${sprite.data?.superSpriteLayout ?? 'single16'}".`);
      }
    }
  }

  if (!behaviorAssetId) {
    errors.push(`Pursuer enemy ${label(asset)} has no behaviour program (behavior.behaviorAssetId).`);
  } else {
    const behavior = all.find(candidate => String(candidate?.type || '').toLowerCase() === 'msx2enemybehavior' && assetMatches(candidate, behaviorAssetId));
    if (!behavior) {
      errors.push(`Pursuer enemy ${label(asset)}: behaviour "${behaviorAssetId}" does not exist.`);
    } else if (behavior.data?.kind === 'path_follow') {
      errors.push(`Pursuer enemy ${label(asset)}: behaviour "${behavior.name || behaviorAssetId}" is a path_follow route; the soldier needs a rules program that can react to the player.`);
    }
  }

  const interval = Math.max(1, Math.min(255, Math.floor(finiteOr(data.logicUpdateIntervalFrames ?? data.logicUpdateEveryFrames, 1)) || 1));
  const soldier: Msx2PursuerSoldier | undefined = errors.length
    ? undefined
    : {
        asset,
        enemyAssetId: String(asset.id || ''),
        name: String(asset.name || data.name || asset.id || 'Pursuer'),
        spriteAssetId,
        behaviorAssetId,
        renderRoleId: String(roles[0]?.id || '').trim(),
        logicUpdateIntervalFrames: interval,
      };
  return { soldier, candidateCount: 1, errors };
}
