/**
 * Pure helpers behind the pursuer editors: the room "Zona de alerta" section and the enemy "Soldado perseguidor" block.
 *
 * The model, the defaults and the limits live in `utils/msx2Pursuer.ts`; nothing is repeated here. Both functions only build
 * NEW objects: the caller hands the result to `onUpdate`, and the arguments they receive are never mutated.
 */
import {
  Msx2AlertZoneConfig,
  Msx2PursuerConfig,
  normalizeMsx2AlertZone,
  normalizeMsx2Pursuer,
} from './msx2Pursuer';

/** Keys left `undefined` keep the value they already have. */
export type Msx2AlertZonePatch = Partial<Msx2AlertZoneConfig>;

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object';

/**
 * Returns a NEW runtime whose `alertZone` is the current zone merged with `patch` and normalized by `normalizeMsx2AlertZone`
 * (delay clamped to 0.5..30 s, guard to 0..255 px, enabled to a boolean). Every other key of `runtime` is copied as it is.
 * A `null` or `undefined` runtime counts as an empty object.
 */
export function applyAlertZonePatch<R extends object>(
  runtime: R | null | undefined,
  patch: Msx2AlertZonePatch = {},
): R & { alertZone: Msx2AlertZoneConfig } {
  const base = (isObject(runtime) ? runtime : {}) as R;
  const current = (base as { alertZone?: unknown }).alertZone;
  const merged: Record<string, unknown> = { ...(isObject(current) ? current : {}) };
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) merged[key] = value;
  }
  return { ...base, alertZone: normalizeMsx2AlertZone(merged) };
}

/**
 * Returns a NEW enemy data object whose `pursuer` is the current pursuer object with `enabled` set from `patch`.
 * Turning it off writes `enabled: false` and keeps the other keys of `pursuer`. A `null` or `undefined` data counts as
 * an empty object, so the result always has a `pursuer` object.
 */
export function applyPursuerPatch<T extends object>(
  enemyData: T | null | undefined,
  patch: Partial<Msx2PursuerConfig> = {},
): T & { pursuer: Record<string, unknown> & Msx2PursuerConfig } {
  const base = (isObject(enemyData) ? enemyData : {}) as T;
  const current = (base as { pursuer?: unknown }).pursuer;
  const currentPursuer: Record<string, unknown> = isObject(current) ? current : {};
  const enabled = patch.enabled === undefined
    ? normalizeMsx2Pursuer(currentPursuer).enabled
    : normalizeMsx2Pursuer({ enabled: patch.enabled }).enabled;
  return { ...base, pursuer: { ...currentPursuer, enabled } };
}
