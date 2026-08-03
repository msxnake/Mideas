/**
 * MSX2 GameFlow `purpose` predicates.
 *
 * The purpose says which graphics backend a flow compiles through. It used to
 * have three values, two of which were both "SCREEN 5" and also pinned which
 * emitter ran. It now has two — `screen4` and `screen5` — with the three old
 * values still accepted on input.
 *
 * Every consumer must go through here. Before this module the comparisons were
 * open-coded as `purpose === 'screen4-bitmap-runtime'` and
 * `purpose !== 'screen4-runtime'` across four generators and the UI, so adding
 * a value meant finding all of them; the one that got missed made a whole
 * GameFlow silently vanish from the ROM.
 */
import type { Msx2GameFlowPurpose } from '../types';

/** Which backend a purpose selects, independent of its spelling. */
export type Msx2GameFlowPurposeKind = 'screen4' | 'screen5';

const PURPOSE_KINDS: Record<Msx2GameFlowPurpose, Msx2GameFlowPurposeKind> = {
  screen4: 'screen4',
  screen5: 'screen5',
  'screen4-runtime': 'screen4',
  'screen4-bitmap-runtime': 'screen5',
  'screen5-presentation': 'screen5',
};

/** Undefined for an absent or unrecognised purpose, so callers can fall back. */
export function resolveMsx2PurposeKind(purpose: unknown): Msx2GameFlowPurposeKind | undefined {
  if (typeof purpose !== 'string') return undefined;
  return PURPOSE_KINDS[purpose as Msx2GameFlowPurpose];
}

/** A SCREEN 4 tile-runtime flow, in any spelling. */
export function isMsx2Screen4Purpose(purpose: unknown): boolean {
  return resolveMsx2PurposeKind(purpose) === 'screen4';
}

/** A SCREEN 5 flow, in any spelling, whichever emitter ends up building it. */
export function isMsx2Screen5Purpose(purpose: unknown): boolean {
  return resolveMsx2PurposeKind(purpose) === 'screen5';
}

/**
 * True for flows a SCREEN 5 generator should consider its own: a SCREEN 5
 * purpose, or none at all (older projects saved before the purpose existed).
 * Deliberately NOT the same as `!isMsx2Screen4Purpose`, which would also be
 * true for junk values.
 */
export function isMsx2Screen5OrUnsetPurpose(purpose: unknown): boolean {
  return purpose === undefined || purpose === null || purpose === '' || isMsx2Screen5Purpose(purpose);
}

/**
 * Which SCREEN 5 emitter a flow compiles through.
 *
 * `screen5` does not say, so it is inferred: a project with bitmap rooms is a
 * game (it may also carry a presentation asset for its title screen), anything
 * else is a presentation. The legacy purposes DO say, and keep saying, so a
 * project saved before the merge compiles exactly as it did.
 *
 * The editor and the generator must agree on this or the UI validates a flow
 * against rules the ROM will not follow — hence one function, used by both.
 */
export function resolveMsx2Screen5Emitter(
  purpose: unknown,
  hasBitmapRooms: boolean
): 'bitmap-rooms' | 'presentation' {
  if (purpose === 'screen4-bitmap-runtime') return 'bitmap-rooms';
  if (purpose === 'screen5-presentation') return 'presentation';
  return hasBitmapRooms ? 'bitmap-rooms' : 'presentation';
}
