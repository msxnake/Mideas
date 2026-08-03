/**
 * Graphics backend identifiers used across the MSX generator and the UI.
 *
 * There are exactly THREE backends, named after the VDP mode they actually
 * run in:
 *
 *   screen2 — MSX1 SCREEN 2 tilebank runtime.
 *   screen4 — MSX2 GRAPHIC 3 ("SCREEN 4"): name-table tile screens.
 *   screen5 — MSX2 GRAPHIC 4 ("SCREEN 5"): 4bpp bitmap, command engine.
 *
 * The old ids lied: `msx2-screen4-bitmap-room` issued `CHGMOD 5`, so a
 * "SCREEN 4" backend was really SCREEN 5, and SCREEN 5 was split across two
 * ids depending on whether the project happened to be a game or a title
 * screen. Both of those are now `screen5`.
 *
 * How a `screen5` ROM is emitted is an INTERNAL detail (`Screen5Emitter`), not
 * a backend: the two emitters differ in what they build, not in the hardware
 * mode they target.
 *
 * Single source of truth: any code that needs to reason about which graphics
 * backend a project targets imports the type from here.
 */
export type GraphicsBackend = 'screen2' | 'screen4' | 'screen5';

/**
 * Which SCREEN 5 emitter builds the ROM. Not user-facing: both are SCREEN 5.
 *
 * - `bitmap-rooms`: the full game runtime (rooms, player, enemies, skills, HUD),
 *   including its own GameFlow walker and presentation intro.
 * - `presentation`: still-image title/cutscene ROMs, with the strict-shape flow
 *   resolver or the generic node walker.
 */
export type Screen5Emitter = 'bitmap-rooms' | 'presentation';

export interface ResolvedGraphicsTarget {
  backend: GraphicsBackend;
  /** Only meaningful when `backend === 'screen5'`. */
  screen5Emitter?: Screen5Emitter;
}

/**
 * Ids accepted on input for backward compatibility. Project JSON written by
 * older versions of Mideas carries these, and they are mapped rather than
 * rejected — indefinitely, so old projects keep opening and exporting.
 */
export type LegacyGraphicsBackend =
  | 'screen2-tilebank'
  | 'msx2-screen4-pattern'
  | 'msx2-screen4-bitmap-room'
  | 'msx2-screen5-presentation'
  | 'msx2-screen5-bitmap'
  | 'msx2-screen5-tile16';

/**
 * Legacy id -> current target. `msx2-screen5-bitmap` and `msx2-screen5-tile16`
 * were already deprecated aliases routed to the tile backend; that stays.
 */
const LEGACY_BACKEND_TARGETS: Record<LegacyGraphicsBackend, ResolvedGraphicsTarget> = {
  'screen2-tilebank': { backend: 'screen2' },
  'msx2-screen4-pattern': { backend: 'screen4' },
  'msx2-screen5-bitmap': { backend: 'screen4' },
  'msx2-screen5-tile16': { backend: 'screen4' },
  'msx2-screen4-bitmap-room': { backend: 'screen5', screen5Emitter: 'bitmap-rooms' },
  'msx2-screen5-presentation': { backend: 'screen5', screen5Emitter: 'presentation' },
};

/**
 * Accepts a current id or any legacy id and returns the target it selects.
 * A bare `screen5` leaves `screen5Emitter` undefined on purpose: the caller
 * decides which emitter from the project's assets.
 *
 * Returns undefined for anything unrecognised so callers can fall through to
 * their own detection instead of silently picking a backend.
 */
export function normalizeGraphicsBackendId(value: unknown): ResolvedGraphicsTarget | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  if (value === 'screen2' || value === 'screen4' || value === 'screen5') {
    return { backend: value };
  }
  return LEGACY_BACKEND_TARGETS[value as LegacyGraphicsBackend];
}

/** True for ids that are no longer the canonical spelling. */
export function isLegacyGraphicsBackendId(value: unknown): value is LegacyGraphicsBackend {
  return typeof value === 'string' && value in LEGACY_BACKEND_TARGETS;
}
