/**
 * The SCREEN 5 GameFlow transition vocabulary, shared by the three backends
 * that accept a Transition node on a SCREEN 5 flow.
 *
 * IMPORTANT — this module deliberately shares the *vocabulary only*, not the
 * ASM. The three backends implement these effects with genuinely different
 * engines, and that is not leftover duplication:
 *
 *   - msx2Screen5PresentationGenerator: BIOS FILVRM over raw VRAM bytes,
 *     stepping one byte-column (2px) or two scanlines per frame.
 *   - msx2Screen5FlowGenerator (+FlowRuntime): V9938 command engine (HMMV via
 *     gf_fill_rect with GF_CMD_* in RAM), pixel coordinates, 4px steps.
 *   - msx2Screen5BitmapRoomGenerator: V9938 command engine too, but with
 *     registers passed directly (HL=DX, DE=DY, BC=NX, A=NY) and its own
 *     frame wait that restores R#15 after each fill.
 *
 * They also differ in granularity (2px / 4px / 8x8 blocks) and therefore in how
 * long an effect takes on screen, and the diagonal wipe is table-driven in two
 * of them and computed in the third. Merging the ASM is a behaviour change that
 * needs hardware verification, NOT a refactor — see the phase 2 note in
 * docs/project/MSX2_GRAPHICS_BACKEND_PLAN.md.
 *
 * What DID keep going wrong is the vocabulary drifting: the list lived in three
 * generators plus the editor's dropdown, so adding an effect meant editing four
 * places and getting a runtime "not supported" from whichever one was missed.
 */

export type Screen5TransitionEffect =
  | 'cls'
  | 'fade_to_black'
  | 'screen5_vertical_pixel_wipe'
  | 'screen5_horizontal_pixel_wipe'
  | 'screen5_diagonal_pixel_wipe'
  | 'screen5_mirror_pixel_wipe';

/** Single source of truth for "can a SCREEN 5 backend execute this effect?". */
export const SCREEN5_TRANSITION_EFFECTS: ReadonlySet<string> = new Set<string>([
  'cls',
  'fade_to_black',
  'screen5_vertical_pixel_wipe',
  'screen5_horizontal_pixel_wipe',
  'screen5_diagonal_pixel_wipe',
  'screen5_mirror_pixel_wipe',
]);

export function isScreen5TransitionEffect(effect: unknown): effect is Screen5TransitionEffect {
  return typeof effect === 'string' && SCREEN5_TRANSITION_EFFECTS.has(effect);
}
