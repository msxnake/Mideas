/**
 * Graphics backend identifiers used across the MSX generator and the UI.
 *
 * Extracted to its own module so that `skills/types.ts` (and other leaves of
 * the generator dependency tree) can reference the type without creating a
 * circular import back to `utils/msxGenerator/index.ts`.
 *
 * Single source of truth: any code that needs to reason about which graphics
 * backend a project targets imports the type from here.
 */
export type GraphicsBackend =
  | 'screen2-tilebank'
  | 'msx2-screen4-pattern'
  | 'msx2-screen4-bitmap-room'
  | 'msx2-screen5-presentation';

/** Legacy backend ids still accepted on input but routed to a current backend. */
export type LegacyGraphicsBackend = 'msx2-screen5-bitmap' | 'msx2-screen5-tile16';
